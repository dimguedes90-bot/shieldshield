import React, { useState } from 'react';
import { registerIdentityOnChain } from '../../lib/blockchain';
import { validateIdentityNumber } from '../../utils/validation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
const IDENTITY_SUMMARY_STORAGE_KEY = 'shieldshield.identity.summary';

interface LinkIdentityProps {
    isLinked: boolean;
    blockchainStatus: {
      mode: 'fhevm' | 'mock' | 'demo';
      walletConnected: boolean;
    };
    onConnectDemo: () => Promise<void>;
    onLink: () => void;
    onBlockchainSync: () => Promise<void>;
}

const LinkIdentity: React.FC<LinkIdentityProps> = ({ isLinked, blockchainStatus, onConnectDemo, onLink, onBlockchainSync }) => {
  const [fullName, setFullName] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const saved = window.localStorage.getItem(IDENTITY_SUMMARY_STORAGE_KEY);
    return saved ? JSON.parse(saved).fullName || '' : '';
  });
  const [dob, setDob] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const saved = window.localStorage.getItem(IDENTITY_SUMMARY_STORAGE_KEY);
    return saved ? JSON.parse(saved).dob || '' : '';
  });
  const [cpf, setCpf] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    const saved = window.localStorage.getItem(IDENTITY_SUMMARY_STORAGE_KEY);
    return saved ? JSON.parse(saved).cpf || '' : '';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{ isValid: boolean; message: string } | null>(null);

  const persistIdentitySummary = (mode: 'fhevm' | 'mock' | 'demo', identityName: string, identityDob: string, identityCpf: string, birthYear: number) => {
    window.localStorage.setItem(
      IDENTITY_SUMMARY_STORAGE_KEY,
      JSON.stringify({
        fullName: identityName,
        dob: identityDob,
        cpf: identityCpf,
        birthYear,
        linkedAt: Date.now(),
        mode,
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationStatus(null);

    const cpfValidation = validateIdentityNumber(cpf);
    if (!cpfValidation.isValid) {
      setValidationStatus({ isValid: false, message: cpfValidation.error || 'Invalid CPF.' });
      return;
    }

    if (!dob) {
      setValidationStatus({ isValid: false, message: 'Enter your date of birth to continue.' });
      return;
    }

    const birthYear = new Date(`${dob}T00:00:00`).getFullYear();
    if (Number.isNaN(birthYear)) {
      setValidationStatus({ isValid: false, message: 'Enter a valid date of birth.' });
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationStatus({
        isValid: true,
        message: 'Processing identity registration. If MetaMask opened, approve the transaction there.',
      });
      const result = await registerIdentityOnChain({ cpf, birthYear });
      persistIdentitySummary(result.mode, fullName, dob, cpf, birthYear);
      setValidationStatus({
        isValid: true,
        message: `${fullName || 'Identity'} linked successfully. Data registered in ${result.mode === 'fhevm' ? 'live fhEVM' : 'mock blockchain'} mode.`,
      });
      onLink();
      await onBlockchainSync();
    } catch (error) {
      setValidationStatus({
        isValid: false,
        message: error instanceof Error ? error.message : 'Failed to register the identity on-chain.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAuthentication = async () => {
    const demoIdentity = {
      fullName: 'Diogo Guedes',
      dob: '1994-04-16',
      cpf: '12345678901',
    };
    const birthYear = new Date(`${demoIdentity.dob}T00:00:00`).getFullYear();

    setFullName(demoIdentity.fullName);
    setDob(demoIdentity.dob);
    setCpf(demoIdentity.cpf);
    setIsSubmitting(true);
    setValidationStatus({
      isValid: true,
      message: 'Starting demo authentication without MetaMask fees...',
    });

    try {
      await onConnectDemo();
      const result = await registerIdentityOnChain({ cpf: demoIdentity.cpf, birthYear });
      persistIdentitySummary(result.mode, demoIdentity.fullName, demoIdentity.dob, demoIdentity.cpf, birthYear);
      setValidationStatus({
        isValid: true,
        message: 'Demo identity authenticated successfully. You can continue the full flow without MetaMask popups.',
      });
      onLink();
      await onBlockchainSync();
    } catch (error) {
      setValidationStatus({
        isValid: false,
        message: error instanceof Error ? error.message : 'Failed to run the demo authentication flow.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLinked) {
    const savedIdentity = typeof window !== 'undefined'
      ? window.localStorage.getItem(IDENTITY_SUMMARY_STORAGE_KEY)
      : null;
    const identitySummary = savedIdentity ? JSON.parse(savedIdentity) : null;

    return (
        <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
             <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
             <h2 className="text-2xl font-bold mb-2 text-center">Identity Linked On-Chain</h2>
             <p className="text-center text-gray-300">Your CPF and birth year are now registered in the Shield Shield confidentiality layer powered by Zama fhEVM.</p>
             {identitySummary && (
                <div className="mt-6 rounded-xl bg-navy px-5 py-5 text-sm text-gray-300">
                    <p className="font-semibold text-white">Saved demo record</p>
                    <div className="mt-4 space-y-2">
                        <p><span className="text-gray-400">Name:</span> {identitySummary.fullName || 'Not informed'}</p>
                        <p><span className="text-gray-400">Date of birth:</span> {identitySummary.dob || 'Not informed'}</p>
                        <p><span className="text-gray-400">CPF:</span> {identitySummary.cpf || 'Not informed'}</p>
                        <p><span className="text-gray-400">Mode:</span> {identitySummary.mode === 'fhevm' ? 'Live fhEVM' : 'Mock blockchain'}</p>
                    </div>
                </div>
             )}
        </div>
    );
  }

  return (
    <div>
        <div className="mb-4">
            <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                User Flow
            </span>
        </div>
        <h2 className="text-3xl font-bold mb-6 text-teal">Link Your National Identity</h2>
        <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
            <div className="mb-6 rounded-xl bg-navy px-5 py-4 text-sm text-gray-300">
                <p className="font-semibold text-white">Step 1: confidential identity registration</p>
                <p className="mt-2">For the hackathon demo we keep this simple: validate the CPF locally, then encrypt and register the identity on-chain through Zama fhEVM.</p>
            </div>
            <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
                <p className="font-semibold text-white">No MetaMask? Use the demo path</p>
                <p className="mt-2">If the live wallet flow is slow or unavailable during the presentation, use this fallback to simulate the same identity-link step without gas fees.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                          void handleDemoAuthentication();
                        }}
                        disabled={isSubmitting}
                        className="rounded-lg bg-yellow-200 px-4 py-2 font-semibold text-navy transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Authenticate with Demo Connection
                    </button>
                    <span className="rounded-full bg-navy px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-100">
                        {blockchainStatus.mode === 'demo' ? 'Demo mode active' : 'Live mode'}
                    </span>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                    <label className="block text-gray-300 mb-2" htmlFor="fullName">Full Name</label>
                    <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g., Diogo Guedes" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                    <label className="block text-gray-300 mb-2" htmlFor="dob">Date of Birth</label>
                    <input type="date" id="dob" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                    <label className="block text-gray-300 mb-2" htmlFor="cpf">CPF</label>
                    <input type="text" id="cpf" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="e.g., 123.456.789-00" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                <div className="rounded-xl border border-white/10 bg-navy px-5 py-4 text-sm text-gray-300">
                    <p className="font-semibold text-white">What happens here</p>
                    <p className="mt-2">Shield Shield checks the CPF format, derives the birth year, and registers the identity in the blockchain confidentiality layer instead of exposing the raw CPF in plain text.</p>
                </div>
                <div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:cursor-not-allowed disabled:opacity-60">
                        {isSubmitting ? 'Waiting for wallet confirmation...' : 'Register Confidential Identity'}
                    </button>
                </div>
            </form>
            {validationStatus && (
                <div className={`mt-6 p-4 rounded-lg flex items-center ${validationStatus.isValid ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {validationStatus.isValid ? <CheckCircleIcon className="h-6 w-6 mr-3" /> : <ExclamationCircleIcon className="h-6 w-6 mr-3" />}
                    <span>{validationStatus.message}</span>
                </div>
            )}
        </div>
    </div>
  );
};

export default LinkIdentity;
