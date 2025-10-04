import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function MarkdownTest() {
  const [darkMode] = useState(false)
  const [testContent, setTestContent] = useState(`# Test Markdown

## Headers work
### Smaller header

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2
  - Nested bullet
  - Another nested
- Back to main level

1. Numbered list
2. Second item
   1. Nested number
   2. Another nested

Single line break here\nShould this be on new line?

Double line break here

Should this be on new line?

\`inline code\` and:

\`\`\`
code block
multiple lines
\`\`\`

> This is a blockquote
> Multiple lines

---

End of test`)

  return (
    <div className={`min-h-screen p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-4xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Markdown Test Page
        </h1>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Input
            </h2>
            <textarea
              className={`w-full h-96 p-4 border rounded-lg font-mono text-sm ${
                darkMode 
                  ? 'bg-gray-800 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
            />
          </div>
          
          <div>
            <h2 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Output
            </h2>
            <div className={`h-96 p-4 border rounded-lg overflow-y-auto ${
              darkMode 
                ? 'bg-gray-800 border-gray-600' 
                : 'bg-white border-gray-300'
            }`}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({children}) => <h1 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h1>,
                  h2: ({children}) => <h2 className={`text-base font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</h2>,
                  h3: ({children}) => <h3 className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</h3>,
                  p: ({children}) => <p className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>,
                  ul: ({children}) => <ul className={`list-disc list-inside mb-2 ml-4 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>,
                  ol: ({children}) => <ol className={`list-decimal list-inside mb-2 ml-4 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>,
                  li: ({children}) => <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>,
                  strong: ({children}) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</strong>,
                  em: ({children}) => <em className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{children}</em>,
                  code: ({children}) => <code className={`px-1 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>{children}</code>,
                  pre: ({children}) => <pre className={`p-3 rounded-lg overflow-x-auto text-sm font-mono mb-2 ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>{children}</pre>,
                  blockquote: ({children}) => <blockquote className={`border-l-4 pl-4 italic mb-2 ${darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-600'}`}>{children}</blockquote>,
                  table: ({children}) => <table className={`min-w-full mb-4 border-collapse ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{children}</table>,
                  thead: ({children}) => <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>{children}</thead>,
                  tbody: ({children}) => <tbody>{children}</tbody>,
                  tr: ({children}) => <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>{children}</tr>,
                  th: ({children}) => <th className={`px-3 py-2 text-left font-semibold ${darkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-300'} border`}>{children}</th>,
                  td: ({children}) => <td className={`px-3 py-2 ${darkMode ? 'text-gray-200 border-gray-600' : 'text-gray-800 border-gray-300'} border`}>{children}</td>,
                  hr: () => <hr className={`my-3 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`} />,
                  br: () => <br />
                }}
              >
                {testContent.replace(/\\n/g, '  \n').replace(/&lt;br&gt;/g, '  \n')}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}