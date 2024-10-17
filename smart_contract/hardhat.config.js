// https://eth-ropsten.alchemyapi.io/v2/QFXpkjRq1a0f6h-B7OehbfxX2CsojWLc

require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: '0.8.0',
  networks: {
    ropsten: {
      url: 'https://eth-ropsten.alchemyapi.io/v2/QFXpkjRq1a0f6h-B7OehbfxX2CsojWLc',
      accounts: [ '6b2bd239098e016c1e7fdf4081a75eec8e35f78f4fb39b7d29db5987f16c2c12' ]
    }
  }
}
