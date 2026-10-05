import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { redirectFor } from './guard';

/** Renders its page, or goes where the app's rules say instead. */
export function Guarded({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const to = redirectFor(pathname, true);
  return to ? <Navigate to={to} replace /> : children;
}
