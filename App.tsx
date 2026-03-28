import React, { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ChatBot from './components/ChatBot';
import { Profile, IssuedToken, ValidationLog } from './types';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';

export type Page = 'auth' | 'dashboard';

const initialProfilesData: Profile[] = [
  {
    id: 'personal',
    name: 'Personal',
    toggles: {
      identity_number_token: false,
      professional_email: false,
      personal_email: true,
      professional_phone: false,
      personal_phone: true,
      linkedin_url: false,
      age_over_18: true,
    },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    toggles: {
      identity_number_token: true,
      professional_email: true,
      personal_email: false,
      professional_phone: true,
      personal_phone: false,
      linkedin_url: true,
      age_over_18: true,
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    toggles: {
      identity_number_token: false,
      professional_email: false,
      personal_email: false,
      professional_phone: false,
      personal_phone: false,
      linkedin_url: false,
      age_over_18: false,
    },
  },
];

const initialTokensData: IssuedToken[] = [
    {
        id: 'tok_1',
        token_string: 'sst_bWVyY2hhbnQtMTIzOnZlcmlmeToxNzA5ODg3NjAwMDAw',
        qrCodeDataUrl: 'sst_bWVyY2hhbnQtMTIzOnZlcmlmeToxNzA5ODg3NjAwMDAw',
        merchant_id: 'merchant-123',
        scope: 'age-verification',
        profile_id: 'personal',
        exp_ts: Date.now() + 120 * 1000,
        active: true,
    },
    {
        id: 'tok_2',
        token_string: 'sst_YWJjLWNvcnA6ZW1wbG95bWVudDoxNzA5ODg3NjAwMDAx',
        qrCodeDataUrl: 'sst_YWJjLWNvcnA6ZW1wbG95bWVudDoxNzA5ODg3NjAwMDAx',
        merchant_id: 'abc-corp',
        scope: 'employment',
        profile_id: 'corporate',
        exp_ts: Date.now() - 120 * 1000, // expired
        active: true,
    },
    {
        id: 'tok_3',
        token_string: 'sst_Z292LXNlcnZpY2U6YWNjZXNzOjE3MDk4ODc2MDAwMDI',
        qrCodeDataUrl: 'sst_Z292LXNlcnZpY2U6YWNjZXNzOjE3MDk4ODc2MDAwMDI',
        merchant_id: 'gov-service',
        scope: 'access',
        profile_id: 'custom',
        exp_ts: Date.now() + 3600 * 1000,
        active: false, // revoked
    },
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Centralized State
  const [profiles, setProfiles] = useState<Profile[]>(initialProfilesData);
  const [issuedTokens, setIssuedTokens] = useState<IssuedToken[]>(initialTokensData);
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>([]);
  const [lastIssuedToken, setLastIssuedToken] = useState<IssuedToken | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setIsAuthenticated(Boolean(data.session));
      setIsAuthLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
      setIsAuthLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase) {
      setIsAuthenticated(false);
      return;
    }

    await supabase.auth.signOut();
  };

  const handleEnterDemo = () => {
    setIsAuthenticated(true);
    setIsAuthLoading(false);
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    setProfiles(profiles.map(p => (p.id === updatedProfile.id ? updatedProfile : p)));
  };

  const handleAddToken = (token: IssuedToken) => {
    setIssuedTokens(prev => [token, ...prev]);
    setLastIssuedToken(token);
  };

  const handleRevokeToken = (tokenId: string) => {
    setIssuedTokens(tokens => tokens.map(t => (t.id === tokenId ? { ...t, active: false } : t)));
  };

  const handleAddLog = (log: ValidationLog) => {
    setValidationLogs(prev => [log, ...prev]);
  };
  
  const clearLastIssuedToken = () => {
      setLastIssuedToken(null);
  }


  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy text-white font-sans">
        <div className="rounded-lg bg-navy-dark px-6 py-4 text-sm text-gray-300 shadow-lg">
          Loading secure session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy text-white font-sans">
      {isAuthenticated ? (
        <Dashboard 
          onLogout={handleLogout}
          profiles={profiles}
          issuedTokens={issuedTokens}
          validationLogs={validationLogs}
          lastIssuedToken={lastIssuedToken}
          onUpdateProfile={handleUpdateProfile}
          onAddToken={handleAddToken}
          onRevokeToken={handleRevokeToken}
          onAddLog={handleAddLog}
          onClearLastIssuedToken={clearLastIssuedToken}
        />
      ) : (
        <AuthPage onEnterDemo={handleEnterDemo} />
      )}
      {isAuthenticated && <ChatBot />}
    </div>
  );
};

export default App;
