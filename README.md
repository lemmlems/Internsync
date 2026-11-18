# InternSync

InternSync is a QCU OJT classroom prototype for Students, OJT Advisers, and SPARDS.

## Frontend structure

The Vite frontend uses React, TypeScript, and Tailwind CSS. Its entry point is `Frontend/src/main.tsx`; the sign-in and sign-up UI is in `Frontend/src/components/views/signin.tsx`. Dashboard, document, and review screens are in `Frontend/src/components/views/`. Reusable UI primitives and shared utilities are in `Frontend/src/components/ui/` and `Frontend/src/lib/`. `Frontend/app.ts` manages app state, events, and API calls.

## Step-by-step local setup

Requirements: Node.js 20.19+ (Node.js 22 must be 22.12+). InternSync uses a local SQLite database file for the Prisma catalog, so no database server installation or database account is required.

### 1. Configure and create the database

Open PowerShell at the repository root and run:

```powershell
cd Backend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:migrate -- --name init
npm.cmd run db:seed
```

These commands create `Backend/prisma/internsync.db`, its tables, and the initial college/program catalog. The SQLite database file is local and ignored by Git. The supplied `.env.example` points Prisma at this file; the guarded copy command keeps an existing `Backend/.env` intact.

Run the migration with `--name init` only for initial setup. For later schema changes, run `npm.cmd run db:migrate -- --name describe_your_change` from `Backend`. The seed command can be rerun to upsert the catalog.

### 2. Start the backend

In the same PowerShell terminal:

```powershell
npm.cmd start
```

Keep the backend running. It serves the API at `http://127.0.0.1:3000`.

### 3. Start the frontend

Open a second PowerShell terminal at the repository root:

```powershell
cd Frontend
npm.cmd install
npm.cmd run dev
```

Open the frontend URL printed by Vite (by default [http://127.0.0.1:5173](http://127.0.0.1:5173)). The frontend proxies `/api` requests to `http://127.0.0.1:3000`. If you change the backend port, set `INTERNSYNC_API_URL` to its URL when starting the frontend. The backend is API-only and does not serve the frontend.

### 4. Use the student sign-up catalog

Choose **Student**, click **Department / College**, and select one of the seeded colleges. The Program dropdown then shows only that college's programs. Year Level is filled automatically and cannot be edited: Engineering and Business use 3rd Year; Accountancy, Education, and Computer Studies use 4th Year.

Student sign-up creates a database account and signs the student in. Later student sign-ins are checked against the stored password hash. Profile edits save to the student's database record; the profile form stores name parts separately, formats the displayed name with a middle initial, and saves the address as structured fields.

If the catalog cannot load, confirm the backend is running and that the migration and seed steps completed successfully.

### 5. Build the frontend

To build for deployment, run `npm.cmd run build` in `Frontend`; the generated files are written to `Frontend/dist`. A deployment must host those files separately and configure its web server to proxy `/api` to the backend.

## Reusable UI components

The reusable React components live in `Frontend/src/components/ui/`. They use the shared `cn()` utility, Tailwind theme tokens, native form controls, and the Radix dialog/dropdown primitives already installed in the frontend. Import components directly from their files:

```tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "@/components/ui/sidebar";
```

Short usage examples (form controls support native controlled/uncontrolled props):

```tsx
<Button variant="primary" size="small" loading={saving}>Save</Button>
<Input label="Email" type="email" placeholder="name@qcu.edu.ph" error={emailError} />
<Textarea label="Notes" rows={4} resize="vertical" placeholder="Add notes…" />
<Card><CardTitle>Summary</CardTitle><CardContent>OJT progress</CardContent></Card>
<Dialog><DialogTrigger asChild><Button>Open</Button></DialogTrigger><DialogContent><DialogTitle>Confirm</DialogTitle></DialogContent></Dialog>
<DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">Actions</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => save()}>Save</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
<Select label="Status" placeholder="Choose a status" options={[{ label: "Pending", value: "pending" }]} value={status} onChange={(event) => setStatus(event.target.value)} />
<Checkbox label="I agree" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
<Switch label="Notifications" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
<Table><TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell>Sofia Reyes</TableCell></TableRow></TableBody></Table>
<Tabs defaultValue="overview"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="files">Files</TabsTrigger></TabsList><TabsContent value="overview">Progress</TabsContent><TabsContent value="files">Documents</TabsContent></Tabs>
<Badge variant="success">Approved</Badge>
<Avatar src={photoUrl} alt="Sofia Reyes" initials="SR" size="lg" />
<Tooltip><TooltipTrigger asChild><Button variant="ghost">Info</Button></TooltipTrigger><TooltipContent>More details</TooltipContent></Tooltip>
<Skeleton shape="text" className="w-40" />
<Sheet><SheetTrigger asChild><Button>Open filters</Button></SheetTrigger><SheetContent side="right"><SheetTitle>Filters</SheetTitle></SheetContent></Sheet>
<Sidebar title="Workspace" items={[{ label: "Dashboard", href: "/", active: true }]} />
```

## Shared frontend utilities

Reusable non-React functions and app configuration live in `Frontend/src/lib/`. Import from the individual modules:

```ts
import { cn, debounce, generateId, truncateText } from "@/lib/utils";
import { APP_INFO, FILE_UPLOAD_CONFIG, USER_ROLES } from "@/lib/constants";
import { formatCurrency, formatDate, formatFileSize, formatRelativeTime } from "@/lib/formatters";
import { isValidEmail, isValidFileSize, validatePassword } from "@/lib/validations";
import { filterBySearch, getInitials, getStatusColor, groupBy, sortByDate } from "@/lib/helpers";

const className = cn("rounded-md px-3", isActive && "bg-primary");
const accountId = generateId("account-");
const searchLater = debounce((query: string) => search(query), 250);
const preview = truncateText(description, 80);

const role = USER_ROLES.adviser;
const uploadLimit = FILE_UPLOAD_CONFIG.maxFileSizeBytes;
const appName = APP_INFO.name;

const dateLabel = formatDate(submittedAt);
const relativeLabel = formatRelativeTime(submittedAt);
const priceLabel = formatCurrency(1250);
const sizeLabel = formatFileSize(file.size);

const emailResult = isValidEmail(email);
const uploadResult = isValidFileSize(file);
const passwordResult = validatePassword(password);

const initials = getInitials("Sofia Reyes");
const statusColor = getStatusColor("Pending adviser review");
const byStatus = groupBy(submissions, (submission) => submission.status);
const newestFirst = sortByDate(submissions, "submittedAt", "desc");
const matches = filterBySearch(submissions, query, ["studentName", "status"]);
```

`isValidStudentId()` validates the `NN-NNNN` student ID format. Password validation follows the existing six-character minimum. Upload validation follows the backend's accepted extensions, MIME types, and 5 MB maximum. The application role constants intentionally match its existing `student`, `adviser`, and `spards` roles.

## OJT document workflow

- **Students** view adviser-posted classroom requirements, submit a written response and/or an attachment, and resubmit work returned for changes. They submit signed MOA/MOU documents directly to SPARDS.
- **OJT Advisers** post requirements, review student responses, approve completed submissions, or return work with feedback.
- **SPARDS** can view adviser-approved classroom submissions and student-submitted MOA/MOU documents.

The demo data includes a sample student, adviser, requirements, and submissions. Workflow changes are persisted in `Backend/data/store.json`; uploaded files are stored under `Backend/data/uploads/`. The backend accepts PDF, Word, TXT, JPG, and PNG files up to 5 MB.

## Prisma account and academic catalog schema

`Backend/prisma/schema.prisma` defines SQLite models for users, roles, student/staff profiles, sessions, staff invitations, colleges, and programs. Follow [Step-by-step local setup](#step-by-step-local-setup) to create and seed the local database.

- The student sign-up and profile College and Program dropdowns read `GET /api/catalog/colleges`. Program choices are limited to the selected college; Year Level is read-only and derived from `College.ojtYearLevel`.
- The profile address editor reads `GET /api/catalog/locations`. Barangays are linked to a city; saving a new city/barangay pair adds it to the shared catalog, and later students see barangay options filtered by their selected city.
- Student IDs use the `NN-NNNN` format and are stored as unique `StudentProfile.studentNumber` values when student sign-up creates a Prisma user/profile. Passwords are stored as salted scrypt hashes.
- `StudentProfile` stores contact and address fields, placement details, and its program relation. Student profile reads and updates require a bearer token backed by a hashed, expiring `Session`; logging out revokes that session. Run a new Prisma migration after schema changes.
- `Backend/prisma/seed.js` seeds all five provided colleges and eleven programs. Engineering and Business use OJT Year Level `THIRD`; Accountancy, Education, and Computer Studies use `FOURTH`.
- The dropdown reports a configuration error rather than showing fabricated options if the database is unavailable.
- A user's role is the server-side authorization source: students use the student area; OJT advisers and deans use the adviser area; SPARDS uses the SPARDS area. The frontend must not be trusted to enforce these boundaries.
- Public sign-up should always create a `STUDENT`. Create adviser, dean, and SPARDS accounts only by accepting a single-use `StaffInvite`; never accept an elevated role directly from a public sign-up form.
- Configure each college's `ojtYearLevel` as `THIRD` or `FOURTH`. A student's OJT year is derived through `StudentProfile.program.college.ojtYearLevel`, so it is not duplicated on the student profile. The college/program records must be seeded with QCU's approved catalog and OJT-year mapping.
- Store only password hashes in `User.passwordHash` and hashes of opaque session/invitation tokens in `Session.tokenHash` and `StaffInvite.tokenHash`.

Prisma backs the academic catalog, student sign-up/sign-in, and student profile data. Adviser and SPARDS demo access, plus the workflow API, remain prototype functionality.

## Demo access notice

Adviser and SPARDS access remains a **prototype-only role switcher**, not authentication. Do not use demo roles with real student records or sensitive documents. A production deployment needs QCU sign-in/SSO, staff invitations and assignments, and institutional document-retention and access policies.
