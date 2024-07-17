import './App.css'

function AppHeader() {
  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-left">
          <Title/>
        </div>
        <div className="header-center">
          <HeaderButton text='Swap'></HeaderButton>
          <HeaderButton text='Ether wrapper'></HeaderButton>
          <HeaderButton text='Liquidity pools'></HeaderButton>
        </div>
      </div>
    </header>
  )
}

function Title() {
  return (
    <h1>LiaDex</h1>
  ) 
}

function HeaderButton(props) {
  return (
    <button className="header-button">{props.text}</button>
  )
}

function App() {
    return (
      <div className="App">
        <AppHeader/>
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