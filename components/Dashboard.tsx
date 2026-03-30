import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, UserCircleIcon, QrCodeIcon, ArrowLeftOnRectangleIcon, ClockIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import LinkIdentity from './dashboard/LinkIdentity';
import IssueToken from './dashboard/IssueToken';
import MerchantDemo from './dashboard/MerchantDemo';
import BlockchainStatusCard from './dashboard/BlockchainStatusCard';
import TokenHistory from './dashboard/TokenHistory';
import HowItWorks from './dashboard/HowItWorks';
import { connectDemoWallet, connectWallet, getBlockchainStatus } from '../lib/blockchain';
import { BlockchainStatus, Profile, IssuedToken, ValidationLog } from '../types';

type DashboardView = 'guide' | 'identity' | 'issue' | 'validate' | 'history';
const IDENTITY_STORAGE_KEY = 'shieldshield.identity.linked';

interface DashboardProps {
  onLogout: () => void;
  profiles: Profile[];
  issuedTokens: IssuedToken[];
  validationLogs: ValidationLog[];
  lastIssuedToken: IssuedToken | null;
  onUpdateProfile: (profile: Profile) => void;
  onAddToken: (token: IssuedToken) => void;
  onRevokeToken: (tokenId: string) => void;
  onAddLog: (log: ValidationLog) => void;
  onClearLastIssuedToken: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    onLogout, 
    profiles, 
    issuedTokens, 
    validationLogs, 
    lastIssuedToken, 
    onUpdateProfile, 
    onAddToken, 
    onRevokeToken, 
    onAddLog,
    onClearLastIssuedToken 
}) => {
  const [currentView, setCurrentView] = useState<DashboardView>('guide');
  const [identityLinked, setIdentityLinked] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(IDENTITY_STORAGE_KEY) === 'true';
  });
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus>({
    walletConnected: false,
    walletAddress: null,
    chainId: null,
    networkLabel: 'Wallet disconnected',
    contractConfigured: Boolean(import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS),
    contractAddress: import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS || null,
    mode: import.meta.env.VITE_SHIELD_IDENTITY_ADDRESS ? 'fhevm' : 'mock',
    identityRegisteredOnChain: false,
    activeOnChainTokens: 0,
    lastAgeProofResult: null,
  });

  useEffect(() => {
    if (!identityLinked) {
      return;
    }

    const resetTimer = window.setTimeout(() => {
      setIdentityLinked(false);
      window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
      window.localStorage.removeItem('shieldshield.identity.summary');
    }, 30 * 60 * 1000);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [identityLinked]);

  const refreshBlockchainState = async () => {
    const status = await getBlockchainStatus();
    setBlockchainStatus((prev) => ({
      ...status,
      lastAgeProofResult: status.lastAgeProofResult ?? prev.lastAgeProofResult,
    }));
  };

  const handleConnectWallet = async () => {
    const status = await connectWallet();
    setBlockchainStatus(status);
  };

  const handleConnectDemo = async () => {
    const status = await connectDemoWallet();
    setBlockchainStatus(status);
  };

  const NavItem = ({ icon, label, view, active }: { icon: React.ElementType, label: string, view: DashboardView, active: boolean }) => {
    const Icon = icon;
    return (
      <button 
        onClick={() => {
            setCurrentView(view);
        }}
        className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${active ? 'bg-teal text-navy' : 'text-gray-300 hover:bg-navy-light'}`}
      >
        <Icon className="h-6 w-6 mr-3" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const MobileNavItem = ({ icon, label, view, active }: { icon: React.ElementType, label: string, view: DashboardView, active: boolean }) => {
    const Icon = icon;
    return (
      <button
        onClick={() => {
          setCurrentView(view);
        }}
        className={`flex min-w-max items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          active ? 'bg-teal text-navy' : 'bg-navy-dark text-gray-300'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </button>
    );
  };

  const NavSection = ({ label }: { label: string }) => (
    <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">
      {label}
    </p>
  );

  const renderView = () => {
    switch(currentView) {
      case 'guide': return <HowItWorks />;
      case 'identity': return <LinkIdentity isLinked={identityLinked} blockchainStatus={blockchainStatus} onConnectDemo={handleConnectDemo} onLink={() => {
        setIdentityLinked(true);
        window.localStorage.setItem(IDENTITY_STORAGE_KEY, 'true');
        setCurrentView('issue');
      }} onBlockchainSync={refreshBlockchainState} />;
      case 'issue': return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} blockchainStatus={blockchainStatus} onBlockchainSync={refreshBlockchainState} />;
      case 'validate': return <MerchantDemo tokens={issuedTokens} profiles={profiles} onAddLog={onAddLog} lastIssuedToken={lastIssuedToken} />;
      case 'history': return <TokenHistory tokens={issuedTokens} logs={validationLogs} onRevoke={onRevokeToken} onBlockchainSync={refreshBlockchainState} />;
      default: return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} blockchainStatus={blockchainStatus} onBlockchainSync={refreshBlockchainState} />;
    }
  }

  return (
    <div className="min-h-screen bg-navy text-white">
      <div className="md:hidden border-b border-white/5 bg-navy px-4 py-4">
        <div className="rounded-2xl bg-navy-dark px-4 py-5 shadow-lg">
          <h1 className="text-3xl font-bold text-teal">Shield Shield</h1>
          <p className="mt-2 text-sm text-gray-400">Confidential identity sharing powered by selective disclosure.</p>
        </div>
        <div className="mt-4 space-y-3">
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2">
              <MobileNavItem icon={InformationCircleIcon} label="How It Works" view="guide" active={currentView === 'guide'} />
              <MobileNavItem icon={UserCircleIcon} label="Link Identity" view="identity" active={currentView === 'identity'} />
              <MobileNavItem icon={QrCodeIcon} label="Share Token" view="issue" active={currentView === 'issue'} />
              <MobileNavItem icon={ShieldCheckIcon} label="Merchant Demo" view="validate" active={currentView === 'validate'} />
              <MobileNavItem icon={ClockIcon} label="Access History" view="history" active={currentView === 'history'} />
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center w-full text-center px-4 py-3 rounded-lg bg-navy-dark text-gray-300 hover:bg-red-500 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
      <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="hidden w-full md:w-64 bg-navy-dark p-4 md:flex flex-col flex-shrink-0">
        <div className="mb-8 rounded-2xl bg-navy px-4 py-5 text-center shadow-lg">
          <h1 className="text-3xl font-bold text-teal">Shield Shield</h1>
          <p className="mt-2 text-sm text-gray-400">Confidential identity sharing powered by selective disclosure.</p>
        </div>
        <div className="flex-grow space-y-2">
          <NavSection label="Overview" />
          <NavItem icon={InformationCircleIcon} label="How It Works" view="guide" active={currentView === 'guide'} />

          <NavSection label="User Journey" />
          <NavItem icon={UserCircleIcon} label="1. Link Identity" view="identity" active={currentView === 'identity'} />
          <NavItem icon={QrCodeIcon} label="2. Share Token" view="issue" active={currentView === 'issue'} />
          <NavItem icon={ClockIcon} label="4. Access History" view="history" active={currentView === 'history'} />

          <NavSection label="Verifier View" />
          <NavItem icon={ShieldCheckIcon} label="3. Merchant Demo" view="validate" active={currentView === 'validate'} />
        </div>
        <div className="space-y-3">
          <button 
            onClick={onLogout}
            className="flex items-center w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
      <main className="flex-1 p-4 sm:p-6 lg:p-10 bg-navy overflow-y-auto">
        <div className="mb-6">
          <BlockchainStatusCard
            status={blockchainStatus}
            onConnectWallet={handleConnectWallet}
            isIdentityLinked={identityLinked}
          />
        </div>
        {renderView()}
      </main>
      </div>
    </div>
  );
};

export default Dashboard;
