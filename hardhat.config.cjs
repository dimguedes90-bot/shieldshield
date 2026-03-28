require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
process.env.TS_NODE_PROJECT = process.env.TS_NODE_PROJECT || './tsconfig.hardhat.json';
require('@nomicfoundation/hardhat-toolbox');
require('@fhevm/hardhat-plugin');

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: '0.8.24',
  networks: {
    hardhat: {},
    localhost: {
      url: process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    zamaSepolia: {
      url: process.env.ZAMA_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

module.exports = config;
