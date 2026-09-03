import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ComponentPropsWithoutRef } from 'react'

type HeadingProps = ComponentPropsWithoutRef<'h1'> & { node?: unknown }

/**
 * 페이지의 h1은 PageTitle이 가지고 있으므로 CMS 마크다운의 제목은 한 단계씩
 * 내려서 문서 개요가 깨지지 않게 한다. (# → h2, ##### → h6)
 */
function demote(level: 2 | 3 | 4 | 5 | 6) {
  const Tag = `h${level}` as const
  function Heading({ node: _node, ...props }: HeadingProps) {
    return <Tag {...props} />
  }
  Heading.displayName = `MarkdownHeading${level}`
  return Heading
}

type Props = {
  content: string
}

export default async function MarkdownView(props: Props) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[[remarkGfm]]}
        components={{
          h1: demote(2),
          h2: demote(3),
          h3: demote(4),
          h4: demote(5),
          h5: demote(6),
          h6: demote(6),
          a: ({ node: _node, ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
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
