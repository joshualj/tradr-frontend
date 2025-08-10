// tradr-web-app/src/components/StockChart.tsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// This is a new, self-contained component for displaying the historical price chart.
// It uses Recharts, a popular library for data visualization in React.
// To use Recharts, you would first need to install it:
// `npm install recharts`

// Define a type for the data this component expects.
interface HistoricalPrice {
  date: string;
  close: number;
}

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

// The main StockChart functional component.
const StockChart: React.FC<StockChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg shadow-inner">
        <p className="text-gray-500 italic">Historical price data not available.</p>
      </div>
    );
  }

  // To display the dates nicely on the X-axis, we'll format them.
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow-md border border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="date" tickFormatter={formatXAxis} stroke="#6b7280" />
          <YAxis stroke="#6b7280" domain={['auto', 'auto']} />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#4f46e5" 
            strokeWidth={2}
            dot={false}
            name="Closing Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;