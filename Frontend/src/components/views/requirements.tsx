import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalSection, { isStudentSection, type StudentSection } from "@/components/views/modal-section";

export default function Requirements() {
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [section, setSection] = useState<StudentSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadSection() {
      try {
        let session: { accessToken?: string } | null = null;
        try {
          session = JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
        } catch (sessionError) {
          console.error("Could not read the student session.", sessionError);
          throw new Error("Your session could not be read. Please sign in again.");
        }
        const response = await fetch("/api/students/section", {
          headers: {
            "X-Demo-Role": "student",
            ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
          },
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load your OJT section.");
        if (data.section !== null && !isStudentSection(data.section)) {
          throw new Error("The server returned an invalid section.");
        }
        setSection(data.section);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        console.error("Could not load the student's OJT section.", loadError);
        setError(loadError instanceof Error ? loadError.message : "Could not load your OJT section.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSection();
    return () => controller.abort();
  }, []);

  return (
    <main className="requirements-join-page">
      <header className="requirements-join-header">
        <div className="requirements-join-copy">
          <h2>Join your OJT Section</h2>
          <p>Enter the section code provided by your OJT adviser and request to join.</p>
        </div>
        <Button
          className="requirements-join-button"
          onClick={() => setIsSectionModalOpen(true)}
          type="button"
        >
          <Plus size={15} aria-hidden="true" />
          {section ? "Change Section" : "Join Section"}
        </Button>
      </header>

      <section className="requirements-join-empty" aria-label="OJT section">
        {loading ? (
          <p>Loading your OJT section…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : section ? (
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#718096]">Joined Section</p>
            <h3 className="text-lg font-bold text-[#1d2438]">{section.code}</h3>
            <p>{section.programName} · Year {section.yearLevel}</p>
            <p className="text-xs text-[#718096]">Join code: {section.joinCode}</p>
          </div>
        ) : (
          <p>Join Section</p>
        )}
      </section>
      <ModalSection
        open={isSectionModalOpen}
        onOpenChange={setIsSectionModalOpen}
        onJoined={setSection}
      />
    </main>
  );
}