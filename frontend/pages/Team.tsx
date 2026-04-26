import React, { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, CheckCircle2, Clock, Loader2, AlertCircle, X } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { UserResponse, UserRole, UserStatus } from '../types.ts';
import { api } from '../services/api.ts';

export default function Team() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Реф для отслеживания клика вне меню
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isManager = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.auth.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError("Failed to load team members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Логика закрытия меню по клику вне его области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.auth.invite({
        email: inviteEmail,
        first_name: inviteFirstName,
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFirstName('');
      fetchUsers();
    } catch (err: any) {
      alert("Failed to invite: " + (err.message || "Unknown error"));
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.auth.updateUser(userId, { status: 'deactivated' });
      setOpenMenuId(null);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to deactivate: " + (err.message || "Unknown error"));
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.auth.updateUser(userId, { role: newRole });
      setOpenMenuId(null);
      fetchUsers();
    } catch (err: any) {
      alert("Failed to change role: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0 shadow-sm z-20">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage organization members and their roles</p>
          </div>
          {isManager && (
            <button 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              <span>Invite Member</span>
            </button>
          )}
        </header>

        {/* ОСНОВНОЙ КОНТЕЙНЕР ДЛЯ СКРОЛЛА */}
        <main className="flex-1 overflow-y-auto w-full relative bg-gray-50">
          <div className="p-8 min-h-full w-full max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Loader2 className="w-10 h-10 mb-4 text-blue-500 animate-spin" />
                <p className="text-sm font-medium">Loading organization data...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-red-500">
                <AlertCircle className="w-12 h-12 mb-4 text-red-300" />
                <p className="text-lg font-medium text-red-900">{error}</p>
                <button onClick={fetchUsers} className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm">Try Again</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-visible">
                <div className="overflow-x-auto overflow-y-visible">
                  <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">User</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Role</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Joined At</th>
                        <th className="relative px-6 py-4 w-20"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {users.map((user) => {
                        const isMe = user.id === currentUser?.id;

                        return (
                          <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-11 w-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                  {user.first_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-bold text-gray-900 flex items-center">
                                    {user.first_name} {user.last_name || ''}
                                    {isMe && (
                                      <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-tighter font-black">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center mt-1">
                                    <Mail className="w-3 h-3 mr-1.5 opacity-40" /> {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center text-sm">
                                <Shield className={`w-4 h-4 mr-2 ${user.role === 'owner' ? 'text-purple-500' : user.role === 'admin' ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className="capitalize font-semibold text-gray-700">{user.role}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              {user.status === 'active' ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                  <CheckCircle2 className="w-3 h-3 mr-1.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                  <Clock className="w-3 h-3 mr-1.5" /> {user.status}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              {isManager && !isMe && user.role !== 'owner' && (
                                <div className="relative inline-block text-left" ref={openMenuId === user.id ? menuRef : null}>
                                  <button 
                                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                    className="text-gray-400 hover:text-gray-900 transition-colors p-2 rounded-full hover:bg-gray-100"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                  
                                  {openMenuId === user.id && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 flex flex-col animate-in fade-in zoom-in duration-100">
                                      <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50 mb-1">
                                        Manage User
                                      </div>
                                      {user.role !== 'admin' && (
                                        <button 
                                          onClick={() => handleRoleChange(user.id, 'admin')} 
                                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                                        >
                                          <Shield className="w-4 h-4 mr-3 text-blue-500" /> Make Administrator
                                        </button>
                                      )}
                                      {user.role !== 'member' && (
                                        <button 
                                          onClick={() => handleRoleChange(user.id, 'member')} 
                                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors"
                                        >
                                          <Users className="w-4 h-4 mr-3 text-gray-400" /> Make Regular Member
                                        </button>
                                      )}
                                      <div className="h-px bg-gray-100 my-1 mx-2" />
                                      <button 
                                        onClick={() => handleDeactivate(user.id)} 
                                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center font-bold transition-colors"
                                      >
                                        <X className="w-4 h-4 mr-3" /> Deactivate Account
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Invite Member</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-300" />
                   <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all font-medium" 
                    placeholder="name@company.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input type="text" required value={inviteFirstName} onChange={(e) => setInviteFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all font-medium"
                  placeholder="e.g. Alexander" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Organization Role</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 text-sm outline-none transition-all font-medium cursor-pointer appearance-none">
                  <option value="member">Regular Member</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 font-black shadow-xl shadow-blue-600/30 transition-all active:scale-[0.97] mt-4">
                Send Invitation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}