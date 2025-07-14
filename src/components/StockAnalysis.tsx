// tradr-web-app/src/components/StockAnalysis.tsx

import React, { useState } from 'react'; // Import useState
import { gql, useLazyQuery } from '@apollo/client'; // Use useLazyQuery for manual trigger

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
  // 1. State variables for user inputs
  const [ticker, setTicker] = useState<string>('AAPL');
  const [duration, setDuration] = useState<number>(3);
  const [unit, setUnit] = useState<string>('month');
  const [submitted, setSubmitted] = useState<boolean>(false); // To control when to show results

  // 2. Use useLazyQuery for manual query triggering
  //    It returns a function (executeSearch) to trigger the query, and query results.
  const [executeSearch, { loading, error, data, called }] = useLazyQuery<GetStockAnalysisData>(GET_STOCK_ANALYSIS);

  // 3. Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission behavior (page reload)
    setSubmitted(true); // Mark that a submission has occurred
    executeSearch({ variables: { ticker, duration, unit } }); // Trigger the query with current state
  };

  // Helper function to render analysis results
  const renderAnalysisResult = () => {
    if (!called && !submitted) return null; // Don't show anything until first search attempt
    if (loading) return <p>Loading stock analysis...</p>;
    if (error) return <p style={{ color: 'red' }}>Error: {error.message}</p>;

    const analysis = data?.analyzeStock;

    if (!analysis) return <p>No analysis data found.</p>;

    return (
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Analysis Results for {analysis.receivedTicker}</h3>
        <p>{analysis.message}</p>
        {analysis.isStatisticallySignificant !== null && (
          <p>
            Statistically Significant:{" "}
            <strong>{analysis.isStatisticallySignificant ? "Yes" : "No"}</strong>
          </p>
        )}
        {analysis.pValue !== null && (
          <p>
            P-Value: <strong>{analysis.pValue.toFixed(4)}</strong>
          </p>
        )}
        {analysis.error && (
          <p style={{ color: 'red' }}>Analysis Error: {analysis.error}</p>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto' }}>
      <h2>Stock Analysis Tool</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <div>
          <label htmlFor="tickerInput" style={{ display: 'block', marginBottom: '5px' }}>Stock Ticker:</label>
          <input
            id="tickerInput"
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g., AAPL, GOOGL"
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="durationInput" style={{ display: 'block', marginBottom: '5px' }}>Duration Value:</label>
            <input
              id="durationInput"
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)} // Parse to integer
              min="1"
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="unitSelect" style={{ display: 'block', marginBottom: '5px' }}>Duration Unit:</label>
            <select
              id="unitSelect"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
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
          style={{ padding: '10px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          Analyze Stock
        </button>
      </form>

      {/* Render results based on state */}
      {renderAnalysisResult()}
    </div>
  );
};

export default StockAnalysis;