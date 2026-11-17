import { CalendarDays, CircleCheck, Download, Plus } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";

const ojtHourLogs = [
  { date: "Sep 18, 2026", timeIn: "08:00 AM", timeOut: "07:00 PM", hours: 10 },
  { date: "Sep 17, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 16, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 15, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 14, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 11, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 10, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 9, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 8, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 7, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 4, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 3, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 2, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Sep 1, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
  { date: "Aug 31, 2026", timeIn: "08:00 AM", timeOut: "05:00 PM", hours: 8 },
];

export const ojtLoggedHours = ojtHourLogs.reduce((total, log) => total + log.hours, 0);
export const ojtRequiredHours = 243;
export const ojtCompletion = (ojtLoggedHours / ojtRequiredHours) * 100;

export default function StudentHoursSummary() {
  return (
    <div className="ojt-hours-page grid gap-3">
      <div className="ojt-hours-overview">
        <StatCard
          className="ojt-hours-stat"
          label="Total Logged Hours"
          value={`${ojtLoggedHours} / ${ojtRequiredHours} hrs`}
          caption={<><ProgressBar className="mt-3" value={ojtCompletion} label={`${ojtCompletion.toFixed(1)}% completed`} /><span className="mt-2 block">{ojtCompletion.toFixed(1)}% completed</span></>}
        />
        <StatCard
          className="ojt-hours-stat"
          label="Total Days Logged"
          value={`${ojtHourLogs.length} Days`}
          caption="14 Regular Days · 1 Overtime Day"
          icon={<CalendarDays size={18} />}
        />
        <StatCard
          className="ojt-hours-stat"
          label="Latest Log Status"
          value={<StatusBadge className="ojt-hours-badge" variant="approved">Verified</StatusBadge>}
          caption="Last verified Sep 18, 2026"
          icon={<CircleCheck size={18} />}
        />
        <div className="ojt-hours-actions">
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
            <Plus size={16} aria-hidden="true" />
            Log OJT Hours
          </button>
          <button type="button" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary bg-card px-4 text-sm font-semibold text-primary transition hover:bg-secondary">
            <Download size={16} aria-hidden="true" />
            Export DTR
          </button>
        </div>
      </div>

      <SectionCard
        title="OJT Hour Log"
        description="Submitted daily attendance records"
        viewAll={<span className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold text-primary">{ojtHourLogs.length} Records</span>}
        className="ojt-hours-log overflow-hidden p-0"
      >
        <div className="overflow-x-auto">
          <table className="ojt-hours-table min-w-[480px] w-full border-collapse text-left">
            <thead className="bg-background text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3" scope="col">Date</th>
                <th className="px-4 py-3" scope="col">Time In</th>
                <th className="px-4 py-3" scope="col">Time Out</th>
                <th className="px-4 py-3" scope="col">Hours</th>
                <th className="px-4 py-3" scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {ojtHourLogs.map((log) => (
                <tr className="border-t border-border text-sm text-text" key={log.date}>
                  <td className="px-4 py-3 font-semibold">{log.date}</td>
                  <td className="px-4 py-3">{log.timeIn}</td>
                  <td className="px-4 py-3">{log.timeOut}</td>
                  <td className="px-4 py-3">{log.hours} hrs</td>
                  <td className="px-4 py-3"><StatusBadge className="ojt-hours-badge" variant="approved">Approved</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-xs text-muted">
          <span>Showing {ojtHourLogs.length} logged days</span>
          <strong className="text-sm text-text">Total Accumulated: {ojtLoggedHours} Hours</strong>
        </footer>
      </SectionCard>
    </div>
  );
}