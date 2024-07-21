import './App.css'
import { useState, useEffect } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import contracts from './contractAddresses.json';
import { ethers } from 'ethers';

library.add(faRightLeft);

function AppHeader(props) {
  return (
    <header className="App-header">
      <div className="header-content">
        <div className="header-left">
          <Title/>
        </div>
        <div className="header-center">
          <HeaderButton text='Swap' onClick={() => props.setPageState('Swap')}></HeaderButton>
          <HeaderButton text='Ether wrapper' onClick={() => props.setPageState('Ether wrapper')}></HeaderButton>
          <HeaderButton text='Liquidity pools' onClick={() => props.setPageState('Liquidity pools')}></HeaderButton>
        </div>
        <div className='header-right'>
          <WalletSection contracts={props.contracts} connectedAccount={props.connectedAccount} setConnectedAccount={props.setConnectedAccount} setWethLiquidity={props.setWethLiquidity} setLdxLiquidity={props.setLdxLiquidity}/>
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
    <button className="header-button" onClick={props.onClick}>{props.text}</button>
  )
}

function WalletSection(props) {
  const [ethBalance, setEthBalance] = useState(null);
  const [wethBalance, setWethBalance] = useState(null);
  const [ldxBalance, setLdxBalance] = useState(null);

  if (props.connectedAccount === null) {
    return (
      <WalletButton contracts={props.contracts} connectedAccount={props.connectedAccount} setConnectedAccount={props.setConnectedAccount} setEthBalance={setEthBalance} setWethBalance={setWethBalance} setLdxBalance={setLdxBalance} setWethLiquidity={props.setWethLiquidity} setLdxLiquidity={props.setLdxLiquidity}/>
    )
  }
  return (
    <WalletData ethBalance={ethBalance} wethBalance={wethBalance} ldxBalance={ldxBalance}/>
  )
}

function WalletButton(props) {
  const wrapperContract = props.contracts.wrapperContract;
  const liadexContract = props.contracts.liadexContract;
  const tradingPairContract = props.contracts.tradingPairContract;

  async function connectWallet() {
    if (window.ethereum) {
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
  
        // Check if Sepolia testnet is added and switch to it
        const sepoliaChainId = '0xaa36a7'; // Sepolia testnet chain ID in hexadecimal
  
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
          console.log('Switched to Sepolia testnet');
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Test Network',
                    nativeCurrency: {
                      name: 'Sepolia ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
              console.log('Sepolia testnet added and switched');
            } catch (addError) {
              console.error('Failed to add Sepolia testnet:', addError);
            }
          } else {
            console.error('Failed to switch to Sepolia testnet:', switchError);
          }
        }
  
        // Create an ethers provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Get the signer
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        
        const wethContract = new ethers.Contract(wrapperContract.address, wrapperContract.abi, provider);
        const ldxContract = new ethers.Contract(liadexContract.address, liadexContract.abi, provider);
        const tradingPair = new ethers.Contract(tradingPairContract.address, tradingPairContract.abi, provider)

        const wethBalance_ = await wethContract.balanceOf(signerAddress);
        const formattedWethBalance = parseFloat(ethers.formatEther(wethBalance_)).toFixed(4);
        props.setWethBalance(formattedWethBalance);
        
        const ethBalance_ = await provider.getBalance(signerAddress);
        const formattedEthBalance = parseFloat(ethers.formatEther(ethBalance_)).toFixed(4);
        props.setEthBalance(formattedEthBalance);

        const ldxBalance_ = await ldxContract.balanceOf(signerAddress);
        const formattedLdxBalance = parseFloat(ethers.formatEther(ldxBalance_)).toFixed(4);
        props.setLdxBalance(formattedLdxBalance);

        const liquidityTokenBalance = await tradingPair.balanceOf(signerAddress);
        const liquidityTokenSupply = await tradingPair.totalSupply();
        const [reserveA, reserveB] = await tradingPair.getReserves();
        const tokenAProvided = ((liquidityTokenBalance * reserveA) / liquidityTokenSupply);
        const tokenBProvided = ((liquidityTokenBalance * reserveB) / liquidityTokenSupply);
        const formattedTokenAProvided = parseFloat(ethers.formatEther(tokenAProvided));
        const formattedTokenBProvided = parseFloat(ethers.formatEther(tokenBProvided));
        props.setWethLiquidity(formattedTokenAProvided > 0.0001 ? (formattedTokenAProvided - 0.0001).toFixed(4) : formattedTokenAProvided.toFixed(4));
        props.setLdxLiquidity(formattedTokenBProvided > 0.0001 ? (formattedTokenBProvided - 0.0001).toFixed(4) : formattedTokenBProvided.toFixed(4));

        // Get the user's account
        const address = await signer.getAddress();
        props.setConnectedAccount(address);
  
        console.log('Connected account:', address);
        props.walletHook();
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    } else {
      console.error('MetaMask is not installed');
    }
  };

  return (
    <button className="wallet-button" onClick={connectWallet}>Connect Metamask</button>
  )
}

function WalletData(props) {
  return (
    <div className='wallet-data'>
      <WalletDataEntry currency='ETH' text={props.ethBalance}/>
      <WalletDataEntry currency='WETH' text={props.wethBalance}/>
      <WalletDataEntry currency='LDX' text={props.ldxBalance}/>
    </div>
  )
}

function WalletDataEntry(props) {
  return (
    <span className='wallet-data-entry'>{props.currency} {props.text}</span>
  )
}

function SwapBox(props) {
  return (
    <div className="input-box">
      <InputEntry text={props.invertedInputs ? 'LDX' : 'WETH'} input={props.input1} setInput={props.setInput1}/>
      <FontAwesomeIcon className='invert-icon' icon="fa-solid fa-right-left" rotation={90} onClick={() => props.setInvertedInputs(!props.invertedInputs)}/>
      <InputEntry text={props.invertedInputs ? 'WETH' : 'LDX'}  input={props.input2} setInput={props.setInput2}/>
      <ConfirmButton text='Swap'/>
    </div>
  )
}

function WrapperBox(props) {
  const {invertedInputs, setInvertedInputs, input1, input2, setInput1, setInput2} = props;
  useEffect(() => {
    setInput2(input1);
  }, [input1]);
  useEffect(() => {
    setInput1(input2);
  }, [input2]);

  return (
    <div className="input-box">
      <InputEntry text={invertedInputs ? 'WETH' : 'ETH'} input={input1} setInput={setInput1}/>
      <FontAwesomeIcon className='invert-icon' icon="fa-solid fa-right-left" rotation={90} onClick={() => setInvertedInputs(!invertedInputs)}/>
      <InputEntry text={invertedInputs ? 'ETH' : 'WETH'}  input={input2} setInput={setInput2}/>
      <ConfirmButton text={invertedInputs ? 'Unwrap' : 'Wrap'}/>
    </div>
  )
}

function AddLiquidityBox(props) {
  return (
      <div className="input-box">
        <InputEntry text='WETH' input={props.input1} setInput={props.setInput1}/>
        <InputEntry text='LDX'  input={props.input2} setInput={props.setInput2}/>
        <ConfirmButton text='Add liquidity'/>
      </div>
    )
}

function WithdrawBox(props) {
  return (
      <div className="input-box">
        <InputEntry text='WETH' input={props.input1} setInput={props.setInput1}/>
        <InputEntry text='LDX'  input={props.input2} setInput={props.setInput2}/>
        <ConfirmButton text='Withdraw'/>
      </div>
    )
}

function InputEntry(props) {
  return (
    <div className="input-group">
      <TokenInput input={props.input} setInput={props.setInput}/>
      <TokenLabel text={props.text}/>
    </div>
  )
}

function TokenInput(props) {
  const handleChange = (event) => {
    props.setInput(event.target.value);
  };

  return (
    <input type="text" placeholder="Enter amount" value={props.input} onChange={handleChange}></input>
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

function TokenAddressEntry(props) {
  return (
    <div className='token-address-entry-container'>
      <button className='token-address-entry'>{props.text}</button>
      <p className='token-address-entry-liquidity'>Your liquidity: {props.liquidity}</p>
    </div>
  )
}

function LiquidityPoolEntry(props) {
  return (
    <button className='liquidity-pool-entry'>{props.text}</button>
  )
}

function LiquidityPoolButton(props) {
  return (
    <button className='liquidity-pool-button' onClick={props.onClick}>{props.text}</button>
  )
}

function LiquidityPool(props) {
  return (
    <div className='liquidity-pool'>
      <div className='liquidity-pool-entries'>
        <LiquidityPoolEntry text='WETH-LDX'/>
        <TokenAddressEntry text='WETH' liquidity={props.wethLiquidity}/>
        <TokenAddressEntry text='LDX' liquidity={props.ldxLiquidity}/>
      </div>
      <div className='liquidity-pool-buttons'>
        <LiquidityPoolButton text='Add liquidity' onClick={() => props.setPageState('Add liquidity')}/>
        <LiquidityPoolButton text='Withdraw' onClick={() => props.setPageState('Withdraw')}/>
      </div>
    </div>
  )
}

function MainContent(props) {
  const [invertedInputs, setInvertedInputs] = useState(false);
  const [input1, setInput1] = useState('');
  const [input2, setInput2] = useState('');
  useEffect(() => {
    setInvertedInputs(false);
    setInput1('');
    setInput2('');
  }, [props.pageState]);

  useEffect(() => {
    setInput1('');
    setInput2('');
  }, [props.invertedInputs]);

  if (props.pageState === 'Swap') {
    return (
      <div className='App-main'>
        <SwapBox pageState={props.pageState} invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2}/>
      </div>
    )
  }
  if (props.pageState === "Ether wrapper") {
    return (
      <div className='App-main'>
        <WrapperBox invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2}/>
      </div>
    )
  }
  if (props.pageState === "Add liquidity") {
    return (
      <div className='App-main'>
        <AddLiquidityBox pageState={props.pageState} invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2}/>
      </div>
    )
  }
  if (props.pageState === "Withdraw") {
    return (
      <div className='App-main'>
        <WithdrawBox pageState={props.pageState} invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2}/>
      </div>
    )
  }
  if (props.pageState === 'Liquidity pools') {
    return (
      <div className='App-main'>
        <LiquidityPool contracts={props.contracts} setPageState={props.setPageState} wethLiquidity={props.wethLiquidity} ldxLiquidity={props.ldxLiquidity}/>
      </div>
    )
  }
}

function App() {
  const [pageState, setPageState] = useState('Swap');
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [wethLiquidity, setWethLiquidity] = useState(null);
  const [ldxLiquidity, setLdxLiquidity] = useState(null);

  return (
    <div className="App">
      <AppHeader contracts={contracts} connectedAccount={connectedAccount} setConnectedAccount={setConnectedAccount} setPageState={setPageState} setWethLiquidity={setWethLiquidity} setLdxLiquidity={setLdxLiquidity}/>
      <MainContent contracts={contracts} pageState={pageState} setPageState={setPageState} wethLiquidity={wethLiquidity} ldxLiquidity={ldxLiquidity}/>
    </div>
  )
}

export default App;