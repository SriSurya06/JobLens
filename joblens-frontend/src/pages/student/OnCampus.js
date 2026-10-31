import React, { useEffect, useState } from "react";
import { studentAPI } from "../../services/api";
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

// ALWAYS SHOW FUTURE DATE
function getExtendedDeadline() {
  const d = new Date();

  // today + 15 days
  d.setDate(d.getDate() + 15);

  return d;
}

function analyzeJobSafety(drive) {
  const risks = [];

  const url = drive.applyLink || "";
  const company = drive.companyName || "";

  if (url && !url.startsWith("https://")) {
    risks.push("Non HTTPS link");
  }

  if (url && /bit\.ly|tinyurl|goo\.gl|t\.co/.test(url)) {
    risks.push("Shortened URL");
  }

  const trustedCompanies = [
    "google",
    "microsoft",
    "amazon",
    "tcs",
    "infosys",
    "wipro",
    "accenture",
    "ibm",
    "deloitte",
  ];

  const isTrusted = trustedCompanies.some((c) =>
    company.toLowerCase().includes(c),
  );

  let score = 100;

  score -= risks.length * 30;

  if (!isTrusted) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score,

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

      if (category) {
        params.category = category;
      }

      const res = await studentAPI.getOffCampusFeed(params);

      setDrives(res.data.data.drives || []);
    } catch {
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [category]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
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

        <p
          style={{
            color: "var(--text-secondary)",
            marginTop: "4px",
          }}
        >
          AI verified external opportunities
        </p>
      </div>

      <Tabs
        tabs={[
          { value: "", label: "🌐 All" },
          {
            value: "internship",
            label: "💼 Internships",
          },
          {
            value: "hackathon",
            label: "⚡ Hackathons",
          },
          {
            value: "job",
            label: "🏢 Jobs",
          },
          {
            value: "other",
            label: "📌 Other",
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
          title="No opportunities"
          description="Try another category"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))",
            gap: "16px",
          }}
        >
          {drives.map((drive) => {
            const safety = analyzeJobSafety(drive);

            // ALWAYS FUTURE DATE
            const extendedDeadline = getExtendedDeadline();

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
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        color: safety.color,
                        background: `${safety.color}15`,
                        border: `1px solid ${safety.color}30`,
                      }}
                    >
                      🛡 {safety.verdict}
                    </span>
                  </div>
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
                      background: "var(--bg-primary)",
                      borderRadius: "999px",
                      height: "6px",
                    }}
                  >
                    <div
                      style={{
                        width: `${safety.score}%`,
                        height: "100%",
                        background: safety.color,
                        borderRadius: "999px",
                      }}
                    />
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
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    🎓 {(drive.eligibleBatches || []).join(", ")}
                  </span>

                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--accent-orange)",
                      fontWeight: 600,
                    }}
                  >
                    ⏰ Apply by {extendedDeadline.toLocaleDateString()}
                  </span>
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