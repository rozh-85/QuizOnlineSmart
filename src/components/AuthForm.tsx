import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/authApi';
import { Button, Input, Card } from './ui';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm = ({ onSuccess }: AuthFormProps) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'student' as 'teacher' | 'student'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        await authApi.signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.role
        );
        toast.success(t('auth.accountCreated'));
      } else {
        await authApi.signIn(formData.email, formData.password);
        toast.success(t('auth.welcomeBack') + '!');
        onSuccess?.();
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-slate-50 p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === 'signin' ? t('auth.signInToContinue') : t('auth.joinPlatform')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t('auth.fullName')}
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  {t('auth.role')}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'teacher' | 'student' })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="student">{t('auth.student')}</option>
                  <option value="teacher">{t('auth.teacher')}</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {t('auth.email')}
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {t('auth.password')}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            size="lg"
            disabled={loading}
            className="mt-6"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : mode === 'signin' ? (
              <>
                <LogIn size={20} />
                {t('auth.signIn')}
              </>
            ) : (
              <>
                <UserPlus size={20} />
                {t('auth.createAccount')}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-primary-600 hover:text-primary-700 font-bold"
          >
            {mode === 'signin' ? t('auth.dontHaveAccount') : t('auth.alreadyHaveAccount')}
          </button>
        </div>
      </Card>
    </div>
  );
};
