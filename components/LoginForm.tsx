
import React, { useState } from 'react';
import { BRAND_LOGO_URL } from '../constants.ts';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'hradmin' && password === 'hr@757') {
      onLogin();
    } else {
      setError('Invalid credentials. Access Denied.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-white p-8 text-center border-b border-slate-50">
          <div className="flex justify-center mb-6">
            <img 
              src={BRAND_LOGO_URL} 
              alt="Logo" 
              className="h-20 object-contain drop-shadow-sm" 
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>
          <h2 className="text-slate-800 text-xl font-black uppercase tracking-tight">HR Management Portal</h2>
          <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-slate-50/30">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg border border-red-100 animate-shake">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
              placeholder="e.g. hradmin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            Sign In to Dashboard
          </button>
          
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Secure Encryption Active
          </p>
        </form>
      </div>
    </div>
  );
};
