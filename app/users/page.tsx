// app/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus } from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { useUsers } from '@/hooks/use-users';
import { UserMinimal } from '@/types/user.types';
import UserTable from '@/components/users/user-table';
import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';

export default function UsersPage() {
  const [users, setUsers] = useState<UserMinimal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const { getUsers, error } = useUsers();
  const { isLoading: isLoadingAuth } = useRequireAdmin();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [getUsers]);

  const handleCreateUserClick = () => {
    router.push('/users/create');
  };

  const handleEditUser = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleDeleteUser = async (userId: string) => {
    // Placeholder for delete functionality
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user:', userId);
      // In a real implementation, call an API to delete the user
      // After successful deletion, refetch the users
      const updatedUsers = users.filter(user => user.id !== userId);
      setUsers(updatedUsers);
    }
  };

  if (isLoadingAuth) {
    return <Loading text="Loading..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">User Management</h1>
        <Button 
          onClick={handleCreateUserClick}
          className="flex items-center gap-2"
        >
          <UserPlus size={16} />
          <span>Create User</span>
        </Button>
      </div>

      {isLoadingUsers ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Loading text="Loading users..." />
        </div>
      ) : (
        <UserTable 
          users={users} 
          onEdit={handleEditUser} 
          onDelete={handleDeleteUser} 
        />
      )}
    </div>
  );
}