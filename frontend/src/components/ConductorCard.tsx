import React from 'react'

interface ConductorCardProps {
  content: string
  darkMode: boolean
}

interface ExecutiveSummary {
  heading: string
  stock_ticker?: string
  stocks_analyzed?: string[]
  recommendation?: string
  quick_recommendations?: string
  quick_take?: string
  overall_view?: string
  strategy_recommended?: string
}

interface TechnicalAnalysis {
  heading: string
  overall_signal?: string
  what_the_data_shows?: Array<{
    indicator: string
    signal: string
    what_it_means: string
  }>
}

interface SentimentAnalysis {
  heading: string
  overall_mood?: string
  confidence_level?: string
  why_people_feel_this_way?: string[]
}

interface FinalRecommendation {
  heading: string
  the_full_picture?: string
  bottom_line?: string
  things_to_watch_out_for?: string
  investment_timeframe?: string
}

interface IndividualStock {
  ticker: string
  recommendation: string
  price_signal: string
  market_buzz: string
  key_reason: string
}

interface Comparison {
  heading: string
  best_opportunity?: string
  why_its_best?: string
  risk_comparison?: string
  market_conditions?: string
}

interface StrategyDetails {
  heading: string
  why_this_strategy?: string
  historical_performance?: {
    average_yearly_return: string
    risk_level: string
    biggest_loss_period: string
    how_it_compares?: string
  }
}

interface SuggestedAllocation {
  heading: string
  breakdown?: Record<string, {
    percentage: string
    number_of_shares?: number
    why: string
  }>
  how_to_invest?: string
  when_to_rebalance?: string
}

interface RiskManagement {
  heading: string
  exit_points?: string
  position_limits?: string
  sizing_approach?: string
}

interface CostsAndPracticalities {
  heading: string
  estimated_fees?: string
  tax_notes?: string
  broker_notes?: string
}

interface SingleStockAnalysis {
  analysis_type: 'single_stock'
  executive_summary: ExecutiveSummary
  technical_analysis: TechnicalAnalysis
  sentiment_analysis: SentimentAnalysis
  final_recommendation: FinalRecommendation
}

interface MultipleStocksAnalysis {
  analysis_type: 'multiple_stocks'
  executive_summary: ExecutiveSummary
  individual_stocks: IndividualStock[]
  comparison: Comparison
}

interface PortfolioStrategyAnalysis {
  analysis_type: 'portfolio_strategy'
  executive_summary: ExecutiveSummary
  strategy_details: StrategyDetails
  suggested_allocation: SuggestedAllocation
  risk_management: RiskManagement
  costs_and_practicalities: CostsAndPracticalities
  important_disclaimers: string[]
}

type AnalysisData = SingleStockAnalysis | MultipleStocksAnalysis | PortfolioStrategyAnalysis

const extractJSON = (content: string): AnalysisData | null => {
  const patterns = [
    /```json\s*\n([\s\S]*?)\n```/,
    /```\s*\n([\s\S]*?)\n```/,
    /json\s*({[\s\S]*})/,
    /({[\s\S]*})/
  ]
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match) {
      try {
        return JSON.parse(match[1])
      } catch (e) {
        continue
      }
    }
  }
  return null
}

const getRecommendationColor = (recommendation: string) => {
  if (recommendation?.toLowerCase().includes('buy')) return 'bg-green-100 text-green-800'
  if (recommendation?.toLowerCase().includes('sell')) return 'bg-red-100 text-red-800'
  return 'bg-yellow-100 text-yellow-800'
}

const getSignalColor = (signal: string) => {
  if (signal?.toLowerCase().includes('positive') || signal?.toLowerCase().includes('up')) return 'bg-green-100 text-green-800'
  if (signal?.toLowerCase().includes('negative') || signal?.toLowerCase().includes('down')) return 'bg-red-100 text-red-800'
  return 'bg-gray-100 text-gray-800'
}

const SingleStockView: React.FC<{ data: SingleStockAnalysis; darkMode: boolean }> = ({ data, darkMode }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.executive_summary.heading}</h3>
      <div className="flex items-center gap-4 mb-2">
        {data.executive_summary.stock_ticker && (
          <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            {data.executive_summary.stock_ticker}
          </span>
        )}
        {data.executive_summary.recommendation && (
          <span className={`px-2 py-1 rounded text-sm ${getRecommendationColor(data.executive_summary.recommendation)}`}>
            {data.executive_summary.recommendation}
          </span>
        )}
      </div>
      {data.executive_summary.quick_take && (
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary.quick_take}</p>
      )}
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.technical_analysis.heading}</h3>
        {data.technical_analysis.overall_signal && (
          <span className={`px-2 py-1 rounded text-sm ${getSignalColor(data.technical_analysis.overall_signal)}`}>
            {data.technical_analysis.overall_signal}
          </span>
        )}
      </div>
      {data.technical_analysis.what_the_data_shows?.map((indicator, idx) => (
        <div key={idx} className={`p-3 mb-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-500' : 'bg-white border-gray-300'}`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{indicator.indicator}</span>
            <span className={`text-xs px-2 py-1 rounded ${getSignalColor(indicator.signal)}`}>{indicator.signal}</span>
          </div>
          <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{indicator.what_it_means}</p>
        </div>
      ))}
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.sentiment_analysis.heading}</h3>
        <div className="flex items-center gap-2">
          {data.sentiment_analysis.overall_mood && (
            <span className={`px-2 py-1 rounded text-sm ${getSignalColor(data.sentiment_analysis.overall_mood)}`}>
              {data.sentiment_analysis.overall_mood}
            </span>
          )}
          {data.sentiment_analysis.confidence_level && (
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {data.sentiment_analysis.confidence_level}
            </span>
          )}
        </div>
      </div>
      {data.sentiment_analysis.why_people_feel_this_way?.map((reason, idx) => (
        <div key={idx} className={`text-sm p-2 mb-1 rounded ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'}`}>
          • {reason}
        </div>
      ))}
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.final_recommendation.heading}</h3>
      <div className="space-y-3">
        {data.final_recommendation.the_full_picture && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.final_recommendation.the_full_picture}</p>
        )}
        {data.final_recommendation.bottom_line && (
          <div>
            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bottom Line:</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.final_recommendation.bottom_line}</p>
          </div>
        )}
        {data.final_recommendation.things_to_watch_out_for && (
          <div>
            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Risks:</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.final_recommendation.things_to_watch_out_for}</p>
          </div>
        )}
        {data.final_recommendation.investment_timeframe && (
          <div>
            <h4 className={`font-semibold text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Timeframe:</h4>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.final_recommendation.investment_timeframe}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)

const MultipleStocksView: React.FC<{ data: MultipleStocksAnalysis; darkMode: boolean }> = ({ data, darkMode }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.executive_summary.heading}</h3>
      <div className="mb-2">
        {data.executive_summary.stocks_analyzed && (
          <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            Stocks: {data.executive_summary.stocks_analyzed.join(', ')}
          </span>
        )}
      </div>
      {data.executive_summary.quick_recommendations && (
        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary.quick_recommendations}</p>
      )}
      {data.executive_summary.overall_view && (
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary.overall_view}</p>
      )}
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Individual Analysis</h3>
      <div className="grid gap-3">
        {data.individual_stocks.map((stock, idx) => (
          <div key={idx} className={`p-3 rounded border ${darkMode ? 'bg-gray-700 border-gray-500' : 'bg-white border-gray-300'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{stock.ticker}</span>
              <div className="flex gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getRecommendationColor(stock.recommendation)}`}>
                  {stock.recommendation}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getSignalColor(stock.price_signal)}`}>
                  {stock.price_signal}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${getSignalColor(stock.market_buzz)}`}>
                  {stock.market_buzz}
                </span>
              </div>
            </div>
            <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{stock.key_reason}</p>
          </div>
        ))}
      </div>
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.comparison.heading}</h3>
      <div className="space-y-2">
        {data.comparison.best_opportunity && (
          <div>
            <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Best Opportunity: </span>
            <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{data.comparison.best_opportunity}</span>
          </div>
        )}
        {data.comparison.why_its_best && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.comparison.why_its_best}</p>
        )}
        {data.comparison.risk_comparison && (
          <div>
            <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Risk Assessment: </span>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.comparison.risk_comparison}</span>
          </div>
        )}
        {data.comparison.market_conditions && (
          <div>
            <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Market Context: </span>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.comparison.market_conditions}</span>
          </div>
        )}
      </div>
    </div>
  </div>
)

const PortfolioStrategyView: React.FC<{ data: PortfolioStrategyAnalysis; darkMode: boolean }> = ({ data, darkMode }) => (
  <div className="space-y-4">
    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.executive_summary.heading}</h3>
      {data.executive_summary.strategy_recommended && (
        <div className="mb-2">
          <span className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
            Strategy: {data.executive_summary.strategy_recommended}
          </span>
        </div>
      )}
      {data.executive_summary.quick_take && (
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.executive_summary.quick_take}</p>
      )}
    </div>

    <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
      <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.strategy_details.heading}</h3>
      {data.strategy_details.why_this_strategy && (
        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{data.strategy_details.why_this_strategy}</p>
      )}
      {data.strategy_details.historical_performance && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Avg Return: </span>
            <span className={`text-sm ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
              {data.strategy_details.historical_performance.average_yearly_return}
            </span>
          </div>
          <div>
            <span className={`font-medium text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Risk Level: </span>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {data.strategy_details.historical_performance.risk_level}
            </span>
          </div>
        </div>
      )}
    </div>

    {data.suggested_allocation && (
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{data.suggested_allocation.heading}</h3>
        {data.suggested_allocation.breakdown && (
          <div className="space-y-2 mb-3">
            {Object.entries(data.suggested_allocation.breakdown).map(([asset, details]) => (
              <div key={asset} className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{asset}</span>
                  <span className={`text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>{details.percentage}</span>
                </div>
                <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{details.why}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {data.important_disclaimers && (
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'}`}>
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Important Disclaimers</h3>
        <ul className="space-y-1">
          {data.important_disclaimers.map((disclaimer, idx) => (
            <li key={idx} className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
              • {disclaimer}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
)

export const ConductorCard: React.FC<ConductorCardProps> = ({ content, darkMode }) => {
  const analysisData = extractJSON(content)

  if (!analysisData) {
    return (
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
        <h3 className={`font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Conductor</h3>
        <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          <pre className="whitespace-pre-wrap">{content}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'}`}>
      <div className={`p-3 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Conductor</div>
      <div className={`px-3 py-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
        {analysisData.analysis_type === 'single_stock' && <SingleStockView data={analysisData} darkMode={darkMode} />}
        {analysisData.analysis_type === 'multiple_stocks' && <MultipleStocksView data={analysisData} darkMode={darkMode} />}
        {analysisData.analysis_type === 'portfolio_strategy' && <PortfolioStrategyView data={analysisData} darkMode={darkMode} />}
      </div>
    </div>
  )
}