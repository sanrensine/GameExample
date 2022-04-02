import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { CONTRACT_ADDRESS, transformCharacterData } from "../../constants";
import { ethers } from 'ethers';
import myEpicGame from "../../utils/MyEpicGame.json";
import LoadingIndicator from "../../Components/LoadingIndicator";

const SelectCharacter = ({ setCharacterNFT }) => {

  // 可选NFT角色
  const [characters, setCharacters] = useState([]);
  // 合约
  const [gameContract, setGameContract] = useState(null);
  // loading状态
  const [mintingCharacter, setMintingCharacter] = useState(false);

  // UseEffect
  useEffect(() => {
    const { ethereum } = window;

    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );

      /*
      * This is the big difference. Set our gameContract in state.
      */
      setGameContract(gameContract);
    } else {
      console.log('没找到Ethereum对象');
    }
  }, []);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        console.log('获取合约上可以Mint的游戏角色');

        // 调用合约上获取所有角色的方法
        const charactersTxn = await gameContract.getAllDefaultCharacters();
        console.log('charactersTxn:', charactersTxn);

        // 遍历我们所有的角色并转换数据
        const characters = charactersTxn.map((character) =>
          transformCharacterData(character)
        );
        setCharacters(characters);
      } catch (error) {
        console.log(error);
      }
    }

    // 监听创建NFT角色event，event由合约发出
    const onCharacterMint = async (sender, tokenId, characterIndex) => {
      console.log(
        `角色创建成功 - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
      );

      if (gameContract) {
        const characterNFT = await gameContract.checkIfUserHasNFT();
        console.log('CharacterNFT: ', characterNFT);

        setCharacterNFT(characterNFT);
      }
    }

    if (gameContract) {
      getCharacters();

      // 添加监听
      gameContract.on('CharacterNTFMinted', onCharacterMint)
    }

    return () => {
      // 当组件被销毁，确定监听被移除
      if (gameContract) {
        gameContract.off('CharacterNTFMinted', onCharacterMint);
      }
    };

  },[gameContract]);


  const renderCharacters = () =>
    characters.map((character, index) => (
      <div className="character-item" key={character.name}>
        <div className="name-container">
          <p>{character.name}</p>
        </div>
        <img src={character.imageURI} alt={character.name} />
        <button
          type="button"
          className="character-mint-button"
          onClick={()=> mintCharacterNFTAction(index)}
        >{`Mint ${character.name}`}</button>
      </div>
  ));

  const mintCharacterNFTAction = async (characterIndex) => {
    try {
      if (gameContract) {
        setMintingCharacter(true);
        console.log('正在创建角色');
        const mintTxn = await gameContract.mintCharacterNFT(characterIndex);
        await mintTxn.wait();
        console.log('mintTxn:', mintTxn);

        setMintingCharacter(false);
      }
    } catch (error) {
      console.warn('MintCharacterAction Error:', error);
      setMintingCharacter(false);
    }
  };
  
  return (
    
    <div className="select-character-container">
      <h2>Mint Your Hero. Choose wisely.</h2>
      {/* 只有在characters有值时才显示 */}
      {characters.length > 0 && (
        <div className="character-grid">{renderCharacters()}</div>
      )}
      {/* 创建角色等待时展示 */}
      {mintingCharacter && (
        <div className="loading">
          <div className="indicator">
            <LoadingIndicator />
            <p>Minting In Progress...</p>
          </div>
          <img
            src="https://media2.giphy.com/media/61tYloUgq1eOk/giphy.gif?cid=ecf05e47dg95zbpabxhmhaksvoy8h526f96k4em0ndvx078s&rid=giphy.gif&ct=g"
            alt="Minting loading indicator"
          />
        </div>
      )}
    </div>
  );
};

export default SelectCharacter;