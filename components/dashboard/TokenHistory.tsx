import React from 'react';
import { revokeTokenOnChain } from '../../lib/blockchain';
import { IssuedToken, ValidationLog } from '../../types';

interface TokenHistoryProps {
    tokens: IssuedToken[];
    logs: ValidationLog[];
    onRevoke: (id: string) => void;
    onBlockchainSync: () => Promise<void>;
}

const TokenHistory: React.FC<TokenHistoryProps> = ({ tokens, logs, onRevoke, onBlockchainSync }) => {
    const getStatus = (token: IssuedToken) => {
        if (!token.active) return { text: 'Revoked', color: 'text-yellow-400' };
        if (token.exp_ts < Date.now()) return { text: 'Expired', color: 'text-gray-400' };
        return { text: 'Active', color: 'text-green-400' };
    };

    const handleRevoke = async (token: IssuedToken) => {
        if (token.onchain_token_id) {
            await revokeTokenOnChain(token.onchain_token_id);
            await onBlockchainSync();
        }

        onRevoke(token.id);
    };

    const uniqueMerchants = Array.from(new Set(tokens.map((token) => token.merchant_id))).length;
    const activeTokens = tokens.filter((token) => token.active && token.exp_ts >= Date.now()).length;
    const revokedTokens = tokens.filter((token) => !token.active).length;

    return (
        <div className="space-y-8">
            <div className="mb-4">
                <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                    User Flow
                </span>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                <div className="rounded-2xl bg-navy-dark p-8 shadow-lg">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Step 4</p>
                    <h2 className="mt-4 text-4xl font-bold text-white">See who received access and revoke it if needed.</h2>
                    <p className="mt-4 max-w-2xl text-lg text-gray-300">
                        This is the user-facing control center. It shows which organizations received a shareable token, what is still active, and where access can be revoked.
                    </p>
                </div>
                <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">What this proves in the demo</p>
                    <div className="mt-5 space-y-4 text-sm text-gray-300">
                        <div className="rounded-xl bg-navy p-4">
                            <p className="font-semibold text-white">Transparency</p>
                            <p className="mt-2">The user can see who requested verification and for what purpose.</p>
                        </div>
                        <div className="rounded-xl bg-navy p-4">
                            <p className="font-semibold text-white">Control</p>
                            <p className="mt-2">Active access can be revoked without exposing the original identity data again.</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-navy-dark p-5 shadow-lg">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Merchants reached</p>
                    <p className="mt-3 text-3xl font-bold text-white">{uniqueMerchants}</p>
                </div>
                <div className="rounded-xl bg-navy-dark p-5 shadow-lg">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Active access</p>
                    <p className="mt-3 text-3xl font-bold text-green-300">{activeTokens}</p>
                </div>
                <div className="rounded-xl bg-navy-dark p-5 shadow-lg">
                    <p className="text-sm uppercase tracking-[0.2em] text-gray-400">Revoked</p>
                    <p className="mt-3 text-3xl font-bold text-yellow-300">{revokedTokens}</p>
                </div>
            </div>

            <div className="mb-10 rounded-2xl bg-navy-dark p-6 shadow-lg">
                <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-white">Shared Tokens</h3>
                    <p className="mt-2 text-gray-400">This is the user-facing list of tokens that were created from the identity. The most important controls stay visible, and the rest can be expanded when needed.</p>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                    {tokens.length > 0 ? tokens.map(token => {
                        const status = getStatus(token);
                        return (
                            <div key={token.id} className="rounded-xl border border-navy-light bg-navy px-5 py-5">
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-lg font-semibold text-white">{token.merchant_label || token.merchant_id}</p>
                                            <p className="mt-1 text-sm text-gray-400">{token.use_case || 'Selective disclosure request.'}</p>
                                        </div>
                                        <span className={`rounded-full bg-navy-dark px-3 py-1 text-sm font-semibold ${status.color}`}>{status.text}</span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg bg-navy-dark px-4 py-3">
                                            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Status</p>
                                            <p className={`mt-2 text-sm font-semibold ${status.color}`}>{status.text}</p>
                                        </div>
                                        <div className="rounded-lg bg-navy-dark px-4 py-3">
                                            <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Expiry</p>
                                            <p className="mt-2 text-sm font-semibold text-white">{new Date(token.exp_ts).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {status.text !== 'Expired' && (
                                        <button
                                            onClick={() => {
                                                void handleRevoke(token);
                                            }}
                                            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                                                status.text === 'Active'
                                                    ? 'bg-red-500 hover:bg-red-600'
                                                    : 'bg-teal hover:bg-white hover:text-navy'
                                            }`}
                                        >
                                            {status.text === 'Active' ? 'Revoke Access' : 'Restore Access'}
                                        </button>
                                    )}
                                    <details className="rounded-lg bg-navy-dark px-4 py-3 text-sm text-gray-300">
                                        <summary className="cursor-pointer list-none font-semibold text-white">
                                            View details
                                        </summary>
                                        <div className="mt-3 space-y-2">
                                            <p className="text-sm text-gray-400">Merchant ID: {token.merchant_id}</p>
                                            <p className="text-sm text-gray-400">Scope: {token.scope}</p>
                                            <p className="text-sm text-gray-400">Token: <span className="font-mono text-xs">{token.token_string.slice(0, 22)}...</span></p>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="rounded-xl border border-dashed border-navy-light px-6 py-10 text-center text-gray-400">
                            No merchant access has been created yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
                <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-white">Merchant Activity</h3>
                    <p className="mt-2 text-gray-400">This section updates when a merchant actually tries to use a token. Creating a new share above does not add an activity entry until someone validates it.</p>
                </div>
            <div className="bg-navy rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-light">
                            <tr>
                                <th className="p-4 font-semibold">Timestamp</th>
                                <th className="p-4 font-semibold">Merchant</th>
                                <th className="p-4 font-semibold">Purpose</th>
                                <th className="p-4 font-semibold">Result</th>
                                <th className="p-4 font-semibold">Token ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map(log => (
                               <tr key={log.id} className="border-b border-navy-light last:border-b-0 hover:bg-navy-light/50">
                                   <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                                   <td className="p-4">
                                     <p className="font-semibold text-white">{log.merchant_label || log.merchant_id}</p>
                                     <p className="font-mono text-xs text-gray-400">{log.merchant_id}</p>
                                   </td>
                                   <td className="p-4 text-sm text-gray-300">{log.purpose || 'Identity verification request.'}</td>
                                   <td className={`p-4 font-semibold ${log.result === 'Valid' ? 'text-green-400' : 'text-red-400'}`}>{log.result}</td>
                                   <td className="p-4 font-mono text-xs">{log.token_id}</td>
                               </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-gray-400">No merchant verification attempts have been logged yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            </div>
        </div>
    );
};

export default TokenHistory;
