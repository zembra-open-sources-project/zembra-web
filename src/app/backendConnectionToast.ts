const backendConnectionFailedEventName = "zembra:backend-connection-failed";

/** Describes the unsubscribe function returned by toast event subscriptions. */
export type UnsubscribeBackendConnectionToast = () => void;

/** Dispatches a global notification when the backend cannot be reached. */
export function notifyBackendConnectionFailed(): void {
  window.dispatchEvent(new Event(backendConnectionFailedEventName));
}

/** Subscribes to global backend connection failure notifications. */
export function subscribeBackendConnectionFailed(
  listener: () => void,
): UnsubscribeBackendConnectionToast {
  window.addEventListener(backendConnectionFailedEventName, listener);

  return () => window.removeEventListener(backendConnectionFailedEventName, listener);
}

