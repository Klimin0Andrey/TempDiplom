import React, { useState } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, CheckCircle2, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { UserResponse, UserRole, UserStatus } from '../types.ts';

const MOCK_USERS: UserResponse[] = [
  { id: 'u1', email: 'alex@example.com', firstName: 'Alex', lastName: 'Developer', role: UserRole.OWNER, status: UserStatus.ACTIVE, createdAt: '2024-01-10T00:00:00Z' },
  { id: 'u2', email: 'maria.i@example.com', firstName: 'Maria', lastName: 'Ivanova', role: UserRole.ADMIN, status: UserStatus.ACTIVE, createdAt: '2024-02-15T00:00:00Z' },
  { id: 'u3', email: 'dmitry.p@example.com', firstName: 'Dmitry', lastName: 'Petrov', role: UserRole.MEMBER, status: UserStatus.ACTIVE, createdAt: '2024-03-20T00:00:00Z' },
  { id: 'u4', email: 'elena.s@example.com', firstName: 'Elena', lastName: 'S.', role: UserRole.GUEST, status: UserStatus.INVITED, createdAt: '2024-05-18T00:00:00Z' },
];

export default function Team() {
  const [users] = useState<UserResponse[]>(MOCK_USERS);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-500 mt-1">Manage organization members and their roles</p>
          </div>
          <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md">
            <UserPlus className="w-5 h-5" />
            <span>Invite Member</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold border border-blue-300">
                            {user.firstName.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Shield className={`w-4 h-4 mr-1.5 ${user.role === UserRole.OWNER ? 'text-purple-500' : user.role === UserRole.ADMIN ? 'text-blue-500' : 'text-gray-400'}`} />
                          <span className="capitalize font-medium">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.status === UserStatus.ACTIVE ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" /> Invited
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-md hover:bg-gray-100">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
