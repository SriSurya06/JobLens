import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersRound,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Download,
  Search,
  Building2,
  UserCheck,
  
} from "lucide-react";

import { coordinatorAPI } from "../../services/api";
import {
  Card,
  Badge,
  Table,
  Tr,
  Td,
  LoadingPage,
  EmptyState,
  Input,
} from "../../components/ui";
import toast from "react-hot-toast";

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

const getBranchColor = (branch) => {
  const index = BRANCHES.indexOf(branch);
  return BRANCH_COLORS[index >= 0 ? index : 0];
};

export default function StudentsPage() {
const navigate = useNavigate();
const skillDropdownRef = useRef(null);
const batchDropdownRef = useRef(null);
const branchDropdownRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState({
  batches: [],
  branches: [],
  skills: [],
  minCgpa: "",
  maxCgpa: "",
  maxBacklogs: "",
});
const [availableSkills, setAvailableSkills] = useState([]);
const [skillSearch, setSkillSearch] = useState("");

const [showBatchDropdown, setShowBatchDropdown] = useState(false);
const [showBranchDropdown, setShowBranchDropdown] = useState(false);
const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  /*
   * =========================================================
   * BATCH BRANCH DATA
   * =========================================================
   */


  /*
   * =========================================================
   * STUDENT LIST
   * =========================================================
   */

  const fetchStudents = async (p = 1) => {
  setLoading(true);

    try {
      const clean = {
  page: p,
  limit: 20,
};

if (filters.batches.length > 0) {
  clean.batches = filters.batches.join(",");
}

if (filters.branches.length > 0) {
  clean.branches = filters.branches.join(",");
}

if (filters.skills.length > 0) {
  clean.skills = filters.skills.join(",");
}

      if (filters.minCgpa !== "") {
        clean.minCgpa = filters.minCgpa;
      }

      if (filters.maxCgpa !== "") {
        clean.maxCgpa = filters.maxCgpa;
      }

      if (filters.maxBacklogs !== "") {
        clean.maxBacklogs = filters.maxBacklogs;
      }
      

      const res = await coordinatorAPI.getStudents(clean);

      setStudents(res.data.data.students || []);
      setTotal(res.data.data.pagination.total || 0);
      setPage(p);
    } catch (error) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };
useEffect(() => {
  fetchStudents(1);

  const loadSkills = async () => {
    try {
      const res = await coordinatorAPI.getStudentSkills();
      setAvailableSkills(res.data.data.skills || []);
    } catch (error) {
      toast.error("Failed to load student skills");
    }
  };

  loadSkills();
}, []);
useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      skillDropdownRef.current &&
      !skillDropdownRef.current.contains(event.target)
    ) {
      setShowSkillDropdown(false);
    }

    if (
      batchDropdownRef.current &&
      !batchDropdownRef.current.contains(event.target)
    ) {
      setShowBatchDropdown(false);
    }

    if (
      branchDropdownRef.current &&
      !branchDropdownRef.current.contains(event.target)
    ) {
      setShowBranchDropdown(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  /*
   * =========================================================
   * FILTER
   * =========================================================
   */
  const filteredSkills = availableSkills.filter((skill) =>
  skill.toLowerCase().includes(skillSearch.toLowerCase())
);

const addSkill = (skill) => {
  const value = skill.trim();

  if (!value) return;

  if (!filters.skills.includes(value)) {
    setFilters({
      ...filters,
      skills: [...filters.skills, value],
    });
  }

  setSkillSearch("");
};

const removeSkill = (skill) => {
  setFilters({
    ...filters,
    skills: filters.skills.filter((item) => item !== skill),
  });
};
const handleFilter = (e) => {
  e.preventDefault();
  fetchStudents(1);
};
  const clearFilters = () => {
  setFilters({
    batches: [],
    branches: [],
    skills: [],
    minCgpa: "",
    maxCgpa: "",
    maxBacklogs: "",
  });

  setTimeout(() => {
    fetchStudents(1);
  }, 0);
};

  /*
   * =========================================================
   * CSV
   * =========================================================
   */

  const downloadCSV = () => {
    if (!students.length) {
      toast.error("No students available to download");
      return;
    }

    const headers = [
      "Roll Number",
      "Name",
      "Branch",
      "Batch",
      "CGPA",
      "Backlogs",
      "Email",
      "Applied",
      "Selected",
    ];

    const rows = students.map((s) => [
      s.rollNumber,
      s.name,
      s.branch,
      s.passedOutYear,
      s.cgpa,
      s.activeBacklogs,
      s.collegeEmail,
      s.stats?.drivesApplied || 0,
      s.stats?.drivesSelected || 0,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "students.csv";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    toast.success("Student data downloaded");
  };

  /*
   * =========================================================
   * COMMON STYLES
   * =========================================================
   */

  const inputStyle = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
    padding: "8px 12px",
    fontSize: "13px",
  };

  /*
   * =========================================================
   * BATCH → BRANCH VIEW
   * =========================================================
   */

  /*
   * =========================================================
   * BRANCH → STUDENT LIST
   * =========================================================
   */

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        paddingBottom: "30px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
         

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
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
                border:
                  "1px solid rgba(230,126,34,0.22)",
                color: "var(--accent-primary)",
              }}
            >
              <UsersRound size={21} />
            </div>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "27px",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Student Directory
              </h1>

              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                  fontSize: "13px",
                }}
              >
                All registered students
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={downloadCSV}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            padding: "10px 16px",
            background: "var(--accent-primary)",
            color: "var(--bg-primary)",
            border: "none",
            borderRadius: "9px",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "12px",
          }}
        >
          <Download size={15} />
          Download CSV
        </button>
      </div>

      {/* Filters */}
      <Card>
        <form
          onSubmit={handleFilter}
          style={{
  display: "grid",
  gridTemplateColumns: "repeat(8, minmax(0, 1fr))",
  gap: "14px",
  alignItems: "end",
}}
        >
    <div
  ref={batchDropdownRef}
  style={{ position: "relative" }}
>
  <label
    style={{
      display: "block",
      fontSize: "10px",
      color: "var(--text-muted)",
      marginBottom: "5px",
    }}
  >
    BATCH / YEAR
  </label>

  <button
    type="button"
    onClick={() => setShowBatchDropdown(!showBatchDropdown)}
    style={{
      ...inputStyle,
      width: "100%",
      height: "40px",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <span>
      {filters.batches.length === 0
        ? "Select batch/year"
        : `${filters.batches.length} selected`}
    </span>

    <span style={{ fontSize: "11px" }}>▼</span>
  </button>

  {showBatchDropdown && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        width: "150px",
        marginTop: "5px",
        padding: "6px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        zIndex: 100,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
      {BATCHES.map((batch) => {
        const selected = filters.batches.includes(String(batch));

        return (
          <button
            key={batch}
            type="button"
            onClick={() => {
              setFilters({
                ...filters,
                batches: selected
                  ? filters.batches.filter(
                      (item) => item !== String(batch)
                    )
                  : [...filters.batches, String(batch)],
              });
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              border: "none",
              borderRadius: "6px",
              background: selected
                ? "rgba(230,126,34,0.12)"
                : "transparent",
              color: selected
                ? "var(--accent-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
            }}
          >
            <span>{selected ? "✓" : "○"}</span>
            {batch}
          </button>
        );
      })}
    </div>
  )}
</div>
<div
  ref={branchDropdownRef}
  style={{ position: "relative" }}
>
  <label
    style={{
      display: "block",
      fontSize: "10px",
      color: "var(--text-muted)",
      marginBottom: "5px",
    }}
  >
    BRANCH
  </label>

  <button
    type="button"
    onClick={() => setShowBranchDropdown(!showBranchDropdown)}
    style={{
      ...inputStyle,
     width: "100%",
      height: "40px",
      textAlign: "left",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    }}
  >
    <span>
      {filters.branches.length === 0
        ? "Select branch"
        : `${filters.branches.length} selected`}
    </span>

    <span style={{ fontSize: "11px" }}>▼</span>
  </button>

  {showBranchDropdown && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        width: "150px",
        maxHeight: "220px",
        overflowY: "auto",
        marginTop: "5px",
        padding: "6px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        zIndex: 100,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
      {BRANCHES.map((branch) => {
        const selected = filters.branches.includes(branch);

        return (
          <button
            key={branch}
            type="button"
            onClick={() => {
              setFilters({
                ...filters,
                branches: selected
                  ? filters.branches.filter(
                      (item) => item !== branch
                    )
                  : [...filters.branches, branch],
              });
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px",
              border: "none",
              borderRadius: "6px",
              background: selected
                ? "rgba(230,126,34,0.12)"
                : "transparent",
              color: selected
                ? "var(--accent-primary)"
                : "var(--text-primary)",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "12px",
            }}
          >
            <span>{selected ? "✓" : "○"}</span>
            {branch}
          </button>
        );
      })}
    </div>
  )}
</div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "5px",
              }}
            >
              MIN CGPA
            </label>

            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              style={{
                ...inputStyle,
               width: "100%",
height: "40px",
              }}
              value={filters.minCgpa}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  minCgpa: e.target.value,
                })
              }
              placeholder="0.0"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "5px",
              }}
            >
              MAX CGPA
            </label>

            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              style={{
                ...inputStyle,
                width: "100%",
                height: "40px",
              }}
              value={filters.maxCgpa}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxCgpa: e.target.value,
                })
              }
              placeholder="10.0"
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "10px",
                color: "var(--text-muted)",
                marginBottom: "5px",
              }}
            >
              MAX BACKLOGS
            </label>

            <input
              type="number"
              min="0"
              style={{
                ...inputStyle,
                width: "100%",
                height: "40px",
              }}
              value={filters.maxBacklogs}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  maxBacklogs: e.target.value,
                })
              }
              placeholder="Any"
            />
          </div>
<div
  ref={skillDropdownRef}
  style={{ position: "relative" }}
>
  <label
    style={{
      display: "block",
      fontSize: "10px",
      color: "var(--text-muted)",
      marginBottom: "5px",
    }}
  >
    SKILLS
  </label>

  <div
    onClick={() => setShowSkillDropdown(true)}
    style={{
      ...inputStyle,
      width: "100%",
      height: "40px",
      cursor: "text",
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: "5px",
      padding: "5px 8px",
    }}
  >
    {filters.skills.map((skill) => (
      <span
        key={skill}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: "4px 7px",
          borderRadius: "6px",
          background: "rgba(230,126,34,0.14)",
          color: "var(--accent-primary)",
          fontSize: "11px",
          fontWeight: 600,
        }}
      >
        {skill}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            removeSkill(skill);
          }}
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            fontSize: "13px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </span>
    ))}

    <input
      type="text"
      value={skillSearch}
      onChange={(e) => {
        setSkillSearch(e.target.value);
        setShowSkillDropdown(true);
      }}
      onFocus={() => setShowSkillDropdown(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();

          const typedSkill = skillSearch.trim();

          if (typedSkill) {
            addSkill(typedSkill);
          }
        }
      }}
      placeholder={
        filters.skills.length > 0
          ? "Add another..."
          : "Search or add skill"
      }
      style={{
        flex: 1,
        minWidth: "100px",
        border: "none",
        outline: "none",
        background: "transparent",
        color: "var(--text-primary)",
        fontSize: "12px",
      }}
    />
  </div>

  {showSkillDropdown && (
    <div
      style={{
        position: "absolute",
        top: "100%",
        left: 0,
        width: "100%",
        maxHeight: "220px",
        overflowY: "auto",
        marginTop: "5px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        zIndex: 100,
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      }}
    >
      {skillSearch.trim() &&
        !availableSkills.some(
          (skill) =>
            skill.toLowerCase() === skillSearch.trim().toLowerCase()
        ) && (
          <button
            type="button"
            onClick={() => addSkill(skillSearch)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "9px 10px",
              border: "none",
              borderBottom: "1px solid var(--border)",
              background: "transparent",
              color: "var(--accent-primary)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            + Add "{skillSearch.trim()}"
          </button>
        )}

      {filteredSkills.length > 0 ? (
        filteredSkills.map((skill) => {
          const selected = filters.skills.includes(skill);

          return (
            <button
              key={skill}
              type="button"
              onClick={() => {
                if (selected) {
                  removeSkill(skill);
                } else {
                  addSkill(skill);
                }
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                border: "none",
                background: selected
                  ? "rgba(230,126,34,0.12)"
                  : "transparent",
                color: selected
                  ? "var(--accent-primary)"
                  : "var(--text-primary)",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              {selected ? "✓ " : ""}
              {skill}
            </button>
          );
        })
      ) : !skillSearch.trim() ? (
        <div
          style={{
            padding: "10px",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          No skills available
        </div>
      ) : (
        <div
          style={{
            padding: "10px",
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          Press Enter or use Add above
        </div>
      )}
    </div>
  )}
</div>

          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 17px",
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "12px",
              width: "100%",
              height: "40px",
            }}
          >
            <Search size={14} />
            Apply Filters
          </button>

          <button
            type="button"
            onClick={clearFilters}
            style={{
              padding: "9px 16px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontSize: "12px",
              width: "100%",
              height: "40px",
            }}
          >
            Clear
          </button>
        </form>
      </Card>

      {/* Student table */}
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <LoadingPage text="Loading students..." />
        ) : students.length === 0 ? (
          <EmptyState
            icon="👥"
            title="No students found"
            description="Try adjusting your filters"
          />
        ) : (
          <>
            <Table
              headers={[
                "Roll No",
                "Name",
                "Branch",
                "Batch",
                "CGPA",
                "Backlogs",
                "Applied",
                "Selected",
                "Status",
                "Profile",
              ]}
            >
              {students.map((s) => (
                <Tr key={s._id}>
                  <Td>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "var(--accent-primary)",
                      }}
                    >
                      {s.rollNumber}
                    </span>
                  </Td>

                  <Td>
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {s.name}
                    </span>
                  </Td>

                  <Td>
                    <Badge variant="primary" size="sm">
                      {s.branch}
                    </Badge>
                  </Td>

                  <Td>{s.passedOutYear}</Td>

                  <Td>
                    <span
                      style={{
                        color:
                          s.cgpa >= 8
                            ? "var(--accent-green)"
                            : s.cgpa >= 6
                              ? "var(--accent-primary)"
                              : "var(--accent-orange)",
                        fontWeight: 600,
                      }}
                    >
                      {s.cgpa}
                    </span>
                  </Td>

                  <Td>
                    <span
                      style={{
                        color:
                          s.activeBacklogs > 0
                            ? "var(--accent-red)"
                            : "var(--text-secondary)",
                      }}
                    >
                      {s.activeBacklogs}
                    </span>
                  </Td>

                  <Td>
                    {s.stats?.drivesApplied || 0}
                  </Td>

                  <Td>
                    <span
                      style={{
                        color: "var(--accent-green)",
                        fontWeight: 600,
                      }}
                    >
                      {s.stats?.drivesSelected || 0}
                    </span>
                  </Td>

                  <Td>
                    {s.stats?.drivesSelected > 0 ? (
                      <Badge
                        variant="success"
                        size="sm"
                      >
                        Placed
                      </Badge>
                    ) : (
                      <Badge
                        variant="default"
                        size="sm"
                      >
                        Open
                      </Badge>
                    )}
                  </Td>

                 <Td>
  <button
    type="button"
    onClick={() =>
      navigate(
        `/coordinator/students/${s._id}`
      )
    }
    style={{
      display: "inline-flex",
      alignItems: "center",
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
</Td>
                </Tr>
              ))}
            </Table>

            {/* Pagination */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "12px",
                padding: "16px",
                borderTop:
                  "1px solid var(--border)",
              }}
            >
              <button
                disabled={page <= 1}
                onClick={() =>
                  fetchStudents(page - 1)
                }
                style={{
                  padding: "6px 16px",
                  background:
                    "var(--bg-elevated)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "8px",
                  color:
                    page <= 1
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  cursor:
                    page <= 1
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "12px",
                }}
              >
                ← Prev
              </button>

              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                }}
              >
                Page {page} · {total} total
              </span>

              <button
                disabled={page * 20 >= total}
                onClick={() =>
                  fetchStudents(page + 1)
                }
                style={{
                  padding: "6px 16px",
                  background:
                    "var(--bg-elevated)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "8px",
                  color:
                    page * 20 >= total
                      ? "var(--text-muted)"
                      : "var(--text-primary)",
                  cursor:
                    page * 20 >= total
                      ? "not-allowed"
                      : "pointer",
                  fontSize: "12px",
                }}
              >
                Next →
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}