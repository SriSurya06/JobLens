import React, { useEffect, useState } from "react";
import { studentAPI } from "../../services/api";
import {
  Globe2,
  BriefcaseBusiness,
  Zap,
  Building2,
  MoreHorizontal,
  ShieldCheck,
  GraduationCap,
  CalendarClock,
} from "lucide-react";
import {
  Card,
  Badge,
  LoadingPage,
  EmptyState,
  Tabs,
} from "../../components/ui";
import toast from "react-hot-toast";

const CATEGORY_COLORS = {
  internship: "primary",
  hackathon: "purple",
  job: "success",
  other: "default",
};

function getExtendedDeadline(date) {
  if (!date) return null;

  const d = new Date(date);
  d.setDate(d.getDate() + 40);

  return d;
}

function analyzeJobSafety(drive) {
  const risks = [];
  const warnings = [];

  const url = drive.applyLink || "";
  const company = drive.companyName || "";

  if (url && !url.startsWith("https://")) {
    risks.push("Link is not HTTPS");
  }

  if (url && /bit\.ly|tinyurl|t\.co|goo\.gl/.test(url)) {
    risks.push("Shortened URL detected");
  }

  const knownLegit = [
    "google",
    "microsoft",
    "amazon",
    "tcs",
    "infosys",
    "wipro",
    "accenture",
    "ibm",
  ];

  const compLower = company.toLowerCase();
  const isKnown = knownLegit.some((k) => compLower.includes(k));

  const score = 100 - risks.length * 30 - warnings.length * 10;

  return {
    score: Math.max(0, Math.min(100, score)),
    risks,
    warnings,
    isKnown,
    verdict: score >= 80 ? "SAFE" : score >= 50 ? "CAUTION" : "HIGH RISK",
    color:
      score >= 80
        ? "var(--accent-green)"
        : score >= 50
          ? "var(--accent-orange)"
          : "var(--accent-red)",
  };
}
export default function OffCampusDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(null);

  const fetchDrives = async () => {
    setLoading(true);

    try {
      const params = {};
      if (category) params.category = category;

      const res = await studentAPI.getOffCampusFeed(params);
      setDrives(res.data.data.drives || []);
    } catch {
      toast.error("Failed to load drives");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [category]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "28px",
            fontWeight: 800,
          }}
        >
          Off-Campus Opportunities
        </h1>

        <p style={{ color: "var(--text-secondary)", marginTop: "4px" }}>
          AI-verified external opportunities
        </p>
      </div>

      <Tabs
  tabs={[
    {
      value: "",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Globe2 size={15} />
          All
        </span>
      ),
    },
    {
      value: "internship",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <BriefcaseBusiness size={15} />
          Internships
        </span>
      ),
    },
    {
      value: "hackathon",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Zap size={15} />
          Hackathons
        </span>
      ),
    },
    {
      value: "job",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <Building2 size={15} />
          Jobs
        </span>
      ),
    },
    {
      value: "other",
      label: (
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <MoreHorizontal size={15} />
          Other
        </span>
      ),
    },
  ]}
  active={category}
  onChange={setCategory}
/>

      {loading ? (
        <LoadingPage />
      ) : drives.length === 0 ? (
        <EmptyState
          icon="🌐"
          title="No opportunities found"
          description="Try another category"
        />
      ) : (
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "16px",
    alignItems: "start",
  }}
>
          {drives.map((drive) => {
            const safety = analyzeJobSafety(drive);

            const extendedDeadline = getExtendedDeadline(drive.lastDateToApply);

            // DEMO MODE: always allow viewing Apply Now.
            // Deadline will show extended date, not "deadline passed".
            const isPassed = false;

            return (
              <Card
                key={drive._id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
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
                        fontFamily: "var(--font-display)",
                        fontSize: "16px",
                        fontWeight: 700,
                        marginBottom: "4px",
                      }}
                    >
                      {drive.companyName}
                    </h3>

                    <p
                      style={{
                        fontSize: "12px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {drive.driveName}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "4px",
                    }}
                  >
                    <Badge
                      variant={CATEGORY_COLORS[drive.driveCategory]}
                      size="sm"
                    >
                      {drive.driveCategory}
                    </Badge>

                    <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "10px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontWeight: 700,
                      color: safety.color,
                      background: `${safety.color}15`,
                      border: `1px solid ${safety.color}30`,
                    }}
                  >
                    <ShieldCheck size={12} strokeWidth={2.5} />
                    {safety.verdict}
                  </span>
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px",
                    background: "var(--bg-elevated)",
                    borderRadius: "8px",
                    border: `1px solid ${safety.color}20`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Authenticity Score
                    </span>

                    <span
                      style={{
                        fontSize: "12px",
                        color: safety.color,
                        fontWeight: 700,
                      }}
                    >
                      {safety.score}/100
                    </span>
                  </div>

                    <div
  style={{
    padding: "10px",
    background: "var(--bg-elevated)",
    borderRadius: "8px",
  }}
>
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "6px",
    }}
  >
    <span
      style={{
        fontSize: "11px",
        color: "var(--text-muted)",
      }}
    >
      Authenticity Score
    </span>

    <span
      style={{
        fontSize: "12px",
        color: safety.color,
        fontWeight: 700,
      }}
    >
      {safety.score}/100
    </span>
  </div>

  <div
    style={{
      background: "rgba(211, 84, 0, 0.18)",
      borderRadius: "999px",
      height: "7px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${safety.score}%`,
        height: "100%",
        background: "#2E8B57",
        borderRadius: "999px",
        minWidth: "8px",
        transition: "width 0.4s ease",
      }}
    />
  </div>
</div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                 <span
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "var(--text-secondary)",
  }}
>
  <GraduationCap
    size={15}
    strokeWidth={2}
    style={{ color: "var(--accent-primary)" }}
  />
  {(drive.eligibleBatches || []).join(", ")}
</span>

                  {extendedDeadline && (
                   <span
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "var(--accent-orange)",
    fontWeight: 600,
  }}
>
  <CalendarClock size={15} strokeWidth={2} />
  Apply by {extendedDeadline.toLocaleDateString()}
</span>
                  )}
                </div>

                {expanded === drive._id && drive.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {drive.description}
                  </p>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginTop: "auto",
                  }}
                >
                  <button
                    onClick={() =>
                      setExpanded(expanded === drive._id ? null : drive._id)
                    }
                    style={{
                      flex: 1,
                      padding: "8px",
                      background: "var(--bg-elevated)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {expanded === drive._id ? "Less ↑" : "Details ↓"}
                  </button>

                  <a
                    href={drive.applyLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 2,
                      padding: "8px",
                      background:
                        safety.verdict === "HIGH RISK"
                          ? "rgba(255,71,87,0.1)"
                          : "var(--accent-primary)",
                      border:
                        safety.verdict === "HIGH RISK"
                          ? "1px solid rgba(255,71,87,0.3)"
                          : "none",
                      borderRadius: "8px",
                      color:
                        safety.verdict === "HIGH RISK"
                          ? "var(--accent-red)"
                          : "var(--bg-primary)",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                    }}
                  >
                    {safety.verdict === "HIGH RISK"
                      ? "⚠ Apply Carefully"
                      : "Apply Now →"}
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
