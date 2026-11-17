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

type ModalSectionProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function ModalSection({ open, onOpenChange }: ModalSectionProps) {
  const [sectionCode, setSectionCode] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionCode.trim()) return;

    setMessage("Section joining is not connected yet. Please contact your OJT adviser.");
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setSectionCode("");
      setMessage("");
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
            Ask your Professor for the section code, then enter it here.
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
            placeholder="Section Code"
            value={sectionCode}
          />

          {message && (
            <p className="mt-2 text-center text-xs text-[#b42318]" role="alert">
              {message}
            </p>
          )}

          <Button
            className="mx-auto mt-3 flex h-[34px] w-[min(100%,160px)] rounded-md bg-[#151780] text-[12px] font-medium text-white shadow-none hover:bg-[#202596]"
            disabled={!sectionCode.trim()}
            type="submit"
          >
            Join
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
