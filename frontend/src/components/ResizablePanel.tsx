import { useState, useRef, useEffect } from 'react'

interface ResizablePanelProps {
  children: React.ReactNode
  side: 'left' | 'right'
  minWidth: number
  maxWidth: number
  defaultWidth: number
  show: boolean
  darkMode?: boolean
}

export function ResizablePanel({ children, side, minWidth, maxWidth, defaultWidth, show, darkMode }: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const [storedWidth, setStoredWidth] = useState(defaultWidth)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return

      const rect = panelRef.current.getBoundingClientRect()
      let newWidth: number

      if (side === 'left') {
        newWidth = e.clientX - rect.left
      } else {
        newWidth = rect.right - e.clientX
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      setWidth(newWidth)
      setStoredWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.userSelect = ''
    }

    if (isResizing) {
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
    }
  }, [isResizing, side, minWidth, maxWidth])

  return (
    <div
      ref={panelRef}
      className={`relative flex-shrink-0 h-full ${isResizing ? '' : 'transition-all duration-200 ease-out'} overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
      style={{ width: show ? (isResizing ? `${width}px` : `${storedWidth}px`) : '0px' }}
    >
      <div style={{ width: isResizing ? `${width}px` : `${storedWidth}px`, height: '100%' }} className={isResizing ? 'transition-none' : ''}>
        {children}
      </div>
      
      {/* Resize Handle */}
      {show && (
        <div
          className={`absolute top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 ${isResizing ? '' : 'transition-all duration-200 ease-out'} ${
            side === 'left' ? 'right-0' : 'left-0'
          } ${isResizing ? 'bg-blue-500 w-2' : 'bg-transparent hover:w-2'}`}
          onMouseDown={(e) => {
            e.preventDefault()
            setIsResizing(true)
          }}
        />
      )}
    </div>
  )
}