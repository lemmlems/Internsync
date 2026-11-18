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

`isValidStudentId()` only checks that an ID is supplied: the current project requires a student ID at signup but does not define a format. Password validation follows the existing six-character minimum. Upload validation follows the backend's accepted extensions, MIME types, and 5 MB maximum. The application role constants intentionally match its existing `student`, `adviser`, and `spards` roles.

## OJT document workflow

- **Students** view adviser-posted classroom requirements, submit a written response and/or an attachment, and resubmit work returned for changes. They submit signed MOA/MOU documents directly to SPARDS.
- **OJT Advisers** post requirements, review student responses, approve completed submissions, or return work with feedback.
- **SPARDS** can view adviser-approved classroom submissions and student-submitted MOA/MOU documents.

The demo data includes a sample student, adviser, requirements, and submissions. Workflow changes are persisted in `Backend/data/store.json`; uploaded files are stored under `Backend/data/uploads/`. The backend accepts PDF, Word, TXT, JPG, and PNG files up to 5 MB.

## Demo access notice

The role selector is a **prototype-only role switcher**, not authentication. Role-scoped API routes demonstrate each workflow, but anyone with access to the demo can switch roles. Do not use this prototype with real student records or sensitive documents. A production deployment needs QCU sign-in/SSO, authenticated server-side roles and student/adviser assignments, and institutional document-retention and access policies.
