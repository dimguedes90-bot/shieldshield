import React, { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import { resetDemoBlockchainState } from './lib/blockchain';
import { Profile, IssuedToken, ValidationLog } from './types';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';

export type Page = 'auth' | 'dashboard';
const TOKENS_STORAGE_KEY = 'shieldshield.tokens';
const LAST_TOKEN_STORAGE_KEY = 'shieldshield.lastToken';
const LOGS_STORAGE_KEY = 'shieldshield.validationLogs';
const IDENTITY_STORAGE_KEY = 'shieldshield.identity.linked';
const IDENTITY_SUMMARY_STORAGE_KEY = 'shieldshield.identity.summary';

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

const createInitialTokensData = (): IssuedToken[] => {
  const now = Date.now();

  return [
    {
      id: 'tok_seed_serasa',
      token_string: 'sst_seed_serasa_credit_score',
      qrCodeDataUrl: 'sst_seed_serasa_credit_score',
      merchant_id: 'serasa-score',
      merchant_label: 'Serasa Score Check',
      scope: 'credit-score-check',
      use_case: 'Credit score consultation before approving a personal loan.',
      profile_id: 'personal',
      exp_ts: now + 1000 * 60 * 60 * 6,
      active: true,
    },
    {
      id: 'tok_seed_nubank',
      token_string: 'sst_seed_nubank_onboarding',
      qrCodeDataUrl: 'sst_seed_nubank_onboarding',
      merchant_id: 'nubank-onboarding',
      merchant_label: 'Nubank Account Opening',
      scope: 'account-opening',
      use_case: 'Identity and age confirmation during digital account onboarding.',
      profile_id: 'personal',
      exp_ts: now + 1000 * 60 * 45,
      active: true,
    },
    {
      id: 'tok_seed_ifood',
      token_string: 'sst_seed_ifood_driver',
      qrCodeDataUrl: 'sst_seed_ifood_driver',
      merchant_id: 'ifood-rider',
      merchant_label: 'iFood Rider Registration',
      scope: 'worker-verification',
      use_case: 'Employment and identity verification for rider registration.',
      profile_id: 'corporate',
      exp_ts: now - 1000 * 60 * 20,
      active: true,
    },
    {
      id: 'tok_seed_vivo',
      token_string: 'sst_seed_vivo_plan',
      qrCodeDataUrl: 'sst_seed_vivo_plan',
      merchant_id: 'vivo-planos',
      merchant_label: 'Vivo Mobile Plan',
      scope: 'telecom-risk-check',
      use_case: 'Risk and identity confirmation for a new mobile plan.',
      profile_id: 'personal',
      exp_ts: now + 1000 * 60 * 60 * 2,
      active: false,
    },
  ];
};

const createInitialValidationLogs = (): ValidationLog[] => {
  const now = Date.now();

  return [
    {
      id: 'log_seed_serasa',
      token_id: 'tok_seed_serasa',
      merchant_id: 'serasa-score',
      merchant_label: 'Serasa Score Check',
      timestamp: now - 1000 * 60 * 55,
      result: 'Valid',
      purpose: 'A lender requested a credit score review before approving financing.',
    },
    {
      id: 'log_seed_nubank',
      token_id: 'tok_seed_nubank',
      merchant_id: 'nubank-onboarding',
      merchant_label: 'Nubank Account Opening',
      timestamp: now - 1000 * 60 * 25,
      result: 'Valid',
      purpose: 'A digital bank verified identity and age during account opening.',
    },
    {
      id: 'log_seed_ifood',
      token_id: 'tok_seed_ifood',
      merchant_id: 'ifood-rider',
      merchant_label: 'iFood Rider Registration',
      timestamp: now - 1000 * 60 * 15,
      result: 'Expired',
      purpose: 'A delivery platform tried to reuse an expired worker verification token.',
    },
    {
      id: 'log_seed_vivo',
      token_id: 'tok_seed_vivo',
      merchant_id: 'vivo-planos',
      merchant_label: 'Vivo Mobile Plan',
      timestamp: now - 1000 * 60 * 5,
      result: 'Revoked',
      purpose: 'A telecom provider attempted to validate access after the user revoked it.',
    },
  ];
};

const resetDemoState = () => {
  resetDemoBlockchainState();
  const seededTokens = createInitialTokensData();
  const seededLogs = createInitialValidationLogs();

  window.localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(seededTokens));
  window.localStorage.removeItem(LAST_TOKEN_STORAGE_KEY);
  window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(seededLogs));
  window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
  window.localStorage.removeItem(IDENTITY_SUMMARY_STORAGE_KEY);

  return {
    tokens: seededTokens,
    logs: seededLogs,
  };
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Centralized State
  const [profiles, setProfiles] = useState<Profile[]>(initialProfilesData);
  const [issuedTokens, setIssuedTokens] = useState<IssuedToken[]>(() => {
    if (typeof window === 'undefined') {
      return createInitialTokensData();
    }

    const stored = window.localStorage.getItem(TOKENS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : createInitialTokensData();
  });
  const [validationLogs, setValidationLogs] = useState<ValidationLog[]>(() => {
    if (typeof window === 'undefined') {
      return createInitialValidationLogs();
    }

    const stored = window.localStorage.getItem(LOGS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : createInitialValidationLogs();
  });
  const [lastIssuedToken, setLastIssuedToken] = useState<IssuedToken | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    const stored = window.localStorage.getItem(LAST_TOKEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    const seeded = resetDemoState();
    setIssuedTokens(seeded.tokens);
    setValidationLogs(seeded.logs);
    setLastIssuedToken(null);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(issuedTokens));
  }, [issuedTokens]);

  useEffect(() => {
    window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(validationLogs));
  }, [validationLogs]);

  useEffect(() => {
    if (!lastIssuedToken) {
      window.localStorage.removeItem(LAST_TOKEN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(LAST_TOKEN_STORAGE_KEY, JSON.stringify(lastIssuedToken));
  }, [lastIssuedToken]);

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
    const seeded = resetDemoState();
    setIssuedTokens(seeded.tokens);
    setValidationLogs(seeded.logs);
    setLastIssuedToken(null);
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
    </div>
  );
};

export default App;
