# 简单的区块链游戏


用户可以创建NFT角色，每个角色都有自己的不同基础属性
创建角色后，可以对Boss发起攻击
[合约](https://rinkeby.etherscan.io/address/0x22AAc34d69b323ea8A02C5BD82f7d28a86ad5A97)已部署在Rinkeby测试网

---

Frontend为前端项目，如果只是浏览页面，可以执行下列命令（初始路径默认在项目根目录）
```shell
cd frontend

npm install

npm run start
```

---
如果想本地运行合约并测试，在根目录先创建.env文件（此文件是保存敏感信息的，如私钥等，内容参考hardhat.config.js的注释说明）
and 执行下列命令（初始路径默认在项目根目录）
```shell
npm install

# 本地环境测试发布合约
npx hardhat run scripts/deploy.js
# rinkeby环境发布合约
npx hardhat run scripts/deploy.js --network rinkeby
```