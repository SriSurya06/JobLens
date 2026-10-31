import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  Code2,
  FileText,
  Award,
  FolderKanban,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Building2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

import { coordinatorAPI } from "../../services/api";
import {
  Card,
  Badge,
  LoadingPage,
  EmptyState,
} from "../../components/ui";
import toast from "react-hot-toast";

export default function CoordinatorStudentProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudent = async () => {
      setLoading(true);

      try {
        const res = await coordinatorAPI.getStudentDetail(studentId);

        const data = res.data.data;

        setStudent(data.student);
        setApplications(data.applications || []);
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Failed to load student profile"
        );
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  if (loading) {
    return <LoadingPage text="Loading student profile..." />;
  }

  if (!student) {
    return (
      <EmptyState
        icon={<UserRound size={22} />}
        title="Student not found"
        description="The requested student profile could not be loaded."
      />
    );
  }

  const education = student.education || {};
  const codingProfiles = student.codingProfiles || {};
  const stats = student.stats || {};

  const getApplicationStatus = (application) => {
    const status = application?.overallStatus;

    if (status === "selected") {
      return (
        <Badge variant="success" size="sm">
          Selected
        </Badge>
      );
    }

    if (
      status === "rejected" ||
      status === "not_shortlisted"
    ) {
      return (
        <Badge variant="danger" size="sm">
          Rejected
        </Badge>
      );
    }

    if (status === "in_progress") {
      return (
        <Badge variant="primary" size="sm">
          In Progress
        </Badge>
      );
    }

    return (
      <Badge variant="default" size="sm">
        {status || "Applied"}
      </Badge>
    );
  };

  const formatDate = (value) => {
    if (!value) return "—";

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const InfoItem = ({ icon, label, value }) => (
    <div
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          flexShrink: 0,
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--accent-primary)",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontSize: "13px",
            color: "var(--text-primary)",
            fontWeight: 600,
            wordBreak: "break-word",
          }}
        >
          {value || "Not provided"}
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ icon, title, count }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "9px",
        }}
      >
        <div
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "9px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(230,126,34,0.10)",
            border: "1px solid rgba(230,126,34,0.20)",
            color: "var(--accent-primary)",
          }}
        >
          {icon}
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "17px",
            fontWeight: 800,
            fontFamily: "var(--font-display)",
          }}
        >
          {title}
        </h2>
      </div>

      {count !== undefined && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        paddingBottom: "35px",
      }}
    >
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          width: "fit-content",
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          border: "none",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: "12px",
          padding: 0,
        }}
      >
        <ArrowLeft size={15} />
        Back to Students
      </button>

      {/* Header */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "15px",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(230,126,34,0.12)",
                border: "1px solid rgba(230,126,34,0.22)",
                color: "var(--accent-primary)",
              }}
            >
              <UserRound size={30} />
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "25px",
                  fontWeight: 800,
                  fontFamily: "var(--font-display)",
                }}
              >
                {student.name}
              </h1>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginTop: "7px",
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: "var(--accent-primary)",
                  }}
                >
                  {student.rollNumber}
                </span>

                <Badge variant="primary" size="sm">
                  {student.branch}
                </Badge>

                <Badge variant="default" size="sm">
                  Batch {student.passedOutYear}
                </Badge>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "9px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {student.cgpa ?? "—"}
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                }}
              >
                CGPA
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderRadius: "9px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                }}
              >
                {student.activeBacklogs ?? 0}
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                }}
              >
                Backlogs
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <SectionHeader
          icon={<UserRound size={17} />}
          title="Personal Information"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(230px, 1fr))",
            gap: "18px",
          }}
        >
          <InfoItem
            icon={<Mail size={15} />}
            label="College Email"
            value={student.collegeEmail}
          />

          <InfoItem
            icon={<Mail size={15} />}
            label="Personal Email"
            value={student.personalEmail}
          />

          <InfoItem
            icon={<Phone size={15} />}
            label="Contact"
            value={student.contact}
          />

          <InfoItem
            icon={<MapPin size={15} />}
            label="Address"
            value={student.address}
          />

          <InfoItem
            icon={<Building2 size={15} />}
            label="Branch"
            value={student.branch}
          />

          <InfoItem
            icon={<CalendarDays size={15} />}
            label="Passed Out Year"
            value={student.passedOutYear}
          />
        </div>
      </Card>

      {/* Profile Summary */}
      {student.profileSummary && (
        <Card>
          <SectionHeader
            icon={<FileText size={17} />}
            title="Profile Summary"
          />

          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              fontSize: "13px",
              whiteSpace: "pre-wrap",
            }}
          >
            {student.profileSummary}
          </p>
        </Card>
      )}

      {/* Education */}
      <Card>
        <SectionHeader
          icon={<GraduationCap size={17} />}
          title="Education"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "14px",
          }}
        >
          {[
            {
              key: "btech",
              title: "B.Tech",
              data: education.btech,
            },
            {
              key: "intermediate",
              title: "Intermediate",
              data: education.intermediate,
            },
            {
              key: "secondary",
              title: "Secondary / 10th",
              data: education.secondary,
            },
          ].map((item) => (
            <div
              key={item.key}
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  marginBottom: "12px",
                }}
              >
                {item.title}
              </div>

              {item.data ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                      }}
                    >
                      INSTITUTION
                    </span>
                    <div
                      style={{
                        fontSize: "12px",
                        marginTop: "2px",
                      }}
                    >
                      {item.data.institutionName ||
                        "Not provided"}
                    </div>
                  </div>

                  {item.data.cgpa !== undefined &&
                    item.data.cgpa !== null && (
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                          }}
                        >
                          CGPA
                        </span>
                        <div style={{ fontSize: "12px" }}>
                          {item.data.cgpa}
                        </div>
                      </div>
                    )}

                  {item.data.percentage !== undefined &&
                    item.data.percentage !== null && (
                      <div>
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                          }}
                        >
                          PERCENTAGE
                        </span>
                        <div style={{ fontSize: "12px" }}>
                          {item.data.percentage}%
                        </div>
                      </div>
                    )}

                  {item.data.yearOfCompletion && (
                    <div>
                      <span
                        style={{
                          fontSize: "10px",
                          color: "var(--text-muted)",
                        }}
                      >
                        YEAR OF COMPLETION
                      </span>
                      <div style={{ fontSize: "12px" }}>
                        {item.data.yearOfCompletion}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                  }}
                >
                  Not provided
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Skills */}
      <Card>
        <SectionHeader
          icon={<Code2 size={17} />}
          title="Skills"
          count={`${student.skills?.length || 0} skills`}
        />

        {student.skills?.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {student.skills.map((skill, index) => (
              <Badge key={`${skill}-${index}`} variant="primary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No skills added.
          </span>
        )}
      </Card>

      {/* Projects */}
      <Card>
        <SectionHeader
          icon={<FolderKanban size={17} />}
          title="Projects"
          count={`${student.projects?.length || 0} projects`}
        />

        {student.projects?.length ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "14px",
            }}
          >
            {student.projects.map((project, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  borderRadius: "10px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      fontWeight: 800,
                    }}
                  >
                    {project.title || "Untitled Project"}
                  </h3>

                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "var(--accent-primary)",
                      }}
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>

                {project.description && (
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                      margin: "10px 0",
                    }}
                  >
                    {project.description}
                  </p>
                )}

                {project.techStack?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {project.techStack.map((tech, techIndex) => (
                      <Badge
                        key={`${tech}-${techIndex}`}
                        variant="default"
                        size="sm"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No projects added.
          </span>
        )}
      </Card>

      {/* Internships */}
      <Card>
        <SectionHeader
          icon={<BriefcaseBusiness size={17} />}
          title="Internships"
          count={`${student.internships?.length || 0} internships`}
        />

        {student.internships?.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {student.internships.map((internship, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  borderRadius: "10px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 800,
                      }}
                    >
                      {internship.role ||
                        "Internship"}
                    </h3>

                    <div
                      style={{
                        marginTop: "4px",
                        color: "var(--accent-primary)",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {internship.company ||
                        "Company not provided"}
                    </div>
                  </div>

                  {internship.duration && (
                    <Badge variant="default" size="sm">
                      {internship.duration}
                    </Badge>
                  )}
                </div>

                {internship.description && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "12px",
                      lineHeight: 1.6,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {internship.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No internships added.
          </span>
        )}
      </Card>

      {/* Certifications */}
      <Card>
        <SectionHeader
          icon={<Award size={17} />}
          title="Certifications"
          count={`${student.certifications?.length || 0} certifications`}
        />

        {student.certifications?.length ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {student.certifications.map(
              (certification, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    fontSize: "12px",
                  }}
                >
                  <Award
                    size={14}
                    color="var(--accent-primary)"
                  />
                  {certification}
                </div>
              )
            )}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No certifications added.
          </span>
        )}
      </Card>

      {/* Academic Achievements */}
      <Card>
        <SectionHeader
          icon={<Award size={17} />}
          title="Academic Achievements"
          count={`${
            student.academicAchievements?.length || 0
          } achievements`}
        />

        {student.academicAchievements?.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {student.academicAchievements.map(
              (achievement, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    gap: "9px",
                    alignItems: "flex-start",
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  <CheckCircle2
                    size={15}
                    color="var(--accent-primary)"
                    style={{ flexShrink: 0 }}
                  />
                  <span>{achievement}</span>
                </div>
              )
            )}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No academic achievements added.
          </span>
        )}
      </Card>

      {/* Coding Profiles */}
      <Card>
        <SectionHeader
          icon={<Code2 size={17} />}
          title="Coding Profiles"
        />

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {[
            ["GitHub", codingProfiles.github],
            ["LeetCode", codingProfiles.leetcode],
            ["HackerRank", codingProfiles.hackerrank],
          ].map(([name, url]) =>
            url ? (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--accent-primary)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {name}
                <ExternalLink size={13} />
              </a>
            ) : null
          )}

          {codingProfiles.others?.map((url, index) =>
            url ? (
              <a
                key={`other-${index}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  color: "var(--accent-primary)",
                  textDecoration: "none",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                Coding Profile {index + 1}
                <ExternalLink size={13} />
              </a>
            ) : null
          )}

          {!codingProfiles.github &&
            !codingProfiles.leetcode &&
            !codingProfiles.hackerrank &&
            !codingProfiles.others?.length && (
              <span
                style={{
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                No coding profiles added.
              </span>
            )}
        </div>
      </Card>

      {/* Resume */}
      <Card>
        <SectionHeader
          icon={<FileText size={17} />}
          title="Resume"
        />

        {student.resume?.url ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
              padding: "14px",
              borderRadius: "10px",
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <FileText
                size={20}
                color="var(--accent-primary)"
              />

              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Student Resume
                </div>

                <div
                  style={{
                    marginTop: "3px",
                    fontSize: "10px",
                    color: "var(--text-muted)",
                  }}
                >
                  Uploaded:{" "}
                  {formatDate(student.resume.uploadedAt)}
                </div>
              </div>
            </div>

            <a
              href={student.resume.url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 13px",
                borderRadius: "8px",
                background: "var(--accent-primary)",
                color: "var(--bg-primary)",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              View Resume
              <ExternalLink size={14} />
            </a>
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No resume uploaded.
          </span>
        )}
      </Card>

      {/* Placement Statistics */}
      <Card>
        <SectionHeader
          icon={<CheckCircle2 size={17} />}
          title="Placement Statistics"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "12px",
          }}
        >
          {[
            ["Drives Applied", stats.drivesApplied || 0],
            ["Drives Selected", stats.drivesSelected || 0],
            ["Drives Rejected", stats.drivesRejected || 0],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: "15px",
                borderRadius: "10px",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--accent-primary)",
                }}
              >
                {value}
              </div>

              <div
                style={{
                  marginTop: "3px",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Applications */}
      <Card>
        <SectionHeader
          icon={<BriefcaseBusiness size={17} />}
          title="Placement Applications"
          count={`${applications.length} applications`}
        />

        {applications.length ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {applications.map((application) => (
              <div
                key={application._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  padding: "13px",
                  borderRadius: "9px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                    }}
                  >
                    {application.drive?.companyName ||
                      "Drive"}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "5px",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>
                      Applied:{" "}
                      {formatDate(application.appliedAt)}
                    </span>

                    {application.drive?.status && (
                      <span>
                        Drive: {application.drive.status}
                      </span>
                    )}
                  </div>
                </div>

                {getApplicationStatus(application)}
              </div>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
            }}
          >
            No placement applications found.
          </span>
        )}
      </Card>
    </div>
  );
}