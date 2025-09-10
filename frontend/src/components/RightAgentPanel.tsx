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
  searchResults: any[]
}

export function RightAgentPanel({ darkMode, show, agentStatuses, expandedAgent, onAgentClick, searchResults }: RightAgentPanelProps) {
  const agents: Agent[] = [
    { name: 'Watcher', status: agentStatuses.Watcher || 'Ready', description: 'Observing market trends and data' },
    { name: 'Analyst', status: agentStatuses.Analyst || 'Ready', description: 'Analyzing collected information' },
    { name: 'Adviser', status: agentStatuses.Adviser || 'Ready', description: 'Preparing recommendations' }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Processing': return 'bg-yellow-500'
      case 'Monitoring': return 'bg-blue-500'
      case 'Ready': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (!show) return null

  return (
    <div className={`${expandedAgent ? 'w-96' : 'w-80'} h-full flex flex-col transition-all duration-300 ${
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
                <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(agent.status)}`}>
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
                  Search Results
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Array.isArray(searchResults) && searchResults.length > 0 ? (
                    searchResults.map((result, i) => (
                      <div key={i} className={`p-3 rounded border ${
                        darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                      }`}>
                        <h4 className={`font-medium text-sm mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {result.title}
                        </h4>
                        <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {result.body}
                        </p>
                        <a 
                          href={result.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-600"
                        >
                          {result.href}
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No search results yet. Send a message to see Watcher in action.
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