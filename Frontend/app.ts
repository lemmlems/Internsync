// @ts-nocheck

import { createElement, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import StudentDashboard from "./src/components/views/student-dashboard";
import RoleDashboard from "./src/components/views/role-dashboard";
import DocumentsView from "./src/components/views/documents";
import ReviewView from "./src/components/views/review";
import { HOME_PAGE_BY_ROLE, NAV_ITEMS_BY_ROLE } from "./src/lib/nav-config";
import { formatDate } from "./src/lib/formatters";
import { getInitials } from "./src/lib/helpers";
import { toast } from "./src/lib/toast";
import { isRequired, isValidStudentId, validateFileSize, validateFileType, validatePassword } from "./src/lib/validations";

const roleDetails = {
  student: { label: "Student", name: "Sofia Reyes", initials: "SR", title: "QCU Student", workspace: "STUDENT WORKSPACE", helpTitle: "Your OJT, in one place", helpCopy: "View requirements, submit your work, and track adviser feedback." },
  adviser: { label: "OJT Adviser", name: "Jamie Dela Cruz", initials: "JD", title: "OJT Adviser", workspace: "ADVISER WORKSPACE", helpTitle: "Keep students on track", helpCopy: "Post requirements and review student submissions." },
  spards: { label: "SPARDS", name: "SPARDS Office", initials: "SP", title: "Document reviewer", workspace: "SPARDS WORKSPACE", helpTitle: "Placement documents", helpCopy: "View adviser-approved submissions and student MOA/MOU documents." }
};

const defaultAccounts = [
  { name: "Sofia Reyes", email: "student@qcu.edu.ph", password: "student123", role: "student", initials: "SR", title: "QCU Student" },
  { name: "Jamie Dela Cruz", email: "adviser@qcu.edu.ph", password: "adviser123", role: "adviser", initials: "JD", title: "OJT Adviser" },
  { name: "SPARDS Office", email: "spards@qcu.edu.ph", password: "spards123", role: "spards", initials: "SP", title: "Document reviewer" }
];

const savedRole = localStorage.getItem("internsync-demo-role") || "student";
const initialRole = Object.prototype.hasOwnProperty.call(roleDetails, savedRole) ? savedRole : "student";
const state = {
  role: initialRole,
  page: HOME_PAGE_BY_ROLE[initialRole],
  requirements: [],
  submissions: [],
  summary: {},
  filter: "All",
  search: "",
  authMode: "login",
  selectedAuthRole: localStorage.getItem("internsync-auth-role") || "student",
  colleges: [],
  collegeCatalogLoaded: false,
  selectedCollegeId: "",
  selectedProgramId: "",
  openCatalogDropdown: ""
};
const pageContent = document.getElementById("page-content");
const appRoots = window.__internsyncReactRoots || (window.__internsyncReactRoots = {});
const pageRootEntry = appRoots.page?.container === pageContent ? appRoots.page : null;
const pageRoot = pageRootEntry?.root || createRoot(pageContent);
appRoots.page = { container: pageContent, root: pageRoot };

function getAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem("internsync-accounts") || "[]");
    return [...defaultAccounts, ...saved];
  } catch (error) {
    return [...defaultAccounts];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem("internsync-accounts", JSON.stringify(accounts.filter((account) => !defaultAccounts.some((seed) => seed.email.toLowerCase() === account.email.toLowerCase()))));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem("internsync-auth-session") || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem("internsync-auth-session", JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem("internsync-auth-session");
  localStorage.removeItem("internsync-auth-session");
  localStorage.removeItem("internsync-demo-role");
}

localStorage.removeItem("internsync-auth-session");

function currentAccount() {
  const profile = roleDetails[state.role] || roleDetails.student;
  const session = getSession();
  if (session?.role !== state.role) {
    return { name: profile.name, role: state.role, title: profile.title, initials: profile.initials, email: `${state.role}@qcu.edu.ph` };
  }
  const savedAccount = getAccounts().find((account) => account.email.toLowerCase() === session.email?.toLowerCase());
  if (!savedAccount || state.role !== "student") return session;
  return {
    ...session,
    studentNumber: session.studentNumber || savedAccount.studentNumber,
    collegeName: session.collegeName || savedAccount.collegeName,
    programName: session.programName || savedAccount.programName,
    yearLevel: session.yearLevel || savedAccount.yearLevel
  };
}

function setAuthRole(role) {
  if (!roleDetails[role]) return;
  state.selectedAuthRole = role;
  localStorage.setItem("internsync-auth-role", role);
  const login = document.getElementById("login-role");
  const signup = document.getElementById("signup-role");
  if (login) login.value = role;
  if (signup) signup.value = role;
  document.querySelectorAll(".role-pill, .role-card").forEach((button) => {
    button.classList.toggle("active", button.dataset.roleOption === role);
    if (button.matches(".role-card")) button.setAttribute("aria-pressed", String(button.dataset.roleOption === role));
  });
  const studentIdBox = document.getElementById("student-id-box");
  if (studentIdBox) {
    const isStudent = role === "student";
    studentIdBox.hidden = !isStudent;
    const studentIdInput = studentIdBox.querySelector("input");
    if (studentIdInput) studentIdInput.required = isStudent;
  }
  const academicFields = document.getElementById("student-academic-fields");
  if (academicFields) academicFields.hidden = role !== "student";
  updateAuthSubmitButtons();
}

function updateAuthSubmitButtons() {
  for (const formId of ["login-form", "signup-form"]) {
    const form = document.getElementById(formId);
    const submit = form?.querySelector('[type="submit"]');
    const hasStudentCatalogSelection = formId !== "signup-form"
      || state.selectedAuthRole !== "student"
      || Boolean(state.selectedCollegeId && state.selectedProgramId);
    if (form && submit) submit.disabled = !form.checkValidity() || !hasStudentCatalogSelection;
  }
}

function catalogError(message) {
  const error = document.querySelector("[data-auth-error='signup']");
  if (error) error.textContent = message;
}

function closeCatalogDropdowns() {
  for (const field of ["college", "program"]) {
    const input = document.getElementById(`signup-${field}`);
    const options = document.getElementById(`${field}-options`);
    if (input) input.setAttribute("aria-expanded", "false");
    if (options) options.hidden = true;
  }
  document.getElementById("student-academic-fields")?.classList.remove("catalog-open");
  state.openCatalogDropdown = "";
}

function renderCatalogOptions(container, options, key, selectedId) {
  if (!container) return;
  container.replaceChildren();
  if (!options.length) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "catalog-empty";
    emptyMessage.setAttribute("role", "status");
    emptyMessage.textContent = "No options are available.";
    container.append(emptyMessage);
    return;
  }
  for (const option of options) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "catalog-option";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(option.id === selectedId));
    button.dataset[key] = option.id;
    button.textContent = option.name;
    container.append(button);
  }
}

function formatStudentNumber(input) {
  const caret = input.selectionStart ?? input.value.length;
  const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, "").length;
  const digits = input.value.replace(/\D/g, "").slice(0, 6);
  const formatted = digits.length > 2
    ? `${digits.slice(0, 2)}-${digits.slice(2)}`
    : digits.length === 2
      ? `${digits}-`
      : digits;
  input.value = formatted;
  const nextCaret = digitsBeforeCaret > 2
    ? 3 + digitsBeforeCaret - 2
    : digitsBeforeCaret === 2 && digits.length >= 2
      ? 3
      : digitsBeforeCaret;
  input.setSelectionRange(nextCaret, nextCaret);
}

async function loadCollegeCatalog() {
  if (state.collegeCatalogLoaded) return;
  const input = document.getElementById("signup-college");
  if (input) {
    input.disabled = true;
    input.placeholder = "Loading colleges...";
  }
  try {
    const response = await api("/catalog/colleges");
    if (!Array.isArray(response.colleges) || response.colleges.some((college) =>
      typeof college.id !== "string"
      || typeof college.name !== "string"
      || !["THIRD", "FOURTH"].includes(college.ojtYearLevel)
      || !Array.isArray(college.programs)
      || college.programs.some((program) => typeof program.id !== "string" || typeof program.name !== "string")
    )) {
      throw new Error("The college catalog returned invalid data.");
    }
    if (!response.colleges.length) {
      throw new Error("No colleges are configured in Prisma. Seed the academic catalog and try again.");
    }
    state.colleges = response.colleges;
    state.collegeCatalogLoaded = true;
  } finally {
    if (input) {
      input.disabled = false;
      input.placeholder = "Select Department / College";
    }
  }
}

async function toggleCatalogDropdown(field) {
  if (state.openCatalogDropdown === field) {
    closeCatalogDropdowns();
    return;
  }

  if (field === "college") {
    try {
      await loadCollegeCatalog();
    } catch (error) {
      catalogError(error.message);
      return;
    }
    renderCatalogOptions(document.getElementById("college-options"), state.colleges, "collegeOption", state.selectedCollegeId);
  } else {
    const college = state.colleges.find((item) => item.id === state.selectedCollegeId);
    if (!college) {
      catalogError("Select a Department / College first.");
      return;
    }
    renderCatalogOptions(document.getElementById("program-options"), college.programs, "programOption", state.selectedProgramId);
  }

  closeCatalogDropdowns();
  const input = document.getElementById(`signup-${field}`);
  const options = document.getElementById(`${field}-options`);
  if (input) input.setAttribute("aria-expanded", "true");
  if (options) options.hidden = false;
  document.getElementById("student-academic-fields")?.classList.add("catalog-open");
  state.openCatalogDropdown = field;
  catalogError("");
}

function selectCollege(collegeId) {
  const college = state.colleges.find((item) => item.id === collegeId);
  if (!college) return;
  state.selectedCollegeId = college.id;
  state.selectedProgramId = "";
  document.getElementById("signup-college").value = college.name;
  document.getElementById("signup-program").value = "";
  document.getElementById("signup-program").disabled = false;
  document.getElementById("signup-program").placeholder = college.programs.length ? "Select Program" : "No programs available";
  document.getElementById("signup-year-level").value = college.ojtYearLevel === "THIRD" ? "3rd Year" : "4th Year";
  closeCatalogDropdowns();
  catalogError("");
  updateAuthSubmitButtons();
}

function selectProgram(programId) {
  const college = state.colleges.find((item) => item.id === state.selectedCollegeId);
  const program = college?.programs.find((item) => item.id === programId);
  if (!program) return;
  state.selectedProgramId = program.id;
  document.getElementById("signup-program").value = program.name;
  closeCatalogDropdowns();
  catalogError("");
  updateAuthSubmitButtons();
}

document.querySelectorAll("[data-role-option]").forEach((button) => {
  button.addEventListener("click", () => setAuthRole(button.dataset.roleOption));
});

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "login";
  document.title = `InternSync — ${state.authMode === "signup" ? "Sign Up" : "Sign In"}`;
  document.getElementById("auth-screen")?.setAttribute("data-auth-mode", state.authMode);
  document.querySelectorAll(".auth-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.authMode === state.authMode);
  });
  document.querySelectorAll(".auth-form").forEach((form) => {
    form.classList.toggle("active", form.id === `${state.authMode}-form`);
  });
}

function updateAuthView() {
  const session = getSession();
  const authScreen = document.getElementById("auth-screen");
  const appShell = document.getElementById("app-shell");
  if (!session) {
    state.role = localStorage.getItem("internsync-demo-role") || state.selectedAuthRole || "student";
    if (authScreen) authScreen.classList.remove("hidden");
    if (appShell) appShell.classList.add("hidden");
    setAuthRole(state.selectedAuthRole || "student");
    setAuthMode(state.authMode);
    return;
  }
  state.role = session.role;
  localStorage.setItem("internsync-demo-role", state.role);
  if (authScreen) authScreen.classList.add("hidden");
  if (appShell) appShell.classList.remove("hidden");
  setAuthRole(state.role);
}

async function api(path, options = {}) {
  let response;
  const accessToken = getSession()?.accessToken;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(!path.startsWith("/auth/") ? { "X-Demo-Role": state.role } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw new Error("Cannot connect to the InternSync backend. Start it separately with `cd Backend && npm start`, then try again.");
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (response.ok) return data;
  throw new Error(data.error || "Something went wrong. Please try again.");
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function requirementFor(id) { return state.requirements.find((requirement) => requirement.id === id); }
function submissionFor(requirementId) { return state.submissions.find((submission) => submission.requirementId === requirementId && submission.documentType === "assignment"); }

async function loadData() {
  [state.requirements, state.submissions, state.summary] = await Promise.all([
    api("/classroom/requirements"),
    api("/classroom/submissions"),
    api("/classroom/summary")
  ]);
  updateProfile();
  renderPage();
}

function updateProfile() {
  const profile = roleDetails[state.role] || roleDetails.student;
  const account = currentAccount();
  const appShell = document.getElementById("app-shell");
  if (appShell) appShell.dataset.role = state.role;
  const workspaceLabel = document.getElementById("workspace-label");
  if (workspaceLabel) workspaceLabel.textContent = profile.workspace;
  const helpTitle = document.getElementById("help-title");
  if (helpTitle) helpTitle.textContent = profile.helpTitle;
  const helpCopy = document.getElementById("help-copy");
  if (helpCopy) helpCopy.textContent = profile.helpCopy;
  const roleSelect = document.getElementById("role-select");
  if (roleSelect) roleSelect.value = state.role;
  const topbarName = document.getElementById("topbar-name");
  if (topbarName) topbarName.textContent = account.name || profile.name;
  const topbarRole = document.getElementById("topbar-role");
  if (topbarRole) topbarRole.textContent = state.role === "student" ? "Student" : (account.title || profile.title);
  const topbarAvatar = document.getElementById("topbar-avatar");
  let profilePhoto = "";
  if (state.role === "student") {
    const profileKey = `internsync-student-profile:${(account.email || "student@qcu.edu.ph").toLowerCase()}`;
    const storedProfile = localStorage.getItem(profileKey);
    if (storedProfile) {
      try {
        profilePhoto = JSON.parse(storedProfile).profilePhoto || "";
      } catch (error) {
        console.error("Could not read the saved student profile photo.", error);
      }
    }
  }
  if (topbarAvatar && !profilePhoto) topbarAvatar.textContent = account.initials || profile.initials;
  window.dispatchEvent(new CustomEvent("internsync-profile-avatar-updated", {
    detail: { profilePhoto, initials: account.initials || profile.initials }
  }));
  window.dispatchEvent(new CustomEvent("internsync-student-profile-updated"));
}

function setSidebarOpen(open) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  const isOpen = open && !isDesktop;
  sidebar.classList.toggle("open", isOpen);
  sidebar.setAttribute("aria-hidden", String(!isDesktop && !isOpen));
  sidebar.toggleAttribute("inert", !isDesktop && !isOpen);
  const backdrop = document.getElementById("sidebar-backdrop");
  if (backdrop) {
    backdrop.hidden = !isOpen;
    backdrop.setAttribute("aria-hidden", String(!isOpen));
  }
  document.getElementById("mobile-menu")?.setAttribute("aria-expanded", String(isOpen));
  document.getElementById("mobile-menu")?.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
}

window.addEventListener("resize", () => {
  window.requestAnimationFrame(() => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) setSidebarOpen(sidebar.classList.contains("open"));
  });
});

function setNavigation() {
  const pages = NAV_ITEMS_BY_ROLE[state.role] || NAV_ITEMS_BY_ROLE.student;
  const nav = document.querySelector(".main-nav");
  const activePage = state.page === "ojt-hours" ? "student-dashboard" : state.page;
  const badgeCount = state.role === "student"
    ? state.submissions.length
    : state.role === "adviser"
      ? state.submissions.filter((submission) => submission.status === "Pending adviser review").length
      : state.submissions.filter((submission) => submission.status === "Approved" || ["MOA", "MOU"].includes(submission.documentType)).length;
  if (nav) {
    const navRootEntry = appRoots.navigation?.container === nav ? appRoots.navigation : null;
    const root = navRootEntry?.root || createRoot(nav);
    appRoots.navigation = { container: nav, root };
    root.render(createElement(
      Fragment,
      null,
      ...pages.map(({ page, icon: Icon, label }) => createElement(
        "button",
        {
          key: page,
          className: `nav-link group relative flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-white/80 transition hover:bg-white/10 hover:text-white ${activePage === page ? "active bg-[#30398e] text-white" : ""}`,
          "data-page": page,
          "aria-current": activePage === page ? "page" : undefined,
          type: "button"
        },
        createElement("span", { className: "nav-icon grid size-5 shrink-0 place-items-center", "aria-hidden": true }, createElement(Icon, { size: 15, strokeWidth: 1.8 })),
        createElement("span", { className: "nav-label min-w-0 flex-1 leading-snug" }, label),
        ((page === "documents" && state.role === "spards") || page === "review") && badgeCount > 0
          ? createElement("span", { className: "nav-count grid size-6 shrink-0 place-items-center rounded-md bg-white/15 text-xs text-white" }, badgeCount)
          : null
      ))
    ));
  }
}

function renderPage() {
  const labels = {
    "student-dashboard": "Dashboard",
    "adviser-dashboard": "Dashboard",
    "spards-dashboard": "Dashboard",
    "ojt-hours": "OJT Hours Log",
    "requirements-progress": "Requirements Progress",
    "partner-companies": "Partner Companies",
    "my-ojt": "My OJT",
    "moa-moa": "MOU/MOA",
    reflection: "Reflection",
    "student-profile": "OJT Student Profile",
    classroom: state.role === "adviser" ? "Classroom" : "Overview",
    documents: "Documents",
    review: "Review submissions"
  };
  const pageTitles = {
    student: {
      "student-dashboard": "OJT Student Dashboard",
      "ojt-hours": "OJT Student Dashboard",
      "requirements-progress": "Requirements Progress",
      "partner-companies": "Partner Companies",
      "my-ojt": "My OJT",
      "moa-moa": "MOU/MOA",
      reflection: "Reflection",
      "student-profile": "OJT Student Profile"
    },
    adviser: { "adviser-dashboard": "OJT Adviser Dashboard", review: "Review Submissions" },
    spards: { "spards-dashboard": "SPARDS Dashboard", documents: "Document Review" }
  };
  const views = {
    "student-dashboard": StudentDashboard,
    "adviser-dashboard": RoleDashboard,
    "spards-dashboard": RoleDashboard,
    documents: DocumentsView,
    review: ReviewView
  };
  const View = views[state.page] || StudentDashboard;
  const currentPageLabel = labels[state.page] || labels["student-dashboard"];
  const pageTitle = pageTitles[state.role]?.[state.page] || currentPageLabel;
  const workspaceHeading = document.getElementById("workspace-heading");
  if (workspaceHeading) workspaceHeading.textContent = pageTitle;
  document.title = `InternSync — ${pageTitle}`;
  setNavigation();
  flushSync(() => {
    pageRoot.render(createElement(View, { state, currentAccount, submissionFor, formatDate, requirementFor }));
  });
  const sidebar = document.getElementById("sidebar");
  if (sidebar) setSidebarOpen(false);
}

function openRequirementModal() {
  const backdrop = document.getElementById("modal-backdrop");
  const workflowModal = document.getElementById("workflow-modal");
  if (workflowModal) {
    workflowModal.innerHTML = `<div class="modal-heading"><div><span class="eyebrow">OJT REQUIREMENTS</span><h2 id="modal-title">Post a requirement</h2></div><button class="icon-button close-modal" aria-label="Close">×</button></div><p class="modal-intro">Students will be able to see and respond to this requirement from their dashboard.</p><form id="requirement-form"><label class="field-label" for="requirement-title">Requirement title</label><input class="form-control" id="requirement-title" name="title" maxlength="120" placeholder="e.g. Monthly OJT journal" required><label class="field-label" for="requirement-description">Instructions</label><textarea class="form-control answer-input" id="requirement-description" name="description" maxlength="2000" placeholder="Explain what students need to submit..." required></textarea><label class="field-label" for="requirement-due">Due date</label><input class="form-control" id="requirement-due" name="dueDate" type="date" required><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-quiet close-modal">Cancel</button><button type="submit" class="button button-primary">Post requirement <span>↗</span></button></div></form>`;
  }
  if (backdrop) backdrop.hidden = false;
  const requirementTitle = document.getElementById("requirement-title");
  if (requirementTitle) requirementTitle.focus();
}

function closeModal() {
  const backdrop = document.getElementById("modal-backdrop");
  if (backdrop) backdrop.hidden = true;
}

function readFile(file) {
  if (!file || !file.name) return Promise.resolve(null);
  const typeValidation = validateFileType(file);
  if (!typeValidation.valid) throw new Error(typeValidation.message);
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.valid) throw new Error(sizeValidation.message);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", data: reader.result });
    reader.onerror = () => reject(new Error("The selected document could not be read."));
    reader.readAsDataURL(file);
  });
}

async function refreshData() {
  [state.requirements, state.submissions, state.summary] = await Promise.all([
    api("/classroom/requirements"), api("/classroom/submissions"), api("/classroom/summary")
  ]);
  updateProfile();
  renderPage();
}

document.addEventListener("click", async (event) => {
  const collegeOption = event.target.closest("[data-college-option]");
  if (collegeOption) {
    selectCollege(collegeOption.dataset.collegeOption);
    return;
  }
  const programOption = event.target.closest("[data-program-option]");
  if (programOption) {
    selectProgram(programOption.dataset.programOption);
    return;
  }
  const catalogInput = event.target.closest("[data-catalog-dropdown]");
  if (catalogInput) {
    await toggleCatalogDropdown(catalogInput.dataset.catalogDropdown);
    return;
  }
  closeCatalogDropdowns();

  const sidebarEl = document.getElementById("sidebar");
  if (sidebarEl && sidebarEl.classList.contains("open") && !event.target.closest("#sidebar") && !event.target.closest("#mobile-menu")) {
    setSidebarOpen(false);
  }
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) {
    setAuthMode(authMode.dataset.authMode);
    return;
  }
  if (event.target.closest("#logout-button")) {
    const session = getSession();
    if (session?.accessToken) {
      try {
        await api("/auth/logout", { method: "POST" });
      } catch (logoutError) {
        console.error("Could not revoke the student session.", logoutError);
        toast.error("Logged out here, but the server session could not be revoked.");
      }
    }
    clearSession();
    updateAuthView();
    toast.success("You have been logged out.");
    return;
  }
  const navigation = event.target.closest("[data-page]");
  if (navigation) {
    state.page = navigation.dataset.page === "dashboard"
      ? HOME_PAGE_BY_ROLE[state.role]
      : navigation.dataset.page;
    state.filter = "All";
    state.search = "";
    renderPage();
    return;
  }
  const download = event.target.closest("[data-download]");
  if (download) {
    event.preventDefault();
    try {
      const response = await fetch(download.href, { headers: { "X-Demo-Role": state.role } });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Could not download the document.");
      }
      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = download.download;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      toast.error(error.message);
    }
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    state.filter = filter.dataset.filter;
    renderPage();
    return;
  }
  if (event.target.closest("#create-requirement")) { openRequirementModal(); return; }
  if (event.target.closest(".close-modal")) { closeModal(); return; }
  if (event.target.id === "modal-backdrop") { closeModal(); return; }
  if (event.target.closest("#mobile-menu")) {
    if (sidebarEl) setSidebarOpen(!sidebarEl.classList.contains("open"));
    return;
  }
  const reviewButton = event.target.closest("[data-review]");
  if (reviewButton) {
    reviewButton.disabled = true;
    const id = reviewButton.dataset.submission;
    const feedback = pageContent.querySelector(`[data-feedback="${CSS.escape(id)}"]`)?.value || "";
    try {
      await api(`/classroom/submissions/${encodeURIComponent(id)}/review`, { method: "PATCH", body: JSON.stringify({ status: reviewButton.dataset.review, feedback }) });
      await refreshData();
      toast.success(reviewButton.dataset.review === "Approved" ? "Submission approved and shared with SPARDS." : "Submission returned to the student with feedback.");
    } catch (error) {
      reviewButton.disabled = false;
      toast.error(error.message);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.id === "signup-student-id"
    && event.key === "Backspace"
    && event.target.selectionStart === event.target.selectionEnd
    && event.target.selectionStart === event.target.value.length
    && /^\d{2}-$/.test(event.target.value)) {
    event.preventDefault();
    event.target.value = event.target.value.slice(0, 1);
    event.target.setSelectionRange(1, 1);
    updateAuthSubmitButtons();
    return;
  }
  const catalogInput = event.target.closest("[data-catalog-dropdown]");
  if (!catalogInput) {
    if (event.key === "Escape") closeCatalogDropdowns();
    return;
  }
  if (["Enter", " ", "ArrowDown"].includes(event.key)) {
    event.preventDefault();
    toggleCatalogDropdown(catalogInput.dataset.catalogDropdown);
  } else if (event.key === "Escape") {
    closeCatalogDropdowns();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "signup-student-id") formatStudentNumber(event.target);
  if (event.target.closest("#login-form, #signup-form")) updateAuthSubmitButtons();
  if (event.target.matches("[data-search]") || event.target.matches(".search-box input")) {
    const isTopbar = event.target.closest(".search-box") !== null;
    state.search = event.target.value;
    if (isTopbar && (state.page === "student-dashboard" || state.page === "adviser-dashboard" || state.page === "spards-dashboard")) {
      state.page = state.role === "adviser" ? "review" : state.role === "student" ? "requirements-progress" : "documents";
    }
    renderPage();
    const topbarInput = document.querySelector(".search-box input");
    if (topbarInput && topbarInput !== event.target) topbarInput.value = state.search;
    const pageInput = pageContent.querySelector("[data-search]");
    if (pageInput && pageInput !== event.target) pageInput.value = state.search;
    const activeInput = isTopbar ? topbarInput : pageInput;
    if (activeInput) {
      activeInput.focus();
      activeInput.setSelectionRange(activeInput.value.length, activeInput.value.length);
    }
  }
});

document.addEventListener("change", (event) => {
  if (event.target.closest("#login-form, #signup-form")) updateAuthSubmitButtons();
  if ((event.target.id === "login-role" || event.target.id === "signup-role") && roleDetails[event.target.value]) {
    setAuthRole(event.target.value);
    return;
  }
  if (event.target.id !== "role-select" || !roleDetails[event.target.value]) return;
  state.role = event.target.value;
  state.page = HOME_PAGE_BY_ROLE[state.role];
  state.filter = "All";
  state.search = "";
  localStorage.setItem("internsync-demo-role", state.role);
  updateProfile();
  renderPage();
  loadData().catch((error) => toast.error(error.message));
});

document.addEventListener("change", (event) => {
  if (event.target.matches('input[type="file"]')) {
    const label = event.target.closest("form")?.querySelector(".file-name");
    if (label) label.textContent = event.target.files[0]?.name || "PDF, Word, TXT or image · max 5 MB";
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form.id === "login-form") {
    event.preventDefault();
    if (!form.checkValidity()) return;
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const error = form.querySelector("[data-auth-error='login']");
    let account;
    let authenticatedStudent;
    const localAccount = getAccounts().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase()
      && candidate.password === password);
    const demoAccount = defaultAccounts.find((candidate) => candidate.role === "student"
      && candidate.email.toLowerCase() === email.toLowerCase()
      && candidate.password === password);
    if (demoAccount) {
      account = demoAccount;
    } else if (localAccount && localAccount.role !== "student") {
      account = localAccount;
    } else {
      try {
        authenticatedStudent = await api("/auth/student-login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });
      } catch (loginError) {
        error.textContent = loginError.message;
        return;
      }
      const profile = authenticatedStudent?.profile;
      if (!authenticatedStudent?.accessToken || !profile) {
        error.textContent = "The server returned an incomplete student account response.";
        return;
      }
      account = {
        name: profile.name,
        email: profile.email,
        role: "student",
        initials: getInitials(profile.name),
        title: roleDetails.student.title,
        studentNumber: profile.studentNumber,
        collegeId: profile.collegeId,
        collegeName: profile.collegeName,
        programId: profile.programId,
        programName: profile.programName,
        yearLevel: profile.yearLevel
      };
    }
    if (!account) {
      error.textContent = "Invalid email, password, or selected role.";
      return;
    }
    error.textContent = "";
    const session = {
      name: account.name,
      email: account.email,
      role: account.role,
      initials: account.initials || getInitials(account.name),
      title: account.title || roleDetails[account.role].title,
      ...(authenticatedStudent ? {
        accessToken: authenticatedStudent.accessToken,
        firstName: authenticatedStudent.profile.firstName,
        middleName: authenticatedStudent.profile.middleName,
        lastName: authenticatedStudent.profile.lastName,
        studentNumber: authenticatedStudent.profile.studentNumber,
        collegeId: authenticatedStudent.profile.collegeId,
        collegeName: authenticatedStudent.profile.collegeName,
        programId: authenticatedStudent.profile.programId,
        programName: authenticatedStudent.profile.programName,
        yearLevel: authenticatedStudent.profile.yearLevel
      } : {})
    };
    saveSession(session);
    state.role = account.role;
    state.page = HOME_PAGE_BY_ROLE[account.role];
    localStorage.setItem("internsync-demo-role", account.role);
    updateAuthView();
    updateProfile();
    renderPage();
    await loadData().catch((loadError) => toast.error(loadError.message));
    toast.success(`Welcome back, ${account.name.split(" ")[0]}.`);
    return;
  }
  if (form.id === "signup-form") {
    event.preventDefault();
    if (!form.checkValidity()) return;
    let authenticatedStudent;
    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const name = `${firstName} ${lastName}`.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const role = state.selectedAuthRole || "student";
    const error = form.querySelector("[data-auth-error='signup']");
    if (!isRequired(firstName) || !isRequired(lastName) || !isRequired(email) || !isRequired(password) || name.length > 200) {
      error.textContent = "Enter your first name, last name, email, and password.";
      return;
    }
    if (role === "student" && !isValidStudentId(form.studentNumber.value)) {
      error.textContent = "Enter a student ID in the format 23-1924.";
      return;
    }
    const selectedCollege = state.colleges.find((college) => college.id === state.selectedCollegeId);
    const selectedProgram = selectedCollege?.programs.find((program) => program.id === state.selectedProgramId);
    if (role === "student" && (!selectedCollege || !selectedProgram)) {
      error.textContent = "Select your Department / College and Program.";
      document.getElementById(selectedCollege ? "signup-program" : "signup-college")?.focus();
      return;
    }
    const accounts = getAccounts();
    if (role === "student" && accounts.some((candidate) => candidate.studentNumber === form.studentNumber.value)) {
      error.textContent = "This student ID is already registered.";
      return;
    }
    if (accounts.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
      error.textContent = "An account with this email already exists.";
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      error.textContent = passwordValidation.message;
      return;
    }
    if (role === "student") {
      try {
        authenticatedStudent = await api("/auth/student-signup", {
          method: "POST",
          body: JSON.stringify({
            studentNumber: form.studentNumber.value,
            firstName,
            lastName,
            name,
            email,
            password,
            programId: selectedProgram.id
          })
        });
      } catch (signupError) {
        error.textContent = signupError.message;
        return;
      }
    }
    if (role === "student" && (!authenticatedStudent?.accessToken || !authenticatedStudent.profile)) {
      error.textContent = "The server returned an incomplete student account response.";
      return;
    }
    const registeredProfile = authenticatedStudent?.profile;
    const newAccount = {
      name: registeredProfile?.name || name,
      email,
      ...(role === "student" ? {} : { password }),
      role,
      initials: getInitials(registeredProfile?.name || name) || "U",
      title: roleDetails[role].title,
      ...(role === "student" ? {
        studentNumber: registeredProfile.studentNumber,
        collegeId: registeredProfile.collegeId,
        collegeName: registeredProfile.collegeName,
        programId: registeredProfile.programId,
        programName: registeredProfile.programName,
        yearLevel: registeredProfile.yearLevel
      } : {})
    };
    saveAccounts([...accounts, newAccount]);
    error.textContent = "";
    const session = {
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      initials: newAccount.initials,
      title: newAccount.title,
      ...(newAccount.role === "student" ? {
        accessToken: authenticatedStudent.accessToken,
        firstName: registeredProfile.firstName,
        middleName: registeredProfile.middleName,
        lastName: registeredProfile.lastName,
        studentNumber: newAccount.studentNumber,
        collegeId: newAccount.collegeId,
        collegeName: newAccount.collegeName,
        programId: newAccount.programId,
        programName: newAccount.programName,
        yearLevel: newAccount.yearLevel
      } : {})
    };
    saveSession(session);
    state.role = newAccount.role;
    state.page = HOME_PAGE_BY_ROLE[newAccount.role];
    localStorage.setItem("internsync-demo-role", newAccount.role);
    updateAuthView();
    updateAuthSubmitButtons();
    updateProfile();
    renderPage();
    await loadData().catch((loadError) => toast.error(loadError.message));
    toast.success(`Welcome, ${newAccount.name.split(" ")[0]}!`);
    return;
  }
  if (form.id === "requirement-form") {
    event.preventDefault();
    const submit = form.querySelector('[type="submit"]');
    const error = form.querySelector(".form-error");
    submit.disabled = true;
    error.textContent = "";
    const values = new FormData(form);
    try {
      await api("/classroom/requirements", { method: "POST", body: JSON.stringify({ title: values.get("title"), description: values.get("description"), dueDate: values.get("dueDate") }) });
      closeModal();
      await refreshData();
      toast.success("Requirement posted successfully.");
    } catch (exception) {
      error.textContent = exception.message;
      submit.disabled = false;
    }
    return;
  }
  if (!form.matches("[data-submission-form]")) return;
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  const error = form.querySelector(".form-error");
  submit.disabled = true;
  error.textContent = "";
  try {
    const values = new FormData(form);
    const file = await readFile(values.get("file"));
    const documentType = form.dataset.documentType === "agreement" ? values.get("documentType") : "assignment";
    const payload = {
      documentType,
      requirementId: form.dataset.requirementId || "",
      answer: values.get("answer") || "",
      file
    };
    const endpoint = "/classroom/submissions";
    await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
    await refreshData();
    toast.success(documentType === "assignment" ? "Your work was submitted to your OJT adviser." : `${documentType} submitted to SPARDS.`);
  } catch (exception) {
    error.textContent = exception.message;
    submit.disabled = false;
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    const searchInput = document.querySelector(".search-box input, [data-search]");
    if (searchInput) searchInput.focus();
  }
});

updateAuthView();

if (getSession()) {
  updateProfile();
  renderPage();
  loadData().catch((error) => toast.error(error.message));
}
