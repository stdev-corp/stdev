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
        li: (props) => <li className="list-disc ml-4" {...props} />,
        ul: (props) => <ul className="list-disc ml-4" {...props} />,
        table: (props) => <table className="table-auto my-4" {...props} />,
        thead: (props) => <thead className="bg-gray-200" {...props} />,
        th: (props) => <th className="border px-4 py-2" {...props} />,
        tr: (props) => <tr className="bg-gray-100" {...props} />,
        td: (props) => <td className="border px-4 py-2" {...props} />,
      }}
    >
      {data?.content}
    </Markdown>
  )
}
