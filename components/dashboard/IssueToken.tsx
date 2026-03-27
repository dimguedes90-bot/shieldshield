import React, { useState } from 'react';
import { IssuedToken, Profile } from '../../types';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface IssueTokenProps {
    isIdentityLinked: boolean;
    onIssueToken: (token: IssuedToken) => void;
    profiles: Profile[];
    lastIssuedToken: IssuedToken | null;
    onClearLastIssuedToken: () => void;
}

const generateTokenString = () => {
    const randomPart = Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return `sst_${randomPart}`;
};

const IssueToken: React.FC<IssueTokenProps> = ({ isIdentityLinked, onIssueToken, profiles, lastIssuedToken, onClearLastIssuedToken }) => {
    const [merchantId, setMerchantId] = useState('merchant-abc');
    const [scope, setScope] = useState('age-verification');
    const [profileId, setProfileId] = useState('personal');
    const [copied, setCopied] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tokenString = generateTokenString();
        const newIssuedToken: IssuedToken = {
            id: `tok_${Date.now()}`,
            token_string: tokenString,
            qrCodeDataUrl: tokenString,
            merchant_id: merchantId,
            scope: scope,
            profile_id: profileId,
            exp_ts: Date.now() + 120 * 1000,
            active: true,
        };
        onIssueToken(newIssuedToken);
    };

    const handleCopy = () => {
        if (!lastIssuedToken) return;
        navigator.clipboard.writeText(lastIssuedToken.token_string);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isIdentityLinked) {
        return (
            <div className="text-center p-8 bg-navy-dark rounded-lg">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">Identity Not Linked</h2>
                <p className="text-gray-300">Please link your national identity number before you can issue tokens.</p>
            </div>
        )
    }

    if (lastIssuedToken) {
        return (
            <div>
                 <h2 className="text-3xl font-bold mb-6 text-teal">Token Issued Successfully</h2>
                 <div className="bg-navy-dark p-8 rounded-lg shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <div className="flex flex-col items-center justify-center">
                         <div className="p-4 bg-white rounded-lg">
                             <QRCode value={lastIssuedToken.qrCodeDataUrl} size={256} bgColor="#FFFFFF" fgColor="#1B2A49" />
                         </div>
                         <p className="mt-4 text-gray-400">Scan this QR code to validate</p>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-xl font-semibold">Token Details</h3>
                        <div>
                            <label className="text-sm text-gray-400">Alphanumeric Token</label>
                            <div className="flex items-center mt-1">
                                <input type="text" readOnly value={lastIssuedToken.token_string} className="w-full p-2 bg-navy-light rounded-l font-mono text-sm" />
                                <button onClick={handleCopy} className="p-2 bg-teal text-navy rounded-r hover:bg-opacity-90">
                                    {copied ? <CheckIcon className="h-5 w-5" /> : <ClipboardDocumentIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Merchant ID</label>
                            <p className="font-semibold">{lastIssuedToken.merchant_id}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Expires</label>
                            <p className="font-semibold">{new Date(lastIssuedToken.exp_ts).toLocaleString()}</p>
                        </div>
                        <button onClick={onClearLastIssuedToken} className="w-full mt-4 bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Issue Another Token</button>
                     </div>
                 </div>
            </div>
        )
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-teal">Issue a New Identity Token</h2>
            <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="merchantId">Merchant ID</label>
                        <input type="text" id="merchantId" value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="e.g., merchant-123" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="scope">Scope</label>
                        <input type="text" id="scope" value={scope} onChange={e => setScope(e.target.value)} placeholder="e.g., age-verification" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="profile">Privacy Profile</label>
                        <select id="profile" value={profileId} onChange={e => setProfileId(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal appearance-none">
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Generate Token & QR Code</button>
                </form>
            </div>
        </div>
    );
};

export default IssueToken;
