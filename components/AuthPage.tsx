
import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { validateStrongPassword } from '../utils/validation';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@shield.com');
  const [password, setPassword] = useState('Demo1234');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    void handleAuthSubmit(e);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setStatusMessage(null);
    setErrorMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setErrorMessage('Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable authentication.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!isLogin) {
      const passwordValidation = validateStrongPassword(password);
      if (!passwordValidation.isValid) {
        setErrorMessage(passwordValidation.error || 'Password does not meet the security requirements.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setStatusMessage('Login successful. Redirecting...');
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setStatusMessage('Account created successfully. Redirecting...');
      } else {
        setStatusMessage('Account created. Check your email to confirm your registration before logging in.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-dark p-4">
      <div className="w-full max-w-md bg-navy p-8 rounded-lg shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal">Shield Shield</h1>
          <p className="text-gray-300 mt-2">Your Privacy-Preserving Digital Identity</p>
        </div>
        
        <div className="mb-6">
          <div className="flex bg-navy-dark rounded-lg p-1">
            <button onClick={() => setIsLogin(true)} className={`w-1/2 p-2 rounded-md transition-colors ${isLogin ? 'bg-teal text-navy font-semibold' : 'text-gray-300'}`}>
              Login
            </button>
            <button onClick={() => setIsLogin(false)} className={`w-1/2 p-2 rounded-md transition-colors ${!isLogin ? 'bg-teal text-navy font-semibold' : 'text-gray-300'}`}>
              Register
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              className="w-full p-3 bg-navy-light border border-navy-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal"
              required 
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-300 mb-2" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting || !isSupabaseConfigured}
              className="w-full p-3 bg-navy-light border border-navy-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal"
              required 
            />
            {!isLogin && (
              <p className="mt-2 text-sm text-gray-400">
                Use at least 8 characters with uppercase, lowercase, number, and special character.
              </p>
            )}
          </div>
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2" htmlFor="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || !isSupabaseConfigured}
                className="w-full p-3 bg-navy-light border border-navy-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal"
                required 
              />
            </div>
          )}
          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              Supabase is not configured yet. Add your project URL and anon key to <code>.env.local</code>.
            </div>
          )}
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}
          {statusMessage && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
              {statusMessage}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isSupabaseConfigured}
            className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
