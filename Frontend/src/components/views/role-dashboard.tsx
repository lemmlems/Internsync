import { ArrowRight, ClipboardList, FileCheck2, Files, Users } from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { formatDate } from "@/lib/formatters";

type Requirement = {
  id: string;
  title: string;
  dueDate: string;
};

type Submission = {
  id: string;
  status: string;
  documentType: string;
  studentName: string;
  submittedAt: string;
  fileName: string;
};

type RoleDashboardProps = {
  state: {
    role: "adviser" | "spards";
    requirements: Requirement[];
    submissions: Submission[];
  };
  currentAccount: () => { name?: string };
};

export default function RoleDashboard({ state, currentAccount }: RoleDashboardProps) {
  const isAdviser = state.role === "adviser";
  const account = currentAccount();
  const pendingAssignments = state.submissions.filter((submission) =>
    submission.documentType === "assignment"
    && (submission.status === "Pending adviser review" || submission.status === "Returned"),
  );
  const agreements = state.submissions.filter((submission) =>
    submission.documentType === "MOA" || submission.documentType === "MOU",
  );
  const recentItems = isAdviser ? pendingAssignments : agreements;
  const destination = isAdviser ? "review" : "documents";

  return (
    <div className="grid min-w-0 gap-4">
      <header className="grid gap-1">
        <p className="text-xs font-bold tracking-wider text-muted">
          {isAdviser ? "ADVISER WORKSPACE" : "SPARDS WORKSPACE"}
        </p>
        <h2 className="font-heading text-2xl font-extrabold text-text">
          {isAdviser ? "OJT Adviser Dashboard" : "SPARDS Dashboard"}
        </h2>
        <p className="text-sm text-muted">
          Welcome, {account.name || (isAdviser ? "OJT Adviser" : "SPARDS staff")}.
          {" "}{isAdviser ? "Manage requirements and review student work." : "Review internship placement documents."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {isAdviser ? (
          <>
            <StatCard label="Active Requirements" value={state.requirements.length} icon={<ClipboardList size={18} />} />
            <StatCard label="Awaiting Review" value={pendingAssignments.length} icon={<Users size={18} />} />
            <StatCard
              label="Approved Submissions"
              value={state.submissions.filter((submission) => submission.documentType === "assignment" && submission.status === "Approved").length}
              icon={<FileCheck2 size={18} />}
            />
          </>
        ) : (
          <>
            <StatCard label="Placement Documents" value={agreements.length} icon={<Files size={18} />} />
            <StatCard
              label="Awaiting SPARDS"
              value={agreements.filter((submission) => submission.status === "Submitted to SPARDS").length}
              icon={<ClipboardList size={18} />}
            />
            <StatCard
              label="Adviser-approved Work"
              value={state.submissions.filter((submission) => submission.documentType === "assignment" && submission.status === "Approved").length}
              icon={<FileCheck2 size={18} />}
            />
          </>
        )}
      </div>

      <SectionCard
        title={isAdviser ? "Submissions to review" : "Placement documents"}
        description={isAdviser ? "Student work awaiting your review." : "MOA and MOU documents submitted for processing."}
        viewAll={
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline" data-page={destination}>
            View all <ArrowRight size={16} aria-hidden="true" />
          </button>
        }
      >
        {recentItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            {isAdviser ? "There are no submissions awaiting review." : "There are no placement documents to display."}
          </p>
        ) : (
          <ul className="grid gap-2">
            {recentItems.slice(0, 5).map((submission) => (
              <li key={submission.id} className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-background p-3">
                <span className="min-w-0">
                  <strong className="block truncate text-sm text-text">
                    {submission.fileName || submission.documentType}
                  </strong>
                  <span className="mt-1 block truncate text-xs text-muted">
                    {submission.studentName} · {submission.status}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted">{formatDate(submission.submittedAt, { month: "short", day: "numeric" })}</span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
