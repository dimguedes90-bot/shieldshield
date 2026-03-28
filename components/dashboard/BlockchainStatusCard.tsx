import React, { useState } from 'react';
import { BoltIcon, LinkIcon, WalletIcon } from '@heroicons/react/24/outline';
import { BlockchainStatus } from '../../types';

interface BlockchainStatusCardProps {
  status: BlockchainStatus;
  onConnectWallet: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

const BlockchainStatusCard: React.FC<BlockchainStatusCardProps> = ({
  status,
  onConnectWallet,
  onRefreshStatus,
}) => {
  const [isBusy, setIsBusy] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const runAction = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setActionMessage(null);
    setActionError(null);

    try {
      await action();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unexpected blockchain error.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="rounded-lg bg-navy p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Confidential Layer</h3>
          <p className="mt-1 text-lg font-semibold text-white">Zama fhEVM</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.mode === 'fhevm' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
          {status.mode === 'fhevm' ? 'Live fhEVM' : status.mode === 'demo' ? 'Demo mode' : 'Mock fallback'}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <WalletIcon className="mr-2 h-4 w-4" />
            Connection
          </span>
          <span className={status.walletConnected ? 'text-green-300' : 'text-yellow-300'}>
            {status.walletConnected ? (status.mode === 'demo' ? 'Demo ready' : 'Live ready') : 'Not connected'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <LinkIcon className="mr-2 h-4 w-4" />
            Identity protected
          </span>
          <span className={status.identityRegisteredOnChain ? 'text-green-300' : 'text-yellow-300'}>
            {status.identityRegisteredOnChain ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <BoltIcon className="mr-2 h-4 w-4" />
            Active shares
          </span>
          <span className="text-white">{status.activeOnChainTokens}</span>
        </div>
      </div>

      {!status.walletConnected && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => runAction(async () => {
              await onConnectWallet();
              setActionMessage('Live wallet connected.');
            })}
            disabled={isBusy || status.mode === 'demo'}
            className="w-full rounded-lg bg-teal px-4 py-2.5 font-semibold text-navy transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {actionMessage && <p className="mt-3 text-xs text-green-300">{actionMessage}</p>}
      {actionError && <p className="mt-3 text-xs text-red-300">Action failed. Please try again.</p>}
    </div>
  );
};

export default BlockchainStatusCard;
