import React, { useState } from 'react';
import { verifyTokenOnChain } from '../../lib/blockchain';
import { IssuedToken, Profile, ValidationLog } from '../../types';

interface ValidationResult {
    valid: boolean;
    status: 'Valid' | 'Expired' | 'Revoked' | 'Invalid' | 'Merchant Mismatch';
    attributes?: Record<string, any>;
    message: string;
    passedChecks?: string[];
    releasedItems?: string[];
}

interface MerchantDemoProps {
    tokens: IssuedToken[];
    profiles: Profile[];
    onAddLog: (log: ValidationLog) => void;
    lastIssuedToken: IssuedToken | null;
}

type VerificationRequest =
    | 'identity-valid'
    | 'over-18'
    | 'credit-score-500'
    | 'employment-verified'
    | 'phone-confirmed';

const verificationOptions: Array<{
    id: VerificationRequest;
    label: string;
    description: string;
}> = [
    {
        id: 'identity-valid',
        label: 'ID is valid',
        description: 'Confirms the identity token is valid and belongs to a registered confidential identity.',
    },
    {
        id: 'over-18',
        label: 'Age 18+',
        description: 'Checks whether the user can be proven over 18 without exposing the birth date.',
    },
    {
        id: 'credit-score-500',
        label: 'Credit score > 500',
        description: 'Simulates a credit risk threshold decision, useful for lenders or telecom providers.',
    },
    {
        id: 'employment-verified',
        label: 'Employment verified',
        description: 'Confirms a worker or partner onboarding requirement.',
    },
    {
        id: 'phone-confirmed',
        label: 'Phone confirmed',
        description: 'Confirms a contact channel was already validated for this identity profile.',
    },
];

const merchantExamples = [
    {
        id: 'serasa-score',
        label: 'Serasa credit review',
        merchantId: 'serasa-score',
        requests: ['identity-valid', 'credit-score-500'] as VerificationRequest[],
    },
    {
        id: 'nubank-onboarding',
        label: 'Bank onboarding',
        merchantId: 'nubank-onboarding',
        requests: ['identity-valid', 'over-18', 'phone-confirmed'] as VerificationRequest[],
    },
    {
        id: 'ifood-rider',
        label: 'Worker onboarding',
        merchantId: 'ifood-rider',
        requests: ['identity-valid', 'employment-verified', 'over-18'] as VerificationRequest[],
    },
];

const humanizeAttribute = (key: string, value: unknown) => {
    switch (key) {
        case 'identity_valid':
            return value ? 'Identity is valid' : 'Identity validity could not be confirmed';
        case 'age_over_18':
            return value ? 'User is over 18' : 'Age requirement not met';
        case 'credit_score_above_500':
            return value ? 'Credit score is above 500' : 'Credit score threshold not met';
        case 'employment_verified':
            return value ? 'Employment status is verified' : 'Employment could not be verified';
        case 'phone_confirmed':
            return value ? 'Phone number is confirmed' : 'Phone confirmation unavailable';
        case 'personal_email':
            return `Personal email available: ${String(value)}`;
        case 'professional_email':
            return `Professional email available: ${String(value)}`;
        default:
            return null;
    }
};

const MerchantDemo: React.FC<MerchantDemoProps> = ({ tokens, profiles, onAddLog, lastIssuedToken }) => {
    const [tokenInput, setTokenInput] = useState(lastIssuedToken?.token_string ?? '');
    const [merchantId, setMerchantId] = useState('serasa-score');
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [requestedChecks, setRequestedChecks] = useState<VerificationRequest[]>(['identity-valid', 'over-18']);

    React.useEffect(() => {
        if (!lastIssuedToken) {
            return;
        }

        setTokenInput(lastIssuedToken.token_string);
    }, [lastIssuedToken]);

    const toggleCheck = (check: VerificationRequest) => {
        setRequestedChecks((prev) =>
            prev.includes(check) ? prev.filter((item) => item !== check) : [...prev, check],
        );
    };

    const applyExample = (merchantIdValue: string, requests: VerificationRequest[]) => {
        setMerchantId(merchantIdValue);
        setRequestedChecks(requests);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (requestedChecks.length === 0) {
            setResult({
                valid: false,
                status: 'Invalid',
                message: 'Select at least one verification request for the merchant demo.',
            });
            return;
        }
        
        const foundToken = tokens.find(t => t.token_string === tokenInput);
        let validationResult: ValidationResult;
        let logResult: ValidationLog['result'];
        let releasedAttributes: Record<string, any> | undefined = undefined;

        if (!foundToken) {
            logResult = 'Invalid';
            validationResult = { valid: false, status: 'Invalid', message: 'Token not found or incorrect.' };
        } else if (foundToken.onchain_token_id) {
            try {
                const onchain = await verifyTokenOnChain(foundToken.onchain_token_id);
                if (!onchain.valid) {
                    logResult = 'Revoked';
                    validationResult = { valid: false, status: 'Revoked', message: 'The blockchain layer marked this token as inactive or expired.' };
                } else if (!foundToken.active) {
                    logResult = 'Revoked';
                    validationResult = { valid: false, status: 'Revoked', message: 'This token has been revoked by the user.' };
                } else if (foundToken.exp_ts < Date.now()) {
                    logResult = 'Expired';
                    validationResult = { valid: false, status: 'Expired', message: 'This token has expired.' };
                } else {
                    logResult = 'Valid';
                    const profile = profiles.find(p => p.id === foundToken.profile_id);
                    const attributes: Record<string, any> = {
                        blockchain_owner: onchain.owner,
                        blockchain_token_id: foundToken.onchain_token_id,
                    };
                    
                    if (profile) {
                         if (requestedChecks.includes('identity-valid')) attributes.identity_valid = true;
                         if (requestedChecks.includes('over-18') && profile.toggles.age_over_18) attributes.age_over_18 = true;
                         if (requestedChecks.includes('credit-score-500')) attributes.credit_score_above_500 = true;
                         if (requestedChecks.includes('employment-verified')) attributes.employment_verified = true;
                         if (requestedChecks.includes('phone-confirmed') && (profile.toggles.personal_phone || profile.toggles.professional_phone)) attributes.phone_confirmed = true;
                         if (profile.toggles.personal_email) attributes.personal_email = 'demo-personal@shield.com';
                         if (profile.toggles.professional_email) attributes.professional_email = 'demo-pro@shield.com';
                    }
                    const releasedItems = Object.entries(attributes)
                        .map(([key, value]) => humanizeAttribute(key, value))
                        .filter((item): item is string => Boolean(item));
                    releasedAttributes = attributes;
                    validationResult = {
                        valid: true,
                        status: 'Valid',
                        message: 'Token is valid on-chain and the requested merchant checks passed.',
                        attributes,
                        passedChecks: requestedChecks.map((check) => verificationOptions.find((option) => option.id === check)?.label).filter(Boolean) as string[],
                        releasedItems,
                    };
                }
            } catch (error) {
                logResult = 'Invalid';
                validationResult = { valid: false, status: 'Invalid', message: error instanceof Error ? error.message : 'On-chain validation failed.' };
            }
        } else if (!foundToken.active) {
            logResult = 'Revoked';
            validationResult = { valid: false, status: 'Revoked', message: 'This token has been revoked by the user.' };
        } else if (foundToken.exp_ts < Date.now()) {
            logResult = 'Expired';
            validationResult = { valid: false, status: 'Expired', message: 'This token has expired.' };
        } else {
            logResult = 'Valid';
            const profile = profiles.find(p => p.id === foundToken.profile_id);
            const attributes: Record<string, any> = {};
            
            if (profile) {
                if (requestedChecks.includes('identity-valid')) attributes.identity_valid = true;
                if (requestedChecks.includes('over-18') && profile.toggles.age_over_18) attributes.age_over_18 = true;
                if (requestedChecks.includes('credit-score-500')) attributes.credit_score_above_500 = true;
                if (requestedChecks.includes('employment-verified')) attributes.employment_verified = true;
                if (requestedChecks.includes('phone-confirmed') && (profile.toggles.personal_phone || profile.toggles.professional_phone)) attributes.phone_confirmed = true;
                if (profile.toggles.personal_email) attributes.personal_email = 'demo-personal@shield.com';
                if (profile.toggles.professional_email) attributes.professional_email = 'demo-pro@shield.com';
            }
            const releasedItems = Object.entries(attributes)
                .map(([key, value]) => humanizeAttribute(key, value))
                .filter((item): item is string => Boolean(item));
            releasedAttributes = attributes;
            validationResult = {
                valid: true,
                status: 'Valid',
                message: 'Token is valid and the requested merchant checks passed.',
                attributes,
                passedChecks: requestedChecks.map((check) => verificationOptions.find((option) => option.id === check)?.label).filter(Boolean) as string[],
                releasedItems,
            };
        }

        const newLog: ValidationLog = {
            id: `log_${Date.now()}`,
            token_id: foundToken?.id || 'N/A',
            merchant_id: merchantId,
            merchant_label: foundToken?.merchant_label,
            timestamp: Date.now(),
            result: logResult,
            purpose: requestedChecks.map((check) => verificationOptions.find((option) => option.id === check)?.label).filter(Boolean).join(', '),
            attributes_released: releasedAttributes,
        };
        onAddLog(newLog);
        setResult(validationResult);
    };
    
    return (
        <div>
            <div className="mb-4">
                <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                    Vendor Demo
                </span>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-teal">Merchant Demo</h2>
            <div className="mb-6 rounded-xl bg-navy-dark px-5 py-4 text-sm text-gray-300">
                <p className="font-semibold text-white">Step 3: merchant-side validation</p>
                <p className="mt-2">This page is not for the end user. The merchant receives a token, chooses which checks they need, and validates those claims without ever seeing the raw CPF.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                    <div className="mb-6 rounded-xl bg-navy px-5 py-4 text-sm text-gray-300">
                        <p className="font-semibold text-white">Suggested merchant scenarios</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            {merchantExamples.map((example) => (
                                <button
                                    key={example.id}
                                    type="button"
                                    onClick={() => applyExample(example.merchantId, example.requests)}
                                    className="rounded-full border border-navy-light px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-gray-200 transition hover:bg-navy-light"
                                >
                                    {example.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-300 mb-2" htmlFor="token">Identity Token</label>
                            <input type="text" id="token" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Enter alphanumeric token string" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2" htmlFor="merchantId">Merchant scenario</label>
                            <select id="merchantId" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal appearance-none">
                                {merchantExamples.map((example) => (
                                    <option key={example.id} value={example.merchantId}>
                                        {example.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-gray-400">For the hackathon demo, the verifier chooses a scenario and requests the checks they need from the same token.</p>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-3">Choose what the merchant wants to verify</label>
                            <div className="space-y-3">
                                {verificationOptions.map((option) => (
                                    <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-navy-light bg-navy px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={requestedChecks.includes(option.id)}
                                            onChange={() => toggleCheck(option.id)}
                                            className="mt-1 h-4 w-4 rounded border-navy-light bg-navy-light text-teal focus:ring-teal"
                                        />
                                        <span>
                                            <span className="block font-semibold text-white">{option.label}</span>
                                            <span className="mt-1 block text-sm text-gray-400">{option.description}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Validate</button>
                    </form>
                </div>
                <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-teal mb-4">Validation Result</h3>
                    {!result ? (
                        <p className="text-gray-400">Enter a token, choose the requested checks, and validate to see what the merchant learns without accessing the raw CPF.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg text-center font-bold ${result.valid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {result.status}
                            </div>
                            <p className="text-gray-300">{result.message}</p>
                            {result.passedChecks && result.passedChecks.length > 0 && (
                                <div className="rounded-xl bg-navy px-5 py-4">
                                    <h4 className="font-semibold text-white">Checks requested by the merchant</h4>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {result.passedChecks.map((check) => (
                                            <span key={check} className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-300">
                                                {check}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {result.releasedItems && result.releasedItems.length > 0 && (
                                <div className="rounded-xl bg-navy px-5 py-4">
                                    <h4 className="font-semibold text-white">What the merchant learns</h4>
                                    <div className="mt-3 space-y-3">
                                        {result.releasedItems.map((item) => (
                                            <div key={item} className="rounded-lg bg-navy-light px-4 py-3 text-sm text-gray-200">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MerchantDemo;
