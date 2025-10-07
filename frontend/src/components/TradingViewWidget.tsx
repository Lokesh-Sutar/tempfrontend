import { useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'

interface TradingViewWidgetProps {
  symbols: string[]
  darkMode: boolean
}

export function TradingViewWidget({ symbols, darkMode }: TradingViewWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const darkContainerRefs = useRef<(HTMLDivElement | null)[]>([])
  const lightContainerRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!symbols?.length) return

    symbols.forEach((symbol, index) => {
      const darkContainer = darkContainerRefs.current[index]
      if (darkContainer && darkContainer.children.length === 0) {
        const darkScript = document.createElement('script')
        darkScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        darkScript.type = 'text/javascript'
        darkScript.async = true
        darkScript.innerHTML = JSON.stringify({
          autosize: true,
          symbol: symbol,
          // interval: '30',
          timezone: 'Asia/Kolkata',
          theme: 'dark',
          style: '10',
          locale: 'en',
          backgroundColor: '#171717',
          gridColor: '#404040',
          allow_symbol_change: true,
          hide_top_toolbar: true,
          hide_legend: false,
          hide_side_toolbar: true,
          hide_volume: false,
          save_image: false,
          extended_hours: false,
          range: '1M',
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650',
          withdateranges: true,
          details: true,
          hotlist: false,
          fundamental: false,
          percentage: false,
          container_id: `tradingview_chart_dark_${index}`,
          width: '100%',
          height: '100%',
          support_host: 'https://www.tradingview.com'
        })
        darkContainer.appendChild(darkScript)
      }

      const lightContainer = lightContainerRefs.current[index]
      if (lightContainer && lightContainer.children.length === 0) {
        const lightScript = document.createElement('script')
        lightScript.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
        lightScript.type = 'text/javascript'
        lightScript.async = true
        lightScript.innerHTML = JSON.stringify({
          autosize: true,
          symbol: symbol,
          // interval: '30',
          timezone: 'Asia/Kolkata',
          theme: 'light',
          style: '10',
          locale: 'en',
          backgroundColor: '#ffffff',
          gridColor: '#e5e7eb',
          allow_symbol_change: true,
          hide_top_toolbar: true,
          hide_legend: false,
          hide_side_toolbar: true,
          hide_volume: false,
          save_image: false,
          extended_hours: false,
          range: '1M',
          show_popup_button: false,
          popup_width: '1000',
          popup_height: '650',
          withdateranges: true,
          details: true,
          hotlist: false,
          fundamental: false,
          percentage: false,
          container_id: `tradingview_chart_light_${index}`,
          width: '100%',
          height: '100%',
          support_host: 'https://www.tradingview.com'
        })
        lightContainer.appendChild(lightScript)
      }
    })
  }, [symbols])

  if (!symbols?.length) return null

  return (
    <div className="w-full relative">
      <div className={`w-full h-124 mb-2 rounded-sm border-0 relative overflow-hidden ${darkMode ? 'border-[#525252]' : 'border-[#d4d4d4]'}`}>
        <div className="absolute inset-0 rounded-sm overflow-hidden">
          {symbols.map((symbol, index) => (
            <div
              key={`dark-${symbol}`}
              ref={(el) => (darkContainerRefs.current[index] = el)}
              className="w-full h-full"
              style={{ display: darkMode && index === currentIndex ? 'block' : 'none' }}
            />
          ))}
          {symbols.map((symbol, index) => (
            <div
              key={`light-${symbol}`}
              ref={(el) => (lightContainerRefs.current[index] = el)}
              className="w-full h-full"
              style={{ display: !darkMode && index === currentIndex ? 'block' : 'none' }}
            />
          ))}
        </div>
        {symbols.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + symbols.length) % symbols.length)}
              className="absolute top-1/2 -translate-y-1/2 left-0 -translate-x-full px-3 py-2 backdrop-blur-sm hover:backdrop-blur-none rounded-l-lg border transition-all z-10"
              style={{
                backgroundColor: darkMode ? 'rgba(64, 64, 64, 0.75)' : 'rgba(229, 229, 229, 0.75)',
                borderColor: darkMode ? '#525252' : '#d4d4d4',
                color: darkMode ? '#ffffff' : '#171717'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#525252' : '#d4d4d4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(64, 64, 64, 0.75)' : 'rgba(229, 229, 229, 0.75)'}
            >
              <FontAwesomeIcon icon={faCaretLeft} />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % symbols.length)}
              className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-full px-3 py-2 backdrop-blur-sm hover:backdrop-blur-none rounded-r-lg border transition-all z-10"
              style={{
                backgroundColor: darkMode ? 'rgba(64, 64, 64, 0.75)' : 'rgba(229, 229, 229, 0.75)',
                borderColor: darkMode ? '#525252' : '#d4d4d4',
                color: darkMode ? '#ffffff' : '#171717'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = darkMode ? '#525252' : '#d4d4d4'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = darkMode ? 'rgba(64, 64, 64, 0.75)' : 'rgba(229, 229, 229, 0.75)'}
            >
              <FontAwesomeIcon icon={faCaretRight} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
