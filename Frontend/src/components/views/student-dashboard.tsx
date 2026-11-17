import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Clock3,
  FileCheck2,
} from "lucide-react";
import { NotificationItem } from "@/components/ui/notification-item";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import Requirements from "@/components/views/requirements";
import StudentHoursSummary, {
  ojtCompletion,
  ojtLoggedHours,
  ojtRequiredHours,
} from "@/components/views/StudentHoursSummary";

type ViewProps = {
  state: any;
  currentAccount: () => any;
  submissionFor: (requirementId: string) => any;
  formatDate: (value: string) => string;
  requirementFor: (id: string) => any;
};

const studentPages: Record<string, string> = {
  "student-dashboard": "OJT Student Dashboard",
  "ojt-hours": "OJT Hours Log",
  "requirements-progress": "Requirements Progress",
  "partner-companies": "Partner Companies",
  "my-ojt": "My OJT",
  "moa-moa": "MOU/MOA",
  reflection: "Reflection",
};

function statusVariant(status: string) {
  if (status === "Approved" || status === "Verified" || status === "Ongoing") return "approved";
  if (status === "Returned" || status === "Needs Review") return "returned";
  if (status.includes("Pending") || status === "Not submitted") return "pending";
  return "neutral";
}

function StudentPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="mb-5">
      <p className="text-xs font-bold tracking-wider text-muted">{eyebrow}</p>
      <h2 className="mt-1 font-heading text-2xl font-extrabold text-text">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
    </header>
  );
}

export default function StudentDashboard({ state, currentAccount, submissionFor, formatDate, requirementFor }: ViewProps) {
  if (state.role === "student" && state.page !== "student-dashboard") {
    return (
      <StudentSection
        page={state.page}
        state={state}
        formatDate={formatDate}
        requirementFor={requirementFor}
        submissionFor={submissionFor}
      />
    );
  }

  const account = currentAccount();
  const submissions = state.submissions ?? [];
  const requirements = state.requirements ?? [];
  const pendingReview = submissions.filter((item: any) => item.status === "Pending adviser review").length;
  const approved = submissions.filter((item: any) => item.status === "Approved").length;
  const submittedRequirements = approved + pendingReview;
  const agreements = submissions.filter((item: any) => ["MOA", "MOU"].includes(item.documentType));
  const approvedAgreements = agreements.filter((item: any) => item.status === "Approved").length;

  const requirementRows = [
    { title: "Signed Endorsement Letter", status: "Approved" },
    { title: "Notarized MOU", status: "Approved" },
    { title: "Signed Acceptance Form", status: "Approved" },
    { title: "Liability Waiver", status: "Pending" },
    { title: "Internship Agreement", status: "Needs Review" },
  ];

  const notifications = [
    { title: "Internship Agreement", detail: "Your internship agreement was returned for revision.", time: "2h ago" },
    { title: "Endorsement Letter approved", detail: "Your endorsement letter has been approved by your adviser.", time: "10h ago" },
    { title: "Weekly report due tomorrow", detail: "Don't forget to submit your weekly report by 8:00 AM.", time: "1d ago" },
    { title: "MOU revision updated", detail: "Your MOU document needs corrections. Check the adviser's comments.", time: "3d ago" },
  ];

  const cardShell = "min-h-[130px] rounded-[16px] border border-[#dfe5ef] bg-white";

  return (
    <div className="student-dashboard-home grid gap-3">
      <div className="student-dashboard-stats grid gap-2 sm:grid-cols-3">
        <StatCard
          label="OJT Status"
          value={<StatusBadge variant="approved">Ongoing</StatusBadge>}
          caption={
            <div className="dashboard-stat-details">
              <span>Training Supervisor: <strong>Ms. Maria Santos</strong></span>
              <span className="dashboard-stat-detail-line"><Building2 size={12} aria-hidden="true" /> ITEQ</span>
            </div>
          }
          icon={<span className="dashboard-stat-icon dashboard-stat-icon--green"><BriefcaseBusiness size={15} /></span>}
          className={`${cardShell} student-dashboard-stat border-t-4 border-t-primary p-4`}
        />
        <StatCard
          label="Requirements"
          value={<span className="dashboard-stat-requirement-count">{submittedRequirements}<small> / {requirements.length} submitted</small></span>}
          caption={
            <div className="dashboard-stat-details">
              <span className="dashboard-stat-pending">{pendingReview} pending submission{pendingReview === 1 ? "" : "s"}</span>
              <div className="dashboard-stat-statuses">
                <StatusBadge variant="approved">{approved} Approved</StatusBadge>
                <StatusBadge variant="pending">{pendingReview} For Review</StatusBadge>
              </div>
            </div>
          }
          icon={<span className="dashboard-stat-icon dashboard-stat-icon--orange"><ClipboardList size={15} /></span>}
          className={`${cardShell} student-dashboard-stat border-t-4 border-t-primary p-4`}
        />
        <StatCard
          label="MOA / MOU Status"
          value={`${agreements.length} submitted`}
          caption={
            <div className="dashboard-stat-details">
              <span>{approvedAgreements} approved · Last update</span>
              <span className="dashboard-stat-detail-line"><FileCheck2 size={12} aria-hidden="true" /> {agreements[0] ? formatDate(agreements[0].submittedAt) : "No submissions"}</span>
            </div>
          }
          icon={<span className="dashboard-stat-icon dashboard-stat-icon--purple"><BadgeCheck size={15} /></span>}
          className={`${cardShell} student-dashboard-stat border-t-4 border-t-primary p-4`}
        />
      </div>

      <div className="student-dashboard-panels grid gap-3 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,1fr)]">
        <div className="grid min-w-0 content-start gap-3">
        <SectionCard
          title="OJT Hours Summary"
          viewAll={
            <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" data-page="ojt-hours">
              View all <ArrowRight size={16} aria-hidden="true" />
            </button>
          }
          className={`${cardShell} student-dashboard-section p-3`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-bold text-text">{ojtLoggedHours} / {ojtRequiredHours} hrs <span className="text-sm font-normal text-muted">(Total logged)</span></p>
            <strong className="text-sm font-semibold text-primary">{ojtCompletion.toFixed(1)}% Completed</strong>
          </div>
          <ProgressBar className="student-dashboard-progress mt-3 h-2" value={ojtCompletion} label={`${ojtCompletion.toFixed(1)}% OJT hours completed`} />
        </SectionCard>

        <SectionCard
          title="Requirement & Documents Status"
          viewAll={
            <button type="button" className="text-sm font-semibold text-primary hover:underline" data-page="requirements-progress">
              View all
            </button>
          }
          className={`${cardShell} student-dashboard-section p-3`}
        >
          <ul className="student-dashboard-requirements space-y-1">
            {requirementRows.map((row) => (
              <li className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-slate-50 px-2.5 py-2" key={row.title}>
                <span className={`student-dashboard-dot student-dashboard-dot--${statusVariant(row.status)}`} aria-hidden="true" />
                <span className="min-w-0 truncate text-sm font-medium text-text">{row.title}</span>
                <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>
              </li>
            ))}
          </ul>
          <button type="button" className="student-dashboard-action mt-3 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-primary transition hover:bg-secondary">
            Upload Requirements
          </button>
        </SectionCard>

        <SectionCard title="Weekly Report" className={`${cardShell} student-dashboard-section p-3`}>
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-xs font-medium text-muted">Upcoming Report</p>
              <h3 className="mt-1 text-sm font-bold text-text">Week 4 Accomplishment Report</h3>
              <p className="mt-1 text-xs text-muted">Schedule · Monday - Thursday</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-medium text-muted">Due Tomorrow</p>
              <p className="mt-1 text-sm font-semibold text-text">8:00 AM - 5:00 PM</p>
            </div>
          </div>
          <button type="button" className="student-dashboard-action mt-3 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-primary transition hover:bg-secondary">
            Submit Weekly Report
          </button>
        </SectionCard>
      </div>

      <div className="grid min-w-0 content-start gap-3">
        <SectionCard title={<>Notifications <span className="student-dashboard-count">4</span></>} viewAll={<button type="button" className="student-dashboard-view-all text-sm font-semibold text-primary hover:underline">View all <ArrowRight size={12} aria-hidden="true" /></button>} className={`${cardShell} student-dashboard-section p-3`}>
          <ul className="space-y-1">
            {notifications.map((notification) => (
              <NotificationItem key={notification.title} title={notification.title} text={notification.detail} time={notification.time} className="student-dashboard-notification rounded-lg px-2 py-2 last:border-b-0" />
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="My OJT"
          viewAll={
            <button type="button" className="text-sm font-semibold text-primary hover:underline" data-page="my-ojt">
              View all
            </button>
          }
          className={`${cardShell} student-dashboard-section p-3`}
        >
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-100 text-primary" aria-hidden="true">
              <Building2 size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">Company</p>
              <h3 className="truncate text-sm font-bold text-text">ABC Technologies Inc.</h3>
            </div>
          </div>
          <dl className="mt-4 grid gap-3 border-t border-border pt-4">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-xs text-muted">Training Supervisor</dt>
              <dd className="text-right text-sm font-semibold text-text">Ms. Maria Santos</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-xs text-muted">OJT Schedule</dt>
              <dd className="text-right text-sm font-semibold text-text">September - November 2026</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-xs text-muted">Hours</dt>
              <dd className="text-right text-sm font-semibold text-text">{ojtLoggedHours} / {ojtRequiredHours} Hours</dd>
            </div>
          </dl>
        </SectionCard>
        <p className="sr-only">Welcome, {account?.name || "student"}.</p>
        </div>
      </div>
    </div>
  );
}

function StudentSection({ page, state, formatDate, requirementFor, submissionFor }: Pick<ViewProps, "state" | "formatDate" | "requirementFor" | "submissionFor"> & { page: string }) {
  const requirements = state.requirements ?? [];
  const submissions = state.submissions ?? [];
  const heading = studentPages[page] ?? "OJT Student Dashboard";

  if (page === "ojt-hours") return <StudentHoursSummary />;

  if (page === "requirements-progress") {
    return <Requirements />;
  }

  if (page === "partner-companies") {
    return (
      <div className="grid gap-4">
        <StudentPageHeader eyebrow="INTERNSHIP PLACEMENT" title={heading} description="Review the organization hosting your current internship placement." />
        <SectionCard className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-100 text-primary"><Building2 size={22} /></span>
          <div>
            <p className="text-xs font-bold tracking-wide text-muted">CURRENT PARTNER</p>
            <h3 className="mt-1 text-base font-bold text-text">ABC Technologies Inc.</h3>
            <p className="mt-1 text-sm text-muted">Technology · Quezon City</p>
            <StatusBadge className="mt-3" variant="approved">Active placement</StatusBadge>
          </div>
        </SectionCard>
      </div>
    );
  }

  if (page === "my-ojt") {
    return (
      <div className="grid gap-4">
        <StudentPageHeader eyebrow="INTERNSHIP DETAILS" title={heading} description="Your current placement, supervisor, schedule, and logged hours." />
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard label="Company" value="ABC Technologies Inc." icon={<Building2 size={18} />} />
          <StatCard label="Training Supervisor" value="Ms. Maria Santos" icon={<BriefcaseBusiness size={18} />} />
          <StatCard label="OJT Schedule" value="September 2026 - November 2026" icon={<CalendarDays size={18} />} />
          <StatCard label="Logged Hours" value={`${ojtLoggedHours} / ${ojtRequiredHours} hours`} caption={<ProgressBar value={ojtCompletion} label={`${ojtCompletion.toFixed(1)}% completed`} />} icon={<Clock3 size={18} />} />
        </div>
      </div>
    );
  }

  if (page === "moa-moa") {
    const agreements = submissions.filter((submission: any) => ["MOA", "MOU"].includes(submission.documentType));
    return (
      <div className="grid gap-4">
        <StudentPageHeader eyebrow="PLACEMENT DOCUMENTS" title={heading} description="Check the review status and feedback for submitted MOA and MOU documents." />
        <div className="grid gap-3">
          {agreements.map((submission: any) => (
            <SectionCard className="flex flex-col justify-between gap-4 sm:flex-row" key={submission.id}>
              <div>
                <StatusBadge variant="neutral">{submission.documentType}</StatusBadge>
                <h3 className="mt-2 text-base font-bold text-text">{submission.fileName || `${submission.documentType} submission`}</h3>
                <p className="mt-1 text-sm text-muted">{submission.feedback || submission.answer || "No reviewer feedback yet."}</p>
                <p className="mt-2 text-xs text-muted">Submitted {formatDate(submission.submittedAt)}</p>
              </div>
              <StatusBadge className="self-start" variant={statusVariant(submission.status)}>{submission.status}</StatusBadge>
            </SectionCard>
          ))}
          {agreements.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">You have not submitted an MOA or MOU yet.</p>}
        </div>
      </div>
    );
  }

  const reflections = submissions.filter((submission: any) => submission.documentType === "assignment");
  return (
    <div className="grid gap-4">
      <StudentPageHeader eyebrow="WEEKLY LEARNING LOG" title={heading} description="Review your submitted reflections and the feedback you have received." />
      <div className="grid gap-3">
        {reflections.map((submission: any) => {
          const requirement = requirementFor(submission.requirementId);
          return (
            <SectionCard className="flex flex-col justify-between gap-4 sm:flex-row" key={submission.id}>
              <div className="min-w-0">
                <StatusBadge variant="neutral">{formatDate(submission.submittedAt)}</StatusBadge>
                <h3 className="mt-2 text-base font-bold text-text">{requirement?.title || "OJT Reflection"}</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted">{submission.answer || "No written reflection was attached."}</p>
                {submission.feedback && <p className="mt-2 text-xs text-muted">Adviser feedback: {submission.feedback}</p>}
              </div>
              <StatusBadge className="self-start" variant={statusVariant(submission.status)}>{submission.status}</StatusBadge>
            </SectionCard>
          );
        })}
        {reflections.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">Your submitted reflections will appear here.</p>}
      </div>
    </div>
  );
}
