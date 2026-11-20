import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type StudentSection = {
  id: string;
  code: string;
  joinCode: string;
  yearLevel: number;
  programName: string;
  collegeName: string;
};

export function isStudentSection(value: unknown): value is StudentSection {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && "id" in value
    && typeof value.id === "string"
    && "code" in value
    && typeof value.code === "string"
    && "joinCode" in value
    && typeof value.joinCode === "string"
    && "yearLevel" in value
    && typeof value.yearLevel === "number"
    && "programName" in value
    && typeof value.programName === "string"
    && "collegeName" in value
    && typeof value.collegeName === "string";
}

type ModalSectionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoined: (section: StudentSection) => void;
};

export default function ModalSection({ open, onOpenChange, onJoined }: ModalSectionProps) {
  const [sectionCode, setSectionCode] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionCode.trim()) return;

    setSaving(true);
    setMessage("");
    try {
      let session: { accessToken?: string } | null = null;
      try {
        session = JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
      } catch (error) {
        console.error("Could not read the student session.", error);
        throw new Error("Your session could not be read. Please sign in again.");
      }
      const response = await fetch("/api/students/section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Demo-Role": "student",
          ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        },
        body: JSON.stringify({ sectionCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join this section.");
      if (!isStudentSection(data.section)) {
        throw new Error("The server returned an invalid section.");
      }
      onJoined(data.section);
      handleOpenChange(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join this section.");
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSectionCode("");
      setMessage("");
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showClose={false} className="section-code-dialog max-w-[min(100%-2rem,438px)] gap-0 rounded-[12px] border-0 p-0 shadow-[0_12px_36px_rgba(0,0,0,0.2)]">
        <DialogHeader className="items-center gap-0 px-6 pt-10 text-center sm:text-center">
          <span className="mb-5 grid size-[52px] place-items-center rounded-lg bg-[#dce3ff] text-[#24358e]">
            <KeyRound size={23} strokeWidth={1.7} aria-hidden="true" />
          </span>
          <DialogTitle className="text-[17px] font-bold leading-tight text-[#171717]">
            Enter Section Code
          </DialogTitle>
          <DialogDescription className="mt-2 text-[12px] leading-relaxed text-[#555]">
            Enter the three-part join code provided by your OJT adviser.
          </DialogDescription>
        </DialogHeader>

        <form className="section-code-form px-9 pb-7 pt-5" onSubmit={handleSubmit}>
          <Input
            autoFocus
            aria-label="Section code"
            autoComplete="off"
            className="h-[34px] rounded-md border-[#dedede] bg-white px-3 text-[12px] shadow-none placeholder:text-[#aaa] focus-visible:border-[#16177f] focus-visible:ring-[#16177f]/20"
            onChange={(event) => {
              setSectionCode(event.target.value);
              setMessage("");
            }}
            placeholder="213-ewr-563"
            disabled={saving}
            value={sectionCode}
          />

          {message && (
            <p className="mt-2 text-center text-xs text-[#b42318]" role="alert">
              {message}
            </p>
          )}

          <Button
            className="mx-auto mt-3 flex h-[34px] w-[min(100%,160px)] rounded-md bg-[#151780] text-[12px] font-medium text-white shadow-none hover:bg-[#202596]"
            disabled={!sectionCode.trim() || saving}
            type="submit"
          >
            {saving ? "Joining…" : "Join"}
          </Button>

          <Button
            className="mx-auto mt-2 flex h-8 bg-transparent px-4 text-[12px] font-normal text-[#333] shadow-none hover:bg-transparent hover:text-[#151780]"
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
