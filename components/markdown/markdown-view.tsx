import { getMarkdownByTitle } from '@/utils/payload'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = {
  title: string
}

export default async function MarkdownView(props: Props) {
  const data = await getMarkdownByTitle(props.title)

  return (
    <Markdown
      remarkPlugins={[[remarkGfm]]}
      components={{
        h1: (props) => <h1 {...props} />,
        h2: (props) => <h2 {...props} />,
        h3: (props) => <h3 {...props} />,
        h4: (props) => <h4 {...props} />,
        h5: (props) => <h5 {...props} />,
        a: (props) => <a target="_blank" {...props} />,
        li: (props) => (
          <li style={{ listStyleType: 'disc', marginLeft: '1rem' }} {...props} />
        ),
        ul: (props) => (
          <ul style={{ listStyleType: 'disc', marginLeft: '1rem' }} {...props} />
        ),
        table: (props) => (
          <table
            style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}
            {...props}
          />
        ),
        thead: (props) => (
          <thead style={{ backgroundColor: '#e5e7eb' }} {...props} />
        ),
        th: (props) => (
          <th
            style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}
            {...props}
          />
        ),
        tr: (props) => (
          <tr style={{ backgroundColor: '#f5f5f5' }} {...props} />
        ),
        td: (props) => (
          <td
            style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}
            {...props}
          />
        ),
      }}
    >
      {data?.content}
    </Markdown>
  )
}
