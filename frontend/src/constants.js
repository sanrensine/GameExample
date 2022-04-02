const CONTRACT_ADDRESS = '0xad5a23a5dD3cfd85d42c627e91261b00Bda36eF1';

const transformCharacterData = (characterData) => {
  return {
    name: characterData.name,
    imageURI: characterData.imageURI,
    hp: characterData.hp.toNumber(),
    maxHp: characterData.maxHp.toNumber(),
    attackDamage: characterData.attackDamage.toNumber(),
  };
};

export {CONTRACT_ADDRESS, transformCharacterData};