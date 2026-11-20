import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Copy,
  Clock3,
  Eye,
  FileCheck2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isSectionColor, sectionColorThemes, type SectionColor } from "@/lib/section-colors";

type TaskCompletion = {
  id: string;
  title: string;
  completed: boolean;
};

type StudentStatus = "Active" | "Completed" | "Pending";

type SectionStudent = {
  id: string;
  studentNumber: string;
  name: string;
  sectionCode: string;
  company: string;
  completedTasks: number;
  totalTasks: number;
  progress: number;
  status: StudentStatus;
  tasks: TaskCompletion[];
};

type SectionTask = {
  id: string;
  title: string;
  completedStudents: number;
  studentCount: number;
  progress: number;
};

type SectionDetail = {
  section: {
    id: string;
    code: string;
    joinCode: string;
    yearLevel: number;
    collegeName: string;
    colorTheme: SectionColor | null;
  };
  schoolYear: string;
  stats: {
    studentCount: number;
    activeCount: number;
    completedCount: number;
    pendingCount: number;
    progress: number;
    tasks: SectionTask[];
  };
  students: SectionStudent[];
};

type AdviserSectionDetailProps = {
  sectionId: string;
  state: { role: string };
  initialColorTheme: SectionColor;
  onBack: () => void;
};

export default function AdviserSectionDetail({ sectionId, state, initialColorTheme, onBack }: AdviserSectionDetailProps) {
  const [detail, setDetail] = useState<SectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedStudent, setSelectedStudent] = useState<SectionStudent | null>(null);
  const [changingJoinCode, setChangingJoinCode] = useState(false);
  const [joinCodeMessage, setJoinCodeMessage] = useState("");
  const [joinCodeMessageIsError, setJoinCodeMessageIsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSection() {
      try {
        const response = await fetch(`/api/sections/${encodeURIComponent(sectionId)}`, {
          headers: { "X-Demo-Role": state.role },
          signal: controller.signal,
        });
        const data: unknown = await response.json();
        if (!response.ok) {
          const message = isRecord(data) && typeof data.error === "string" ? data.error : "Could not load section details.";
          throw new Error(message);
        }
        if (!isSectionDetail(data)) throw new Error("The section details endpoint returned invalid data.");
        setDetail(data);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        console.error("Could not load adviser section details.", loadError);
        setError(loadError instanceof Error ? loadError.message : "Could not load section details.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSection();
    return () => controller.abort();
  }, [sectionId, state.role]);

  const visibleStudents = (detail?.students || []).filter((student) => {
    const searchText = search.trim().toLocaleLowerCase();
    const matchesSearch = !searchText
      || student.name.toLocaleLowerCase().includes(searchText)
      || student.studentNumber.toLocaleLowerCase().includes(searchText)
      || student.company.toLocaleLowerCase().includes(searchText);
    return matchesSearch && (statusFilter === "All Statuses" || student.status === statusFilter);
  });

  async function copyJoinCode() {
    const joinCode = detail?.section.joinCode;
    if (!joinCode) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard access is unavailable.");
      await navigator.clipboard.writeText(joinCode);
      setJoinCodeMessage("Join code copied.");
      setJoinCodeMessageIsError(false);
    } catch (copyError) {
      console.error("Could not copy the section join code.", copyError);
      setJoinCodeMessage("Could not copy the join code. Check clipboard permissions.");
      setJoinCodeMessageIsError(true);
    }
  }

  async function changeJoinCode() {
    if (!window.confirm("Change this section's join code? The current code will stop working.")) return;
    setChangingJoinCode(true);
    setJoinCodeMessage("");
    try {
      const response = await fetch(`/api/sections/${encodeURIComponent(sectionId)}/join-code`, {
        method: "PATCH",
        headers: { "X-Demo-Role": state.role },
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = isRecord(data) && typeof data.error === "string" ? data.error : "Could not change the join code.";
        throw new Error(message);
      }
      if (!isRecord(data) || typeof data.joinCode !== "string") {
        throw new Error("The join-code endpoint returned invalid data.");
      }
      const joinCode = data.joinCode;
      setDetail((current) => current
        ? { ...current, section: { ...current.section, joinCode } }
        : current);
      setJoinCodeMessage("Join code changed.");
      setJoinCodeMessageIsError(false);
    } catch (changeError) {
      console.error("Could not change the section join code.", changeError);
      setJoinCodeMessage(changeError instanceof Error ? changeError.message : "Could not change the join code.");
      setJoinCodeMessageIsError(true);
    } finally {
      setChangingJoinCode(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Loading section details…</p>;
  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>;
  if (!detail) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">Section details are unavailable.</p>;

  const bannerTheme = sectionColorThemes[detail.section.colorTheme || initialColorTheme];

  return (
    <div className="grid gap-3 text-[#1d2438]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-[#151780] hover:underline"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to Sections
      </button>

      <section
        className="flex min-h-[145px] flex-wrap items-end justify-between gap-5 overflow-hidden rounded-xl px-5 py-5 shadow-[0_3px_10px_rgba(20,33,73,0.12)]"
        style={{ background: bannerTheme.banner, color: bannerTheme.foreground }}
      >
        <div className="min-w-0">
          <h2 className="font-heading text-2xl font-extrabold leading-tight">{detail.section.code}</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <ClipboardList size={14} aria-hidden="true" />
            <span className="font-semibold">Class code</span>
            <span className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void copyJoinCode()}
                title="Copy class code"
                aria-label={`Copy class code ${detail.section.joinCode}`}
                className="inline-flex items-center gap-1.5 rounded border border-current/20 bg-white/10 px-2.5 py-1.5 font-semibold hover:bg-white/20"
              >
                <code className="font-mono tracking-wider">{detail.section.joinCode}</code>
                <Copy size={11} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => void changeJoinCode()}
                disabled={changingJoinCode}
                title="Change class code"
                aria-label="Change class code"
                className="inline-grid size-8 place-items-center rounded border border-current/20 hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={13} aria-hidden="true" className={changingJoinCode ? "animate-spin" : ""} />
              </button>
            </span>
          </div>
          {joinCodeMessage && (
            <p
              className={`mt-2 inline-block rounded px-2 py-1 text-[10px] ${joinCodeMessageIsError ? "bg-white/90 text-red-700" : "bg-black/10 text-current"}`}
              role={joinCodeMessageIsError ? "alert" : "status"}
            >
              {joinCodeMessage}
            </p>
          )}
        </div>
        <div className="inline-flex items-center gap-2 self-end rounded-md bg-black/10 px-3 py-2 text-xs font-semibold">
          <CalendarDays size={14} aria-hidden="true" />
          School Year {detail.schoolYear}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<Users size={20} />} label="Total Students" value={detail.stats.studentCount} color="bg-[#fff4b8] text-[#e2a900]" />
        <SummaryCard icon={<Clock3 size={20} />} label="Active" value={detail.stats.activeCount} color="bg-[#dceaff] text-[#2264d1]" />
        <SummaryCard icon={<CheckCircle2 size={20} />} label="Completed" value={detail.stats.completedCount} color="bg-[#e9ddff] text-[#6632b5]" />
        <SummaryCard icon={<Clock3 size={20} />} label="Pending" value={detail.stats.pendingCount} color="bg-[#d9f1e9] text-[#228b68]" />
      </div>

      <section className="overflow-hidden rounded-xl border border-[#e1e6f0] bg-white shadow-[0_3px_12px_rgba(20,33,73,0.08)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ebf2] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold">Student OJT Monitoring</h3>
            <p className="mt-0.5 text-[10px] text-[#798399]">Track student task completion and requirements.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search students</span>
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8791a6]" aria-hidden="true" />
              <input
                className="h-8 w-[150px] rounded-lg border border-[#e1e5ed] pl-8 pr-2 text-[10px] outline-none focus:border-[#9ba9d5]"
                type="search"
                placeholder="Search student..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                className="h-8 rounded-lg border border-[#e1e5ed] bg-white px-2 text-[10px] outline-none focus:border-[#9ba9d5]"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option>All Statuses</option>
                <option>Active</option>
                <option>Completed</option>
                <option>Pending</option>
              </select>
            </label>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-[10px]">
            <thead className="bg-[#fafbfe] text-[9px] uppercase tracking-wide text-[#515b73]">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Student</th>
                <th className="px-3 py-2.5 font-semibold">Section</th>
                <th className="px-3 py-2.5 font-semibold">Company</th>
                <th className="px-3 py-2.5 font-semibold">Task Progress</th>
                <th className="px-3 py-2.5 font-semibold">Requirements</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
                <th className="px-3 py-2.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleStudents.map((student) => (
                <tr key={student.id} className="border-t border-[#edf0f5]">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eff1ff] text-[9px] font-bold text-[#151780]">
                        {getInitials(student.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[#202a43]">{student.name}</span>
                        <span className="block text-[9px] text-[#778198]">{student.studentNumber}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#3d4760]">{student.sectionCode}</td>
                  <td className="px-3 py-2.5 text-[#3d4760]">{student.company || "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#e6e8ed]" role="progressbar" aria-label={`${student.name} task progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={student.progress}>
                        <div className="h-full rounded-full bg-[#101b80]" style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className="font-semibold">{student.progress}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[#3d4760]">
                      <FileCheck2 size={12} aria-hidden="true" />
                      {student.completedTasks}/{student.totalTasks}
                    </span>
                  </td>
                  <td className="px-3 py-2.5"><StudentStatusBadge status={student.status} /></td>
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className="inline-flex items-center gap-1 font-semibold text-[#151780] hover:underline"
                    >
                      <Eye size={12} aria-hidden="true" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {visibleStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-xs text-[#798399]">
                    {detail.students.length ? "No students match your search." : "No students have joined this section yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-[#edf0f5] px-4 py-2 text-[9px] text-[#798399]">
          Showing {visibleStudents.length} of {detail.students.length} students
        </footer>
      </section>

      <Dialog open={Boolean(selectedStudent)} onOpenChange={(open) => { if (!open) setSelectedStudent(null); }}>
        <DialogContent>
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedStudent.name}</DialogTitle>
                <DialogDescription>
                  {selectedStudent.completedTasks} of {selectedStudent.totalTasks} tasks completed · {selectedStudent.progress}%
                </DialogDescription>
              </DialogHeader>
              {selectedStudent.tasks.length ? (
                <div className="grid max-h-[55vh] gap-3 overflow-y-auto">
                  {selectedStudent.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e8ebf2] px-3 py-2 text-sm">
                      <span className="text-[#283451]">{task.title}</span>
                      <span className={task.completed ? "shrink-0 font-semibold text-[#157451]" : "shrink-0 text-[#68748b]"}>
                        {task.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#68748b]">No tasks are currently assigned.</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: ReactNode; label: string; value: number; color: string }) {
  return (
    <article className="flex items-center gap-3 rounded-lg border border-[#e6eaf2] bg-white px-3 py-3 shadow-[0_2px_6px_rgba(20,33,73,0.08)]">
      <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${color}`}>{icon}</span>
      <div>
        <p className="text-[10px] text-[#4c566d]">{label}</p>
        <p className="mt-0.5 text-lg font-extrabold leading-none text-[#101828]">{value}</p>
      </div>
    </article>
  );
}

function StudentStatusBadge({ status }: { status: StudentStatus }) {
  const styles: Record<StudentStatus, string> = {
    Active: "bg-[#eef0ff] text-[#28328d]",
    Completed: "bg-[#101b80] text-white",
    Pending: "bg-[#fff5dd] text-[#9a6b00]",
  };
  return <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${styles[status]}`}>{status}</span>;
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTaskCompletion(value: unknown): value is TaskCompletion {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.completed === "boolean";
}

function isSectionTask(value: unknown): value is SectionTask {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.title === "string"
    && typeof value.completedStudents === "number"
    && typeof value.studentCount === "number"
    && typeof value.progress === "number";
}

function isSectionStudent(value: unknown): value is SectionStudent {
  return isRecord(value)
    && typeof value.id === "string"
    && typeof value.studentNumber === "string"
    && typeof value.name === "string"
    && typeof value.sectionCode === "string"
    && typeof value.company === "string"
    && typeof value.completedTasks === "number"
    && typeof value.totalTasks === "number"
    && typeof value.progress === "number"
    && ["Active", "Completed", "Pending"].includes(String(value.status))
    && Array.isArray(value.tasks)
    && value.tasks.every(isTaskCompletion);
}

function isSectionDetail(value: unknown): value is SectionDetail {
  if (!isRecord(value) || !isRecord(value.section) || !isRecord(value.stats)) return false;
  const { section, stats } = value;
  return typeof section.id === "string"
    && typeof section.code === "string"
    && typeof section.joinCode === "string"
    && typeof section.yearLevel === "number"
    && typeof section.collegeName === "string"
    && (section.colorTheme === null || isSectionColor(section.colorTheme))
    && typeof value.schoolYear === "string"
    && typeof stats.studentCount === "number"
    && typeof stats.activeCount === "number"
    && typeof stats.completedCount === "number"
    && typeof stats.pendingCount === "number"
    && typeof stats.progress === "number"
    && Array.isArray(stats.tasks)
    && stats.tasks.every(isSectionTask)
    && Array.isArray(value.students)
    && value.students.every(isSectionStudent);
}
