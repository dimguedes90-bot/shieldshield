# Shield Shield

Your identity, encrypted. Share proof, not data.

Confidential On-Chain Identity powered by Zama's fhEVM

## Demo

- Live app: https://shieldshield.vercel.app
- Video walkthrough: https://github.com/dimguedes90-bot/shieldshield

## Problem

In Brazil, the CPF (national ID) is requested everywhere and leaked constantly. In 2021, 223 million CPF records were leaked — effectively the entire Brazilian population. People are forced to share raw personal data with entities they don't trust.

## Solution

Shield Shield encrypts identity data using Fully Homomorphic Encryption and stores it on-chain. Users share temporary tokens instead of real IDs, and can prove attributes like being over 18 without revealing the underlying CPF or birth year.

## How It Works (User Flow)

1. User registers CPF -> encrypted with FHE and stored on-chain
2. User generates a temporary token -> shareable via QR or alphanumeric code
3. Verifier scans token -> requests only the claims they need (age, identity validity)
4. User reviews access history -> can revoke tokens at any time

## Sponsor Integration

Zama (fhEVM) powers the confidential blockchain layer:

- identity data is submitted as encrypted inputs
- the smart contract stores FHE types such as `euint64` and `ebool`
- age proofs run as encrypted comparisons on-chain
- the frontend uses Zama's Relayer SDK and falls back to a mock blockchain mode for local demos when a live deployment is unavailable

## Hackathon Context

- Hackathon: PL_Genesis: Frontiers of Collaboration (Protocol Labs)
- Track: Web3 & Digital Human Rights
- Sponsor bounty: Zama (fhEVM)
- Category: Existing Code
- Team: solo builder

## What The App Does

- user account creation and login with Supabase Auth
- CPF registration and validation
- privacy profiles for selective disclosure
- token issuance, QR rendering, expiration, and revocation
- optional on-chain registration and token lifecycle with Zama fhEVM
- over-18 proof flow backed by encrypted comparison logic

## Architecture

- `contracts/ShieldIdentity.sol`: Zama fhEVM smart contract
- `lib/blockchain.ts`: wallet connection, encrypted input flow, contract wrappers, and mock fallback
- `components/dashboard/BlockchainStatusCard.tsx`: wallet and blockchain status UI
- existing React views remain intact and now call blockchain helpers where relevant

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill:

   ```env
   GEMINI_API_KEY=your_gemini_key
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SHIELD_IDENTITY_ADDRESS=your_deployed_contract_address
   ```

3. Run the app:

   ```bash
   npm run dev
   ```

## Smart Contract Commands

Compile:

```bash
npm run compile:contracts
```

Deploy to a local Hardhat node:

```bash
npm run deploy:local
```

Deploy to Zama Sepolia-compatible configuration:

```bash
npm run deploy:zama
```

For deployment, define:

```env
ZAMA_SEPOLIA_RPC_URL=https://eth-sepolia.public.blastapi.io
PRIVATE_KEY=your_wallet_private_key_for_deployment_only
```

## Zama References

- Solidity guides overview: https://docs.zama.org/protocol/solidity-guides/getting-started/overview
- fhEVM quick start: https://docs.zama.org/protocol/solidity-guides/getting-started/quick-start-tutorial/turn_it_into_fhevm
- Relayer SDK initialization: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/initialization
- User decryption: https://docs.zama.org/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
- GitHub: https://github.com/zama-ai/fhevm

## Notes

- The official Zama docs currently point to Sepolia-based configuration for live fhEVM test flows, so the project uses that instead of the older `rpc.zama.ai` / `chainId 9000` example.
- If wallet, contract address, or testnet access are missing, the app automatically switches to mock blockchain mode so the demo remains usable locally.
- The Gemini key currently lives in the client environment. For a production-ready deployment, move Gemini calls behind a server function or API route.
