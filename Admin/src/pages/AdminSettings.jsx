import { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaCog,
  FaEnvelope,
  FaLock,
  FaSave,
  FaUser,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { getUserById, updateUserById } from '../apiCalls';

const AdminSettings = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
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
        setName(profile.name || '');
        setEmail(profile.email || '');
      } catch {
        setError('Unable to load admin profile. Please refresh and try again.');
      }
    };

    fetchUser();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus('');
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Admin name and email are required.');
      return;
    }

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      };
      if (password) payload.password = password;

      const updatedUser = await updateUserById(user._id, payload);
      updateUser(updatedUser);
      setName(updatedUser.name || '');
      setEmail(updatedUser.email || '');
      setStatus('Admin profile updated successfully.');
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Settings</h1>
            <p className="mt-2 text-slate-500">Update the authenticated admin name, email, and password securely.</p>
          </div>
          <div className="rounded-2xl bg-violet-100 px-4 py-3 text-violet-700">
            <FaCog className="text-2xl" />
          </div>
        </div>

        {(status || error) && (
          <div className={`mb-6 rounded-2xl ${status ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'} border p-4 flex items-center gap-3`}>
            <FaCheckCircle className={`text-2xl ${status ? 'text-emerald-500' : 'text-red-500'}`} />
            <span>{status || error}</span>
          </div>
        )}

        <div className="mb-6 flex items-center gap-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-700 text-lg font-bold text-white">
            {(name || user?.name || user?.email || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              Current Administrator
            </p>
            <p className="font-bold text-slate-900">
              {name || user?.name || 'Administrator'}
            </p>
            <p className="text-sm text-slate-500">{email || user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Admin Name</label>
            <div className="relative">
              <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-violet-500"
                placeholder="Enter admin name"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Admin Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-violet-500"
                placeholder="Enter admin email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">New Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-violet-500"
                placeholder="Enter new password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Confirm Password</label>
            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-4 pl-12 pr-4 text-slate-900 outline-none focus:border-violet-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaSave />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-slate-600">
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
