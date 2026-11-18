const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const DATA_DIR = process.env.INTERNSYNC_DATA_DIR
  ? path.resolve(process.env.INTERNSYNC_DATA_DIR)
  : path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DEFAULT_PORT = 3000;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = 7 * 1024 * 1024;
let prismaClient;

const demoUsers = {
  student: { role: "student", userId: "STU-001", name: "Sofia Reyes", initials: "SR", title: "QCU Student" },
  adviser: { role: "adviser", userId: "ADV-001", name: "Jamie Dela Cruz", initials: "JD", title: "OJT Adviser" },
  spards: { role: "spards", userId: "SPARDS-001", name: "SPARDS Office", initials: "SP", title: "SPARDS" }
};

const initialData = {
  internships: [
    { id: "INT-2401", title: "Junior UI/UX Designer", companyId: "CMP-01", department: "Design", type: "Hybrid", slots: 4, applicants: 18, status: "Active", posted: "2026-10-24" },
    { id: "INT-2402", title: "Frontend Developer Intern", companyId: "CMP-02", department: "Technology", type: "Remote", slots: 6, applicants: 24, status: "Active", posted: "2026-10-22" },
    { id: "INT-2403", title: "Marketing & Social Media Intern", companyId: "CMP-03", department: "Marketing", type: "On-site", slots: 3, applicants: 12, status: "Active", posted: "2026-10-20" },
    { id: "INT-2404", title: "Data Analytics Intern", companyId: "CMP-04", department: "Technology", type: "Hybrid", slots: 2, applicants: 9, status: "Under review", posted: "2026-10-18" },
    { id: "INT-2405", title: "Human Resources Intern", companyId: "CMP-05", department: "Human Resources", type: "On-site", slots: 3, applicants: 15, status: "Active", posted: "2026-10-16" }
  ],
  applicants: [
    { id: "APP-1082", name: "Sofia Reyes", initials: "SR", course: "BS Information Technology", year: "4th Year", internshipId: "INT-2402", applied: "2026-10-28", status: "Pending" },
    { id: "APP-1081", name: "Miguel Santos", initials: "MS", course: "BS Computer Science", year: "4th Year", internshipId: "INT-2401", applied: "2026-10-27", status: "Shortlisted" },
    { id: "APP-1080", name: "Angela Cruz", initials: "AC", course: "BS Information Technology", year: "3rd Year", internshipId: "INT-2403", applied: "2026-10-27", status: "Pending" },
    { id: "APP-1079", name: "Joshua Mendoza", initials: "JM", course: "BS Accountancy", year: "4th Year", internshipId: "INT-2405", applied: "2026-10-26", status: "For interview" },
    { id: "APP-1078", name: "Camille Garcia", initials: "CG", course: "BS Computer Science", year: "4th Year", internshipId: "INT-2402", applied: "2026-10-25", status: "Shortlisted" },
    { id: "APP-1077", name: "Nathan Flores", initials: "NF", course: "BS Information Technology", year: "3rd Year", internshipId: "INT-2404", applied: "2026-10-24", status: "Pending" },
    { id: "APP-1076", name: "Patricia Lim", initials: "PL", course: "BS Business Administration", year: "4th Year", internshipId: "INT-2403", applied: "2026-10-23", status: "Accepted" }
  ],
  companies: [
    { id: "CMP-01", name: "BrightLabs Creative", industry: "Design & Creative", location: "Quezon City", internships: 2, logo: "B", color: "coral" },
    { id: "CMP-02", name: "Nexa Digital Solutions", industry: "Information Technology", location: "Makati City", internships: 3, logo: "N", color: "blue" },
    { id: "CMP-03", name: "GoodKind Marketing", industry: "Marketing & Advertising", location: "Quezon City", internships: 2, logo: "G", color: "green" },
    { id: "CMP-04", name: "Datawise Philippines", industry: "Technology", location: "Pasig City", internships: 1, logo: "D", color: "purple" },
    { id: "CMP-05", name: "PeopleFirst Group", industry: "Human Resources", location: "Quezon City", internships: 2, logo: "P", color: "amber" }
  ],
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

function readStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) {
    fs.writeFileSync(STORE_FILE, `${JSON.stringify(initialData, null, 2)}\n`);
  }
  const store = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
  let changed = false;
  for (const key of ["requirements", "submissions"]) {
    if (!Array.isArray(store[key])) {
      store[key] = initialData[key];
      changed = true;
    }
  }
  if (changed) saveStore(store);
  return store;
}

function saveStore(store) {
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`);
}

function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }
  if (!prismaClient) {
    const { createPrismaClient } = require("./prisma-client");
    prismaClient = createPrismaClient();
  }
  return prismaClient;
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_REQUEST_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    request.on("error", reject);
  });
}

function publicSubmission(submission) {
  const { storedFile, ...publicData } = submission;
  return { ...publicData, hasFile: Boolean(storedFile) };
}

function roleUser(request) {
  return demoUsers[request.headers["x-demo-role"]] || null;
}

function requireRole(request, response, allowedRoles) {
  const user = roleUser(request);
  if (!user) {
    sendJson(response, 401, { error: "Select a demo role before using this workflow." });
    return null;
  }
  if (!allowedRoles.includes(user.role)) {
    sendJson(response, 403, { error: "This action is not available for your selected demo role." });
    return null;
  }
  return user;
}

function visibleToRole(submission, role, userId) {
  if (role === "student") return submission.studentId === userId;
  if (role === "adviser") return submission.documentType === "assignment";
  return submission.status === "Approved" || ["MOA", "MOU"].includes(submission.documentType);
}

function safeFilename(filename) {
  return path.basename(String(filename)).replace(/[^\w.-]/g, "_").slice(0, 120);
}

function saveAttachment(body) {
  if (!body.file) return { fileName: "", storedFile: "", mimeType: "" };
  const file = body.file;
  if (typeof file.name !== "string" || typeof file.data !== "string" || typeof file.type !== "string") {
    throw new Error("Provide a valid document file.");
  }
  const fileName = safeFilename(file.name);
  const extension = path.extname(fileName).toLowerCase();
  const allowedTypes = {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword", "application/octet-stream"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/octet-stream"],
    ".txt": ["text/plain"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".png": ["image/png"]
  };
  if (!allowedTypes[extension] || !allowedTypes[extension].includes(file.type)) {
    throw new Error("Upload a PDF, Word document, TXT, JPG, or PNG file.");
  }
  const encoded = file.data.replace(/^data:[^,]*;base64,/, "");
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error("The document file could not be read.");
  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    throw new Error("Documents must be between 1 byte and 5 MB.");
  }
  const storedFile = `${crypto.randomUUID()}${extension}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, storedFile), buffer, { flag: "wx" });
  return { fileName, storedFile, mimeType: allowedTypes[extension][0] };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, passwordHash) {
  const [saltHex, hashHex] = passwordHash.split(":");
  if (!/^[a-f0-9]{32}$/i.test(saltHex || "") || !/^[a-f0-9]{128}$/i.test(hashHex || "")) return false;
  const expectedHash = Buffer.from(hashHex, "hex");
  const actualHash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), expectedHash.length);
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function formatStudentName(user) {
  const middleInitial = user.middleName?.trim().replace(/\.$/, "").charAt(0);
  return [user.firstName, middleInitial ? `${middleInitial.toLocaleUpperCase()}.` : "", user.lastName]
    .filter(Boolean)
    .join(" ");
}

function normalizeLocationName(name) {
  return name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

function validateProfileLicenses(value) {
  if (!Array.isArray(value) || value.length > 100) return null;
  const licenses = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return null;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const issuer = typeof item.issuer === "string" ? item.issuer.trim() : "";
    const issueDate = typeof item.issueDate === "string" ? item.issueDate.trim() : "";
    const expiryDate = typeof item.expiryDate === "string" ? item.expiryDate.trim() : "";
    const credentialId = typeof item.credentialId === "string" ? item.credentialId.trim() : "";
    const credentialUrl = typeof item.credentialUrl === "string" ? item.credentialUrl.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";
    const skills = validateProfileSkills(item.skills === undefined ? [] : item.skills);
    if (!name || name.length > 200 || !issuer || issuer.length > 200
      || issueDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(issueDate)
      || expiryDate && !/^\d{4}-(0[1-9]|1[0-2])$/.test(expiryDate)
      || credentialId.length > 80 || credentialUrl.length > 2048 || description.length > 1000
      || !skills) return null;
    if (credentialUrl) {
      try {
        const url = new URL(credentialUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      } catch {
        return null;
      }
    }
    licenses.push({
      id: typeof item.id === "string" && item.id.length <= 100 ? item.id : crypto.randomUUID(),
      name,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      description,
      skills
    });
  }
  return licenses;
}

function validateProfileSkills(value) {
  if (!Array.isArray(value) || value.length > 100) return null;
  const skills = [];
  const normalizedSkills = new Set();
  for (const item of value) {
    if (typeof item !== "string") return null;
    const skill = item.trim();
    const normalized = skill.toLocaleLowerCase("en-US");
    if (!skill || skill.length > 100 || normalizedSkills.has(normalized)) return null;
    normalizedSkills.add(normalized);
    skills.push(skill);
  }
  return skills;
}

function studentProfileResponse(user) {
  const student = user.studentProfile;
  const program = student.program;
  return {
    id: user.id,
    email: user.email,
    role: "student",
    firstName: user.firstName,
    middleName: user.middleName || "",
    lastName: user.lastName,
    name: formatStudentName(user),
    studentNumber: student.studentNumber,
    programId: program.id,
    programName: program.name,
    collegeId: program.college.id,
    collegeName: program.college.name,
    yearLevel: program.college.ojtYearLevel === "THIRD" ? "3rd Year" : "4th Year",
    phone: student.contactNumber || "",
    streetAddress: student.streetAddress || "",
    barangay: student.barangay || "",
    city: student.city || "",
    postalCode: student.postalCode || "",
    partnerCompany: student.partnerCompany || "",
    ojtPeriod: student.ojtPeriod || "",
    licenses: JSON.parse(student.licensesJson || "[]"),
    skills: JSON.parse(student.skillsJson || "[]")
  };
}

async function findAuthenticatedStudent(request) {
  const authorization = request.headers.authorization;
  const match = typeof authorization === "string" ? authorization.match(/^Bearer ([a-f0-9]{64})$/i) : null;
  if (!match) return null;

  const session = await getPrismaClient().session.findUnique({
    where: { tokenHash: hashSessionToken(match[1]) },
    include: {
      user: {
        include: {
          studentProfile: {
            include: { program: { include: { college: true } } }
          }
        }
      }
    }
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || !session.user.isActive
    || session.user.role !== "STUDENT" || !session.user.studentProfile) return null;
  return session;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(url.pathname);

  if (request.method === "GET" && pathname === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/student-signup") {
    try {
      const body = await readBody(request);
      const studentNumber = typeof body.studentNumber === "string" ? body.studentNumber.trim() : "";
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const submittedFirstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
      const submittedLastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
      const hasExplicitNames = typeof body.firstName === "string" || typeof body.lastName === "string";
      const name = hasExplicitNames
        ? [submittedFirstName, submittedLastName].filter(Boolean).join(" ")
        : typeof body.name === "string" ? body.name.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      const programId = typeof body.programId === "string" ? body.programId : "";
      if (!/^\d{2}-\d{4}$/.test(studentNumber)) {
        sendJson(response, 400, { error: "Enter a student ID in the format 23-1924." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
        sendJson(response, 400, { error: "Enter a valid email address." });
        return;
      }
      if (!name || name.length > 200 || (hasExplicitNames && (!submittedFirstName || !submittedLastName))
        || password.trim().length < 6 || password.length > 128 || !programId) {
        sendJson(response, 400, { error: "Provide your name, a program, and a password of at least 6 characters." });
        return;
      }

      const prisma = getPrismaClient();
      const [existingUser, existingStudent, program] = await Promise.all([
        prisma.user.findUnique({ where: { email }, select: { id: true } }),
        prisma.studentProfile.findUnique({ where: { studentNumber }, select: { userId: true } }),
        prisma.program.findUnique({ where: { id: programId }, select: { id: true } })
      ]);
      if (existingUser) {
        sendJson(response, 409, { error: "An account with this email already exists." });
        return;
      }
      if (existingStudent) {
        sendJson(response, 409, { error: "This student ID is already registered." });
        return;
      }
      if (!program) {
        sendJson(response, 400, { error: "Select a valid program from the college catalog." });
        return;
      }

      let firstName;
      let lastName;
      let middleName;
      if (hasExplicitNames) {
        firstName = submittedFirstName;
        lastName = submittedLastName;
        middleName = null;
      } else {
        const nameParts = name.split(/\s+/);
        firstName = nameParts.shift();
        lastName = nameParts.pop() || firstName;
        middleName = nameParts.join(" ") || null;
      }
      const accessToken = crypto.randomBytes(32).toString("hex");
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          firstName,
          middleName,
          lastName,
          role: "STUDENT",
          studentProfile: {
            create: {
              studentNumber,
              program: { connect: { id: program.id } }
            }
          },
          sessions: {
            create: {
              tokenHash: hashSessionToken(accessToken),
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        },
        include: {
          studentProfile: { include: { program: { include: { college: true } } } }
        }
      });
      sendJson(response, 201, { accessToken, profile: studentProfileResponse(user) });
    } catch (error) {
      if (error.code === "P2002") {
        sendJson(response, 409, { error: "This email or student ID is already registered." });
        return;
      }
      console.error("Student sign-up failed:", error);
      sendJson(response, 500, { error: "Student account could not be created." });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/student-login") {
    try {
      const body = await readBody(request);
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!email || !password || password.length > 128) {
        sendJson(response, 400, { error: "Enter your email address and password." });
        return;
      }

      const user = await getPrismaClient().user.findUnique({
        where: { email },
        include: { studentProfile: { include: { program: { include: { college: true } } } } }
      });
      if (!user || !user.isActive || user.role !== "STUDENT" || !user.studentProfile || !verifyPassword(password, user.passwordHash)) {
        sendJson(response, 401, { error: "Invalid email or password." });
        return;
      }

      const accessToken = crypto.randomBytes(32).toString("hex");
      await getPrismaClient().session.create({
        data: {
          tokenHash: hashSessionToken(accessToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });
      sendJson(response, 200, { accessToken, profile: studentProfileResponse(user) });
    } catch (error) {
      console.error("Student sign-in failed:", error);
      sendJson(response, 500, { error: "Student sign-in could not be completed." });
    }
    return;
  }

  if (request.method === "POST" && pathname === "/api/auth/logout") {
    try {
      const session = await findAuthenticatedStudent(request);
      if (!session) {
        sendJson(response, 401, { error: "Your student session is invalid or has expired." });
        return;
      }
      await getPrismaClient().session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      });
      sendJson(response, 200, { status: "logged_out" });
    } catch (error) {
      console.error("Student logout failed:", error);
      sendJson(response, 500, { error: "Student logout could not be completed." });
    }
    return;
  }

  if (pathname === "/api/students/profile") {
    try {
      const session = await findAuthenticatedStudent(request);
      if (!session) {
        sendJson(response, 401, { error: "Your student session is invalid or has expired." });
        return;
      }
      const prisma = getPrismaClient();
      if (request.method === "GET") {
        sendJson(response, 200, studentProfileResponse(session.user));
        return;
      }
      if (request.method === "PUT") {
        const body = await readBody(request);
        const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
        const middleName = typeof body.middleName === "string" ? body.middleName.trim() : "";
        const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const studentNumber = typeof body.studentNumber === "string" ? body.studentNumber.trim() : "";
        const collegeName = typeof body.collegeName === "string" ? body.collegeName.trim() : "";
        const programName = typeof body.programName === "string" ? body.programName.trim() : "";
        const contactNumber = typeof body.phone === "string" ? body.phone.trim() : "";
        const streetAddress = typeof body.streetAddress === "string" ? body.streetAddress.trim() : "";
        const barangay = typeof body.barangay === "string" ? body.barangay.trim() : "";
        const city = typeof body.city === "string" ? body.city.trim() : "";
        const postalCode = typeof body.postalCode === "string" ? body.postalCode.trim() : "";
        const partnerCompany = typeof body.partnerCompany === "string" ? body.partnerCompany.trim() : "";
        const ojtPeriod = typeof body.ojtPeriod === "string" ? body.ojtPeriod.trim() : "";
        const licenses = validateProfileLicenses(body.licenses);
        const skills = validateProfileSkills(body.skills);
        if (!firstName || !lastName || firstName.length > 100 || middleName.length > 100 || lastName.length > 100
          || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254
          || !/^\d{2}-\d{4}$/.test(studentNumber) || !collegeName || !programName
          || !/^\+63\d{10}$/.test(contactNumber) || !streetAddress || !barangay || !city
          || contactNumber.length > 40 || streetAddress.length > 200 || barangay.length > 100
          || city.length > 100 || postalCode.length > 20
          || partnerCompany.length > 200 || ojtPeriod.length > 100 || !licenses || !skills) {
          sendJson(response, 400, { error: "Check the required profile fields and their lengths, then try again." });
          return;
        }

        const program = await prisma.program.findFirst({
          where: { name: programName, college: { name: collegeName } },
          select: { id: true }
        });
        if (!program) {
          sendJson(response, 400, { error: "Select a valid program for the chosen college." });
          return;
        }

        const normalizedCityName = normalizeLocationName(city);
        const normalizedBarangayName = normalizeLocationName(barangay);
        const updatedUser = await prisma.$transaction(async (transaction) => {
          const cityRecord = await transaction.city.upsert({
            where: { normalizedName: normalizedCityName },
            update: {},
            create: { name: city.replace(/\s+/g, " "), normalizedName: normalizedCityName }
          });
          const barangayRecord = await transaction.barangay.upsert({
            where: { cityId_normalizedName: { cityId: cityRecord.id, normalizedName: normalizedBarangayName } },
            update: {},
            create: {
              name: barangay.replace(/\s+/g, " "),
              normalizedName: normalizedBarangayName,
              cityId: cityRecord.id
            }
          });
          return transaction.user.update({
            where: { id: session.userId },
            data: {
              email,
              firstName,
              middleName: middleName || null,
              lastName,
              studentProfile: {
                update: {
                  studentNumber,
                  programId: program.id,
                  contactNumber: contactNumber || null,
                  streetAddress: streetAddress || null,
                  barangay: barangayRecord.name,
                  city: cityRecord.name,
                  postalCode: postalCode || null,
                  partnerCompany: partnerCompany || null,
                  ojtPeriod: ojtPeriod || null,
                  licensesJson: JSON.stringify(licenses),
                  skillsJson: JSON.stringify(skills)
                }
              }
            },
            include: { studentProfile: { include: { program: { include: { college: true } } } } }
          });
        });
        sendJson(response, 200, studentProfileResponse(updatedUser));
        return;
      }
      sendJson(response, 405, { error: "Method not allowed." });
    } catch (error) {
      if (error.code === "P2002") {
        sendJson(response, 409, { error: "That email or student number is already in use." });
        return;
      }
      console.error("Student profile request failed:", error);
      sendJson(response, 500, { error: "Student profile could not be saved." });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/catalog/colleges") {
    try {
      const colleges = await getPrismaClient().college.findMany({
        select: {
          id: true,
          name: true,
          ojtYearLevel: true,
          programs: {
            select: { id: true, name: true },
            orderBy: { sortOrder: "asc" }
          }
        },
        orderBy: { sortOrder: "asc" }
      });
      sendJson(response, 200, { colleges });
    } catch (error) {
      console.error("Academic catalog request failed:", error);
      sendJson(response, 503, {
        error: process.env.DATABASE_URL
          ? "The academic catalog is unavailable. Apply the Prisma migration and seed the catalog, then try again."
          : "DATABASE_URL is not configured. Set it in Backend/.env to load the academic catalog."
      });
    }
    return;
  }

  if (request.method === "GET" && pathname === "/api/catalog/locations") {
    try {
      const cities = await getPrismaClient().city.findMany({
        include: {
          barangays: {
            select: { id: true, name: true },
            orderBy: { name: "asc" }
          }
        },
        orderBy: { name: "asc" }
      });
      sendJson(response, 200, {
        cities: cities.map(({ id, name, barangays }) => ({ id, name, barangays }))
      });
    } catch (error) {
      console.error("Location catalog request failed:", error);
      sendJson(response, 503, { error: "The city and barangay catalog is unavailable." });
    }
    return;
  }

  if (pathname.startsWith("/api/")) {
    try {
      const store = readStore();
      if (request.method === "GET" && pathname === "/api/session") {
        const user = roleUser(request);
        sendJson(response, 200, { user, roles: Object.values(demoUsers) });
        return;
      }
      if (pathname.startsWith("/api/classroom/")) {
        if (request.method === "GET" && pathname === "/api/classroom/summary") {
          const user = requireRole(request, response, ["student", "adviser", "spards"]);
          if (!user) return;
          const submissions = store.submissions.filter((item) => visibleToRole(item, user.role, user.userId));
          sendJson(response, 200, {
            requirements: store.requirements.length,
            pendingAdviserReview: store.submissions.filter((item) => item.documentType === "assignment" && item.status === "Pending adviser review").length,
            approvedForSpards: store.submissions.filter((item) => item.documentType === "assignment" && item.status === "Approved").length,
            pendingSpardsDocuments: store.submissions.filter((item) => ["MOA", "MOU"].includes(item.documentType)).length,
            submissions: submissions.length
          });
          return;
        }
        if (request.method === "GET" && pathname === "/api/classroom/requirements") {
          if (!requireRole(request, response, ["student", "adviser", "spards"])) return;
          sendJson(response, 200, store.requirements);
          return;
        }
        if (request.method === "POST" && pathname === "/api/classroom/requirements") {
          const user = requireRole(request, response, ["adviser"]);
          if (!user) return;
          const body = await readBody(request);
          const title = typeof body.title === "string" ? body.title.trim() : "";
          const description = typeof body.description === "string" ? body.description.trim() : "";
          const dueDate = typeof body.dueDate === "string" ? body.dueDate : "";
          const parsedDueDate = new Date(`${dueDate}T00:00:00Z`);
          if (!title || title.length > 120 || description.length > 2000 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(parsedDueDate.getTime()) || parsedDueDate.toISOString().slice(0, 10) !== dueDate) {
            sendJson(response, 400, { error: "Add a title, instructions under 2,000 characters, and a valid due date." });
            return;
          }
          const requirement = { id: `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, title, description, dueDate, createdAt: new Date().toISOString(), createdBy: user.userId };
          store.requirements.unshift(requirement);
          saveStore(store);
          sendJson(response, 201, requirement);
          return;
        }
        if (request.method === "GET" && pathname === "/api/classroom/submissions") {
          const user = requireRole(request, response, ["student", "adviser", "spards"]);
          if (!user) return;
          sendJson(response, 200, store.submissions.filter((item) => visibleToRole(item, user.role, user.userId)).map(publicSubmission));
          return;
        }
        if (request.method === "POST" && pathname === "/api/classroom/submissions") {
          const user = requireRole(request, response, ["student"]);
          if (!user) return;
          const body = await readBody(request);
          const documentType = ["assignment", "MOA", "MOU"].includes(body.documentType) ? body.documentType : "";
          const answer = typeof body.answer === "string" ? body.answer.trim() : "";
          if (!documentType || answer.length > 5000) {
            sendJson(response, 400, { error: "Choose an assignment, MOA, or MOU and keep the answer under 5,000 characters." });
            return;
          }
          const requirement = documentType === "assignment" ? store.requirements.find((item) => item.id === body.requirementId) : null;
          if (documentType === "assignment" && !requirement) {
            sendJson(response, 404, { error: "Classroom requirement not found." });
            return;
          }
          if (["MOA", "MOU"].includes(documentType) && !answer && !body.file) {
            sendJson(response, 400, { error: "Add a note or attach the signed document before submitting to SPARDS." });
            return;
          }
          const existing = store.submissions.find((item) => item.studentId === user.userId && item.documentType === documentType && item.requirementId === (requirement?.id || ""));
          if (existing && existing.status !== "Returned" && existing.status !== "Needs revision") {
            sendJson(response, 409, { error: "This document has already been submitted and cannot be changed while it is under review." });
            return;
          }
          const attachment = saveAttachment(body);
          const now = new Date().toISOString();
          const submission = {
            id: existing?.id || `SUB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
            studentId: user.userId,
            studentName: user.name,
            requirementId: requirement?.id || "",
            documentType,
            answer,
            ...attachment,
            submittedAt: now,
            status: documentType === "assignment" ? "Pending adviser review" : "Submitted to SPARDS",
            feedback: ""
          };
          if (existing) Object.assign(existing, submission);
          else store.submissions.unshift(submission);
          saveStore(store);
          sendJson(response, existing ? 200 : 201, publicSubmission(submission));
          return;
        }
        const reviewMatch = pathname.match(/^\/api\/classroom\/submissions\/([A-Za-z0-9-]+)\/review$/);
        if (request.method === "PATCH" && reviewMatch) {
          const user = roleUser(request);
          if (!user) {
            sendJson(response, 401, { error: "Select a demo role before using this workflow." });
            return;
          }
          const body = await readBody(request);
          const submission = store.submissions.find((item) => item.id === reviewMatch[1]);
          if (!submission) {
            sendJson(response, 404, { error: "Submission not found." });
            return;
          }
          const feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 1000) : "";
          if (user.role === "adviser") {
            if (submission.documentType !== "assignment") {
              sendJson(response, 403, { error: "OJT advisers can review classroom assignments only." });
              return;
            }
            if (!["Approved", "Returned"].includes(body.status)) {
              sendJson(response, 400, { error: "Choose Approved or Returned." });
              return;
            }
            if (submission.status !== "Pending adviser review" && submission.status !== "Returned") {
              sendJson(response, 409, { error: "This assignment is not awaiting adviser review." });
              return;
            }
          } else if (user.role === "spards") {
              sendJson(response, 403, { error: "SPARDS has document-view access only in this workflow." });
              return;
          } else {
            sendJson(response, 403, { error: "Students cannot review submissions." });
            return;
          }
          submission.status = body.status;
          submission.feedback = feedback;
          submission.reviewedAt = new Date().toISOString();
          submission.reviewedBy = user.userId;
          saveStore(store);
          sendJson(response, 200, publicSubmission(submission));
          return;
        }
        const fileMatch = pathname.match(/^\/api\/classroom\/submissions\/([A-Za-z0-9-]+)\/file$/);
        if (request.method === "GET" && fileMatch) {
          const user = requireRole(request, response, ["student", "adviser", "spards"]);
          if (!user) return;
          const submission = store.submissions.find((item) => item.id === fileMatch[1]);
          if (!submission || !visibleToRole(submission, user.role, user.userId) || !submission.storedFile) {
            sendJson(response, submission ? 404 : 404, { error: "Document file not found." });
            return;
          }
          const filePath = path.join(UPLOAD_DIR, path.basename(submission.storedFile));
          fs.readFile(filePath, (error, content) => {
            if (error) {
              console.error("Document download failed:", error);
              sendJson(response, 404, { error: "Document file is unavailable." });
              return;
            }
            response.writeHead(200, {
              "Content-Type": submission.mimeType || "application/octet-stream",
              "Content-Disposition": `attachment; filename="${safeFilename(submission.fileName)}"`,
              "X-Content-Type-Options": "nosniff",
              "Cache-Control": "private, no-store"
            });
            response.end(content);
          });
          return;
        }
        sendJson(response, 404, { error: "Classroom endpoint not found." });
        return;
      }

      const adviser = requireRole(request, response, ["adviser"]);
      if (!adviser) return;
      if (request.method === "GET" && pathname === "/api/dashboard") {
        sendJson(response, 200, {
          activeInternships: store.internships.filter((item) => item.status === "Active").length,
          totalApplicants: store.applicants.length,
          partnerCompanies: store.companies.length,
          pendingReview: store.applicants.filter((item) => item.status === "Pending").length,
          recentApplicants: store.applicants.slice(0, 5),
          internships: store.internships.slice(0, 5)
        });
        return;
      }
      if (request.method === "GET" && pathname === "/api/internships") {
        sendJson(response, 200, store.internships);
        return;
      }
      if (request.method === "POST" && pathname === "/api/internships") {
        const body = await readBody(request);
        const title = typeof body.title === "string" ? body.title.trim() : "";
        const companyId = typeof body.companyId === "string" ? body.companyId : "";
        const slots = Number(body.slots);
        if (!title || !store.companies.some((company) => company.id === companyId) || !Number.isInteger(slots) || slots < 1 || slots > 100) {
          sendJson(response, 400, { error: "Provide a title, a registered company, and 1–100 available slots." });
          return;
        }
        const internship = {
          id: `INT-${Date.now().toString().slice(-6)}`,
          title: title.slice(0, 100),
          companyId,
          department: typeof body.department === "string" && body.department.trim() ? body.department.trim().slice(0, 60) : "General",
          type: ["Hybrid", "Remote", "On-site"].includes(body.type) ? body.type : "Hybrid",
          slots,
          applicants: 0,
          status: "Active",
          posted: new Date().toISOString().slice(0, 10)
        };
        store.internships.unshift(internship);
        saveStore(store);
        sendJson(response, 201, internship);
        return;
      }
      if (request.method === "GET" && pathname === "/api/applicants") {
        sendJson(response, 200, store.applicants);
        return;
      }
      const applicantMatch = pathname.match(/^\/api\/applicants\/([A-Za-z0-9-]+)\/status$/);
      if (request.method === "PATCH" && applicantMatch) {
        const applicant = store.applicants.find((item) => item.id === applicantMatch[1]);
        const body = await readBody(request);
        if (!applicant) {
          sendJson(response, 404, { error: "Applicant not found." });
          return;
        }
        if (!["Pending", "Shortlisted", "For interview", "Accepted", "Declined"].includes(body.status)) {
          sendJson(response, 400, { error: "Choose a valid application status." });
          return;
        }
        applicant.status = body.status;
        saveStore(store);
        sendJson(response, 200, applicant);
        return;
      }
      if (request.method === "GET" && pathname === "/api/companies") {
        sendJson(response, 200, store.companies);
        return;
      }
      sendJson(response, 404, { error: "API endpoint not found." });
    } catch (error) {
      console.error("API request failed:", error);
      const message = error.message.toLowerCase();
      const status = message.includes("json") || message.includes("too large") || message.includes("upload") || message.includes("document") ? 400 : 500;
      sendJson(response, status, { error: error.message || "Internal server error." });
    }
    return;
  }

  sendJson(response, 404, { error: "API endpoint not found." });
});

server.on("error", (error) => {
  console.error(`Unable to start InternSync API on 127.0.0.1:${PORT}:`, error);
  process.exitCode = 1;
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`InternSync API is running at http://127.0.0.1:${PORT}`);
});
