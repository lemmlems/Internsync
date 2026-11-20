import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";

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
    page: string;
    requirements: { id: string; title: string; dueDate: string }[];
    submissions: Submission[];
  };
  currentAccount: () => { name?: string };
};

export default function RoleDashboard({ state, currentAccount }: RoleDashboardProps) {
  const isAdviser = state.role === "adviser";

  if (!isAdviser) {
    return <SPARDSDashboard state={state} />;
  }

  if (state.page !== "adviser-dashboard") {
    const pageCopy: Record<string, { title: string; description: string }> = {
      sections: { title: "Sections", description: "View the student sections assigned to you." },
      "monitoring-overview": { title: "Monitoring Overview", description: "Track internship progress across your sections." },
      report: { title: "Reports", description: "Review section activity and submission reports." },
      review: { title: "Review Submissions", description: "Approve or return student requirements." },
    };
    const copy = pageCopy[state.page] || pageCopy.review;
    return (
      <div className="grid gap-4">
        <header>
          <p className="text-xs font-bold tracking-wider text-muted">ADVISER WORKSPACE</p>
          <h2 className="mt-1 font-heading text-2xl font-extrabold text-text">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted">{copy.description}</p>
        </header>
        <SectionCard title={copy.title}>
          {state.submissions.length ? (
            <div className="grid gap-2">
              {state.submissions.slice(0, 8).map((submission) => (
                <div key={submission.id} className="flex items-center justify-between gap-3 rounded-lg bg-background p-3 text-sm">
                  <span className="font-semibold text-text">{submission.studentName}</span>
                  <span className="text-xs text-muted">{submission.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted">No records are available for this section yet.</p>
          )}
        </SectionCard>
      </div>
    );
  }

  const account = currentAccount();
  const pending = state.submissions.filter((item) => item.status === "Pending adviser review").length;
  const approved = state.submissions.filter((item) => item.status === "Approved").length;
  const students = [
    { name: "Criselle Reyes", course: "BSIT", company: "XYZ Innovations", status: "Ongoing", submitted: "September 15, 2026", action: "View" },
    { name: "Sofia Jane Tan", course: "BSIT", company: "XYZ Innovations", status: "Ongoing", submitted: "September 16, 2026", action: "View" },
    { name: "Hauzrin Alcantara", course: "BSIT", company: "Skyline Technologies", status: "Ongoing", submitted: "September 17, 2026", action: "View" },
    { name: "Salwa Aming", course: "BST", company: "Densa Bauan Corp.", status: "Ongoing", submitted: "September 17, 2026", action: "View" },
  ];

  return (
    <div className="adviser-dashboard grid gap-3">
      <section className="adviser-banner">
        <div>
          <p>Monday, September 16</p>
          <h2>Good morning, {account.name?.split(" ")[0] || "Juan"}!</h2>
          <span>Keep your students progressing with your ongoing OJT.</span>
        </div>
      </section>

      <div className="adviser-stats">
        <StatCard label="Adviser Statistics" value={students.length} caption={<span><strong>{state.requirements.length || 3}</strong> Requirements · <strong>{pending}</strong> Pending</span>} icon={<GraduationCap size={17} />} />
        <StatCard label="Ongoing OJT" value={students.length} caption={<span><strong>4</strong> Active Internships</span>} icon={<ClipboardCheck size={17} />} />
        <StatCard label="Requirements" value={state.requirements.length || 3} caption={<span><strong>{approved}</strong> Approved · <strong>{pending}</strong> For Review</span>} icon={<ClipboardList size={17} />} />
        <StatCard label="DTR Progress" value="2" caption={<span><strong>0</strong> Approved · <strong>1</strong> Needs Revision</span>} icon={<CheckCircle2 size={17} />} />
      </div>

      <div className="adviser-overviews">
        <SectionCard title="OJT Overview" className="adviser-chart-card">
          <div className="adviser-bar-chart" aria-label="OJT overview chart">
            {[3, 5, 2, 1].map((height, index) => (
              <div key={index}><span style={{ height: `${height * 18}px` }} /><small>{["On-going", "Pending", "Completed", "Returned"][index]}</small></div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Requirements Status" className="adviser-chart-card">
          <div className="adviser-donut-layout">
            <div className="adviser-donut"><span>70%<small>Submitted</small></span></div>
            <ul>
              <li><i className="bg-[#282c78]" />Endorsement 5</li>
              <li><i className="bg-[#f0b21b]" />Submitted 3</li>
              <li><i className="bg-[#e5e8f0]" />Waiting 2</li>
              <li><i className="bg-[#ed5c66]" />Returned 1</li>
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="OJT Progress" className="adviser-chart-card">
          <div className="adviser-donut-layout adviser-donut-layout--compact">
            <div className="adviser-donut adviser-donut--progress"><span>44%<small>Completed</small></span></div>
            <ul>
              <li><i className="bg-[#282c78]" />Ongoing 5</li>
              <li><i className="bg-[#f0b21b]" />Completed 3</li>
              <li><i className="bg-[#ed5c66]" />Returned 1</li>
            </ul>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Recent Student Submission"
        viewAll={<button type="button" className="adviser-view-all" data-page="review">View All <ArrowRight size={13} /></button>}
        className="adviser-table-card"
      >
        <div className="adviser-table-wrap">
          <table className="adviser-table">
            <thead><tr><th>Student Name</th><th>Course</th><th>Company</th><th>OJT Status</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.name}>
                  <td>{student.name}</td><td>{student.course}</td><td>{student.company}</td>
                  <td><span className="adviser-status adviser-status--ongoing">{student.status}</span></td>
                  <td>{student.submitted}</td><td><span className="adviser-status adviser-status--pending">Pending</span></td>
                  <td><button type="button" data-page="review" className="adviser-review-button">Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Sections"
        description="Browse program sections generated from the academic catalog."
        viewAll={<button type="button" className="adviser-view-all" data-page="sections">View Sections <ArrowRight size={13} /></button>}
        className="adviser-sections-card"
      >
        <p className="text-sm text-muted">Each program has sections A–Z labeled with its OJT year level.</p>
      </SectionCard>
    </div>
  );
}

function SPARDSDashboard({ state }: { state: RoleDashboardProps["state"] }) {
  return (
    <div className="grid gap-4">
      <h2 className="font-heading text-2xl font-extrabold text-text">SPARDS Dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Placement Documents" value={state.submissions.length} icon={<ClipboardList size={18} />} />
        <StatCard label="Awaiting SPARDS" value={state.submissions.filter((item) => item.status === "Submitted to SPARDS").length} icon={<BarChart3 size={18} />} />
        <StatCard label="Adviser-approved Work" value={state.submissions.filter((item) => item.status === "Approved").length} icon={<CheckCircle2 size={18} />} />
      </div>
    </div>
  );
}
