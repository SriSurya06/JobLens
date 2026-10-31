/**
 * CCPDMS — MongoDB Seed Script
 * HOW TO RUN:
 *   1. npm install  (inside ccpdms-seed/)
 *   2. Edit the CONFIG block below — add your emails + change passwords
 *   3. node seed.js
 * What it creates:
 *   • 1 coordinator account
 *   • 36 student accounts  (4 batches × 9 branches × 1 student each)
 *   • 6 on-campus drives   (TCS, Infosys, Wipro, Amazon, Zoho, Microsoft)
 *   • 4 off-campus drives  (Google internship, Unstop hackathon, Naukri job, etc.)
 *   • Rounds for 2 completed drives  (TCS = frozen, Infosys = in-progress)
 *   • Applications for sample students
 *   • Feedback entries (anonymous)
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
const Student = require("./src/models/Student");
const OnCampusDrive = require("./src/models/OnCampusDrive");
const OffCampusDrive = require("./src/models/OffCampusDrive");
const Round = require("./src/models/Round");
const Application = require("./src/models/Application");
const Feedback = require("./src/models/Feedback");
const AuditLog = require("./src/models/AuditLog");
// EDIT THIS BLOCK — Your Emails & Passwords
const CONFIG = {
  MONGO_URI:
    process.env.MONGO_URI ||
    "mongodb+srv://<user>:<pass>@cluster.mongodb.net/ccpdms?retryWrites=true&w=majority",
  coordinator: {
    email: "coordinator@college.edu", // ← CHANGE THIS
    password: "Coord@1234", // ← CHANGE THIS  (min 8 chars)
    name: "Dr. Placement Coordinator",
  },
  // One student email per batch-branch slot.
  // Format: studentEmails[batch][branch] = 'email'
  // Batches: 2026, 2027, 2028, 2029
  // Branches: CSE, ECE, EEE, MECH, CIVIL, IT, AIDS, AIML, DS
  // You can change any of these emails — all others stay as generated defaults.
  customStudentEmails: {
    // Example overrides — edit freely:
    "22CS001": "23MH1A05L3@acoe.edu.in", // ← CHANGE (CSE 2026)
    "22IT001": "23MH1A05M1@acoe.edu.in", // ← CHANGE (IT  2026)
    "23CS001": "23MH1A05M8@acoe.edu.in", // ← CHANGE (CSE 2027)
  },

  defaultPassword: "Student@123", // ← same password for ALL students initially
};
const BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "IT",
  "AIDS",
  "AIML",
  "DS",
];
const BATCHES = [2026, 2027, 2028, 2029];
// Batch prefix: 2026→22, 2027→23, 2028→24, 2029→25
const BATCH_CODE = { 2026: "22", 2027: "23", 2028: "24", 2029: "25" };
const BRANCH_CODE = {
  CSE: "CS",
  ECE: "EC",
  EEE: "EE",
  MECH: "ME",
  CIVIL: "CE",
  IT: "IT",
  AIDS: "AD",
  AIML: "AM",
  DS: "DS",
};

// ── Helpers
// const hash = (pw) => bcrypt.hash(pw, 12);
const rnd = (min, max, dec = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(dec));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const FIRST_NAMES = [
  "Aarav",
  "Arjun",
  "Sneha",
  "Priya",
  "Rahul",
  "Kavya",
  "Ravi",
  "Divya",
  "Kiran",
  "Ananya",
  "Suresh",
  "Meena",
  "Vikram",
  "Pooja",
  "Nikhil",
  "Shreya",
  "Aditya",
  "Swathi",
  "Rohit",
  "Nithya",
  "Sai",
  "Lakshmi",
  "Harish",
  "Deepa",
  "Ganesh",
  "Keerthi",
  "Vijay",
  "Sowmya",
  "Akash",
  "Lavanya",
];
const LAST_NAMES = [
  "Reddy",
  "Kumar",
  "Sharma",
  "Naidu",
  "Rao",
  "Singh",
  "Patel",
  "Varma",
  "Gupta",
  "Iyer",
  "Krishnan",
  "Bhat",
  "Menon",
  "Nair",
  "Pillai",
  "Chandra",
];
const SKILLS_POOL = {
  CSE: [
    "Java",
    "Python",
    "React",
    "Node.js",
    "MongoDB",
    "MySQL",
    "C++",
    "DSA",
    "Spring Boot",
    "AWS",
  ],
  ECE: [
    "Embedded C",
    "VLSI",
    "Arduino",
    "MATLAB",
    "Signal Processing",
    "PCB Design",
    "IoT",
    "Python",
  ],
  EEE: [
    "Power Systems",
    "MATLAB",
    "AutoCAD",
    "PLC",
    "SCADA",
    "Embedded Systems",
    "Circuit Design",
  ],
  MECH: [
    "AutoCAD",
    "SolidWorks",
    "CATIA",
    "Thermodynamics",
    "FEA",
    "Manufacturing Processes",
    "ANSYS",
  ],
  CIVIL: [
    "AutoCAD",
    "STAAD Pro",
    "Revit",
    "Construction Management",
    "Surveying",
    "GIS",
    "Project Management",
  ],
  IT: [
    "JavaScript",
    "Python",
    "PHP",
    "MySQL",
    "React",
    "Node.js",
    "Docker",
    "Linux",
    "REST APIs",
  ],
  AIDS: [
    "Python",
    "Machine Learning",
    "TensorFlow",
    "Data Analysis",
    "SQL",
    "Power BI",
    "Tableau",
    "NLP",
  ],
  AIML: [
    "Python",
    "Deep Learning",
    "PyTorch",
    "Computer Vision",
    "NLP",
    "Scikit-learn",
    "Keras",
    "MLOps",
  ],
  DS: [
    "Python",
    "R",
    "SQL",
    "Tableau",
    "Power BI",
    "Statistics",
    "Machine Learning",
    "Data Wrangling",
  ],
};
const CITIES = [
  "Hyderabad",
  "Vijayawada",
  "Guntur",
  "Warangal",
  "Tirupati",
  "Visakhapatnam",
  "Kurnool",
];

function makeStudentName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
// ── Build raw student rows ────────────────────────────────────────────────────
function buildStudentRows() {
  const rows = [];
  for (const batch of BATCHES) {
    for (const branch of BRANCHES) {
      const pfx = BATCH_CODE[batch] + BRANCH_CODE[branch];
      const roll = `${pfx}001`;
      const email =
        CONFIG.customStudentEmails[roll] || `${roll.toLowerCase()}@college.edu`;
      const name = makeStudentName();
      // Vary CGPAs across batches/branches for realistic testing
      const cgpaMap = {
        2026: rnd(6.5, 9.8),
        2027: rnd(6.0, 9.5),
        2028: rnd(5.5, 9.2),
        2029: rnd(5.0, 8.8),
      };
      const cgpa = cgpaMap[batch];
      const backlogs = cgpa < 6.5 ? pick([1, 2]) : 0;
      rows.push({
        roll,
        email,
        name,
        batch,
        branch,
        cgpa,
        backlogs,
        contact: `98${Math.floor(Math.random() * 1e8)
          .toString()
          .padStart(8, "0")}`,
        city: pick(CITIES),
        skills: (SKILLS_POOL[branch] || SKILLS_POOL.CSE).slice(
          0,
          pick([3, 4, 5, 6]),
        ),
      });
    }
  }
  return rows;
}
// MAIN SEED
async function seed() {
  console.log("\n🔌 Connecting to MongoDB...");
  await mongoose.connect(CONFIG.MONGO_URI);
  console.log("✅ Connected\n");
  // ── Drop existing data
  console.log("🗑️  Clearing existing collections...");
  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    OnCampusDrive.deleteMany({}),
    OffCampusDrive.deleteMany({}),
    Round.deleteMany({}),
    Application.deleteMany({}),
    Feedback.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log("✅ Cleared\n");
  // 1. COORDINATOR
  console.log("👤 Creating coordinator...");
  const coordUser = await User.create({
    email: CONFIG.coordinator.email,
    password: CONFIG.coordinator.password,
    role: "coordinator",
    isFirstLogin: false,
    isActive: true,
  });
  console.log(
    `   ✅ ${CONFIG.coordinator.email}  /  password: ${CONFIG.coordinator.password}\n`,
  );
  // 2. STUDENTS  (4 batches × 9 branches = 36 students)
  // ════════════════════════════════════════════════════════════════════════
  console.log("🎓 Creating students (36 across 4 batches × 9 branches)...");
  const studentRows = buildStudentRows();
  const studentMap = {}; // roll → { userId, studentId, doc }
  for (const s of studentRows) {
    const userDoc = await User.create({
      email: s.email,
      password: CONFIG.defaultPassword,
      role: "student",
      isFirstLogin: true,
      isActive: true,
    });
    const stuDoc = await Student.create({
      user: userDoc._id,
      rollNumber: s.roll,
      name: s.name,
      passedOutYear: s.batch,
      branch: s.branch,
      collegeEmail: s.email,
      personalEmail: `${s.name.split(" ")[0].toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`,
      contact: s.contact,
      address: `${Math.floor(Math.random() * 999) + 1}, Main Road, ${s.city}, Andhra Pradesh`,
      cgpa: s.cgpa,
      activeBacklogs: s.backlogs,
      totalBacklogs: s.backlogs,
      education: {
        btech: {
          institutionName: "ABC Engineering College",
          percentage: parseFloat((s.cgpa * 9.5).toFixed(1)),
          cgpa: s.cgpa,
          yearOfCompletion: s.batch,
        },
        intermediate: {
          institutionName: `${pick(["Narayana", "Sri Chaitanya", "Vignan", "Tirumala"])} Jr College`,
          percentage: rnd(72, 98),
          yearOfCompletion: s.batch - 4,
        },
        secondary: {
          institutionName: `${pick(["Vikas", "Excel", "Brilliant", "Pragathi"])} High School`,
          percentage: rnd(75, 99),
          yearOfCompletion: s.batch - 6,
        },
      },
      skills: s.skills,
      projects: [
        {
          title: `${s.branch} Capstone Project`,
          description: `A ${s.branch} final year project using modern technologies.`,
          techStack: s.skills.slice(0, 3),
          link: `https://github.com/${s.roll.toLowerCase()}/capstone`,
        },
        {
          title: `Mini Project - ${s.branch}`,
          description: `Semester mini-project demonstrating core ${s.branch} concepts.`,
          techStack: s.skills.slice(0, 2),
          link: "",
        },
      ],
      internships:
        s.cgpa > 7.5
          ? [
              {
                company: pick([
                  "TCS iON",
                  "Infosys Springboard",
                  "NPCI",
                  "NASSCOM",
                ]),
                role: `${s.branch} Intern`,
                duration: "2 months",
                description: `Worked on real-world ${s.branch} problems under guidance of industry mentors.`,
              },
            ]
          : [],
      certifications: [
        `${pick(["NPTEL", "Coursera", "Udemy"])} — ${s.skills[0]} Fundamentals`,
        ...(s.cgpa > 7.5
          ? [
              `${pick(["AWS Cloud Practitioner", "Google IT Support", "Microsoft Azure Fundamentals"])}`,
            ]
          : []),
      ],
      codingProfiles: {
        github: `https://github.com/${s.roll.toLowerCase()}`,
        leetcode: `https://leetcode.com/${s.roll.toLowerCase()}`,
        hackerrank: `https://hackerrank.com/${s.roll.toLowerCase()}`,
      },
      profileSummary: `${s.branch} engineering student (Batch ${s.batch}) with a CGPA of ${s.cgpa}. Passionate about ${s.skills.slice(0, 2).join(" and ")}. Seeking opportunities to apply technical skills in a professional environment.`,
    });
    studentMap[s.roll] = {
      userId: userDoc._id,
      studentId: stuDoc._id,
      doc: stuDoc,
      ...s,
    };
  }
  console.log(
    `   ✅ 36 students created  |  default password: ${CONFIG.defaultPassword}\n`,
  );
  console.log("   Student logins:");
  for (const [roll, info] of Object.entries(studentMap)) {
    console.log(
      `   ${roll}  |  ${info.email}  |  CGPA: ${info.cgpa}  |  Batch: ${info.batch}  |  ${info.branch}`,
    );
  }
  console.log();
  // 3. ON-CAMPUS DRIVES
  console.log("🏢 Creating on-campus drives...");

  const onCampusDrivesData = [
    // ── Drive 1: TCS — FROZEN (all rounds done, selected students)
    {
      companyName: "TCS",
      eligibleBatches: [2026],
      eligibleBranches: ["CSE", "IT", "ECE", "AIDS", "AIML", "DS"],
      cgpaCutOff: 6.0,
      backlogsAllowed: 2,
      description:
        "Tata Consultancy Services — TCS NQT Campus Hiring 2026. Roles: Systems Engineer, Developer. Service-based IT company. Package 3.6 LPA to 7 LPA. Bond: 2 years.",
      minPackage: 3.6,
      maxPackage: 7.0,
      registrationDeadline: new Date("2025-08-10"),
      registrationLink: "https://nextstep.tcs.com",
      status: "frozen",
      isFrozen: true,
      selectionRatio: "8/22",
      eligibleStudentsCount: 24,
      selectedStudentsCount: 8,
    },
    // ── Drive 2: Infosys — ACTIVE, Round 2 in progress
    {
      companyName: "Infosys",
      eligibleBatches: [2026],
      eligibleBranches: ["CSE", "IT", "ECE", "EEE", "AIDS", "AIML", "DS"],
      cgpaCutOff: 6.5,
      backlogsAllowed: 0,
      description:
        "Infosys Campus Connect — Systems Engineer role. Package 4.5 LPA. Roles include Analyst, Systems Engineer. Bond: 1 year. Assessment + HR interview.",
      minPackage: 4.5,
      maxPackage: 9.0,
      registrationDeadline: new Date("2025-09-05"),
      registrationLink: "https://infosys.com/careers",
      status: "active",
      isFrozen: false,
      eligibleStudentsCount: 20,
      selectedStudentsCount: 0,
    },
    // ── Drive 3: Wipro — ACTIVE, registration open
    {
      companyName: "Wipro",
      eligibleBatches: [2026, 2027],
      eligibleBranches: [
        "CSE",
        "IT",
        "ECE",
        "EEE",
        "AIDS",
        "AIML",
        "DS",
        "MECH",
      ],
      cgpaCutOff: 6.0,
      backlogsAllowed: 2,
      description:
        "Wipro Elite NLTH — National Level Talent Hunt. Roles: Project Engineer. Package 3.5 LPA. Test → Technical Interview → HR. Service-based role.",
      minPackage: 3.5,
      maxPackage: 6.5,
      registrationDeadline: new Date("2025-10-15"),
      registrationLink: "https://careers.wipro.com",
      status: "active",
      isFrozen: false,
      eligibleStudentsCount: 0,
      selectedStudentsCount: 0,
    },
    // ── Drive 4: Amazon — ACTIVE, upcoming (2027 batch)
    {
      companyName: "Amazon",
      eligibleBatches: [2027],
      eligibleBranches: ["CSE", "IT", "AIDS", "AIML", "DS"],
      cgpaCutOff: 7.5,
      backlogsAllowed: 0,
      description:
        "Amazon SDE Internship + PPO — Summer 2026. Roles: SDE Intern with Pre-Placement Offer possibility. Stipend: 80K/month. OA + 3 Technical rounds + Bar Raiser.",
      minPackage: 80,
      maxPackage: 80,
      registrationDeadline: new Date("2025-11-01"),
      registrationLink: "https://amazon.jobs/campus",
      status: "active",
      isFrozen: false,
      eligibleStudentsCount: 0,
      selectedStudentsCount: 0,
    },
    // ── Drive 5: Zoho — ACTIVE (2026 batch, product company)
    {
      companyName: "Zoho",
      eligibleBatches: [2026],
      eligibleBranches: ["CSE", "IT", "AIDS", "AIML"],
      cgpaCutOff: 7.0,
      backlogsAllowed: 0,
      description:
        "Zoho Product Development Campus Drive. Role: Member Technical Staff. Package: 7.5 LPA. Written test → Technical interview (DSA + CS fundamentals) → HR. No bond.",
      minPackage: 7.5,
      maxPackage: 12.0,
      registrationDeadline: new Date("2025-09-20"),
      registrationLink: "https://careers.zoho.com",
      status: "active",
      isFrozen: false,
      eligibleStudentsCount: 0,
      selectedStudentsCount: 0,
    },
    // ── Drive 6: Microsoft — ACTIVE (2027 batch, top-tier)
    {
      companyName: "Microsoft",
      eligibleBatches: [2027],
      eligibleBranches: ["CSE", "IT", "AIDS", "AIML", "DS"],
      cgpaCutOff: 8.0,
      backlogsAllowed: 0,
      description:
        "Microsoft Explore Program — Intern role for penultimate year students. Stipend 2L/month. 3 coding rounds + system design + culture fit interview. PPO available.",
      minPackage: 200,
      maxPackage: 200,
      registrationDeadline: new Date("2025-11-20"),
      registrationLink: "https://careers.microsoft.com",
      status: "active",
      isFrozen: false,
      eligibleStudentsCount: 0,
      selectedStudentsCount: 0,
    },
  ];
  const createdOnDrives = [];
  for (const d of onCampusDrivesData) {
    const drive = await OnCampusDrive.create({
      ...d,
      createdBy: coordUser._id,
    });
    createdOnDrives.push(drive);
    await AuditLog.create({
      user: coordUser._id,
      action: "DRIVE_CREATED",
      entity: "OnCampusDrive",
      entityId: drive._id,
      details: { companyName: drive.companyName },
      ip: "127.0.0.1",
    });
  }
  console.log(`   ✅ ${createdOnDrives.length} on-campus drives created\n`);
  const [tcsDrive, infosDrive, wiproDrive, amazonDrive, zohoDrive, msftDrive] =
    createdOnDrives;
  // 4. OFF-CAMPUS DRIVES
  console.log("🌐 Creating off-campus drives...");

  const offCampusData = [
    {
      companyName: "Google",
      driveName: "Google Step Internship 2026",
      driveCategory: "internship",
      eligibleBatches: [2027, 2028],
      eligibleBranches: ["CSE", "IT", "AIDS", "AIML", "DS"],
      description:
        "Google STEP (Student Training in Engineering Program) — 12-week paid internship at Google Hyderabad/Bangalore. Stipend: 1.2L/month. Apply via Google careers. Eligibility: 2nd/3rd year students. Strong DSA and problem-solving skills required. 2 online coding rounds + 2 technical interviews.",
      applyLink: "https://careers.google.com/students/step",
      lastDateToApply: new Date("2025-10-30"),
      appliedCount: 45,
      selectedCount: 0,
    },
    {
      companyName: "Smart India Hackathon",
      driveName: "SIH 2025 — Software Edition",
      driveCategory: "hackathon",
      eligibleBatches: [2026, 2027, 2028, 2029],
      eligibleBranches: ["CSE", "IT", "ECE", "AIDS", "AIML", "DS"],
      description:
        "Smart India Hackathon 2025 — National level 36-hour hackathon organised by MoE. Teams of 6. Problem statements from government ministries and PSUs. Winners get cash prizes upto 1L. Register at sih.gov.in with your college SPOC.",
      applyLink: "https://sih.gov.in/register",
      lastDateToApply: new Date("2025-09-15"),
      appliedCount: 120,
      selectedCount: 2,
    },
    {
      companyName: "Deloitte",
      driveName: "Deloitte Off-Campus Hiring 2026",
      driveCategory: "job",
      eligibleBatches: [2026],
      eligibleBranches: [
        "CSE",
        "IT",
        "ECE",
        "EEE",
        "AIDS",
        "AIML",
        "DS",
        "MECH",
        "CIVIL",
      ],
      description:
        "Deloitte USI off-campus drive for 2026 passouts. Roles: Analyst, Consultant. Package: 7-9 LPA. Apply via Naukri.com or LinkedIn. Aptitude test + 2 rounds of interviews. No bond. Hybrid work model from Hyderabad/Bangalore offices.",
      applyLink: "https://www2.deloitte.com/in/en/careers.html",
      lastDateToApply: new Date("2025-11-30"),
      appliedCount: 80,
      selectedCount: 0,
    },
    {
      companyName: "Unstop",
      driveName: "Codeforces × Unstop — Coding Contest Nov 2025",
      driveCategory: "hackathon",
      eligibleBatches: [2026, 2027, 2028, 2029],
      eligibleBranches: ["CSE", "IT", "ECE", "AIDS", "AIML", "DS"],
      description:
        "Monthly competitive programming contest hosted on Unstop in partnership with Codeforces. Duration: 2.5 hours. 6 algorithmic problems ranging from easy to expert. Top 3 winners get Amazon gift cards + internship referrals at sponsor companies. Register free at unstop.com.",
      applyLink: "https://unstop.com/competitions",
      lastDateToApply: new Date("2025-11-05"),
      appliedCount: 200,
      selectedCount: 3,
    },
  ];

  const createdOffDrives = [];
  for (const d of offCampusData) {
    const drive = await OffCampusDrive.create({
      ...d,
      createdBy: coordUser._id,
    });
    createdOffDrives.push(drive);
    await AuditLog.create({
      user: coordUser._id,
      action: "DRIVE_CREATED",
      entity: "OffCampusDrive",
      entityId: drive._id,
      details: { companyName: drive.companyName },
      ip: "127.0.0.1",
    });
  }
  console.log(`   ✅ ${createdOffDrives.length} off-campus drives created\n`);
  // 5. ROUNDS — TCS (frozen, 3 rounds complete)
  console.log("🔄 Creating rounds for TCS (frozen drive)...");
  // students for TCS eligible branches (2026 batch only)
  const tcsEligible = Object.values(studentMap).filter(
    (s) =>
      s.batch === 2026 &&
      ["CSE", "IT", "ECE", "AIDS", "AIML", "DS"].includes(s.branch) &&
      s.cgpa >= 6.0 &&
      s.backlogs <= 2,
  );
  const tcsR1Eligible = tcsEligible.map((s) => s.roll); // all 6 eligible
  const tcsR1Attended = tcsR1Eligible; // all attended
  const tcsR1Qualified = tcsR1Eligible.slice(0, 5); // 5 cleared R1
  const tcsR2Attended = tcsR1Qualified;
  const tcsR2Qualified = tcsR1Qualified.slice(0, 3); // 3 cleared R2 (interview)
  const tcsFinalQual = tcsR2Qualified; // 3 selected (changed from 8 for our small dataset)

  const tcsR1 = await Round.create({
    drive: tcsDrive._id,
    roundNumber: 1,
    roundName: "TCS NQT (Online Test)",
    venue: "Exam Centre, Vijayawada",
    date: new Date("2025-08-20"),
    description:
      "National Qualifier Test — Aptitude, Verbal, Coding (2 questions). Duration 180 min.",
    eligibleList: {
      rollNumbers: tcsR1Eligible,
      uploadedAt: new Date("2025-08-15"),
    },
    attendedList: {
      rollNumbers: tcsR1Attended,
      uploadedAt: new Date("2025-08-21"),
    },
    qualifiedList: {
      rollNumbers: tcsR1Qualified,
      uploadedAt: new Date("2025-08-23"),
    },
    isFinalRound: false,
    eligibleEmailSent: true,
    resultEmailSent: true,
  });
  const tcsR2 = await Round.create({
    drive: tcsDrive._id,
    roundNumber: 2,
    roundName: "Technical Interview",
    venue: "TCS Office, Hyderabad",
    date: new Date("2025-09-05"),
    description:
      "Technical interview covering DSA, OOP concepts, OS, DBMS, and project discussion.",
    eligibleList: {
      rollNumbers: tcsR1Qualified,
      uploadedAt: new Date("2025-09-01"),
    },
    attendedList: {
      rollNumbers: tcsR2Attended,
      uploadedAt: new Date("2025-09-06"),
    },
    qualifiedList: {
      rollNumbers: tcsR2Qualified,
      uploadedAt: new Date("2025-09-08"),
    },
    isFinalRound: false,
    eligibleEmailSent: true,
    resultEmailSent: true,
  });
  const tcsR3 = await Round.create({
    drive: tcsDrive._id,
    roundNumber: 3,
    roundName: "HR Interview",
    venue: "TCS Office, Hyderabad",
    date: new Date("2025-09-15"),
    description:
      "HR round — background check, relocation, bond signing, salary discussion.",
    eligibleList: {
      rollNumbers: tcsR2Qualified,
      uploadedAt: new Date("2025-09-10"),
    },
    attendedList: {
      rollNumbers: tcsFinalQual,
      uploadedAt: new Date("2025-09-16"),
    },
    qualifiedList: {
      rollNumbers: tcsFinalQual,
      uploadedAt: new Date("2025-09-18"),
    },
    isFinalRound: true,
    eligibleEmailSent: true,
    resultEmailSent: true,
  });

  await OnCampusDrive.findByIdAndUpdate(tcsDrive._id, {
    rounds: [tcsR1._id, tcsR2._id, tcsR3._id],
    selectedStudentsCount: tcsFinalQual.length,
    selectionRatio: `${tcsFinalQual.length}/${tcsR1Attended.length}`,
  });
  console.log("   ✅ TCS rounds created (R1 + R2 + R3 — frozen)\n");

  // ── Create TCS Applications ───────────────────────────────────────────────
  for (const s of tcsEligible) {
    const isR1Qual = tcsR1Qualified.includes(s.roll);
    const isR2Qual = tcsR2Qualified.includes(s.roll);
    const isFinal = tcsFinalQual.includes(s.roll);

    let overallStatus = "registered";
    let eliminatedAt;
    const roundStatuses = [];

    // R1 status
    roundStatuses.push({
      round: tcsR1._id,
      roundNumber: 1,
      roundName: "TCS NQT (Online Test)",
      status: isR1Qual ? "qualified" : "not_qualified",
    });
    if (!isR1Qual) {
      overallStatus = "rejected";
      eliminatedAt = 1;
    } else {
      // R2 status
      roundStatuses.push({
        round: tcsR2._id,
        roundNumber: 2,
        roundName: "Technical Interview",
        status: isR2Qual ? "qualified" : "not_qualified",
      });
      if (!isR2Qual) {
        overallStatus = "rejected";
        eliminatedAt = 2;
      } else {
        // R3 status
        roundStatuses.push({
          round: tcsR3._id,
          roundNumber: 3,
          roundName: "HR Interview",
          status: isFinal ? "qualified" : "not_qualified",
        });
        overallStatus = isFinal ? "selected" : "rejected";
        if (!isFinal) eliminatedAt = 3;
      }
    }
    await Application.create({
      student: s.studentId,
      drive: tcsDrive._id,
      overallStatus,
      roundStatuses,
      eliminatedAtRound: eliminatedAt,
      feedbackSubmitted: overallStatus === "selected",
      appliedAt: new Date("2025-08-01"),
      resumeSnapshot: `/uploads/resumes/${s.roll.toLowerCase()}-resume.pdf`,
    });
    await Student.findByIdAndUpdate(s.studentId, {
      $inc: {
        "stats.drivesApplied": 1,
        "stats.drivesSelected": overallStatus === "selected" ? 1 : 0,
        "stats.drivesRejected": overallStatus === "rejected" ? 1 : 0,
      },
    });
  }
  console.log("   ✅ TCS applications created\n");
  // 6. ROUNDS — Infosys (active, Round 1 complete, Round 2 upcoming)
  console.log("🔄 Creating rounds for Infosys (in-progress drive)...");
  const infosysEligible = Object.values(studentMap).filter(
    (s) =>
      s.batch === 2026 &&
      ["CSE", "IT", "ECE", "EEE", "AIDS", "AIML", "DS"].includes(s.branch) &&
      s.cgpa >= 6.5 &&
      s.backlogs === 0,
  );
  const infR1Eligible = infosysEligible.map((s) => s.roll);
  const infR1Attended = infR1Eligible;
  const infR1Qualified = infR1Eligible.slice(
    0,
    Math.ceil(infR1Eligible.length * 0.7),
  ); // 70% clear R1
  const infR1 = await Round.create({
    drive: infosDrive._id,
    roundNumber: 1,
    roundName: "InfyTQ Assessment",
    venue: "Infosys BPO, Hyderabad",
    date: new Date("2025-09-15"),
    description:
      "InfyTQ platform test — reasoning, verbal, and coding (1 question). 3 sections, 120 minutes total.",
    eligibleList: {
      rollNumbers: infR1Eligible,
      uploadedAt: new Date("2025-09-10"),
    },
    attendedList: {
      rollNumbers: infR1Attended,
      uploadedAt: new Date("2025-09-16"),
    },
    qualifiedList: {
      rollNumbers: infR1Qualified,
      uploadedAt: new Date("2025-09-19"),
    },
    isFinalRound: false,
    eligibleEmailSent: true,
    resultEmailSent: true,
  });
  const infR2 = await Round.create({
    drive: infosDrive._id,
    roundNumber: 2,
    roundName: "Technical + HR Interview",
    venue: "Infosys Campus, Pune (Online Mode)",
    date: new Date("2025-10-10"),
    description:
      "Back-to-back Technical and HR interview. Topics: DSA, OOP, Projects, Behavioural questions.",
    eligibleList: {
      rollNumbers: infR1Qualified,
      uploadedAt: new Date("2025-09-22"),
    },
    isFinalRound: true,
    eligibleEmailSent: true,
    resultEmailSent: false,
  });
  await OnCampusDrive.findByIdAndUpdate(infosDrive._id, {
    rounds: [infR1._id, infR2._id],
  });
  // Create Infosys Applications
  for (const s of infosysEligible) {
    const isR1Qual = infR1Qualified.includes(s.roll);
    const roundStatuses = [
      {
        round: infR1._id,
        roundNumber: 1,
        roundName: "InfyTQ Assessment",
        status: isR1Qual ? "qualified" : "not_qualified",
      },
    ];
    if (isR1Qual) {
      roundStatuses.push({
        round: infR2._id,
        roundNumber: 2,
        roundName: "Technical + HR Interview",
        status: "eligible",
      });
    }
    await Application.create({
      student: s.studentId,
      drive: infosDrive._id,
      overallStatus: isR1Qual ? "in_progress" : "rejected",
      roundStatuses,
      eliminatedAtRound: isR1Qual ? undefined : 1,
      appliedAt: new Date("2025-08-25"),
    });
    await Student.findByIdAndUpdate(s.studentId, {
      $inc: {
        "stats.drivesApplied": 1,
        "stats.drivesRejected": isR1Qual ? 0 : 1,
      },
    });
  }
  console.log("   ✅ Infosys rounds + applications created\n");
  // 7. FEEDBACK DATA
  console.log("💬 Creating feedback entries...");
  const feedbacksData = [
    // TCS Feedbacks (3 selected + 3 rejected across branches)
    {
      studentRoll: tcsR1Eligible[0],
      drive: tcsDrive,
      driveType: "on-campus",
      role: "Systems Engineer",
      outcome: tcsFinalQual.includes(tcsR1Eligible[0])
        ? "selected"
        : "rejected",
      rounds: [
        {
          roundName: "TCS NQT (Online Test)",
          description:
            "Aptitude was moderate — 30 quantitative + 25 verbal + 2 coding questions. Coding: Fibonacci with DP and String palindrome check. Time management is key.",
          challenges:
            "Coding section was tricky under time pressure. Practice at least 50 medium LeetCode problems.",
        },
        {
          roundName: "Technical Interview",
          description:
            "Interviewer asked about Array/String DSA, OOPS concepts (polymorphism in detail), and explained my major project. Also asked SQL joins.",
          challenges:
            "Was asked to write a query on the spot — DBMS preparation is important.",
        },
        {
          roundName: "HR Interview",
          description:
            "Standard HR: Tell me about yourself, why TCS, relocate?, bond awareness. Very friendly panel.",
          challenges: "Be confident and honest about bond duration.",
        },
      ],
    },
    {
      studentRoll: tcsR1Eligible[1],
      drive: tcsDrive,
      driveType: "on-campus",
      role: "Systems Engineer",
      outcome: tcsFinalQual.includes(tcsR1Eligible[1])
        ? "selected"
        : "rejected",
      rounds: [
        {
          roundName: "TCS NQT (Online Test)",
          description:
            "Verbal section was tough — RC passages were long. Coding questions were easy to medium. Completed both in 35 minutes.",
          challenges: "Start with coding to save time. Then tackle verbal.",
        },
        {
          roundName: "Technical Interview",
          description:
            "Asked me to explain my internship project in detail. Then asked difference between process and thread, deadlock conditions. Drew ER diagram on paper.",
          challenges: "Know your projects inside out — they go deep.",
        },
        {
          roundName: "HR Interview",
          description:
            "Asked about preferred technology stack and willingness to work in any domain. Discussed bond terms clearly.",
          challenges: "No major challenge. Just be natural.",
        },
      ],
    },
    {
      studentRoll: tcsR1Eligible[2],
      drive: tcsDrive,
      driveType: "on-campus",
      role: "Systems Engineer",
      outcome: "rejected",
      rounds: [
        {
          roundName: "TCS NQT (Online Test)",
          description:
            "I scored well in aptitude but made an error in one coding question. Got partial marks.",
          challenges:
            "Edge cases in coding are important. Always check constraints.",
        },
        {
          roundName: "Technical Interview",
          description:
            "Was asked to reverse a linked list — could not do it correctly under pressure. Also struggled with normalization forms.",
          challenges:
            "Practice linked list and tree problems at least 2 weeks before interviews.",
        },
      ],
    },
    // Infosys feedbacks
    {
      studentRoll: infR1Eligible[0],
      drive: infosDrive,
      driveType: "on-campus",
      role: "Systems Engineer",
      outcome: "rejected",
      rounds: [
        {
          roundName: "InfyTQ Assessment",
          description:
            "The platform has 3 sections: Reasoning (15 min), Verbal (15 min), Coding (1 question, 90 min). Coding question was on Binary Search Tree insertion.",
          challenges:
            "The Verbal section had many fill-in-the-blank grammar questions — practice English grammar.",
        },
      ],
    },
    {
      studentRoll: infR1Eligible[1],
      drive: infosDrive,
      driveType: "on-campus",
      role: "Senior Systems Engineer",
      outcome: "rejected",
      rounds: [
        {
          roundName: "InfyTQ Assessment",
          description:
            "Cleared the test easily — the reasoning and coding sections were straightforward. Coding: HashMap frequency count problem.",
          challenges:
            "Nothing too difficult. Just be consistent with practice.",
        },
      ],
    },
    // Off-campus feedback — SIH
    {
      studentRoll: tcsR1Eligible[0],
      drive: createdOffDrives[1],
      driveType: "off-campus", // SIH
      role: "Team Leader",
      outcome: "rejected",
      rounds: [
        {
          roundName: "Internal Hackathon (College Level)",
          description:
            "Built a smart waste management system using IoT sensors + ML model. Presented to a panel of 3 judges for 10 minutes.",
          challenges:
            "Time constraint to build a working prototype in 36 hours. Team coordination was tough.",
        },
        {
          roundName: "National Level SIH Round",
          description:
            "Our problem statement was from Ministry of Railways. We built a real-time train delay prediction model. Got to Top 10 but not finals.",
          challenges:
            "Competitors from IITs and NITs were extremely strong. Keep your solution practical and demo-ready.",
        },
      ],
    },
  ];

  for (const fb of feedbacksData) {
    const studentInfo = studentMap[fb.studentRoll];
    if (!studentInfo) continue;
    try {
      await Feedback.create({
        driveRef: { driveId: fb.drive._id, driveType: fb.driveType },
        student: studentInfo.studentId,
        companyName: fb.drive.companyName,
        role: fb.role,
        passedOutYear: studentInfo.batch,
        rounds: fb.rounds,
        outcome: fb.outcome,
      });
      // Mark feedbackSubmitted on application if on-campus
      if (fb.driveType === "on-campus") {
        await Application.updateOne(
          { student: studentInfo.studentId, drive: fb.drive._id },
          { $set: { feedbackSubmitted: true } },
        );
      }
    } catch (e) {
      // Skip if duplicate
    }
  }
  console.log("   ✅ Feedback entries created\n");
  // SUMMARY
  console.log("_____________________________");
  console.log("✅  SEED COMPLETE — Collections populated");
  console.log("_____________________________\n");

  console.log("📋  LOGIN CREDENTIALS\n");
  console.log("  ── COORDINATOR ──────────────────────────────────────");
  console.log(`  Email   : ${CONFIG.coordinator.email}`);
  console.log(`  Password: ${CONFIG.coordinator.password}`);
  console.log(`  Note    : isFirstLogin = false (no password change needed)\n`);

  console.log("  ── STUDENTS (all 36) ────────────────────────────────");
  console.log(`  Default Password: ${CONFIG.defaultPassword}`);
  console.log(
    `  Note: isFirstLogin = true (must change password on first login)\n`,
  );
  console.log("  Sample test accounts (custom emails):");
  for (const [roll, email] of Object.entries(CONFIG.customStudentEmails)) {
    const s = studentMap[roll];
    if (s)
      console.log(
        `  ${roll}  |  ${email}  |  CGPA: ${s.cgpa}  |  ${s.branch}  |  Batch ${s.batch}`,
      );
  }
  console.log("\n  All student roll numbers and emails:");
  for (const [roll, info] of Object.entries(studentMap)) {
    console.log(
      `  ${roll}  |  ${info.email}  |  CGPA: ${info.cgpa}  |  ${info.branch} ${info.batch}`,
    );
  }

  console.log("\n📊  COLLECTION COUNTS");
  const counts = await Promise.all([
    User.countDocuments(),
    Student.countDocuments(),
    OnCampusDrive.countDocuments(),
    OffCampusDrive.countDocuments(),
    Round.countDocuments(),
    Application.countDocuments(),
    Feedback.countDocuments(),
    AuditLog.countDocuments(),
  ]);
  const names = [
    "users",
    "students",
    "oncampusdrives",
    "offcampusdrives",
    "rounds",
    "applications",
    "feedbacks",
    "auditlogs",
  ];
  names.forEach((n, i) => console.log(`  ${n.padEnd(20)} : ${counts[i]}`));

  console.log("\n🎯  TEST SCENARIOS READY:");
  console.log(
    '  1. TCS drive is FROZEN — coordinator cannot edit it. View selectionRatio = "3/6"',
  );
  console.log(
    "  2. Infosys drive — Round 2 eligible list uploaded, results pending → in_progress students",
  );
  console.log(
    "  3. Wipro / Amazon / Zoho / Microsoft — registration open, no rounds yet",
  );
  console.log(
    "  4. Off-campus drives — 4 verified opportunities visible to eligible students",
  );
  console.log(
    '  5. Student with low CGPA (< cutoff) — sees drives in Past Drives with "Not eligible" label',
  );
  console.log(
    "  6. Feedbacks — TCS (3 entries) + Infosys (2 entries) + SIH (1 entry)",
  );
  console.log(
    "  7. Applications — TCS (selected/rejected mix) + Infosys (in_progress/rejected mix)\n",
  );
  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB. Happy testing!\n");
}
seed().catch((err) => {
  console.error("\n❌ Seed failed:", err.message);
  console.error(err);
  process.exit(1);
});
