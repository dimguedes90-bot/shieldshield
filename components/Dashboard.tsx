import React, { useState } from 'react';
import { ShieldCheckIcon, UserCircleIcon, QrCodeIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import LinkIdentity from './dashboard/LinkIdentity';
import ManageProfiles from './dashboard/ManageProfiles';
import IssueToken from './dashboard/IssueToken';
import MerchantDemo from './dashboard/MerchantDemo';
import TokenHistory from './dashboard/TokenHistory';
import { Profile, IssuedToken, ValidationLog } from '../types';

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
  // Defaulting to true to make testing token features easier without linking identity on every reload.
  const [identityLinked, setIdentityLinked] = useState(true);

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
      case 'identity': return <LinkIdentity isLinked={identityLinked} onLink={() => setIdentityLinked(true)} />;
      case 'profiles': return <ManageProfiles profiles={profiles} onUpdateProfile={onUpdateProfile} />;
      case 'issue': return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} />;
      case 'validate': return <MerchantDemo tokens={issuedTokens} profiles={profiles} onAddLog={onAddLog} />;
      case 'history': return <TokenHistory tokens={issuedTokens} logs={validationLogs} onRevoke={onRevokeToken} />;
      default: return <IssueToken isIdentityLinked={identityLinked} onIssueToken={onAddToken} profiles={profiles} lastIssuedToken={lastIssuedToken} onClearLastIssuedToken={onClearLastIssuedToken} />;
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
        <div>
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
