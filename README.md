# InternSync

InternSync is a QCU OJT classroom prototype for Students, OJT Advisers, and SPARDS.

## Frontend structure

The Vite frontend uses React and Tailwind CSS. The sign-in and sign-up UI is in `Frontend/src/components/views/signin.jsx`. Classroom, document, and adviser-review screens are React components in `classroom.jsx`, `documents.jsx`, and `review.jsx` in the same views folder. Reusable UI primitives are in `Frontend/src/components/ui/`, with exports collected in `Frontend/src/index.js`. `Frontend/index.html` remains the Vite entry page, and `Frontend/app.js` manages app state, events, and API calls.

## Run locally

Requirements: Node.js 20.19+ (Node.js 22 must be 22.12+).

Start the backend in one terminal:

```powershell
cd Backend
npm.cmd start
```

Start the frontend in a second terminal:

```powershell
cd Frontend
npm.cmd install
npm.cmd run dev
```

Open the frontend URL printed by Vite (by default [http://127.0.0.1:5173](http://127.0.0.1:5173)). The frontend proxies `/api` requests to the backend at `http://127.0.0.1:3000`. If you change the backend port, set `INTERNSYNC_API_URL` to its URL when starting the frontend. The backend is API-only and does not serve the frontend.

To build the frontend for deployment, run `npm.cmd run build` in `Frontend`; the generated files are written to `Frontend/dist`. A deployment must host those files separately and configure its web server to proxy `/api` to the backend.

## OJT document workflow

- **Students** view adviser-posted classroom requirements, submit a written response and/or an attachment, and resubmit work returned for changes. They submit signed MOA/MOU documents directly to SPARDS.
- **OJT Advisers** post requirements, review student responses, approve completed submissions, or return work with feedback.
- **SPARDS** can view adviser-approved classroom submissions and student-submitted MOA/MOU documents.

The demo data includes a sample student, adviser, requirements, and submissions. Workflow changes are persisted in `Backend/data/store.json`; uploaded files are stored under `Backend/data/uploads/`. The backend accepts PDF, Word, TXT, JPG, and PNG files up to 5 MB.

## Demo access notice

The role selector is a **prototype-only role switcher**, not authentication. Role-scoped API routes demonstrate each workflow, but anyone with access to the demo can switch roles. Do not use this prototype with real student records or sensitive documents. A production deployment needs QCU sign-in/SSO, authenticated server-side roles and student/adviser assignments, and institutional document-retention and access policies.
