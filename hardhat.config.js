require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

// 下面的process.env配置，需要在根目录自行创建.env文件，由于私钥等重要信息不能公开，所以.gitgrore配置了.env
// .env文件内容如下：
// STAGING_ALCHEMY_KEY=BLAHBLAH
// PROD_ALCHEMY_KEY=BLAHBLAH
// PRIVATE_KEY=BLAHBLAH
module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: { // npx hardhat run scripts/deploy.js --network rinkeby 此命令发布在rinkey测试网
      url: process.env.STAGING_ALCHEMY_KEY,
      accounts: [process.env.PRIVATE_KEY],
    },
    mainnet: { // npx hardhat run scripts/deploy.js --network mainnet 此命令发布在以太坊主网
      chainId: 1,
      url: process.env.PROD_ALCHEMY_KEY,
      accounts: [process.env.PRIVATE_KEY],
    },
  }
};
