import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatProps {
  darkMode: boolean
  onMessageSent?: () => void
  onSearchResults?: (results: any) => void
  onWatcherClick?: () => void
  onToolsCompleted?: () => void
  onToggleAgents?: () => void
}

export function Chat({ darkMode, onMessageSent, onSearchResults, onWatcherClick, onToolsCompleted, onToggleAgents }: ChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{type: string, content: string, tools?: {name: string, result: any, args?: any}[]}[]>([])
  const [loading, setLoading] = useState(false)
  const latestToolsRef = useRef<{name: string, result: any}[] | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Add global function for tool buttons
  if (typeof window !== 'undefined') {
    (window as any).openTool = (toolName: string, result: any) => {
      if (onSearchResults) {
        onSearchResults(result)
      }
    }
  }

  // Use useEffect to pass tools when they're updated
  useEffect(() => {
    if (latestToolsRef.current && onSearchResults) {
      onSearchResults(latestToolsRef.current);
      latestToolsRef.current = null; // Clear after use
    }
  }, [messages, onSearchResults]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleWatcherClick = () => {
    // Get the latest AI response with tools
    const aiResponses = messages.filter(m => m.type === 'ai-response');
    const latestResponse = aiResponses[aiResponses.length - 1];
    if (latestResponse?.tools && onSearchResults) {
      onSearchResults(latestResponse.tools);
    }
    if (onWatcherClick) {
      onWatcherClick();
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, {type: 'user', content: userMessage}]);
    setInput('');
    setLoading(true);
    
    // Reset textarea height after clearing input
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    onMessageSent?.();

    try {
      // const eventSource = new EventSource(`https://ljiu86srov94.share.zrok.io/api/chat?prompt=${encodeURIComponent(userMessage)}`);
      const eventSource = new EventSource(`http://localhost:8000/api/chat?prompt=${encodeURIComponent(userMessage)}`);
      console.log('EventSource created. Waiting for connection...');

      let finalResult = '';
      let currentAIMessage = '';

      eventSource.onopen = () => {
        console.log('%cEventSource connected!', 'color: green; font-weight: bold;');
      };

      eventSource.addEventListener('run', (event) => {
        const data = JSON.parse(event.data);
        console.log('%cReceived RUN event:', 'color: purple;', data);
        
        if (data.event === 'RunCompleted' && data.payload?.content) {
          setLoading(false);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg?.type === 'ai-response') {
              lastMsg.content = data.payload.content;
            } else {
              newMessages.push({type: 'ai-response', content: data.payload.content});
            }
            return newMessages;
          });
          finalResult = data.payload.content;
          
          if (onToolsCompleted) {
            onToolsCompleted();
          }
        }
      });

      eventSource.addEventListener('tool', (event) => {
        const data = JSON.parse(event.data);
        console.log('%cReceived TOOL event:', 'color: blue;', data);
        
        if (data.event === 'ToolCallStarted') {
          onMessageSent?.();
        }
        
        if (data.event === 'ToolCallCompleted') {
          const toolName = data.payload?.tool?.tool_name;
          const toolResult = data.payload?.tool?.result;
          
          setMessages(prev => {
            const newMessages = JSON.parse(JSON.stringify(prev));
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg?.type === 'ai-response') {
              lastMsg.tools = [...(lastMsg.tools || []), {name: toolName, result: data.payload.tool.result, args: data.payload.tool.tool_args}];
              latestToolsRef.current = lastMsg.tools;
            } else {
              const newTools = [{name: toolName, result: data.payload.tool.result, args: data.payload.tool.tool_args}];
              newMessages.push({type: 'ai-response', content: '', tools: newTools});
              latestToolsRef.current = newTools;
            }
            return newMessages;
          });
        }
      });

      eventSource.addEventListener('end', (event) => {
        console.log('%cReceived END event. Final message:', 'color: red;', finalResult);
        setLoading(false);
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setMessages(prev => [...prev, {type: 'error', content: 'Unable to connect with the server...'}]);
        setLoading(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      setMessages(prev => [...prev, {type: 'error', content: 'Could not initiate connection.'}]);
      setLoading(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => {
            const isUser = msg.type === 'user'
            const isAIResponse = msg.type === 'ai-response'
            const isError = msg.type === 'error'
            
            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] p-4 rounded-2xl break-words overflow-wrap-anywhere ${
                    isUser
                      ? 'text-white'
                      : isError
                        ? darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        : darkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-900'
                  }`}
                  style={isUser ? { backgroundColor: 'var(--primary)' } : {}}
                >
                  {isAIResponse && (
                    <div className="space-y-3">
                      {msg.tools && msg.tools.length > 0 && (
                        <div className="border-b border-gray-300 pb-2">
                          <div className="text-sm font-medium mb-2">Tools Used:</div>
                          <div className="space-y-1">
                            {msg.tools.map((tool, idx) => (
                              <span 
                                key={idx} 
                                onClick={() => {
                                  // Open right panel if closed
                                  if (onToggleAgents) {
                                    onToggleAgents();
                                  }
                                  if (onSearchResults) {
                                    onSearchResults(msg.tools);
                                  }
                                  if (onWatcherClick) {
                                    onWatcherClick();
                                  }
                                  // Set expanded tool in watcher
                                  setTimeout(() => {
                                    if (typeof window !== 'undefined') {
                                      (window as any).expandWatcherTool = `${tool.name}-${idx}`;
                                    }
                                  }, 100);
                                }}
                                className={`block text-sm px-2 py-1 rounded cursor-pointer hover:opacity-80 hover:scale-103 transition-all duration-200 ease-out ${
                                  darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                                }`}>
                                {tool.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.content && (
                        <div className={`prose prose-sm max-w-none ${
                          darkMode ? 'prose-invert' : ''
                        }`} style={{
                          '--tw-prose-bullets': darkMode ? '#d1d5db' : '#374151',
                          '--tw-prose-counters': darkMode ? '#d1d5db' : '#374151'
                        } as React.CSSProperties}>
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="ml-2">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                  {!isAIResponse && (
                    <div className={`prose prose-sm max-w-none ${
                      darkMode ? 'prose-invert' : ''
                    }`} style={{
                      '--tw-prose-bullets': darkMode ? '#d1d5db' : '#374151',
                      '--tw-prose-counters': darkMode ? '#d1d5db' : '#374151'
                    } as React.CSSProperties}>
                      <ReactMarkdown
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({children}) => <li className="ml-2">{children}</li>,
                          strong: ({children}) => <strong className="font-semibold">{children}</strong>
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {loading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                <span className="inline-flex">
                  {'Working...'.split('').map((char, i) => (
                    <span
                      key={i}
                      className="animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={`p-6 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <textarea
              className={`w-full px-4 py-4 pr-14 rounded-2xl border focus:outline-none focus:ring-2 resize-none min-h-[56px] overflow-hidden ${darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              style={{ '--tw-ring-color': 'var(--primary)' } as React.CSSProperties}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize textarea
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  const newHeight = Math.min(textareaRef.current.scrollHeight, 284);
                  textareaRef.current.style.height = `${newHeight}px`;
                  // Scroll to bottom if content exceeds max height
                  if (textareaRef.current.scrollHeight > 284) {
                    textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Message..."
              rows={1}
              ref={textareaRef}
            />
            <button
              className="absolute right-3 bottom-4.5 p-2 text-white rounded-lg disabled:opacity-50 transition-all duration-200 ease-out hover:opacity-90 hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send size={20} />
            </button>
          </div>

          <p className={`text-center text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            AI agents can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  )
}