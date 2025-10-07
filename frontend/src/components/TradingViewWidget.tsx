import { useEffect, useRef } from 'react'

interface TradingViewWidgetProps {
  symbol: string
  darkMode: boolean
}

export function TradingViewWidget({ symbol, darkMode }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear any existing content
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      // Basic settings
      autosize: true,
      symbol: symbol,
      interval: '1', // '1', '3', '5', '15', '30', '60', '120', '240', 'D', 'W', 'M'
      timezone: 'Asia/Kolkata',
      theme: darkMode ? 'dark' : 'light',
      style: '2', // '0'=bars, '1'=candles, '2'=line
      locale: 'en',
      
      // Chart features
      backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
      gridColor: darkMode ? '#404040' : '#e5e7eb',
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: true,
      hide_side_toolbar: true,
      hide_volume: true,
      save_image: true,
      extended_hours: false,
      
      // Studies and indicators
      studies: [
        // 'MASimple@tv-basicstudies',
        // 'RSI@tv-basicstudies',
        // 'MACD@tv-basicstudies',
        // 'BB@tv-basicstudies',
        // 'StochasticRSI@tv-basicstudies',
        // 'Volume@tv-basicstudies'
      ],
      
      // Range and display
      range: '1D', // '1D', '5D', '1M', '3M', '6M', 'YTD', '12M', '60M', 'ALL'
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      
      // Advanced features
      withdateranges: true,
      details: true,
      hotlist: true,
      fundamental: false,
      percentage: false,
      
      // Container and sizing
      container_id: 'tradingview_chart',
      width: '100%',
      height: '100%',
      
      // Technical
      support_host: 'https://www.tradingview.com'
    })

    containerRef.current.appendChild(script)

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, darkMode])

  return (
    <div className="w-full h-170 mb-2">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}










