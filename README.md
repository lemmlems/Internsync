# InternSync

InternSync is a QCU OJT classroom prototype for Students, OJT Advisers, and SPARDS.

## Run locally

Requirements: Node.js 18 or newer. No third-party packages are required.

```powershell
cd Backend
npm.cmd start
```

Open [http://localhost:3000](http://localhost:3000). Set the `PORT` environment variable to use a different port.

## Windows desktop app

The separate Electron desktop shell starts its own loopback-only server and keeps classroom data in the current Windows user's application data folder.

```powershell
cd DesktopApp
npm.cmd install
npm.cmd start
```

Create a Windows installer with `npm.cmd run dist`. The NSIS installer is written to `DesktopApp/dist`. Node.js is needed to develop and build the installer; the installed desktop app bundles its own Electron runtime.

## OJT document workflow

- **Students** view adviser-posted classroom requirements, submit a written response and/or an attachment, and resubmit work returned for changes. They submit signed MOA/MOU documents directly to SPARDS.
- **OJT Advisers** post requirements, review student responses, approve completed submissions, or return work with feedback.
- **SPARDS** can view adviser-approved classroom submissions and student-submitted MOA/MOU documents.

The demo data includes a sample student, adviser, requirements, and submissions. For the web app, workflow changes are persisted in `Backend/data/store.json`; uploaded files are stored under `Backend/data/uploads/`. The desktop app uses its per-user application data folder instead. Both modes accept PDF, Word, TXT, JPG, and PNG files up to 5 MB.

## Demo access notice

The role selector is a **prototype-only role switcher**, not authentication. Role-scoped API routes demonstrate each workflow, but anyone with access to the demo can switch roles. Do not use this prototype with real student records or sensitive documents. A production deployment needs QCU sign-in/SSO, authenticated server-side roles and student/adviser assignments, and institutional document-retention and access policies.
