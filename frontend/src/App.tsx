import { useState, useEffect } from 'react'
import { ThemeProvider, useTheme } from './components/theme-provider'
import { Header } from './components/Header'
import { LeftSidebar } from './components/LeftSidebar'
import { Chat } from './components/Chat'
import { RightAgentPanel } from './components/RightAgentPanel'
import { ResizablePanel } from './components/ResizablePanel'

function AppContent() {
  const { theme, setTheme } = useTheme()
  const [showAgents, setShowAgents] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [tempColor, setTempColor] = useState('#3b82f6')

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
    // Set Watcher to Processing when tools start
    setAgentStatuses(prev => ({ ...prev, Watcher: 'Processing' }))
  }

  const handleToolsCompleted = () => {
    // Set Watcher to Ready when all tools complete
    setAgentStatuses(prev => ({ ...prev, Watcher: 'Ready' }))
  }

  useEffect(() => {
    document.documentElement.style.setProperty('--primary', primaryColor)
  }, [primaryColor])

  const handleColorChange = (color: string) => {
    setTempColor(color)
  }



  const confirmColor = () => {
    setPrimaryColor(tempColor)
  }

  const resetColor = () => {
    const defaultColor = isDark ? '#2563eb' : '#3b82f6'
    setTempColor(defaultColor)
    setPrimaryColor(defaultColor)
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
        primaryColor={primaryColor}
        tempColor={tempColor}
        onColorChange={handleColorChange}
        onConfirmColor={confirmColor}
        onResetColor={resetColor}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* <ResizablePanel
          side="left"
          minWidth={200}
          maxWidth={400}
          defaultWidth={280}
          show={showSidebar}
          darkMode={isDark}
        >
          <LeftSidebar darkMode={isDark} show={showSidebar} />
        </ResizablePanel> */}
        
        <Chat 
          darkMode={isDark} 
          onMessageSent={simulateAgentWork} 
          onSearchResults={setSearchResults}
          onWatcherClick={() => handleAgentClick('Watcher')}
          onToolsCompleted={handleToolsCompleted}
          onToggleAgents={() => {
            if (!showAgents) {
              setShowAgents(true);
            }
          }}
        />
        
        {/* <ResizablePanel
          side="right"
          minWidth={300}
          maxWidth={600}
          defaultWidth={380}
          show={showAgents}
          darkMode={isDark}
        >
          <RightAgentPanel 
            darkMode={isDark} 
            show={showAgents} 
            agentStatuses={agentStatuses}
            expandedAgent={expandedAgent}
            onAgentClick={handleAgentClick}
            searchResults={searchResults}
          />
        </ResizablePanel> */}
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
