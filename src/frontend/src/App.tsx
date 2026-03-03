import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "./hooks/useQueries";
import ChartsPage from "./pages/ChartsPage";
import ContentDetailPage from "./pages/ContentDetailPage";
import FeedPage from "./pages/FeedPage";
import ProfileSetupModal from "./pages/ProfileSetupModal";
import UploadPage from "./pages/UploadPage";
import UserProfilePage from "./pages/UserProfilePage";
import WhatsOnYourMindPage from "./pages/WhatsOnYourMindPage";

function AppShell() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();

  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

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
  path: "/",
  component: FeedPage,
});

const uploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upload",
  component: UploadPage,
});

const contentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/content/$id",
  component: ContentDetailPage,
});

const userProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/$principal",
  component: UserProfilePage,
});

const mindRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mind",
  component: WhatsOnYourMindPage,
});

const chartsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/charts",
  component: ChartsPage,
});

const routeTree = rootRoute.addChildren([
  feedRoute,
  uploadRoute,
  contentDetailRoute,
  userProfileRoute,
  mindRoute,
  chartsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
