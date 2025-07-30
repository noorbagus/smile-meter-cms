// components/users/user-role-select.tsx
'use client';

import { Shield, Store } from 'lucide-react';

interface UserRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function UserRoleSelect({
  value,
  onChange,
  disabled = false
}: UserRoleSelectProps) {
  const roles = [
    {
      id: 'admin',
      name: 'Administrator',
      description: 'Full access to all features and settings',
      icon: <Shield size={16} className="text-indigo-600" />,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
    },
    {
      id: 'store_manager',
      name: 'Store Manager',
      description: 'Access to manage assigned units',
      icon: <Store size={16} className="text-blue-600" />,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    }
  ];

  return (
    <div className="space-y-2">
      {roles.map((role) => (
        <div 
          key={role.id}
          className={`relative flex items-center p-3 rounded-md border cursor-pointer transition-colors ${
            value === role.id
              ? `${role.bgColor} ${role.borderColor}`
              : 'bg-white border-gray-200 hover:bg-gray-50'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          onClick={() => {
            if (!disabled) {
              onChange(role.id);
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <div className={`flex-shrink-0 ${value === role.id ? 'text-primary' : 'text-gray-400'}`}>
              {role.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${value === role.id ? 'text-gray-900' : 'text-gray-700'}`}>
                {role.name}
              </p>
              <p className="text-xs text-gray-500">{role.description}</p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className={`h-4 w-4 rounded-full border ${
              value === role.id
                ? 'bg-indigo-600 border-transparent'
                : 'bg-white border-gray-300'
            }`}>
              {value === role.id && (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}