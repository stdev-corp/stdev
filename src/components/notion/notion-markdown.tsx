import Markdown, { type Components } from 'react-markdown'
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import type { NotionPageLinks } from '@/utils/cms-types'
import { isImageIcon } from '@/utils/events'
import {
  rehypeNotionBreaks,
  rehypeNotionTables,
  rehypeNotionToc,
  remarkNotion,
  safeLinkUrl,
  safeUrl,
} from '@/utils/notion-markdown'
import { toPublicAssetUrl } from '@/utils/public-url'
import { responsiveImage } from '@/utils/responsive-image'

type ElementProps = {
  node?: unknown
  children?: ReactNode
  className?: string
} & Record<string, unknown>

function prop(props: ElementProps, name: string) {
  const value = props[name] ?? props[name.toLowerCase()]
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : undefined
}

/** S3 자산은 공개 주소로 바꾸고, 그 밖의 https/내부 주소는 그대로 쓴다. */
function assetUrl(value: string | undefined) {
  const url = safeUrl(value)
  return url ? toPublicAssetUrl(url) : null
}

export function NotionIcon({
  icon,
  className,
}: {
  icon: string | null | undefined
  className?: string
}) {
  if (!icon) {
    return null
  }
  if (isImageIcon(icon)) {
    const src = assetUrl(icon)
    return src ? (
      // 노션 아이콘은 글자 크기에 맞춰 그리는 작은 장식이라 next/image를 쓰지 않는다.
      // eslint-disable-next-line @next/next/no-img-element
      <img className={className} src={src} alt="" aria-hidden="true" />
    ) : null
  }
  return (
    <span className={className} aria-hidden="true">
      {icon}
    </span>
  )
}

function heading(level: 1 | 2 | 3) {
  // 페이지 h1은 노션 페이지 제목이 가지므로 본문 제목은 한 단계씩 내린다.
  const Tag = `h${level + 1}` as 'h2' | 'h3' | 'h4'
  function Heading({
    node: _node,
    className,
    ...props
  }: ComponentPropsWithoutRef<'h1'> & { node?: unknown }) {
    // 각주 제목(sr-only)처럼 문법이 만든 제목은 모양과 단계를 바꾸지 않는다.
    if (className?.includes('sr-only')) {
      const Original = `h${level}` as 'h1' | 'h2' | 'h3'
      return <Original {...props} className={className} />
    }
    return <Tag {...props} className={`notion-h${level}`} />
  }
  Heading.displayName = `NotionHeading${level}`
  return Heading
}

function isInternal(href: string) {
  return href.startsWith('/') || href.startsWith('#')
}

type Props = {
  content: string
  /** ::page 지시어를 실제 주소로 바꾸는 표. 표에 없는 링크는 그리지 않는다. */
  pageLinks?: NotionPageLinks
  /**
   * 표에 없는 ::page 링크를 지우지 않고 '찾을 수 없는 하위 페이지'로 표시한다.
   * 관리자 미리보기에서 경로 오타를 알아보도록 쓴다.
   */
  showMissingPageLinks?: boolean
  /**
   * 모든 링크를 새 창으로 연다. 관리자 미리보기에서 링크를 눌러 편집 중인 내용을
   * 잃지 않도록 쓴다.
   */
  openLinksInNewTab?: boolean
}

/** 새 창으로 여는 링크의 속성. 사이트의 다른 새 창 링크처럼 알림 제목을 단다. */
const NEW_WINDOW = {
  target: '_blank',
  rel: 'noopener noreferrer',
  title: '새 창 열림',
} as const

/**
 * 노션 확장 마크다운(@/utils/notion-markdown 참고)을 노션 블록 모양으로 그린다.
 * 서버 페이지와 관리자 미리보기에서 같이 쓰므로 서버 전용 코드를 두지 않는다.
 */
export default function NotionMarkdown({
  content,
  pageLinks = {},
  openLinksInNewTab = false,
  showMissingPageLinks = false,
}: Props) {
  const sameWindow = (url: string) =>
    !openLinksInNewTab && (isInternal(url) || url.startsWith('mailto:'))
  const components = {
    h1: heading(1),
    h2: heading(2),
    h3: heading(3),
    h4: heading(3),
    h5: heading(3),
    h6: heading(3),
    a: ({
      node: _node,
      href,
      ...props
    }: ComponentPropsWithoutRef<'a'> & { node?: unknown }) => {
      const url = safeLinkUrl(href)
      if (!url) {
        return <span {...props} />
      }
      return sameWindow(url) ? (
        <a href={url} {...props} className="notion-link" />
      ) : (
        <a
          href={url}
          {...props}
          className="notion-link"
          {...NEW_WINDOW}
          // 마크다운 링크 제목이 있으면 새 창 알림을 덧붙인다.
          title={props.title ? `${props.title} - 새 창 열림` : NEW_WINDOW.title}
        />
      )
    },
    img: ({
      node: _node,
      src,
      alt,
      ...rest
    }: ComponentPropsWithoutRef<'img'> & {
      node?: unknown
      'data-cover-position'?: number | string
    }) => {
      const url = safeUrl(typeof src === 'string' ? src : undefined)
      if (!url) {
        return null
      }
      // 갤러리 카드 표지: 노션에서 정한 세로 위치로 자른다. 값은 remarkNotion이
      // "cover:N%" 제목에서 0~100 정수로만 만든다.
      const position = rest['data-cover-position']
      const style =
        position === undefined
          ? undefined
          : { objectPosition: `center ${Number(position)}%` }
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...responsiveImage(url)}
          alt={alt ?? ''}
          loading="lazy"
          style={style}
        />
      )
    },
    blockquote: ({ node: _node, ...props }: ElementProps) => (
      <blockquote {...props} className="notion-quote" />
    ),
    // KRDS는 <hr>을 화면에서 감추므로(.sr-only와 같은 규칙) 구분선을 div로 그린다.
    hr: () => <div className="notion-divider" role="separator" />,
    table: ({ node: _node, ...props }: ElementProps) => (
      <div className="notion-table-scroll">
        <table {...props} />
      </div>
    ),
    pre: ({ node: _node, ...props }: ElementProps) => (
      <pre {...props} className="notion-code" />
    ),
    'notion-callout': ({ node: _node, children, ...props }: ElementProps) => (
      <div className={props.className as string}>
        <NotionIcon
          icon={prop(props, 'icon')}
          className="notion-callout-icon"
        />
        <div className="notion-callout-text">{children}</div>
      </div>
    ),
    'notion-toggle': ({ node: _node, children }: ElementProps) => (
      <details className="notion-toggle">{children}</details>
    ),
    'notion-toggle-summary': ({
      node: _node,
      children,
      ...props
    }: ElementProps) => {
      const level = prop(props, 'heading')
      return (
        <summary
          className={
            level
              ? `notion-toggle-summary notion-h${level}`
              : 'notion-toggle-summary'
          }
        >
          {children}
        </summary>
      )
    },
    'notion-page-link': ({ node: _node, ...props }: ElementProps) => {
      const key = prop(props, 'linkKey') ?? ''
      const link = pageLinks[key]
      if (!link) {
        if (!showMissingPageLinks) {
          return null
        }
        // 키는 'event:path'(같은 행사면 event가 빈칸)
        const target = key.split(':').filter(Boolean).join('/')
        return (
          <p className="notion-page-link notion-page-link-missing">
            <span className="notion-page-link-title">
              찾을 수 없는 하위 페이지: {target}
            </span>
          </p>
        )
      }
      return (
        <p className="notion-page-link">
          <a href={link.href} {...(openLinksInNewTab ? NEW_WINDOW : {})}>
            <NotionIcon
              icon={link.icon ?? '📄'}
              className="notion-page-link-icon"
            />
            <span className="notion-page-link-title">{link.title}</span>
          </a>
        </p>
      )
    },
    'notion-image': ({ node: _node, ...props }: ElementProps) => {
      const url = safeUrl(prop(props, 'src'))
      if (!url) {
        return null
      }
      const width = prop(props, 'width')
      const caption = prop(props, 'caption')
      return (
        <figure className="notion-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            {...responsiveImage(url, width ? Number(width) : undefined)}
            alt={prop(props, 'alt') ?? ''}
            loading="lazy"
            style={width ? { width: `${width}px` } : undefined}
          />
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )
    },
    'notion-bookmark': ({ node: _node, ...props }: ElementProps) => {
      const url = prop(props, 'url')!
      const image = assetUrl(prop(props, 'image'))
      const icon = assetUrl(prop(props, 'icon'))
      const description = prop(props, 'description')
      return (
        <a
          className="notion-bookmark"
          href={url}
          {...(sameWindow(url) ? {} : NEW_WINDOW)}
        >
          <span className="notion-bookmark-text">
            <span className="notion-bookmark-title">
              {prop(props, 'title')}
            </span>
            {description && (
              <span className="notion-bookmark-description">{description}</span>
            )}
            <span className="notion-bookmark-url">
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={icon} alt="" aria-hidden="true" />
              )}
              {url}
            </span>
          </span>
          {image && (
            <span className="notion-bookmark-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" loading="lazy" />
            </span>
          )}
        </a>
      )
    },
    'notion-video': ({ node: _node, ...props }: ElementProps) => {
      const src = assetUrl(prop(props, 'src'))
      return src ? (
        <video
          className="notion-video"
          src={src}
          controls
          preload="metadata"
          style={
            prop(props, 'width')
              ? { width: `${prop(props, 'width')}px` }
              : undefined
          }
        />
      ) : null
    },
    'notion-embed': ({ node: _node, ...props }: ElementProps) => (
      <iframe
        className="notion-embed"
        src={prop(props, 'src')}
        title={prop(props, 'title')}
        height={prop(props, 'height')}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    ),
  } as unknown as Components

  return (
    <div className="notion-content">
      <Markdown
        remarkPlugins={[remarkGfm, remarkDirective, remarkNotion]}
        remarkRehypeOptions={{
          footnoteLabel: '각주',
          footnoteBackLabel: '본문으로 돌아가기',
        }}
        rehypePlugins={[
          rehypeNotionBreaks,
          rehypeNotionTables,
          rehypeNotionToc,
        ]}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  )
}
