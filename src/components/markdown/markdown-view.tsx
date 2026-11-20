import Markdown from 'react-markdown'
import { responsiveImage } from '@/utils/responsive-image'
import remarkGfm from 'remark-gfm'
import type { ComponentPropsWithoutRef } from 'react'

type HeadingProps = ComponentPropsWithoutRef<'h1'> & { node?: unknown }

/**
 * 페이지의 h1은 PageTitle이 가지고 있으므로 CMS 마크다운의 제목은 한 단계씩
 * 내려서 문서 개요가 깨지지 않게 한다. (# → h2, ##### → h6)
 */
function demote(level: 2 | 3 | 4 | 5 | 6, className?: string) {
  const Tag = `h${level}` as const
  function Heading({ node: _node, ...props }: HeadingProps) {
    return <Tag {...props} className={className} />
  }
  Heading.displayName = `MarkdownHeading${level}`
  return Heading
}

type Props = {
  content: string
  /**
   * 구역 소개처럼 페이지 본문에 바로 놓이는 글이면 최상위 제목(#)을 KRDS 강조 바
   * 제목(g-tit-line)으로 그린다.
   */
  titleLine?: boolean
}

export default async function MarkdownView(props: Props) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[[remarkGfm]]}
        components={{
          h1: demote(2, props.titleLine ? 'g-tit-line' : undefined),
          h2: demote(3),
          h3: demote(4),
          h4: demote(5),
          h5: demote(6),
          h6: demote(6),
          a: ({ node: _node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
          // S3 자산은 크기별로 최적화한 공개 주소로 그린다(E2E에서는 S3 사이드카).
          img: ({ node: _node, src, alt, ...props }) => (
            // 마크다운 이미지는 크기를 모르는 본문 이미지라 next/image를 쓰지 않는다.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              {...props}
              {...(typeof src === 'string' && /^https:\/\//.test(src)
                ? responsiveImage(src)
                : { src: typeof src === 'string' ? src : undefined })}
              alt={alt ?? ''}
              loading="lazy"
            />
          ),
          table: ({ node: _node, ...props }) => (
            <div className="krds-table-wrap">
              <table {...props} className="tbl col data" />
            </div>
          ),
        }}
      >
        {props.content}
      </Markdown>
    </div>
  )
}
