import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Globe2,
  Building2,
  UsersRound,
    Download,
  // ChartNoAxesCombined,
  ArrowRight,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

import { coordinatorAPI } from "../../services/api";
import {
  Card,
  StatCard,
  LoadingPage,
  Button,
  Badge,
} from "../../components/ui";
import toast from "react-hot-toast";

/*
 * JobLens orange theme palette.
 * Each branch receives a different shade while staying
 * consistent with the project theme.
 */
const BRANCH_COLORS = [
  "#E67E22",
  "#D35400",
  "#F39C12",
  "#F57C00",
  "#FF8A3D",
  "#C96B00",
  "#FFB74D",
  "#A94F00",
  "#FF9800",
];

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

const getBranchColor = (branch) => {
  const index = BRANCHES.indexOf(branch);
  return BRANCH_COLORS[index >= 0 ? index : 0];
};

export default function CoordinatorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardView, setDashboardView] = useState("overview");
const [selectedBatch, setSelectedBatch] = useState(null);
const [selectedBranch, setSelectedBranch] = useState(null);
const [placementStats, setPlacementStats] = useState(null);
const [placementLoading, setPlacementLoading] = useState(false);
const [branchStudents, setBranchStudents] = useState([]);
const [studentsLoading, setStudentsLoading] = useState(false);
const [studentPage, setStudentPage] = useState(1);
const [studentTotal, setStudentTotal] = useState(0);
const [studentFilters, setStudentFilters] = useState({
  minCgpa: "",
  maxCgpa: "",
  maxBacklogs: "",
  skill: "",
});
const [selectedStudent, setSelectedStudent] = useState(null);
const [studentProfileLoading, setStudentProfileLoading] = useState(false);
  const navigate = useNavigate();
  const openStudentProfile = async (studentId) => {
  try {
    setStudentProfileLoading(true);

    const res = await coordinatorAPI.getStudentDetail(studentId);

    setSelectedStudent(res.data.data);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to load student profile"
    );
  } finally {
    setStudentProfileLoading(false);
  }
};
const downloadStudentList = async () => {
  try {
    setStudentsLoading(true);

    const res = await coordinatorAPI.getStudents({
      batch: selectedBatch,
      branch: selectedBranch,
      page: 1,
      limit: 10000,
      minCgpa: studentFilters.minCgpa || undefined,
      maxCgpa: studentFilters.maxCgpa || undefined,
      maxBacklogs: studentFilters.maxBacklogs || undefined,
      skill: studentFilters.skill.trim() || undefined,
    });

    const students = res.data.data?.students || [];

    if (students.length === 0) {
      toast.error("No students found to download");
      return;
    }

    const escapeCsv = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = [
      [
        "Name",
        "Roll Number",
        "Email",
        "Branch",
        "Batch",
        "CGPA",
        "Backlogs",
        "Skills",
      ],

      ...students.map((student) => [
        student.name || "",
        student.rollNumber || "",
        student.collegeEmail || student.email || "",
        student.branch || "",
        student.passedOutYear || "",
        student.cgpa ?? "",
        student.activeBacklogs ?? "",
        Array.isArray(student.skills)
          ? student.skills
              .map((skill) =>
                typeof skill === "string"
                  ? skill
                  : skill?.name || skill?.title || ""
              )
              .filter(Boolean)
              .join(", ")
          : "",
      ]),
    ];

    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `students-${selectedBatch}-${selectedBranch}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    toast.success(`${students.length} students downloaded`);
  } catch (error) {
    toast.error(
      error.response?.data?.message ||
        "Failed to download students list"
    );
  } finally {
    setStudentsLoading(false);
  }
};

  useEffect(() => {
    coordinatorAPI
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
  if (dashboardView !== "placements" || !selectedBatch) {
    return;
  }

  setPlacementLoading(true);

  coordinatorAPI
    .getPlacementStats(selectedBatch)
    .then((res) => {
      setPlacementStats(res.data.data);
    })
    .catch(() => {
      toast.error("Failed to load placement statistics");
      setPlacementStats(null);
    })
    .finally(() => {
      setPlacementLoading(false);
    });
}, [dashboardView, selectedBatch]);
useEffect(() => {
  if (
    dashboardView !== "student-branch" ||
    !selectedBatch ||
    !selectedBranch
  ) {
    return;
  }

  setStudentsLoading(true);

  coordinatorAPI
    .getStudents({
      batch: selectedBatch,
      branch: selectedBranch,
      page: studentPage,
      limit: 20,
      minCgpa: studentFilters.minCgpa || undefined,
      maxCgpa: studentFilters.maxCgpa || undefined,
      maxBacklogs: studentFilters.maxBacklogs || undefined,
      skill: studentFilters.skill.trim() || undefined,
    })
    .then((res) => {
  const result = res.data.data;

  setBranchStudents(result.students || []);

  setStudentTotal(
    result.pagination?.total ?? result.total ?? 0
  );
})
    .catch(() => {
      toast.error("Failed to load students");
      setBranchStudents([]);
      setStudentTotal(0);
    })
    .finally(() => {
      setStudentsLoading(false);
    });
}, [
  dashboardView,
  selectedBatch,
  selectedBranch,
  studentPage,
  studentFilters,
]);
  if (loading) {
    return <LoadingPage text="Loading dashboard..." />;
  }

  if (!data) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-secondary)",
        }}
      >
        Failed to load dashboard
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        paddingBottom: "30px",
      }}
    >
      {dashboardView === "overview" && (
           <>
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(230,126,34,0.12)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(230,126,34,0.22)",
              }}
            >
              {/* <ChartNoAxesCombined size={22} /> */}
              <TrendingUp size={22} />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "30px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Placement Dashboard
            </h1>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              margin: 0,
              fontSize: "14px",
            }}
          >
            Monitor drives, student placements and batch-wise statistics.
          </p>
        </div>

        <Button
          onClick={() => navigate("/coordinator/drives/new")}
          style={{
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
            padding: "11px 18px",
            borderRadius: "10px",
            fontWeight: 700,
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          <BriefcaseBusiness size={16} />
          New Drive
        </Button>
      </section>

      {/* =====================================================
          SUMMARY STATISTICS
      ====================================================== */}
      <section>
        <div
  className="coordinator-summary-grid"
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "14px",
  }}
>
          <StatCard
            label="Active Drives"
            value={data.summary.activeDrives}
            icon={<BriefcaseBusiness size={22} />}
            color="var(--accent-primary)"
          />

          <StatCard
            label="Completed Drives"
            value={data.summary.frozenDrives}
            icon={<CheckCircle2 size={22} />}
            color="var(--accent-success)"
          />

          <StatCard
            label="Off-Campus Drives"
            value={data.summary.totalOffCampusDrives}
            icon={<Globe2 size={22} />}
            color="#C96B00"
          />

          <StatCard
            label="Total On-Campus"
            value={data.summary.totalOnCampusDrives}
            icon={<Building2 size={22} />}
            color="#F57C00"
          />
        </div>
      </section>

      {/* =====================================================
          BATCH-WISE PLACEMENT STATISTICS
      ====================================================== */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: "12px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Batch-wise Placement Statistics
            </h2>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              Explore students and placement performance by batch and branch.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            <TrendingUp size={15} />
            Placement overview
          </div>
        </div>

        <div
          style={{
            display: "grid",
           gridTemplateColumns:
  "repeat(2, minmax(0, 1fr))",
gap: "18px",
          }}
        >
          
          {dashboardView === "overview" && data.batchData.map((batch) => {
            const pieData = batch.branches
              .filter((branch) => branch.total > 0)
              .map((branch) => ({
                name: branch.branch,
                value: branch.total,
                selected: branch.selected,
                fill: getBranchColor(branch.branch),
              }));

            return (
              <Card
                key={batch.batch}
                style={{
                  padding: "18px",
overflow: "hidden",
minWidth: 0,
                }}
              >
                {/* Batch Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <GraduationCap
                        size={19}
                        color="var(--accent-primary)"
                      />

                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "19px",
                          fontWeight: 800,
                          margin: 0,
                        }}
                      >
                        Batch {batch.batch}
                      </h3>
                    </div>

                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "12px",
                        margin: "6px 0 0 27px",
                      }}
                    >
                      {batch.selected} placed out of {batch.total} students
                    </p>
                  </div>

                  <Badge
                    variant={
                      batch.placementPercent >= 70
                        ? "success"
                        : batch.placementPercent >= 40
                          ? "warning"
                          : "danger"
                    }
                  >
                    {batch.placementPercent}%
                  </Badge>
                </div>

                {/* Placement Progress */}
                <div
                  style={{
                    height: "6px",
                    width: "100%",
                    background: "var(--bg-elevated)",
                    borderRadius: "999px",
                    overflow: "hidden",
                    margin: "16px 0",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        batch.placementPercent,
                        100
                      )}%`,
                      height: "100%",
                      background:
                        "linear-gradient(90deg, var(--accent-primary), #F57C00)",
                      borderRadius: "999px",
                    }}
                  />
                </div>

                {/* Donut Chart */}
                {pieData.length > 0 ? (
                  <div style={{ height: "205px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={54}
                          outerRadius={82}
                          dataKey="value"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {pieData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.fill}
                              opacity={0.9}
                            />
                          ))}
                        </Pie>

                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-elevated)",
                            border: "1px solid var(--border)",
                            borderRadius: "10px",
                            fontSize: "12px",
                          }}
                          formatter={(value, name, props) => [
                            `${props.payload.selected}/${value} placed`,
                            name,
                          ]}
                        />

                        {/* Center Text */}
                        <text
                          x="50%"
                          y="47%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fill: "var(--text-primary)",
                            fontSize: "22px",
                            fontWeight: 800,
                          }}
                        >
                          {batch.placementPercent}%
                        </text>

                        <text
                          x="50%"
                          y="58%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fill: "var(--text-muted)",
                            fontSize: "10px",
                          }}
                        >
                          PLACED
                        </text>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div
                    style={{
                      height: "205px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      fontSize: "13px",
                    }}
                  >
                    No branch data available
                  </div>
                )}

                {/* Branch Legend */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "8px",
                    marginTop: "4px",
                    marginBottom: "18px",
                  }}
                >
                  {pieData.map((branch) => (
                    <div
                      key={branch.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          width: "9px",
                          height: "9px",
                          minWidth: "9px",
                          borderRadius: "50%",
                          background: branch.fill,
                          boxShadow: `0 0 0 3px ${branch.fill}18`,
                        }}
                      />

                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {branch.name}
                      </span>

                      <span
                        style={{
                          marginLeft: "auto",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {branch.total}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "9px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
  setSelectedBatch(batch.batch);
  setSelectedBranch(null);
  setDashboardView("students");
}}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "10px 10px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "9px",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 650,
                    }}
                  >
                    <UsersRound size={15} />
                    View Students
                    <ArrowRight size={14} />
                  </button>

                  <button
                    type="button"
                   onClick={() => {
  setSelectedBatch(batch.batch);
  setSelectedBranch(null);
  setDashboardView("placements");
}}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "10px 10px",
                      background: "var(--accent-primary)",
                      border: "1px solid var(--accent-primary)",
                      borderRadius: "9px",
                      color: "var(--bg-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {/* <ChartNoAxesCombined size={15} /> */}
                    <TrendingUp size={15} />
                    Track Placements
                    <ArrowRight size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

 
          </>
    )}
    {dashboardView === "students" && selectedBatch && (
  <div>
    {(() => {
      const selectedBatchData = data.batchData.find(
        (batch) => String(batch.batch) === String(selectedBatch)
      );

      if (!selectedBatchData) {
        return (
          <Card style={{ padding: "30px", textAlign: "center" }}>
            Batch data not available.
          </Card>
        );
      }

      return (
        <>
          {/* Student Dashboard Header */}
          <section
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(230,126,34,0.12)",
                    color: "var(--accent-primary)",
                    border: "1px solid rgba(230,126,34,0.22)",
                  }}
                >
                  <UsersRound size={22} />
                </div>

                <h1
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "30px",
                    fontWeight: 800,
                    margin: 0,
                  }}
                >
                  Batch {selectedBatch} — Student Dashboard
                </h1>
              </div>

              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: 0,
                  fontSize: "14px",
                }}
              >
                View student statistics and branch-wise student details.
              </p>
            </div>
      
            <button
              type="button"
              onClick={() => {
                setSelectedBatch(null);
                setSelectedBranch(null);
                setDashboardView("overview");
              }}
              style={{
                padding: "10px 15px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                borderRadius: "9px",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 650,
              }}
            >
              ← Back to Dashboard
            </button>
          </section>

          {/* Batch Statistics */}
          <section>
           <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  }}
>
              <StatCard
                label="Total Students"
                value={selectedBatchData.total}
                icon={<UsersRound size={22} />}
                color="var(--accent-primary)"
              />

              <StatCard
                label="Selected Students"
                value={selectedBatchData.selected}
                icon={<CheckCircle2 size={22} />}
                color="var(--accent-success)"
              />

              <StatCard
                label="Placement Percentage"
                value={`${selectedBatchData.placementPercent}%`}
                icon={<TrendingUp size={22} />}
                color="#F57C00"
              />
            </div>
          </section>

          {/* Branch-wise Student Statistics */}
          <section>
            <div style={{ marginBottom: "18px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Branch-wise Student Statistics
              </h2>

              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                Select a branch to view its students and detailed filters.
              </p>
            </div>

            <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  }}
>
              {selectedBatchData.branches.map((branch) => (
                <Card
                  key={branch.branch}
                  style={{
                    padding: "18px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `${getBranchColor(branch.branch)}18`,
                          color: getBranchColor(branch.branch),
                        }}
                      >
                        <UsersRound size={18} />
                      </div>

                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 800,
                          }}
                        >
                          {branch.branch}
                        </h3>

                        <p
                          style={{
                            margin: "3px 0 0",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                          }}
                        >
                          Batch {selectedBatch}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        branch.percentage >= 70
                          ? "success"
                          : branch.percentage >= 40
                            ? "warning"
                            : "danger"
                      }
                    >
                      {branch.percentage}%
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Students
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "18px",
                          fontWeight: 800,
                        }}
                      >
                        {branch.total}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Selected
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "var(--accent-primary)",
                        }}
                      >
                        {branch.selected}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranch(branch.branch);
                      setDashboardView("student-branch");
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "10px",
                      background: "var(--accent-primary)",
                      border: "1px solid var(--accent-primary)",
                      borderRadius: "9px",
                      color: "var(--bg-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <UsersRound size={15} />
                    View Details
                    <ArrowRight size={14} />
                  </button>
                </Card>
              ))}
            </div>
          </section>
        </>
      );
    })()}
  </div>
)}
{dashboardView === "student-branch" &&
  selectedBatch &&
  selectedBranch && (
    <div>
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "22px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(230,126,34,0.12)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(230,126,34,0.22)",
              }}
            >
              <UsersRound size={22} />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "30px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Batch {selectedBatch} — {selectedBranch}
            </h1>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              margin: 0,
              fontSize: "14px",
            }}
          >
            Students and eligibility details for this branch.
          </p>
        </div>

      <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    onClick={downloadStudentList}
    disabled={studentsLoading}
    style={{
      padding: "10px 15px",
      background: "var(--accent-primary)",
      border: "1px solid var(--accent-primary)",
      borderRadius: "9px",
      color: "var(--bg-primary)",
      cursor: studentsLoading ? "not-allowed" : "pointer",
      fontSize: "12px",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      gap: "7px",
      opacity: studentsLoading ? 0.6 : 1,
    }}
  >
    <Download size={15} />
    Download Students
  </button>

  <button
    type="button"
    onClick={() => {
      setSelectedBranch(null);
      setDashboardView("students");
      setBranchStudents([]);
      setStudentPage(1);
    }}
    style={{
      padding: "10px 15px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "9px",
      color: "var(--text-primary)",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 650,
    }}
  >
    ← Back to Branches
  </button>
</div>
      </section>

      <Card style={{ padding: "18px", marginBottom: "18px" }}>
        <div
          style={{
            display: "grid",
           gridTemplateColumns: "repeat(4, minmax(0, 1fr)) auto",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              Minimum CGPA
            </label>

            <input
              type="number"
              step="0.1"
              value={studentFilters.minCgpa}
              onChange={(e) =>
                setStudentFilters((prev) => ({
                  ...prev,
                  minCgpa: e.target.value,
                }))
              }
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              Maximum CGPA
            </label>

            <input
              type="number"
              step="0.1"
              value={studentFilters.maxCgpa}
              onChange={(e) =>
                setStudentFilters((prev) => ({
                  ...prev,
                  maxCgpa: e.target.value,
                }))
              }
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "11px",
                color: "var(--text-muted)",
              }}
            >
              Maximum Backlogs
            </label>

            <input
              type="number"
              min="0"
              value={studentFilters.maxBacklogs}
              onChange={(e) =>
                setStudentFilters((prev) => ({
                  ...prev,
                  maxBacklogs: e.target.value,
                }))
              }
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div>
  <label
    style={{
      display: "block",
      marginBottom: "6px",
      fontSize: "11px",
      color: "var(--text-muted)",
    }}
  >
    Skill
  </label>

  <input
    type="text"
    value={studentFilters.skill}
    onChange={(e) =>
      setStudentFilters((prev) => ({
        ...prev,
        skill: e.target.value,
      }))
    }
    placeholder="e.g. React, Java"
    style={{
      width: "100%",
      padding: "9px 10px",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      background: "var(--bg-elevated)",
      color: "var(--text-primary)",
    }}
  />
</div>
          <button
            type="button"
            onClick={() => setStudentPage(1)}
            style={{
              padding: "9px 14px",
              background: "var(--accent-primary)",
              border: "1px solid var(--accent-primary)",
              borderRadius: "8px",
              color: "var(--bg-primary)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Apply Filters
          </button>
        </div>
      </Card>

      <Card style={{ padding: "0", overflow: "hidden" }}>
        {studentsLoading ? (
          <div
            style={{
              padding: "45px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            Loading students...
          </div>
        ) : branchStudents.length === 0 ? (
          <div
            style={{
              padding: "45px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            No students found for this branch.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--bg-elevated)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Name
                  </th>
                  <th style={{ padding: "12px", textAlign: "left" }}>
                    Roll Number
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    CGPA
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
                    Backlogs
                  </th>
                  <th style={{ padding: "12px", textAlign: "center" }}>
  Profile
</th>
                </tr>
              </thead>

              <tbody>
                {branchStudents.map((student) => (
                  <tr
                    key={student._id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px",
                        fontWeight: 650,
                      }}
                    >
                      {student.name || student.fullName || "—"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {student.rollNumber || student.rollNo || "—"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      {student.cgpa ?? "—"}
                    </td>

                    <td
                      style={{
                        padding: "12px",
                        textAlign: "center",
                      }}
                    >
                      {student.backlogs ?? 0}
                    </td>
                    <td
  style={{
    padding: "12px",
    textAlign: "center",
  }}
>
  <button
    type="button"
    onClick={() => openStudentProfile(student._id)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      padding: "7px 12px",
      background: "var(--bg-elevated)",
      border: "1px solid var(--border)",
      borderRadius: "7px",
      color: "var(--accent-primary)",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: 700,
    }}
  >
    Profile
    <ArrowRight size={13} />
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {studentTotal > 20 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            marginTop: "18px",
          }}
        >
          <button
            type="button"
            disabled={studentPage === 1}
            onClick={() =>
              setStudentPage((page) => Math.max(1, page - 1))
            }
            style={{
              padding: "8px 13px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              cursor:
                studentPage === 1 ? "not-allowed" : "pointer",
              opacity: studentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </button>

          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            Page {studentPage} of {Math.ceil(studentTotal / 20)}
          </span>

          <button
            type="button"
            disabled={
              studentPage >= Math.ceil(studentTotal / 20)
            }
            onClick={() =>
              setStudentPage((page) => page + 1)
            }
            style={{
              padding: "8px 13px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text-primary)",
              cursor:
                studentPage >= Math.ceil(studentTotal / 20)
                  ? "not-allowed"
                  : "pointer",
              opacity:
                studentPage >= Math.ceil(studentTotal / 20)
                  ? 0.5
                  : 1,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )}
  {dashboardView === "placements" && selectedBatch && (
  <div>
    {placementLoading ? (
      <Card
        style={{
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <TrendingUp
          size={30}
          color="var(--accent-primary)"
          style={{ marginBottom: "12px" }}
        />

        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Loading placement statistics...
        </div>

        <div
          style={{
            marginTop: "5px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          Loading data for Batch {selectedBatch}
        </div>
      </Card>
    ) : !placementStats ? (
      <Card
        style={{
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Placement data unavailable
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}
        >
          We could not load placement statistics for Batch{" "}
          {selectedBatch}.
        </div>

        <button
          type="button"
          onClick={() => {
            setDashboardView("overview");
            setSelectedBatch(null);
          }}
          style={{
            marginTop: "18px",
            padding: "9px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          ← Back to Dashboard
        </button>
      </Card>
    ) : (
      <>
        {/* Placement Dashboard Header */}
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            marginBottom: "22px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(230,126,34,0.12)",
                  color: "var(--accent-primary)",
                  border: "1px solid rgba(230,126,34,0.22)",
                }}
              >
                <TrendingUp size={22} />
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "30px",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Batch {selectedBatch} — Placement Dashboard
              </h1>
            </div>

            <p
              style={{
                color: "var(--text-secondary)",
                margin: 0,
                fontSize: "14px",
              }}
            >
              View placement performance and branch-wise statistics.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlacementStats(null);
              setSelectedBatch(null);
              setSelectedBranch(null);
              setDashboardView("overview");
            }}
            style={{
              padding: "10px 15px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "9px",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 650,
            }}
          >
            ← Back to Dashboard
          </button>
        </section>

        {/* Placement Summary */}
        <section>
          <div
            className="coordinator-placement-summary-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            <StatCard
              label="Total Students"
              value={placementStats.totalStudents || 0}
              icon={<UsersRound size={22} />}
              color="var(--accent-primary)"
            />

            <StatCard
              label="Selected Students"
              value={placementStats.totalSelected || 0}
              icon={<CheckCircle2 size={22} />}
              color="var(--accent-success)"
            />

            <StatCard
              label="Placement Percentage"
              value={`${placementStats.overallPlacementPercent || 0}%`}
              icon={<TrendingUp size={22} />}
              color="#F57C00"
            />
          </div>
        </section>

        {/* Branch-wise Placement Statistics */}
        <section>
          <div style={{ marginBottom: "18px" }}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Branch-wise Placement Statistics
            </h2>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              Select a branch to view its placement drives.
            </p>
          </div>

          <div
            className="coordinator-placement-branch-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            {(placementStats.branchBreakdown || []).map(
              (branch) => (
                <Card
                  key={branch.branch}
                  style={{
                    padding: "18px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: `${getBranchColor(
                            branch.branch
                          )}18`,
                          color: getBranchColor(
                            branch.branch
                          ),
                        }}
                      >
                        <GraduationCap size={18} />
                      </div>

                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: 800,
                          }}
                        >
                          {branch.branch}
                        </h3>

                        <p
                          style={{
                            margin: "3px 0 0",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                          }}
                        >
                          Batch {selectedBatch}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        branch.percentage >= 70
                          ? "success"
                          : branch.percentage >= 40
                            ? "warning"
                            : "danger"
                      }
                    >
                      {branch.percentage}%
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Students
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "18px",
                          fontWeight: 800,
                        }}
                      >
                        {branch.total}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "10px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Selected
                      </div>

                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "18px",
                          fontWeight: 800,
                          color: "var(--accent-primary)",
                        }}
                      >
                        {branch.selected}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBranch(branch.branch);
                      setDashboardView(
                        "placement-branch"
                      );
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      padding: "10px",
                      background: "var(--accent-primary)",
                      border:
                        "1px solid var(--accent-primary)",
                      borderRadius: "9px",
                      color: "var(--bg-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <TrendingUp size={15} />
                    View Details
                    <ArrowRight size={14} />
                  </button>
                </Card>
              )
            )}
          </div>
        </section>
      </>
    )}
  </div>
)}
{dashboardView === "placement-branch" &&
  selectedBatch &&
  selectedBranch &&
  placementStats && (
    <div>
      {/* Branch Placement Header */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(230,126,34,0.12)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(230,126,34,0.22)",
              }}
            >
              <Building2 size={22} />
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "30px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Batch {selectedBatch} — {selectedBranch} Placement Details
            </h1>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              margin: 0,
              fontSize: "14px",
            }}
          >
            Placement drives available for {selectedBranch} students.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedBranch(null);
            setDashboardView("placements");
          }}
          style={{
            padding: "10px 15px",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "9px",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 650,
          }}
        >
          ← Back to Placements
        </button>
      </section>

      {/* On-Campus Drives */}
      <section style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            marginBottom: "16px",
          }}
        >
          <Building2
            size={19}
            color="var(--accent-primary)"
          />

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: 800,
              }}
            >
              On-Campus Drives
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              On-campus opportunities available for {selectedBranch}.
            </p>
          </div>
        </div>

        {(() => {
          const branchOnCampusDrives = (
            placementStats.onCampusDrives || []
          ).filter((drive) =>
            (drive.eligibleBranches || []).some(
              (branch) =>
                String(branch).toUpperCase() ===
                String(selectedBranch).toUpperCase()
            )
          );

          if (branchOnCampusDrives.length === 0) {
            return (
              <Card
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                }}
              >
                <Building2
                  size={28}
                  color="var(--text-muted)"
                  style={{ marginBottom: "8px" }}
                />

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  No On-Campus Drives
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  No On-Campus drives are currently available
                  for {selectedBranch}.
                </p>
              </Card>
            );
          }

          return (
            <div
              className="coordinator-placement-drive-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              {branchOnCampusDrives.map((drive) => (
                <Card
                  key={drive._id}
                  style={{
                    padding: "18px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 800,
                        }}
                      >
                        {drive.companyName ||
                          drive.driveName ||
                          "On-Campus Drive"}
                      </h3>

                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        On-Campus
                      </p>
                    </div>

                    <Badge
                      variant={
                        drive.status === "completed"
                          ? "success"
                          : "warning"
                      }
                    >
                      {drive.status || "active"}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginTop: "18px",
                    }}
                  >
                    <div
                      style={{
                        padding: "11px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Eligible Batches
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {selectedBatch}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "11px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Rounds
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {Array.isArray(drive.rounds)
                          ? drive.rounds.length
                          : 0}
                      </div>
                    </div>
                  </div>

                  {drive.registrationDeadline && (
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Registration deadline:{" "}
                      {new Date(
                        drive.registrationDeadline
                      ).toLocaleDateString()}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          );
        })()}
      </section>

      {/* Off-Campus Drives */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            marginBottom: "16px",
          }}
        >
          <Globe2
            size={19}
            color="var(--accent-primary)"
          />

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                fontWeight: 800,
              }}
            >
              Off-Campus Drives
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: "12px",
                color: "var(--text-secondary)",
              }}
            >
              External opportunities available for {selectedBranch}.
            </p>
          </div>
        </div>

        {(() => {
          const branchOffCampusDrives = (
            placementStats.offCampusDrives || []
          ).filter((drive) =>
            (drive.eligibleBranches || []).some(
              (branch) =>
                String(branch).toUpperCase() ===
                String(selectedBranch).toUpperCase()
            )
          );

          if (branchOffCampusDrives.length === 0) {
            return (
              <Card
                style={{
                  padding: "35px 20px",
                  textAlign: "center",
                }}
              >
                <Globe2
                  size={28}
                  color="var(--text-muted)"
                  style={{ marginBottom: "8px" }}
                />

                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  No Off-Campus Drives
                </div>

                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}
                >
                  No Off-Campus drives are currently available
                  for {selectedBranch}.
                </p>
              </Card>
            );
          }

          return (
            <div
              className="coordinator-placement-drive-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "14px",
              }}
            >
              {branchOffCampusDrives.map((drive) => (
                <Card
                  key={drive._id}
                  style={{
                    padding: "18px",
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: "16px",
                          fontWeight: 800,
                        }}
                      >
                        {drive.companyName ||
                          drive.driveName ||
                          "Off-Campus Drive"}
                      </h3>

                      <p
                        style={{
                          margin: "5px 0 0",
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {drive.category ||
                          "External Opportunity"}
                      </p>
                    </div>

                    <Badge variant="success">
                      VERIFIED
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginTop: "18px",
                    }}
                  >
                    <div
                      style={{
                        padding: "11px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Category
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "13px",
                          fontWeight: 700,
                        }}
                      >
                        {drive.category || "Other"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "11px",
                        borderRadius: "9px",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        Batch
                      </div>

                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "14px",
                          fontWeight: 700,
                        }}
                      >
                        {selectedBatch}
                      </div>
                    </div>
                  </div>

                  {drive.applicationDeadline && (
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "11px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Application deadline:{" "}
                      {new Date(
                        drive.applicationDeadline
                      ).toLocaleDateString()}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          );
        })()}
      </section>
    </div>
  )}
  
{/* =====================================================
    STUDENT PROFILE MODAL
====================================================== */}
{selectedStudent && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}
    onClick={() => setSelectedStudent(null)}
  >
    <div
      style={{
       width: "min(1100px, 95vw)",
maxHeight: "88vh",
overflowY: "auto",
background: "var(--bg-primary)",
border: "1px solid rgba(230,126,34,0.25)",
borderRadius: "20px",
padding: "28px",
boxShadow: "0 25px 80px rgba(0,0,0,0.45)",
scrollbarWidth: "thin",
scrollbarColor: "rgba(230,126,34,0.45) transparent",
       
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          marginBottom: "25px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {selectedStudent.student?.name ||
              selectedStudent.name ||
              "Student Profile"}
          </h2>

          <p
            style={{
              margin: "7px 0 0",
              color: "var(--text-secondary)",
            }}
          >
            {selectedStudent.student?.rollNumber ||
              selectedStudent.rollNumber ||
              "—"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStudent(null)}
          style={{
            border: "none",
            background: "rgba(230,126,34,0.1)",
            color: "var(--accent-primary)",
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "20px",
            fontWeight: 700,
          }}
        >
          ×
        </button>
      </div>

      {studentProfileLoading ? (
        <div
          style={{
            padding: "60px 20px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          Loading student profile...
        </div>
      ) : (
        <>
          {/* Personal Information */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "16px",
                color: "var(--text-primary)",
              }}
            >
              Personal Information
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
              }}
            >
              <div>
                <strong>Name</strong>
                <div>
                  {selectedStudent.student?.name ||
                    selectedStudent.name ||
                    "—"}
                </div>
              </div>

              <div>
                <strong>Roll Number</strong>
                <div>
                  {selectedStudent.student?.rollNumber ||
                    selectedStudent.rollNumber ||
                    "—"}
                </div>
              </div>

              <div>
                <strong>Branch</strong>
                <div>
                  {selectedStudent.student?.branch ||
                    selectedStudent.branch ||
                    "—"}
                </div>
              </div>

              <div>
                <strong>Passed Out Year</strong>
                <div>
                  {selectedStudent.student?.passedOutYear ||
                    selectedStudent.passedOutYear ||
                    "—"}
                </div>
              </div>

              <div>
                <strong>College Email</strong>
                <div>
                  {selectedStudent.student?.collegeEmail ||
                    selectedStudent.collegeEmail ||
                    "—"}
                </div>
              </div>

              <div>
                <strong>CGPA</strong>
                <div>
                  {selectedStudent.student?.cgpa ??
                    selectedStudent.cgpa ??
                    "—"}
                </div>
              </div>

              <div>
                <strong>Active Backlogs</strong>
                <div>
                  {selectedStudent.student?.activeBacklogs ??
                    selectedStudent.activeBacklogs ??
                    "—"}
                </div>
              </div>
            </div>
          </section>

          {/* Skills */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Skills
            </h3>

            {(
              selectedStudent.student?.skills ||
              selectedStudent.skills ||
              []
            ).length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {(
                  selectedStudent.student?.skills ||
                  selectedStudent.skills ||
                  []
                ).map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "20px",
                      background: "rgba(230,126,34,0.1)",
                      color: "var(--accent-primary)",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {typeof skill === "string"
                      ? skill
                      : skill.name || skill.title || "Skill"}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No skills added.
              </p>
            )}
          </section>

         {/* Education */}
<section
  style={{
    marginBottom: "22px",
    padding: "20px",
    borderRadius: "14px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-secondary)",
  }}
>
  <h3
    style={{
      marginTop: 0,
      marginBottom: "16px",
      color: "var(--text-primary)",
    }}
  >
    Education
  </h3>

  {Object.entries(
    selectedStudent.student?.education ||
      selectedStudent.education ||
      {}
  ).length > 0 ? (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "14px",
      }}
    >
      {Object.entries(
        selectedStudent.student?.education ||
          selectedStudent.education ||
          {}
      ).map(([level, details]) => (
        <div
          key={level}
          style={{
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
          }}
        >
          <div
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--accent-primary)",
              marginBottom: "14px",
            }}
          >
            {level === "btech"
              ? "B.Tech"
              : level === "intermediate"
                ? "Intermediate"
                : level === "secondary"
                  ? "Secondary School"
                  : level}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "9px",
              fontSize: "13px",
            }}
          >
            {details?.institutionName && (
              <div>
                <span
                  style={{
                    color: "var(--text-muted)",
                    display: "block",
                    fontSize: "11px",
                    marginBottom: "2px",
                  }}
                >
                  Institution
                </span>

                <span
                  style={{
                    color: "var(--text-primary)",
                    fontWeight: 600,
                  }}
                >
                  {details.institutionName}
                </span>
              </div>
            )}

            {details?.percentage !== undefined &&
              details?.percentage !== null && (
                <div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "block",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  >
                    Percentage
                  </span>

                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {details.percentage}%
                  </span>
                </div>
              )}

            {details?.cgpa !== undefined &&
              details?.cgpa !== null && (
                <div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "block",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  >
                    CGPA
                  </span>

                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {details.cgpa}
                  </span>
                </div>
              )}

            {details?.yearOfCompletion !== undefined &&
              details?.yearOfCompletion !== null && (
                <div>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      display: "block",
                      fontSize: "11px",
                      marginBottom: "2px",
                    }}
                  >
                    Year of Completion
                  </span>

                  <span
                    style={{
                      color: "var(--text-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {details.yearOfCompletion}
                  </span>
                </div>
              )}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p style={{ color: "var(--text-secondary)" }}>
      No education details added.
    </p>
  )}
</section>

          {/* Projects */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Projects
            </h3>

            {(
              selectedStudent.student?.projects ||
              selectedStudent.projects ||
              []
            ).length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {(
                  selectedStudent.student?.projects ||
                  selectedStudent.projects ||
                  []
                ).map((project, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <strong>
                      {project.title ||
                        project.name ||
                        `Project ${index + 1}`}
                    </strong>

                    {project.description && (
                      <p
                        style={{
                          margin: "7px 0 0",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {project.description}
                      </p>
                    )}

                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          marginTop: "8px",
                          color: "var(--accent-primary)",
                        }}
                      >
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No projects added.
              </p>
            )}
          </section>

          {/* Internships */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Internships
            </h3>

            {(
              selectedStudent.student?.internships ||
              selectedStudent.internships ||
              []
            ).length > 0 ? (
              (
                selectedStudent.student?.internships ||
                selectedStudent.internships ||
                []
              ).map((internship, index) => (
                <div
                  key={index}
                  style={{
                    padding: "14px",
                    marginBottom: "10px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <strong>
                    {internship.company ||
                      internship.organization ||
                      `Internship ${index + 1}`}
                  </strong>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {internship.role ||
                      internship.position ||
                      ""}
                  </div>

                  {internship.description && (
                    <p
                      style={{
                        color: "var(--text-secondary)",
                      }}
                    >
                      {internship.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No internships added.
              </p>
            )}
          </section>

          {/* Certifications */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Certifications
            </h3>

            {(
              selectedStudent.student?.certifications ||
              selectedStudent.certifications ||
              []
            ).length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {(
                  selectedStudent.student?.certifications ||
                  selectedStudent.certifications ||
                  []
                ).map((certification, index) => (
                  <li
                    key={index}
                    style={{
                      marginBottom: "8px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {typeof certification === "string"
                      ? certification
                      : certification.name ||
                        certification.title ||
                        "Certification"}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No certifications added.
              </p>
            )}
          </section>

          {/* Profile Summary */}
          <section
            style={{
              marginBottom: "22px",
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Profile Summary
            </h3>

            <p
              style={{
                margin: 0,
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              {selectedStudent.student?.profileSummary ||
                selectedStudent.profileSummary ||
                "No profile summary added."}
            </p>
          </section>

          {/* Resume */}
          <section
            style={{
              padding: "20px",
              borderRadius: "14px",
              border: "1px solid var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "var(--text-primary)",
              }}
            >
              Resume
            </h3>

            {(selectedStudent.student?.resume?.url ||
              selectedStudent.student?.resume ||
              selectedStudent.resume?.url ||
              selectedStudent.resume) ? (
              <a
                href={
                  selectedStudent.student?.resume?.url ||
                  selectedStudent.student?.resume ||
                  selectedStudent.resume?.url ||
                  selectedStudent.resume
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "9px 15px",
                  borderRadius: "9px",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                View Resume
              </a>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No resume uploaded.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  </div>
)}
  </div>
);
}
