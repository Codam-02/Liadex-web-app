import './App.css'
import { useState, useEffect } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import contracts from './contractAddresses.json';
import { ethers, parseUnits } from 'ethers';

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
        const tokenAProvided = liquidityTokenSupply > 0 ? ((liquidityTokenBalance * reserveA) / liquidityTokenSupply) : 0;
        const tokenBProvided = liquidityTokenSupply > 0 ? ((liquidityTokenBalance * reserveB) / liquidityTokenSupply) : 0;
        const formattedTokenAProvided = parseFloat(ethers.formatEther(tokenAProvided));
        const formattedTokenBProvided = parseFloat(ethers.formatEther(tokenBProvided));
        props.setWethLiquidity(formattedTokenAProvided > 0.0001 ? (formattedTokenAProvided - 0.0001).toFixed(4) : formattedTokenAProvided.toFixed(4));
        props.setLdxLiquidity(formattedTokenBProvided > 0.0001 ? (formattedTokenBProvided - 0.0001).toFixed(4) : formattedTokenBProvided.toFixed(4));

        // Get the user's account
        const address = await signer.getAddress();
        props.setConnectedAccount(address);
  
        console.log('Connected account:', address);
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
  const {invertedInputs, input1, input2, setInput1, setInput2, contracts} = props;
  const [allowancesVerified, setAllowancesVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  async function getExpectedTokenAReceived(tokenBAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    return (reserveB + tokenBAmount) > 0 ? (reserveA - ((reserveA * reserveB) / (reserveB + tokenBAmount))) : 0;
  }
  async function getExpectedTokenBReceived(tokenAAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    return (reserveA + tokenAAmount) > 0 ? (reserveB - ((reserveA * reserveB) / (reserveA + tokenAAmount))) : 0;
  }
  async function getExpectedTokenAGiven(tokenBAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    return (reserveB - tokenBAmount) > 0 ? (((reserveA * reserveB) / (reserveB - tokenBAmount)) - reserveA) : 0;
  }
  async function getExpectedTokenBGiven(tokenAAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    return (reserveA - tokenAAmount) > 0 ? (((reserveA * reserveB) / (reserveA - tokenAAmount)) - reserveB) : 0;
  }
  async function getTokenAllowances() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = (await signer).address;

    const wethContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, provider);
    const ldxContract = new ethers.Contract(contracts.liadexContract.address, contracts.liadexContract.abi, provider);
    const tradingPairAddress = contracts.tradingPairContract.address;
    
    const wethAllowance = await wethContract.allowance(signerAddress, tradingPairAddress);
    const ldxAllowance = await ldxContract.allowance(signerAddress, tradingPairAddress);
    return [wethAllowance, ldxAllowance];
  }
  async function verifyTokenAllowances() {
    const [wethAllowance, ldxAllowance] = await getTokenAllowances();
    return (invertedInputs ? ldxAllowance >= ethers.parseUnits(input1, 18) : wethAllowance >= ethers.parseUnits(input1, 18));
  }
  async function swap() {
    try {

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const valueInWei = ethers.parseUnits(input1, 18);

      const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, signer);

      let transactionResponse;
      if (invertedInputs) {
        transactionResponse = await tradingPairContract.swap(0, valueInWei);
        await transactionResponse.wait();
      }
      else {
        transactionResponse = await tradingPairContract.swap(valueInWei, 0);
        await transactionResponse.wait();
      }

      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }
  async function approve() {
    try {

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract((invertedInputs ? contracts.liadexContract.address : contracts.wrapperContract.address), (invertedInputs ? contracts.liadexContract.abi : contracts.wrapperContract.abi), signer);

      let transactionResponse;
      transactionResponse = await tokenContract.approve(contracts.tradingPairContract.address, ethers.parseUnits("100", 18));
      await transactionResponse.wait();

      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }

  useEffect(() => {
    async function update() {
      try {
        if (input1 === '' || input1 === '.') {
          setInput1('');
          setInput2('');
          setErrorMsg('');
        } else {
          let res;
            res = await (invertedInputs ? getExpectedTokenAReceived(ethers.parseUnits(input1, 18)) : getExpectedTokenBReceived(ethers.parseUnits(input1, 18)));
            const formattedRes = ethers.formatUnits(res, 18);
            if (parseFloat(formattedRes) !== parseFloat(input2)) {
              setInput2(formattedRes);
            }
        }
        const enoughAllowances = await verifyTokenAllowances();
        if (enoughAllowances) {
          if (!allowancesVerified) {
            setAllowancesVerified(true);
          }
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = provider.getSigner();
          const signerAddress = (await signer).address;
          const tokenContract = new ethers.Contract((invertedInputs ? contracts.liadexContract.address : contracts.wrapperContract.address), (invertedInputs ? contracts.liadexContract.abi : contracts.wrapperContract.abi), provider);
          const balanceNeeded = ethers.parseUnits(input1, 18);
          const userBalance = await tokenContract.balanceOf(signerAddress);
          if (balanceNeeded > userBalance) {
            setErrorMsg('Insufficient balance or token reserves');
          }
          else if (errorMsg !== '') {
            setErrorMsg('');
          }
        }
        else if (allowancesVerified) {
          setAllowancesVerified(false);
        }
      }
      catch (error) {
        console.error(error);
      }
    }
    if (props.connectedAccount !== null) {
      update();
    }
  }, [input1]);
  useEffect(() => {
    async function update() {
      try {
        if (input2 === ''  || input2 === '.') {
          setInput1('');
          setInput2('');
          setErrorMsg('');
        } else {
          let res;
            res = await (invertedInputs ? getExpectedTokenBGiven(ethers.parseUnits(input2, 18)) : getExpectedTokenAGiven(ethers.parseUnits(input2, 18)));
            const formattedRes = ethers.formatUnits(res, 18);
            if (parseFloat(formattedRes) !== parseFloat(input1)) {
              setInput1(formattedRes);
            }
        }
        const enoughAllowances = await verifyTokenAllowances();
        if (enoughAllowances) {
          if (!allowancesVerified) {
            setAllowancesVerified(true);
          }
          const provider = new ethers.BrowserProvider(window.ethereum);
          const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
          const reserveNeeded = ethers.parseUnits(input2, 18);
          const [wethReserve, ldxReserve] = await tradingPairContract.getReserves();
          if (reserveNeeded > (invertedInputs ? wethReserve : ldxReserve)) {
            setErrorMsg('Insufficient balance or token reserves');
          }
          else if (errorMsg !== '') {
            setErrorMsg('');
          }
        }
        else if (allowancesVerified) {
          setAllowancesVerified(false);
        }
      }
      catch (error) {
        console.error(error);
      }
    }
    if (props.connectedAccount !== null) {
      update();
    }
  }, [input2]);
  useEffect(() => {
    setInput1('');
    setInput2('');
  }, [invertedInputs]);

  return (
    <div className="input-box">
      <InputEntry text={invertedInputs ? 'LDX' : 'WETH'} input={input1} setInput={setInput1}/>
      <FontAwesomeIcon className='invert-icon' icon="fa-solid fa-right-left" rotation={90} onClick={() => props.setInvertedInputs(!props.invertedInputs)}/>
      <InputEntry text={invertedInputs ? 'WETH' : 'LDX'}  input={input2} setInput={setInput2}/>
      <ConfirmButton text={allowancesVerified ? 'Swap' : (invertedInputs ? 'Approve ldx' : 'Approve weth')} onClick={allowancesVerified ? swap : approve} errorMsg={errorMsg}/>
    </div>
  )
}

function WrapperBox(props) {
  const {invertedInputs, setInvertedInputs, input1, input2, setInput1, setInput2, contracts} = props;
  const [errorMsg, setErrorMsg] = useState('');
  async function wrap() {
    try {  
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const valueInWei = ethers.parseUnits(input1, 18);
  
      const tx = {
        to: contracts.wrapperContract.address,
        value: valueInWei
      };
  
      const transactionResponse = await signer.sendTransaction(tx);
      await transactionResponse.wait();
  
      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }
  async function unwrap() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const input1InWei = ethers.parseUnits(input1, 18);

      const wrapperContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, signer);

      let transactionResponse;
      transactionResponse = await wrapperContract.unwrap(input1InWei);
      await transactionResponse.wait();

      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }

  useEffect(() => {
    async function update () {
      try {
        setInput2(input1);
        if (input1 === '') {
          setErrorMsg('');
          return;
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
        const signerAddress = (await signer).address;
        const wethContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, provider);
        const balanceNeeded = ethers.parseUnits(input1, 18);
        const userBalance = invertedInputs ? (await wethContract.balanceOf(signerAddress)) : (await provider.getBalance(signerAddress));
        if (balanceNeeded > userBalance) {
          setErrorMsg('Insufficient balance');
        }
        else if (errorMsg !== '') {
          setErrorMsg('');
        }
      }
      catch (error) {
        console.error(error);
      }
    }
    update();
  }, [input1]);
  useEffect(() => {
    setInput1(input2);
  }, [input2]);
  useEffect(() => {
    setInput1('');
    setInput2('');
    setErrorMsg('');
  }, [invertedInputs]);

  return (
    <div className="input-box">
      <InputEntry text={invertedInputs ? 'WETH' : 'ETH'} input={input1} setInput={setInput1}/>
      <FontAwesomeIcon className='invert-icon' icon="fa-solid fa-right-left" rotation={90} onClick={() => setInvertedInputs(!invertedInputs)}/>
      <InputEntry text={invertedInputs ? 'ETH' : 'WETH'}  input={input2} setInput={setInput2}/>
      <ConfirmButton text={invertedInputs ? 'Unwrap' : 'Wrap'} onClick={invertedInputs ? unwrap : wrap} errorMsg={errorMsg}/>
    </div>
  )
}

function AddLiquidityBox(props) {
  const {input1, input2, setInput1, setInput2, contracts} = props;
  const [errorMsg, setErrorMsg] = useState('');
  const [wethAllowanceIsVerified, setWethAllowanceIsVerified] = useState(false);
  const [ldxAllowanceIsVerified, setLdxAllowanceIsVerified] = useState(false);

  async function getEquivalentTokenA(tokenBAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    const res = ((tokenBAmount) * (reserveA) / (reserveB));
    return res;
  }
  async function getEquivalentTokenB(tokenAAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    const res = ((tokenAAmount) * (reserveB) / (reserveA));
    return res;
  }
  async function addLiquidity() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const input1InWei = ethers.parseUnits(input1, 18);
      const input2InWei = ethers.parseUnits(input2, 18);

      const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, signer);

      let transactionResponse;
      transactionResponse = await tradingPairContract.addLiquidity(input1InWei, input2InWei);
      await transactionResponse.wait();

      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }
  async function getTokenAllowances() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = (await signer).address;

    const wethContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, provider);
    const ldxContract = new ethers.Contract(contracts.liadexContract.address, contracts.liadexContract.abi, provider);
    const tradingPairAddress = contracts.tradingPairContract.address;
    
    const wethAllowance = await wethContract.allowance(signerAddress, tradingPairAddress);
    const ldxAllowance = await ldxContract.allowance(signerAddress, tradingPairAddress);
    return [wethAllowance, ldxAllowance];
  }
  async function verifyTokenAllowances() {
    try {
      if (input1 === '' || input2 === '') {
        setWethAllowanceIsVerified(true);
        setLdxAllowanceIsVerified(true);
        return;
      }
      const [wethAllowance, ldxAllowance] = await getTokenAllowances();
      if (wethAllowance < ethers.parseUnits(input1)) {
        setWethAllowanceIsVerified(false);
      }
      else {
        setWethAllowanceIsVerified(true);
      }
      if (ldxAllowance < ethers.parseUnits(input2)) {
        setLdxAllowanceIsVerified(false);
      }
      else {
        setLdxAllowanceIsVerified(true);
      }
    }
    catch (error) {
      console.error(error);
    }
  }
  async function approve() {
    await verifyTokenAllowances();
    if (!wethAllowanceIsVerified) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
  
        const tokenContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, signer);
  
        let transactionResponse;
        transactionResponse = await tokenContract.approve(contracts.tradingPairContract.address, ethers.parseUnits("100", 18));
        await transactionResponse.wait();
        setWethAllowanceIsVerified(true);
  
        console.log('Transaction successful:', transactionResponse);
      } catch (error) {
        console.error('Error sending transaction:', error);
      }
    }
    else if (!ldxAllowanceIsVerified) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
  
        const tokenContract = new ethers.Contract(contracts.liadexContract.address, contracts.liadexContract.abi, signer);
  
        let transactionResponse;
        transactionResponse = await tokenContract.approve(contracts.tradingPairContract.address, ethers.parseUnits("100", 18));
        await transactionResponse.wait();
        setLdxAllowanceIsVerified(true);
  
        console.log('Transaction successful:', transactionResponse);
      } catch (error) {
        console.error('Error sending transaction:', error);
      }
    }
  }

  useEffect(() => {
    async function update() {
      try {
        if (input1 === '' || input1 === '.') {
          setInput1('');
          setInput2('');
        } else {
          let res;
          res = (await getEquivalentTokenB(ethers.parseUnits(input1, 18)));
          const formattedRes = ethers.formatUnits(res, 18);
          if (Math.abs(parseFloat(formattedRes) - parseFloat(input2)) > 0.00001 || input2 === '') {
            setInput2(formattedRes);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = provider.getSigner();
            const signerAddress = (await signer).address;
            const wethContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, provider);
            const ldxContract = new ethers.Contract(contracts.liadexContract.address, contracts.liadexContract.abi, provider);
            const wethNeeded = ethers.parseUnits(input1, 18);
            const ldxNeeded = ethers.parseUnits(formattedRes, 18);
            const wethBalance = await wethContract.balanceOf(signerAddress);
            const ldxBalance = await ldxContract.balanceOf(signerAddress);
            if ((wethNeeded > wethBalance) || (ldxNeeded > ldxBalance)) {
              setErrorMsg('Insufficient balances');
            }
            else if (errorMsg !== '') {
              setErrorMsg('');
            }
          }
        }
      }
      catch (error) {
        console.error(error);
      }
    }
    update();
    verifyTokenAllowances();
  }, [input1]);
  useEffect(() => {
    async function update() {
      try {
        if (input2 === '' || input2 === '.') {
          setInput1('');
          setInput2('');
        } else {
          let res;
          res = (await getEquivalentTokenA(ethers.parseUnits(input2, 18)));
          const formattedRes = ethers.formatUnits(res, 18);
          if (Math.abs(parseFloat(formattedRes) - parseFloat(input1)) > 0.00001 || input1 === '') {
            setInput1(formattedRes);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = provider.getSigner();
            const signerAddress = (await signer).address;
            const wethContract = new ethers.Contract(contracts.wrapperContract.address, contracts.wrapperContract.abi, provider);
            const ldxContract = new ethers.Contract(contracts.liadexContract.address, contracts.liadexContract.abi, provider);
            const wethNeeded = ethers.parseUnits(formattedRes, 18);
            const ldxNeeded = ethers.parseUnits(input2, 18);
            const wethBalance = await wethContract.balanceOf(signerAddress);
            const ldxBalance = await ldxContract.balanceOf(signerAddress);
            if ((wethNeeded > wethBalance) || (ldxNeeded > ldxBalance)) {
              setErrorMsg('Insufficient balances');
            }
            else if (errorMsg !== '') {
              setErrorMsg('');
            }
          }
        }
      }
      catch (error) {
        console.error(error);
      }
    }
    update();
    verifyTokenAllowances();
  }, [input2]);

  return (
      <div className="input-box">
        <InputEntry text='WETH' input={input1} setInput={setInput1}/>
        <InputEntry text='LDX'  input={input2} setInput={setInput2}/>
        <ConfirmButton text={wethAllowanceIsVerified ? (ldxAllowanceIsVerified ? 'Add liquidity' : 'Approve ldx') : 'Approve weth'} onClick={wethAllowanceIsVerified && ldxAllowanceIsVerified ? addLiquidity : approve} errorMsg={errorMsg}/>
      </div>
    )
}

function WithdrawBox(props) {
  const {input1, input2, setInput1, setInput2, contracts} = props;
  async function getEquivalentTokenA(tokenBAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    const res = ((tokenBAmount) * (reserveA) / (reserveB));
    return res;
  }
  async function getEquivalentTokenB(tokenAAmount) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, provider);
    const [reserveA, reserveB] = await tradingPairContract.getReserves();
    const res = ((tokenAAmount) * (reserveB) / (reserveA));
    return res;
  }
  async function withdraw() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const input1InWei = ethers.parseUnits(input1, 18);
      const input2InWei = ethers.parseUnits(input2, 18);

      const tradingPairContract = new ethers.Contract(contracts.tradingPairContract.address, contracts.tradingPairContract.abi, signer);

      let transactionResponse;
      transactionResponse = await tradingPairContract.withdraw(input1InWei, input2InWei);
      await transactionResponse.wait();

      console.log('Transaction successful:', transactionResponse);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }
  
  useEffect(() => {
    async function update() {
      if (input1 === '' || input1 === '.') {
        setInput1('');
        setInput2('');
      } else {
        let res;
        res = (await getEquivalentTokenB(ethers.parseUnits(input1, 18)));
        const formattedRes = ethers.formatUnits(res, 18);
        if (Math.abs(parseFloat(formattedRes) - parseFloat(input2)) > 0.00001 || input2 === '') {
          setInput2(formattedRes);
        }
      }
    }
    update();
  }, [input1]);
  useEffect(() => {
    async function update() {
      if (input2 === '' || input2 === '.') {
        setInput1('');
        setInput2('');
      } else {
        let res;
        res = (await getEquivalentTokenA(ethers.parseUnits(input2, 18)));
        const formattedRes = ethers.formatUnits(res, 18);
        if (Math.abs(parseFloat(formattedRes) - parseFloat(input1)) > 0.00001 || input1 === '') {
          setInput1(formattedRes);
        }
      }
    }
    update();
  }, [input2]);

  return (
      <div className="input-box">
        <InputEntry text='WETH' input={input1} setInput={setInput1}/>
        <InputEntry text='LDX'  input={input2} setInput={setInput2}/>
        <ConfirmButton text='Withdraw' onClick={withdraw}/>
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
    const { value } = event.target;
  
    const regex = /^[0-9]*[.,]?[0-9]*$/;
  
    if (regex.test(value)) {
      const sanitizedValue = value.replace(',', '.');
      props.setInput(sanitizedValue);
    }  };

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
    <div>
      <button className="confirm-button" onClick={props.onClick}>{props.text}</button>
      <p className='error-msg'>{props.errorMsg}</p>
    </div>
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

  if (props.pageState === 'Swap') {
    return (
      <div className='App-main'>
        <SwapBox invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2} contracts={props.contracts} connectedAccount={props.connectedAccount}/>
      </div>
    )
  }
  if (props.pageState === "Ether wrapper") {
    return (
      <div className='App-main'>
        <WrapperBox invertedInputs={invertedInputs} setInvertedInputs={setInvertedInputs} input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2} contracts={contracts}/>
      </div>
    )
  }
  if (props.pageState === "Add liquidity") {
    return (
      <div className='App-main'>
        <AddLiquidityBox input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2} contracts={contracts}/>
      </div>
    )
  }
  if (props.pageState === "Withdraw") {
    return (
      <div className='App-main'>
        <WithdrawBox input1={input1} input2={input2} setInput1={setInput1} setInput2={setInput2} contracts={contracts}/>
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
      <MainContent contracts={contracts} pageState={pageState} setPageState={setPageState} wethLiquidity={wethLiquidity} ldxLiquidity={ldxLiquidity} connectedAccount={connectedAccount}/>
    </div>
  )
}

export default App;