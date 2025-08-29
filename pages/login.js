// pages/login.js
import { useAuthGuard } from '../hooks/useAuthGuard';
import LoginForm from '../components/auth/login-form';

export default function Login() {
  const { loading } = useAuthGuard();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
}