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

function InputBox() {
  return (
    <div className="input-box">
      <InputEntry text='WETH'/>
      <InputEntry text='LDX'/>
      <button className="swap-button">Swap</button>
    </div>
  );
}

function InputEntry(props) {
  return (
    <div className="input-group">
      <TokenInput/>
      <TokenLabel text={props.text}/>
    </div>
  )
}

function TokenInput() {
  return (
    <input type="text" placeholder="Enter amount" />
  )
}

function TokenLabel(props) {
  return (
    <span className="input-label">{props.text}</span>
  )
}

function App() {
    return (
      <div className="App">
        <AppHeader/>
        <main className="App-main">
          <InputBox/>
        </main>
      </div>
    )
}

export default App;