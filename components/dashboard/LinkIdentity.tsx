
import React, { useState } from 'react';
import { validateIdentityNumber } from '../../utils/validation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface LinkIdentityProps {
    isLinked: boolean;
    onLink: () => void;
}

const LinkIdentity: React.FC<LinkIdentityProps> = ({ isLinked, onLink }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [validationStatus, setValidationStatus] = useState<{ isValid: boolean; message: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateIdentityNumber(idNumber);
    if (result.isValid) {
      setValidationStatus({ isValid: true, message: 'Identity number is valid and has been linked successfully!' });
      onLink();
    } else {
      setValidationStatus({ isValid: false, message: result.error || 'An unknown validation error occurred.' });
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
                    <label className="block text-gray-300 mb-2" htmlFor="idNumber">National Identity Number</label>
                    <input type="text" id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="e.g., 123.456.789-00" className="w-full p-3 bg-navy-light rounded-lg focus:outline-none focus:ring-2 focus:ring-teal" required />
                </div>
                <div>
                    <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all">Validate and Link</button>
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
