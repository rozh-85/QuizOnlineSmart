import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { getDeviceFingerprint } from '../utils/device';
import toast from 'react-hot-toast';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface LoginProps {
  mode: 'student' | 'teacher';
}

const Login = ({ mode }: LoginProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    serialId: '',
    pin: '',
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fingerprint = getDeviceFingerprint();
      let result;

      if (mode === 'student') {
        // Strip domain if user entered full email (e.g. ki232@kimya.com → ki232)
        let rawSerial = formData.serialId.trim();
        if (rawSerial.includes('@')) {
          rawSerial = rawSerial.split('@')[0];
        }
        const cleanSerialId = rawSerial.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        if (!cleanSerialId || !formData.pin) {
          throw new Error(t('auth.enterBothSerialPin'));
        }
        result = await authApi.signInWithSerial(cleanSerialId, formData.pin.trim(), fingerprint);
      } else {
        const email = formData.email.trim();
        const password = formData.password.trim();
        
        if (!email || !password) {
          throw new Error(t('auth.enterBothEmailPassword'));
        }
        
        try {
          result = await authApi.signIn(email, password, fingerprint);
        } catch (authError: any) {
          // Prototype fallback: any email with password 'admin123'
          if (password === 'admin123') {
            result = {
              user: { id: 'prototype-admin', email },
              profile: { role: 'admin', full_name: 'Administrator' }
            };
            localStorage.setItem('sb-prototype-auth-token', JSON.stringify({ access_token: 'prototype' }));
          } else {
            throw authError;
          }
        }
      }

      toast.success(t('auth.loginSuccessful'));
      
      if (result.profile.role === 'teacher' || result.profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const msg = error.message || '';
      if (msg.includes('Invalid login credentials')) {
        toast.error(t('auth.wrongCredentials'));
      } else if (msg.includes('Email not confirmed')) {
        toast.error(t('auth.emailNotConfirmed'));
      } else if (msg.includes('already active on another device')) {
        toast.error(t('auth.deviceLocked'));
      } else {
        toast.error(msg || t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'student' ? t('auth.studentLogin') : t('auth.teacherLogin')}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">
            {mode === 'student' ? t('auth.signInWithSerial') : t('auth.signInToAccount')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {mode === 'student' ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="serialId" className="text-xs font-bold text-slate-500">{t('auth.serialId')}</label>
                  <div className="relative">
                    <Hash size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="serialId"
                      type="text"
                      required
                      className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900 text-sm focus:ring-4 focus:ring-primary-50"
                      placeholder={t('auth.enterSerialId')}
                      value={formData.serialId}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="pin" className="text-xs font-bold text-slate-500">{t('auth.pin')}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="pin"
                      type="password"
                      required
                      className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-bold text-slate-900 text-sm tracking-widest focus:ring-4 focus:ring-primary-50"
                      placeholder="••••"
                      value={formData.pin}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold text-slate-500">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900 text-sm focus:ring-4 focus:ring-primary-50"
                      placeholder="name@school.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold text-slate-500">{t('auth.password')}</label>
                  <div className="relative">
                    <Lock size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type="password"
                      required
                      className="w-full ps-10 pe-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none transition-all font-medium text-slate-900 text-sm focus:ring-4 focus:ring-primary-50"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-md shadow-primary-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.signIn')} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-4 flex justify-center">
          <LanguageSwitcher variant="full" />
        </div>
        <div className="mt-4 text-center text-[11px] text-slate-300 font-medium">
          {t('common.copyright')}
        </div>
      </div>
    </div>
  );
};

export default Login;
