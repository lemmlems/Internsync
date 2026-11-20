import { Fragment } from "react";
import Sidebar from "./shell/sidebar";
import Topbar from "./shell/topbar";
import ToastViewport from "./toast-viewport";

export default function AppShell() {
  return (
    <Fragment>
      <div className="app-shell hidden min-h-screen bg-[#f3f5f9] text-foreground flex" id="app-shell">
        <Sidebar />
        <button
          className="sidebar-backdrop fixed inset-0 z-[35] bg-slate-950/40 backdrop-blur-[1px]"
          id="sidebar-backdrop"
          type="button"
          aria-label="Close navigation menu"
          aria-hidden="true"
          hidden
        />
        <main className="main-area ml-0 min-h-screen min-w-0 flex-1 lg:ml-[250px]">
          <Topbar />
          <section className="page-content mx-auto w-full max-w-none px-4 py-5 md:px-6 md:py-7" id="page-content" aria-live="polite">
            <div className="loading-state text-sm text-muted">Getting your workspace ready…</div>
          </section>
        </main>
      </div>

      <ToastViewport />
      <div className="modal-backdrop fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4" id="modal-backdrop" hidden>
        <section
          className="modal max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-card p-6 text-text shadow-xl"
          id="workflow-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        />
      </div>
    </Fragment>
  );
}
