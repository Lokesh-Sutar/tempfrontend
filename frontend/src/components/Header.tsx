import { Menu, Sun, Moon } from 'lucide-react'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  onToggleAgents: () => void
  showAgents: boolean
  onToggleSidebar: () => void
  showSidebar: boolean
}

export function Header({ darkMode, onToggleDarkMode, onToggleAgents, showAgents, onToggleSidebar, showSidebar }: HeaderProps) {
  return (
    <header className={`h-16 px-6 flex items-center justify-between border-b ${
      darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'text-gray-300 hover:bg-gray-800' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Menu size={20} />
        </button>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">PQ</span>
        </div>
        <h1 className="text-xl font-semibold">PersonaQuant</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleAgents}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAgents 
              ? 'bg-blue-600 text-white' 
              : darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showAgents ? 'Hide Agents' : 'Show Agents'}
        </button>
        
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}