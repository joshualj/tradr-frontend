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
        <p className="text-gray-700 mb-1">{analysis.message}</p>
        {analysis.isStatisticallySignificant !== null && (
          <p className="text-gray-700 mb-1">
            Statistically Significant:{" "}
            <strong className={`${analysis.isStatisticallySignificant ? 'text-green-600' : 'text-red-600'}`}>
              {analysis.isStatisticallySignificant ? "Yes" : "No"}
            </strong>
          </p>
        )}
        {analysis.pValue !== null && (
          <p className="text-gray-700">
            P-Value: <strong className="text-indigo-800">{analysis.pValue.toFixed(4)}</strong>
          </p>
        )}
        {analysis.error && (
          <p className="text-red-600 mt-2">Analysis Error: {analysis.error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">Individual Stock Lookup</h2>

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
