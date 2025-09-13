import { User } from 'lucide-react'

interface LeftSidebarProps {
  darkMode: boolean
  show: boolean
}

export function LeftSidebar({ darkMode, show }: LeftSidebarProps) {
  return (
    <div className={`w-full h-full flex flex-col ${
      darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
    } border-r`}>
      <div className="flex-1"></div>
      
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            darkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <User size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </div>
          <div>
            <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              User Name
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}