'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/apiClient';
import toast from '@/lib/toast';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import { GroupIcon, TrashBinIcon } from '@/icons';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  ratePerOrder?: number | null;
  isActive?: boolean;
  createdAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  salary: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    salary: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as 'EMPLOYEE' | 'MANAGER' | 'ADMIN' }));
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        tempPassword: formData.password, // Backend expects tempPassword, not password
        ratePerOrder: formData.salary ? parseFloat(formData.salary) : undefined // Backend expects ratePerOrder, not salary
      };
      
      await adminApi.createUser(userData);
      toast.success('User created successfully');
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        salary: ''
      });
      setShowCreateModal(false);
      
      // Refresh users list
      fetchUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
      console.error('Create user error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(userId);
      const response = await adminApi.deleteUser(userId);
      console.log('Delete user response:', response);
      toast.success(response.data?.message || 'User deleted successfully');
      // Refresh users list after successful deletion
      await fetchUsers();
    } catch (error: any) {
      console.error('Delete user error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.message || error.message || 'Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">User Management</h1>
          <p className="text-gray-500 mt-2 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">User Management</h1>
          <p className="text-gray-500 mt-2 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          size="sm"
        >
          <span className="mr-2">+</span>
          Create User
        </Button>
      </div>

      {/* Users Table */}
      <ComponentCard title="Users">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.filter(user => user.isActive !== false).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {user.ratePerOrder ? `$${Number(user.ratePerOrder).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={deletingId === user.id}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deletingId === user.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <TrashBinIcon className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <GroupIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}
      </ComponentCard>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !submitting && setShowCreateModal(false)}
        className="max-w-md p-5 lg:p-10"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">Create New User</h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label>
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label>
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>

            <div>
              <Label>
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={submitting}
                min="8"
              />
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Minimum 8 characters</p>
            </div>

            <div>
              <Label>
                Role <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Select
                  options={[
                    { value: 'EMPLOYEE', label: 'Employee' },
                    { value: 'MANAGER', label: 'Manager' },
                    { value: 'ADMIN', label: 'Admin' }
                  ]}
                  placeholder="Select Role"
                  onChange={(value) => {
                    handleSelectChange(value);
                    setFormData(prev => ({ ...prev, role: value as 'EMPLOYEE' | 'MANAGER' | 'ADMIN' }));
                  }}
                  defaultValue={formData.role}
                />
              </div>
            </div>

            <div>
              <Label>Monthly Salary</Label>
              <Input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleInputChange}
                min="0"
                step={0.01}
                disabled={submitting}
                placeholder="0.00"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <span className="mr-2 animate-spin">⏳</span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="mr-2">✓</span>
                    <span>Create User</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => setShowCreateModal(false)}
                disabled={submitting}
                size="sm"
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

