import { getMarkdownByTitle } from '@/utils/server/markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import '@/components/markdown/table.css'

type Props = {
  title: string
}

export default async function MarkdownView(props: Props) {
  const data = await getMarkdownByTitle(props.title)

  return (
    <div className="container mx-auto px-4 py-8">
      <Markdown
        remarkPlugins={[[remarkGfm]]}
        components={{
          h1: (props) => (
            <h1 className="text-4xl font-bold mt-4 mb-2" {...props} />
          ),
          h2: (props) => (
            <h2 className="text-3xl font-bold mt-4 mb-2" {...props} />
          ),
          h3: (props) => (
            <h3 className="text-2xl font-bold mt-4 mb-2" {...props} />
          ),
          h4: (props) => <h4 className="text-xl font-bold" {...props} />,
          h5: (props) => <h5 className="text-lg font-bold" {...props} />,
          a: (props) => <a target="_blank" {...props} />,
        }}
      >
        {data?.content}
      </Markdown>
    </div>
  )
}
