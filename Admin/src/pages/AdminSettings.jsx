import { useEffect, useState } from 'react';
import { FaCog, FaEnvelope, FaLock, FaSave, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { getUserById, updateUserById } from '../apiCalls';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?._id) return;

    const fetchUser = async () => {
      try {
        const profile = await getUserById(user._id);
        setEmail(profile.email || '');
      } catch (err) {
        setError('Unable to load admin profile. Please refresh and try again.');
      }
    };

    fetchUser();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!email) {
      setError('Email is required.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = { email };
      if (password) payload.password = password;

      const updatedUser = await updateUserById(user._id, payload);
      updateUser(updatedUser);
      setStatus('Admin credentials updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update admin credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="bg-slate-900/80 border border-slate-700 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
            <p className="text-slate-400 mt-2">Update the authenticated admin email and password securely.</p>
          </div>
          <div className="text-white rounded-3xl bg-blue-600/20 px-4 py-3 shadow-inner">
            <FaCog className="text-2xl" />
          </div>
        </div>

        {(status || error) && (
          <div className={`mb-6 rounded-2xl ${status ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : 'bg-red-500/10 border-red-500/20 text-red-200'} border p-4 flex items-center gap-3`}>
            <FaCheckCircle className={`text-2xl ${status ? 'text-emerald-300' : 'text-red-300'}`} />
            <span>{status || error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Admin Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-950/60 text-white focus:border-blue-500 focus:ring-blue-500/30 outline-none"
                placeholder="Enter admin email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-950/60 text-white focus:border-blue-500 focus:ring-blue-500/30 outline-none"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">Confirm Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-700 bg-slate-950/60 text-white focus:border-blue-500 focus:ring-blue-500/30 outline-none"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 font-semibold text-white shadow-xl shadow-cyan-500/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-slate-400">
            <p className="text-sm leading-relaxed">
              These changes update your admin profile in the backend. Your login will remain valid until the existing session expires, and future logins will require your updated email/password.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
