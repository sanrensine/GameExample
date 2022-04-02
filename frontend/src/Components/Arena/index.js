import React, { useEffect, useState } from 'react';
import { Contract, ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from "../../Components/LoadingIndicator";

const Arena = ({characterNFT, setCharacterNFT}) => {

  // 合约变量
  const [gameContract, setGameContract] = useState(null);
  // boss变量
  const [boss, setBoss] = useState(null);
  // 添加攻击动画
  const [attackState, setAttackState] = useState('');
  // Toast控制
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
  
      setGameContract(gameContract);
    } else {
      console.log('没找到Ethereum对象');
    }
  }, []);

  useEffect(() => {
    //获取Boss属性
    const featchBoss = async () => {
      const bossTxn = await gameContract.getBigBoss();
      console.log('Boss:', bossTxn);

      setBoss(transformCharacterData(bossTxn));
    }

    // 处理攻击成功事件
    const onAttackComplete = (newBossHp, newPlayerHp) => {
        const bossHp = newBossHp.toNumber();
        const playerHp = newPlayerHp.toNumber();

        console.log(`攻击成功: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

        /*
        * Update both player and boss Hp
        */
        setBoss((prevState) => {
            return { ...prevState, hp: bossHp };
        });

        setCharacterNFT((prevState) => {
            return { ...prevState, hp: playerHp };
        });
    };

    if (gameContract) {
      featchBoss();
      gameContract.on('AttackComplete', onAttackComplete);
    }
    
    // 当组件被销毁，确定监听被移除
    return () => {
      if (gameContract) {
          gameContract.off('AttackComplete', onAttackComplete);
      }
    }
  }, [gameContract]);

  const runAttackAction = async () => {
    try {
      if (gameContract) {
        setAttackState('attacking');
        console.log('攻击 boss...');
        const attackTxn = await gameContract.attackBoss();
        await attackTxn.wait();
        console.log('attackTxn:', attackTxn);
        setAttackState('hit');

        // 弹窗提示
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error attacking boss:', error);
      setAttackState('');
    }
  };

  return (
    <div className="arena-container">

      {boss && characterNFT && (
        <div id="toast" className={showToast ? 'show' : ''}>
          <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
        </div>
      )}

      {/* BossUI */}
      {boss && (
        <div className="boss-container">
          <div className={`boss-content ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`💥 Attack ${boss.name}`}
            </button>
          </div>
          {attackState === 'attacking' && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}
  
      {/* 用户角色 NFT UI */}
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Character</h2>
            <div className="player">
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                  src={characterNFT.imageURI}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Arena;