import { Navigate, Outlet } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import type { UserRole } from '../types/database.types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]; // omit to just require "logged in", any role
}

/**
 * Frontend route guard. This is a UX convenience only — the real
 * enforcement is Supabase RLS. Never rely on this alone for security.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { userId, profile, isInitializing } = useAppSelector((state) => state.auth);

  if (isInitializing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
