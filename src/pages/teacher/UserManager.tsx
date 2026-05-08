import { useEffect, useMemo, useState } from 'react';
import { Crown, Edit2, GraduationCap, RefreshCw, Search, Shield, Trash2, UserPlus, Users, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import { userApi, type ManagedRole } from '../../api/userApi';
import type { Profile } from '../../types/database';
import { serialIdToEmail } from '../../utils/serial';
import { PageHeader, SearchInput, Select } from '../../components/ui';

type UserFormState = {
  fullName: string;
  email: string;
  password: string;
  role: ManagedRole;
  serialId: string;
};

const emptyForm: UserFormState = {
  fullName: '',
  email: '',
  password: '',
  role: 'student',
  serialId: '',
};

const roleConfig = {
  root: { label: 'Root', icon: Crown, color: 'bg-amber-50 text-amber-700 border-amber-100' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-rose-50 text-rose-700 border-rose-100' },
  teacher: { label: 'Teacher', icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  student: { label: 'Student', icon: GraduationCap, color: 'bg-sky-50 text-sky-700 border-sky-100' },
};

const UserManager = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<ManagedRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ManagedRole>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  const canManageElevatedRoles = currentRole === 'root';
  const availableRoles: ManagedRole[] = canManageElevatedRoles
    ? ['student', 'teacher', 'admin', 'root']
    : ['student', 'teacher'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const authUser = await authApi.getCurrentUser();
      setCurrentUserId(authUser?.id || null);

      const profile = authUser ? await authApi.getProfile(authUser.id) : null;
      setCurrentRole((profile?.role as ManagedRole) || null);

      const data = await userApi.getAll();
      setUsers(data.filter((user) => user.id !== authUser?.id));
    } catch (error: any) {
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchQuery.toLowerCase();

    return users.filter((user) => {
      if (!canManageElevatedRoles && ['root', 'admin'].includes(user.role)) return false;

      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesSearch =
        user.full_name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.serial_id?.toLowerCase().includes(term);

      return matchesRole && (!term || matchesSearch);
    });
  }, [canManageElevatedRoles, roleFilter, searchQuery, users]);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (user: Profile) => {
    if (!canManageElevatedRoles && ['root', 'admin'].includes(user.role)) {
      toast.error('Only root can edit root or admin accounts');
      return;
    }

    setEditingUser(user);
    setForm({
      fullName: user.full_name || '',
      email: user.email || '',
      password: '',
      role: user.role as ManagedRole,
      serialId: user.serial_id || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const getResolvedEmail = () => {
    return form.role === 'student' ? serialIdToEmail(form.serialId.trim()) : form.email.trim();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (form.role === 'student' && !form.serialId.trim()) {
      toast.error('Serial ID is required for students');
      return;
    }

    if (form.role !== 'student' && !form.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!editingUser && !form.password.trim()) {
      toast.error('Password is required');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        await userApi.update(editingUser.id, {
          email: getResolvedEmail(),
          fullName: form.fullName.trim(),
          role: form.role,
          serialId: form.serialId.trim(),
        });
        toast.success('User updated');
      } else {
        await userApi.create({
          email: getResolvedEmail(),
          password: form.password.trim(),
          fullName: form.fullName.trim(),
          role: form.role,
          serialId: form.serialId.trim(),
          pin: form.role === 'student' ? form.password.trim() : undefined,
        });
        toast.success(`${roleConfig[form.role].label} created`);
      }

      closeModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: Profile) => {
    if (user.id === currentUserId) {
      toast.error('You cannot delete your current account');
      return;
    }

    if (!canManageElevatedRoles && ['root', 'admin'].includes(user.role)) {
      toast.error('Only root can delete root or admin accounts');
      return;
    }

    if (!window.confirm(`Delete ${user.full_name || user.email}? This removes the auth account too.`)) return;

    try {
      await userApi.delete(user.id);
      toast.success('User deleted');
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  return (
    <div className="animate-fade-in w-full">
      <PageHeader
        title="User Management"
        badge={currentRole === 'root' ? 'Root console' : 'Admin console'}
        subtitle="Create, update, and delete managed accounts."
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-primary-200 transition-all active:scale-95 text-sm"
          >
            <UserPlus size={18} />
            Add User
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput containerClassName="flex-1 max-w-sm" placeholder="Search users" value={searchQuery} onChange={setSearchQuery} />
        <Select containerClassName="flex-1 max-w-xs" icon={<Search size={16} />} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as any)}>
          <option value="all">All roles</option>
          {availableRoles.map((role) => (
            <option key={role} value={role}>{roleConfig[role].label}</option>
          ))}
        </Select>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Serial ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-bold">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-slate-400 font-bold">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const RoleIcon = roleConfig[user.role].icon;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                            {user.full_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{user.full_name || 'Unnamed user'}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${roleConfig[user.role].color}`}>
                          <RoleIcon size={12} />
                          {roleConfig[user.role].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-500">{user.serial_id || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => openEditModal(user)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                            title="Edit user"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete user"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-8 animate-scale-in relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{editingUser ? 'Edit User' : 'Add User'}</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Managed Supabase auth account</p>
              </div>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {availableRoles.map((role) => {
                  const RoleIcon = roleConfig[role].icon;
                  const selected = form.role === role;

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, role }))}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all ${
                        selected ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-white'
                      }`}
                    >
                      <RoleIcon size={18} />
                      <span className="text-sm font-black">{roleConfig[role].label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Full name</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                />
              </div>

              {form.role === 'student' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Serial ID</label>
                  <input
                    required
                    value={form.serialId}
                    onChange={(event) => setForm({ ...form, serialId: event.target.value.toLowerCase() })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                    placeholder="ki232"
                  />
                  {form.serialId && (
                    <p className="text-[10px] font-bold text-slate-400 mt-1.5">{serialIdToEmail(form.serialId)}</p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                    placeholder="teacher@example.com"
                  />
                </div>
              )}

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">{form.role === 'student' ? 'PIN' : 'Password'}</label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary-500 focus:bg-white rounded-xl outline-none font-medium text-slate-900 text-sm transition-all focus:ring-4 focus:ring-primary-50"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-bold text-sm hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md shadow-primary-200 text-sm flex items-center justify-center gap-2 transition-all active:scale-95 hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : `Create ${roleConfig[form.role].label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
