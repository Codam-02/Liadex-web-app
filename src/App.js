import './App.css'

function App() {
    return (
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <div className="header-left">
              <h1>LiaDex</h1>
            </div>
            <div className="header-center">
              <button className="header-button">Swap</button>
              <button className="header-button">Liquidity Pools</button>
            </div>
          </div>
        </header>
        <main className="App-main">
          <div className="swap-box">
            <h2>Swap Tokens</h2>
            <input type="number" placeholder="Enter quantity" />
            <button className="swap-button">Swap</button>
          </div>
        </main>
      </div>
    );
  }

export default App;