import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  CloudUpload,
  Download,
  FilePenLine,
  FileText,
  Mail,
  ExternalLink,
  Pencil,
  Phone,
  Plus,
  Save,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "../../lib/toast";

type ProfileData = {
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  studentNumber: string;
  college: string;
  program: string;
  yearLevel: string;
  email: string;
  phone: string;
  address: string;
  streetAddress: string;
  barangay: string;
  city: string;
  postalCode: string;
  partnerCompany: string;
  ojtPeriod: string;
  profilePhoto: string;
  signatureImage: string;
  licenses: LicenseItem[];
  skills: string[];
};

type LicenseItem = {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
  description: string;
  skills: string[];
};

type StudentProfileProps = {
  account: {
    name?: string;
    email?: string;
    studentNumber?: string;
    collegeName?: string;
    programName?: string;
    yearLevel?: string;
    accessToken?: string;
    partnerCompany?: string;
    ojtPeriod?: string;
  };
};

type CollegeOption = {
  id: string;
  name: string;
  ojtYearLevel: "THIRD" | "FOURTH";
  programs: { id: string; name: string }[];
};

type LocationOption = {
  id: string;
  name: string;
  barangays: { id: string; name: string }[];
};

const PHOTO_CROP_SIZE = 280;
const PHOTO_OUTPUT_SIZE = 512;

function splitStudentName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || "", middleName: "", lastName: "" };
  return {
    firstName: parts[0],
    middleName: parts.slice(1, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function formatStudentName(firstName: string, middleName: string, lastName: string) {
  const middleInitial = middleName.trim().replace(/\.$/, "").charAt(0).toLocaleUpperCase();
  return [firstName.trim(), middleInitial ? `${middleInitial}.` : "", lastName.trim()].filter(Boolean).join(" ");
}

function formatAddress(profile: Pick<ProfileData, "streetAddress" | "barangay" | "city" | "postalCode">) {
  return [profile.streetAddress, profile.barangay, profile.city, profile.postalCode]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

function normalizeLocationName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function getYearLevel(ojtYearLevel: CollegeOption["ojtYearLevel"]) {
  return ojtYearLevel === "THIRD" ? "3rd Year" : "4th Year";
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

function createEmptyLicense(): LicenseItem {
  return { id: "", name: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "", description: "", skills: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLicenses(value: unknown): LicenseItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry, index) => {
    const item = isRecord(entry) ? entry : {};
    return {
      id: typeof item.id === "string" ? item.id : `legacy-${index}`,
      name: typeof item.name === "string" ? item.name : "",
      issuer: typeof item.issuer === "string" ? item.issuer : "",
      issueDate: typeof item.issueDate === "string" ? item.issueDate : "",
      expiryDate: typeof item.expiryDate === "string" ? item.expiryDate : "",
      credentialId: typeof item.credentialId === "string" ? item.credentialId : "",
      credentialUrl: typeof item.credentialUrl === "string" ? item.credentialUrl : "",
      description: typeof item.description === "string" ? item.description : "",
      skills: Array.isArray(item.skills) ? item.skills.filter((skill): skill is string => typeof skill === "string") : [],
    };
  });
}

function formatIssueDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}-01T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

function getLicenseDateParts(value: string) {
  const [year = "", month = ""] = value.split("-");
  return { year, month };
}

function profileStorageKey(account: StudentProfileProps["account"]) {
  return `internsync-student-profile:${account.email?.toLowerCase() || "default"}`;
}

function createDefaultProfile(account: StudentProfileProps["account"]): ProfileData {
  const isRegisteredStudent = Boolean(account.studentNumber);
  const nameParts = splitStudentName(account.name || "Janna Perez");
  const streetAddress = isRegisteredStudent ? "" : "#46 Carnation St.";
  const city = isRegisteredStudent ? "" : "Quezon City";
  const addressFields = { streetAddress, barangay: "", city, postalCode: "" };
  return {
    fullName: formatStudentName(nameParts.firstName, nameParts.middleName, nameParts.lastName),
    ...nameParts,
    studentNumber: account.studentNumber || "23-2645",
    college: account.collegeName || "College of Computer Studies",
    program: account.programName || "Bachelor of Science in Information Technology",
    yearLevel: account.yearLevel || "4th Year",
    email: account.email || "j.delacruz@qcu.edu.ph",
    phone: isRegisteredStudent ? "" : "+63 999 234 5678",
    ...addressFields,
    address: formatAddress(addressFields),
    partnerCompany: isRegisteredStudent ? account.partnerCompany || "" : account.partnerCompany ?? "ABC TechSolutions Inc.",
    ojtPeriod: isRegisteredStudent ? account.ojtPeriod || "" : account.ojtPeriod ?? "September 2026 - November 2026",
    profilePhoto: "",
    signatureImage: "",
    licenses: [],
    skills: [],
  };
}

function loadProfile(account: StudentProfileProps["account"]): ProfileData {
  const defaults = createDefaultProfile(account);
  const storedProfile = localStorage.getItem(profileStorageKey(account));
  if (!storedProfile) return defaults;

  try {
    const saved = JSON.parse(storedProfile);
    const savedNameParts = saved.firstName && saved.lastName
      ? { firstName: saved.firstName, middleName: saved.middleName || "", lastName: saved.lastName }
      : splitStudentName(saved.fullName || defaults.fullName);
    const savedAddress = saved.streetAddress !== undefined
      ? saved.streetAddress
      : saved.address || defaults.streetAddress;
    const addressFields = {
      streetAddress: savedAddress,
      barangay: saved.barangay || "",
      city: saved.city || "",
      postalCode: saved.postalCode || "",
    };
    return {
      ...defaults,
      ...saved,
      ...savedNameParts,
      fullName: account.name || formatStudentName(savedNameParts.firstName, savedNameParts.middleName, savedNameParts.lastName),
      studentNumber: account.studentNumber || saved.studentNumber || defaults.studentNumber,
      college: account.collegeName || saved.college || defaults.college,
      program: account.programName || saved.program || defaults.program,
      yearLevel: account.yearLevel || saved.yearLevel || defaults.yearLevel,
      email: account.email || saved.email || defaults.email,
      licenses: normalizeLicenses(saved.licenses),
      skills: Array.isArray(saved.skills) ? saved.skills : defaults.skills,
      ...addressFields,
      address: formatAddress(addressFields),
    };
  } catch (error) {
    console.error("Could not read the saved student profile.", error);
    return defaults;
  }
}

function readImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new Error("Choose an image file."));
  }
  if (file.size > 5 * 1024 * 1024) {
    return Promise.reject(new Error("Choose an image that is 5 MB or smaller."));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("The selected image could not be read."));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}

function countInkComponents(mask: Uint8Array, width: number, height: number) {
  const visited = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let components = 0;

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    components += 1;
    if (components > 35) return components;

    let head = 0;
    let tail = 0;
    queue[tail] = start;
    tail += 1;
    visited[start] = 1;

    while (head < tail) {
      const current = queue[head];
      head += 1;
      const x = current % width;
      const y = Math.floor(current / width);
      for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
        for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
          if (offsetX === 0 && offsetY === 0) continue;
          const neighborX = x + offsetX;
          const neighborY = y + offsetY;
          if (neighborX < 0 || neighborY < 0 || neighborX >= width || neighborY >= height) continue;
          const neighbor = neighborY * width + neighborX;
          if (!mask[neighbor] || visited[neighbor]) continue;
          visited[neighbor] = 1;
          queue[tail] = neighbor;
          tail += 1;
        }
      }
    }
  }
  return components;
}

function colorDistance(red: number, green: number, blue: number, background: [number, number, number]) {
  const redDifference = red - background[0];
  const greenDifference = green - background[1];
  const blueDifference = blue - background[2];
  return Math.sqrt(redDifference ** 2 + greenDifference ** 2 + blueDifference ** 2);
}

function getBackgroundColor(pixels: Uint8ClampedArray, width: number, height: number) {
  const samples: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(Math.max(width, height) / 256));
  const addSample = (x: number, y: number) => {
    const index = (y * width + x) * 4;
    if (pixels[index + 3] < 128) return;
    samples.push([pixels[index], pixels[index + 1], pixels[index + 2]]);
  };

  for (let x = 0; x < width; x += step) {
    addSample(x, 0);
    addSample(x, height - 1);
  }
  for (let y = 0; y < height; y += step) {
    addSample(0, y);
    addSample(width - 1, y);
  }

  if (samples.length === 0) return { color: [255, 255, 255] as [number, number, number], uniformity: 0 };
  const channels = [0, 1, 2].map((channel) => samples.map((sample) => sample[channel]).sort((a, b) => a - b));
  const background = channels.map((channel) => channel[Math.floor(channel.length / 2)]) as [number, number, number];
  const uniformSamples = samples.filter((sample) => colorDistance(sample[0], sample[1], sample[2], background) <= 35).length;
  return { color: background, uniformity: uniformSamples / samples.length };
}

function looksLikeSignature(imageUrl: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 128 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("The signature image could not be checked."));
        return;
      }

      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      const pixels = context.getImageData(0, 0, width, height).data;
      const { color: background, uniformity } = getBackgroundColor(pixels, width, height);
      const inkMask = new Uint8Array(width * height);
      let backgroundPixels = 0;
      let inkPixels = 0;

      for (let index = 0; index < inkMask.length; index += 1) {
        const red = pixels[index * 4];
        const green = pixels[index * 4 + 1];
        const blue = pixels[index * 4 + 2];
        const distance = colorDistance(red, green, blue, background);
        if (distance <= 35) backgroundPixels += 1;
        if (distance > 45) {
          inkMask[index] = 1;
          inkPixels += 1;
        }
      }

      const pixelCount = inkMask.length;
      const backgroundRatio = backgroundPixels / pixelCount;
      const inkRatio = inkPixels / pixelCount;
      const inkComponents = countInkComponents(inkMask, width, height);
      resolve(uniformity >= 0.7 && backgroundRatio >= 0.7 && inkRatio >= 0.001 && inkRatio <= 0.18 && inkComponents <= 35);
    };
    image.onerror = () => reject(new Error("The signature image could not be checked."));
    image.src = imageUrl;
  });
}

function removeSignatureBackground(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error("The signature background could not be removed."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const { data } = imageData;
      let transparentPixels = 0;
      for (let index = 3; index < data.length; index += 4) {
        if (data[index] < 16) transparentPixels += 1;
      }
      if (transparentPixels / (width * height) > 0.02) {
        resolve(imageUrl);
        return;
      }

      const { color: background } = getBackgroundColor(data, width, height);
      const histogram = new Uint32Array(442);
      let inkPixels = 0;
      for (let index = 0; index < width * height; index += 1) {
        const pixelIndex = index * 4;
        if (data[pixelIndex + 3] < 16) continue;
        const distance = Math.min(441, Math.round(colorDistance(data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2], background)));
        if (distance <= 22) continue;
        histogram[distance] += 1;
        inkPixels += 1;
      }

      let maxContrast = 0;
      let accumulatedInk = 0;
      for (let distance = 23; distance < histogram.length; distance += 1) {
        accumulatedInk += histogram[distance];
        if (accumulatedInk >= inkPixels * 0.9) {
          maxContrast = distance;
          break;
        }
      }
      if (maxContrast <= 22) {
        reject(new Error("The signature background could not be removed."));
        return;
      }

      for (let index = 0; index < width * height; index += 1) {
        const pixelIndex = index * 4;
        const sourceAlpha = data[pixelIndex + 3] / 255;
        if (sourceAlpha === 0) continue;
        const red = data[pixelIndex];
        const green = data[pixelIndex + 1];
        const blue = data[pixelIndex + 2];
        const distance = colorDistance(red, green, blue, background);
        if (distance <= 22) {
          data[pixelIndex + 3] = 0;
          continue;
        }

        const opacity = Math.min(1, distance / maxContrast);
        if (opacity < 0.04) {
          data[pixelIndex + 3] = 0;
          continue;
        }
        data[pixelIndex] = Math.max(0, Math.min(255, Math.round((red - background[0] * (1 - opacity)) / opacity)));
        data[pixelIndex + 1] = Math.max(0, Math.min(255, Math.round((green - background[1] * (1 - opacity)) / opacity)));
        data[pixelIndex + 2] = Math.max(0, Math.min(255, Math.round((blue - background[2] * (1 - opacity)) / opacity)));
        data[pixelIndex + 3] = Math.round(sourceAlpha * opacity * 255);
      }

      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("The signature background could not be removed."));
    image.src = imageUrl;
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function ProfileValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <dt className="text-[11px] font-medium text-[#748098]">{label}</dt>
      <dd className="break-words text-sm text-[#202a43]">{value || "Not provided"}</dd>
    </div>
  );
}

function ProfileSection({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-[#dfe5ef] bg-white p-4 shadow-[0_1px_3px_rgba(20,35,75,0.04)]">
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

function SignatureConsent() {
  return (
    <div className="grid gap-2 text-[11px] leading-relaxed text-[#65718a]">
      <p>By clicking "Submit," you consent to the collection, processing, and storage of your electronic signature and related personal data for the verification and approval of internal requisition and administrative forms within <strong className="font-semibold text-[#34425e]">Quezon City University (QCU)</strong>.</p>
      <p>Your data will be retained for the duration of your <strong className="font-semibold text-[#34425e]">enrollment</strong> with the University or longer where required for audit, record-keeping, or compliance with applicable laws and regulatory bodies and will be securely disposed of thereafter in accordance with QCU’s Data Retention Policy. Access to your data is restricted strictly to authorized personnel.</p>
      <p>Under <strong className="font-semibold text-[#34425e]">Republic Act No. 10173 (Data Privacy Act of 2012)</strong>, you have the right to be informed, access, rectify, or object to the processing of your personal data, withdraw your consent, and file a complaint with the <strong className="font-semibold text-[#34425e]">National Privacy Commission (NPC)</strong>.</p>
    </div>
  );
}

type StudentProfileResponse = {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  studentNumber: string;
  collegeName: string;
  programName: string;
  yearLevel: string;
  phone: string;
  streetAddress: string;
  barangay: string;
  city: string;
  postalCode: string;
  partnerCompany: string;
  ojtPeriod: string;
  licenses: unknown;
  skills: string[];
};

function mergeStudentProfile(current: ProfileData, saved: StudentProfileResponse): ProfileData {
  const addressFields = {
    streetAddress: saved.streetAddress || "",
    barangay: saved.barangay || "",
    city: saved.city || "",
    postalCode: saved.postalCode || "",
  };
  return {
    ...current,
    fullName: formatStudentName(saved.firstName, saved.middleName, saved.lastName),
    firstName: saved.firstName,
    middleName: saved.middleName || "",
    lastName: saved.lastName,
    email: saved.email,
    studentNumber: saved.studentNumber,
    college: saved.collegeName,
    program: saved.programName,
    yearLevel: saved.yearLevel,
    phone: saved.phone || "",
    licenses: normalizeLicenses(saved.licenses),
    skills: saved.skills || [],
    ...addressFields,
    address: formatAddress(addressFields),
    partnerCompany: saved.partnerCompany || "",
    ojtPeriod: saved.ojtPeriod || "",
  };
}

export default function StudentProfile({ account }: StudentProfileProps) {
  const [profile, setProfile] = useState(() => loadProfile(account));
  const [draft, setDraft] = useState(profile);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [licenseFormOpen, setLicenseFormOpen] = useState(false);
  const [licenseFormDraft, setLicenseFormDraft] = useState(createEmptyLicense);
  const [licenseFormIndex, setLicenseFormIndex] = useState<number | null>(null);
  const [licenseManagerOpen, setLicenseManagerOpen] = useState(false);
  const [skillsManagerOpen, setSkillsManagerOpen] = useState(false);
  const [skillEntry, setSkillEntry] = useState("");
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [colleges, setColleges] = useState<CollegeOption[]>([]);
  const [locationCatalog, setLocationCatalog] = useState<LocationOption[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [locationCatalogError, setLocationCatalogError] = useState("");
  const [photoCropSource, setPhotoCropSource] = useState("");
  const [photoCropZoom, setPhotoCropZoom] = useState(1);
  const [photoCropOffset, setPhotoCropOffset] = useState({ x: 0, y: 0 });
  const [photoCropReady, setPhotoCropReady] = useState(false);
  const cropImage = useRef<HTMLImageElement>(null);
  const cropViewport = useRef<HTMLDivElement>(null);
  const cropDrag = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const selectedCollege = colleges.find((college) => college.name === draft.college);
  const selectedCity = locationCatalog.find((city) => normalizeLocationName(city.name) === normalizeLocationName(draft.city));
  const cityOptions = locationCatalog.some((city) => normalizeLocationName(city.name) === normalizeLocationName(draft.city))
    || !draft.city
    ? locationCatalog
    : [...locationCatalog, { id: "", name: draft.city, barangays: [] }];
  const barangayOptions = selectedCity?.barangays || [];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog/colleges", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.colleges)) {
          throw new Error(data.error || "The college and program catalog could not be loaded.");
        }
        setColleges(data.colleges as CollegeOption[]);
        setCatalogError("");
      })
      .catch((catalogLoadError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load the college and program catalog.", catalogLoadError);
        setCatalogError(catalogLoadError instanceof Error ? catalogLoadError.message : "The college and program catalog could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog/locations", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.cities)) {
          throw new Error(data.error || "The city and barangay options could not be loaded.");
        }
        setLocationCatalog(data.cities as LocationOption[]);
        setLocationCatalogError("");
      })
      .catch((catalogLoadError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load the city and barangay catalog.", catalogLoadError);
        setLocationCatalogError(catalogLoadError instanceof Error ? catalogLoadError.message : "The city and barangay options could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!account.accessToken) return undefined;
    const controller = new AbortController();
    fetch("/api/students/profile", {
      headers: { Authorization: `Bearer ${account.accessToken}` },
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Student profile could not be loaded.");
        const savedProfile = data as StudentProfileResponse;
        const updated = mergeStudentProfile(profile, savedProfile);
        localStorage.setItem(profileStorageKey(account), JSON.stringify(updated));
        setProfile(updated);
        setDraft(updated);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Could not load the student profile from the database.", loadError);
        setError(loadError instanceof Error ? loadError.message : "Student profile could not be loaded.");
      });
    return () => controller.abort();
  }, [account.accessToken, account.email]);

  function startEditing() {
    setDraft(profile);
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setError("");
    setEditing(false);
  }

  function openLicenseManager(addNew = false) {
    setDraft(profile);
    setError("");
    setLicenseManagerOpen(true);
    setLicenseFormOpen(addNew);
    setLicenseFormIndex(null);
    setLicenseFormDraft(createEmptyLicense());
    setSkillEntry("");
  }

  function cancelLicenseManager() {
    setDraft(profile);
    setLicenseManagerOpen(false);
    setLicenseFormOpen(false);
    setError("");
  }

  function openLicenseForm(index?: number) {
    const license = index === undefined ? null : draft.licenses[index];
    setLicenseFormIndex(index ?? null);
    setLicenseFormDraft(license ? { ...license, skills: [...license.skills] } : createEmptyLicense());
    setLicenseFormOpen(true);
    setSkillEntry("");
    setError("");
  }

  function openSkillsManager(skillToEdit?: string) {
    setDraft(profile);
    setEditingSkill(skillToEdit || null);
    setSkillEntry(skillToEdit || "");
    setError("");
    setSkillsManagerOpen(true);
  }

  function cancelSkillsManager() {
    setDraft(profile);
    setSkillsManagerOpen(false);
    setEditingSkill(null);
    setSkillEntry("");
    setError("");
  }

  function updateDraft<Field extends keyof ProfileData>(field: Field, value: ProfileData[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateCollege(value: string) {
    const nextCollege = colleges.find((college) => college.name === value);
    setDraft((current) => ({
      ...current,
      college: value,
      program: value === current.college ? current.program : "",
      yearLevel: nextCollege ? getYearLevel(nextCollege.ojtYearLevel) : current.yearLevel,
    }));
  }

  function updateName(field: "firstName" | "middleName" | "lastName", value: string) {
    setDraft((current) => {
      const updated = { ...current, [field]: value };
      updated.fullName = formatStudentName(updated.firstName, updated.middleName, updated.lastName);
      return updated;
    });
  }

  function updateAddress(field: "streetAddress" | "barangay" | "city" | "postalCode", value: string) {
    setDraft((current) => {
      const updated = { ...current, [field]: value };
      updated.address = formatAddress(updated);
      return updated;
    });
  }

  function updateCity(value: string) {
    setDraft((current) => {
      const keepBarangay = normalizeLocationName(current.city) === normalizeLocationName(value);
      const updated = { ...current, city: value, barangay: keepBarangay ? current.barangay : "" };
      updated.address = formatAddress(updated);
      return updated;
    });
  }

  function rememberSavedLocation(cityName: string, barangayName: string) {
    setLocationCatalog((current) => {
      const normalizedCity = normalizeLocationName(cityName);
      const normalizedBarangay = normalizeLocationName(barangayName);
      const city = current.find((item) => normalizeLocationName(item.name) === normalizedCity);
      if (!city) {
        return [...current, { id: "", name: cityName, barangays: [{ id: "", name: barangayName }] }]
          .sort((left, right) => left.name.localeCompare(right.name));
      }
      if (city.barangays.some((barangay) => normalizeLocationName(barangay.name) === normalizedBarangay)) return current;
      return current.map((item) => item === city
        ? { ...item, barangays: [...item.barangays, { id: "", name: barangayName }].sort((left, right) => left.name.localeCompare(right.name)) }
        : item);
    });
  }

  function removeLicense(index: number) {
    setDraft((current) => ({ ...current, licenses: current.licenses.filter((_, itemIndex) => itemIndex !== index) }));
  }

  function saveLicenseForm() {
    const name = licenseFormDraft.name.trim();
    const issuer = licenseFormDraft.issuer.trim();
    if (!name || !issuer) {
      setError("Enter the certification name and issuing organization.");
      return;
    }
    if (licenseFormDraft.skills.length === 0) {
      setError("Associate at least one skill with this license or certification.");
      return;
    }
    if (licenseFormDraft.issueDate && licenseFormDraft.expiryDate && licenseFormDraft.expiryDate < licenseFormDraft.issueDate) {
      setError("The expiration date must be after the issue date.");
      return;
    }
    if (licenseFormDraft.credentialUrl) {
      try {
        const credentialUrl = new URL(licenseFormDraft.credentialUrl);
        if (credentialUrl.protocol !== "https:" && credentialUrl.protocol !== "http:") throw new Error();
      } catch {
        setError("Enter a valid HTTP or HTTPS credential URL.");
        return;
      }
    }
    const license = {
      ...licenseFormDraft,
      id: licenseFormDraft.id || crypto.randomUUID(),
      name,
      issuer,
      credentialId: licenseFormDraft.credentialId.trim(),
      credentialUrl: licenseFormDraft.credentialUrl.trim(),
      description: licenseFormDraft.description.trim(),
      skills: [...new Set(licenseFormDraft.skills.map((skill) => skill.trim()).filter(Boolean))],
    };
    setDraft((current) => ({
      ...current,
      licenses: licenseFormIndex === null
        ? [...current.licenses, license]
        : current.licenses.map((item, index) => index === licenseFormIndex ? license : item),
      skills: [...new Set([...current.skills, ...license.skills])],
    }));
    setLicenseFormDraft(createEmptyLicense());
    setLicenseFormOpen(false);
    setLicenseFormIndex(null);
    setError("");
  }

  function addSkill() {
    const skill = skillEntry.trim();
    if (!skill) return;
    if (draft.skills.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) {
      setError("That skill is already listed.");
      return;
    }
    setDraft((current) => ({ ...current, skills: [...current.skills, skill] }));
    setSkillEntry("");
    setError("");
  }

  function updateSkill(skillToUpdate: string) {
    const updatedSkill = skillEntry.trim();
    if (!updatedSkill) {
      setError("Enter a skill name.");
      return;
    }
    if (draft.skills.some((skill) => skill !== skillToUpdate && skill.toLocaleLowerCase() === updatedSkill.toLocaleLowerCase())) {
      setError("That skill is already listed.");
      return;
    }
    setDraft((current) => ({
      ...current,
      skills: current.skills.map((skill) => skill === skillToUpdate ? updatedSkill : skill),
      licenses: current.licenses.map((license) => ({
        ...license,
        skills: license.skills.map((skill) => skill === skillToUpdate ? updatedSkill : skill),
      })),
    }));
    setEditingSkill(null);
    setSkillEntry("");
    setError("");
  }

  function removeSkill(skillToRemove: string) {
    setDraft((current) => ({
      ...current,
      skills: current.skills.filter((skill) => skill !== skillToRemove),
      licenses: current.licenses.map((license) => ({
        ...license,
        skills: license.skills.filter((skill) => skill !== skillToRemove),
      })),
    }));
  }

  function updateLicenseDate(field: "issueDate" | "expiryDate", part: "month" | "year", value: string) {
    setLicenseFormDraft((current) => {
      const [year = "", month = ""] = current[field].split("-");
      const nextMonth = part === "month" ? value : month;
      const nextYear = part === "year" ? value : year;
      return {
        ...current,
        [field]: nextMonth && nextYear ? `${nextYear}-${nextMonth.padStart(2, "0")}` : "",
      };
    });
  }

  function toggleLicenseSkill(skill: string) {
    setLicenseFormDraft((current) => ({
      ...current,
      skills: current.skills.includes(skill)
        ? current.skills.filter((item) => item !== skill)
        : [...current.skills, skill],
    }));
  }

  function addLicenseSkill() {
    const skill = skillEntry.trim();
    if (!skill) return;
    if (licenseFormDraft.skills.some((item) => item.toLocaleLowerCase() === skill.toLocaleLowerCase())) {
      setError("That skill is already associated with this certificate.");
      return;
    }
    setLicenseFormDraft((current) => ({ ...current, skills: [...current.skills, skill] }));
    setSkillEntry("");
    setError("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      let savedProfile: ProfileData = {
        ...draft,
        firstName: draft.firstName.trim(),
        middleName: draft.middleName.trim(),
        lastName: draft.lastName.trim(),
        fullName: formatStudentName(draft.firstName, draft.middleName, draft.lastName),
        phone: formatPhilippinePhone(draft.phone),
        address: formatAddress(draft),
      };
      if (account.accessToken) {
        const response = await fetch("/api/students/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${account.accessToken}`,
          },
          body: JSON.stringify({
            firstName: savedProfile.firstName,
            middleName: savedProfile.middleName,
            lastName: savedProfile.lastName,
            email: savedProfile.email,
            studentNumber: savedProfile.studentNumber,
            collegeName: savedProfile.college,
            programName: savedProfile.program,
            phone: savedProfile.phone,
            streetAddress: savedProfile.streetAddress,
            barangay: savedProfile.barangay,
            city: savedProfile.city,
            postalCode: savedProfile.postalCode,
            licenses: savedProfile.licenses,
            skills: savedProfile.skills,
            partnerCompany: savedProfile.partnerCompany,
            ojtPeriod: savedProfile.ojtPeriod,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Your profile could not be saved.");
        savedProfile = mergeStudentProfile(savedProfile, data as StudentProfileResponse);
        rememberSavedLocation(savedProfile.city, savedProfile.barangay);
      }

      const sessionValue = sessionStorage.getItem("internsync-auth-session");
      const session = sessionValue ? JSON.parse(sessionValue) : null;
      const initials = savedProfile.fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
      if (session?.role === "student") {
        session.name = savedProfile.fullName;
        session.email = savedProfile.email;
        session.initials = initials;
        session.firstName = savedProfile.firstName;
        session.middleName = savedProfile.middleName;
        session.lastName = savedProfile.lastName;
        session.studentNumber = savedProfile.studentNumber;
        session.collegeName = savedProfile.college;
        session.programName = savedProfile.program;
        session.yearLevel = savedProfile.yearLevel;
        sessionStorage.setItem("internsync-auth-session", JSON.stringify(session));
      }
      const savedAccounts = JSON.parse(localStorage.getItem("internsync-accounts") || "[]");
      const updatedAccounts = Array.isArray(savedAccounts) ? savedAccounts.map((savedAccount) => savedAccount.email?.toLowerCase() === account.email?.toLowerCase()
        ? {
          ...savedAccount,
          name: savedProfile.fullName,
          email: savedProfile.email,
          initials,
          studentNumber: savedProfile.studentNumber,
          collegeName: savedProfile.college,
          programName: savedProfile.program,
          yearLevel: savedProfile.yearLevel,
        }
        : savedAccount) : [];
      localStorage.setItem("internsync-accounts", JSON.stringify(updatedAccounts));
      const previousStorageKey = profileStorageKey(account);
      const updatedStorageKey = profileStorageKey({ email: savedProfile.email });
      localStorage.setItem(updatedStorageKey, JSON.stringify(savedProfile));
      if (previousStorageKey !== updatedStorageKey) {
        localStorage.removeItem(previousStorageKey);
      }
      setProfile(savedProfile);
      setDraft(savedProfile);
      setEditing(false);
      setLicenseManagerOpen(false);
      setSkillsManagerOpen(false);
      setLicenseFormOpen(false);
      const topbarName = document.getElementById("topbar-name");
      if (topbarName) topbarName.textContent = savedProfile.fullName;
      const topbarAvatar = document.getElementById("topbar-avatar");
      if (topbarAvatar && !draft.profilePhoto) topbarAvatar.textContent = initials;
      window.dispatchEvent(new CustomEvent("internsync-profile-avatar-updated", {
        detail: { profilePhoto: savedProfile.profilePhoto, initials },
      }));
      window.dispatchEvent(new CustomEvent("internsync-student-profile-updated"));
      setError("");
    } catch (saveError) {
      console.error("Could not save the student profile.", saveError);
      setError(saveError instanceof Error ? saveError.message : "Your profile could not be saved. Please try again.");
    }
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>, field: "profilePhoto" | "signatureImage") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const image = await readImage(file);
      if (field === "profilePhoto") {
        setPhotoCropSource(image);
        setPhotoCropZoom(1);
        setPhotoCropOffset({ x: 0, y: 0 });
        setPhotoCropReady(false);
      } else {
        updateDraft(field, image);
      }
      setError("");
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : "The selected image could not be read.");
    }
  }

  async function handleSignatureUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type.toLowerCase())) {
      setError("Upload your signature as a PNG or JPEG image.");
      return;
    }

    try {
      const sourceImage = await readImage(file);
      if (!await looksLikeSignature(sourceImage)) {
        setError("");
        toast.error("Image rejected: The upload contains too much visual content or does not look like a signature on a simple background. Please upload only your signature.");
        return;
      }
      const signatureImage = await removeSignatureBackground(sourceImage);
      const updatedProfile = { ...profile, signatureImage };
      localStorage.setItem(profileStorageKey(account), JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setError("");
    } catch (uploadError) {
      console.error("Could not save the student signature.", uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "The signature could not be uploaded.");
    }
  }

  function getCropImageScale(zoom: number) {
    const image = cropImage.current;
    if (!image?.naturalWidth || !image.naturalHeight) return 1;
    const cropSize = cropViewport.current?.clientWidth || PHOTO_CROP_SIZE;
    return Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight) * zoom;
  }

  function constrainCropOffset(offset: { x: number; y: number }, zoom = photoCropZoom) {
    const image = cropImage.current;
    if (!image?.naturalWidth || !image.naturalHeight) return offset;
    const scale = getCropImageScale(zoom);
    const cropSize = cropViewport.current?.clientWidth || PHOTO_CROP_SIZE;
    const maxX = Math.max(0, (image.naturalWidth * scale - cropSize) / 2);
    const maxY = Math.max(0, (image.naturalHeight * scale - cropSize) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    };
  }

  function startPhotoCropDrag(event: PointerEvent<HTMLDivElement>) {
    if (!cropViewport.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDrag.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: photoCropOffset.x,
      offsetY: photoCropOffset.y,
    };
  }

  function movePhotoCrop(event: PointerEvent<HTMLDivElement>) {
    const drag = cropDrag.current;
    if (!drag) return;
    setPhotoCropOffset(constrainCropOffset({
      x: drag.offsetX + event.clientX - drag.x,
      y: drag.offsetY + event.clientY - drag.y,
    }));
  }

  function stopPhotoCropDrag() {
    cropDrag.current = null;
  }

  function cancelPhotoCrop() {
    setPhotoCropSource("");
    setPhotoCropReady(false);
    setError("");
  }

  function applyPhotoCrop() {
    const image = cropImage.current;
    if (!image || !photoCropReady) return;
    const scale = getCropImageScale(photoCropZoom);
    const cropSize = cropViewport.current?.clientWidth || PHOTO_CROP_SIZE;
    const displayedWidth = image.naturalWidth * scale;
    const displayedHeight = image.naturalHeight * scale;
    const imageLeft = (cropSize - displayedWidth) / 2 + photoCropOffset.x;
    const imageTop = (cropSize - displayedHeight) / 2 + photoCropOffset.y;
    const sourceX = -imageLeft / scale;
    const sourceY = -imageTop / scale;
    const sourceSize = cropSize / scale;
    const croppedImage = document.createElement("canvas");
    croppedImage.width = PHOTO_OUTPUT_SIZE;
    croppedImage.height = PHOTO_OUTPUT_SIZE;
    const context = croppedImage.getContext("2d");
    if (!context) {
      setError("The image could not be cropped. Please try again.");
      return;
    }

    context.beginPath();
    context.arc(PHOTO_OUTPUT_SIZE / 2, PHOTO_OUTPUT_SIZE / 2, PHOTO_OUTPUT_SIZE / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, PHOTO_OUTPUT_SIZE, PHOTO_OUTPUT_SIZE);
    updateDraft("profilePhoto", croppedImage.toDataURL("image/png"));
    cancelPhotoCrop();
  }

  const cropImageScale = getCropImageScale(photoCropZoom);
  const cropImageWidth = (cropImage.current?.naturalWidth || PHOTO_CROP_SIZE) * cropImageScale;
  const cropImageHeight = (cropImage.current?.naturalHeight || PHOTO_CROP_SIZE) * cropImageScale;

  function generateResume() {
    const entries = [
      ["Student Number", profile.studentNumber],
      ["College", profile.college],
      ["Program", profile.program],
      ["Year Level", profile.yearLevel],
      ["Email", profile.email],
      ["Phone", profile.phone],
      ["Address", profile.address],
      ["OJT Partner", profile.partnerCompany],
      ["OJT Period", profile.ojtPeriod],
    ].filter(([, value]) => value);
    const resumeHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(profile.fullName)} - Resume</title><style>body{font:15px Arial,sans-serif;color:#202a43;margin:48px auto;max-width:760px;padding:0 28px}h1{color:#11177f;margin-bottom:4px}p{color:#65718a;margin-top:0}.section{border-top:2px solid #11177f;margin-top:28px;padding-top:12px}.row{display:grid;grid-template-columns:170px 1fr;gap:12px;padding:7px 0;border-bottom:1px solid #e8ebf2}.label{font-weight:bold;color:#485570}.print{margin-top:24px;padding:10px 16px;background:#11177f;color:white;border:0;border-radius:4px;cursor:pointer}@media print{body{margin:0 auto}.print{display:none}}</style></head><body><h1>${escapeHtml(profile.fullName)}</h1><p>${escapeHtml(profile.email)}</p><section class="section"><h2>Profile</h2>${entries.map(([label, value]) => `<div class="row"><span class="label">${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`).join("")}</section><button class="print" onclick="window.print()">Print or save as PDF</button></body></html>`;
    const fileName = profile.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
    const objectUrl = URL.createObjectURL(new Blob([resumeHtml], { type: "text/html;charset=utf-8" }));
    const downloadLink = document.createElement("a");
    downloadLink.href = objectUrl;
    downloadLink.download = `${fileName}-resume.html`;
    document.body.append(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  const licenseMonths = [
    ["01", "January"], ["02", "February"], ["03", "March"], ["04", "April"],
    ["05", "May"], ["06", "June"], ["07", "July"], ["08", "August"],
    ["09", "September"], ["10", "October"], ["11", "November"], ["12", "December"],
  ];
  const currentYear = new Date().getFullYear();
  const licenseYears = Array.from({ length: 85 }, (_, index) => String(currentYear + 15 - index));

  if (licenseManagerOpen) {
    return (
      <div className="student-profile grid gap-3 text-[#202a43]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelLicenseManager} className="grid size-8 place-items-center rounded-md text-[#173c70] hover:bg-[#eef3fb]" aria-label="Back to profile">
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <h2 className="font-heading text-base font-extrabold text-[#173c70]">Licenses &amp; certifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => openLicenseForm()} className="grid size-9 place-items-center rounded-md border border-[#dfe5ef] bg-white text-[#173c70] hover:bg-[#f7f8fc]" aria-label="Add license or certification" title="Add license or certification">
              <Plus size={19} aria-hidden="true" />
            </button>
            <button type="button" onClick={cancelLicenseManager} className="rounded-md border border-[#dfe5ef] bg-white px-3 py-2 text-xs font-semibold text-[#4c5870] hover:bg-[#f7f8fc]">Cancel</button>
            <button type="submit" form="license-manager-form" className="inline-flex items-center gap-1.5 rounded-md bg-[#11177f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202990]">
              <Save size={13} aria-hidden="true" /> Save Changes
            </button>
          </div>
        </header>

        <form id="license-manager-form" onSubmit={handleSave} className="rounded-lg border border-[#dfe5ef] bg-white px-5 shadow-[0_1px_3px_rgba(20,35,75,0.04)]">
          {draft.licenses.length ? (
            <div className="divide-y divide-[#e9edf4]">
              {draft.licenses.map((license, index) => (
                <article key={license.id} className="flex gap-3 py-5 first:pt-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-md bg-[#0b1d33] text-center text-xs font-bold uppercase text-white" aria-hidden="true">
                    {license.issuer.slice(0, 3) || "LIC"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-semibold text-[#101828]">{license.name}</h3>
                    <p className="mt-0.5 text-xs text-[#34425e]">{license.issuer}</p>
                    {license.issueDate && <p className="mt-1 text-xs text-[#65718a]">Issued {formatIssueDate(license.issueDate)}</p>}
                    {license.expiryDate && <p className="mt-1 text-xs text-[#65718a]">Expires {formatIssueDate(license.expiryDate)}</p>}
                    {license.credentialUrl && (
                      <a className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#cbd3df] px-3 py-1.5 text-xs font-medium text-[#202a43] hover:bg-[#f7f8fc]" href={license.credentialUrl} target="_blank" rel="noreferrer">
                        Show credential <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                    {license.skills.length > 0 && <p className="mt-2 text-xs text-[#34425e]"><strong>Skills:</strong> {license.skills.join(", ")}</p>}
                    {license.description && <p className="mt-2 text-xs text-[#34425e]">{license.description}</p>}
                  </div>
                  <button type="button" onClick={() => openLicenseForm(index)} className="grid size-8 shrink-0 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label={`Edit ${license.name}`} title="Edit license or certification">
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center py-8 text-center">
              <p className="text-sm text-[#748098]">No licenses or certifications added yet.</p>
            </div>
          )}
          {error && <p className="mb-4 rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{error}</p>}
        </form>

        {licenseFormOpen && (
          <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/50 p-3 sm:p-6" role="presentation">
            <section className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#dfe5ef] bg-white text-[#202a43] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="license-editor-title">
              <header className="flex shrink-0 items-center justify-between border-b border-[#e9edf4] px-5 py-4">
                <h2 id="license-editor-title" className="text-base font-semibold text-[#101828]">{licenseFormIndex === null ? "Add license or certification" : "Edit license or certification"}</h2>
                <button type="button" onClick={() => setLicenseFormOpen(false)} className="grid size-8 place-items-center rounded text-[#65718a] hover:bg-[#f1f4f9]" aria-label="Close license editor"><X size={18} aria-hidden="true" /></button>
              </header>
              <div className="grid gap-4 overflow-y-auto px-5 py-4">
                <p className="text-[11px] text-[#65718a]">* Indicates required</p>
                <label className="grid gap-1 text-xs font-medium">Name <span className="text-red-500">*</span>
                  <input autoFocus className="h-10 rounded border border-[#cbd3df] px-3 text-sm font-normal outline-none focus:border-[#8398c4]" value={licenseFormDraft.name} maxLength={200} onChange={(event) => setLicenseFormDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Microsoft certified network associate security" />
                </label>
                <label className="grid gap-1 text-xs font-medium">Issuing organization <span className="text-red-500">*</span>
                  <input className="h-10 rounded border border-[#cbd3df] px-3 text-sm font-normal outline-none focus:border-[#8398c4]" value={licenseFormDraft.issuer} maxLength={200} onChange={(event) => setLicenseFormDraft((current) => ({ ...current, issuer: event.target.value }))} placeholder="Ex: Microsoft" />
                </label>

                {([
                  ["Issue date", "issueDate"],
                  ["Expiration date", "expiryDate"],
                ] as const).map(([label, field]) => {
                  const parts = getLicenseDateParts(licenseFormDraft[field]);
                  return (
                    <fieldset key={field} className="grid gap-2">
                      <legend className="mb-1 text-xs font-medium">{label}</legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-[11px] text-[#65718a]">Month
                          <select className="h-10 rounded border border-[#cbd3df] bg-white px-3 text-sm text-[#202a43] outline-none focus:border-[#8398c4]" value={parts.month} onChange={(event) => updateLicenseDate(field, "month", event.target.value)}>
                            <option value="">Month</option>
                            {licenseMonths.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-1 text-[11px] text-[#65718a]">Year
                          <select className="h-10 rounded border border-[#cbd3df] bg-white px-3 text-sm text-[#202a43] outline-none focus:border-[#8398c4]" value={parts.year} onChange={(event) => updateLicenseDate(field, "year", event.target.value)}>
                            <option value="">Year</option>
                            {licenseYears.map((year) => <option key={year} value={year}>{year}</option>)}
                          </select>
                        </label>
                      </div>
                    </fieldset>
                  );
                })}

                <label className="grid gap-1 text-xs font-medium">Credential ID
                  <input className="h-10 rounded border border-[#cbd3df] px-3 text-sm font-normal outline-none focus:border-[#8398c4]" value={licenseFormDraft.credentialId} maxLength={80} onChange={(event) => setLicenseFormDraft((current) => ({ ...current, credentialId: event.target.value }))} />
                  <span className="text-right text-[10px] font-normal text-[#748098]">{licenseFormDraft.credentialId.length}/80</span>
                </label>
                <label className="grid gap-1 text-xs font-medium">Credential URL
                  <input className="h-10 rounded border border-[#cbd3df] px-3 text-sm font-normal outline-none focus:border-[#8398c4]" type="url" value={licenseFormDraft.credentialUrl} maxLength={2048} onChange={(event) => setLicenseFormDraft((current) => ({ ...current, credentialUrl: event.target.value }))} />
                </label>

                <section className="grid gap-2">
                  <h3 className="text-sm font-semibold text-[#101828]">Skills</h3>
                  <p className="text-xs text-[#65718a]">Associate at least 1 skill to this license or certification. It will also appear in your Skills section.</p>
                  {licenseFormDraft.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {licenseFormDraft.skills.map((skill) => (
                        <button key={skill} type="button" onClick={() => toggleLicenseSkill(skill)} className="rounded-full border border-[#3578d4] bg-[#edf4ff] px-3 py-1 text-xs font-medium text-[#173c70]">{skill} <span aria-hidden="true">×</span></button>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {draft.skills.filter((skill) => !licenseFormDraft.skills.includes(skill)).map((skill) => (
                      <button key={skill} type="button" onClick={() => toggleLicenseSkill(skill)} className="rounded-full border border-[#cbd3df] px-3 py-1 text-xs text-[#34425e] hover:bg-[#f7f8fc]">+ {skill}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="h-9 min-w-0 flex-1 rounded border border-[#cbd3df] px-3 text-xs outline-none focus:border-[#8398c4]" aria-label="New certification skill" placeholder="Add a skill" value={skillEntry} onChange={(event) => setSkillEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addLicenseSkill(); } }} />
                    <button type="button" onClick={addLicenseSkill} className="inline-flex items-center gap-1 rounded-full border border-[#3578d4] px-3 text-xs font-semibold text-[#1768c4] hover:bg-[#f4f8ff]"><Plus size={14} aria-hidden="true" /> Add skill</button>
                  </div>
                </section>

                <label className="grid gap-1 text-xs font-medium">Description
                  <textarea className="min-h-20 resize-y rounded border border-[#cbd3df] px-3 py-2 text-sm font-normal outline-none focus:border-[#8398c4]" value={licenseFormDraft.description} maxLength={1000} onChange={(event) => setLicenseFormDraft((current) => ({ ...current, description: event.target.value }))} />
                </label>
                {error && <p className="rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{error}</p>}
              </div>
              <footer className="flex shrink-0 items-center justify-between border-t border-[#e9edf4] px-5 py-3">
                {licenseFormIndex !== null
                  ? <button type="button" onClick={() => { removeLicense(licenseFormIndex); setLicenseFormOpen(false); setLicenseFormIndex(null); setError(""); }} className="inline-flex items-center gap-1 text-xs font-semibold text-[#c33b4a] hover:underline"><Trash2 size={14} aria-hidden="true" /> Remove</button>
                  : <span />}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setLicenseFormOpen(false); setError(""); }} className="rounded-md border border-[#dfe5ef] px-3 py-2 text-xs font-semibold text-[#4c5870]">Cancel</button>
                  <button type="button" onClick={saveLicenseForm} className="rounded-full bg-[#1768c4] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1256a3]">Save</button>
                </div>
              </footer>
            </section>
          </div>
        )}
      </div>
    );
  }

  if (skillsManagerOpen) {
    return (
      <div className="student-profile grid gap-3 text-[#202a43]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelSkillsManager} className="grid size-8 place-items-center rounded-md text-[#173c70] hover:bg-[#eef3fb]" aria-label="Back to profile"><ArrowLeft size={18} aria-hidden="true" /></button>
            <h2 className="font-heading text-base font-extrabold text-[#173c70]">Skills</h2>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelSkillsManager} className="rounded-md border border-[#dfe5ef] bg-white px-3 py-2 text-xs font-semibold text-[#4c5870]">Cancel</button>
            <button type="submit" form="skills-manager-form" className="inline-flex items-center gap-1.5 rounded-md bg-[#11177f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202990]"><Save size={13} aria-hidden="true" /> Save Changes</button>
          </div>
        </header>
        <form id="skills-manager-form" onSubmit={handleSave} className="rounded-lg border border-[#dfe5ef] bg-white p-5">
          <div className="grid gap-3">
            {draft.skills.length === 0 && <p className="text-sm text-[#748098]">No skills added yet.</p>}
            {draft.skills.map((skill) => (
              <div key={skill} className="flex min-h-11 items-center gap-2 border-b border-[#e9edf4] pb-2 last:border-0">
                {editingSkill === skill ? (
                  <>
                    <input autoFocus className="h-9 min-w-0 flex-1 rounded border border-[#cbd3df] px-3 text-sm outline-none focus:border-[#8398c4]" aria-label={`Edit ${skill}`} value={skillEntry} onChange={(event) => setSkillEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); updateSkill(skill); } }} />
                    <button type="button" onClick={() => updateSkill(skill)} className="rounded bg-[#1768c4] px-3 py-2 text-xs font-semibold text-white">Save</button>
                    <button type="button" onClick={() => { setEditingSkill(null); setSkillEntry(""); }} className="rounded border border-[#dfe5ef] px-3 py-2 text-xs font-semibold text-[#4c5870]">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 text-sm text-[#202a43]">{skill}</span>
                    <button type="button" onClick={() => { setEditingSkill(skill); setSkillEntry(skill); }} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label={`Edit ${skill}`}><Pencil size={15} aria-hidden="true" /></button>
                    <button type="button" onClick={() => removeSkill(skill)} className="grid size-8 place-items-center rounded text-[#c33b4a] hover:bg-[#fff1f2]" aria-label={`Remove ${skill}`}><Trash2 size={15} aria-hidden="true" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <input className="h-9 min-w-0 flex-1 rounded border border-[#cbd3df] px-3 text-sm outline-none focus:border-[#8398c4]" aria-label="Add a skill" placeholder="Add a skill" value={skillEntry} onChange={(event) => setSkillEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} />
            <button type="button" onClick={addSkill} className="inline-flex items-center gap-1 rounded-full border border-[#3578d4] px-4 text-xs font-semibold text-[#1768c4] hover:bg-[#f4f8ff]"><Plus size={14} aria-hidden="true" /> Add skill</button>
          </div>
          {error && <p className="mt-3 rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{error}</p>}
        </form>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="student-profile grid gap-3 text-[#202a43]">
        <header className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
            <button type="button" onClick={cancelEditing} className="grid size-8 place-items-center rounded-md text-[#173c70] hover:bg-[#eef3fb]" aria-label="Back to profile">
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#173c70]">Edit Profile</h2>
              <p className="text-[10px] text-[#788098]">OJT Adviser / Coordinator</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelEditing} className="rounded-md border border-[#dfe5ef] bg-white px-3 py-2 text-xs font-semibold text-[#4c5870] hover:bg-[#f7f8fc]">Cancel</button>
            <button type="submit" form="student-profile-form" className="inline-flex items-center gap-1.5 rounded-md bg-[#11177f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202990]">
              <Save size={13} aria-hidden="true" /> Save Changes
            </button>
          </div>
        </header>

        <form id="student-profile-form" className="grid gap-3" onSubmit={handleSave}>
          <section className="relative overflow-hidden rounded-lg border border-[#dfe5ef] bg-white">
            <div className="h-[88px] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(7,19,64,.78), rgba(17,23,127,.55)), url('/QCU_Background.jpg')" }} />
            <div className="flex flex-col items-center px-4 pb-3 text-center">
              <div className="relative -mt-8">
                <label className="grid size-16 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-white bg-[#f0f3f8] text-[#8290a8] shadow-sm" htmlFor="student-profile-photo" title="Upload profile photo">
                  {draft.profilePhoto ? <img className="size-full object-cover" src={draft.profilePhoto} alt="" /> : <UserRound size={25} aria-hidden="true" />}
                </label>
                <span className="pointer-events-none absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-[#1d2438] text-[7px] font-bold text-white" aria-hidden="true">
                  {draft.fullName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <input id="student-profile-photo" className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(event) => void handleImageChange(event, "profilePhoto")} />
              <span className="mt-2 text-[10px] text-[#65718a]">Click image to upload a new file (JPG, PNG max 5MB)</span>
            </div>
          </section>

          <ProfileSection title="Personal Information">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-[11px] font-medium">Last Name <span className="text-red-500">*</span>
                <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="lastName" value={draft.lastName} onChange={(event) => updateName("lastName", event.target.value)} required />
              </label>
              <label className="grid gap-1 text-[11px] font-medium">First Name <span className="text-red-500">*</span>
                <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="firstName" value={draft.firstName} onChange={(event) => updateName("firstName", event.target.value)} required />
              </label>
              <label className="grid gap-1 text-[11px] font-medium sm:col-span-2">Middle Name
                <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="middleName" value={draft.middleName} onChange={(event) => updateName("middleName", event.target.value)} />
              </label>
              <label className="grid gap-1 text-[11px] font-medium">Student Number <span className="text-red-500">*</span>
                <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="studentNumber" value={draft.studentNumber} onChange={(event) => updateDraft("studentNumber", event.target.value)} pattern="[0-9]{2}-[0-9]{4}" maxLength={7} required />
              </label>
              <label className="grid gap-1 text-[11px] font-medium">Department / College <span className="text-red-500">*</span>
                <select className="h-8 rounded border border-[#d8dfeb] bg-white px-2 text-xs font-normal outline-none focus:border-[#8398c4] disabled:bg-[#f1f3f6] disabled:text-[#8b95a7]" name="college" value={draft.college} onChange={(event) => updateCollege(event.target.value)} disabled={colleges.length === 0} required>
                  <option value="" disabled>Select Department / College</option>
                  {colleges.map((college) => <option key={college.id} value={college.name}>{college.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-[11px] font-medium">Year Level <span className="text-red-500">*</span>
                <input className="h-8 cursor-not-allowed rounded border border-[#d8dfeb] bg-[#f1f3f6] px-2 text-xs font-normal text-[#7b8495] outline-none" name="yearLevel" value={selectedCollege ? getYearLevel(selectedCollege.ojtYearLevel) : draft.yearLevel} readOnly aria-readonly="true" />
              </label>
              <label className="grid gap-1 text-[11px] font-medium">Program <span className="text-red-500">*</span>
                <select className="h-8 rounded border border-[#d8dfeb] bg-white px-2 text-xs font-normal outline-none focus:border-[#8398c4] disabled:bg-[#f1f3f6] disabled:text-[#8b95a7]" name="program" value={draft.program} onChange={(event) => updateDraft("program", event.target.value)} disabled={!selectedCollege} required>
                  <option value="" disabled>{selectedCollege ? "Select Program" : "Select a college first"}</option>
                  {selectedCollege?.programs.map((program) => <option key={program.id} value={program.name}>{program.name}</option>)}
                </select>
              </label>
            </div>
            {catalogError && <p className="mt-2 text-xs text-[#b42335]" role="alert">{catalogError}</p>}
            <div className="mt-4 grid gap-2 border-t border-[#e9edf4] pt-3 md:grid-cols-2">
              <label className="grid gap-1 text-[11px] font-medium">Email Address <span className="text-red-500">*</span>
                <span className="flex h-8 items-center gap-2 rounded border border-[#d8dfeb] px-2"><Mail size={13} className="text-[#8290a8]" aria-hidden="true" /><input className="min-w-0 flex-1 text-xs font-normal outline-none" type="email" name="email" value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} required /></span>
              </label>
              <label className="grid gap-1 text-[11px] font-medium">Contact Number <span className="text-red-500">*</span>
                <span className="flex h-8 items-center gap-2 rounded border border-[#d8dfeb] px-2"><Phone size={13} className="text-[#8290a8]" aria-hidden="true" /><span className="border-r border-[#d8dfeb] pr-2 text-xs text-[#65718a]">+63</span><input className="min-w-0 flex-1 text-xs font-normal outline-none" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="9XXXXXXXXX" value={getNationalPhoneDigits(draft.phone)} onChange={(event) => updateDraft("phone", formatPhilippinePhone(event.target.value))} pattern="[0-9]{10}" maxLength={10} required /></span>
              </label>
              <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-1 text-[11px] font-medium sm:col-span-2">House No. / Street <span className="text-red-500">*</span>
                  <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="streetAddress" value={draft.streetAddress} onChange={(event) => updateAddress("streetAddress", event.target.value)} required />
                </label>
                <label className="grid gap-1 text-[11px] font-medium">City / Municipality <span className="text-red-500">*</span>
                  <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="city" list="profile-city-options" placeholder="Type or select a city" value={draft.city} onChange={(event) => updateCity(event.target.value)} required />
                  <datalist id="profile-city-options">
                    {cityOptions.map((city) => <option key={city.id || city.name} value={city.name} />)}
                  </datalist>
                </label>
                <label className="grid gap-1 text-[11px] font-medium">Barangay <span className="text-red-500">*</span>
                  <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="barangay" list="profile-barangay-options" placeholder="Type or select a barangay" value={draft.barangay} onChange={(event) => updateAddress("barangay", event.target.value)} required />
                  <datalist id="profile-barangay-options">
                    {barangayOptions.map((barangay) => <option key={barangay.id} value={barangay.name} />)}
                  </datalist>
                </label>
                <label className="grid gap-1 text-[11px] font-medium">Postal Code
                  <input className="h-8 rounded border border-[#d8dfeb] px-2 text-xs font-normal outline-none focus:border-[#8398c4]" name="postalCode" value={draft.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} />
                </label>
              </div>
              {locationCatalogError && <p className="text-xs text-[#b42335]" role="alert">{locationCatalogError}</p>}
            </div>
          </ProfileSection>

          {error && <p className="rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{error}</p>}
        </form>
        {photoCropSource && (
          <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/60 p-4" role="presentation">
            <section className="w-full max-w-md rounded-xl bg-white p-5 text-[#202a43] shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
              <h2 id="photo-crop-title" className="font-heading text-base font-extrabold text-[#173c70]">Adjust Profile Picture</h2>
              <p className="mt-1 text-xs text-[#65718a]">Drag the image to position it inside the circle, then adjust the zoom.</p>
              <div className="mx-auto mt-4 grid size-[312px] max-w-full place-items-center overflow-hidden rounded-lg bg-[#20242d]">
                <div
                  ref={cropViewport}
                  className="relative size-[280px] max-h-[calc(100vw-64px)] max-w-[calc(100vw-64px)] touch-none cursor-grab overflow-hidden rounded-full border-2 border-white active:cursor-grabbing"
                  onPointerDown={startPhotoCropDrag}
                  onPointerMove={movePhotoCrop}
                  onPointerUp={stopPhotoCropDrag}
                  onPointerCancel={stopPhotoCropDrag}
                >
                  <img
                    ref={cropImage}
                    src={photoCropSource}
                    alt="Profile picture crop preview"
                    draggable={false}
                    onLoad={() => setPhotoCropReady(true)}
                    className="pointer-events-none absolute max-w-none select-none"
                    style={{
                      width: `${cropImageWidth}px`,
                      height: `${cropImageHeight}px`,
                      left: `calc(50% + ${photoCropOffset.x}px)`,
                      top: `calc(50% + ${photoCropOffset.y}px)`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              </div>
              <label className="mt-4 grid gap-2 text-xs font-semibold text-[#4c5870]">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={photoCropZoom}
                  onChange={(event) => {
                    const zoom = Number(event.target.value);
                    setPhotoCropZoom(zoom);
                    setPhotoCropOffset((offset) => constrainCropOffset(offset, zoom));
                  }}
                  aria-label="Zoom profile picture"
                />
              </label>
              {error && <p className="mt-3 text-xs text-[#b42335]" role="alert">{error}</p>}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={cancelPhotoCrop} className="rounded-md border border-[#dfe5ef] px-3 py-2 text-xs font-semibold text-[#4c5870] hover:bg-[#f7f8fc]">Cancel</button>
                <button type="button" onClick={applyPhotoCrop} disabled={!photoCropReady} className="rounded-md bg-[#11177f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#202990] disabled:cursor-not-allowed disabled:opacity-50">Apply Crop</button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="student-profile grid gap-3 text-[#202a43]">
      <section className="relative overflow-hidden rounded-lg border border-[#dfe5ef] bg-white shadow-[0_1px_3px_rgba(20,35,75,0.04)]">
        <div className="h-[92px] bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(7,19,64,.78), rgba(17,23,127,.55)), url('/QCU_Background.jpg')" }} />
        <div className="relative flex flex-col items-center px-4 pb-3 text-center">
          <div className="-mt-7 grid size-14 place-items-center rounded-full border-4 border-white bg-[#f0f3f8] text-[#8290a8] shadow-sm">
            {profile.profilePhoto ? <img className="size-full rounded-full object-cover" src={profile.profilePhoto} alt="" /> : <UserRound size={22} aria-hidden="true" />}
          </div>
          <h2 className="mt-1 text-sm font-bold text-[#1d2438]">{profile.fullName}</h2>
        </div>
      </section>

      <ProfileSection
        title="Personal Information"
        action={<button type="button" onClick={() => startEditing()} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Edit personal information" title="Edit personal information"><Pencil size={16} aria-hidden="true" /></button>}
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ProfileValue label="Student Number" value={profile.studentNumber} />
          <ProfileValue label="College" value={profile.college} />
          <ProfileValue label="Program" value={profile.program} />
          <ProfileValue label="Year Level" value={profile.yearLevel} />
          <ProfileValue label="Email Address" value={profile.email} />
          <ProfileValue label="Contact Number" value={displayPhilippinePhone(profile.phone)} />
          <ProfileValue label="Home Address" value={profile.address} />
        </dl>
      </ProfileSection>

      <div className="grid items-start gap-3 md:grid-cols-2">
        <ProfileSection title="OJT Information">
          {profile.partnerCompany ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <ProfileValue label="Partner Company" value={profile.partnerCompany} />
              <ProfileValue label="OJT Period" value={profile.ojtPeriod} />
            </dl>
          ) : (
            <div className="grid justify-items-start gap-2">
              <p className="text-xs leading-relaxed text-[#65718a]">You do not have an OJT placement yet. Generate a resume from your profile information to share with potential partner companies.</p>
              <button type="button" onClick={generateResume} className="inline-flex items-center gap-2 rounded bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]">
                <Download size={13} aria-hidden="true" /> Generate Resume
              </button>
            </div>
          )}
        </ProfileSection>

        <ProfileSection
          title={`Licenses & Certifications (${profile.licenses.length})`}
          action={
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => openLicenseManager(true)} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Add license or certification" title="Add license or certification"><Plus size={19} aria-hidden="true" /></button>
              <button type="button" onClick={() => openLicenseManager()} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Edit licenses and certifications" title="Edit licenses and certifications"><Pencil size={16} aria-hidden="true" /></button>
            </div>
          }
        >
          {profile.licenses.length ? (
            <div>
              <div className="divide-y divide-[#e9edf4]">
                {profile.licenses.slice(0, 2).map((license) => (
                  <article key={license.id} className="flex gap-3 py-4 first:pt-1 last:pb-1">
                    <div className="grid size-12 shrink-0 place-items-center rounded-md bg-[#0b1d33] text-center text-xs font-bold uppercase text-white" aria-hidden="true">
                      {license.issuer.slice(0, 3) || "LIC"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-semibold text-[#101828]">{license.name}</h3>
                      <p className="mt-0.5 text-xs text-[#34425e]">{license.issuer}</p>
                      {license.issueDate && <p className="mt-1 text-xs text-[#65718a]">Issued {formatIssueDate(license.issueDate)}</p>}
                      {license.expiryDate && <p className="mt-1 text-xs text-[#65718a]">Expires {formatIssueDate(license.expiryDate)}</p>}
                      {license.credentialUrl && (
                        <a className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#cbd3df] px-3 py-1.5 text-xs font-medium text-[#202a43] hover:bg-[#f7f8fc]" href={license.credentialUrl} target="_blank" rel="noreferrer">
                          Show credential <ExternalLink size={13} aria-hidden="true" />
                        </a>
                      )}
                      {license.skills.length > 0 && <p className="mt-2 text-xs text-[#34425e]"><strong>Skills:</strong> {license.skills.join(", ")}</p>}
                      {license.description && <p className="mt-2 text-xs text-[#34425e]">{license.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
              {profile.licenses.length > 2 && (
                <button type="button" onClick={() => openLicenseManager()} className="mt-3 w-full border-t border-[#e9edf4] pt-3 text-center text-xs font-semibold text-[#34425e]">
                  Show all {profile.licenses.length} licenses <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          ) : (
            <p className="py-2 text-sm text-[#748098]">No licenses or certifications added yet.</p>
          )}
        </ProfileSection>

        <ProfileSection title="E-Signature Profile">
          <div className="mb-4"><SignatureConsent /></div>
          <div className="flex min-h-[112px] items-center justify-center rounded-lg border-2 border-dashed border-[#cbd6e8] bg-[#f8faff] p-3">
            {profile.signatureImage
              ? <img className="max-h-40 max-w-full object-contain" src={profile.signatureImage} alt="Student e-signature" />
              : <div className="grid justify-items-center gap-2 text-[#91a0b7]"><FilePenLine size={30} aria-hidden="true" /><p className="text-sm font-semibold">No E-Signature Uploaded</p></div>}
          </div>
          <label htmlFor="student-signature-upload" className="mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#e2e8f0] text-sm font-semibold text-[#101828] shadow-[0_6px_16px_rgba(70,92,130,0.16)] hover:bg-[#d9e2ee]">
            <CloudUpload size={16} aria-hidden="true" /> {profile.signatureImage ? "Replace Signature" : "Upload Signature"}
          </label>
          <input id="student-signature-upload" className="sr-only" type="file" accept="image/png,image/jpeg" aria-describedby="student-signature-hint" onChange={(event) => void handleSignatureUpload(event)} />
          <p id="student-signature-hint" className="mt-2 text-center text-xs text-[#65718a]">Upload one signature image in PNG or JPEG format (up to 5 MB). Its plain background will be removed automatically; uploading again replaces it.</p>
        </ProfileSection>

        <ProfileSection
          title="Skills"
          action={
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => openSkillsManager()} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Add a skill" title="Add a skill"><Plus size={19} aria-hidden="true" /></button>
              <button type="button" onClick={() => openSkillsManager()} className="grid size-8 place-items-center rounded text-[#34425e] hover:bg-[#f1f4f9]" aria-label="Edit skills" title="Edit skills"><Pencil size={16} aria-hidden="true" /></button>
            </div>
          }
        >
          {profile.skills.length ? (
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 2).map((skill) => <button key={skill} type="button" onClick={() => openSkillsManager(skill)} className="rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-medium text-[#173c70] hover:bg-[#dfeeff]" aria-label={`Edit ${skill}`}>{skill}</button>)}
              </div>
              {profile.skills.length > 2 && (
                <button type="button" onClick={() => openSkillsManager()} className="mt-3 w-full border-t border-[#e9edf4] pt-3 text-center text-xs font-semibold text-[#34425e]">
                  Show all {profile.skills.length} skills <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          ) : (
            <p className="py-2 text-sm text-[#748098]">No skills added yet.</p>
          )}
        </ProfileSection>
      </div>
      {error && <p className="rounded-md bg-[#fff1f2] px-3 py-2 text-xs text-[#b42335]" role="alert">{error}</p>}
    </div>
  );
}
