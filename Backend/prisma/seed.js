require("dotenv").config({ path: require("node:path").join(__dirname, "..", ".env") });

const { createPrismaClient } = require("../prisma-client");

const prisma = createPrismaClient();
const yearLevelByCollege = {
  THIRD: "THIRD",
  FOURTH: "FOURTH"
};
const colleges = [
  {
    code: "COE",
    name: "College of Engineering",
    ojtYearLevel: "THIRD",
    programs: [
      { code: "BSIE", name: "Bachelor of Science in Industrial Engineering" },
      { code: "BSECE", name: "Bachelor of Science in Electronics Engineering" },
      { code: "BSCPE", name: "Bachelor of Science in Computer Engineering" }
    ]
  },
  {
    code: "COB",
    name: "College of Business",
    ojtYearLevel: "THIRD",
    programs: [
      { code: "BSENTREP", name: "Bachelor of Science in Entrepreneurship" }
    ]
  },
  {
    code: "COA",
    name: "College of Accountancy",
    ojtYearLevel: "FOURTH",
    programs: [
      { code: "BSA", name: "Bachelor of Science in Accountancy" },
      { code: "BSMA", name: "Bachelor of Science in Management Accounting" }
    ]
  },
  {
    code: "COED",
    name: "College of Education",
    ojtYearLevel: "FOURTH",
    programs: [
      { code: "BSECE", name: "Bachelor of Science in Early Childhood Education" },
      { code: "BSGE", name: "Bachelor of Science in General Education" }
    ]
  },
  {
    code: "CCS",
    name: "College of Computer Studies",
    ojtYearLevel: "FOURTH",
    programs: [
      { code: "BSIT", name: "Bachelor of Science in Information Technology" },
      { code: "BSIS", name: "Bachelor of Science in Information System" },
      { code: "BSCS", name: "Bachelor of Science in Computer Science" }
    ]
  }
];

async function main() {
  for (const [collegeIndex, collegeData] of colleges.entries()) {
    const ojtYearLevel = yearLevelByCollege[collegeData.ojtYearLevel];
    const college = await prisma.college.upsert({
      where: { code: collegeData.code },
      update: {
        name: collegeData.name,
        ojtYearLevel,
        sortOrder: collegeIndex
      },
      create: {
        code: collegeData.code,
        name: collegeData.name,
        ojtYearLevel,
        sortOrder: collegeIndex
      }
    });

    for (const [programIndex, program] of collegeData.programs.entries()) {
      await prisma.program.upsert({
        where: {
          collegeId_code: {
            collegeId: college.id,
            code: program.code
          }
        },
        update: { name: program.name, sortOrder: programIndex },
        create: {
          collegeId: college.id,
          code: program.code,
          name: program.name,
          sortOrder: programIndex
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error("Could not seed the academic catalog:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
