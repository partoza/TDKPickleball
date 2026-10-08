import { createBrowserRouter } from 'react-router-dom';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import HomePage from '@/pages/public/HomePage';
import SchedulePage from '@/pages/public/SchedulePage';
import TrainingPage from '@/pages/public/TrainingPage';
import BookingPage from '@/pages/public/BookingPage';
import VerifyPage from '@/pages/public/VerifyPage';
import SuccessPage from '@/pages/public/SuccessPage';
import ContactPage from '@/pages/public/ContactPage';
import RulesPage from '@/pages/public/RulesPage';
import GoogleLoginPage from '@/pages/public/GoogleLoginPage';
import GoogleCallbackPage from '@/pages/public/GoogleCallbackPage';
import NotFoundPage from '@/pages/public/NotFoundPage';
import LoginPage from '@/pages/admin/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminSchedulePage from '@/pages/admin/SchedulePage';
import BookingsPage from '@/pages/admin/BookingsPage';
import RevenuePage from '@/pages/admin/RevenuePage';
import RatesPage from '@/pages/admin/RatesPage';
import PromosPage from '@/pages/admin/PromosPage';
import CourtsPage from '@/pages/admin/CourtsPage';
import AdminsPage from '@/pages/admin/AdminsPage';
import PasswordPage from '@/pages/admin/PasswordPage';
import StoragePage from '@/pages/admin/StoragePage';
import InternalCoachesPage from '@/pages/admin/InternalCoachesPage';
import AdminWidgetPage from '@/pages/admin/AdminWidgetPage';
import SocialMediaPage from '@/pages/admin/SocialMediaPage';
import CustomersPage from '@/pages/admin/CustomersPage';
import CustomerCardPage from '@/pages/public/CustomerCardPage';
import { ROUTES } from '@/lib/constants';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.SCHEDULE.substring(1), element: <SchedulePage /> },
      { path: ROUTES.TRAINING.substring(1), element: <TrainingPage /> },
      { path: ROUTES.BOOKING.substring(1), element: <BookingPage /> },
      { path: ROUTES.VERIFY.substring(1), element: <VerifyPage /> },
      { path: ROUTES.SUCCESS.substring(1), element: <SuccessPage /> },
      { path: ROUTES.CONTACT.substring(1), element: <ContactPage /> },
      { path: ROUTES.RULES.substring(1), element: <RulesPage /> },
      { path: ROUTES.LOGIN.substring(1), element: <GoogleLoginPage /> },
      { path: ROUTES.GOOGLE_CALLBACK.substring(1), element: <GoogleCallbackPage /> },
      { path: 'card/:username/:token', element: <CustomerCardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: ROUTES.ADMIN.LOGIN,
    element: <LoginPage />,
    errorElement: <NotFoundPage />,
  },
  { path: ROUTES.ADMIN.WELCOME, element: <PasswordPage forced />, errorElement: <NotFoundPage /> },
  { path: ROUTES.ADMIN.WIDGET, element: <AdminWidgetPage />, errorElement: <NotFoundPage /> },
  {
    path: ROUTES.ADMIN.LOGIN, // Base admin path
    element: <AdminLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: ROUTES.ADMIN.DASHBOARD.replace('/tdkadmin/', ''), element: <DashboardPage /> },
      { path: ROUTES.ADMIN.SCHEDULE.replace('/tdkadmin/', ''), element: <AdminSchedulePage /> },
      { path: ROUTES.ADMIN.BOOKINGS.replace('/tdkadmin/', ''), element: <BookingsPage /> },
      { path: ROUTES.ADMIN.REVENUE.replace('/tdkadmin/', ''), element: <RevenuePage /> },
      { path: ROUTES.ADMIN.RATES.replace('/tdkadmin/', ''), element: <RatesPage /> },
      { path: 'promos', element: <PromosPage /> },
      { path: ROUTES.ADMIN.COURTS.replace('/tdkadmin/', ''), element: <CourtsPage /> },
      { path: ROUTES.ADMIN.ADMINS.replace('/tdkadmin/', ''), element: <AdminsPage /> },
      { path: ROUTES.ADMIN.INTERNAL_COACHES.replace('/tdkadmin/', ''), element: <InternalCoachesPage /> },
      { path: ROUTES.ADMIN.STORAGE.replace('/tdkadmin/', ''), element: <StoragePage /> },
      { path: ROUTES.ADMIN.PROFILE.replace('/tdkadmin/', ''), element: <PasswordPage /> },
      { path: ROUTES.ADMIN.SOCIAL_MEDIA.replace('/tdkadmin/', ''), element: <SocialMediaPage /> },
      { path: ROUTES.ADMIN.CUSTOMERS.replace('/tdkadmin/', ''), element: <CustomersPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
