import React, { useEffect, useState } from 'react';
import { ShieldCheckIcon, UserCircleIcon, QrCodeIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LinkIdentity from './dashboard/LinkIdentity';
import ManageProfiles from './dashboard/ManageProfiles';
import IssueToken from './dashboard/IssueToken';
import MerchantDemo from './dashboard/MerchantDemo';
import TokenHistory from './dashboard/TokenHistory';
import BlockchainStatusCard from './dashboard/BlockchainStatusCard';
import { connectWallet, getBlockchainStatus, proveOver18OnChain } from '../lib/blockchain';
import { BlockchainStatus, Profile, IssuedToken, ValidationLog } from '../types';

type DashboardView = 'identity' | 'profiles' | 'issue' | 'validate' | 'history';

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
  const [currentView, setCurrentView] = useState<DashboardView>('issue');
  const [identityLinked, setIdentityLinked] = useState(false);
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
    }, 30 * 60 * 1000);

    return () => {
      window.clearTimeout(resetTimer);
    };
  }, [identityLinked]);

  useEffect(() => {
    void refreshBlockchainState();
  }, []);

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

  const handleProveOver18 = async () => {
    const result = await proveOver18OnChain(2026);
    await refreshBlockchainState();
    setBlockchainStatus((prev) => ({
      ...prev,
      lastAgeProofResult: result.verified,
    }));
  };

  const NavItem = ({ icon, label, view, active }: { icon: React.ElementType, label: string, view: DashboardView, active: boolean }) => {
    const Icon = icon;
    return (
      <button 
        onClick={() => {
            setCurrentView(view);
            if (view !== 'issue') {
                onClearLastIssuedToken();
            }
        }}
        className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${active ? 'bg-teal text-navy' : 'text-gray-300 hover:bg-navy-light'}`}
      >
        <Icon className="h-6 w-6 mr-3" />
        <span className="font-medium">{label}</span>
      </button>
    );
  };

  const renderView = () => {
    switch(currentView) {
      case 'identity': return <LinkIdentity isLinked={identityLinked} onLink={() => setIdentityLinked(true)} onBlockchainSync={refreshBlockchainState} />;
      case 'profiles': return <ManageProfiles profiles={profiles} onUpdateProfile={onUpdateProfile} />;
      case 'issue': return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} blockchainStatus={blockchainStatus} onBlockchainSync={refreshBlockchainState} />;
      case 'validate': return <MerchantDemo tokens={issuedTokens} profiles={profiles} onAddLog={onAddLog} />;
      case 'history': return <TokenHistory tokens={issuedTokens} logs={validationLogs} onRevoke={onRevokeToken} onBlockchainSync={refreshBlockchainState} />;
      default: return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} blockchainStatus={blockchainStatus} onBlockchainSync={refreshBlockchainState} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <nav className="w-full md:w-64 bg-navy-dark p-4 flex flex-col flex-shrink-0">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal">Shield Shield</h1>
        </div>
        <div className="flex-grow space-y-2">
          <NavItem icon={QrCodeIcon} label="Issue Token" view="issue" active={currentView === 'issue'} />
          <NavItem icon={ShieldCheckIcon} label="Validate Token" view="validate" active={currentView === 'validate'} />
          <NavItem icon={UserCircleIcon} label="Link Identity" view="identity" active={currentView === 'identity'} />
          <NavItem icon={Cog6ToothIcon} label="Manage Profiles" view="profiles" active={currentView === 'profiles'} />
          <NavItem icon={ClockIcon} label="History & Logs" view="history" active={currentView === 'history'} />
        </div>
        <div className="space-y-3">
          <BlockchainStatusCard
            status={blockchainStatus}
            onConnectWallet={handleConnectWallet}
            onRefreshStatus={refreshBlockchainState}
            onProveOver18={handleProveOver18}
          />
          <button 
            onClick={onLogout}
            className="flex items-center w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-red-500 hover:text-white transition-colors"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 bg-navy overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default Dashboard;
