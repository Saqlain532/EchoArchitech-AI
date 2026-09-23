import React, { useState } from 'react';
import { useAuth } from '../../context';
import {
  SparklesIcon,
  GitHubIcon,
  CheckCircleIcon,
  LoadingSpinner,
} from '../../assets/icons';

const ROLE_PRESETS = [
  'Lead Cloud Architect',
  'Senior Backend Engineer',
  'Fullstack Developer',
  'DevOps & Platform Lead',
  'Other',
];

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = 'login', // 'login' | 'signup' | 'github'
  bannerMessage,
  onSuccess,
}) {
  const { login, register, loginWithGithub } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign-up form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('Lead Cloud Architect');
  const [customRole, setCustomRole] = useState('');
  const [githubUsername, setGithubUsername] = useState('');

  // Direct GitHub tab state
  const [directGithubUser, setDirectGithubUser] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await login(loginEmail, loginPassword);
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const finalRole = selectedRole === 'Other' ? customRole.trim() || 'Software Architect' : selectedRole;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await register({
        name: name.trim() || 'New Architect',
        email,
        password,
        role: finalRole,
        githubUsername: githubUsername.trim(),
      });
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubDirect = async (e) => {
    e.preventDefault();
    if (!directGithubUser.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const user = await loginWithGithub(directGithubUser.trim());
      if (onSuccess) onSuccess(user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'GitHub onboarding failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setLoginEmail('architect@echoarchitect.ai');
    setLoginPassword('Architect@2026');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md theme-card theme-card-glow p-6 sm:p-7 relative shadow-2xl space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          aria-label="Close authentication modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-mono theme-badge theme-badge-cyan">
            <SparklesIcon className="w-3 h-3 theme-text-brand" />
            <span>EchoArchitech AI Identity</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight theme-text-primary">
            {activeTab === 'login' && 'Sign In to Your Workspace'}
            {activeTab === 'signup' && 'Create Your Architect Account'}
            {activeTab === 'github' && 'Continue with GitHub'}
          </h2>
          <p className="text-xs theme-text-secondary">
            {bannerMessage || 'Persist your architecture blueprints and monitor public GitHub commits.'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-500 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center border-b theme-border-subtle text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'border-cyan-500 text-cyan-500 font-bold'
                : 'border-transparent theme-text-secondary hover:theme-text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('signup');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'border-cyan-500 text-cyan-500 font-bold'
                : 'border-transparent theme-text-secondary hover:theme-text-primary'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('github');
              setErrorMessage(null);
            }}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'github'
                ? 'border-cyan-500 text-cyan-500 font-bold'
                : 'border-transparent theme-text-secondary hover:theme-text-primary'
            }`}
          >
            <GitHubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </button>
        </div>

        {/* TAB 1: Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider theme-text-muted">
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="architect@echoarchitect.ai"
                className="w-full theme-input text-xs sm:text-sm py-2 px-3"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider theme-text-muted">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full theme-input text-xs sm:text-sm py-2 px-3"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full theme-btn-brand text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <span>Sign In to Workspace</span>
              )}
            </button>

            {/* Quick Demo 1-Click Fill */}
            <div className="pt-2 border-t theme-border-subtle flex items-center justify-between text-xs">
              <span className="theme-text-muted">Testing the app?</span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-cyan-500 hover:underline font-mono text-[11px] font-semibold cursor-pointer"
              >
                ⚡ 1-Click Demo Architect
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Sign Up (With Custom Role) */}
        {activeTab === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Chen"
                  className="w-full theme-input text-xs py-2 px-2.5"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full theme-input text-xs py-2 px-2.5"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full theme-input text-xs py-2 px-2.5"
              />
            </div>

            {/* Role Selection & Dynamic Custom Role */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                Your Primary Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full theme-input text-xs py-2 px-2.5"
              >
                {ROLE_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Dynamic Custom Role Input */}
              {selectedRole === 'Other' && (
                <div className="pt-1 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter your custom role (e.g. AI Research Engineer)"
                    className="w-full theme-input text-xs py-2 px-2.5 font-medium border-cyan-500/50"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider theme-text-muted">
                GitHub Username (Optional)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono theme-text-muted">@</span>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="username (for 1-click repo selection)"
                  className="flex-1 theme-input text-xs py-2 px-2.5 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full theme-btn-brand text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register & Access Workspace</span>
              )}
            </button>
          </form>
        )}

        {/* TAB 3: Direct GitHub Onboarding */}
        {activeTab === 'github' && (
          <form onSubmit={handleGithubDirect} className="space-y-4">
            <div className="p-3.5 rounded-xl border theme-border-subtle bg-slate-50/50 dark:bg-slate-900/40 text-xs theme-text-secondary leading-relaxed space-y-1">
              <div className="font-semibold theme-text-primary flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                <span>Zero-Token Public GitHub Onboarding</span>
              </div>
              <p>
                Enter your public GitHub handle to immediately pull your avatar, auto-fetch your public repositories, and begin tracking architecture sprints.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider theme-text-muted">
                Public GitHub Username
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono theme-text-muted">github.com/</span>
                <input
                  type="text"
                  required
                  value={directGithubUser}
                  onChange={(e) => setDirectGithubUser(e.target.value)}
                  placeholder="your-github-username"
                  className="flex-1 theme-input text-xs sm:text-sm py-2 px-3 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !directGithubUser.trim()}
              className="w-full theme-btn-primary text-xs sm:text-sm py-2.5 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="w-4 h-4" />
                  <span>Connecting GitHub Identity...</span>
                </>
              ) : (
                <>
                  <GitHubIcon className="w-4 h-4" />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
