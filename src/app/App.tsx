import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider
        router={router}
        fallbackElement={
          <div className="min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-600">
            Loading...
          </div>
        }
      />
    </AuthProvider>
  );
}