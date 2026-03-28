import { ethers } from 'ethers';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { BlockchainStatus } from '../types';

const tfheWasmUrl = new URL('../node_modules/@zama-fhe/relayer-sdk/lib/tfhe_bg.wasm', import.meta.url).href;
const kmsWasmUrl = new URL('../node_modules/@zama-fhe/relayer-sdk/lib/kms_lib_bg.wasm', import.meta.url).href;

const SHIELD_IDENTITY_ABI = [
  'event IdentityRegistered(address indexed user)',
  'event TokenGenerated(address indexed user, uint256 tokenId, uint256 expiresAt)',
  'event TokenRevoked(uint256 tokenId)',
  'function registerIdentity(bytes32 encryptedId, bytes idProof, bytes32 encryptedBirthYear, bytes birthProof) external',
  'function generateToken(uint256 durationBlocks) external returns (uint256)',
  'function verifyToken(uint256 tokenId) external view returns (bool valid, address owner)',
  'function revokeToken(uint256 tokenId) external',
  'function proveOver18(uint64 currentYear) external returns (bytes32)',
  'function getLatestOver18Proof(address user) external view returns (bytes32)',
  'function isRegistered(address user) external view returns (bool)',
  'function getActiveTokenCount(address user) external view returns (uint256)',
  'function getUserTokenIds(address user) external view returns (uint256[])',
] as const;

const DEFAULT_STATUS: BlockchainStatus = {
  walletConnected: false,
  walletAddress: null,
  chainId: null,
  networkLabel: 'Wallet disconnected',
  contractConfigured: Boolean(import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS),
  contractAddress: import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS || null,
  mode: import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS ? 'fhevm' : 'mock',
  identityRegisteredOnChain: false,
  activeOnChainTokens: 0,
  lastAgeProofResult: null,
};

const CONTRACT_ADDRESS = import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS || '';
const LOCAL_MOCK_KEY = 'shield-shield-fhevm-mock';
const AGE_PROOF_YEAR = 2026;

type WalletConnection = {
  provider: ethers.BrowserProvider;
  signer: ethers.JsonRpcSigner;
  address: string;
  chainId: number;
  networkLabel: string;
};

type MockToken = {
  id: number;
  expirationBlock: number;
  active: boolean;
};

type MockIdentityRecord = {
  cpf: string;
  birthYear: number;
  registered: boolean;
  tokens: MockToken[];
  latestAgeProof: boolean | null;
};

type MockStore = Record<string, MockIdentityRecord>;

type IdentityRegistrationInput = {
  cpf: string;
  birthYear: number;
};

let fhevmInitPromise: Promise<void> | null = null;
let fhevmInstancePromise: Promise<ReturnType<typeof createInstance>> | null = null;

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
  }
}

const getMockStore = (): MockStore => {
  const raw = localStorage.getItem(LOCAL_MOCK_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as MockStore;
  } catch {
    return {};
  }
};

const setMockStore = (store: MockStore) => {
  localStorage.setItem(LOCAL_MOCK_KEY, JSON.stringify(store));
};

const sanitizeCpf = (cpf: string) => cpf.replace(/[^\d]/g, '');

const hasWallet = () => typeof window !== 'undefined' && Boolean(window.ethereum);

const getConnection = async (): Promise<WalletConnection> => {
  if (!window.ethereum) {
    throw new Error('MetaMask is required to use the blockchain layer.');
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  return {
    provider,
    signer,
    address,
    chainId: Number(network.chainId),
    networkLabel: network.name === 'unknown' ? `Chain ${network.chainId}` : `${network.name} (${network.chainId})`,
  };
};

const shouldUseRealFhevm = (chainId: number) => Boolean(CONTRACT_ADDRESS) && chainId === 11155111;

const getContract = (runner: ethers.ContractRunner) => new ethers.Contract(CONTRACT_ADDRESS, SHIELD_IDENTITY_ABI, runner);

const getFhevmInstance = async (provider: ethers.Eip1193Provider) => {
  if (!fhevmInitPromise) {
    fhevmInitPromise = initSDK({
      tfheParams: tfheWasmUrl,
      kmsParams: kmsWasmUrl,
      thread: 1,
    });
  }

  await fhevmInitPromise;

  if (!fhevmInstancePromise) {
    fhevmInstancePromise = createInstance({
      ...SepoliaConfig,
      network: provider,
    });
  }

  return fhevmInstancePromise;
};

const toHex = (value: Uint8Array) => ethers.hexlify(value) as `0x${string}`;

const encryptIdentityValues = async (connection: WalletConnection, cpf: string, birthYear: number) => {
  const instance = await getFhevmInstance(window.ethereum as ethers.Eip1193Provider);
  const input = instance.createEncryptedInput(CONTRACT_ADDRESS, connection.address);

  input.add64(BigInt(sanitizeCpf(cpf)));
  input.add64(BigInt(birthYear));

  const encrypted = await input.encrypt();

  return {
    encryptedCpf: toHex(encrypted.handles[0]),
    encryptedBirthYear: toHex(encrypted.handles[1]),
    inputProof: toHex(encrypted.inputProof),
  };
};

const userDecryptHandle = async (connection: WalletConnection, handle: string) => {
  const instance = await getFhevmInstance(window.ethereum as ethers.Eip1193Provider);
  const keypair = instance.generateKeypair();
  const startTimestamp = Math.floor(Date.now() / 1000);
  const durationDays = 1;
  const contractAddresses = [CONTRACT_ADDRESS];
  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);
  const signature = await connection.signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message,
  );

  const result = await instance.userDecrypt(
    [{ handle, contractAddress: CONTRACT_ADDRESS }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace(/^0x/, ''),
    contractAddresses,
    connection.address,
    startTimestamp,
    durationDays,
  );

  return Boolean(result[handle]);
};

const loadMockStatus = (address: string, chainId: number, networkLabel: string): BlockchainStatus => {
  const store = getMockStore();
  const record = store[address];

  return {
    walletConnected: true,
    walletAddress: address,
    chainId,
    networkLabel,
    contractConfigured: Boolean(CONTRACT_ADDRESS),
    contractAddress: CONTRACT_ADDRESS || null,
    mode: 'mock',
    identityRegisteredOnChain: Boolean(record?.registered),
    activeOnChainTokens: record?.tokens.filter((token) => token.active && token.expirationBlock > Date.now()).length || 0,
    lastAgeProofResult: record?.latestAgeProof ?? null,
  };
};

export const connectWallet = async (): Promise<BlockchainStatus> => {
  const connection = await getConnection();
  if (shouldUseRealFhevm(connection.chainId)) {
    return getBlockchainStatus();
  }

  return loadMockStatus(connection.address, connection.chainId, connection.networkLabel);
};

export const getBlockchainStatus = async (): Promise<BlockchainStatus> => {
  if (!hasWallet()) {
    return DEFAULT_STATUS;
  }

  const connection = await getConnection();
  if (!shouldUseRealFhevm(connection.chainId)) {
    return loadMockStatus(connection.address, connection.chainId, connection.networkLabel);
  }

  const contract = getContract(connection.provider);
  const [registered, activeCount] = await Promise.all([
    contract.isRegistered(connection.address) as Promise<boolean>,
    contract.getActiveTokenCount(connection.address) as Promise<bigint>,
  ]);

  return {
    walletConnected: true,
    walletAddress: connection.address,
    chainId: connection.chainId,
    networkLabel: connection.networkLabel,
    contractConfigured: true,
    contractAddress: CONTRACT_ADDRESS,
    mode: 'fhevm',
    identityRegisteredOnChain: registered,
    activeOnChainTokens: Number(activeCount),
    lastAgeProofResult: null,
  };
};

export const registerIdentityOnChain = async ({ cpf, birthYear }: IdentityRegistrationInput) => {
  const connection = await getConnection();

  if (!shouldUseRealFhevm(connection.chainId)) {
    const store = getMockStore();
    store[connection.address] = {
      ...(store[connection.address] || { tokens: [], latestAgeProof: null }),
      cpf: sanitizeCpf(cpf),
      birthYear,
      registered: true,
    };
    setMockStore(store);

    return { mode: 'mock' as const };
  }

  const contract = getContract(connection.signer);
  const encrypted = await encryptIdentityValues(connection, cpf, birthYear);
  const tx = await contract.registerIdentity(
    encrypted.encryptedCpf,
    encrypted.inputProof,
    encrypted.encryptedBirthYear,
    encrypted.inputProof,
  );
  await tx.wait();

  return { mode: 'fhevm' as const };
};

export const generateTokenOnChain = async (durationBlocks: number) => {
  const connection = await getConnection();

  if (!shouldUseRealFhevm(connection.chainId)) {
    const store = getMockStore();
    const record = store[connection.address];
    if (!record?.registered) {
      throw new Error('Register an identity on-chain before generating tokens.');
    }

    const tokenId = Date.now();
    record.tokens.push({
      id: tokenId,
      expirationBlock: Date.now() + durationBlocks * 12_000,
      active: true,
    });
    setMockStore(store);

    return { mode: 'mock' as const, tokenId };
  }

  const contract = getContract(connection.signer);
  const tx = await contract.generateToken(durationBlocks);
  const receipt = await tx.wait();
  const iface = new ethers.Interface(SHIELD_IDENTITY_ABI);
  let tokenId: number | null = null;

  for (const log of receipt?.logs || []) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed?.name === 'TokenGenerated') {
        tokenId = Number(parsed.args.tokenId);
      }
    } catch {
      // Ignore logs from other contracts.
    }
  }

  return { mode: 'fhevm' as const, tokenId };
};

export const revokeTokenOnChain = async (tokenId: number) => {
  const connection = await getConnection();

  if (!shouldUseRealFhevm(connection.chainId)) {
    const store = getMockStore();
    const record = store[connection.address];
    record?.tokens.forEach((token) => {
      if (token.id === tokenId) {
        token.active = false;
      }
    });
    setMockStore(store);
    return { mode: 'mock' as const };
  }

  const contract = getContract(connection.signer);
  const tx = await contract.revokeToken(tokenId);
  await tx.wait();

  return { mode: 'fhevm' as const };
};

export const verifyTokenOnChain = async (tokenId: number) => {
  const connection = await getConnection();

  if (!shouldUseRealFhevm(connection.chainId)) {
    const store = getMockStore();
    for (const [owner, record] of Object.entries(store)) {
      const token = record.tokens.find((entry) => entry.id === tokenId);
      if (token) {
        return {
          valid: token.active && token.expirationBlock > Date.now(),
          owner,
          mode: 'mock' as const,
        };
      }
    }

    return { valid: false, owner: ethers.ZeroAddress, mode: 'mock' as const };
  }

  const contract = getContract(connection.provider);
  const [valid, owner] = await contract.verifyToken(tokenId);
  return { valid, owner, mode: 'fhevm' as const };
};

export const proveOver18OnChain = async (currentYear: number = AGE_PROOF_YEAR) => {
  const connection = await getConnection();

  if (!shouldUseRealFhevm(connection.chainId)) {
    const store = getMockStore();
    const record = store[connection.address];
    if (!record?.registered) {
      throw new Error('Register an identity on-chain before proving age.');
    }

    const result = record.birthYear <= currentYear - 18;
    record.latestAgeProof = result;
    setMockStore(store);

    return { verified: result, mode: 'mock' as const };
  }

  const contract = getContract(connection.signer);
  const tx = await contract.proveOver18(currentYear);
  await tx.wait();
  const handle = await contract.getLatestOver18Proof(connection.address);
  const verified = await userDecryptHandle(connection, handle);

  return { verified, mode: 'fhevm' as const };
};
