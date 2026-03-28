const hre = require('hardhat');

async function main() {
  const rpcUrl = process.env.ZAMA_SEPOLIA_RPC_URL || hre.network.config.url;
  const rawPrivateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl) {
    throw new Error('Missing ZAMA_SEPOLIA_RPC_URL for deployment.');
  }

  if (!rawPrivateKey) {
    throw new Error('Missing PRIVATE_KEY for deployment.');
  }

  const normalizedPrivateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`;
  const provider = new hre.ethers.JsonRpcProvider(rpcUrl);
  const deployer = new hre.ethers.Wallet(normalizedPrivateKey, provider);

  console.log('Deploying with:', await deployer.getAddress());

  const Shield = await hre.ethers.getContractFactory('ShieldIdentity', deployer);
  const shield = await Shield.deploy();

  await shield.waitForDeployment();

  console.log('ShieldIdentity deployed to:', await shield.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
