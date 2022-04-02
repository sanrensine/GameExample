const { ethers } = require("hardhat")

const main = async () => {
  const gameContractFactory = await ethers.getContractFactory('MyEpicGame');
  const gameContract = await gameContractFactory.deploy(
    ["Leo", "Aang", "Pikachu"],       // 角色名
    ["https://i.imgur.com/pKd5Sdk.png", // 角色图片
    "https://i.imgur.com/xVu4vFL.png", 
    "https://i.imgur.com/WMB6g9u.png"],
    [100, 200, 300],                    // 血量
    [100, 50, 25],                       // 攻击值
    "Elon Musk", // Boss名
    "https://i.imgur.com/AksR0tt.png", // Boss图片
    10000, // Boss血量
    50 // Boss攻击值
  );
  await gameContract.deployed();


  console.log("合约部署在：", gameContract.address);

  // 有三个角色[0,1,2],传参2则第三个角色
  let txn = await gameContract.mintCharacterNFT(2);
  // 等待交易上链
  await txn.wait();

  // 对Boss发起攻击
  txn = await gameContract.attackBoss();
  await txn.wait();

  // 再次对Boss发起攻击
  txn = await gameContract.attackBoss();
  await txn.wait();

  let returnedTokenUri = await gameContract.tokenURI(1);
  console.log('Token URI:', returnedTokenUri);


}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

runMain();

