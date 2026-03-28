export interface Profile {
  id: string;
  name: string;
  toggles: {
    identity_number_token: boolean;
    professional_email: boolean;
    personal_email: boolean;
    professional_phone: boolean;
    personal_phone: boolean;
    linkedin_url: boolean;
    age_over_18: boolean;
  };
}

export interface IssuedToken {
  id: string;
  token_string: string;
  qrCodeDataUrl: string;
  merchant_id: string;
  scope: string;
  profile_id: string;
  exp_ts: number;
  active: boolean;
  onchain_token_id?: number;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'gemini';
    mode: 'flash' | 'pro' | 'lite';
}

export interface ValidationLog {
  id: string;
  token_id: string;
  merchant_id: string;
  timestamp: number;
  result: 'Valid' | 'Invalid' | 'Expired' | 'Revoked' | 'Merchant Mismatch';
  attributes_released?: Record<string, any>;
}

export interface BlockchainStatus {
  walletConnected: boolean;
  walletAddress: string | null;
  chainId: number | null;
  networkLabel: string;
  contractConfigured: boolean;
  contractAddress: string | null;
  mode: 'fhevm' | 'mock';
  identityRegisteredOnChain: boolean;
  activeOnChainTokens: number;
  lastAgeProofResult: boolean | null;
}
