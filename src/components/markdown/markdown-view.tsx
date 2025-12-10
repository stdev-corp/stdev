import { Heading } from '@chakra-ui/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

type Props = {
  content: string
}

export default async function MarkdownView(props: Props) {
  return (
    <Markdown
      remarkPlugins={[[remarkGfm]]}
      components={{
        h1: (props) => <Heading size="3xl" marginY={4} {...props} />,
        h2: (props) => <Heading size="2xl" marginY={3} {...props} />,
        h3: (props) => <Heading size="xl" marginY={2} {...props} />,
        h4: (props) => <Heading size="lg" marginY={1} {...props} />,
        h5: (props) => <Heading size="md" marginY={1} {...props} />,
        a: (props) => (
          <a target="_blank" rel="noopener noreferrer" {...props} />
        ),
        li: (props) => (
          <li
            style={{ listStyleType: 'disc', marginLeft: '1rem' }}
            {...props}
          />
        ),
        ul: (props) => (
          <ul
            style={{ listStyleType: 'disc', marginLeft: '1rem' }}
            {...props}
          />
        ),
        table: (props) => (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              margin: '1rem 0',
            }}
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
        tr: (props) => <tr style={{ backgroundColor: '#f5f5f5' }} {...props} />,
        td: (props) => (
          <td
            style={{ border: '1px solid #d1d5db', padding: '0.5rem' }}
            {...props}
          />
        ),
      }}
    >
      {props.content}
    </Markdown>
  )
}
