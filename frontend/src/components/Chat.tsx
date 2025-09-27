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
  toolCallIds: string[]
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

  const renderBulletPoints = (data: any, depth: number = 0): JSX.Element[] => {
    const items: JSX.Element[] = [];
    const indent = depth * 10;
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          items.push(
            <li key={index} style={{ marginLeft: `${depth}px` }} className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Item {index + 1}:</span>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {renderBulletPoints(item, depth + 1)}
              </ul>
            </li>
          );
        } else {
          items.push(
            <li key={index} style={{ marginLeft: `${depth}px` }} className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {String(item)}
            </li>
          );
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          items.push(
            <li key={key} style={{ marginLeft: `${depth}px` }} className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{key}:</span>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {renderBulletPoints(value, depth + 1)}
              </ul>
            </li>
          );
        } else if (Array.isArray(value)) {
          items.push(
            <li key={key} style={{ marginLeft: `${depth}px` }} className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{key}:</span>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                {renderBulletPoints(value, depth + 1)}
              </ul>
            </li>
          );
        } else {
          items.push(
            <li key={key} style={{ marginLeft: `${depth}px` }} className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{key}:</span> {String(value)}
            </li>
          );
        }
      });
    }
    
    return items;
  };

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
        // console.log('📊 Event Type:', data.event, '| Agent:', data.payload?.agent_name || 'Team');
        
        if (data.event === 'TeamRunStarted') {
          setTeamRunActive(true);
          setTeamRun({ content: '', completed: false });
          // Initialize agent cards but don't show them until they have content
          setCurrentRuns([
            { name: 'Finance Agent', tools: [], content: '', completed: false, toolCallIds: [] },
            { name: 'Sentiment Agent', tools: [], content: '', completed: false, toolCallIds: [] }
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
              
              // Extract tools and tool call IDs from messages if available
              let tools: string[] = [];
              let toolCallIds: string[] = [];
              if (response.messages) {
                response.messages.forEach((msg: any) => {
                  if (msg.tool_calls) {
                    msg.tool_calls.forEach((toolCall: any) => {
                      if (toolCall.function?.name && toolCall.function.name !== 'delegate_task_to_member' && toolCall.function.name !== 'update_user_memory') {
                        tools.push(toolCall.function.name);
                        toolCallIds.push(toolCall.id);
                      }
                    });
                  }
                });
              }
              
              // Fallback to response.tools if messages don't have tool_calls
              if (tools.length === 0 && response.tools) {
                tools = response.tools.map((tool: any) => tool.tool_name).filter((tool: string) => tool !== 'delegate_task_to_member' && tool !== 'update_user_memory');
                toolCallIds = response.tools.map((tool: any) => tool.tool_call_id || '').filter((id: string) => id !== '');
              }
              
              let displayContent = response.content || '';
              
              // Parse JSON based on agent type
              if (displayContent) {
                try {
                  // Extract all JSON objects from markdown code blocks
                  if (displayContent.includes('```json')) {
                    const jsonMatches = displayContent.match(/```json\s*\n([\s\S]*?)\n```/g);
                    if (jsonMatches && jsonMatches.length > 0) {
                      const parsedObjects = [];
                      for (const match of jsonMatches) {
                        const jsonContent = match.replace(/```json\s*\n/, '').replace(/\n```$/, '').trim();
                        try {
                          const parsed = JSON.parse(jsonContent);
                          // Finance Agent has technical_analysis, Sentiment Agent has sentiment_summary
                          if ((agentNames[index] === 'Finance Agent' && parsed.technical_analysis) || 
                              (agentNames[index] === 'Sentiment Agent' && parsed.sentiment_summary)) {
                            parsedObjects.push(parsed);
                          }
                        } catch {}
                      }
                      if (parsedObjects.length > 0) {
                        displayContent = parsedObjects;
                      }
                    }
                  } else {
                    const jsonData = JSON.parse(displayContent);
                    if ((agentNames[index] === 'Finance Agent' && jsonData.technical_analysis) || 
                        (agentNames[index] === 'Sentiment Agent' && jsonData.sentiment_summary)) {
                      displayContent = jsonData;
                    }
                  }
                } catch {
                  // If parsing fails, use original content
                }
              }
              
              agentRuns.push({
                name: agentNames[index] || `Agent ${index + 1}`,
                tools: tools,
                content: displayContent,
                completed: true,
                toolCallIds: toolCallIds
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
        
        // Handle individual agent tool events - only for tool event data storage
        if (data.payload?.agent_name && data.payload?.tool?.tool_name) {
          // Don't add tools here - let the specific event listeners handle it
        }
      };
      
      eventSource.addEventListener('tool', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 TOOL EVENT:', JSON.stringify(data, null, 2));
        // console.log('🛠️ Tool:', data.payload?.tool?.tool_name || data.payload?.tool_name, '| Status:', data.event);
        handleToolEvent(data);
        

        
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
              let displayContent = result;
              
              // Parse JSON for both agents
              try {
                // Extract all JSON objects from markdown code blocks
                if (result.includes('```json')) {
                  const jsonMatches = result.match(/```json\s*\n([\s\S]*?)\n```/g);
                  if (jsonMatches && jsonMatches.length > 0) {
                    const parsedObjects = [];
                    for (const match of jsonMatches) {
                      const jsonContent = match.replace(/```json\s*\n/, '').replace(/\n```$/, '').trim();
                      try {
                        const parsed = JSON.parse(jsonContent);
                        if (parsed.sentiment_summary || parsed.technical_analysis) {
                          parsedObjects.push(parsed);
                        }
                      } catch {}
                    }
                    if (parsedObjects.length > 0) {
                      displayContent = parsedObjects;
                    }
                  }
                } else {
                  const jsonData = JSON.parse(result);
                  if (jsonData.sentiment_summary || jsonData.technical_analysis) {
                    displayContent = jsonData;
                  }
                }
              } catch {
                // If parsing fails, use original result
              }
              
              setCurrentRuns(prev => 
                prev.map(run => {
                  if (run.name === targetAgent) {
                    let newContent;
                    if (!run.content || run.content.toString().startsWith('Working on:')) {
                      // First content or replacing "Working on" message
                      newContent = displayContent;
                    } else {
                      // Append to existing content
                      if (Array.isArray(run.content)) {
                        newContent = Array.isArray(displayContent) ? [...run.content, ...displayContent] : [...run.content, displayContent];
                      } else if (Array.isArray(displayContent)) {
                        newContent = [run.content, ...displayContent];
                      } else {
                        newContent = [run.content, displayContent];
                      }
                    }
                    return { ...run, content: newContent, completed: true };
                  }
                  return run;
                })
              );
            }
          }
        }
      });
      
      eventSource.addEventListener('tool-finance', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 FINANCE TOOL EVENT:', JSON.stringify(data, null, 2));
        // console.log('💰 Finance Tool:', data.payload?.tool?.tool_name, '| Duration:', data.payload?.tool?.metrics?.duration);
        handleToolEvent(data);
        
        // Track finance agent tools during live execution
        if (data.event === 'ToolCallCompleted' && data.payload?.tool?.tool_name) {
          const toolName = data.payload.tool.tool_name;
          const toolCallId = data.payload.tool.tool_call_id;
          if (toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === 'Finance Agent' 
                  ? { ...run, tools: [...run.tools, toolName], toolCallIds: [...run.toolCallIds, toolCallId] }
                  : run
              )
            );
          }
        }
      });
      
      eventSource.addEventListener('tool-sentiment', (event) => {
        const data = JSON.parse(event.data);
        console.log('🔧 SENTIMENT TOOL EVENT:', JSON.stringify(data, null, 2));
        // console.log('😊 Sentiment Tool:', data.payload?.tool?.tool_name, '| Duration:', data.payload?.tool?.metrics?.duration);
        handleToolEvent(data);
        
        // Track sentiment agent tools during live execution
        if (data.event === 'ToolCallCompleted' && data.payload?.tool?.tool_name) {
          const toolName = data.payload.tool.tool_name;
          const toolCallId = data.payload.tool.tool_call_id;
          if (toolName !== 'delegate_task_to_member' && toolName !== 'update_user_memory') {
            setCurrentRuns(prev => 
              prev.map(run => 
                run.name === 'Sentiment Agent' 
                  ? { ...run, tools: [...run.tools, toolName], toolCallIds: [...run.toolCallIds, toolCallId] }
                  : run
              )
            );
          }
        }
      });
      
      eventSource.addEventListener('content', (event) => {
        const data = JSON.parse(event.data);
        console.log('📝 CONTENT EVENT:', JSON.stringify(data, null, 2));
        // console.log('📄 Content from:', data.payload?.agent_name || 'Team', '| Length:', data.payload?.content?.length);
        
        if (data.event === 'TeamRunContent') {
          // Skip chunked content for team run - we'll get final content from TeamRunCompleted
        }
        
        // Skip chunked content for live agent cards - only use TeamToolCallCompleted content
      });
      
      eventSource.addEventListener('log', (event) => {
        const data = JSON.parse(event.data);
        console.log('📋 LOG EVENT:', JSON.stringify(data, null, 2));
        // console.log('📝 Log Type:', data.event, '| Payload keys:', Object.keys(data.payload || {}));
        
        // Check all possible tool event types
        if (data.event && data.event.includes('Tool')) {
          console.log('🔧 INDIVIDUAL TOOL EVENT FOUND:', data.event, data.payload);
        }
        
        // Don't track tools from log events - let specific event listeners handle it
      });

      eventSource.addEventListener('end', (event) => {
        console.log('🏁 END EVENT: Stream completed');
        setLoading(false);
        eventSource.close();
      });
      
      eventSource.addEventListener('error', (event) => {
        console.log('❌ ERROR EVENT:', event);
        setLoading(false);
        
        let errorMessage = 'An error occurred while processing your request.';
        
        // Try to parse error data if available
        if (event.data) {
          try {
            const errorData = JSON.parse(event.data);
            if (errorData.error) {
              if (errorData.error.includes('429') || errorData.error.includes('quota')) {
                errorMessage = 'API quota exceeded. Please wait a moment and try again.';
              } else {
                errorMessage = `Error: ${errorData.error}`;
              }
            }
          } catch {
            // If parsing fails, use default message
          }
        }
        
        // Convert current processing message to final response with current progress
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'ai-processing') {
            // Convert current runs to agent runs format
            const agentRuns: AgentRun[] = currentRuns.filter(run => run.tools.length > 0 || run.content).map(run => ({
              name: run.name,
              tools: run.tools,
              content: run.content,
              completed: run.completed,
              toolCallIds: run.toolCallIds
            }));
            
            return [
              ...prev.slice(0, -1), 
              {
                ...lastMsg,
                type: 'ai-response',
                agentRuns: agentRuns.length > 0 ? agentRuns : undefined,
                teamRun: teamRun.content ? teamRun : undefined
              },
              {type: 'error', content: errorMessage}
            ];
          }
          return [...prev, {type: 'error', content: errorMessage}];
        });
        
        // Clear live state but keep the progress in messages
        setCurrentRuns([]);
        setCurrentRunIndex(-1);
        setTeamRun({ content: '', completed: false });
        setTeamRunActive(false);
        
        eventSource.close();
      });

      eventSource.onerror = (error) => {
        console.error('❌ EventSource connection error:', error);
        console.log('🔌 Connection state:', eventSource.readyState);
        
        // Only show connection error if we haven't already handled an error event
        if (eventSource.readyState === EventSource.CLOSED) {
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.type !== 'error') {
              // Convert current processing message to final response with current progress
              if (lastMsg.type === 'ai-processing') {
                const agentRuns: AgentRun[] = currentRuns.filter(run => run.tools.length > 0 || run.content).map(run => ({
                  name: run.name,
                  tools: run.tools,
                  content: run.content,
                  completed: run.completed,
                  toolCallIds: run.toolCallIds
                }));
                
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMsg,
                    type: 'ai-response',
                    agentRuns: agentRuns.length > 0 ? agentRuns : undefined,
                    teamRun: teamRun.content ? teamRun : undefined
                  },
                  {type: 'error', content: 'Connection lost. Please try again.'}
                ];
              }
              return [...prev, {type: 'error', content: 'Connection lost. Please try again.'}];
            }
            return prev;
          });
        }
        
        // Clear live state
        setCurrentRuns([]);
        setCurrentRunIndex(-1);
        setTeamRun({ content: '', completed: false });
        setTeamRunActive(false);
        setLoading(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      
      // Convert current processing message to final response with current progress
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.type === 'ai-processing') {
          const agentRuns: AgentRun[] = currentRuns.filter(run => run.tools.length > 0 || run.content).map(run => ({
            name: run.name,
            tools: run.tools,
            content: run.content,
            completed: run.completed,
            toolCallIds: run.toolCallIds
          }));
          
          return [
            ...prev.slice(0, -1),
            {
              ...lastMsg,
              type: 'ai-response',
              agentRuns: agentRuns.length > 0 ? agentRuns : undefined,
              teamRun: teamRun.content ? teamRun : undefined
            },
            {type: 'error', content: 'Could not initiate connection.'}
          ];
        }
        return [...prev, {type: 'error', content: 'Could not initiate connection.'}];
      });
      
      // Clear live state
      setCurrentRuns([]);
      setCurrentRunIndex(-1);
      setTeamRun({ content: '', completed: false });
      setTeamRunActive(false);
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
                                          const agentName = run.name === 'Finance Agent' ? 'Finance_Agent' : 'Sentiment_Agent';
                                          const toolCallId = run.toolCallIds[toolIndex];
                                          const toolKey = `${tool}-${agentName}-${toolCallId}`;
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
                                    {typeof run.content === 'object' && (Array.isArray(run.content) || run.content.technical_analysis || run.content.sentiment_summary) ? (
                                      <div className="space-y-4">
                                        {(Array.isArray(run.content) ? run.content : [run.content]).map((item: any, itemIdx: number) => (
                                          <div key={itemIdx} className={`space-y-3 ${itemIdx > 0 ? 'pt-4 border-t border-gray-300' : ''}`}>
                                            {item.ticker && (
                                              <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ticker: {item.ticker}</div>
                                            )}
                                            {item.technical_analysis && (
                                              <div className="grid gap-2">
                                                {item.technical_analysis.map((indicator: any, idx: number) => (
                                                  <div key={idx} className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                      <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{indicator.indicator_name}</span>
                                                      <span className={`text-sm px-2 py-1 rounded ${
                                                        indicator.signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                                        indicator.signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                      }`}>{indicator.signal}</span>
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{indicator.justification}</div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {item.sentiment_summary && (
                                              <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sentiment Summary</span>
                                                  <span className={`text-sm px-2 py-1 rounded ${
                                                    item.sentiment_summary.overall_sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                                    item.sentiment_summary.overall_sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>{item.sentiment_summary.overall_sentiment}</span>
                                                </div>
                                                <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.sentiment_summary.justification}</div>
                                              </div>
                                            )}
                                            {item.tool_outputs && (
                                              <div className="grid gap-2">
                                                {item.tool_outputs.map((tool: any, idx: number) => (
                                                  <div key={idx} className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                    <div className="flex justify-between items-center mb-1">
                                                      <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tool.tool_name}</span>
                                                      <span className={`text-sm px-2 py-1 rounded ${
                                                        tool.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                                        tool.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-800'
                                                      }`}>{tool.sentiment}</span>
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{tool.justification}</div>
                                                    {tool.top_points && (
                                                      <ul className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} list-disc list-inside space-y-0.5`}>
                                                        {tool.top_points.map((point: string, pointIdx: number) => (
                                                          <li key={pointIdx}>{point}</li>
                                                        ))}
                                                      </ul>
                                                    )}
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                            {item.key_points && (
                                              <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Points</div>
                                                <ul className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} list-disc list-inside space-y-0.5`}>
                                                  {item.key_points.map((point: string, pointIdx: number) => (
                                                    <li key={pointIdx}>{point}</li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}
                                            {item.summary && (
                                              <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Summary</span>
                                                  <span className={`text-sm px-2 py-1 rounded ${
                                                    item.summary.consolidated_signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                                    item.summary.consolidated_signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                                  }`}>{item.summary.consolidated_signal}</span>
                                                </div>
                                                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.summary.report}</div>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <ReactMarkdown
                                        components={{
                                          p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                                          ul: ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                                          ol: ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                                          li: ({children}) => <li className="ml-2">{children}</li>,
                                          strong: ({children}) => <strong className="font-semibold">{children}</strong>
                                        }}
                                      >
                                        {typeof run.content === 'string' ? run.content : JSON.stringify(run.content, null, 2)}
                                      </ReactMarkdown>
                                    )}
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
                        <div className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Conductor</div>
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
                                        const toolCallId = run.toolCallIds?.[toolIndex];
                                        const toolKey = toolCallId ? `${tool}-${agentName}-${toolCallId}` : `${tool}-${agentName}`;
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
                              <div>
                                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Agent Reasoning:</div>
                                <div className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {typeof run.content === 'object' && (Array.isArray(run.content) || run.content.technical_analysis || run.content.sentiment_summary) ? (
                                    <div className="space-y-4">
                                      {(Array.isArray(run.content) ? run.content : [run.content]).map((item: any, itemIdx: number) => (
                                        <div key={itemIdx} className={`space-y-3 ${itemIdx > 0 ? 'pt-4 border-t border-gray-300' : ''}`}>
                                          {item.ticker && (
                                            <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ticker: {item.ticker}</div>
                                          )}
                                          {item.technical_analysis && (
                                            <div className="grid gap-2">
                                              {item.technical_analysis.map((indicator: any, idx: number) => (
                                                <div key={idx} className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                  <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{indicator.indicator_name}</span>
                                                    <span className={`text-sm px-2 py-1 rounded ${
                                                      indicator.signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                                      indicator.signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}>{indicator.signal}</span>
                                                  </div>
                                                  <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{indicator.justification}</div>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {item.sentiment_summary && (
                                            <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                              <div className="flex justify-between items-center mb-1">
                                                <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sentiment Summary</span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                  item.sentiment_summary.overall_sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                                  item.sentiment_summary.overall_sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>{item.sentiment_summary.overall_sentiment}</span>
                                              </div>
                                              <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.sentiment_summary.justification}</div>
                                            </div>
                                          )}
                                          {item.tool_outputs && (
                                            <div className="grid gap-2">
                                              {item.tool_outputs.map((tool: any, idx: number) => (
                                                <div key={idx} className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                                  <div className="flex justify-between items-center mb-1">
                                                    <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tool.tool_name}</span>
                                                    <span className={`text-sm px-2 py-1 rounded ${
                                                      tool.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                                      tool.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}>{tool.sentiment}</span>
                                                  </div>
                                                  <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-1`}>{tool.justification}</div>
                                                  {tool.top_points && (
                                                    <ul className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} list-disc list-inside space-y-0.5`}>
                                                      {tool.top_points.map((point: string, pointIdx: number) => (
                                                        <li key={pointIdx}>{point}</li>
                                                      ))}
                                                    </ul>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                          {item.key_points && (
                                            <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                              <div className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Key Points</div>
                                              <ul className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} list-disc list-inside space-y-0.5`}>
                                                {item.key_points.map((point: string, pointIdx: number) => (
                                                  <li key={pointIdx}>{point}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                          {item.summary && (
                                            <div className={`p-2 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                              <div className="flex justify-between items-center mb-1">
                                                <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>Summary</span>
                                                <span className={`text-sm px-2 py-1 rounded ${
                                                  item.summary.consolidated_signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                                  item.summary.consolidated_signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>{item.summary.consolidated_signal}</span>
                                              </div>
                                              <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.summary.report}</div>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <ReactMarkdown
                                      components={{
                                        p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>,
                                        ul: ({children}) => <ul className="list-disc list-inside mb-1 space-y-0.5">{children}</ul>,
                                        ol: ({children}) => <ol className="list-decimal list-inside mb-1 space-y-0.5">{children}</ol>,
                                        li: ({children}) => <li className="ml-2">{children}</li>,
                                        strong: ({children}) => <strong className="font-semibold">{children}</strong>
                                      }}
                                    >
                                      {typeof run.content === 'string' ? run.content : JSON.stringify(run.content, null, 2)}
                                    </ReactMarkdown>
                                  )}
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
                        <div className={`px-3 py-3 border-t ${darkMode ? 'border-gray-600 text-gray-200' : 'border-gray-200 text-gray-900'}`}>
                          {(() => {
                            try {
                              // Extract JSON from markdown code block
                              const jsonMatch = msg.teamRun.content.match(/```json\s*\n([\s\S]*?)\n```/);
                              if (jsonMatch) {
                                const parsed = JSON.parse(jsonMatch[1]);
                                return (
                                  <div className="space-y-4">
                                    {/* Executive Summary */}
                                    {parsed.executive_summary && (
                                      <div className={`p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{parsed.executive_summary.heading}</h3>
                                        <div className="flex items-center gap-4 mb-2">
                                          <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>Ticker: {parsed.executive_summary.ticker}</span>
                                          <span className={`px-2 py-1 rounded text-sm ${
                                            parsed.executive_summary.recommendation === 'Buy' ? 'bg-green-100 text-green-800' :
                                            parsed.executive_summary.recommendation === 'Sell' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>{parsed.executive_summary.recommendation}</span>
                                        </div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{parsed.executive_summary.thesis}</p>
                                      </div>
                                    )}
                                    
                                    {/* Technical Analysis */}
                                    {parsed.technical_analysis && (
                                      <div className={`p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{parsed.technical_analysis.heading}</h3>
                                          <span className={`px-2 py-1 rounded text-sm ${
                                            parsed.technical_analysis.consolidated_signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                            parsed.technical_analysis.consolidated_signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>{parsed.technical_analysis.consolidated_signal}</span>
                                        </div>
                                        <div className="grid gap-2">
                                          {parsed.technical_analysis.key_indicators?.map((indicator, idx) => (
                                            <div key={idx} className={`p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-500' : 'bg-white border-gray-300'}`}>
                                              <div className="flex justify-between items-center mb-1">
                                                <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{indicator.indicator_name}</span>
                                                <span className={`text-xs px-2 py-1 rounded ${
                                                  indicator.signal === 'Bullish' ? 'bg-green-100 text-green-800' :
                                                  indicator.signal === 'Bearish' ? 'bg-red-100 text-red-800' :
                                                  'bg-gray-100 text-gray-800'
                                                }`}>{indicator.signal}</span>
                                              </div>
                                              <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{indicator.justification}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Market Sentiment Analysis */}
                                    {parsed.market_sentiment_analysis && (
                                      <div className={`p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{parsed.market_sentiment_analysis.heading}</h3>
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded text-sm ${
                                              parsed.market_sentiment_analysis.overall_sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                                              parsed.market_sentiment_analysis.overall_sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                            }`}>{parsed.market_sentiment_analysis.overall_sentiment}</span>
                                            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Confidence: {parsed.market_sentiment_analysis.confidence_score}%</span>
                                          </div>
                                        </div>
                                        <div className="space-y-1">
                                          {parsed.market_sentiment_analysis.key_drivers?.map((driver, idx) => (
                                            <div key={idx} className={`text-sm p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                              • {driver}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Recommendation */}
                                    {parsed.integrated_thesis_and_recommendation && (
                                      <div className={`p-3 rounded border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{parsed.integrated_thesis_and_recommendation.heading}</h3>
                                        <div className="space-y-3">
                                          <div>
                                            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Analysis:</h4>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{parsed.integrated_thesis_and_recommendation.synthesis_paragraph}</p>
                                          </div>
                                          <div>
                                            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Conclusion:</h4>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{parsed.integrated_thesis_and_recommendation.final_conclusion}</p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            } catch (e) {
                              // Fallback to markdown rendering
                            }
                            
                            return (
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
                            );
                          })()}
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
          <div className={`absolute bottom-0 mb-23 left-0 right-0 h-19 bg-gradient-to-t ${darkMode ? 'from-gray-800 via-gray-800/50' : 'from-white via-white/50'} to-transparent pointer-events-none`}></div>
        </div>
      </div>

      <div className={`px-3 pb-3 pt-1`}>
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

          <p className={`text-center text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                    <div className={`mt-2 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`}>
                      <ul className="list-disc list-inside space-y-1">
                        {renderBulletPoints(selectedTool.input)}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              
              {selectedTool.result && (
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Result:</label>
                  <div className={`mt-2 p-4 rounded-lg overflow-y-auto ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-800'}`} style={{maxHeight: 'calc(80vh - 270px)'}}>
                    {(() => {
                      let parsed = null;
                      
                      // Comprehensive HTML entity decoding
                      let cleanResult = selectedTool.result;
                      
                      // Handle multiple levels of HTML encoding
                      const htmlDecode = (str) => {
                        const txt = document.createElement('textarea');
                        txt.innerHTML = str;
                        return txt.value;
                      };
                      
                      // Decode HTML entities multiple times if needed
                      let prevResult = '';
                      while (cleanResult !== prevResult) {
                        prevResult = cleanResult;
                        cleanResult = htmlDecode(cleanResult);
                      }
                      
                      // Try to parse as JSON first
                      try {
                        parsed = JSON.parse(cleanResult);
                      } catch (jsonError) {
                        // If JSON parsing fails, try to use eval for Python dict
                        try {
                          // Replace numpy references before eval
                          const cleanedForEval = cleanResult.replace(/np\.float64\(([^)]+)\)/g, '$1');
                          const evalResult = eval('(' + cleanedForEval + ')');
                          parsed = evalResult;
                        } catch (finalError) {
                          // If both fail, display as plain text
                          return (
                            <div className={`text-sm font-mono whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                              {selectedTool.result}
                            </div>
                          );
                        }
                      }
                      

                      
                      // Special handling for search/news results
                      if (Array.isArray(parsed) && (selectedTool.name.includes('search') || selectedTool.name.includes('news'))) {
                        return (
                          <div className="grid grid-cols-3 gap-4">
                            {parsed.map((item, index) => (
                              <div key={index} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
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
                      
                      // General JSON/dictionary formatting as bullet points
                      if (parsed) {
                        return (
                          <div className="text-sm leading-relaxed">
                            <ul className="list-none space-y-1">
                              {renderBulletPoints(parsed)}
                            </ul>
                          </div>
                        );
                      }
                      
                      // Fallback to plain text if parsing failed
                      return (
                        <div className={`text-sm font-mono whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {selectedTool.result}
                        </div>
                      );
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