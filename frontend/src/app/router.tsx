import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import HomePage from '@/pages/public/HomePage';
import SchedulePage from '@/pages/public/SchedulePage';
import BookingPage from '@/pages/public/BookingPage';
import VerifyPage from '@/pages/public/VerifyPage';
import ContactPage from '@/pages/public/ContactPage';
import GoogleLoginPage from '@/pages/public/GoogleLoginPage';
import GoogleCallbackPage from '@/pages/public/GoogleCallbackPage';
import LoginPage from '@/pages/admin/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminSchedulePage from '@/pages/admin/SchedulePage';
import BookingsPage from '@/pages/admin/BookingsPage';
import RatesPage from '@/pages/admin/RatesPage';
import CourtsPage from '@/pages/admin/CourtsPage';
import AdminsPage from '@/pages/admin/AdminsPage';
import PasswordPage from '@/pages/admin/PasswordPage';
import { ROUTES } from '@/lib/constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.SCHEDULE.substring(1), element: <SchedulePage /> },
      { path: ROUTES.BOOKING.substring(1), element: <BookingPage /> },
      { path: ROUTES.VERIFY.substring(1), element: <VerifyPage /> },
      { path: ROUTES.CONTACT.substring(1), element: <ContactPage /> },
      { path: ROUTES.LOGIN.substring(1), element: <GoogleLoginPage /> },
      { path: ROUTES.GOOGLE_CALLBACK.substring(1), element: <GoogleCallbackPage /> },
    ],
  },
  {
    path: ROUTES.ADMIN.LOGIN,
    element: <LoginPage />,
  },
  { path: ROUTES.ADMIN.WELCOME, element: <PasswordPage forced /> },
  {
    path: ROUTES.ADMIN.LOGIN, // Base admin path
    element: <AdminLayout />,
    children: [
      { path: ROUTES.ADMIN.DASHBOARD.replace('/tdkadmin/', ''), element: <DashboardPage /> },
      { path: ROUTES.ADMIN.SCHEDULE.replace('/tdkadmin/', ''), element: <AdminSchedulePage /> },
      { path: ROUTES.ADMIN.BOOKINGS.replace('/tdkadmin/', ''), element: <BookingsPage /> },
      { path: ROUTES.ADMIN.RATES.replace('/tdkadmin/', ''), element: <RatesPage /> },
      { path: ROUTES.ADMIN.COURTS.replace('/tdkadmin/', ''), element: <CourtsPage /> },
      { path: ROUTES.ADMIN.ADMINS.replace('/tdkadmin/', ''), element: <AdminsPage /> },
      { path: ROUTES.ADMIN.PROFILE.replace('/tdkadmin/', ''), element: <PasswordPage /> },
    ],
  },
]);
