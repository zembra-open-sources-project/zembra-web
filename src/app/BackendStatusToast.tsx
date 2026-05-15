/** Renders the global backend connection failure toast. */
export function BackendConnectionToast() {
  return (
    <div
      className="fixed right-5 top-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] shadow-[var(--color-shadow-float)]"
      role="status"
    >
      无法连接到 backend，请确认服务已启动
    </div>
  );
}
