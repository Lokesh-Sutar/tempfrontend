import { useState } from 'react'
import { ThemeProvider, useTheme } from './components/theme-provider'
import { Header } from './components/Header'
import { LeftSidebar } from './components/LeftSidebar'
import { Chat } from './components/Chat'
import { RightAgentPanel } from './components/RightAgentPanel'

function AppContent() {
  const { theme, setTheme } = useTheme()
  const [showAgents, setShowAgents] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [agentStatuses, setAgentStatuses] = useState({
    Watcher: 'Ready' as const,
    Analyst: 'Ready' as const,
    Adviser: 'Ready' as const
  })
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])

  const isDark = theme === 'dark'

  const handleAgentClick = (agentName: string) => {
    setExpandedAgent(agentName || null)
  }

  const simulateAgentWork = () => {
    // Demo: Simulate Watcher agent working when search happens
    setAgentStatuses(prev => ({ ...prev, Watcher: 'Processing' }))
    
    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, Analyst: 'Processing' }))
    }, 2000)
    
    setTimeout(() => {
      setAgentStatuses(prev => ({ ...prev, Adviser: 'Processing' }))
    }, 4000)
    
    setTimeout(() => {
      setAgentStatuses({
        Watcher: 'Monitoring',
        Analyst: 'Ready', 
        Adviser: 'Ready'
      })
    }, 6000)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header 
        darkMode={isDark} 
        onToggleDarkMode={() => setTheme(isDark ? 'light' : 'dark')}
        onToggleAgents={() => setShowAgents(!showAgents)}
        showAgents={showAgents}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        showSidebar={showSidebar}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar darkMode={isDark} show={showSidebar} />
        <Chat 
          darkMode={isDark} 
          onMessageSent={simulateAgentWork} 
          onSearchResults={setSearchResults}
        />
        <RightAgentPanel 
          darkMode={isDark} 
          show={showAgents} 
          agentStatuses={agentStatuses}
          expandedAgent={expandedAgent}
          onAgentClick={handleAgentClick}
          searchResults={searchResults}
        />
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="personaquant-theme">
      <AppContent />
    </ThemeProvider>
  )
}

export default App
