import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ModalSection from "@/components/views/modal-section";

export default function Requirements() {
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

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
          Join Section
        </Button>
      </header>

      <section className="requirements-join-empty" aria-label="OJT section">
        <p>Join Section</p>
      </section>
      <ModalSection open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen} />
    </main>
  );
}