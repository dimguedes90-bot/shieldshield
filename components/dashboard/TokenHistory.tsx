import React from 'react';
import { IssuedToken, ValidationLog } from '../../types';

interface TokenHistoryProps {
    tokens: IssuedToken[];
    logs: ValidationLog[];
    onRevoke: (id: string) => void;
}

const TokenHistory: React.FC<TokenHistoryProps> = ({ tokens, logs, onRevoke }) => {
    
    const getStatus = (token: IssuedToken) => {
        if (!token.active) return { text: 'Revoked', color: 'text-yellow-400' };
        if (token.exp_ts < Date.now()) return { text: 'Expired', color: 'text-gray-400' };
        return { text: 'Active', color: 'text-green-400' };
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-teal">Issued Token History</h2>
             <div className="bg-navy-dark rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-light">
                            <tr>
                                <th className="p-4 font-semibold">Merchant ID</th>
                                <th className="p-4 font-semibold">Scope</th>
                                <th className="p-4 font-semibold">Profile</th>
                                <th className="p-4 font-semibold">Expires</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.length > 0 ? tokens.map(token => {
                                const status = getStatus(token);
                                return (
                                    <tr key={token.id} className="border-b border-navy-light last:border-b-0 hover:bg-navy-light/50">
                                        <td className="p-4 font-mono text-sm">{token.merchant_id}</td>
                                        <td className="p-4">{token.scope}</td>
                                        <td className="p-4 capitalize">{token.profile_id}</td>
                                        <td className="p-4">{new Date(token.exp_ts).toLocaleString()}</td>
                                        <td className={`p-4 font-semibold ${status.color}`}>{status.text}</td>
                                        <td className="p-4">
                                            {status.text === 'Active' && (
                                                <button 
                                                    onClick={() => onRevoke(token.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-gray-400">No tokens have been issued yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6 text-teal">Validation Logs</h2>
            <div className="bg-navy-dark rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-light">
                            <tr>
                                <th className="p-4 font-semibold">Timestamp</th>
                                <th className="p-4 font-semibold">Merchant ID</th>
                                <th className="p-4 font-semibold">Result</th>
                                <th className="p-4 font-semibold">Token ID</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? logs.map(log => (
                               <tr key={log.id} className="border-b border-navy-light last:border-b-0 hover:bg-navy-light/50">
                                   <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                                   <td className="p-4 font-mono text-sm">{log.merchant_id}</td>
                                   <td className={`p-4 font-semibold ${log.result === 'Valid' ? 'text-green-400' : 'text-red-400'}`}>{log.result}</td>
                                   <td className="p-4 font-mono text-xs">{log.token_id}</td>
                               </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center p-8 text-gray-400">No validation attempts have been logged.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

export default TokenHistory;
