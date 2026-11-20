import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CloudUpload, FilePenLine, FileText, Pencil, Save, UserRound } from "lucide-react";

type Program = {
  id: string;
  name: string;
  code?: string;
};

type College = {
  id: string;
  name: string;
  programs: Program[];
};

type AdviserProfileData = {
  name?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  collegeId?: string;
  programId?: string;
  signatureImage?: string;
};

type AdviserAccount = {
  name?: string;
  email?: string;
  initials?: string;
};

type AdviserProfileProps = {
  currentAccount: () => AdviserAccount;
};

type AdviserProfileDraft = {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  collegeId: string;
  programId: string;
  signatureImage: string;
};

function readSavedProfile(storageKey: string): AdviserProfileData {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null") || {};
  } catch (error) {
    console.error("Could not read the saved adviser profile.", error);
    return {};
  }
}

function makeDraft(profile: AdviserProfileData, account: AdviserAccount): AdviserProfileDraft {
  const nameParts = (profile.name || account.name || "Juan Dela Cruz").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: profile.firstName || nameParts.shift() || "",
    middleName: profile.middleName || nameParts.slice(0, -1).join(" "),
    lastName: profile.lastName || nameParts.pop() || "",
    email: profile.email || account.email || "adviser@qcu.edu.ph",
    phone: profile.phone || "",
    collegeId: profile.collegeId || "",
    programId: profile.programId || "",
    signatureImage: profile.signatureImage || "",
  };
}

function getFullName(draft: AdviserProfileDraft) {
  return [draft.firstName.trim(), draft.middleName.trim(), draft.lastName.trim()].filter(Boolean).join(" ");
}

function formatProgramLabel(program: Program) {
  return program.code ? `${program.name} (${program.code})` : program.name;
}

function getNationalPhoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

function formatPhilippinePhone(value: string) {
  const digits = getNationalPhoneDigits(value);
  return digits ? `+63${digits}` : "";
}

function displayPhilippinePhone(value: string) {
  const digits = getNationalPhoneDigits(value);
  return digits ? `+63 ${[digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)].filter(Boolean).join(" ")}` : "";
}

export default function AdviserProfile({ currentAccount }: AdviserProfileProps) {
  const activeAccount = currentAccount();
  const initialStorageKey = `internsync-adviser-profile:${(activeAccount.email || "adviser@qcu.edu.ph").toLowerCase()}`;
  const [profileKey, setProfileKey] = useState(initialStorageKey);
  const [colleges, setColleges] = useState<College[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [saved, setSaved] = useState(() => readSavedProfile(initialStorageKey));
  const [draft, setDraft] = useState(() => makeDraft(saved, activeAccount));
  const [editing, setEditing] = useState(() => !saved.collegeId || !saved.programId);
  const [signatureError, setSignatureError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadColleges() {
      try {
        const response = await fetch("/api/catalog/colleges", { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load the college and program catalog.");
        if (!Array.isArray(data.colleges)) throw new Error("The college and program catalog returned invalid data.");
        const validColleges = (data.colleges as College[]).filter((college) =>
          typeof college.id === "string"
          && typeof college.name === "string"
          && Array.isArray(college.programs)
          && college.programs.every((program) => typeof program.id === "string" && typeof program.name === "string"),
        );
        setColleges(validColleges);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Could not load adviser profile college and program options.", error);
        setCatalogError(error instanceof Error ? error.message : "Could not load the college and program catalog.");
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }

    void loadColleges();
    return () => controller.abort();
  }, []);

  const fullName = getFullName(draft);
  const selectedCollege = colleges.find((college) => college.id === draft.collegeId);
  const selectedProgram = selectedCollege?.programs.find((program) => program.id === draft.programId);

  function cancelEditing() {
    setDraft(makeDraft(saved, activeAccount));
    setEditing(false);
  }

  function persistProfile(nextDraft: AdviserProfileDraft) {
    return { ...nextDraft, name: getFullName(nextDraft) };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCollege || !selectedProgram) return;

    const next = persistProfile(draft);
    const nextProfileKey = `internsync-adviser-profile:${draft.email.toLowerCase()}`;
    localStorage.setItem(nextProfileKey, JSON.stringify(next));
    if (profileKey !== nextProfileKey) localStorage.removeItem(profileKey);
    setProfileKey(nextProfileKey);
    setSaved(next);
    setEditing(false);

    const initials = fullName.split(/\s+/).map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
    try {
      const session = JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
      if (session?.role === "adviser") {
        session.name = fullName;
        session.email = draft.email;
        session.initials = initials;
        sessionStorage.setItem("internsync-auth-session", JSON.stringify(session));
      }
    } catch (error) {
      console.error("Could not update the adviser session after saving the profile.", error);
    }
    const topbarName = document.getElementById("topbar-name");
    if (topbarName) topbarName.textContent = fullName;
    window.dispatchEvent(new CustomEvent("internsync-profile-avatar-updated", { detail: { initials } }));
    window.dispatchEvent(new CustomEvent("internsync-adviser-profile-updated"));
  }

  async function handleSignatureUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type.toLowerCase())) {
      setSignatureError("Upload your signature as a PNG or JPEG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSignatureError("Choose an image that is 5 MB or smaller.");
      return;
    }

    try {
      const signatureImage = await readImage(file);
      const nextDraft = { ...draft, signatureImage };
      const next = persistProfile(nextDraft);
      localStorage.setItem(profileKey, JSON.stringify(next));
      setDraft(nextDraft);
      setSaved(next);
      setSignatureError("");
    } catch (error) {
      console.error("Could not save the adviser signature.", error);
      setSignatureError(error instanceof Error ? error.message : "The signature could not be uploaded.");
    }
  }

  if (editing) {
    return (
      <div className="student-profile adviser-profile grid gap-3 text-[#202a43]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelEditing} className="grid size-8 place-items-center rounded-md text-[#173c70] hover:bg-[#eef3fb]" aria-label="Back to profile">
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#173c70]">Edit Profile</h2>
              <p className="text-[10px] text-[#788098]">OJT Adviser</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelEditing} className="rounded-md border border-[#dfe5ef] bg-white px-3 py-2 text-xs font-semibold text-[#4c5870] hover:bg-[#f7f8fc]">Cancel</button>
            <button type="submit" form="adviser-profile-form" disabled={catalogLoading || Boolean(catalogError) || !selectedCollege || !selectedProgram} className="inline-flex items-center gap-1.5 rounded-md bg-[#11177f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202990] disabled:cursor-not-allowed disabled:opacity-50">
              <Save size={13} aria-hidden="true" /> Save Changes
            </button>
          </div>
        </header>

        <form id="adviser-profile-form" className="grid gap-3" onSubmit={handleSubmit}>
          <ProfileBanner fullName={fullName} initials={activeAccount.initials || "JD"} />
          <ProfileSection title="Personal Information">
            <div className="grid gap-2 sm:grid-cols-2">
              <EditTextField label="Last Name" value={draft.lastName} onChange={(lastName) => setDraft({ ...draft, lastName })} required />
              <EditTextField label="First Name" value={draft.firstName} onChange={(firstName) => setDraft({ ...draft, firstName })} required />
              <EditTextField label="Middle Name" value={draft.middleName} onChange={(middleName) => setDraft({ ...draft, middleName })} className="sm:col-span-2" />
              <ProfileSelect
                label="College/Department"
                value={draft.collegeId}
                disabled={catalogLoading || Boolean(catalogError)}
                placeholder={catalogLoading ? "Loading College/Department…" : "Select College/Department"}
                options={colleges.map((college) => ({ value: college.id, label: college.name }))}
                onChange={(collegeId) => setDraft({ ...draft, collegeId, programId: "" })}
              />
              <ProfileSelect
                label="Program"
                value={draft.programId}
                disabled={!selectedCollege || catalogLoading || Boolean(catalogError)}
                placeholder={selectedCollege ? "Select Program" : "Select a college first"}
                options={(selectedCollege?.programs || []).map((program) => ({
                  value: program.id,
                  label: formatProgramLabel(program),
                }))}
                onChange={(programId) => setDraft({ ...draft, programId })}
              />
            </div>
            <div className="mt-4 grid gap-2 border-t border-[#e9edf4] pt-3 md:grid-cols-2">
              <EditTextField label="Email Address" value={draft.email} onChange={(email) => setDraft({ ...draft, email })} type="email" required />
              <ContactNumberField
                value={draft.phone}
                onChange={(phone) => setDraft({ ...draft, phone })}
              />
            </div>
            {catalogError && <p className="mt-2 text-xs text-[#b42335]" role="alert">{catalogError}</p>}
          </ProfileSection>
        </form>
      </div>
    );
  }

  return (
    <div className="student-profile adviser-profile grid w-full gap-3 text-[#202a43]">
      <ProfileBanner fullName={fullName} initials={activeAccount.initials || "JD"} />
      <ProfileSection
        title="Personal Information"
        action={<button type="button" onClick={() => setEditing(true)} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Edit personal information" title="Edit personal information"><Pencil size={16} aria-hidden="true" /></button>}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileValue label="Full Name" value={fullName} />
          <ProfileValue label="College/Department" value={selectedCollege?.name || ""} />
          <ProfileValue label="Program" value={selectedProgram ? formatProgramLabel(selectedProgram) : ""} />
          <ProfileValue label="Email Address" value={draft.email} />
          <ProfileValue label="Contact Number" value={displayPhilippinePhone(draft.phone)} />
        </dl>
      </ProfileSection>

      <ProfileSection title="E-Signature Profile">
        <div className="mb-4 grid gap-2 text-[11px] leading-relaxed text-[#65718a]">
          <p>By uploading your electronic signature, you consent to its use for verification and approval of internal requisition and administrative forms within <strong className="font-semibold text-[#34425e]">Quezon City University (QCU)</strong>.</p>
          <p>Your signature will be retained for the duration of your appointment or longer where required for audit, record-keeping, or legal compliance. Access is restricted to authorized personnel.</p>
          <p>Under <strong className="font-semibold text-[#34425e]">Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, you may request access to or correction of your personal data and exercise your other rights through QCU.</p>
        </div>
        <div className="flex min-h-[112px] items-center justify-center rounded-lg border-2 border-dashed border-[#cbd6e8] bg-[#f8faff] p-3">
          {draft.signatureImage
            ? <img className="max-h-40 max-w-full object-contain" src={draft.signatureImage} alt="Adviser e-signature" />
            : <div className="grid justify-items-center gap-2 text-[#91a0b7]"><FilePenLine size={30} aria-hidden="true" /><p className="text-sm font-semibold">No E-Signature Uploaded</p></div>}
        </div>
        <label htmlFor="adviser-signature-upload" className="mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e2e8f0] text-sm font-semibold text-[#101828] shadow-[0_6px_16px_rgba(70,92,130,0.16)] hover:bg-[#d9e2ee]">
          <CloudUpload size={16} aria-hidden="true" /> {draft.signatureImage ? "Replace Signature" : "Upload Signature"}
        </label>
        <input id="adviser-signature-upload" className="sr-only" type="file" accept="image/png,image/jpeg" aria-describedby="adviser-signature-hint" onChange={(event) => void handleSignatureUpload(event)} />
        <p id="adviser-signature-hint" className="mt-2 text-center text-xs text-[#65718a]">Upload one signature image in PNG or JPEG format (up to 5 MB). Uploading again replaces it.</p>
        {signatureError && <p className="mt-2 rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{signatureError}</p>}
      </ProfileSection>
    </div>
  );
}

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The selected signature image could not be read."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("The selected signature image could not be read."));
    reader.readAsDataURL(file);
  });
}

function ProfileBanner({ fullName, initials }: { fullName: string; initials: string }) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[#dfe5ef] bg-white shadow-[0_1px_3px_rgba(20,35,75,0.04)]">
      <div className="h-[88px] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(7,19,64,.78), rgba(17,23,127,.55)), url('/QCU_Background.jpg')" }} />
      <div className="flex flex-col items-center px-4 pb-3 text-center">
        <div className="-mt-8 grid size-16 place-items-center rounded-full border-4 border-white bg-[#30398e] text-sm font-bold text-white shadow-sm">
          {initials || <UserRound size={25} aria-hidden="true" />}
        </div>
        <h2 className="mt-2 text-sm font-bold text-[#1d2438]">{fullName}</h2>
      </div>
    </section>
  );
}

function ProfileSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#dfe5ef] bg-white p-4 shadow-[0_1px_3px_rgba(20,35,75,0.04)] sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3 border-b border-[#e9edf4] pb-2">
        <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-[#173c70]">
          <FileText size={14} aria-hidden="true" />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[11px] font-medium text-[#748098]">{label}</dt>
      <dd className="break-words text-sm text-[#202a43]">{value || "Not provided"}</dd>
    </div>
  );
}

function EditTextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-[11px] font-medium ${className}`}>
      {label} {required && <span className="text-red-500">*</span>}
      <input
        className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
      />
    </label>
  );
}

function ContactNumberField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-[11px] font-medium">
      Contact Number <span className="text-red-500">*</span>
      <span className="flex h-8 items-center gap-2 rounded border border-[#d8dfeb] px-2 focus-within:border-[#8398c4]">
        <span className="border-r border-[#d8dfeb] pr-2 text-xs text-[#65718a]">+63</span>
        <input
          className="min-w-0 flex-1 text-xs font-normal outline-none"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="9XXXXXXXXX"
          value={getNationalPhoneDigits(value)}
          onChange={(event) => onChange(formatPhilippinePhone(event.target.value))}
          pattern="[0-9]{10}"
          maxLength={12}
          required
        />
      </span>
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  disabled,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-[11px] font-medium">
      {label} <span className="text-red-500">*</span>
      <select className="h-8 rounded border border-[#d8dfeb] bg-white px-2 text-xs font-normal outline-none focus:border-[#8398c4] disabled:bg-[#f1f3f6] disabled:text-[#8b95a7]" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} required>
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
