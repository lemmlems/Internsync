import { useEffect, useState } from "react";
import { ArrowRight, Check, Settings, Users } from "lucide-react";
import AdviserSectionDetail from "@/components/views/adviser-section-detail";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  defaultSectionColor,
  isSectionColor,
  sectionColorNames,
  sectionColorThemes,
  type SectionColor,
} from "@/lib/section-colors";

type SectionTaskProgress = {
  id: string;
  title: string;
  completedStudents: number;
  studentCount: number;
  progress: number;
};

type SectionRecord = {
  id: string;
  letter: string;
  yearLevel: number;
  code: string;
  programId: string;
  programCode: string;
  programName: string;
  collegeId: string;
  colorTheme: SectionColor | null;
  studentCount: number;
  activeCount: number;
  completedCount: number;
  pendingCount: number;
  progress: number;
  tasks: SectionTaskProgress[];
};

type AdviserSectionProps = {
  state: { role: string };
};

export default function AdviserSection({ state }: AdviserSectionProps) {
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [assignedProgramId, setAssignedProgramId] = useState("");
  const [assignedCollegeId, setAssignedCollegeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);
  const [error, setError] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [colorSettingsSection, setColorSettingsSection] = useState<SectionRecord | null>(null);
  const [colorSaveError, setColorSaveError] = useState("");
  const [savingColor, setSavingColor] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadSections() {
      try {
        let session: { email?: string } | null = null;
        try {
          session = JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
        } catch (sessionError) {
          console.error("Could not read the adviser session.", sessionError);
        }
        const email = session?.email || "adviser@qcu.edu.ph";
        let profile: { collegeId?: string; programId?: string } | null = null;
        try {
          profile = JSON.parse(localStorage.getItem(`internsync-adviser-profile:${email.toLowerCase()}`) || "null");
        } catch (profileError) {
          console.error("Could not read the saved adviser profile.", profileError);
        }
        if (!profile?.collegeId || !profile.programId) {
          setProfileMissing(true);
          return;
        }

        setAssignedCollegeId(profile.collegeId);
        setAssignedProgramId(profile.programId);
        setProfileMissing(false);
        const response = await fetch("/api/sections", {
          headers: { "X-Demo-Role": state.role },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load sections.");
        if (!Array.isArray(data.sections)) throw new Error("The sections endpoint returned invalid data.");

        const records = data.sections as SectionRecord[];
        if (records.some((section) =>
          typeof section.id !== "string"
          || typeof section.code !== "string"
          || typeof section.programId !== "string"
          || typeof section.programName !== "string"
          || !(section.colorTheme === null || isSectionColor(section.colorTheme))
          || typeof section.yearLevel !== "number"
          || typeof section.letter !== "string"
          || typeof section.studentCount !== "number"
          || typeof section.activeCount !== "number"
          || typeof section.completedCount !== "number"
          || typeof section.pendingCount !== "number"
          || typeof section.progress !== "number"
          || !Array.isArray(section.tasks)
          || section.tasks.some((task) =>
            typeof task.id !== "string"
            || typeof task.title !== "string"
            || typeof task.completedStudents !== "number"
            || typeof task.studentCount !== "number"
            || typeof task.progress !== "number"
          )
        )) {
          throw new Error("The sections endpoint returned invalid section data.");
        }
        if (!records.some((section) =>
          section.programId === profile.programId && section.collegeId === profile.collegeId,
        )) {
          setProfileMissing(true);
          return;
        }

        setSections(records);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        console.error("Could not load adviser sections:", loadError);
        setError(loadError instanceof Error ? loadError.message : "Could not load sections.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSections();
    return () => controller.abort();
  }, [state.role]);

  const visibleSections = sections.filter((section) =>
    section.programId === assignedProgramId
    && section.collegeId === assignedCollegeId,
  );

  async function updateSectionColor(colorTheme: SectionColor) {
    if (!colorSettingsSection) return;
    setSavingColor(true);
    setColorSaveError("");
    try {
      const response = await fetch(`/api/sections/${encodeURIComponent(colorSettingsSection.id)}/color`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Role": state.role,
        },
        body: JSON.stringify({ colorTheme }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = isRecord(data) && typeof data.error === "string" ? data.error : "Could not update the section color.";
        throw new Error(message);
      }
      if (!isRecord(data) || !isSectionColor(data.colorTheme)) {
        throw new Error("The section color endpoint returned invalid data.");
      }
      const savedColorTheme = data.colorTheme;
      setSections((current) => current.map((section) =>
        section.id === colorSettingsSection.id ? { ...section, colorTheme: savedColorTheme } : section,
      ));
      setColorSettingsSection((current) => current
        ? { ...current, colorTheme: savedColorTheme }
        : current);
    } catch (colorError) {
      console.error("Could not update the section color.", colorError);
      setColorSaveError(colorError instanceof Error ? colorError.message : "Could not update the section color.");
    } finally {
      setSavingColor(false);
    }
  }

  if (selectedSectionId) {
    const selectedSection = sections.find((section) => section.id === selectedSectionId);
    return (
      <AdviserSectionDetail
        sectionId={selectedSectionId}
        state={state}
        initialColorTheme={selectedSection?.colorTheme || defaultSectionColor(
          Math.max(0, visibleSections.findIndex((section) => section.id === selectedSectionId)),
        )}
        onBack={() => setSelectedSectionId("")}
      />
    );
  }

  return (
    <div>
      {loading ? (
        <p className="py-8 text-center text-sm text-muted">Loading saved sections…</p>
      ) : profileMissing ? (
        <section role="alert" className="grid min-h-[48vh] place-items-center rounded-xl bg-white px-6 py-12 text-center">
          <div className="max-w-lg">
            <h3 className="font-heading text-2xl font-extrabold text-[#c7c7c7]">College / Program Required</h3>
            <p className="mt-3 text-sm leading-relaxed text-[#8a8a8a]">
              Your adviser profile doesn’t have a valid college and program yet. Please update your profile to view your sections.
            </p>
            <button
              type="button"
              data-page="adviser-profile"
              className="mt-5 rounded-lg bg-[#12177f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#30398e]"
            >
              Update Profile
            </button>
          </div>
        </section>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">{error}</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleSections.map((section, index) => {
              const theme = sectionColorThemes[section.colorTheme || defaultSectionColor(index)];
              return (
                <article
                  key={section.id}
                  aria-label={`${section.code} section`}
                  className="overflow-hidden rounded-xl border border-[#e6eaf2] bg-white shadow-[0_5px_16px_rgba(20,33,73,0.12)]"
                >
                  <header className={`min-h-[82px] px-5 py-3 ${theme.header}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-heading text-base font-extrabold leading-tight">{section.code}</h2>
                      <button
                        type="button"
                        aria-label={`Choose color for ${section.code}`}
                        title="Section settings"
                        onClick={() => {
                          setColorSaveError("");
                          setColorSettingsSection(section);
                        }}
                        className={`grid size-8 shrink-0 place-items-center rounded-full transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${theme.badge}`}
                      >
                        <Settings size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] leading-snug">{section.programName}</p>
                  </header>
                  <div className="px-5 pb-4 pt-3">
                    <div className="grid grid-cols-3 text-center">
                      <SectionMetric value={section.activeCount} label="Active" className="text-[#101b80]" />
                      <SectionMetric value={section.completedCount} label="Completed" className="text-[#e7a900]" />
                      <SectionMetric value={section.pendingCount} label="Pending" className="text-[#e3224d]" />
                    </div>
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] text-[#18225c]">
                        <span>Progress</span>
                        <span>{section.progress}% average complete</span>
                      </div>
                      <div
                        className="h-2.5 overflow-hidden rounded-full bg-[#e5e5e5] shadow-inner"
                        role="progressbar"
                        aria-label={`${section.code} average task completion`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={section.progress}
                      >
                        <div
                          className="h-full rounded-full transition-[width] duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, section.progress))}%`,
                            backgroundColor: theme.progress,
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-[#18225c]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users size={15} aria-hidden="true" />
                        {section.studentCount} students
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSectionId(section.id)}
                        className="inline-flex items-center gap-1 font-semibold hover:underline"
                      >
                        View Section <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
      <Dialog
        open={Boolean(colorSettingsSection)}
        onOpenChange={(open) => {
          if (!open && !savingColor) {
              setColorSettingsSection(null);
              setColorSaveError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Section color</DialogTitle>
              <DialogDescription>
                Choose the color for {colorSettingsSection?.code || "this section"}. It will be used on the section card and banner.
              </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Section colors">
              {sectionColorNames.map((colorName) => {
                const color = sectionColorThemes[colorName];
                const selected = colorSettingsSection?.colorTheme === colorName
                  || (!colorSettingsSection?.colorTheme
                    && colorName === defaultSectionColor(visibleSections.findIndex((section) => section.id === colorSettingsSection?.id)));
                return (
                  <button
                    key={colorName}
                    type="button"
                    aria-label={`Set ${color.label} section color`}
                    aria-pressed={selected}
                    disabled={savingColor}
                    onClick={() => void updateSectionColor(colorName)}
                    className="flex items-center gap-2 rounded-lg border border-[#e1e5ed] p-2 text-left text-xs font-medium text-[#283451] hover:bg-[#f7f8fb] disabled:opacity-60"
                  >
                    <span className="grid size-7 place-items-center rounded-full" style={{ backgroundColor: color.swatch }}>
                      {selected && <Check size={15} className={colorName === "blue" || colorName === "yellow" || colorName === "orange" ? "text-[#172044]" : "text-white"} aria-hidden="true" />}
                    </span>
                    {color.label}
                  </button>
                );
              })}
          </div>
          {colorSaveError && <p role="alert" className="text-sm text-red-600">{colorSaveError}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionMetric({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div>
      <p className={`text-lg font-extrabold leading-tight ${className}`}>{value}</p>
      <p className="mt-1 text-[10px] text-[#14204e]">{label}</p>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
