import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import Layout from './components/Layout';
import FeedPage from './pages/FeedPage';
import UploadPage from './pages/UploadPage';
import ContentDetailPage from './pages/ContentDetailPage';
import ProfileSetupModal from './pages/ProfileSetupModal';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';

function AppShell() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <Layout>
        <Outlet />
      </Layout>
      {showProfileSetup && <ProfileSetupModal />}
      <Toaster theme="dark" />
    </>
  );
}

const rootRoute = createRootRoute({
  component: AppShell,
});

const feedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: FeedPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/upload',
  component: UploadPage,
});

const contentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/content/$id',
  component: ContentDetailPage,
});

const routeTree = rootRoute.addChildren([feedRoute, uploadRoute, contentDetailRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
