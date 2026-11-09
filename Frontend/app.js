const roleDetails = {
  student: { label: "Student", name: "Sofia Reyes", initials: "SR", title: "QCU Student", workspace: "STUDENT WORKSPACE", helpTitle: "Your OJT, in one place", helpCopy: "View requirements, submit your work, and track adviser feedback." },
  adviser: { label: "OJT Adviser", name: "Jamie Dela Cruz", initials: "JD", title: "OJT Adviser", workspace: "ADVISER WORKSPACE", helpTitle: "Keep students on track", helpCopy: "Post classroom work and review student submissions." },
  spards: { label: "SPARDS", name: "SPARDS Office", initials: "SP", title: "Document reviewer", workspace: "SPARDS WORKSPACE", helpTitle: "Placement documents", helpCopy: "View adviser-approved submissions and student MOA/MOU documents." }
};

const defaultAccounts = [
  { name: "Sofia Reyes", email: "student@qcu.edu.ph", password: "student123", role: "student", initials: "SR", title: "QCU Student" },
  { name: "Jamie Dela Cruz", email: "adviser@qcu.edu.ph", password: "adviser123", role: "adviser", initials: "JD", title: "OJT Adviser" },
  { name: "SPARDS Office", email: "spards@qcu.edu.ph", password: "spards123", role: "spards", initials: "SP", title: "Document reviewer" }
];

const state = {
  role: localStorage.getItem("internsync-demo-role") || "student",
  page: "classroom",
  requirements: [],
  submissions: [],
  summary: {},
  filter: "All",
  search: "",
  authMode: "login",
  selectedAuthRole: localStorage.getItem("internsync-auth-role") || "student"
};
const pageContent = document.getElementById("page-content");
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const allowedExtensions = /\.(pdf|doc|docx|txt|jpg|jpeg|png)$/i;

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
    return JSON.parse(localStorage.getItem("internsync-auth-session") || "null");
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem("internsync-auth-session", JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem("internsync-auth-session");
  localStorage.removeItem("internsync-demo-role");
}

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
  });
  const studentIdBox = document.getElementById("student-id-box");
  if (studentIdBox) {
    studentIdBox.style.display = role === "student" ? "grid" : "none";
  }
}

function setAuthMode(mode) {
  state.authMode = mode === "signup" ? "signup" : "login";
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

function mockRoleUser() {
  const session = currentAccount();
  const roleIds = { student: "STU-001", adviser: "ADV-001", spards: "SPARDS-001" };
  return { ...session, userId: roleIds[state.role] || roleIds.student };
}

function mockVisibleToRole(submission, role, userId) {
  if (role === "student") return submission.studentId === userId;
  if (role === "adviser") return submission.documentType === "assignment";
  return submission.status === "Approved" || ["MOA", "MOU"].includes(submission.documentType);
}

function getMockStore() {
  const defaults = {
    requirements: [
      { id: "REQ-001", title: "OJT weekly reflection", description: "Share what you worked on this week, what you learned, and any questions for your adviser.", dueDate: "2026-11-06", createdAt: "2026-10-26T08:00:00.000Z", createdBy: "ADV-001" },
      { id: "REQ-002", title: "Supervisor evaluation", description: "Submit your completed midterm supervisor evaluation for adviser review.", dueDate: "2026-11-13", createdAt: "2026-10-26T08:00:00.000Z", createdBy: "ADV-001" }
    ],
    submissions: [
      { id: "SUB-001", studentId: "STU-001", studentName: "Sofia Reyes", requirementId: "REQ-001", documentType: "assignment", answer: "This week I completed the product dashboard onboarding tasks and reviewed the design handoff with my supervisor.", fileName: "", storedFile: "", mimeType: "", submittedAt: "2026-10-28T08:30:00.000Z", status: "Pending adviser review", feedback: "" },
      { id: "SUB-002", studentId: "STU-001", studentName: "Sofia Reyes", requirementId: "REQ-002", documentType: "assignment", answer: "Please see my submitted midterm evaluation for review.", fileName: "", storedFile: "", mimeType: "", submittedAt: "2026-10-27T09:10:00.000Z", status: "Approved", feedback: "Reviewed. Thank you." },
      { id: "SUB-003", studentId: "STU-001", studentName: "Sofia Reyes", requirementId: "", documentType: "MOU", answer: "Signed company MOU submitted for SPARDS processing.", fileName: "", storedFile: "", mimeType: "", submittedAt: "2026-10-28T09:00:00.000Z", status: "Submitted to SPARDS", feedback: "" }
    ]
  };
  try {
    const saved = JSON.parse(localStorage.getItem("internsync-mock-store") || "null");
    if (saved && Array.isArray(saved.requirements) && Array.isArray(saved.submissions)) return saved;
  } catch (error) {
    // Ignore invalid local storage content and fall back to demo data.
  }
  localStorage.setItem("internsync-mock-store", JSON.stringify(defaults));
  return defaults;
}

function saveMockStore(store) {
  localStorage.setItem("internsync-mock-store", JSON.stringify(store));
}

async function mockApi(path, options = {}) {
  const method = options.method || "GET";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const store = getMockStore();
  const user = mockRoleUser();
  const matchReview = normalized.match(/^\/classroom\/submissions\/([A-Za-z0-9-]+)\/review$/);
  if (method === "GET" && normalized === "/classroom/requirements") return store.requirements;
  if (method === "GET" && normalized === "/classroom/submissions") {
    return store.submissions.filter((submission) => mockVisibleToRole(submission, user.role, user.userId));
  }
  if (method === "GET" && normalized === "/classroom/summary") {
    const submissions = store.submissions.filter((submission) => mockVisibleToRole(submission, user.role, user.userId));
    return {
      requirements: store.requirements.length,
      pendingAdviserReview: store.submissions.filter((item) => item.documentType === "assignment" && item.status === "Pending adviser review").length,
      approvedForSpards: store.submissions.filter((item) => item.documentType === "assignment" && item.status === "Approved").length,
      pendingSpardsDocuments: store.submissions.filter((item) => ["MOA", "MOU"].includes(item.documentType)).length,
      submissions: submissions.length
    };
  }
  if (method === "POST" && normalized === "/classroom/requirements") {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
    const requirement = {
      id: `REQ-${Date.now().toString().slice(-6)}`,
      title: String(body.title || "").trim().slice(0, 120),
      description: String(body.description || "").trim().slice(0, 2000),
      dueDate: String(body.dueDate || ""),
      createdAt: new Date().toISOString(),
      createdBy: user.userId
    };
    if (!requirement.title || !requirement.description || !/\d{4}-\d{2}-\d{2}/.test(requirement.dueDate)) {
      throw new Error("Add a title, instructions under 2,000 characters, and a valid due date.");
    }
    store.requirements.unshift(requirement);
    saveMockStore(store);
    return requirement;
  }
  if (method === "POST" && normalized === "/classroom/submissions") {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
    const documentType = ["assignment", "MOA", "MOU"].includes(body.documentType) ? body.documentType : "";
    const answer = String(body.answer || "").trim();
    if (!documentType || answer.length > 5000) throw new Error("Choose an assignment, MOA, or MOU and keep the answer under 5,000 characters.");
    const requirementId = documentType === "assignment" ? String(body.requirementId || "") : "";
    const existing = store.submissions.find((item) => item.studentId === user.userId && item.documentType === documentType && item.requirementId === requirementId);
    if (existing && existing.status !== "Returned" && existing.status !== "Needs revision") {
      throw new Error("This document has already been submitted and cannot be changed while it is under review.");
    }
    const record = {
      id: existing?.id || `SUB-${Date.now().toString().slice(-6)}`,
      studentId: user.userId,
      studentName: user.name,
      requirementId,
      documentType,
      answer,
      fileName: body.file?.name || "",
      storedFile: "",
      mimeType: body.file?.type || "",
      submittedAt: new Date().toISOString(),
      status: documentType === "assignment" ? "Pending adviser review" : "Submitted to SPARDS",
      feedback: ""
    };
    if (existing) Object.assign(existing, record); else store.submissions.unshift(record);
    saveMockStore(store);
    return record;
  }
  if (matchReview && method === "PATCH") {
    const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
    const submission = store.submissions.find((item) => item.id === matchReview[1]);
    if (!submission) throw new Error("Submission not found.");
    if (user.role !== "adviser") throw new Error("Students cannot review submissions.");
    if (submission.documentType !== "assignment") throw new Error("OJT advisers can review classroom assignments only.");
    if (!["Approved", "Returned"].includes(body.status)) throw new Error("Choose Approved or Returned.");
    submission.status = body.status;
    submission.feedback = String(body.feedback || "").trim().slice(0, 1000);
    saveMockStore(store);
    return submission;
  }
  if (method === "GET" && normalized === "/session") {
    return { user, roles: Object.values(roleDetails).map((profile, index) => ({ role: Object.keys(roleDetails)[index], userId: { student: "STU-001", adviser: "ADV-001", spards: "SPARDS-001" }[Object.keys(roleDetails)[index]], name: profile.name, title: profile.title })) };
  }
  throw new Error("Mock endpoint not found.");
}

async function api(path, options = {}) {
  try {
    const response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", "X-Demo-Role": state.role, ...(options.headers || {}) }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (response.ok) return data;
    throw new Error(data.error || "Something went wrong. Please try again.");
  } catch (error) {
    try {
      return await mockApi(path, options);
    } catch (mockError) {
      throw new Error(mockError.message || "Something went wrong. Please try again.");
    }
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function statusClass(status) { return `status-${status.toLowerCase().replaceAll(" ", "-")}`; }
function statusPill(status) { return `<span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>`; }
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function requirementFor(id) { return state.requirements.find((requirement) => requirement.id === id); }
function submissionFor(requirementId) { return state.submissions.find((submission) => submission.requirementId === requirementId && submission.documentType === "assignment"); }
function fileLink(submission) {
  return submission.hasFile ? `<a class="document-link" href="/api/classroom/submissions/${encodeURIComponent(submission.id)}/file" data-download download="${escapeHtml(submission.fileName)}">${escapeHtml(submission.fileName)} <span>↓</span></a>` : "";
}
function heading(title, description, action = "") {
  return `<div class="page-heading"><div><h1>${title}</h1><p>${description}</p></div>${action ? `<div class="heading-actions">${action}</div>` : ""}</div>`;
}
function statCard(label, value, note, icon, tone = "") {
  return `<article class="stat-card"><div class="stat-top"><span>${escapeHtml(label)}</span><span class="stat-icon ${tone}">${icon}</span></div><div class="stat-value"><strong>${value}</strong></div><div class="stat-foot">${escapeHtml(note)}</div></article>`;
}

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
  document.getElementById("app-shell").dataset.role = state.role;
  document.getElementById("workspace-label").textContent = profile.workspace;
  document.getElementById("profile-initials").textContent = account.initials || profile.initials;
  document.getElementById("profile-name").textContent = account.name || profile.name;
  document.getElementById("profile-role").textContent = account.title || profile.title;
  document.getElementById("help-title").textContent = profile.helpTitle;
  document.getElementById("help-copy").textContent = profile.helpCopy;
  const roleSelect = document.getElementById("role-select");
  if (roleSelect) roleSelect.value = state.role;
  const topAvatar = document.getElementById("topbar-avatar");
  if (topAvatar) topAvatar.textContent = account.initials || profile.initials;
  const topbarName = document.getElementById("topbar-name");
  if (topbarName) topbarName.textContent = account.name || profile.name;
  const topbarRole = document.getElementById("topbar-role");
  if (topbarRole) topbarRole.textContent = account.title || profile.title;
}

function setNavigation() {
  const pages = state.role === "adviser"
    ? [["classroom", "⌂", "Classroom"], ["review", "✓", "Review submissions"]]
    : state.role === "spards"
      ? [["classroom", "⌂", "Overview"], ["documents", "▤", "Documents"]]
      : [["classroom", "⌂", "My classroom"], ["documents", "▤", "My documents"]];
  const nav = document.querySelector(".main-nav");
  const badgeCount = state.role === "student"
    ? state.submissions.length
    : state.role === "adviser"
      ? state.submissions.filter((submission) => submission.status === "Pending adviser review").length
      : state.submissions.filter((submission) => submission.status === "Approved" || ["MOA", "MOU"].includes(submission.documentType)).length;
  nav.innerHTML = pages.map(([page, icon, label]) => `<button class="nav-link ${state.page === page ? "active" : ""}" data-page="${page}"><span class="nav-icon">${icon}</span>${label}${page === "documents" || page === "review" ? `<span class="nav-count${badgeCount > 0 ? ' alert-count' : ''}">${badgeCount}</span>` : ""}</button>`).join("");
}

function studentClassroom() {
  const studentName = currentAccount().name.split(" ")[0];
  const assignmentCount = state.requirements.length;
  const submittedCount = state.requirements.filter((item) => submissionFor(item.id)).length;
  const cards = state.requirements.map((requirement) => {
    const submission = submissionFor(requirement.id);
    const canSubmit = !submission || submission.status === "Returned";
    return `<article class="class-card"><div class="class-card-top"><span class="class-icon">▤</span>${submission ? statusPill(submission.status) : statusPill("Not submitted")}</div><h2>${escapeHtml(requirement.title)}</h2><p class="class-instructions">${escapeHtml(requirement.description)}</p><div class="class-meta"><span>Due ${formatDate(requirement.dueDate)}</span>${submission ? `<span>Submitted ${formatDate(submission.submittedAt)}</span>` : `<span>Classroom assignment</span>`}</div>${submission?.feedback ? `<div class="feedback-note"><strong>Adviser feedback</strong><p>${escapeHtml(submission.feedback)}</p></div>` : ""}${submission?.answer && !canSubmit ? `<div class="answer-preview"><strong>Your answer</strong><p>${escapeHtml(submission.answer)}</p>${fileLink(submission)}</div>` : ""}${canSubmit ? `<form class="submission-form" data-submission-form data-document-type="assignment" data-requirement-id="${escapeHtml(requirement.id)}"><label class="field-label" for="answer-${escapeHtml(requirement.id)}">${submission ? "Update your response" : "Your response"}</label><textarea class="form-control answer-input" id="answer-${escapeHtml(requirement.id)}" name="answer" maxlength="5000" placeholder="Write an answer or add a note about your attached document...">${submission ? escapeHtml(submission.answer) : ""}</textarea><div class="upload-row"><label class="file-picker">＋ Attach document<input type="file" name="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"></label><span class="file-name">PDF, Word, TXT or image · max 5 MB</span></div><div class="form-error" role="alert"></div><button class="button button-primary" type="submit">${submission ? "Resubmit for review" : "Submit to adviser"} <span>↗</span></button></form>` : ""}</article>`;
  }).join("");
  const agreementStatus = state.submissions.find((item) => ["MOA", "MOU"].includes(item.documentType))?.status || "Not sent";
  return `${heading("My classroom", "Your OJT requirements and adviser feedback, all in one place.")}<div class="welcome-banner"><div class="welcome-copy"><span class="eyebrow">QCU · ON-THE-JOB TRAINING</span><h2>Welcome back, ${escapeHtml(studentName)} <span>✦</span></h2><p>Keep your documents up to date and your OJT adviser in the loop.</p></div><div class="welcome-stat"><div class="spark">▤</div><div><strong>${submittedCount} / ${assignmentCount}</strong><span>requirements submitted</span></div></div></div><div class="stats-grid">${statCard("OJT status", "Ongoing", "Your internship is in progress", "◉", "green")}${statCard("Requirements", `${submittedCount} / ${assignmentCount}`, "Submitted to your adviser", "✓")}${statCard("MOA / MOU status", agreementStatus, "Placement document status", "▧", "red")}</div><div class="section-title"><div><h2>Classwork</h2><p>Read the instructions, then submit your answer or document.</p></div><button class="button button-quiet" data-page="documents">MOA / MOU documents <span>↗</span></button></div><div class="classroom-grid">${cards || `<section class="panel empty-state">Your adviser has not posted any requirements yet.</section>`}</div>`;
}

function adviserClassroom() {
  const adviserName = currentAccount().name.split(" ")[0];
  const pending = state.submissions.filter((item) => item.documentType === "assignment" && item.status === "Pending adviser review");
  const reviewed = state.submissions.filter((item) => item.documentType === "assignment" && item.status !== "Pending adviser review");
  return `${heading("Adviser classroom", "Post requirements for your students and follow their OJT progress.", `<button class="button button-primary" id="create-requirement">＋ Post a requirement</button>`)}<div class="welcome-banner"><div class="welcome-copy"><span class="eyebrow">OJT ADVISER WORKSPACE</span><h2>Your classroom is ready, ${escapeHtml(adviserName)} <span>✦</span></h2><p>Keep instructions clear and give students timely feedback on their work.</p></div><div class="welcome-stat"><div class="spark">◷</div><div><strong>${pending.length}</strong><span>submissions to review</span></div></div></div><div class="stats-grid">${statCard("Classroom requirements", state.requirements.length, "Posted for your students", "▤")}${statCard("Waiting for review", pending.length, "Student submissions", "◷", "gold")}${statCard("Approved for SPARDS", state.submissions.filter((item) => item.documentType === "assignment" && item.status === "Approved").length, "Forwarded to SPARDS view", "✓", "green")}${statCard("Returned to students", state.submissions.filter((item) => item.status === "Returned").length, "Needs student updates", "↩", "red")}</div><div class="section-title"><div><h2>Classroom requirements</h2><p>${state.requirements.length} active requirements visible to students.</p></div><button class="text-button" data-page="review">Review submissions <span>↗</span></button></div><div class="classroom-grid">${state.requirements.map((requirement) => `<article class="class-card"><div class="class-card-top"><span class="class-icon">▤</span><span class="status-pill status-active">Due ${formatDate(requirement.dueDate)}</span></div><h2>${escapeHtml(requirement.title)}</h2><p class="class-instructions">${escapeHtml(requirement.description)}</p><div class="class-meta"><span>${state.submissions.filter((item) => item.requirementId === requirement.id).length} submissions</span><span>Posted ${formatDate(requirement.createdAt)}</span></div></article>`).join("") || `<section class="panel empty-state">Post your first classroom requirement for students.</section>`}${reviewed.length ? `<article class="class-card compact-callout"><span class="class-icon">✓</span><h2>${reviewed.length} reviewed submissions</h2><p class="class-instructions">Approved work is visible to SPARDS. Returned work is available for student resubmission.</p><button class="text-button" data-page="review">Open review queue <span>↗</span></button></article>` : ""}</div>`;
}

function spardsClassroom() {
  const approved = state.submissions.filter((item) => item.documentType === "assignment" && item.status === "Approved").length;
  const agreements = state.submissions.filter((item) => ["MOA", "MOU"].includes(item.documentType)).length;
  return `${heading("SPARDS overview", "View adviser-approved student work and agreements submitted for placement.")}<div class="welcome-banner"><div class="welcome-copy"><span class="eyebrow">SPARDS DOCUMENT WORKSPACE</span><h2>Placement documents, in one place <span>✦</span></h2><p>Only adviser-approved classroom submissions and student-submitted MOA/MOU documents appear here.</p></div><div class="welcome-stat"><div class="spark">▧</div><div><strong>${approved + agreements}</strong><span>documents available</span></div></div></div><div class="stats-grid">${statCard("Approved OJT documents", approved, "Cleared by the OJT adviser", "✓", "green")}${statCard("MOA / MOU submitted", agreements, "Shared directly by students", "▧", "red")}${statCard("Classroom requirements", state.requirements.length, "Published by OJT advisers", "▤")}${statCard("Student submissions", state.submissions.length, "Documents in your view", "♙", "gold")}</div><div class="section-title"><div><h2>Document access</h2><p>Browse files and notes shared with your office.</p></div><button class="button button-primary" data-page="documents">Open documents <span>↗</span></button></div>`;
}

function classroomTemplate() {
  if (state.role === "student") return studentClassroom();
  if (state.role === "adviser") return adviserClassroom();
  return spardsClassroom();
}

function studentDocuments() {
  const agreements = state.submissions.filter((item) => ["MOA", "MOU"].includes(item.documentType));
  const cards = agreements.map((item) => `<article class="document-card"><div class="document-card-heading"><span class="class-icon">▧</span>${statusPill(item.status)}</div><h3>${escapeHtml(item.documentType)} agreement</h3><p>${escapeHtml(item.answer || "Signed agreement uploaded for SPARDS.")}</p>${fileLink(item)}<small>Submitted ${formatDate(item.submittedAt)}</small>${item.feedback ? `<div class="feedback-note"><strong>SPARDS feedback</strong><p>${escapeHtml(item.feedback)}</p></div>` : ""}</article>`).join("");
  return `${heading("My documents", "Submit your signed MOA/MOU directly to SPARDS and track the handoff.")}<section class="panel agreement-panel"><div class="panel-head"><div><h2>Submit a placement agreement</h2><p>Upload your signed Memorandum of Agreement or Understanding for SPARDS.</p></div><span class="status-pill status-shortlisted">Direct to SPARDS</span></div><form class="agreement-form submission-form" data-submission-form data-document-type="agreement"><div class="form-row"><div><label class="field-label" for="agreement-type">Document type</label><select class="form-control" id="agreement-type" name="documentType"><option value="MOA">Memorandum of Agreement (MOA)</option><option value="MOU">Memorandum of Understanding (MOU)</option></select></div><div><label class="field-label" for="agreement-file">Signed document</label><input class="form-control file-input" id="agreement-file" type="file" name="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"></div></div><label class="field-label" for="agreement-answer">Note for SPARDS <span class="optional-label">optional when a file is attached</span></label><textarea class="form-control answer-input" id="agreement-answer" name="answer" maxlength="5000" placeholder="Add the company name or any context SPARDS should know..."></textarea><div class="form-error" role="alert"></div><button class="button button-primary" type="submit">Submit agreement to SPARDS <span>↗</span></button></form></section><div class="section-title"><div><h2>Agreement history</h2><p>Your submitted MOA and MOU documents.</p></div></div><div class="document-grid">${cards || `<section class="panel empty-state">You haven’t submitted an MOA or MOU yet.</section>`}</div>`;
}

function documentCard(submission) {
  const requirement = requirementFor(submission.requirementId);
  return `<article class="document-card"><div class="document-card-heading"><span class="class-icon">${submission.documentType === "assignment" ? "▤" : "▧"}</span>${statusPill(submission.status)}</div><h3>${submission.documentType === "assignment" ? escapeHtml(requirement?.title || "OJT submission") : `${escapeHtml(submission.documentType)} agreement`}</h3><p class="student-name">${escapeHtml(submission.studentName)}</p>${submission.answer ? `<p>${escapeHtml(submission.answer)}</p>` : ""}${fileLink(submission)}<small>Submitted ${formatDate(submission.submittedAt)}</small></article>`;
}

function documentsTemplate() {
  if (state.role === "student") return studentDocuments();
  const visible = state.role === "spards"
    ? state.submissions.filter((item) => item.status === "Approved" || ["MOA", "MOU"].includes(item.documentType))
    : state.submissions;
  const matches = visible.filter((item) => {
    const requirement = requirementFor(item.requirementId);
    const query = state.search.toLowerCase();
    return !query || `${item.studentName} ${item.documentType} ${item.answer} ${requirement?.title || ""}`.toLowerCase().includes(query);
  });
  const title = state.role === "spards" ? "SPARDS documents" : "All submitted documents";
  const description = state.role === "spards"
    ? "Adviser-approved classroom work and student-submitted MOA/MOU agreements."
    : "Every document submitted by your student for OJT requirements.";
  return `${heading(title, description)}<div class="page-toolbar"><span class="muted-count">${matches.length} documents available</span><input class="inline-search" data-search placeholder="Search student or document..." value="${escapeHtml(state.search)}" aria-label="Search documents"></div><div class="document-grid">${matches.map(documentCard).join("") || `<section class="panel empty-state">No documents are available for this view yet.</section>`}</div>`;
}

function reviewTemplate() {
  const items = state.submissions.filter((item) => item.documentType === "assignment" && (state.filter === "All" || item.status === state.filter));
  const filtered = items.filter((item) => {
    const requirement = requirementFor(item.requirementId);
    const query = state.search.toLowerCase();
    return !query || `${item.studentName} ${item.answer} ${requirement?.title || ""}`.toLowerCase().includes(query);
  });
  return `${heading("Review submissions", "Read student responses, approve completed work, or return it with feedback.")}<div class="page-toolbar"><div class="filter-tabs" role="tablist" aria-label="Submission status filters">${["All", "Pending adviser review", "Approved", "Returned"].map((filter) => `<button class="filter-tab ${state.filter === filter ? "active" : ""}" data-filter="${escapeHtml(filter)}">${filter === "Pending adviser review" ? "Pending" : filter}</button>`).join("")}</div><input class="inline-search" data-search placeholder="Search students or assignments..." value="${escapeHtml(state.search)}" aria-label="Search submissions"></div><div class="review-list">${filtered.map((submission) => {
    const requirement = requirementFor(submission.requirementId);
    const reviewActions = submission.status === "Pending adviser review"
      ? `<div class="review-actions"><input class="status-select feedback-input" data-feedback="${escapeHtml(submission.id)}" maxlength="1000" placeholder="Feedback (optional)" aria-label="Feedback for ${escapeHtml(submission.studentName)}"><button class="button button-primary button-small" data-review="Approved" data-submission="${escapeHtml(submission.id)}">Approve</button><button class="button button-quiet button-small" data-review="Returned" data-submission="${escapeHtml(submission.id)}">Return</button></div>`
      : `<span class="review-complete">Reviewed ${formatDate(submission.reviewedAt || submission.submittedAt)}</span>`;
    return `<article class="review-card"><div class="review-card-heading"><div><span class="eyebrow">${escapeHtml(requirement?.title || "OJT assignment")}</span><h2>${escapeHtml(submission.studentName)}</h2></div>${statusPill(submission.status)}</div><p class="review-answer">${escapeHtml(submission.answer || "Document submitted without a written note.")}</p>${fileLink(submission)}<div class="review-card-footer"><span>Submitted ${formatDate(submission.submittedAt)}</span>${reviewActions}</div>${submission.feedback ? `<div class="feedback-note"><strong>Adviser feedback</strong><p>${escapeHtml(submission.feedback)}</p></div>` : ""}</article>`;
  }).join("") || `<section class="panel empty-state">No submissions match this filter.</section>`}</div>`;
}

function renderPage() {
  const labels = { classroom: state.role === "student" ? "My classroom" : state.role === "adviser" ? "Classroom" : "Overview", documents: state.role === "spards" ? "Documents" : "My documents", review: "Review submissions" };
  const pageTitles = {
    student: { classroom: "OJT Student Dashboard", documents: "My OJT Documents" },
    adviser: { classroom: "OJT Adviser Dashboard", review: "Review Submissions" },
    spards: { classroom: "SPARDS Dashboard", documents: "Document Review" }
  };
  const templates = { classroom: classroomTemplate, documents: documentsTemplate, review: reviewTemplate };
  const currentPageLabel = labels[state.page] || labels.classroom;
  const workspaceHeading = document.getElementById("workspace-heading");
  if (workspaceHeading) workspaceHeading.textContent = pageTitles[state.role]?.[state.page] || currentPageLabel;
  setNavigation();
  pageContent.innerHTML = (templates[state.page] || classroomTemplate)();
  document.getElementById("sidebar").classList.remove("open");
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.getElementById("toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 3200);
}

function openRequirementModal() {
  const backdrop = document.getElementById("modal-backdrop");
  document.getElementById("workflow-modal").innerHTML = `<div class="modal-heading"><div><span class="eyebrow">CLASSROOM</span><h2 id="modal-title">Post a requirement</h2></div><button class="icon-button close-modal" aria-label="Close">×</button></div><p class="modal-intro">Students in your OJT classroom will be able to see and respond to this requirement.</p><form id="requirement-form"><label class="field-label" for="requirement-title">Requirement title</label><input class="form-control" id="requirement-title" name="title" maxlength="120" placeholder="e.g. Monthly OJT journal" required><label class="field-label" for="requirement-description">Instructions</label><textarea class="form-control answer-input" id="requirement-description" name="description" maxlength="2000" placeholder="Explain what students need to submit..." required></textarea><label class="field-label" for="requirement-due">Due date</label><input class="form-control" id="requirement-due" name="dueDate" type="date" required><div class="form-error" role="alert"></div><div class="modal-actions"><button type="button" class="button button-quiet close-modal">Cancel</button><button type="submit" class="button button-primary">Post requirement <span>↗</span></button></div></form>`;
  backdrop.hidden = false;
  document.getElementById("requirement-title").focus();
}

function closeModal() {
  document.getElementById("modal-backdrop").hidden = true;
}

function readFile(file) {
  if (!file || !file.name) return Promise.resolve(null);
  if (!allowedExtensions.test(file.name)) throw new Error("Choose a PDF, Word, TXT, JPG, or PNG document.");
  if (file.size > MAX_FILE_BYTES) throw new Error("The document must be 5 MB or smaller.");
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
    sidebarEl.classList.remove("open");
  }
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) {
    setAuthMode(authMode.dataset.authMode);
    return;
  }
  const roleOption = event.target.closest("[data-role-option]");
  if (roleOption) {
    setAuthRole(roleOption.dataset.roleOption);
    return;
  }
  if (event.target.closest("#logout-button")) {
    clearSession();
    updateAuthView();
    showToast("You have been logged out.");
    return;
  }
  const navigation = event.target.closest("[data-page]");
  if (navigation) {
    state.page = navigation.dataset.page === "dashboard" ? "classroom" : navigation.dataset.page;
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
      showToast(error.message);
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
  if (event.target.closest("#mobile-menu")) { document.getElementById("sidebar").classList.toggle("open"); return; }
  const reviewButton = event.target.closest("[data-review]");
  if (reviewButton) {
    reviewButton.disabled = true;
    const id = reviewButton.dataset.submission;
    const feedback = pageContent.querySelector(`[data-feedback="${CSS.escape(id)}"]`)?.value || "";
    try {
      await api(`/classroom/submissions/${encodeURIComponent(id)}/review`, { method: "PATCH", body: JSON.stringify({ status: reviewButton.dataset.review, feedback }) });
      await refreshData();
      showToast(reviewButton.dataset.review === "Approved" ? "Submission approved and shared with SPARDS." : "Submission returned to the student with feedback.");
    } catch (error) {
      reviewButton.disabled = false;
      showToast(error.message);
    }
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-search]") || event.target.matches(".search-box input")) {
    const isTopbar = event.target.matches(".search-box input");
    state.search = event.target.value;
    if (isTopbar && state.page === "classroom") {
      state.page = state.role === "adviser" ? "review" : "documents";
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
  if ((event.target.id === "login-role" || event.target.id === "signup-role") && roleDetails[event.target.value]) {
    setAuthRole(event.target.value);
    return;
  }
  if (event.target.id !== "role-select" || !roleDetails[event.target.value]) return;
  state.role = event.target.value;
  state.page = "classroom";
  state.filter = "All";
  state.search = "";
  localStorage.setItem("internsync-demo-role", state.role);
  loadData().catch((error) => showToast(error.message));
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
    localStorage.setItem("internsync-demo-role", account.role);
    updateAuthView();
    updateProfile();
    await loadData();
    showToast(`Welcome back, ${account.name.split(" ")[0]}.`);
    return;
  }
  if (form.id === "signup-form") {
    event.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    const role = state.selectedAuthRole || "student";
    const error = form.querySelector("[data-auth-error='signup']");
    if (!name || !email || !password) {
      error.textContent = "Enter your details to create an account.";
      return;
    }
    if (role === "student" && !form.studentId.value.trim()) {
      error.textContent = "Student ID is required for student accounts.";
      return;
    }
    const accounts = getAccounts();
    if (accounts.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
      error.textContent = "An account with this email already exists.";
      return;
    }
    if (password.length < 6) {
      error.textContent = "Use at least 6 characters for your password.";
      return;
    }
    const newAccount = {
      name,
      email,
      password,
      role,
      initials: name.split(" ").map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "U",
      title: roleDetails[role].title
    };
    saveAccounts([...accounts, newAccount]);
    error.textContent = "";
    const session = { name: newAccount.name, email: newAccount.email, role: newAccount.role, initials: newAccount.initials, title: newAccount.title };
    saveSession(session);
    state.role = newAccount.role;
    localStorage.setItem("internsync-demo-role", newAccount.role);
    updateAuthView();
    updateProfile();
    await loadData();
    showToast(`Welcome, ${newAccount.name.split(" ")[0]}!`);
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
      showToast("Requirement posted to the classroom.");
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
    showToast(documentType === "assignment" ? "Your work was submitted to your OJT adviser." : `${documentType} submitted to SPARDS.`);
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
  loadData().catch((error) => {
    pageContent.innerHTML = `<section class="panel empty-state">We couldn’t connect to the InternSync classroom.<br><br>${escapeHtml(error.message)}<br><br><button class="button button-quiet" onclick="location.reload()">Try again</button></section>`;
  });
}
