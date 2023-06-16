import ReactMarkdown, { type Options } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight as dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

export default (props: Options) => {
  return (
    <ReactMarkdown
      {...props}
      skipHtml={false}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className ?? '')

          return !inline && match ? (
            <SyntaxHighlighter
              {...props}
              children={String(children).replace(/\n$/, '')}
              style={dark}
              language={match[1]}
              PreTag="div"
              customStyle={{ borderRadius: 5, padding: '5px 10px', fontSize: 12 }}

              // showLineNumbers={true}
              // showInlineLineNumbers={false}
              // wrapLongLines={true}
            />
          ) : (
            <code {...props} className={className}>
              {children}
            </code>
          )
        },
        a: (props) => {
          const { href, children } = props

          let title: string | undefined = props.title
          if (!title && typeof children?.[0] === 'string') {
            title = children[0]
          }

          return (
            <a href={href} target="_blank" rel="noopener noreferrer nofollow" title={title}>
              {children}
            </a>
          )
        }
      }}
    />
  )
}
