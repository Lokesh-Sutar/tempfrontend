import { useState, useEffect } from 'react'

interface Agent {
  name: string
  status: 'Ready' | 'Processing' | 'Monitoring'
  description: string
}

interface RightAgentPanelProps {
  darkMode: boolean
  show: boolean
  agentStatuses: { [key: string]: 'Ready' | 'Processing' | 'Monitoring' }
  expandedAgent: string | null
  onAgentClick: (agentName: string) => void
  searchResults: any
}

export function RightAgentPanel({ darkMode, show, agentStatuses, expandedAgent, onAgentClick, searchResults }: RightAgentPanelProps) {
  const [expandedTool, setExpandedTool] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<{name: string, result: any, args?: any} | null>(null)

  // Listen for tool expansion from chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkExpansion = () => {
        if ((window as any).expandWatcherTool && searchResults) {
          const toolId = (window as any).expandWatcherTool;
          // Extract tool name and index from the ID format: "toolName-index"
          const parts = toolId.split('-');
          const toolIndex = parseInt(parts[parts.length - 1]);
          
          if (Array.isArray(searchResults) && searchResults[toolIndex]) {
            setSelectedTool(searchResults[toolIndex]);
          }
          (window as any).expandWatcherTool = null;
        }
      };
      const interval = setInterval(checkExpansion, 50);
      return () => clearInterval(interval);
    }
  }, [expandedAgent, searchResults])
  const agents: Agent[] = [
    { name: 'Watcher', status: agentStatuses.Watcher || 'Ready', description: 'Observing market trends and data' },
    { name: 'Analyst', status: agentStatuses.Analyst || 'Ready', description: 'Analyzing collected information' },
    { name: 'Adviser', status: agentStatuses.Adviser || 'Ready', description: 'Preparing recommendations' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return darkMode ? 'bg-yellow-600' : 'bg-yellow-500'
      case 'Monitoring': return darkMode ? 'bg-blue-600' : 'bg-blue-500'
      case 'Ready': return darkMode ? 'bg-green-600' : 'bg-green-500'
      default: return darkMode ? 'bg-gray-600' : 'bg-gray-500'
    }
  }

  return (
    <div className={`w-full h-full flex flex-col ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    } border-l`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {selectedTool ? selectedTool.name : expandedAgent ? `${expandedAgent} Details` : 'Active Agents'}
          </h2>
          {(expandedAgent || selectedTool) && (
            <button
              onClick={() => selectedTool ? setSelectedTool(null) : onAgentClick('')}
              className={`text-sm px-2 py-1 rounded transition-all duration-200 ease-out hover:scale-105 ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {selectedTool ? (
          <div className="space-y-4">
            {selectedTool.args && (
              <div>
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Arguments:
                </h3>
                <div className={`p-3 rounded border text-xs break-words overflow-hidden ${
                  darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedTool.args, null, 2)}</pre>
                </div>
              </div>
            )}
            
            <div>
              <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Result:
              </h3>
              <div className="space-y-2">
                {Array.isArray(selectedTool.result) ? (
                  selectedTool.result.map((item, idx) => (
                    <div key={idx} className={`p-3 rounded border text-xs break-words overflow-hidden ${
                      darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                    }`}>
                      {typeof item === 'object' ? (
                        <div className="overflow-hidden space-y-2">
                          {item.title && (
                            <div className={`font-medium break-words text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</div>
                          )}
                          {item.body && (
                            <div className={`break-words text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.body}</div>
                          )}
                          {item.image && (
                            <img src={item.image} alt={item.title || 'Tool result'} className="max-w-full h-auto rounded border" />
                          )}
                          {(item.href || item.url) && (
                            <a href={item.href || item.url} target="_blank" rel="noopener noreferrer" 
                               className={`hover:opacity-80 block break-all text-xs ${
                                 darkMode ? 'text-blue-400' : 'text-blue-600'
                               }`}>
                              {item.href || item.url}
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className={`break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{String(item)}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={`p-3 rounded border text-xs break-words overflow-hidden ${
                    darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                  }`}>
                    <pre className="whitespace-pre-wrap">{String(selectedTool.result)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !expandedAgent ? (
          agents.map((agent) => (
            <div 
              key={agent.name} 
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md hover:scale-105 transition-all duration-200 ease-out ${
                darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onAgentClick(agent.name)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {agent.name}
                </h3>
                <span 
                  className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(agent.status)}`}
                >
                  {agent.status}
                </span>
              </div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {agent.description}
              </p>
            </div>
          ))
        ) : (
          <div className={`p-4 rounded-lg border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {expandedAgent === 'Watcher' && (
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Tools Used
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto px-2">
                  {Array.isArray(searchResults) && searchResults.length > 0 ? (
                    searchResults.map((tool, i) => (
                      <div key={i}>
                        <div
                          onClick={() => setSelectedTool(tool)}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105 ${
                            darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {tool.name}
                              </h4>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Click to view details
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              →
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No tool results yet. Send a message to see Watcher in action.
                    </p>
                  )}
                </div>
              </div>
            )}
            {expandedAgent === 'Analyst' && (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Analyst detailed view - Coming soon
              </p>
            )}
            {expandedAgent === 'Adviser' && (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Adviser detailed view - Coming soon
              </p>
            )}
          </div>
        )}
      </div>

    </div>
  )
}