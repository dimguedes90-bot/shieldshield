import React, { useEffect, useState } from 'react';
import { generateTokenOnChain } from '../../lib/blockchain';
import { IssuedToken, Profile } from '../../types';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface IssueTokenProps {
    isIdentityLinked: boolean;
    onIssueToken: (token: IssuedToken) => void;
    profiles: Profile[];
    lastIssuedToken: IssuedToken | null;
    onClearLastIssuedToken: () => void;
    blockchainStatus: { walletConnected: boolean };
    onBlockchainSync: () => Promise<void>;
}

const generateTokenString = () => {
    const randomPart = Array(32).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return `sst_${randomPart}`;
};

const getFriendlyBlockchainError = (error: unknown) => {
    if (!(error instanceof Error)) {
        return 'The on-chain token could not be generated, but the local demo token is ready to share.';
    }

    const message = error.message.toLowerCase();

    if (message.includes('user rejected') || message.includes('action_rejected') || message.includes('denied')) {
        return 'You cancelled the wallet confirmation. The local demo token is still ready, but it was not mirrored on-chain.';
    }

    if (message.includes('insufficient funds')) {
        return 'Your wallet is out of SepoliaETH. The local demo token is ready, but the on-chain version could not be created.';
    }

    return 'The local demo token is ready, but the on-chain token could not be created right now.';
};

const IssueToken: React.FC<IssueTokenProps> = ({ isIdentityLinked, onIssueToken, profiles, lastIssuedToken, onClearLastIssuedToken, blockchainStatus, onBlockchainSync }) => {
    const [copied, setCopied] = useState(false);
    const [blockchainMessage, setBlockchainMessage] = useState<string | null>(null);
    const [blockchainError, setBlockchainError] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const defaultMerchantId = 'shared-session';
    const defaultScope = 'selective-disclosure';
    const defaultProfileId = profiles.find((profile) => profile.id === 'personal')?.id ?? profiles[0]?.id ?? 'personal';

    const createToken = async () => {
        let onchainTokenId: number | undefined;
        setBlockchainMessage(null);
        setBlockchainError(null);
        setIsGenerating(true);

        if (blockchainStatus.walletConnected) {
            try {
                const result = await generateTokenOnChain(300);
                onchainTokenId = result.tokenId ?? undefined;
                setBlockchainMessage(`Token also generated ${result.mode === 'fhevm' ? 'on Zama fhEVM' : 'in mock blockchain mode'}.`);
                await onBlockchainSync();
            } catch (error) {
                setBlockchainError(getFriendlyBlockchainError(error));
            }
        } else {
            setBlockchainMessage('Wallet not connected. Generated local demo token only.');
        }

        const tokenString = generateTokenString();
        const newIssuedToken: IssuedToken = {
            id: `tok_${Date.now()}`,
            token_string: tokenString,
            qrCodeDataUrl: tokenString,
            merchant_id: defaultMerchantId,
            merchant_label: 'Share Anywhere',
            scope: defaultScope,
            use_case: 'Share this token live or send it securely. The verifier chooses which claims to request.',
            profile_id: defaultProfileId,
            exp_ts: Date.now() + 120 * 1000,
            active: true,
            onchain_token_id: onchainTokenId,
        };
        onIssueToken(newIssuedToken);
        setIsGenerating(false);
    };

    useEffect(() => {
        if (!isIdentityLinked || lastIssuedToken || isGenerating) {
            return;
        }

        void createToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIdentityLinked, lastIssuedToken, blockchainStatus.walletConnected]);

    const handleRegenerate = async () => {
        onClearLastIssuedToken();
        setCopied(false);
        await createToken();
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
                <p className="text-gray-300">Link your identity once and Shield Shield will prepare a shareable token for you automatically.</p>
            </div>
        )
    }

    if (isGenerating && !lastIssuedToken) {
        return (
            <div className="bg-navy-dark p-6 sm:p-8 rounded-lg shadow-lg">
                <div className="mb-4">
                    <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                        User Flow
                    </span>
                </div>
                <h2 className="text-3xl font-bold mb-6 text-teal">Preparing Your Shareable Token</h2>
                <div className="rounded-xl bg-navy px-5 py-4 text-sm text-gray-300">
                    <p className="font-semibold text-white">Step 2: automatic token creation</p>
                    <p className="mt-2">Shield Shield is generating a temporary token so the user does not need to handle the raw CPF again. If MetaMask opens, approve the transaction and the token card will appear here.</p>
                </div>
            </div>
        );
    }

    if (lastIssuedToken) {
        return (
            <div className="space-y-6">
                 <div className="mb-4">
                    <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                        User Flow
                    </span>
                 </div>
                 <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <div className="rounded-2xl bg-navy-dark p-6 sm:p-8 shadow-lg">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Step 2</p>
                        <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">Your token is ready to share.</h2>
                        <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-300">
                            The user no longer needs to expose the CPF. From this point on, Shield Shield shares a temporary token and the verifier requests only the checks they need.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3 text-sm">
                            <span className="rounded-full bg-green-500/15 px-4 py-2 font-semibold text-green-300">Temporary token</span>
                            <span className="rounded-full bg-teal/15 px-4 py-2 font-semibold text-teal">Ready for QR or copy</span>
                            <span className="rounded-full bg-white/10 px-4 py-2 font-semibold text-gray-200">Raw CPF stays hidden</span>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">What this enables</p>
                        <div className="mt-5 space-y-4 text-sm text-gray-300">
                            <div className="rounded-xl bg-navy p-4">
                                <p className="font-semibold text-white">Live share</p>
                                <p className="mt-2">The user can present the QR code in person or send the alphanumeric token securely.</p>
                            </div>
                            <div className="rounded-xl bg-navy p-4">
                                <p className="font-semibold text-white">Merchant chooses the checks</p>
                                <p className="mt-2">The verifier decides whether to ask for age, identity validity, credit signal, or other claims.</p>
                            </div>
                            <div className="rounded-xl bg-navy p-4">
                                <p className="font-semibold text-white">History stays visible</p>
                                <p className="mt-2">The user can later review who accessed the token and revoke active access if needed.</p>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="bg-navy-dark p-6 sm:p-8 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                     <div className="flex flex-col items-center justify-center">
                         <div className="p-4 bg-white rounded-lg">
                             <QRCode value={lastIssuedToken.qrCodeDataUrl} size={220} bgColor="#FFFFFF" fgColor="#1B2A49" />
                         </div>
                         <p className="mt-4 text-gray-400">This is what the user shares instead of the CPF.</p>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-2xl font-semibold">Ready to Share</h3>
                        <p className="text-sm text-gray-400">The token was prepared automatically after the identity was linked. Share this token live or send it securely. The verifier can request specific checks without seeing the raw CPF.</p>
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
                            <label className="text-sm text-gray-400">Suggested use</label>
                            <p className="font-semibold">{lastIssuedToken.merchant_label || 'Share Anywhere'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">What this token enables</label>
                            <p className="font-semibold">{lastIssuedToken.use_case || 'Selective disclosure request.'}</p>
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Expires</label>
                            <p className="font-semibold">{new Date(lastIssuedToken.exp_ts).toLocaleString()}</p>
                        </div>
                        {blockchainMessage && <div className="rounded-lg bg-green-500/10 px-4 py-3 text-sm text-green-300">{blockchainMessage}</div>}
                        {blockchainError && <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300">{blockchainError}</div>}
                        <button onClick={handleRegenerate} className="w-full mt-4 bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Generate New Shareable Token</button>
                     </div>
                 </div>
            </div>
        )
    }

    return (
        <div>
            <div className="mb-4">
                <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                    User Flow
                </span>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-teal">Your Shareable Token</h2>
            <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                <div className="mb-6 rounded-xl bg-navy px-5 py-4 text-sm text-gray-300">
                    <p className="font-semibold text-white">Step 2: share a temporary token</p>
                    <p className="mt-2">This screen is now automatic. Once the identity is linked, Shield Shield prepares a token for sharing so the user does not have to fill extra business fields.</p>
                </div>
                <p className="text-gray-300">If no token is visible yet, Shield Shield is still preparing it. This keeps the user journey focused on a single registration step.</p>
            </div>
        </div>
    );
};

export default IssueToken;
