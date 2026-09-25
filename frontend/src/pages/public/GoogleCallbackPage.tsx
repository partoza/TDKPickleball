import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export default function GoogleCallbackPage() {
  return <Navigate to={ROUTES.LOGIN} replace />;
}
