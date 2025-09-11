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

  // Listen for tool expansion from chat
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkExpansion = () => {
        if ((window as any).expandWatcherTool) {
          setExpandedTool((window as any).expandWatcherTool);
          (window as any).expandWatcherTool = null;
        }
      };
      const interval = setInterval(checkExpansion, 50);
      return () => clearInterval(interval);
    }
  }, [expandedAgent])
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

  if (!show) return null

  return (
    <div className={`${expandedAgent ? 'w-110' : 'w-80'} h-full flex flex-col transition-all duration-300 ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    } border-l`}>
      <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {expandedAgent ? `${expandedAgent} Details` : 'Active Agents'}
          </h2>
          {expandedAgent && (
            <button
              onClick={() => onAgentClick('')}
              className={`text-sm px-2 py-1 rounded ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {!expandedAgent ? (
          agents.map((agent) => (
            <div 
              key={agent.name} 
              className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
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
                <div className="space-y-2 max-h-110 overflow-y-auto pr-1">
                  {Array.isArray(searchResults) && searchResults.length > 0 ? (
                    searchResults.map((tool, i) => (
                      <div key={i}>
                        <div
                          onClick={() => setExpandedTool(expandedTool === `${tool.name}-${i}` ? null : `${tool.name}-${i}`)}
                          className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                            expandedTool === `${tool.name}-${i}`
                              ? darkMode ? 'bg-gray-600 border-blue-500' : 'bg-blue-50 border-blue-300'
                              : darkMode ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {tool.name}
                              </h4>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Click to {expandedTool === `${tool.name}-${i}` ? 'collapse' : 'expand'} details
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              expandedTool === `${tool.name}-${i}`
                                ? 'bg-blue-500 text-white'
                                : darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {expandedTool === `${tool.name}-${i}` ? '-' : '+'}
                            </div>
                          </div>
                        </div>
                        
                        {expandedTool === `${tool.name}-${i}` && (
                          <div className={`mt-2 p-3 rounded border overflow-hidden ${
                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'
                          }`}>
                            <div className="space-y-3">
                              {tool.args && (
                                <div>
                                  <h5 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Arguments:
                                  </h5>
                                  <div className={`p-2 rounded text-xs break-words overflow-hidden ${
                                    darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    {JSON.stringify(tool.args, null, 2)}
                                  </div>
                                </div>
                              )}
                              <div>
                                <h5 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  Result:
                                </h5>
                                <div className="space-y-2">
                              {Array.isArray(tool.result) ? (
                                tool.result.map((item, idx) => (
                                  <div key={idx} className={`p-2 rounded text-xs break-words overflow-hidden ${
                                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                                  }`}>
                                    {typeof item === 'object' ? (
                                      <div className="overflow-hidden">
                                        <div className={`font-medium break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</div>
                                        <div className={`mt-1 break-words ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.body}</div>
                                        {item.href && (
                                          <a href={item.href} target="_blank" rel="noopener noreferrer" 
                                             className={`hover:opacity-80 mt-1 block break-all ${
                                               darkMode ? 'text-blue-400' : 'text-blue-600'
                                             }`}>
                                            {item.href}
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <div className={`break-words ${darkMode ? 'text-white' : 'text-gray-900'}`}>{String(item)}</div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className={`p-2 rounded text-xs break-words overflow-hidden ${
                                  darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'
                                }`}>
                                  {String(tool.result)}
                                </div>
                              )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
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