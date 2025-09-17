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
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Temp
        </h2>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Coming soon...
        </p>
      </div>
    </div>
  )
}