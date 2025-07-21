// tradr-web-app/src/components/StockAnalysis.tsx

import React, { useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

// Define your GraphQL query using gql tag
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
      # --- FIX: Explicitly request subfields for indicatorValues ---
      indicatorValues {
        SMA50
        RSI
        MACD_Line
        MACD_Signal
        MACD_Histogram
        BB_Middle
        BB_Upper
        BB_Lower
        # Add any other indicator fields here if you expand your IndicatorValues type in schema.ts
      }
      # --- END FIX ---
      rsiSignal
      macdSignal
      bollingerBandSignal
      signalScore
      scoreInterpretation
    }
  }
`;

interface StockAnalysisResult {
  message: string;
  receivedTicker: string;
  receivedDurationValue: number;
  receivedDurationUnit: string;
  isStatisticallySignificant: boolean | null;
  pValue: number | null;
  error: string | null;
  latestPrice: number | null;
  // Update the interface to reflect the nested structure
  indicatorValues: {
    SMA50?: number;
    RSI?: number;
    MACD_Line?: number;
    MACD_Signal?: number;
    MACD_Histogram?: number;
    BB_Middle?: number;
    BB_Upper?: number;
    BB_Lower?: number;
    [key: string]: number | undefined; // Allow for other potential indicator keys if needed
  } | null;
  rsiSignal: string | null;
  macdSignal: string | null;
  bollingerBandSignal: string | null;
  signalScore: number | null;
  scoreInterpretation: string | null;
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
    if (!called && !submitted) return null;
    if (loading) return <p className="text-center text-gray-600">Loading stock analysis...</p>;
    if (error) return <p className="text-center text-red-600">Error: {error.message}</p>;

    const analysis = data?.analyzeStock;

    if (!analysis) return <p className="text-center text-gray-500">No analysis data found.</p>;

    return (
      <div className="mt-6 p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
        <h3 className="text-xl font-semibold text-indigo-700 mb-2">Analysis Results for {analysis.receivedTicker}</h3>
        
        {/* Basic Statistical Analysis */}
        <div className="mb-4">
          <p className="text-gray-700 mb-1">
            <span className="font-semibold">Latest Price:</span> ${analysis.latestPrice?.toFixed(2) || 'N/A'}
          </p>
          <p className="text-gray-700 mb-1">{analysis.message}</p>
          {analysis.isStatisticallySignificant !== null && (
            <p className="text-gray-700 mb-1">
              <span className="font-semibold">Statistically Significant:</span>{" "}
              <strong className={`${analysis.isStatisticallySignificant ? 'text-green-600' : 'text-red-600'}`}>
                {analysis.isStatisticallySignificant ? "Yes" : "No"}
              </strong>
            </p>
          )}
          {analysis.pValue !== null && (
            <p className="text-gray-700">
              <span className="font-semibold">P-Value:</span> <strong className="text-indigo-800">{analysis.pValue.toFixed(4)}</strong>
            </p>
          )}
        </div>

        {/* Technical Indicators */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-indigo-600 mb-2">Technical Indicators:</h4>
          {analysis.indicatorValues && Object.keys(analysis.indicatorValues).length > 0 ? (
            <ul className="list-disc list-inside text-gray-700 ml-4">
              {/* Iterate over the specific indicator fields */}
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
              {/* If you have other dynamic keys, you might need a more generic loop or a custom scalar */}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No technical indicator values available (likely insufficient data).</p>
          )}
        </div>

        {/* Signal Interpretation */}
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-indigo-600 mb-2">Signal Interpretation:</h4>
          <ul className="list-disc list-inside text-gray-700 ml-4">
            <li><span className="font-medium">RSI Signal:</span> {analysis.rsiSignal || 'N/A'}</li>
            <li><span className="font-medium">MACD Signal:</span> {analysis.macdSignal || 'N/A'}</li>
            <li><span className="font-medium">Bollinger Band Signal:</span> {analysis.bollingerBandSignal || 'N/A'}</li>
          </ul>
        </div>

        {/* Overall Signal Score */}
        <div>
          <h4 className="text-lg font-semibold text-indigo-600 mb-2">Overall Signal Score:</h4>
          <p className="text-gray-700 text-xl font-bold">
            Score: {analysis.signalScore !== null ? analysis.signalScore : 'N/A'} -{" "}
            <span className={`
              ${analysis.scoreInterpretation === 'Strong Buy' ? 'text-green-700' : ''}
              ${analysis.scoreInterpretation === 'Buy' ? 'text-green-500' : ''}
              ${analysis.scoreInterpretation === 'Neutral' ? 'text-gray-500' : ''}
              ${analysis.scoreInterpretation === 'Sell' ? 'text-orange-500' : ''}
              ${analysis.scoreInterpretation === 'Strong Sell' ? 'text-red-700' : ''}
            `}>
              {analysis.scoreInterpretation || 'N/A'}
            </span>
          </p>
        </div>

        {analysis.error && (
          <p className="text-red-600 mt-2">Analysis Error: {analysis.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Stock Lookup</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5 border border-gray-200 rounded-xl shadow-md bg-white">
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

      {renderAnalysisResult()}
    </div>
  );
};

export default StockAnalysis;
