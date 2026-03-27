
import React, { useState } from 'react';

interface AuthPageProps {
  onLogin: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@shield.com');
  const [password, setPassword] = useState('Demo1234');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would have API calls here.
    // For this MVP, we just call onLogin directly.
    onLogin();
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
              className="w-full p-3 bg-navy-light border border-navy-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal"
              required 
            />
          </div>
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-gray-300 mb-2" htmlFor="confirm-password">Confirm Password</label>
              <input 
                type="password" 
                id="confirm-password" 
                className="w-full p-3 bg-navy-light border border-navy-light rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal"
                required 
              />
            </div>
          )}
          <button type="submit" className="w-full bg-teal text-navy font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all duration-300">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
