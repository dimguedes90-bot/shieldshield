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
      const errorMessage = error instanceof Error ? error.message : 'Failed to register the identity on-chain.';

      if (errorMessage.toLowerCase().includes('already registered')) {
        persistIdentitySummary(blockchainStatus.mode === 'demo' ? 'demo' : blockchainStatus.mode === 'fhevm' ? 'fhevm' : 'mock', fullName, dob, cpf, birthYear);
        setValidationStatus({
          isValid: true,
          message: 'This wallet already had an identity linked. Shield Shield synced that protected identity into the current session.',
        });
        onLink();
        await onBlockchainSync();
        return;
      }

      setValidationStatus({
        isValid: false,
        message: errorMessage,
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
      <div className="space-y-6">
        <div className="rounded-2xl bg-navy-dark p-6 sm:p-8 shadow-lg">
          <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-center">Identity Linked On-Chain</h2>
          <p className="mx-auto max-w-3xl text-center text-gray-300">
            Your tax identifier (CPF) and birth year are now protected inside the Shield Shield confidentiality layer powered by Zama fhEVM.
          </p>
        </div>
        {identitySummary && (
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Stored for the demo</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-navy p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Name</p>
                  <p className="mt-2 font-semibold text-white">{identitySummary.fullName || 'Not informed'}</p>
                </div>
                <div className="rounded-xl bg-navy p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Date of birth</p>
                  <p className="mt-2 font-semibold text-white">{identitySummary.dob || 'Not informed'}</p>
                </div>
                <div className="rounded-xl bg-navy p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">CPF</p>
                  <p className="mt-2 font-semibold text-white">{identitySummary.cpf || 'Not informed'}</p>
                </div>
                <div className="rounded-xl bg-navy p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">Mode</p>
                  <p className="mt-2 font-semibold text-white">{identitySummary.mode === 'fhevm' ? 'Live fhEVM' : identitySummary.mode === 'demo' ? 'Demo connection' : 'Mock blockchain'}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">What happens next</p>
              <div className="mt-5 space-y-4 text-sm text-gray-300">
                <div className="rounded-xl bg-navy p-4">
                  <p className="font-semibold text-white">1. A token is prepared</p>
                  <p className="mt-2">The user can now share a temporary token instead of exposing the raw CPF again.</p>
                </div>
                <div className="rounded-xl bg-navy p-4">
                  <p className="font-semibold text-white">2. A verifier requests claims</p>
                  <p className="mt-2">The merchant asks only for the checks they need, such as age verification or identity validity.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="mb-4">
            <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                User Flow
            </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
            <div className="rounded-2xl bg-navy-dark p-6 sm:p-8 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">Step 1</p>
                <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">Link your identity once.</h2>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-300">
                  Shield Shield turns a one-time tax identifier (CPF) registration into a confidential identity layer, so the user can share tokens later instead of repeating the raw number everywhere.
                </p>
            </div>
            <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal">What this step guarantees</p>
                <div className="mt-5 space-y-4 text-sm text-gray-300">
                    <div className="rounded-xl bg-navy p-4">
                        <p className="font-semibold text-white">Single registration</p>
                        <p className="mt-2">The user enters identity data once, then reuses tokens instead of repeating the raw CPF.</p>
                    </div>
                    <div className="rounded-xl bg-navy p-4">
                        <p className="font-semibold text-white">No raw CPF sharing later</p>
                        <p className="mt-2">After this step, the experience shifts to temporary tokens and selective checks.</p>
                    </div>
                    <div className="rounded-xl bg-navy p-4">
                        <p className="font-semibold text-white">Live or fallback mode</p>
                        <p className="mt-2">The flow can run with a live wallet connection or a fee-free fallback if wallet approval is unavailable.</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="bg-navy-dark p-6 sm:p-8 rounded-2xl shadow-lg">
            <div className="mb-6 rounded-xl bg-navy px-5 py-4 text-sm text-gray-300">
                <p className="font-semibold text-white">Confidential identity registration</p>
                <p className="mt-2">Validate the tax identifier (CPF) locally, derive the birth year, and register the identity in the confidential blockchain layer powered by Zama fhEVM.</p>
            </div>
            <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-5 py-4 text-sm text-yellow-100">
                <p className="font-semibold text-white">Alternative demo path</p>
                <p className="mt-2">If MetaMask is unavailable, use this fallback to simulate the same identity-link step without gas fees.</p>
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
                    <label className="block text-gray-300 mb-2" htmlFor="cpf">Tax Identifier (CPF)</label>
                    <input type="text" id="cpf" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="e.g., 123.456.789-00" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-navy px-5 py-4 text-sm text-gray-300">
                        <p className="font-semibold text-white">Checks locally</p>
                        <p className="mt-2">This version only checks for 11 digits, keeping identity onboarding fast and simple.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-navy px-5 py-4 text-sm text-gray-300">
                        <p className="font-semibold text-white">Protects on-chain</p>
                        <p className="mt-2">The app derives the birth year and sends protected data into the Zama-powered confidential flow.</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-navy px-5 py-4 text-sm text-gray-300">
                        <p className="font-semibold text-white">Unlocks sharing</p>
                        <p className="mt-2">Once linked, the next screen prepares a shareable token automatically.</p>
                    </div>
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
