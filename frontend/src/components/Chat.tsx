import { useState, useEffect, useRef } from 'react'
import { Send, ChevronDown, ChevronUp, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ChatProps {
  darkMode: boolean
  onMessageSent?: () => void
  onSearchResults?: (results: any) => void
  onWatcherClick?: () => void
  onToolsCompleted?: () => void
  onToggleAgents?: () => void
}

interface ToolDetails {
  name: string
  agent: string
  toolCallId?: string
  input?: any
  result?: any
  duration?: number
  status?: 'started' | 'completed'
  error?: boolean
  createdAt?: number
}

interface AgentRun {
  name: string
  tools: string[]
  content: string
  completed: boolean
  currentRunId?: string
  toolDetails?: ToolDetails[]
}

interface TeamRun {
  content: string
  completed: boolean
}

export function Chat({ darkMode, onMessageSent, onSearchResults, onWatcherClick, onToolsCompleted, onToggleAgents }: ChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<{type: string, content: string, agentRuns?: AgentRun[], teamRun?: TeamRun}[]>([])
  const [loading, setLoading] = useState(false)
  const [currentRuns, setCurrentRuns] = useState<AgentRun[]>([])
  const [currentRunIndex, setCurrentRunIndex] = useState(-1)
  const [teamRun, setTeamRun] = useState<TeamRun>({ content: '', completed: false })
  const [teamRunActive, setTeamRunActive] = useState(false)
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({})
  const [selectedTool, setSelectedTool] = useState<ToolDetails | null>(null)
  const [toolEventData, setToolEventData] = useState<{[key: string]: any}>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedTool) {
        setSelectedTool(null)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [selectedTool])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    // Auto-expand agent cards when they first get content or tools
    currentRuns.forEach((run, index) => {
      if ((run.tools.length > 0 || run.content) && !expandedCards[`live-${index}`]) {
        setExpandedCards(prev => ({ ...prev, [`live-${index}`]: true }));
      }
    });
  }, [currentRuns]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(prev => [...prev, {type: 'user', content: userMessage}, {type: 'ai-processing', content: ''}]);
    setInput('');
    setLoading(true);
    
    // Reset state for new conversation
    setCurrentRuns([]);
    setCurrentRunIndex(-1);
    setTeamRun({ content: '', completed: false });
    setTeamRunActive(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = '56px';
    }

    onMessageSent?.();

    try {
      const eventSource = new EventSource(`http://localhost:8000/api/chat?prompt=${encodeURIComponent(userMessage)}`);
      
      let finalResult = '';

      eventSource.addEventListener('run', (event) => {
        const data = JSON.parse(event.data);
        console.log('🏃 RUN EVENT:', JSON.stringify(data, null, 2));
        
        if (data.event === 'TeamRunStarted') {
          setTeamRunActive(true);
          setTeamRun({ content: '', completed: false });
          // Initialize agent cards but don't show them until they have content
          setCurrentRuns([
            { name: 'Finance Agent', tools: [], content: '', completed: false },
            { name: 'Sentiment Agent', tools: [], content: '', completed: false }
          ]);
        }
        
        // Handle individual agent run events
        if (data.event === 'RunStarted' && data.payload?.agent_name && data.meta?.runId) {
          const agentName = data.payload?.agent_name;
          const runId = data.meta.runId;
          
          // Map agent_name to display name
          let targetAgent = '';
          if (agentName === 'Finance_Agent') {
            targetAgent = 'Finance Agent';
          } else if (agentName === 'Sentiment_Agent') {
            targetAgent = 'Sentiment Agent';
          }
          
          if (targetAgent) {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === targetAgent 
                  ? { ...run, completed: false, currentRunId: runId }
                  : run
              )
            );
          }
        }
        
        if (data.event === 'RunCompleted' && data.payload?.agent_name) {
          const agentName = data.payload?.agent_name;
          
          // Map agent_name to display name
          let targetAgent = '';
          if (agentName === 'Finance_Agent') {
            targetAgent = 'Finance Agent';
          } else if (agentName === 'Sentiment_Agent') {
            targetAgent = 'Sentiment Agent';
          }
          
          if (targetAgent) {
            // Extract tools from the completed run's messages if available
            let extractedTools: string[] = [];
            if (data.payload?.messages) {
              data.payload.messages.forEach((msg: any) => {
                if (msg.tool_calls) {
                  msg.tool_calls.forEach((toolCall: any) => {
                    if (toolCall.function?.name && toolCall.function.name !== 'delegate_task_to_member' && toolCall.function.name !== 'update_user_memory') {
                      extractedTools.push(toolCall.function.name);
                    }
                  });
                }
              });
            }
            
            setCurrentRuns(prev => 
              prev.map(run => {
                if (run.name === targetAgent) {
                  const newTools = extractedTools.length > 0 ? [...new Set([...run.tools, ...extractedTools])] : run.tools;
                  return { ...run, completed: true, tools: newTools };
                }
                return run;
              })
            );
          }
        }
        
        if (data.event === 'TeamRunCompleted') {
          setTeamRunActive(false);
          setLoading(false);
          
          // Extract agent runs from member_responses - only show first 2 agents
          const agentRuns: AgentRun[] = [];
          if (data.payload?.member_responses) {
            data.payload.member_responses.slice(0, 2).forEach((response: any, index: number) => {
              const agentNames = ['Finance Agent', 'Sentiment Agent'];
              
              // Extract tools from messages if available
              let tools: string[] = [];
              if (response.messages) {
                response.messages.forEach((msg: any) => {
                  if (msg.tool_calls) {
                    msg.tool_calls.forEach((toolCall: any) => {
                      if (toolCall.function?.name && toolCall.function.name !== 'delegate_task_to_member' && toolCall.function.name !== 'update_user_memory') {
                        tools.push(toolCall.function.name);
                      }
                    });
                  }
                });
              }
              
              // Fallback to response.tools if messages don't have tool_calls
              if (tools.length === 0 && response.tools) {
                tools = response.tools.map((tool: any) => tool.tool_name).filter((tool: string) => tool !== 'delegate_task_to_member' && tool !== 'update_user_memory');
              }
              
              agentRuns.push({
                name: agentNames[index] || `Agent ${index + 1}`,
                tools: tools,
                content: response.content || '',
                completed: true
              });
            });
          }
          
          const finalTeamRun = { 
            content: data.payload?.content || '', 
            completed: true 
          };
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.type === 'ai-processing') {
              return [...prev.slice(0, -1), {
                ...lastMsg,
                type: 'ai-response',
                agentRuns: agentRuns,
                teamRun: finalTeamRun
              }];
            }
            return [...prev, {type: 'ai-response', content: '', agentRuns: agentRuns, teamRun: finalTeamRun}];
          });
          
          // Auto-collapse live agent cards when final response is ready
          setExpandedCards(prev => {
            const newState = { ...prev };
            delete newState['live-0'];
            delete newState['live-1'];
            return newState;
          });
          
          setCurrentRuns([]);
          setCurrentRunIndex(-1);
          setTeamRun({ content: '', completed: false });
          
          if (onToolsCompleted) {
            onToolsCompleted();
          }
        }
      });
      
      const handleToolEvent = (data: any) => {
        // Store detailed tool event data
        if (data.payload?.tool?.tool_name) {
          const toolName = data.payload.tool.tool_name;
          const agentName = data.payload.agent_name;
          const toolCallId = data.payload.tool.tool_call_id;
          const toolKey = `${toolName}-${agentName}-${toolCallId}`;
          
          setToolEventData(prev => ({
            ...prev,
            [toolKey]: {
              ...prev[toolKey],
              name: toolName,
              agent: agentName,
              toolCallId: toolCallId,
              input: data.payload.tool.tool_args,
              result: data.payload.tool.result,
              duration: data.payload.tool.metrics?.duration,
              status: data.event?.includes('Started') ? 'started' : 'completed',
              error: data.payload.tool.tool_call_error,
              createdAt: data.payload.created_at || data.payload.tool.created_at
            }
          }));
        }
        
        // Handle individual agent tool events
        if (data.payload?.agent_name && data.payload?.tool?.tool_name) {
          const agentName = data.payload.agent_name;
          const toolName = data.payload.tool.tool_name;
          
          // Map agent_name to display name
          let targetAgent = '';
          if (agentName === 'Finance_Agent') {
            targetAgent = 'Finance Agent';
          } else if (agentName === 'Sentiment_Agent') {
            targetAgent = 'Sentiment Agent';
          }
          
          if (targetAgent && toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === targetAgent 
                  ? { ...run, tools: [...new Set([...run.tools, toolName])] }
                  : run
              )
            );
          }
        }
      };
      
      eventSource.addEventListener('tool', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 TOOL EVENT:', JSON.stringify(data, null, 2));
        handleToolEvent(data);
        
        // Handle any tool event that might contain agent tool info
        if (data.event && data.event.includes('Tool') && data.payload) {
          const agentName = data.payload.agent_name;
          const toolName = data.payload.tool_name;
          
          if (agentName && toolName) {
            // Map agent_name to display name
            let targetAgent = '';
            if (agentName === 'Finance_Agent') {
              targetAgent = 'Finance Agent';
            } else if (agentName === 'Sentiment_Agent') {
              targetAgent = 'Sentiment Agent';
            }
            
            if (targetAgent && toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
              setCurrentRuns(prev => 
                prev.map(run => 
                  run.name === targetAgent 
                    ? { ...run, tools: [...new Set([...run.tools, toolName])] }
                    : run
                )
              );
            }
          }
        }
        
        // Also handle tool events that might have different structure
        if (data.event === 'ToolCallStarted' && data.payload?.tool_name) {
          const toolName = data.payload.tool_name;
          const agentName = data.payload?.agent_name;
          
          if (agentName) {
            // Map agent_name to display name
            let targetAgent = '';
            if (agentName === 'Finance_Agent') {
              targetAgent = 'Finance Agent';
            } else if (agentName === 'Sentiment_Agent') {
              targetAgent = 'Sentiment Agent';
            }
            
            if (targetAgent && toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
              setCurrentRuns(prev => 
                prev.map(run => 
                  run.name === targetAgent 
                    ? { ...run, tools: [...new Set([...run.tools, toolName])] }
                    : run
                )
              );
            }
          }
        }
        
        if (data.event === 'TeamToolCallStarted') {
          const toolName = data.payload?.tool?.tool_name;
          const memberId = data.payload?.tool?.tool_args?.member_id;
          
          if (toolName === 'delegate_task_to_member' && memberId) {
            const taskDescription = data.payload?.tool?.tool_args?.task_description || '';
            
            // Map member_id to agent - using the new backend member_ids
            let targetAgent = '';
            if (memberId === 'agent-1') {
              targetAgent = 'Finance Agent';
            } else if (memberId === 'agent-2') {
              targetAgent = 'Sentiment Agent';
            }
            
            if (targetAgent) {
              setCurrentRuns(prev => 
                prev.map(run => 
                  run.name === targetAgent 
                    ? { ...run, content: `Working on: ${taskDescription}` }
                    : run
                )
              );
            }
          }
          
          // Show team-level tool usage
          if (toolName && teamRunActive) {
            setTeamRun(prev => ({
              ...prev,
              content: prev.content + `[Using ${toolName}] `
            }));
          }
        }
        
        if (data.event === 'TeamToolCallCompleted') {
          const toolName = data.payload?.tool?.tool_name;
          const result = data.payload?.tool?.result;
          const memberId = data.payload?.tool?.tool_args?.member_id;
          
          if (toolName === 'delegate_task_to_member' && result && memberId) {
            // Map member_id to agent - using the new backend member_ids
            let targetAgent = '';
            if (memberId === 'agent-1') {
              targetAgent = 'Finance Agent';
            } else if (memberId === 'agent-2') {
              targetAgent = 'Sentiment Agent';
            }
            
            if (targetAgent) {
              setCurrentRuns(prev => 
                prev.map(run => 
                  run.name === targetAgent 
                    ? { ...run, content: result, completed: true }
                    : run
                )
              );
            }
          }
        }
      });
      
      eventSource.addEventListener('tool-finance', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 FINANCE TOOL EVENT:', JSON.stringify(data, null, 2));
        handleToolEvent(data);
      });
      
      eventSource.addEventListener('tool-sentiment', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 SENTIMENT TOOL EVENT:', JSON.stringify(data, null, 2));
        handleToolEvent(data);
      });
      
      eventSource.addEventListener('content', (event) => {
        const data = JSON.parse(event.data);
        console.log('📝 CONTENT EVENT:', JSON.stringify(data, null, 2));
        
        if (data.event === 'TeamRunContent') {
          if (data.payload?.content) {
            setTeamRunActive(true);
            setTeamRun(prev => ({
              ...prev,
              content: prev.content + data.payload.content
            }));
          }
        }
        
        // Handle individual agent content events
        if (data.event === 'RunContent' && data.payload?.agent_name) {
          const content = data.payload?.content;
          const agentName = data.payload?.agent_name;
          
          if (content && agentName) {
            // Map agent_name to display name
            let targetAgent = '';
            if (agentName === 'Finance_Agent') {
              targetAgent = 'Finance Agent';
            } else if (agentName === 'Sentiment_Agent') {
              targetAgent = 'Sentiment Agent';
            }
            
            if (targetAgent) {
              setCurrentRuns(prev => 
                prev.map(run => {
                  if (run.name === targetAgent && run.currentRunId === data.meta?.runId) {
                    return { ...run, content: run.content + content };
                  }
                  return run;
                })
              );
            }
          }
        }
      });
      
      eventSource.addEventListener('log', (event) => {
        const data = JSON.parse(event.data);
        console.log('📋 LOG EVENT:', JSON.stringify(data, null, 2));
        
        // Check all possible tool event types
        if (data.event && data.event.includes('Tool')) {
          console.log('🔧 INDIVIDUAL TOOL EVENT FOUND:', data.event, data.payload);
        }
        
        // Handle individual agent tool events
        if (data.event === 'ToolCallStarted' && data.payload?.agent_name && data.payload?.tool_name) {
          const agentName = data.payload.agent_name;
          const toolName = data.payload.tool_name;
          
          // Map agent_name to display name
          let targetAgent = '';
          if (agentName === 'Finance_Agent') {
            targetAgent = 'Finance Agent';
          } else if (agentName === 'Sentiment_Agent') {
            targetAgent = 'Sentiment Agent';
          }
          
          if (targetAgent && toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === targetAgent 
                  ? { ...run, tools: [...new Set([...run.tools, toolName])] }
                  : run
              )
            );
          }
        }
        
        // Also check for tool events in other event types
        if (data.payload?.tool_name && data.payload?.agent_name) {
          const agentName = data.payload.agent_name;
          const toolName = data.payload.tool_name;
          
          // Map agent_name to display name
          let targetAgent = '';
          if (agentName === 'Finance_Agent') {
            targetAgent = 'Finance Agent';
          } else if (agentName === 'Sentiment_Agent') {
            targetAgent = 'Sentiment Agent';
          }
          
          if (targetAgent && toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === targetAgent 
                  ? { ...run, tools: [...new Set([...run.tools, toolName])] }
                  : run
              )
            );
          }
        }
      });

      eventSource.addEventListener('end', (event) => {
        setLoading(false);
        
        // Complete the conversation when end event is received
        const finalAgentRuns = [...currentRuns];
        const finalTeamRun = { 
          content: 'Response completed', 
          completed: true 
        };
        
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'ai-processing') {
            return [...prev.slice(0, -1), {
              ...lastMsg,
              type: 'ai-response',
              agentRuns: finalAgentRuns,
              teamRun: finalTeamRun
            }];
          }
          return prev;
        });
        
        setCurrentRuns([]);
        setCurrentRunIndex(-1);
        setTeamRun({ content: '', completed: false });
        
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
            const isError = msg.type === 'error'
            const isProcessing = msg.type === 'ai-processing'
            const isAiResponse = msg.type === 'ai-response'
            
            if (isProcessing && i === messages.length - 1) {
              return (
                <div key={i} className="flex justify-start">
                  <div className="w-full max-w-[90%] space-y-3">

                    {currentRuns.filter(run => run.tools.length > 0 || run.content).map((run, runIndex) => {
                      const originalIndex = currentRuns.findIndex(r => r.name === run.name);
                      return (
                        <div key={originalIndex} className={`border rounded-lg transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                          <div 
                            className={`p-3 cursor-pointer flex items-center justify-between ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                            onClick={() => setExpandedCards(prev => ({...prev, [`live-${originalIndex}`]: !prev[`live-${originalIndex}`]}))}
                          >
                            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{run.name}</span>
                            {expandedCards[`live-${originalIndex}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                          {expandedCards[`live-${originalIndex}`] && (
                            <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} space-y-3`}>
                              {run.tools.length > 0 && (
                                <div className="transition-all duration-200 ease-out">
                                  <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tools Used:</div>
                                  <div className="space-y-1">
                                    {run.tools.map((tool, toolIndex) => (
                                      <div 
                                        key={toolIndex} 
                                        className={`text-sm px-2 py-1 rounded transition-all duration-200 ease-out cursor-pointer hover:scale-100 hover:shadow-md ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                                        onClick={() => {
                                          const toolKey = `${tool}-${run.name === 'Finance Agent' ? 'Finance_Agent' : 'Sentiment_Agent'}`;
                                          const toolData = toolEventData[toolKey] || {};
                                          setSelectedTool({
                                            name: tool,
                                            agent: run.name,
                                            ...toolData
                                          });
                                        }}
                                      >
                                        {tool}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {run.content && (
                                <div className="transition-all duration-200 ease-out">
                                  <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agent Reasoning:</div>
                                  <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <ReactMarkdown
                                      components={{
                                        p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                                        ul: ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                                        li: ({children}) => <li className="ml-2">{children}</li>,
                                        strong: ({children}) => <strong className="font-semibold">{children}</strong>
                                      }}
                                    >
                                      {run.content}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {teamRunActive && teamRun.content && (
                      <div className={`border rounded-lg transition-all duration-300 ease-out animate-in slide-in-from-top-2 fade-in ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                        <div className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Final Response (Conductor)</div>
                        <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-200 text-gray-900'}`}>
                          <div className="transition-all duration-200 ease-out">
                            <ReactMarkdown
                              components={{
                                p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                li: ({children}) => <li className="ml-2">{children}</li>,
                                strong: ({children}) => <strong className="font-semibold">{children}</strong>
                              }}
                            >
                              {teamRun.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
            
            if (isAiResponse && (msg.agentRuns || msg.teamRun)) {
              return (
                <div key={i} className="flex justify-start">
                  <div className="w-full max-w-[90%] space-y-3">
                    {msg.agentRuns?.map((run, runIndex) => (
                      <div key={runIndex} className={`border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                        <div 
                          className={`p-3 cursor-pointer flex items-center justify-between ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
                          onClick={() => setExpandedCards(prev => ({...prev, [`final-${i}-${runIndex}`]: !prev[`final-${i}-${runIndex}`]}))}
                        >
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{run.name}</span>
                          {expandedCards[`final-${i}-${runIndex}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                        {expandedCards[`final-${i}-${runIndex}`] && (
                          <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} space-y-3`}>
                            {run.tools.length > 0 && (
                              <div>
                                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Tools Used:</div>
                                <div className="space-y-1">
                                  {run.tools.map((tool, toolIndex) => (
                                    <div 
                                      key={toolIndex} 
                                      className={`text-sm px-2 py-1 rounded transition-all duration-200 ease-out cursor-pointer hover:scale-101 hover:shadow-md ${darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'}`}
                                      onClick={() => {
                                        const agentName = run.name === 'Finance Agent' ? 'Finance_Agent' : 'Sentiment_Agent';
                                        // Find the most recent tool data for this tool-agent combination
                                        const matchingKeys = Object.keys(toolEventData).filter(key => 
                                          key.startsWith(`${tool}-${agentName}-`)
                                        );
                                        const latestKey = matchingKeys.sort().pop();
                                        const toolData = latestKey ? toolEventData[latestKey] : {};
                                        setSelectedTool({
                                          name: tool,
                                          agent: run.name,
                                          ...toolData
                                        });
                                      }}
                                    >
                                      {tool}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {run.content && (
                              <div>
                                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agent Reasoning:</div>
                                <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  <ReactMarkdown
                                    components={{
                                      p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                                      ul: ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                                      ol: ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                                      li: ({children}) => <li className="ml-2">{children}</li>,
                                      strong: ({children}) => <strong className="font-semibold">{children}</strong>
                                    }}
                                  >
                                    {run.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {msg.teamRun && (
                      <div className={`border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
                        <div className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Final Response (Conductor)</div>
                        <div className={`px-3 pb-3 border-t ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-200 text-gray-900'}`}>
                          <ReactMarkdown
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="ml-2">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>
                            }}
                          >
                            {msg.teamRun.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }
            
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
              </div>
            )
          })}
          {loading && messages.length > 0 && messages[messages.length - 1]?.type !== 'ai-response' && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
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
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  const newHeight = Math.min(textareaRef.current.scrollHeight, 284);
                  textareaRef.current.style.height = `${newHeight}px`;
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
              className="absolute right-3 bottom-3 p-2 text-white rounded-lg disabled:opacity-50 transition-all duration-200 ease-out hover:opacity-90 hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              <Send size={20} />
            </button>
          </div>

          <p className={`text-center text-xs mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            AI agents can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
      
      {/* Tool Details Popup */}
      {selectedTool && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50" onClick={() => setSelectedTool(null)}>
          <div 
            className={`w-[80%] h-[80%] overflow-y-auto rounded-xl shadow-2xl ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} border-2`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tool Details</h3>
              <button 
                onClick={() => setSelectedTool(null)}
                className={`p-2 rounded hover:bg-opacity-80 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={24} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-8 gap-6">
                <div className="col-span-2">
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name:</label>
                  <p className={`mt-2 text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedTool.name}</p>
                </div>
                {selectedTool.duration && (
                  <div className="col-span-1">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Duration:</label>
                    <p className={`mt-2 text-lg font-mono ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{selectedTool.duration.toFixed(4)}s</p>
                  </div>
                )}
                {selectedTool.status && (
                  <div className="col-span-1">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status:</label>
                    <p className={`mt-2 text-lg font-semibold ${selectedTool.status === 'completed' ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-yellow-400' : 'text-yellow-600')}`}>
                      {selectedTool.status === 'completed' ? 'Completed' : 'Started'}
                    </p>
                  </div>
                )}
                {selectedTool.input && (
                  <div className="col-span-4">
                    <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Input:</label>
                    <div className={`mt-2 p-2 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                      {Object.entries(selectedTool.input).map(([key, value]) => (
                        <div key={key} className="mb-1">
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedTool.result && (
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Result:</label>
                  <div className={`mt-2 p-4 rounded-lg max-h-[440px] overflow-y-auto ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                    {(() => {
                      try {
                        const parsed = JSON.parse(selectedTool.result);
                        if (Array.isArray(parsed) && (selectedTool.name.includes('search') || selectedTool.name.includes('news'))) {
                          return (
                            <div className="grid grid-cols-3 gap-4">
                              {parsed.map((item, index) => (
                                <div key={index} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                  {item.title && (
                                    <h4 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h4>
                                  )}
                                  {item.body && (
                                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{item.body}</p>
                                  )}
                                  {item.image && (
                                    <img src={item.image} alt="Search result" className="w-full h-32 object-cover rounded mt-2" />
                                  )}
                                  {(item.url || item.href) && (
                                    <a href={item.url || item.href} target="_blank" rel="noopener noreferrer" className={`text-sm underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                      View Source
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        if (typeof parsed === 'object' && parsed !== null) {
                          return Object.entries(parsed).map(([key, value]) => (
                            <div key={key} className="mb-2">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ));
                        }
                      } catch {}
                      return String(selectedTool.result);
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}