import React, { useState } from 'react';
import { BoltIcon, CheckCircleIcon, ExclamationCircleIcon, LinkIcon, WalletIcon } from '@heroicons/react/24/outline';
import { BlockchainStatus } from '../../types';

interface BlockchainStatusCardProps {
  status: BlockchainStatus;
  onConnectWallet: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
  onProveOver18: () => Promise<void>;
}

const BlockchainStatusCard: React.FC<BlockchainStatusCardProps> = ({
  status,
  onConnectWallet,
  onRefreshStatus,
  onProveOver18,
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
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-400">Blockchain Status</h3>
          <p className="mt-1 text-lg font-semibold text-white">Zama fhEVM Layer</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.mode === 'fhevm' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
          {status.mode === 'fhevm' ? 'Live fhEVM' : 'Mock fallback'}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <WalletIcon className="mr-2 h-4 w-4" />
            Wallet
          </span>
          <span className={status.walletConnected ? 'text-green-300' : 'text-red-300'}>
            {status.walletConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <LinkIcon className="mr-2 h-4 w-4" />
            Identity on-chain
          </span>
          <span className={status.identityRegisteredOnChain ? 'text-green-300' : 'text-yellow-300'}>
            {status.identityRegisteredOnChain ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-navy-dark px-3 py-2">
          <span className="flex items-center text-gray-300">
            <BoltIcon className="mr-2 h-4 w-4" />
            Active tokens
          </span>
          <span className="text-white">{status.activeOnChainTokens}</span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-navy-light bg-navy-dark px-3 py-2 text-xs text-gray-400">
        <p>{status.networkLabel}</p>
        {status.walletAddress && <p className="mt-1 font-mono text-[11px] text-gray-500">{status.walletAddress}</p>}
        {status.contractAddress && <p className="mt-1 font-mono text-[11px] text-gray-500">{status.contractAddress}</p>}
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => runAction(async () => {
            await onConnectWallet();
            setActionMessage('Wallet connected and blockchain state refreshed.');
          })}
          disabled={isBusy}
          className="w-full rounded-lg bg-teal px-4 py-2.5 font-semibold text-navy transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status.walletConnected ? 'Reconnect Wallet' : 'Connect Wallet'}
        </button>
        <button
          type="button"
          onClick={() => runAction(async () => {
            await onRefreshStatus();
            setActionMessage('Blockchain status refreshed.');
          })}
          disabled={isBusy || !status.walletConnected}
          className="w-full rounded-lg border border-navy-light px-4 py-2.5 font-semibold text-gray-200 transition hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          Refresh Status
        </button>
        <button
          type="button"
          onClick={() => runAction(async () => {
            await onProveOver18();
            setActionMessage('Age proof completed.');
          })}
          disabled={isBusy || !status.walletConnected}
          className="w-full rounded-lg border border-teal/40 bg-teal/10 px-4 py-2.5 font-semibold text-teal transition hover:bg-teal/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Prove I&apos;m Over 18
        </button>
      </div>

      {status.lastAgeProofResult !== null && (
        <div className={`mt-4 flex items-center rounded-lg px-3 py-2 text-sm ${status.lastAgeProofResult ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
          {status.lastAgeProofResult ? <CheckCircleIcon className="mr-2 h-5 w-5" /> : <ExclamationCircleIcon className="mr-2 h-5 w-5" />}
          {status.lastAgeProofResult ? 'Verified as over 18.' : 'Not verified as over 18.'}
        </div>
      )}

      {actionMessage && <p className="mt-3 text-xs text-green-300">{actionMessage}</p>}
      {actionError && <p className="mt-3 text-xs text-red-300">{actionError}</p>}
    </div>
  );
};

export default BlockchainStatusCard;
