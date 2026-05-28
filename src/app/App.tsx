import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { HomePage } from "../pages/home/HomePage";
import { BackendConnectionToast } from "./BackendStatusToast";
import { subscribeBackendConnectionFailed } from "./backendConnectionToast";
import { BackendUrlGate } from "./BackendUrlGate";
import { ThemeProvider } from "./ThemeProvider";

const rootRoute = createRootRoute();

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

/** Renders the application router and global providers. */
export function App() {
  const [showsBackendConnectionToast, setShowsBackendConnectionToast] =
    useState(false);
  const hideToastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = subscribeBackendConnectionFailed(() => {
      setShowsBackendConnectionToast(true);

      if (hideToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideToastTimeoutRef.current);
      }

      hideToastTimeoutRef.current = window.setTimeout(() => {
        setShowsBackendConnectionToast(false);
        hideToastTimeoutRef.current = undefined;
      }, 5000);
    });

    return () => {
      unsubscribe();

      if (hideToastTimeoutRef.current !== undefined) {
        window.clearTimeout(hideToastTimeoutRef.current);
      }
    };
  }, []);

  return (
    <ThemeProvider>
      <BackendUrlGate>
        <RouterProvider router={router} />
      </BackendUrlGate>
      {showsBackendConnectionToast ? <BackendConnectionToast /> : null}
    </ThemeProvider>
  );
}
