import React, { useEffect, useState } from 'react';
import './App.css';
import SelectCharacter from './Components/SelectCharacter'
import Arena from './Components/Arena'
import { CONTRACT_ADDRESS, transformCharacterData } from './constants';
import myEpicGame from './utils/MyEpicGame.json';
import { ethers } from 'ethers';
import LoadingIndicator from './Components/LoadingIndicator';

const App = () => {

  // 我们用来储存用户公共钱包的状态变量，需要引入useState
  const [currentAccount, setCurrentAccount] = useState(null);
  // 我们用来储存用户已选的NFT角色的状态变量，需要引入useState
  const [characterNFT, setCharacterNFT] = useState(null);
  // loading指示器状态
  const [isLoading, setIsLoading] = useState(false);
  /*
   * 首先创建一个我们将在组件加载时运行的新操作
   * 函数内有一些异步函数并等待一些时间，需要加上async
   */
  // Actions
  const checkIfWalletIsConnected = async () => {
    try {
      // 首先确保我们可以访问 window.ethereum（如果我们登录到 MetaMask，它会自动将一个名为的特殊对象注入 ethereum 到我们的window中） 
      const { ethereum } = window;

      if (!ethereum) {
        console.log('请下载MetaMask!');

        setIsLoading(false);
        return;
      } else {
        console.log('We have the ethereum object', ethereum);

        // 检查我们是否有权范围用户钱包
        const accounts = await ethereum.request({method: 'eth_accounts' });

        // 
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log('找到授权账户:', account);
          setCurrentAccount(account);
        } else {
          console.log('末获得授权');
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*
   * 连接钱包
   */
  const connectWalletAction = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('请下载MetaMask!');
        return;
      }

      // 获取用户授权
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('已成功连接', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }; 

  /*
   * 获取渲染内容
   */
  const renderContent = () => {
    // 加载时展示
    if (isLoading) {
      return <LoadingIndicator />;
    }

    if (!currentAccount) { // 末授权
      return (
        <div className="connect-wallet-container">
          <img
            src="https://64.media.tumblr.com/tumblr_mbia5vdmRd1r1mkubo1_500.gifv"
            alt="Monty Python Gif"
          />
          <button
            className="cta-button connect-wallet-button"
            onClick={connectWalletAction}
          >
            Connect Wallet To Get Started
          </button>
        </div>
      );
    } else if (currentAccount && !characterNFT) { // 已授权末有角色
      return <SelectCharacter setCharacterNFT={setCharacterNFT} />;
    } else if (currentAccount && characterNFT) { // 已授权且已创建过角色
      return <Arena characterNFT={characterNFT} setCharacterNFT={setCharacterNFT} />;
    }
  };

  /*
   * 页面加载是会运行我们的函数
   */
  useEffect(() => {
    // 任何时候我们组件mount时，设置加载状态
    setIsLoading(true);
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    checkNetwork();
  }, []);


  useEffect(() => {
    const fetchNFTMetadata = async () => {
      console.log('查找NFT角色的地址:', currentAccount);

      const provider =new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS, // 合约地址
        myEpicGame.abi, // 合约的abi接口
        signer
      );

      const txn = await gameContract.checkIfUserHasNFT();
      if (txn.name) { // txn.name 相当于调用合约checkIfUserHasNFT函数返回的NFT角色.name
        console.log("用户已拥有NFT角色");
        setCharacterNFT(transformCharacterData(txn));
      } else {
        console.log("没找到用户的NFT角色");
      }

      // 异步数据加载完，解除loading
      setIsLoading(false);
    }

    if (currentAccount) {
      console.log('当前授权地址：', currentAccount);
      fetchNFTMetadata();
    }
  },[currentAccount])

  /*
   * 检查网络
   */
  const checkNetwork = () => {
    try {
      if (window.ethereum.networkVersion !== '4') {
        alert("请连接Rinkeby测试网！");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">⚔️ Metaverse Slayer ⚔️</p>
          <p className="sub-text">Team up to protect the Metaverse!</p>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
