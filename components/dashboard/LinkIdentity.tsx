
import React, { useState } from 'react';
import { registerIdentityOnChain } from '../../lib/blockchain';
import { validateIdentityNumber } from '../../utils/validation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface LinkIdentityProps {
    isLinked: boolean;
    onLink: () => void;
    onBlockchainSync: () => Promise<void>;
}

type ValidationMode = 'document' | 'cpf-only';
type DocumentType = 'cnh' | 'rg';

const LinkIdentity: React.FC<LinkIdentityProps> = ({ isLinked, onLink, onBlockchainSync }) => {
  const [validationMode, setValidationMode] = useState<ValidationMode>('document');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [cpf, setCpf] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('cnh');
  const [documentExpiry, setDocumentExpiry] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [validationStatus, setValidationStatus] = useState<{ isValid: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dob) {
      setValidationStatus({ isValid: false, message: 'Enter your date of birth to continue.' });
      return;
    }

    const birthYear = new Date(`${dob}T00:00:00`).getFullYear();
    if (Number.isNaN(birthYear)) {
      setValidationStatus({ isValid: false, message: 'Enter a valid date of birth.' });
      return;
    }

    if (validationMode === 'cpf-only') {
      if (!cpf.trim()) {
        setValidationStatus({ isValid: false, message: 'Enter a CPF to continue.' });
        return;
      }

      try {
        const result = await registerIdentityOnChain({ cpf, birthYear });
        setValidationStatus({
          isValid: true,
          message: `CPF linked without documentary verification. On-chain identity registered in ${result.mode === 'fhevm' ? 'live fhEVM' : 'mock'} mode.`,
        });
        onLink();
        await onBlockchainSync();
      } catch (error) {
        setValidationStatus({
          isValid: false,
          message: error instanceof Error ? error.message : 'Failed to register the identity on-chain.',
        });
      }
      return;
    }

    const cpfValidation = validateIdentityNumber(cpf);
    if (!cpfValidation.isValid) {
      setValidationStatus({ isValid: false, message: cpfValidation.error || 'Invalid CPF.' });
      return;
    }

    if (!documentFile) {
      setValidationStatus({ isValid: false, message: 'Upload a valid CNH or RG file to continue.' });
      return;
    }

    if (!documentExpiry) {
      setValidationStatus({ isValid: false, message: 'Enter the document expiry date.' });
      return;
    }

    const expiryDate = new Date(`${documentExpiry}T23:59:59`);
    if (Number.isNaN(expiryDate.getTime())) {
      setValidationStatus({ isValid: false, message: 'Enter a valid expiry date.' });
      return;
    }

    if (expiryDate.getTime() < Date.now()) {
      setValidationStatus({
        isValid: false,
        message: `The uploaded ${documentType === 'cnh' ? 'CNH' : 'RG'} is expired. Use a valid document.`,
      });
      return;
    }

    try {
      const result = await registerIdentityOnChain({ cpf, birthYear });
      setValidationStatus({
        isValid: true,
        message: `${documentType === 'cnh' ? 'CNH' : 'RG'} accepted. Identity stored on-chain in ${result.mode === 'fhevm' ? 'live fhEVM' : 'mock'} mode.`,
      });
      onLink();
      await onBlockchainSync();
    } catch (error) {
      setValidationStatus({
        isValid: false,
        message: error instanceof Error ? error.message : 'Failed to register the identity on-chain.',
      });
    }
  };

  if (isLinked) {
    return (
        <div className="bg-navy-dark p-8 rounded-lg shadow-lg text-center">
             <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
             <h2 className="text-2xl font-bold mb-2">Identity Linked</h2>
             <p className="text-gray-300">Your national identity number has been securely validated and linked to your account.</p>
        </div>
    );
  }

  return (
    <div>
        <h2 className="text-3xl font-bold mb-6 text-teal">Link Your National Identity</h2>
        <div className="bg-navy-dark p-8 rounded-lg shadow-lg">
            <div className="mb-6">
                <div className="flex bg-navy rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => {
                          setValidationMode('document');
                          setValidationStatus(null);
                        }}
                        className={`w-1/2 rounded-md px-4 py-3 text-sm font-medium transition-colors ${validationMode === 'document' ? 'bg-teal text-navy' : 'text-gray-300'}`}
                    >
                        Upload CNH / RG
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          setValidationMode('cpf-only');
                          setValidationStatus(null);
                        }}
                        className={`w-1/2 rounded-md px-4 py-3 text-sm font-medium transition-colors ${validationMode === 'cpf-only' ? 'bg-teal text-navy' : 'text-gray-300'}`}
                    >
                        CPF only
                    </button>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                    {validationMode === 'document'
                      ? 'Upload a valid CNH or RG with CPF and provide the document expiry date for a stronger verification flow.'
                      : 'Use this faster option to link only the CPF, without documentary verification.'}
                </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="firstName">First Name</label>
                        <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2" htmlFor="lastName">Last Name</label>
                        <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                    </div>
                </div>
                <div>
                    <label className="block text-gray-300 mb-2" htmlFor="dob">Date of Birth</label>
                    <input type="date" id="dob" value={dob} onChange={e => setDob(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" />
                </div>
                <div>
                    <label className="block text-gray-300 mb-2" htmlFor="cpf">
                        {validationMode === 'document' ? 'CPF on document' : 'CPF'}
                    </label>
                    <input type="text" id="cpf" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="e.g., 123.456.789-00" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                {validationMode === 'document' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-gray-300 mb-2" htmlFor="documentType">Document Type</label>
                                <select id="documentType" value={documentType} onChange={e => setDocumentType(e.target.value as DocumentType)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal appearance-none">
                                    <option value="cnh">CNH</option>
                                    <option value="rg">RG with CPF</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-300 mb-2" htmlFor="documentExpiry">Expiry Date</label>
                                <input type="date" id="documentExpiry" value={documentExpiry} onChange={e => setDocumentExpiry(e.target.value)} className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-300 mb-2" htmlFor="documentFile">Upload document</label>
                            <input
                                type="file"
                                id="documentFile"
                                accept=".pdf,image/*"
                                onChange={e => setDocumentFile(e.target.files?.[0] || null)}
                                className="w-full rounded-lg bg-navy-light p-3 text-gray-300 file:mr-4 file:rounded-md file:border-0 file:bg-teal file:px-4 file:py-2 file:font-semibold file:text-navy hover:file:bg-white"
                                required
                            />
                            <p className="mt-2 text-sm text-gray-400">
                                Accepted formats: PDF, JPG, JPEG or PNG. The current MVP validates the attached file presence, CPF, and expiry date.
                            </p>
                        </div>
                    </>
                )}
                <div>
                    <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">
                        {validationMode === 'document' ? 'Validate Document and Link' : 'Link CPF without Verification'}
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
