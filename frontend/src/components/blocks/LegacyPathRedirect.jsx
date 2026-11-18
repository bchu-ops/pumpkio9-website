import { Navigate, useLocation } from 'react-router-dom';

// Canonical routes are lowercase. React Router matches paths case-insensitively,
// so an explicit <Route path="/Interests"> redirect would match the lowercase
// route too and loop; instead this component compares the raw pathname.
const CANONICAL = ['/interests', '/projects', '/spotify'];
const RENAMED = { '/product2': '/spotify' };

export function canonicalPath(pathname) {
  const lower = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const target = RENAMED[lower] ?? (CANONICAL.includes(lower) ? lower : null);
  return target && target !== pathname ? target : null;
}

export default function LegacyPathRedirect() {
  const { pathname, search, hash } = useLocation();
  const target = canonicalPath(pathname);
  if (!target) return null;
  return <Navigate to={{ pathname: target, search, hash }} replace />;
}
