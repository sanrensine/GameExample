// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

// 继承NFT合约
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// OpenZeppelin库提供的工具
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

// 引入Base64工具库
import "./libraries/Base64.sol";

// 我们的合约需要继承ERC721，这是一个NFT合约的标准
contract MyEpicGame is ERC721 {

  // 我们将角色的属性保存在结构中。
  // 随意添加您想要的任何属性！（例如防守，关键机会等）。
  struct CharacterAttributes {
    uint characterIndex;
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  // Boss的属性
  struct BigBoss {
    string name;
    string imageURI;
    uint hp;
    uint maxHp;
    uint attackDamage;
  }

  // boss属性
  BigBoss public bigBoss;

  // 此tokenId是NFTS的唯一标识符，是一个递增的数字，如果0、1、2、3...
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  // 一个数组，帮助我们帮助默认数据
  // 当我们创建一个新角色的时候，可以通过数组了解到一些角色属性
  CharacterAttributes[] defaultCharacters;

  // 我们创建了一个mapping，用tokenId映射NFTs的属性
  mapping(uint256 => CharacterAttributes) public nftHolderAttributes;

  // 创建了一个通过地址address映射对应NFTs对应的tokenId
  // 给我们提供了一种存储NFT所有者，并在以后引用它的简单方法
  mapping(address => uint256) public nftHoders;

  // event - 事件可以在客户端上面捕捉
  /// 成功Mint了一个NFT角色事件
  event CharacterNTFMinted(address sender, uint256 tokenId, uint256 characterIndex);
  /// 攻击成功事件
  event AttackComplete(uint newBossHp, uint newPlayerHp);

  // 当我们创建合约时，会调用一次constructor函数，
  // 通过constructor我们可以传递一些参数初始化合约
  // 此例子将会通过run.js传递参数进来
  constructor(
    string[] memory characterNames,
    string[] memory characterImageURIs,
    uint[] memory characterHp,
    uint[] memory characterAttackDmg,
    string memory bossName,
    string memory bossImageURI,
    uint bossHp,
    uint bossAttackDmg
    // 在下面的ERC721("Heroes", "HERO")，能看到我们为NFT添加了一些特别的标识符
    // 这个name和symbol是我们NFT的名字和标识，类似以太坊（Ethereum）和ETH
    // 记住，NFT只是一个token
  ) 
    ERC721("Heroes", "HERO")
  { 
    // 初始化Boss属性
    bigBoss = BigBoss({
      name: bossName,
      imageURI: bossImageURI,
      hp: bossHp,
      maxHp: bossHp,
      attackDamage: bossAttackDmg
    });
    console.log("Done initializing boss %s w/ HP %s, img %s", bigBoss.name, bigBoss.hp, bigBoss.imageURI);

    // 遍历传入的参数，并将其保存在合约中，以便以后我们在铸造NFT的时候使用它们
    for (uint i = 0; i < characterNames.length; i++) {
      defaultCharacters.push(CharacterAttributes({
        characterIndex: i,
        name: characterNames[i],
        imageURI: characterImageURIs[i],
        hp: characterHp[i],
        maxHp: characterHp[i],
        attackDamage: characterAttackDmg[i]
      }));

      CharacterAttributes memory c = defaultCharacters[i];
      console.log("Done initializing %s w/ HP %s, img %s", c.name, c.hp, c.imageURI);
    }
    // 在初始化时，调用increment，使其NFT的第一个ID开始时为1
    _tokenIds.increment();
  }

  /// 用户可以调用此函数，通过传入参数`_characterIndex`控制，创建一个他们希望使用的角色
  function mintCharacterNFT(uint _characterIndex) external {

    // 获取当前tokenId（从 1 开始，因为我们在构造函数中递增）
    uint256 newItemId = _tokenIds.current();

    // 此函数将tokenId分配给调用者
    _safeMint(msg.sender, newItemId);

    // 在nftHolderAttributes，通过tokenId映射生成角色的属性
    nftHolderAttributes[newItemId] = CharacterAttributes({
        characterIndex: _characterIndex,
        name: defaultCharacters[_characterIndex].name,
        imageURI: defaultCharacters[_characterIndex].imageURI,
        hp: defaultCharacters[_characterIndex].hp,
        maxHp: defaultCharacters[_characterIndex].maxHp,
        attackDamage: defaultCharacters[_characterIndex].attackDamage
    });

    console.log("Minted NFT w/ tokenId %s and characterIndex %s", newItemId, _characterIndex);

    // 通过nftHoders，我们可以轻松查看用户拥有的NFT
    nftHoders[msg.sender] = newItemId;

    // mint完NFT之后，tokenId自增1
    _tokenIds.increment();

    // 发起事件 - 告知成功mint
    emit CharacterNTFMinted(msg.sender, newItemId, _characterIndex);
  }

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {

    // 获取用户_tokenId角色
    CharacterAttributes memory charAttributes = nftHolderAttributes[_tokenId];

    // 获取角色的属性，转成字符串
    string memory strHp = Strings.toString(charAttributes.hp);
    string memory strMaxHp = Strings.toString(charAttributes.maxHp);
    string memory strAttackDamage = Strings.toString(charAttributes.attackDamage);

    // json拼接成ERC721的标准，大量流行的 NFT 网站如Opensea都遵循此标准，类似 - 
    // {
    //   "name": "Aang",
    //   "description": "This is a description", 
    //   "image": "https://i.imgur.com/xVu4vFL.png", 
    //   "attributes": [
    //     { "trait_type": "Health Points", "value": 200, "max_value": 200 },
    //     { "trait_type": "Attack Damage", "value": 50 }
    //   ], 
    // }
    // 了解更多json结构相关的内容 - https://docs.opensea.io/docs/metadata-standards#metadata-structure
    string memory json = Base64.encode(
      //abi.encodePacked只是组合字符串
      abi.encodePacked(
              '{"name": "',
      charAttributes.name,
      ' -- NFT #: ',
      Strings.toString(_tokenId),
      '", "description": "This is an NFT that lets people play in the game Metaverse Slayer!", "image": "',
      charAttributes.imageURI,
      '", "attributes": [ { "trait_type": "Health Points", "value": ',strHp,', "max_value":',strMaxHp,'}, { "trait_type": "Attack Damage", "value": ',
      strAttackDamage,'} ]}'
      )
    );

    string memory optput = string(
      abi.encodePacked("data:application/json;base64,", json)
    );

    // output拼接后类似如下,可以将其复制在浏览器，则能看到解码后的json
    //data:application/json;base64,eyJuYW1lIjogIlBpa2FjaHUgLS0gTkZUICM6IDEiLCAiZGVzY3JpcHRpb24iOiAiVGhpcyBpcyBhbiBORlQgdGhhdCBsZXRzIHBlb3BsZSBwbGF5IGluIHRoZSBnYW1lIE1ldGF2ZXJzZSBTbGF5ZXIhIiwgImltYWdlIjogImh0dHBzOi8vaS5pbWd1ci5jb20vV01CNmc5dS5wbmciLCAiYXR0cmlidXRlcyI6IFsgeyAidHJhaXRfdHlwZSI6ICJIZWFsdGggUG9pbnRzIiwgInZhbHVlIjogMzAwLCAibWF4X3ZhbHVlIjozMDB9LCB7ICJ0cmFpdF90eXBlIjogIkF0dGFjayBEYW1hZ2UiLCAidmFsdWUiOiAyNX0gXX0=

    return optput;
  }

  /// 攻击boss
  function attackBoss() public {
    // 获取玩家的NFT角色
    uint256 nftTokenIdOfPlayer = nftHoders[msg.sender];
    CharacterAttributes storage player = nftHolderAttributes[nftTokenIdOfPlayer];
    console.log("\nPlayer w/ character %s about to attack. Has %s HP and %s AD", player.name, player.hp, player.attackDamage);
    console.log("Boss %s has %s HP and %s AD", bigBoss.name, bigBoss.hp, bigBoss.attackDamage);

    // 确定玩家角色 hp > 0
    require(
      player.hp > 0, 
      "Error: character must have HP to attack boss."
    );
    
    // 确定boss的 hp > 0
    require(
      bigBoss.hp > 0, 
      "Error: character must have HP to attack boss."
    );

    // 让玩家攻击boss
    if (bigBoss.hp < player.attackDamage) {
      bigBoss.hp = 0;
    } else {
      bigBoss.hp = bigBoss.hp - player.attackDamage;
    }

    // 让boss攻击玩家
    if (player.hp < bigBoss.attackDamage) {
      player.hp = 0;
    } else {
      player.hp = player.hp - bigBoss.attackDamage;
    }

    // 发起事件 - 告知攻击成功，并返回最新hp
    emit AttackComplete(bigBoss.hp, player.hp);
  }

  /// 检查用户是否已经创建过NFT
  function checkIfUserHasNFT() public view returns (CharacterAttributes memory) {
    // 根据用户地址，查看是否已经又tokenId
    // notice: 尽管用户末创建过NFT角色，但是使用mapping去匹配tokenId，还是会返回0
    // 所以在初始化时，先让_tokenIds.increment()自增为1，那么我们就可以判断，如果为0，则代表末创建过角色
    uint256 userNFTTokenId = nftHoders[msg.sender];
    
    if (userNFTTokenId > 0) { // 如果用户已经拥有角色，则返回角色
      return nftHolderAttributes[userNFTTokenId];
    } else { // 没有则返回空
      CharacterAttributes memory emptyStruct;
      return emptyStruct;
    }
  }

  /// 由于在前端界面需要让用户选择角色，所以此函数返回所有默认的可选角色
  function getAllDefaultCharacters() public view returns (CharacterAttributes[] memory) {
    return defaultCharacters;
  }

  /// 由于在前端界面需要展示boss信息，所以此函数返回boss的信息
  function getBigBoss() public view returns (BigBoss memory) {
    return bigBoss;
  }



}



