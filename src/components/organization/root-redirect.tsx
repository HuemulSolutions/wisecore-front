import { Navigate } from 'react-router-dom';

/**
 * Redirects the user to /home when they hit the root path "/".
 */
export function RootRedirect() {
  return <Navigate to="/home" replace />;
}
