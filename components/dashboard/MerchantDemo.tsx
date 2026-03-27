import React, { useState } from 'react';
import { IssuedToken, Profile, ValidationLog } from '../../types';

interface ValidationResult {
    valid: boolean;
    status: 'Valid' | 'Expired' | 'Revoked' | 'Invalid' | 'Merchant Mismatch';
    attributes?: Record<string, any>;
    message: string;
}

interface MerchantDemoProps {
    tokens: IssuedToken[];
    profiles: Profile[];
    onAddLog: (log: ValidationLog) => void;
}

const MerchantDemo: React.FC<MerchantDemoProps> = ({ tokens, profiles, onAddLog }) => {
    const [tokenInput, setTokenInput] = useState('');
    const [merchantId, setMerchantId] = useState('');
    const [result, setResult] = useState<ValidationResult | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const foundToken = tokens.find(t => t.token_string === tokenInput);
        let validationResult: ValidationResult;
        let logResult: ValidationLog['result'];
        let releasedAttributes: Record<string, any> | undefined = undefined;

        if (!foundToken) {
            logResult = 'Invalid';
            validationResult = { valid: false, status: 'Invalid', message: 'Token not found or incorrect.' };
        } else if (foundToken.merchant_id !== merchantId) {
            logResult = 'Merchant Mismatch';
            validationResult = { valid: false, status: 'Merchant Mismatch', message: 'Merchant ID does not match the one this token was issued for.' };
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
                 // Simulate releasing attributes based on profile toggles
                if (profile.toggles.identity_number_token) attributes.is_identity_valid = true;
                if (profile.toggles.age_over_18) attributes.age_over_18 = true;
                if (profile.toggles.personal_email) attributes.personal_email = 'demo-personal@shield.com';
                if (profile.toggles.professional_email) attributes.professional_email = 'demo-pro@shield.com';
                if (profile.toggles.personal_phone) attributes.personal_phone = '+1-555-0101';
                if (profile.toggles.professional_phone) attributes.professional_phone = '+1-555-0102';
                if (profile.toggles.linkedin_url) attributes.linkedin_url = 'https://linkedin.com/in/demouser';
            }
            releasedAttributes = attributes;
            validationResult = { valid: true, status: 'Valid', message: 'Token is valid and active.', attributes };
        }

        const newLog: ValidationLog = {
            id: `log_${Date.now()}`,
            token_id: foundToken?.id || 'N/A',
            merchant_id: merchantId,
            timestamp: Date.now(),
            result: logResult,
            attributes_released: releasedAttributes,
        };
        onAddLog(newLog);
        setResult(validationResult);
    };
    
    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-teal">Merchant Demo: Validate Token</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-gray-300 mb-2" htmlFor="token">Identity Token</label>
                            <input type="text" id="token" value={tokenInput} onChange={e => setTokenInput(e.target.value)} placeholder="Enter alphanumeric token string" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2" htmlFor="merchantId">Your Merchant ID</label>
                            <input type="text" id="merchantId" value={merchantId} onChange={e => setMerchantId(e.target.value)} placeholder="e.g., merchant-abc" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                        </div>
                        <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Validate</button>
                    </form>
                </div>
                <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-teal mb-4">Validation Result</h3>
                    {!result ? (
                        <p className="text-gray-400">Enter a token and merchant ID to see the validation result here.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg text-center font-bold ${result.valid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                {result.status}
                            </div>
                            <p className="text-gray-300">{result.message}</p>
                            {result.attributes && Object.keys(result.attributes).length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Released Attributes:</h4>
                                    <pre className="bg-navy-light p-4 rounded-lg text-sm text-gray-200 overflow-x-auto">
                                        {JSON.stringify(result.attributes, null, 2)}
                                    </pre>
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
