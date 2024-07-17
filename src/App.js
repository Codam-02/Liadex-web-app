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
        <div className='header-right'>
          <WalletButton/>
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

function WalletButton() {
  return (
    <button className="wallet-button">Connect Metamask</button>
  )
}

function SwapBox() {
  return (
    <div className="swap-box">
      <div className="input-group">
        <input type="text" placeholder="Enter quantity" />
        <span className="input-label">LDX</span>
      </div>
      <div className="input-group">
        <input type="text" placeholder="Enter quantity" />
        <span className="input-label">WETH</span>
      </div>
      <button className="swap-button">Swap</button>
    </div>
  );
}

function App() {
    return (
      <div className="App">
        <AppHeader/>
        <main className="App-main">
          <SwapBox/>
        </main>
      </div>
    )
}

export default App;