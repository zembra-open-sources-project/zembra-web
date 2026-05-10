/** Renders the global backend connection failure toast. */
export function BackendConnectionToast() {
  return (
    <div
      className="fixed right-5 top-5 z-50 max-w-[calc(100vw-2.5rem)] rounded-lg border border-[#8fd3ff]/30 bg-[#1c2027] px-4 py-3 text-sm font-medium text-[#e8edf3] shadow-[0_16px_40px_rgba(0,0,0,0.38)]"
      role="status"
    >
      无法连接到 backend，请确认服务已启动
    </div>
  );
}

