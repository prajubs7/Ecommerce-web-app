import { BrowserRouter } from 'react-router-dom';
import { useAuthListener } from './features/auth/useAuthListener';
import AppRoutes from './routes/AppRoutes';

function AuthGate() {
  useAuthListener(); // keeps Redux auth/profile in sync with Supabase session
  return <AppRoutes />;
}

export default function App() {
 
  return (
    <BrowserRouter>
      <AuthGate />
    </BrowserRouter>
  );
}
