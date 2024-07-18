import './App.css'
import { useState, useEffect } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(faRightLeft);

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
      <FontAwesomeIcon className='invert-icon' icon="fa-solid fa-right-left" rotation={90}/>
      <InputEntry text='LDX'/>
      <ConfirmButton text='Swap'/>
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

function ConfirmButton(props) {
  return (
    <button className="confirm-button">{props.text}</button>
  )
}

function MainContent(props) {
  if (props.state === 'Swap') {
    return (
      <main className="App-main">
        <InputBox/>
      </main>
    )
  }
}

function App() {
  const [pageState, setPageState] = useState('Swap');
  return (
    <div className="App">
      <AppHeader/>
      <MainContent state={pageState}/>
    </div>
  )
}

export default App;