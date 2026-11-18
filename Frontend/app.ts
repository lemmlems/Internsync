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
  selectedAuthRole: localStorage.getItem("internsync-auth-role") || "student"
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
  return session?.role === state.role
    ? session
    : { name: profile.name, role: state.role, title: profile.title, initials: profile.initials, email: `${state.role}@qcu.edu.ph` };
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
  updateAuthSubmitButtons();
}

function updateAuthSubmitButtons() {
  for (const formId of ["login-form", "signup-form"]) {
    const form = document.getElementById(formId);
    const submit = form?.querySelector('[type="submit"]');
    if (form && submit) submit.disabled = !form.checkValidity();
  }
}

document.querySelectorAll("[data-role-option]").forEach((button) => {
  button.addEventListener("click", () => setAuthRole(button.dataset.roleOption));
});

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "login";
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
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "X-Demo-Role": state.role, ...(options.headers || {}) }
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
  const profileInitials = document.getElementById("profile-initials");
  if (profileInitials) profileInitials.textContent = account.initials || profile.initials;
  const profileName = document.getElementById("profile-name");
  if (profileName) profileName.textContent = account.name || profile.name;
  const profileRole = document.getElementById("profile-role");
  if (profileRole) profileRole.textContent = account.title || profile.title;
  const helpTitle = document.getElementById("help-title");
  if (helpTitle) helpTitle.textContent = profile.helpTitle;
  const helpCopy = document.getElementById("help-copy");
  if (helpCopy) helpCopy.textContent = profile.helpCopy;
  const roleSelect = document.getElementById("role-select");
  if (roleSelect) roleSelect.value = state.role;
  const topbarName = document.getElementById("topbar-name");
  if (topbarName) topbarName.textContent = account.name || profile.name;
  const topbarRole = document.getElementById("topbar-role");
  if (topbarRole) topbarRole.textContent = account.title || profile.title;
}

function setSidebarOpen(open) {
  const sidebar = document.getElementById("sidebar");
  if (!sidebar) return;
  const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
  sidebar.classList.toggle("open", open && !isDesktop);
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
      reflection: "Reflection"
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
  const workspaceHeading = document.getElementById("workspace-heading");
  if (workspaceHeading) workspaceHeading.textContent = pageTitles[state.role]?.[state.page] || currentPageLabel;
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

document.addEventListener("input", (event) => {
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
    const role = state.selectedAuthRole || "student";
    const error = form.querySelector("[data-auth-error='login']");
    const account = getAccounts().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase() && candidate.password === password && candidate.role === role);
    if (!account) {
      error.textContent = "Invalid email, password, or selected role.";
      return;
    }
    error.textContent = "";
    const session = { name: account.name, email: account.email, role: account.role, initials: account.initials || (account.name || "").split(" ").map((part) => part[0]).slice(0, 2).join(""), title: account.title || roleDetails[account.role].title };
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
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const role = state.selectedAuthRole || "student";
    const error = form.querySelector("[data-auth-error='signup']");
    if (!isRequired(name) || !isRequired(email) || !isRequired(password)) {
      error.textContent = "Enter your details to create an account.";
      return;
    }
    if (role === "student" && !isValidStudentId(form.studentId.value)) {
      error.textContent = "Student ID is required for student accounts.";
      return;
    }
    const accounts = getAccounts();
    if (accounts.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
      error.textContent = "An account with this email already exists.";
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      error.textContent = passwordValidation.message;
      return;
    }
    const newAccount = {
      name,
      email,
      password,
      role,
      initials: getInitials(name) || "U",
      title: roleDetails[role].title
    };
    saveAccounts([...accounts, newAccount]);
    error.textContent = "";
    const session = { name: newAccount.name, email: newAccount.email, role: newAccount.role, initials: newAccount.initials, title: newAccount.title };
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
