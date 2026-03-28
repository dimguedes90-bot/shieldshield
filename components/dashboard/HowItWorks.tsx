import React from 'react';

const HowItWorks: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-navy-dark p-8 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            Hackathon Overview
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
            In-app guide
          </span>
        </div>
        <h2 className="mt-5 text-4xl font-bold text-teal">How Shield Shield Works</h2>
        <p className="mt-4 max-w-3xl text-lg text-gray-300">
          Shield Shield protects Brazil&apos;s CPF by storing identity data in a confidential on-chain layer powered by Zama fhEVM and sharing temporary tokens instead of the raw identifier.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
          <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            Problem
          </span>
          <p className="mt-4 text-gray-300">
            CPF is requested constantly and overshared. Once leaked, the user loses control over who can verify or reuse that identity.
          </p>
        </div>
        <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
            Solution
          </span>
          <p className="mt-4 text-gray-300">
            Register the identity confidentially, create a temporary shareable token, and let merchants validate attributes without seeing the underlying CPF.
          </p>
        </div>
        <div className="rounded-2xl bg-navy-dark p-6 shadow-lg">
          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300">
            Why Zama
          </span>
          <p className="mt-4 text-gray-300">
            Zama fhEVM lets the app keep identity logic on-chain while preserving confidentiality, enabling proofs such as “over 18” without exposing raw personal data.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-navy-dark p-8 shadow-lg">
        <h3 className="text-2xl font-semibold text-white">Page Map</h3>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-navy p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                User Flow
              </span>
              <p className="font-semibold text-white">Link Identity</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">The user enters data once. Shield Shield validates the CPF format and registers the identity in the confidential blockchain layer.</p>
          </div>
          <div className="rounded-xl bg-navy p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                User Flow
              </span>
              <p className="font-semibold text-white">Share Token</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">After registration, the app prepares a temporary token automatically so the user can share that instead of the CPF.</p>
          </div>
          <div className="rounded-xl bg-navy p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                Vendor Demo
              </span>
              <p className="font-semibold text-white">Merchant Demo</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">This simulates the verifier side: a merchant receives the token, validates it, and proves an attribute such as being over 18.</p>
          </div>
          <div className="rounded-xl bg-navy p-5">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
                User Flow
              </span>
              <p className="font-semibold text-white">Access History</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">This gives the user visibility into which merchants received access, what is still active, and where a token can be revoked.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-navy-dark p-8 shadow-lg">
        <h3 className="text-2xl font-semibold text-white">Visual Legend</h3>
        <div className="mt-5 flex flex-wrap gap-3">
          <span className="rounded-full bg-teal/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal">
            User Flow
          </span>
          <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
            Vendor Demo
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          These labels are intentionally subtle. They help the jury understand which screens belong to the user experience and which one represents the verifier side of the flow.
        </p>
      </div>
    </div>
  );
};

export default HowItWorks;
