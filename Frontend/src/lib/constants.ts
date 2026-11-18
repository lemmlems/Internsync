export const APP_INFO = {
  name: "InternSync",
  shortName: "InternSync",
  institution: "Quezon City University",
  description: "Internship progress and document workspace for QCU students, OJT advisers, and SPARDS.",
} as const;

export const APP_ROUTES = {
  home: "/",
  studentDashboard: "student-dashboard",
  ojtHours: "ojt-hours",
  requirements: "requirements-progress",
  partnerCompanies: "partner-companies",
  myOjt: "my-ojt",
  agreements: "moa-moa",
  reflection: "reflection",
  classroom: "classroom",
  documents: "documents",
  review: "review",
} as const;

export const USER_ROLES = {
  student: "student",
  adviser: "adviser",
  spards: "spards",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const APPLICATION_STATUSES = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  underReview: "Under review",
  returned: "Returned",
  active: "Active",
  shortlisted: "Shortlisted",
  forInterview: "For interview",
  accepted: "Accepted",
} as const;

export const DOCUMENT_TYPES = {
  assignment: "assignment",
  moa: "MOA",
  mou: "MOU",
} as const;

export const DOCUMENT_STATUSES = {
  pending: APPLICATION_STATUSES.pending,
  pendingAdviserReview: "Pending adviser review",
  approved: APPLICATION_STATUSES.approved,
  rejected: APPLICATION_STATUSES.rejected,
  underReview: APPLICATION_STATUSES.underReview,
  returned: APPLICATION_STATUSES.returned,
  needsRevision: "Needs revision",
  submittedToSpards: "Submitted to SPARDS",
} as const;

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 10,
  pageSizeOptions: [10, 25, 50] as const,
} as const;

export const DATE_TIME_CONFIG = {
  locale: "en-PH",
  currency: "PHP",
  dateOptions: { year: "numeric", month: "short", day: "numeric" } as const,
  dateTimeOptions: {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  } as const,
  relativeTime: { numeric: "auto", style: "long" } as const,
} as const;

export const FILE_UPLOAD_CONFIG = {
  maxFileSizeBytes: 5 * 1024 * 1024,
  minFileSizeBytes: 1,
  allowedExtensions: [".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png"] as const,
  allowedMimeTypes: {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword", "application/octet-stream"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
    ".txt": ["text/plain"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"],
  } as const,
} as const;

export const UI_CONFIG = {
  sidebarWidthPx: 250,
  mobileBreakpointPx: 768,
  toastDurationMs: 3200,
  modalMaxViewportHeightPercent: 90,
} as const;
