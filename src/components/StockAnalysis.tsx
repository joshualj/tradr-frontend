import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';
// Import the StockChart component
import StockChart from './StockChart';

// Define the GraphQL query with the new 'historicalPrices' field
const GET_STOCK_ANALYSIS = gql`
  query GetStockAnalysis($ticker: String!, $duration: Int!, $unit: String!) {
    analyzeStock(ticker: $ticker, duration: $duration, unit: $unit) {
      message
      receivedTicker
      receivedDurationValue
      receivedDurationUnit
      isStatisticallySignificant
      pValue
      error
      latestPrice
      indicatorValues {
        SMA50
        RSI
        MACD_Line
        MACD_Signal
        MACD_Histogram
        BB_Middle
        BB_Upper
        BB_Lower
      }
      rsiSignal
      macdSignal
      bollingerBandSignal
      signalScore
      scoreInterpretation
      historicalPrices {
        date
        close
      }
    }
  }
`;

// Define the new interface for historical prices
interface HistoricalPrice {
  date: string;
  close: number;
}

// Update the main interface to include the new field
interface StockAnalysisResult {
  message: string;
  receivedTicker: string;
  receivedDurationValue: number;
  receivedDurationUnit: string;
  isStatisticallySignificant: boolean | null;
  pValue: number | null;
  error: string | null;
  latestPrice: number | null;
  indicatorValues: {
    SMA50?: number;
    RSI?: number;
    MACD_Line?: number;
    MACD_Signal?: number;
    MACD_Histogram?: number;
    BB_Middle?: number;
    BB_Upper?: number;
    BB_Lower?: number;
    [key: string]: number | undefined;
  } | null;
  rsiSignal: string | null;
  macdSignal: string | null;
  bollingerBandSignal: string | null;
  signalScore: number | null;
  scoreInterpretation: string | null;
  historicalPrices: HistoricalPrice[] | null;
}

interface GetStockAnalysisData {
  analyzeStock: StockAnalysisResult;
}

const StockAnalysis: React.FC = () => {
  const [ticker, setTicker] = useState<string>('AAPL');
  const [duration, setDuration] = useState<number>(3);
  const [unit, setUnit] = useState<string>('month');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const [executeSearch, { loading, error, data, called }] = useLazyQuery<GetStockAnalysisData>(GET_STOCK_ANALYSIS);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    executeSearch({ variables: { ticker, duration, unit } });
  };

  const renderAnalysisResult = () => {
    if (loading) return <p className="text-center text-gray-600">Loading stock analysis...</p>;
    if (error) return <p className="text-center text-red-600">Error: {error.message}</p>;

    const analysis = data?.analyzeStock;

    if (!analysis) return <p className="text-center text-gray-500">No analysis data found.</p>;

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
          {analysis.pValue !== null && (
            <p className="text-gray-700">
              <span className="font-bold">P-Value:</span> <strong className="text-indigo-800">{analysis.pValue.toFixed(4)}</strong>
            </p>
          )}
        </div>

        {/* Card for Technical Indicators */}
        <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
          <h4 className="text-xl font-bold text-indigo-700 mb-4">Technical Indicators</h4>
          {analysis.indicatorValues && Object.keys(analysis.indicatorValues).length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
              {analysis.indicatorValues.SMA50 !== undefined && (
                <li><span className="font-medium">SMA50:</span> {analysis.indicatorValues.SMA50?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.RSI !== undefined && (
                <li><span className="font-medium">RSI:</span> {analysis.indicatorValues.RSI?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.MACD_Line !== undefined && (
                <li><span className="font-medium">MACD Line:</span> {analysis.indicatorValues.MACD_Line?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.MACD_Signal !== undefined && (
                <li><span className="font-medium">MACD Signal:</span> {analysis.indicatorValues.MACD_Signal?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.MACD_Histogram !== undefined && (
                <li><span className="font-medium">MACD Histogram:</span> {analysis.indicatorValues.MACD_Histogram?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.BB_Middle !== undefined && (
                <li><span className="font-medium">BB Middle:</span> {analysis.indicatorValues.BB_Middle?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.BB_Upper !== undefined && (
                <li><span className="font-medium">BB Upper:</span> {analysis.indicatorValues.BB_Upper?.toFixed(2) || 'N/A'}</li>
              )}
              {analysis.indicatorValues.BB_Lower !== undefined && (
                <li><span className="font-medium">BB Lower:</span> {analysis.indicatorValues.BB_Lower?.toFixed(2) || 'N/A'}</li>
              )}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No technical indicator values available (likely insufficient data).</p>
          )}
        </div>

        {/* Card for Signal Interpretation */}
        <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
          <h4 className="text-xl font-bold text-indigo-700 mb-4">Signal Interpretation</h4>
          <ul className="list-disc list-inside text-gray-700 ml-4 space-y-1">
            <li><span className="font-medium">RSI Signal:</span> {analysis.rsiSignal || 'N/A'}</li>
            <li><span className="font-medium">MACD Signal:</span> {analysis.macdSignal || 'N/A'}</li>
            <li><span className="font-medium">Bollinger Band Signal:</span> {analysis.bollingerBandSignal || 'N/A'}</li>
          </ul>
        </div>
        
        {analysis.error && (
          <p className="text-red-600 mt-2">Analysis Error: {analysis.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen p-8 font-sans">
      {/* Container for the form and results */}
      <div className="flex flex-col lg:flex-row lg:space-x-8 lg:items-start w-full">
        {/* Left column for the form and overall score */}
        <div className="flex-shrink-0 mb-6 lg:mb-0 w-full lg:w-1/3 space-y-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 border border-gray-200 rounded-xl shadow-md bg-white">
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

          {/* Moved Card for Overall Signal Score */}
          {submitted && !loading && !error && data?.analyzeStock.signalScore !== null && (
            <div className="p-6 border border-gray-200 rounded-xl shadow-md bg-white">
              <h4 className="text-xl font-bold text-indigo-700 mb-4">Overall Signal Score</h4>
              <p className="text-gray-700 text-3xl font-bold">
                Score: {data?.analyzeStock.signalScore} -{" "}
                <span className={`
                  ${data?.analyzeStock.scoreInterpretation === 'Strong Buy' ? 'text-green-700' : ''}
                  ${data?.analyzeStock.scoreInterpretation === 'Buy' ? 'text-green-500' : ''}
                  ${data?.analyzeStock.scoreInterpretation === 'Neutral' ? 'text-gray-500' : ''}
                  ${data?.analyzeStock.scoreInterpretation === 'Sell' ? 'text-orange-500' : ''}
                  ${data?.analyzeStock.scoreInterpretation === 'Strong Sell' ? 'text-red-700' : ''}
                `}>
                  {data?.analyzeStock.scoreInterpretation || 'N/A'}
                </span>
              </p>
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