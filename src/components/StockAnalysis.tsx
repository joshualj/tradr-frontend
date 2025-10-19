import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
// Import the StockChart component
import StockChart from './StockChart';

// --- HELPER FUNCTION FOR LARGE NUMBER FORMATTING ---
const formatLargeNumber = (num: number | null | undefined, decimals: number = 2) => {
  if (num === null || num === undefined) return 'N/A';

  if (num >= 1e12) return (num / 1e12).toFixed(decimals) + 'T'; // Trillions
  if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';   // Billions
  if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';   // Millions

  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
};

// --- 1. GRAPHQL QUERY (UPDATED WITH ALL NEW FIELDS) ---
const GET_STOCK_ANALYSIS = gql`
  query GetStockAnalysis($ticker: String!, $duration: Int!, $unit: String!) {
    analyzeStock(ticker: $ticker, duration: $duration, unit: $unit) {
      message
      error
      receivedTicker
      signalScore
      scoreInterpretation
      latestPrice
      isStatisticallySignificant

      probability

      indicators {
        # Moving Averages and Momentum
        sma50
        ema20
        rsi
        macdLine
        macdSignal
        macdHistogram

        # Volatility and Bands
        volatility
        bbMiddle
        bbUpper
        bbLower
        percentageChangeFromMean
        atr

        # Signals
        rsiSignal
        macdSignalInterpretation
        bollingerBandSignal
        sentiment

        # Volume
        latestVolume
        volume20DayAvg

        # Fundamentals
        marketCap
        latestNetIncome
        peRatioTtm
        latestClosePrice
        sharesOutstanding
        sp500PeProxy
      }

      historicalPrices {
        date
        close
      }
    }
  }
`;

// --- 2. UPDATED INTERFACES ---

interface HistoricalPrice {
  date: string;
  close: number;
}

// UPDATED INTERFACE to match the full backend model
interface TechnicalIndicators {
  // Indicator Values
  sma50: number | null;
  ema20: number | null;
  rsi: number | null;
  macdLine: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  bbMiddle: number | null;
  bbUpper: number | null;
  bbLower: number | null;
  percentageChangeFromMean: number | null;
  atr: number | null;

  // Signals derived from indicators
  rsiSignal: string | null;
  macdSignalInterpretation: string | null;
  bollingerBandSignal: string | null;

  latestVolume: number | null;
  volume20DayAvg: number[] | null;
  marketCap: number | null;
  volatility: number | null;
  sentiment: number | null;
  latestClosePrice: number | null;
  latestNetIncome: number | null;
  peRatioTtm: number | null;
  sharesOutstanding: number | null;
  sp500PeProxy: number | null;
}


interface StockAnalysisResult {
  message: string;
  error: string | null;
  receivedTicker: string;
  signalScore: number | null;
  scoreInterpretation: string | null;
  latestPrice: number | null;
  isStatisticallySignificant: boolean | null;

  // CHANGED: Replacing 'indicatorValues', 'rsiSignal', 'macdSignal', 'bollingerBandSignal'
  // with the single, nested 'indicators' object.
  indicators: TechnicalIndicators | null;

  historicalPrices: HistoricalPrice[] | null;
}

interface GetStockAnalysisData {
  analyzeStock: StockAnalysisResult;
}

// --- 3. STOCK CHART COMPONENT ---

// Define the props interface for the StockChart component.
interface StockChartProps {
    data: HistoricalPrice[] | null;
}

// A custom tooltip component for Recharts to display a nice, formatted output.
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const formattedDate = new Date(label).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return (
            <div className="bg-white p-2 border border-gray-300 rounded shadow-lg text-sm">
                <p className="text-gray-900 font-semibold">{formattedDate}</p>
                <p className="text-indigo-600">Price: ${payload[0].value.toFixed(2)}</p>
            </div>
        );
    }
    return null;
};

// To display the dates nicely on the X-axis, we'll format them.
const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    // Format as Month/Day
    return `${date.getMonth() + 1}/${date.getDate()}`;
};

// --- 4. MAIN APPLICATION COMPONENT ---

const StockAnalysis: React.FC = () => {
  const [ticker, setTicker] = useState<string>('AAPL');
  const [duration, setDuration] = useState<number>(3);
  const [unit, setUnit] = useState<string>('month');
  const [submitted, setSubmitted] = useState<boolean>(false);

  // useLazyQuery is now the mock function defined above.
  const [executeSearch, { loading, error, data, called }] = useLazyQuery(GET_STOCK_ANALYSIS);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    executeSearch({ variables: { ticker, duration, unit } });
  };

  const renderAnalysisResult = () => {
    if (loading) return <p className="text-center text-gray-600">Loading stock analysis...</p>;
    if (error) return <p className="text-center text-red-600">Error: {error.message}</p>;

    const analysis = data?.analyzeStock;

    if (!analysis) return (
      <div className="p-6 bg-white rounded-xl shadow-md">
        <p className="text-center text-gray-500">
            {submitted ?
                "No analysis data found, likely due to a connection error. Please try again." :
                "Your stock analysis results will appear here after you submit."
            }
        </p>
      </div>
    );

    // Simplify access to the nested indicators
    const indicators = analysis.indicators;
    // Calculate the 20-day average volume from the array
    const avgVolume = indicators?.volume20DayAvg
      ? indicators.volume20DayAvg.reduce((sum, val) => sum + val, 0) / indicators.volume20DayAvg.length
      : null;

    // Helper function for formatting volatility as percentage
    const formatVolatility = (vol: number | null) => vol !== null ? (vol * 100)?.toFixed(2) + '%' : 'N/A';

    return (
      <div className="space-y-6">
        {/* Card for Historical Price Chart */}
        {analysis.historicalPrices && analysis.historicalPrices.length > 0 && (
          <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
            <h4 className="text-xl font-bold text-indigo-700 mb-4">Historical Price Chart</h4>
            <StockChart data={analysis.historicalPrices} />
          </div>
        )}

        {/* Card for Key Data and Statistical Analysis */}
        <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
          <h4 className="text-xl font-bold text-indigo-700 mb-4">Key Data</h4>
          <p className="text-gray-800 text-lg font-medium mb-2">
            <span className="font-bold">Latest Price:</span> ${analysis.latestPrice?.toFixed(2) || 'N/A'}
          </p>
          <p className="text-gray-700 mb-2">{analysis.message}</p>
          {analysis.isStatisticallySignificant !== null && (
            <p className="text-gray-700 mb-2">
              <span className="font-bold">Statistically Significant:</span>{" "}
              <strong className={`${analysis.isStatisticallySignificant ? 'text-green-600' : 'text-red-600'}`}>
                {analysis.isStatisticallySignificant ? "Yes" : "No"}
              </strong>
            </p>
          )}
        </div>

        {/* Card for Technical and Fundamental Indicators (UPDATED RENDERING) */}
        <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
          <h4 className="text-xl font-bold text-indigo-700 mb-4">Technical & Fundamental Indicators</h4>

          {indicators ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-gray-700">
                {/* --- 1. Momentum & Trend (New Column) --- */}
                <div>
                    <h5 className="font-bold text-lg text-gray-900 mb-2 border-b-2 pb-1 text-indigo-600">Trend & Momentum</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li><span className="font-medium">SMA50:</span> {indicators.sma50?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">EMA20:</span> {indicators.ema20?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">RSI:</span> {indicators.rsi?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">RSI Signal:</span> {indicators.rsiSignal || 'N/A'}</li>
                      <li><span className="font-medium">MACD Line:</span> {indicators.macdLine?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">MACD Signal:</span> {indicators.macdSignal?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">MACD Hist:</span> {indicators.macdHistogram?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">MACD Interpretation:</span> {indicators.macdSignalInterpretation || 'N/A'}</li>
                    </ul>
                </div>

                {/* --- 2. Volatility & Price Action (New Column) --- */}
                <div>
                    <h5 className="font-bold text-lg text-gray-900 mb-2 border-b-2 pb-1 text-indigo-600">Volatility & Volume</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li><span className="font-medium">Volatility:</span> {formatVolatility(indicators.volatility)}</li>
                      <li><span className="font-medium">ATR:</span> {indicators.atr?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">BB Upper:</span> {indicators.bbUpper?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">BB Middle:</span> {indicators.bbMiddle?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">BB Lower:</span> {indicators.bbLower?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">BB Signal:</span> {indicators.bollingerBandSignal || 'N/A'}</li>
                      <li><span className="font-medium">% Change from Mean:</span> {indicators.percentageChangeFromMean !== null ? (indicators.percentageChangeFromMean * 100)?.toFixed(2) + '%' : 'N/A'}</li>
                      <li><span className="font-medium">Latest Volume:</span> {formatLargeNumber(indicators.latestVolume, 0)}</li>
                      <li><span className="font-medium">Avg. Volume (20D):</span> {formatLargeNumber(avgVolume, 0)}</li>
                    </ul>
                </div>

                {/* --- 3. Fundamental Metrics & Sentiment (New Column) --- */}
                <div>
                    <h5 className="font-bold text-lg text-gray-900 mb-2 border-b-2 pb-1 text-indigo-600">Fundamentals & Sentiment</h5>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li><span className="font-medium">Market Cap:</span> **{formatLargeNumber(indicators.marketCap)}**</li>
                      <li><span className="font-medium">P/E Ratio (TTM):</span> {indicators.peRatioTtm?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">Net Income:</span> **{formatLargeNumber(indicators.latestNetIncome)}**</li>
                      <li><span className="font-medium">Shares Outstanding:</span> {formatLargeNumber(indicators.sharesOutstanding, 0)}</li>
                      <li><span className="font-medium">S&P 500 P/E Proxy:</span> {indicators.sp500PeProxy?.toFixed(2) || 'N/A'}</li>
                      <li className="pt-2 border-t mt-2"><span className="font-medium">Latest Close Price:</span> ${indicators.latestClosePrice?.toFixed(2) || 'N/A'}</li>
                      <li><span className="font-medium">Sentiment Score:</span> {indicators.sentiment?.toFixed(4) || 'N/A'}</li>
                    </ul>
                </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No technical or fundamental data available (likely insufficient data).</p>
          )}
        </div>

        {analysis.error && (
          <p className="text-red-600 mt-2">Analysis Error: {analysis.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen p-8 font-sans bg-gray-50">
      {/* Container for the form and results */}
      <div className="flex flex-col lg:flex-row lg:space-x-8 lg:items-start w-full max-w-7xl mx-auto">
        {/* Left column for the form and overall score */}
        <div className="flex-shrink-0 mb-6 lg:mb-0 w-full lg:w-1/3 space-y-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 border border-gray-200 rounded-xl shadow-lg bg-white">
            <h2 className="text-3xl font-extrabold text-center text-indigo-800 mb-2">Stock Lookup</h2>
            <div>
              <label htmlFor="tickerInput" className="block text-gray-700 text-sm font-semibold mb-2">Stock Ticker:</label>
              <input
                id="tickerInput"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g., AAPL, GOOGL"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="durationInput" className="block text-gray-700 text-sm font-semibold mb-2">Duration Value:</label>
                <input
                  id="durationInput"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                  min="1"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200"
                />
              </div>

              <div className="flex-1">
                <label htmlFor="unitSelect" className="block text-gray-700 text-sm font-semibold mb-2">Duration Unit:</label>
                <select
                  id="unitSelect"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition duration-200 bg-white"
                >
                  <option value="day">Day(s)</option>
                  <option value="week">Week(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200"
            >
              Analyze Stock
            </button>
          </form>

          {/* Card for Overall Signal Score (Includes Probability) */}
          {submitted && !loading && !error && data?.analyzeStock.signalScore !== null && (
            <div className="p-6 border border-gray-200 rounded-xl shadow-lg bg-white">
              <h4 className="text-xl font-bold text-indigo-700 mb-4">Overall Signal Score</h4>

              <div className="flex flex-col space-y-2">
                {/* Score */}
                <p className="text-gray-700 text-3xl font-bold">
                    Score: {data?.analyzeStock.signalScore}
                </p>

                {/* Interpretation */}
                <p className="text-gray-700 text-xl font-semibold">
                    Interpretation:
                    <span className={`ml-2
                        ${data?.analyzeStock.scoreInterpretation === 'Strong Buy' ? 'text-green-700' : ''}
                        ${data?.analyzeStock.scoreInterpretation === 'Buy' ? 'text-green-500' : ''}
                        ${data?.analyzeStock.scoreInterpretation === 'Neutral' ? 'text-gray-500' : ''}
                        ${data?.analyzeStock.scoreInterpretation === 'Sell' ? 'text-orange-500' : ''}
                        ${data?.analyzeStock.scoreInterpretation === 'Strong Sell' ? 'text-red-700' : ''}
                    `}>
                        {data?.analyzeStock.scoreInterpretation || 'N/A'}
                    </span>
                </p>

                {/* Probability (New block) */}
                {data?.analyzeStock.probability !== null && data?.analyzeStock.probability !== undefined && (
                    <p className="text-gray-700 text-xl font-semibold pt-2 border-t mt-2">
                        Probability:
                        <span
                            className={`ml-2
                                ${(data.analyzeStock.probability * 100) > 75 ? 'text-green-600' : // High Probability (> 75%)
                                (data.analyzeStock.probability * 100) < 25 ? 'text-red-600' : // Low Probability (< 25%)
                                'text-gray-500'} // Neutral Probability
                            `}
                        >
                            {(data.analyzeStock.probability * 100).toFixed(2)}%
                        </span>
                    </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column for the results */}
        <div className="lg:w-2/3 flex-1">
          {submitted ? (
            renderAnalysisResult()
          ) : (
            <div className="bg-white p-6 rounded-xl shadow-md h-full flex items-center justify-center">
              <p className="text-center text-lg text-gray-500">Your stock analysis results will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAnalysis;