import { Menu, Sun, Moon } from 'lucide-react'
import { ColorPicker } from './ColorPicker'

interface HeaderProps {
  darkMode: boolean
  onToggleDarkMode: () => void
  onToggleAgents: () => void
  showAgents: boolean
  onToggleSidebar: () => void
  showSidebar: boolean
  primaryColor: string
  tempColor: string
  onColorChange: (color: string) => void
  onConfirmColor: () => void
  onResetColor: () => void
}

export function Header({ darkMode, onToggleDarkMode, onToggleAgents, showAgents, onToggleSidebar, showSidebar, primaryColor, tempColor, onColorChange, onConfirmColor, onResetColor }: HeaderProps) {
  return (
    <header className={`h-16 px-6 flex items-center justify-between border-b ${
      darkMode ? 'bg-neutral-950 border-neutral-700 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex items-center gap-3">
        {/* <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-all duration-200 ease-out hover:scale-110 active:scale-95 ${
            darkMode 
              ? 'text-neutral-300 hover:bg-neutral-800' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Menu size={20} />
        </button> */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--primary)' }}>
          <span className="text-white font-bold text-sm">PQ</span>
        </div>
        <h1 className="text-xl font-semibold">PersonaQuant</h1>
      </div>
      
      <div className="flex items-center gap-3">
        {/* <button
          onClick={onToggleAgents}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
            showAgents 
              ? 'text-white' 
              : darkMode 
                ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          style={showAgents ? { backgroundColor: 'var(--primary)' } : {}}
        >
          {showAgents ? 'Hide Agents' : 'Show Agents'}
        </button> */}
        
        <ColorPicker
          color={tempColor}
          onChange={onColorChange}
          onConfirm={onConfirmColor}
          onReset={onResetColor}
          darkMode={darkMode}
        />
        
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-lg transition-all duration-200 ease-out hover:scale-110 active:scale-95 ${
            darkMode 
              ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  )
}