import { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatProps {
  darkMode: boolean
  onMessageSent?: () => void
  onSearchResults?: (results: any[]) => void
}

export function Chat({ darkMode, onMessageSent, onSearchResults }: ChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return
    
    const userMessage = input
    setMessages(prev => [...prev, `You: ${userMessage}`])
    setInput('')
    setLoading(true)
    
    // Trigger agent status updates
    onMessageSent?.()
    
    try {
      console.log('Connecting to:', `http://localhost:8000/api/chat?prompt=${encodeURIComponent(userMessage)}`)
      const eventSource = new EventSource(`http://localhost:8000/api/chat?prompt=${encodeURIComponent(userMessage)}`)
      let result = ''
      
      eventSource.onopen = () => {
        console.log('EventSource connected')
      }
      
      eventSource.addEventListener('message', (event) => {
        const data = JSON.parse(event.data)
        if (data.type === 'message.delta') {
          result += data.content || ''
        }
      })
      
      eventSource.addEventListener('tool', (event) => {
        const data = JSON.parse(event.data)
        if (data.tool?.result) {
          try {
            const parsedResult = JSON.parse(data.tool.result)
            onSearchResults?.(parsedResult)
          } catch {
            onSearchResults?.(data.tool.result)
          }
        }
      })
      
      eventSource.addEventListener('end', () => {
        console.log('End event, result:', result)
        setMessages(prev => [...prev, `AI: ${result}`])
        setLoading(false)
        eventSource.close()
      })
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        setMessages(prev => [...prev, 'Error: Failed to connect'])
        setLoading(false)
        eventSource.close()
      }
    } catch (error) {
      console.error('Catch error:', error)
      setMessages(prev => [...prev, 'Error: Failed to connect'])
      setLoading(false)
    }
  }

  return (
    <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            const isUser = msg.startsWith('You:')
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-4 rounded-2xl ${
                  isUser 
                    ? 'bg-blue-600 text-white' 
                    : darkMode 
                      ? 'bg-gray-700 text-white' 
                      : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.replace(/^(You:|AI:)\s*/, '')}
                </div>
              </div>
            )
          })}
          {loading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl ${
                darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
              }`}>
                <span className="inline-flex">
                  {'Working...'.split('').map((char, i) => (
                    <span 
                      key={i}
                      className="animate-pulse"
                      style={{animationDelay: `${i * 0.1}s`}}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              className={`w-full px-4 py-4 pr-12 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Message..."
              disabled={loading}
            />
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
            >
              <Send size={20} />
            </button>
          </div>
          
          <p className={`text-center text-xs mt-4 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            AI agents can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}