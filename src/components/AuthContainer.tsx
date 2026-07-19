import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Shield, User as UserIcon, Sparkles } from 'lucide-react';
import { User } from '../types';

interface AuthContainerProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthContainer({ onLoginSuccess }: AuthContainerProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'oauth'>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Unable to connect to service.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockOAuth = async (preset: { email: string; name: string }) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: preset.email, full_name: preset.name }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Mock OAuth login failed.');
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Unable to complete OAuth login.');
    } finally {
      setIsLoading(false);
    }
  };

  const presets = [
    { name: 'Mayur Rockstars', email: 'mayurirockstars@gmail.com', role: 'Student' },
    { name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Educator' },
    { name: 'Alex Smith', email: 'alex.smith@example.com', role: 'Developer' },
  ];

  return (
    <div id="auth_container" className="min-h-screen flex items-center justify-center bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.08),rgba(255,255,255,0))] p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Banner with branding */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center p-3 rounded-xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-sans font-bold tracking-tight text-slate-900 mb-1">
            EduCraft<span className="text-indigo-600">AI</span>
          </h1>
          <p className="text-slate-500 text-sm">
            PDF to E-Course Learning Platform
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200/50 bg-slate-50/40 p-1">
          <button
            id="tab_email"
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'email'
                ? 'bg-white border border-slate-200/80 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Sign-In
          </button>
          <button
            id="tab_oauth"
            onClick={() => setActiveTab('oauth')}
            className={`flex-1 py-3 text-sm font-medium transition-all duration-200 rounded-lg flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'oauth'
                ? 'bg-white border border-slate-200/80 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            OAuth Simulation
          </button>
        </div>

        {/* Form area */}
        <div className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'email' ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email_input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email_input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-sm"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label htmlFor="name_input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <input
                      id="name_input"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Mayur Rockstars"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-sm"
                    />
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  id="btn_email_login"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-350 text-white font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm mt-6 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enter Dashboard'
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="oauth-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="text-slate-500 text-xs mb-3 text-center leading-relaxed">
                  Experience full persistent integration immediately using one-click simulated single-sign-on matching predefined test environments.
                </div>

                {presets.map((preset, index) => (
                  <button
                    key={index}
                    id={`btn_oauth_preset_${index}`}
                    onClick={() => handleMockOAuth(preset)}
                    disabled={isLoading}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-left transition-all duration-150 flex items-center justify-between group hover:border-indigo-500/50 cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                          {preset.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {preset.email}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 bg-white text-slate-500 border border-slate-200 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                      {preset.role}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
