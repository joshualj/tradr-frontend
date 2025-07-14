// tradr-web-app/src/App.tsx

import './App.css'; // Keep your CSS import if you have any
import StockAnalysis from './components/StockAnalysis'; // Import your new component

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Tradr Stock Analysis Platform</h1>
      </header>
      <main>
        <StockAnalysis /> {/* Render your new component here */}
      </main>
    </div>
  );
}

export default App;