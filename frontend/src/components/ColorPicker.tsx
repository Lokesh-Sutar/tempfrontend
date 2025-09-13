import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import { Edit3 } from 'lucide-react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  onConfirm: () => void
  onReset: () => void
  darkMode: boolean
}

export function ColorPicker({ color, onChange, onConfirm, onReset, darkMode }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg cursor-pointer transition-all duration-200 ease-out hover:scale-110 active:scale-95"
        style={{ backgroundColor: color }}
        title="Primary Color"
      >
        <Edit3 size={16} className="text-white" />
      </button>
      
      {isOpen && (
        <div className={`absolute top-12 right-0 p-3 rounded-lg shadow-lg border z-50 ${
          darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <HexColorPicker color={color} onChange={onChange} />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => { onConfirm(); setIsOpen(false); }}
              className="flex-1 py-1 text-sm rounded bg-green-500 text-white hover:bg-green-600 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
            >
              ✓
            </button>
            <button
              onClick={() => { onReset(); setIsOpen(false); }}
              className="flex-1 py-1 text-sm rounded bg-red-500 text-white hover:bg-red-600 transition-all duration-200 ease-out hover:scale-105 active:scale-95"
            >
              ↺
            </button>
          </div>
        </div>
      )}
    </div>
  )
}