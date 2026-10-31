import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Globe2,
  UsersRound,
  CheckCircle2,
  UserRoundX,
  TrendingUp,
  CalendarDays,
  MapPin,
  Trophy,
  ChevronRight,
  BriefcaseBusiness,
  Layers3,
  Target,
} from "lucide-react";

import { coordinatorAPI } from "../../services/api";
import {
  Card,
  Badge,
  LoadingPage,
  EmptyState,
} from "../../components/ui";
import toast from "react-hot-toast";

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

export default function PlacementTracker() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const selectedBatch = params.get("batch") || "2026";

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("oncampus");

  useEffect(() => {
    const loadPlacementData = async () => {
      setLoading(true);

      try {
        const res =
          await coordinatorAPI.getPlacementStats(
            selectedBatch
          );

        setStats(res.data.data);
      } catch (error) {
        toast.error(
          "Failed to load placement statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    loadPlacementData();
  }, [selectedBatch]);

  if (loading) {
    return (
      <LoadingPage text="Loading placement tracker..." />
    );
  }

  if (!stats) {
    return (
      <EmptyState
        title="Placement data unavailable"
        description={`No placement data could be loaded for batch ${selectedBatch}.`}
      />
    );
  }

  const branchData = stats.branchBreakdown || [];
  const onCampusDrives = stats.onCampusDrives || [];
  const offCampusDrives = stats.offCampusDrives || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        paddingBottom: "35px",
      }}
    >
      {/* =====================================================
          HEADER
      ====================================================== */}
      <section>
        <button
          type="button"
          onClick={() =>
            navigate("/coordinator/dashboard")
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "transparent",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "12px",
            padding: 0,
            marginBottom: "12px",
          }}
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "rgba(230,126,34,0.12)",
                border:
                  "1px solid rgba(230,126,34,0.22)",
                color: "var(--accent-primary)",
              }}
            >
              <Target size={23} />
            </div>

            <div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "29px",
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Placement Tracker
              </h1>

              <p
                style={{
                  color: "var(--text-secondary)",
                  margin: "4px 0 0",
                  fontSize: "13px",
                }}
              >
                Batch {selectedBatch} · Placement
                performance and drive tracking
              </p>
            </div>
          </div>

          {/* Batch selector */}
          <div
            style={{
              display: "flex",
              gap: "5px",
              padding: "4px",
              borderRadius: "10px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            {[2026, 2027, 2028, 2029].map(
              (batch) => {
                const active =
                  String(batch) ===
                  String(selectedBatch);

                return (
                  <button
                    key={batch}
                    type="button"
                    onClick={() =>
                      navigate(
                        `/coordinator/placements?batch=${batch}`
                      )
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "7px",
                      border: "none",
                      background: active
                        ? "var(--accent-primary)"
                        : "transparent",
                      color: active
                        ? "var(--bg-primary)"
                        : "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 700,
                    }}
                  >
                    {batch}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}
      >
        <Card style={{ padding: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
                background:
                  "rgba(230,126,34,0.12)",
                color: "var(--accent-primary)",
              }}
            >
              <UsersRound size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {stats.totalStudents || 0}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Total Students
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
                background:
                  "rgba(76,175,80,0.12)",
                color: "var(--accent-success)",
              }}
            >
              <CheckCircle2 size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {stats.totalSelected || 0}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Students Placed
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
                background:
                  "rgba(211,84,0,0.10)",
                color: "#D35400",
              }}
            >
              <UserRoundX size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {Math.max(
                  0,
                  (stats.totalStudents || 0) -
                    (stats.totalSelected || 0)
                )}
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Yet to be Placed
              </div>
            </div>
          </div>
        </Card>

        <Card style={{ padding: "18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
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
                background:
                  "rgba(243,156,18,0.12)",
                color: "#F39C12",
              }}
            >
              <TrendingUp size={20} />
            </div>

            <div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {stats.overallPlacementPercent || 0}%
              </div>

              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                Placement Rate
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* =====================================================
          BRANCH PERFORMANCE
      ====================================================== */}
      <Card style={{ padding: "22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "19px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Branch Placement Performance
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: "4px 0 0",
              }}
            >
              Placement distribution across branches
              for batch {selectedBatch}.
            </p>
          </div>

          <Badge variant="primary">
            {branchData.length} Branches
          </Badge>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          {branchData.map((branch) => {
            const branchColor = getBranchColor(
              branch.branch
            );

            return (
              <div
                key={branch.branch}
                style={{
                  padding: "15px",
                  borderRadius: "11px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: "13px",
                    }}
                  >
                    {branch.branch}
                  </span>

                  <span
                    style={{
                      color: branchColor,
                      fontSize: "12px",
                      fontWeight: 800,
                    }}
                  >
                    {branch.percentage}%
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "9px",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                  }}
                >
                  <span>
                    {branch.selected} placed
                  </span>

                  <span>
                    {branch.total} students
                  </span>
                </div>

                <div
                  style={{
                    height: "5px",
                    marginTop: "10px",
                    background:
                      "var(--bg-primary)",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(
                        branch.percentage,
                        100
                      )}%`,
                      height: "100%",
                      background: branchColor,
                      borderRadius: "999px",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* =====================================================
          DRIVE TRACKING
      ====================================================== */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "15px",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 800,
                margin: 0,
              }}
            >
              Drive Tracking
            </h2>

            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                margin: "4px 0 0",
              }}
            >
              Track drives associated with batch{" "}
              {selectedBatch}.
            </p>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "5px",
              padding: "4px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
            }}
          >
            <button
              type="button"
              onClick={() =>
                setActiveTab("oncampus")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 13px",
                border: "none",
                borderRadius: "7px",
                background:
                  activeTab === "oncampus"
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  activeTab === "oncampus"
                    ? "var(--bg-primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              <Building2 size={14} />
              On-Campus
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveTab("offcampus")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 13px",
                border: "none",
                borderRadius: "7px",
                background:
                  activeTab === "offcampus"
                    ? "var(--accent-primary)"
                    : "transparent",
                color:
                  activeTab === "offcampus"
                    ? "var(--bg-primary)"
                    : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: 700,
              }}
            >
              <Globe2 size={14} />
              Off-Campus
            </button>
          </div>
        </div>

        {activeTab === "oncampus" ? (
          <OnCampusDriveList
            drives={onCampusDrives}
            batch={selectedBatch}
            navigate={navigate}
          />
        ) : (
          <OffCampusDriveList
            drives={offCampusDrives}
          />
        )}
      </section>
    </div>
  );
}

/* ============================================================
   ON-CAMPUS DRIVE LIST
============================================================ */

function OnCampusDriveList({
  drives,
  batch,
  navigate,
}) {
  if (!drives.length) {
    return (
      <EmptyState
        icon="🏢"
        title="No on-campus drives"
        description={`No on-campus drives found for batch ${batch}.`}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {drives.map((drive) => {
        const isFrozen = drive.isFrozen;

        return (
          <Card
            key={drive._id}
            style={{
              padding: "18px",
              borderLeft: isFrozen
                ? "3px solid var(--accent-success)"
                : "3px solid var(--accent-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  minWidth: "220px",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    flexWrap: "wrap",
                  }}
                >
                  <BriefcaseBusiness
                    size={18}
                    color="var(--accent-primary)"
                  />

                  <h3
                    style={{
                      margin: 0,
                      fontFamily:
                        "var(--font-display)",
                      fontSize: "16px",
                      fontWeight: 800,
                    }}
                  >
                    {drive.companyName}
                  </h3>

                  <Badge
                    variant={
                      isFrozen
                        ? "success"
                        : "primary"
                    }
                    size="sm"
                  >
                    {isFrozen
                      ? "Completed"
                      : "Active"}
                  </Badge>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "14px",
                    marginTop: "10px",
                    color: "var(--text-muted)",
                    fontSize: "11px",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <Layers3 size={13} />
                    {drive.rounds?.length || 0} rounds
                  </span>

                  {drive.minPackage &&
                    drive.maxPackage && (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Trophy size={13} />
                        {drive.minPackage}–
                        {drive.maxPackage} LPA
                      </span>
                    )}

                  {drive.cgpaCutOff && (
                    <span>
                      CGPA ≥ {drive.cgpaCutOff}
                    </span>
                  )}

                  {drive.registrationDeadline && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <CalendarDays size={13} />
                      Deadline:{" "}
                      {new Date(
                        drive.registrationDeadline
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/coordinator/drives/${drive._id}`
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 14px",
                  background:
                    "var(--bg-elevated)",
                  border:
                    "1px solid var(--border)",
                  borderRadius: "8px",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                View Drive
                <ChevronRight size={14} />
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ============================================================
   OFF-CAMPUS DRIVE LIST
============================================================ */

function OffCampusDriveList({ drives }) {
  if (!drives.length) {
    return (
      <EmptyState
        icon="🌐"
        title="No off-campus drives"
        description="No off-campus drives found for this batch."
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {drives.map((drive) => (
        <Card
          key={drive._id}
          style={{
            padding: "18px",
            borderLeft:
              "3px solid #D35400",
          }}
        >
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
                  gap: "9px",
                }}
              >
                <Globe2
                  size={18}
                  color="#D35400"
                />

                <h3
                  style={{
                    margin: 0,
                    fontFamily:
                      "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 800,
                  }}
                >
                  {drive.companyName}
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginTop: "9px",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                }}
              >
                {drive.driveName && (
                  <span>{drive.driveName}</span>
                )}

                {drive.category && (
                  <span>
                    Category: {drive.category}
                  </span>
                )}

                {drive.appliedCount !==
                  undefined && (
                  <span>
                    Applied: {drive.appliedCount}
                  </span>
                )}

                {drive.selectedCount !==
                  undefined && (
                  <span>
                    Selected:{" "}
                    {drive.selectedCount}
                  </span>
                )}
              </div>
            </div>

            <Badge
              variant="primary"
              size="sm"
            >
              Off-Campus
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}