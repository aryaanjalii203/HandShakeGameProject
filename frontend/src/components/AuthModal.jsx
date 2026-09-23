import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, Eye, EyeOff, Check, AlertCircle, 
  Sparkles, Zap, Shield, ArrowRight, Globe, Code2, Gamepad2 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext.jsx';
import { PLAYER_COLORS } from '../../../shared/constants.js';
import { soundEngine } from '../services/soundEngine.js';

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }) {
  const { signIn, signUp, forgotPassword } = usePlayer();
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'forgot'
  
  // Sign In Form State
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showSignInPass, setShowSignInPass] = useState(false);

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPass, setShowSignUpPass] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('⚡');
  const [selectedColor, setSelectedColor] = useState('#00f0ff');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const avatars = ['⚡', '👾', '🚀', '🔥', '🔮', '🎮', '💀', '🤖', '👑', '🎯', '🐱', '🛡️'];

  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-700' };
    if (pass.length < 6) return { score: 1, text: 'Too short', color: 'bg-red-500' };
    if (pass.length < 8) return { score: 2, text: 'Fair', color: 'bg-amber-400' };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) return { score: 4, text: 'Strong', color: 'bg-emerald-400' };
    return { score: 3, text: 'Good', color: 'bg-cyan-400' };
  };

  const strength = getPasswordStrength(signUpPassword);

  const handleSignInSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    soundEngine.play('click');
    setTimeout(() => {
      const result = signIn(signInIdentifier, signInPassword, rememberMe);
      setIsLoading(false);
      if (result.success) {
        soundEngine.play('win');
        setSuccessMsg(`Welcome back, ${result.user.username}!`);
        setTimeout(() => onClose(), 600);
      } else {
        soundEngine.play('game_over');
        setErrorMsg(result.message);
      }
    }, 300);
  };

  const handleSignUpSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!agreeTerms) {
      setErrorMsg('Please agree to the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    soundEngine.play('click');

    setTimeout(() => {
      const result = signUp({
        name: signUpName,
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
        avatar: selectedAvatar,
        color: selectedColor
      });
      setIsLoading(false);

      if (result.success) {
        soundEngine.play('win');
        setSuccessMsg(`Account created! Welcome to PlayForge, ${result.user.username}!`);
        setTimeout(() => onClose(), 600);
      } else {
        soundEngine.play('game_over');
        setErrorMsg(result.message);
      }
    }, 300);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    soundEngine.play('click');
    setTimeout(() => {
      const result = forgotPassword(forgotEmail);
      setIsLoading(false);
      if (result.success) {
        setSuccessMsg(result.message);
      } else {
        setErrorMsg(result.message);
      }
    }, 300);
  };

  const handleQuickDemoLogin = () => {
    soundEngine.play('click');
    setSignInIdentifier('alex@playforge.io');
    setSignInPassword('password123');
    const result = signIn('alex@playforge.io', 'password123', true);
    if (result.success) {
      soundEngine.play('win');
      setSuccessMsg('Logged in as Demo User (CyberPilot_401)');
      setTimeout(() => onClose(), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#0e1626] border border-cyan-500/30 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Close button */}
        <button
          onClick={() => { soundEngine.play('click'); onClose(); }}
          className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="font-heading font-black text-white text-xl tracking-wider">
              PLAY<span className="text-cyan-400">FORGE</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === 'signin' && 'Sign in to sync your high scores, trophies, and multiplayer ranks.'}
            {mode === 'signup' && 'Create your free account to access global multiplayer arenas.'}
            {mode === 'forgot' && 'Reset your password and regain access to your player profile.'}
          </p>

          {/* Tab Switcher */}
          {mode !== 'forgot' && (
            <div className="flex p-1 mt-4 rounded-xl bg-slate-900 border border-slate-700/60">
              <button
                type="button"
                onClick={() => { soundEngine.play('click'); setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { soundEngine.play('click'); setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                className={`flex-1 py-2 rounded-lg font-heading font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alert Banners */}
        <div className="px-6 pt-3">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Body Forms */}
        <div className="p-6 pt-3 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* ========================================================= */}
          {/* TAB 1: SIGN IN                                            */}
          {/* ========================================================= */}
          {mode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5">
              
              {/* Email / Username */}
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Email Address or Handle
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="pilot@playforge.io or CyberPilot_401"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { soundEngine.play('click'); setMode('forgot'); setErrorMsg(''); }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSignInPass ? 'text' : 'password'}
                    required
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPass(!showSignInPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSignInPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-xs text-slate-300 cursor-pointer">
                  Remember this device
                </label>
              </div>

              {/* Sign In Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Sign In to PlayForge</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Login Button for Instant Testing */}
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-cyan-400 font-heading font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>1-Click Demo Sign In (Instant Pilot)</span>
              </button>

              {/* Social Login Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#0e1626] px-2 text-slate-500 font-bold">Or continue with</span>
                </div>
              </div>

              {/* Mock Social Logins */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-semibold gap-1.5 transition-colors cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-cyan-400" /> Google
                </button>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-semibold gap-1.5 transition-colors cursor-pointer"
                >
                  <Gamepad2 className="w-4 h-4 text-indigo-400" /> Discord
                </button>
                <button
                  type="button"
                  onClick={handleQuickDemoLogin}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center text-xs font-semibold gap-1.5 transition-colors cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-slate-300" /> GitHub
                </button>
              </div>

              {/* Footer Switch */}
              <p className="text-center text-xs text-slate-400 pt-2">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { soundEngine.play('click'); setMode('signup'); setErrorMsg(''); }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer underline"
                >
                  Sign Up Free
                </button>
              </p>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 2: SIGN UP                                            */}
          {/* ========================================================= */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              
              <div className="grid grid-cols-2 gap-2.5">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Handle / Gamer Tag */}
                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Handle
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value)}
                    placeholder="CyberPilot_99"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Create Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSignUpPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPass(!showSignUpPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSignUpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {signUpPassword && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden flex gap-1">
                      <div className={`h-full flex-1 ${strength.score >= 1 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 2 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 3 ? strength.color : 'bg-transparent'}`} />
                      <div className={`h-full flex-1 ${strength.score >= 4 ? strength.color : 'bg-transparent'}`} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{strength.text}</span>
                  </div>
                )}
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Choose Pilot Glyph
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {avatars.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => { soundEngine.play('click'); setSelectedAvatar(av); }}
                      className={`p-1.5 rounded-lg text-lg transition-all cursor-pointer ${
                        selectedAvatar === av
                          ? 'bg-cyan-500/25 border border-cyan-400 scale-105 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Aura */}
              <div>
                <label className="block text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Signature Neon Aura
                </label>
                <div className="flex items-center gap-2">
                  {PLAYER_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { soundEngine.play('click'); setSelectedColor(c); }}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c, boxShadow: selectedColor === c ? `0 0 12px ${c}` : 'none' }}
                    >
                      {selectedColor === c && <Check className="w-4 h-4 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-slate-300 cursor-pointer">
                  I accept the PlayForge gaming rules and privacy policy
                </label>
              </div>

              {/* Sign Up Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create PlayForge Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer Switch */}
              <p className="text-center text-xs text-slate-400 pt-1">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { soundEngine.play('click'); setMode('signin'); setErrorMsg(''); }}
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* ========================================================= */}
          {/* TAB 3: FORGOT PASSWORD                                    */}
          {/* ========================================================= */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Send Recovery Instructions</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { soundEngine.play('click'); setMode('signin'); setErrorMsg(''); }}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End Encrypted Session</span>
          </span>
          <span>Vercel Cloud Ready</span>
        </div>

      </div>
    </div>
  );
}
