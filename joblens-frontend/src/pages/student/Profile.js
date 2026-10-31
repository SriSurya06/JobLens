import React, { useState } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Tabs, Badge,Spinner } from '../../components/ui';
import {
  UserRound,
  GraduationCap,
  BriefcaseBusiness,
  Code2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  ExternalLink,
  Github,
  Trophy,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentProfile() {
  const { profile, refreshProfile } = useAuth();

  const [tab, setTab] = useState('personal');
  const [editingSection, setEditingSection] = useState(null);
  const [saving, setSaving] = useState(false);

 const [form, setForm] = useState(null);

// Used separately for adding a new internship or project
const [itemForm, setItemForm] = useState(null);

const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const startEdit = (section = 'personal') => {
    setForm({
      personalEmail: profile?.personalEmail || '',
      contact: profile?.contact || '',
      address: profile?.address || '',
      profileSummary: profile?.profileSummary || '',

      skills: (profile?.skills || []).join(', '),

      certifications: (profile?.certifications || []).join('\n'),

     
      codingProfiles: {
        github: profile?.codingProfiles?.github || '',
        leetcode: profile?.codingProfiles?.leetcode || '',
        hackerrank: profile?.codingProfiles?.hackerrank || '',
      },

      education: {
        btech: {
          institutionName:
            profile?.education?.btech?.institutionName || '',
          cgpa: profile?.education?.btech?.cgpa || '',
          percentage:
            profile?.education?.btech?.percentage || '',
          yearOfCompletion:
            profile?.education?.btech?.yearOfCompletion || '',
        },

        intermediate: {
          institutionName:
            profile?.education?.intermediate?.institutionName || '',
          percentage:
            profile?.education?.intermediate?.percentage || '',
          yearOfCompletion:
            profile?.education?.intermediate?.yearOfCompletion || '',
        },

        secondary: {
          institutionName:
            profile?.education?.secondary?.institutionName || '',
          percentage:
            profile?.education?.secondary?.percentage || '',
          yearOfCompletion:
            profile?.education?.secondary?.yearOfCompletion || '',
        },
      },
    });

    setEditingSection(section);
  };

  const cancelEdit = () => {
  setEditingSection(null);
  setForm(null);
  setItemForm(null);
};

  const startAddInternship = () => {
  setItemForm({
    company: '',
    role: '',
    duration: '',
    description: '',
  });

  setEditingSection('internship');
};

const handleSaveInternship = async () => {
  if (!itemForm?.company?.trim()) {
    toast.error('Company name is required');
    return;
  }

  if (!itemForm?.role?.trim()) {
    toast.error('Role is required');
    return;
  }

  setSaving(true);

  try {
    const internship = {
      company: itemForm.company.trim(),
      role: itemForm.role.trim(),
      duration: itemForm.duration.trim(),
      description: itemForm.description.trim(),
    };

    await studentAPI.updateProfile({
      internships: [
        ...(profile?.internships || []),
        internship,
      ],
    });

    await refreshProfile();

    setItemForm(null);
    setEditingSection(null);

    toast.success('Internship added successfully!');
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
      'Failed to add internship'
    );
  } finally {
    setSaving(false);
  }
};

const startAddProject = () => {
  setItemForm({
    title: '',
    description: '',
    techStack: '',
    link: '',
  });

  setEditingSection('project');
};

const handleSaveProject = async () => {
  if (!itemForm?.title?.trim()) {
    toast.error('Project title is required');
    return;
  }

  if (!itemForm?.link?.trim()) {
    toast.error('Project link is required');
    return;
  }

  setSaving(true);

  try {
    const project = {
      title: itemForm.title.trim(),
      description: itemForm.description.trim(),

      techStack: itemForm.techStack
        .split(',')
        .map((tech) => tech.trim())
        .filter(Boolean),

      link: itemForm.link.trim(),
    };

    await studentAPI.updateProfile({
      projects: [
        ...(profile?.projects || []),
        project,
      ],
    });

    await refreshProfile();

    setItemForm(null);
    setEditingSection(null);

    toast.success('Project added successfully!');
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
      'Failed to add project'
    );
  } finally {
    setSaving(false);
  }

};

  const handleSave = async () => {
    if (!form) return;

    setSaving(true);

    try {
      const payload = {
        ...form,

        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),

        certifications: form.certifications
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),

    
      };

      await studentAPI.updateProfile(payload);

      await refreshProfile();

      setEditingSection(null);
      setForm(null);

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) {
      toast.error('Select a PDF file first');
      return;
    }

    setUploading(true);

    try {
      const fd = new FormData();

      fd.append('resume', resumeFile);

      await studentAPI.uploadResume(fd);

      await refreshProfile();

      setResumeFile(null);

      toast.success('Resume uploaded successfully!');
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Resume upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  if (!profile) {
    return (
      <div style={{ color: 'var(--text-secondary)' }}>
        Loading profile...
      </div>
    );
  }

  const inputStyle = {
    width: '100%',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '9px 12px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    color: 'var(--text-muted)',
    marginBottom: '5px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const fieldVal = (label, value) => (
    <div>
      <p style={labelStyle}>{label}</p>

      <p
        style={{
          fontSize: '14px',
          color: value
            ? 'var(--text-primary)'
            : 'var(--text-muted)',
          margin: 0,
        }}
      >
        {value || '—'}
      </p>
    </div>
  );

  const actionButtonStyle = {
    padding: '7px 14px',
    background: 'rgba(230,126,34,0.10)',
    border: '1px solid rgba(230,126,34,0.25)',
    borderRadius: '8px',
    color: 'var(--accent-primary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const saveButtonStyle = {
    padding: '8px 16px',
    background: 'var(--accent-primary)',
    border: 'none',
    borderRadius: '8px',
    color: 'var(--bg-primary)',
    cursor: saving ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontWeight: 700,
    opacity: saving ? 0.7 : 1,
  };

  const cancelButtonStyle = {
    padding: '8px 16px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  };

  const SaveCancel = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
        marginTop: '18px',
      }}
    >
      <button
        type="button"
        onClick={cancelEdit}
        style={cancelButtonStyle}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={saveButtonStyle}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* =====================================================
          PROFILE HEADER
      ====================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, #E67E22 0%, #D35400 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 800,
              color: 'var(--bg-primary)',
              fontFamily: 'var(--font-display)',
            }}
          >
            {profile.name?.charAt(0)}
          </div>

          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '26px',
                fontWeight: 800,
                margin: 0,
              }}
            >
              {profile.name}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: '999px',
                  background: 'rgba(230,126,34,0.10)',
                  border:
                    '1px solid rgba(230,126,34,0.25)',
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                {profile.branch}
              </span>

              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: '999px',
                  background: 'rgba(230,126,34,0.10)',
                  border:
                    '1px solid rgba(230,126,34,0.25)',
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Batch {profile.passedOutYear}
              </span>

              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: '999px',
                  background: 'rgba(230,126,34,0.10)',
                  border:
                    '1px solid rgba(230,126,34,0.25)',
                  color: 'var(--accent-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                CGPA {profile.cgpa}
              </span>

              {profile.activeBacklogs > 0 && (
                <span
                  style={{
                    padding: '5px 10px',
                    borderRadius: '999px',
                    background: 'rgba(217,74,74,0.08)',
                    border:
                      '1px solid rgba(217,74,74,0.25)',
                    color: '#C24141',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {profile.activeBacklogs} Backlog(s)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RESUME
      ====================================================== */}

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                marginBottom: '4px',
                color: 'var(--text-primary)',
              }}
            >
              Resume
            </h3>

            {profile.resume?.url ? (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--accent-green)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}
              >
                <CheckCircle2 size={15} strokeWidth={2.2} />
                Uploaded on{' '}
                {new Date(
                  profile.resume.uploadedAt
                ).toLocaleDateString()}
              </p>
            ) : (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--accent-red)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}
              >
                <AlertTriangle
                  size={15}
                  strokeWidth={2.2}
                />
                No resume uploaded — required to apply
                for drives
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {profile.resume?.url && (
              <a
                href={profile.resume.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                View Resume
              </a>
            )}

            <div
              style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <input
                type="file"
                accept=".pdf"
                id="resume-upload"
                style={{ display: 'none' }}
                onChange={(e) =>
                  setResumeFile(e.target.files?.[0] || null)
                }
              />

              <label
                htmlFor="resume-upload"
                style={{
                  padding: '8px 16px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {resumeFile
                  ? `${resumeFile.name.substring(
                      0,
                      20
                    )}...`
                  : 'Choose PDF'}
              </label>

              <button
                onClick={handleResumeUpload}
                disabled={!resumeFile || uploading}
                style={{
                  padding: '8px 16px',
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'var(--bg-primary)',
                  cursor:
                    resumeFile && !uploading
                      ? 'pointer'
                      : 'not-allowed',
                  opacity:
                    !resumeFile || uploading ? 0.6 : 1,
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {uploading && (
                  <Spinner
                    size={12}
                    color="var(--bg-primary)"
                  />
                )}
                Upload
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* =====================================================
          TABS
      ====================================================== */}

      <Tabs
        tabs={[
          {
            value: 'personal',
            label: 'Personal',
          },
          {
            value: 'education',
            label: 'Education',
          },
          {
            value: 'professional',
            label: 'Professional',
          },
          {
            value: 'coding',
            label: 'Coding Profiles',
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* =====================================================
          PERSONAL TAB
      ====================================================== */}

      {tab === 'personal' && (
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <UserRound
                size={18}
                strokeWidth={2.1}
                color="var(--accent-primary)"
              />
              Personal Information
            </h3>

            {editingSection !== 'personal' && (
              <button
                type="button"
                onClick={() => startEdit('personal')}
                style={actionButtonStyle}
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {fieldVal(
              'Roll Number',
              profile.rollNumber
            )}

            {fieldVal(
              'College Email',
              profile.collegeEmail
            )}

            {fieldVal('Branch', profile.branch)}

            {fieldVal(
              'Batch',
              profile.passedOutYear
            )}

            {editingSection === 'personal' ? (
              <>
                <div>
                  <label style={labelStyle}>
                    Personal Email
                  </label>

                  <input
                    style={inputStyle}
                    value={form.personalEmail}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        personalEmail: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Contact
                  </label>

                  <input
                    style={inputStyle}
                    value={form.contact}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contact: e.target.value,
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >
                  <label style={labelStyle}>
                    Address
                  </label>

                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: '70px',
                    }}
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                  />
                </div>

                <div
                  style={{
                    gridColumn: '1 / -1',
                  }}
                >
                  <label style={labelStyle}>
                    Profile Summary
                  </label>

                  <textarea
                    style={{
                      ...inputStyle,
                      minHeight: '100px',
                    }}
                    value={form.profileSummary}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        profileSummary: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                {fieldVal(
                  'Personal Email',
                  profile.personalEmail
                )}

                {fieldVal(
                  'Contact',
                  profile.contact
                )}

                {profile.address &&
                  fieldVal(
                    'Address',
                    profile.address
                  )}

                {profile.profileSummary &&
                  fieldVal(
                    'Profile Summary',
                    profile.profileSummary
                  )}
              </>
            )}
          </div>

          {editingSection === 'personal' && (
            <SaveCancel />
          )}
        </Card>
      )}

      {/* =====================================================
          EDUCATION TAB
      ====================================================== */}

      {tab === 'education' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <GraduationCap
                size={18}
                strokeWidth={2.1}
                color="var(--accent-primary)"
              />
              Education
            </h3>

            {editingSection !== 'education' && (
              <button
                type="button"
                onClick={() =>
                  startEdit('education')
                }
                style={actionButtonStyle}
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            )}
          </div>

          {[
            {
              key: 'btech',
              label: 'B.Tech',
              showCgpa: true,
            },
            {
              key: 'intermediate',
              label: 'Intermediate / Diploma',
              showCgpa: false,
            },
            {
              key: 'secondary',
              label: 'Secondary Education (10th)',
              showCgpa: false,
            },
          ].map(
            ({ key, label, showCgpa }) => (
              <Card key={key}>
                <h4
                  style={{
                    fontFamily:
                      'var(--font-display)',
                    fontSize: '15px',
                    marginBottom: '16px',
                  }}
                >
                  {label}
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {editingSection ===
                  'education' ? (
                    <>
                      <div>
                        <label style={labelStyle}>
                          Institution Name
                        </label>

                        <input
                          style={inputStyle}
                          value={
                            form.education[key]
                              .institutionName
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              education: {
                                ...form.education,
                                [key]: {
                                  ...form.education[
                                    key
                                  ],
                                  institutionName:
                                    e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>
                          Percentage (%)
                        </label>

                        <input
                          type="number"
                          style={inputStyle}
                          value={
                            form.education[key]
                              .percentage
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              education: {
                                ...form.education,
                                [key]: {
                                  ...form.education[
                                    key
                                  ],
                                  percentage:
                                    e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>

                      {showCgpa && (
                        <div>
                          <label
                            style={labelStyle}
                          >
                            CGPA
                          </label>

                          <input
                            type="number"
                            step="0.01"
                            style={inputStyle}
                            value={
                              form.education[key]
                                .cgpa
                            }
                            onChange={(e) =>
                              setForm({
                                ...form,
                                education: {
                                  ...form.education,
                                  [key]: {
                                    ...form
                                      .education[
                                      key
                                    ],
                                    cgpa:
                                      e.target
                                        .value,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      )}

                      <div>
                        <label style={labelStyle}>
                          Year of Completion
                        </label>

                        <input
                          type="number"
                          style={inputStyle}
                          value={
                            form.education[key]
                              .yearOfCompletion
                          }
                          onChange={(e) =>
                            setForm({
                              ...form,
                              education: {
                                ...form.education,
                                [key]: {
                                  ...form.education[
                                    key
                                  ],
                                  yearOfCompletion:
                                    e.target.value,
                                },
                              },
                            })
                          }
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {fieldVal(
                        'Institution',
                        profile.education?.[key]
                          ?.institutionName
                      )}

                      {fieldVal(
                        'Percentage',
                        profile.education?.[key]
                          ?.percentage
                          ? `${profile.education[key].percentage}%`
                          : null
                      )}

                      {showCgpa &&
                        fieldVal(
                          'CGPA',
                          profile.education?.[key]
                            ?.cgpa
                        )}

                      {fieldVal(
                        'Year',
                        profile.education?.[key]
                          ?.yearOfCompletion
                      )}
                    </>
                  )}
                </div>
              </Card>
            )
          )}

          {editingSection === 'education' && (
            <SaveCancel />
          )}
        </div>
      )}

      {/* =====================================================
          PROFESSIONAL TAB
      ====================================================== */}

      {tab === 'professional' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Professional Header */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BriefcaseBusiness
                size={18}
                strokeWidth={2.1}
                color="var(--accent-primary)"
              />

              Professional
            </h3>

            {editingSection !== 'professional' && (
              <button
                type="button"
                onClick={() =>
                  startEdit('professional')
                }
                style={actionButtonStyle}
              >
                <Pencil size={13} />
                Edit Profile
              </button>
            )}
          </div>

          {/* =================================================
              SKILLS
          ================================================== */}

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h4
                style={{
                  fontFamily:
                    'var(--font-display)',
                  fontSize: '15px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <Code2
                  size={16}
                  strokeWidth={2.1}
                  color="var(--accent-primary)"
                />

                Skills
              </h4>

              {editingSection !== 'skills' &&
                editingSection !==
                  'professional' && (
                  <button
                    type="button"
                    onClick={() =>
                      startEdit('skills')
                    }
                    style={actionButtonStyle}
                  >
                    <Plus size={13} />
                    Add Skill
                  </button>
                )}
            </div>

            {editingSection === 'skills' ||
            editingSection === 'professional' ? (
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: '80px',
                }}
                placeholder="Separate skills with commas"
                value={form.skills}
                onChange={(e) =>
                  setForm({
                    ...form,
                    skills: e.target.value,
                  })
                }
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {(profile.skills || []).map(
  (skill) => (
    <span
      key={skill}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 11px',
        borderRadius: '999px',
        background: 'rgba(230,126,34,0.10)',
        border: '1px solid rgba(230,126,34,0.25)',
        color: 'var(--accent-primary)',
        fontSize: '12px',
        fontWeight: 700,
      }}
    >
      {skill}
    </span>
  )
)}

                {!profile.skills?.length && (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    No skills added
                  </span>
                )}
              </div>
            )}

            {editingSection === 'skills' && (
              <SaveCancel />
            )}
          </Card>

          {/* =================================================
              CERTIFICATIONS
          ================================================== */}

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h4
                style={{
                  fontFamily:
                    'var(--font-display)',
                  fontSize: '15px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <FileText
                  size={16}
                  strokeWidth={2.1}
                  color="var(--accent-primary)"
                />

                Certifications
              </h4>

              {editingSection !==
                'certifications' &&
                editingSection !==
                  'professional' && (
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(
                        'certifications'
                      )
                    }
                    style={actionButtonStyle}
                  >
                    <Plus size={13} />
                    Add Certification
                  </button>
                )}
            </div>

            {editingSection ===
              'certifications' ||
            editingSection ===
              'professional' ? (
              <textarea
                style={{
                  ...inputStyle,
                  minHeight: '90px',
                }}
                placeholder="One certification per line"
                value={form.certifications}
                onChange={(e) =>
                  setForm({
                    ...form,
                    certifications:
                      e.target.value,
                  })
                }
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {(profile.certifications || []).map(
                  (certification, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: '13px',
                        color:
                          'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle2
                        size={15}
                        strokeWidth={2.1}
                        color="var(--accent-green)"
                        style={{
                          flexShrink: 0,
                          marginTop: '1px',
                        }}
                      />

                      <span>
                        {certification}
                      </span>
                    </div>
                  )
                )}

                {!profile.certifications
                  ?.length && (
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    No certifications added
                  </span>
                )}
              </div>
            )}

            {editingSection ===
              'certifications' && (
              <SaveCancel />
            )}
          </Card>

          {/* =================================================
              INTERNSHIPS
          ================================================== */}

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h4
                style={{
                  fontFamily:
                    'var(--font-display)',
                  fontSize: '15px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <BriefcaseBusiness
                  size={16}
                  strokeWidth={2.1}
                  color="var(--accent-primary)"
                />

                Internships
                              </h4>
                <button
                  type="button"
                  onClick={startAddInternship}
                  style={actionButtonStyle}
                >
                  <Plus size={13} />
                  Add Internship
                </button>
            </div>

         {editingSection === 'internship' ? (
  <div style={{ display: 'grid', gap: '12px' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}
    >
      <div>
        <label style={labelStyle}>Company *</label>

        <input
          style={inputStyle}
          value={itemForm?.company || ''}
          placeholder="Company name"
          onChange={(e) =>
            setItemForm({
              ...itemForm,
              company: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label style={labelStyle}>Role *</label>

        <input
          style={inputStyle}
          value={itemForm?.role || ''}
          placeholder="Software Intern"
          onChange={(e) =>
            setItemForm({
              ...itemForm,
              role: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label style={labelStyle}>Duration</label>

        <input
          style={inputStyle}
          value={itemForm?.duration || ''}
          placeholder="2 months"
          onChange={(e) =>
            setItemForm({
              ...itemForm,
              duration: e.target.value,
            })
          }
        />
      </div>
    </div>

    <div>
      <label style={labelStyle}>Description</label>

      <textarea
        style={{
          ...inputStyle,
          minHeight: '90px',
        }}
        value={itemForm?.description || ''}
        placeholder="Describe your internship..."
        onChange={(e) =>
          setItemForm({
            ...itemForm,
            description: e.target.value,
          })
        }
      />
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      }}
    >
      <button
        type="button"
        onClick={cancelEdit}
        style={cancelButtonStyle}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSaveInternship}
        disabled={saving}
        style={saveButtonStyle}
      >
        {saving ? 'Saving...' : 'Save Internship'}
      </button>
    </div>
  </div>
) : (profile.internships || []).length > 0 ? (
  (profile.internships || []).map(
    (internship, index) => (
      <div
        key={index}
        style={{
          padding: '14px',
          background: 'var(--bg-elevated)',
          borderRadius: '10px',
          marginBottom: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <p
          style={{
            fontWeight: 700,
            fontSize: '14px',
            margin: 0,
          }}
        >
          {internship.role} @ {internship.company}
        </p>

        {internship.duration && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
              marginBottom: 0,
            }}
          >
            {internship.duration}
          </p>
        )}

        {internship.description && (
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              marginTop: '7px',
              marginBottom: 0,
            }}
          >
            {internship.description}
          </p>
        )}
      </div>
    )
  )
) : (
  <span
    style={{
      color: 'var(--text-muted)',
      fontSize: '13px',
    }}
  >
    No internships added
  </span>
)}
          </Card>

          {/* =================================================
              PROJECTS
          ================================================== */}

          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h4
                style={{
                  fontFamily:
                    'var(--font-display)',
                  fontSize: '15px',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                }}
              >
                <Code2
                  size={16}
                  strokeWidth={2.1}
                  color="var(--accent-primary)"
                />

                Projects
              </h4>

       <button
  type="button"
  onClick={startAddProject}
  style={actionButtonStyle}
>
  <Plus size={13} />
  Add Project
</button>
            </div>

           {editingSection === 'project' ? (
  <div style={{ display: 'grid', gap: '12px' }}>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '12px',
      }}
    >

      <div>
        <label style={labelStyle}>
          Project Title *
        </label>

        <input
          style={inputStyle}
          value={itemForm?.title || ''}
          placeholder="Project name"
          onChange={(e) =>
            setItemForm({
              ...itemForm,
              title: e.target.value,
            })
          }
        />
      </div>

      <div>
        <label style={labelStyle}>
          Project Link *
        </label>

        <input
          type="url"
          style={inputStyle}
          value={itemForm?.link || ''}
          placeholder="https://github.com/username/project"
          onChange={(e) =>
            setItemForm({
              ...itemForm,
              link: e.target.value,
            })
          }
        />
      </div>

    </div>

    <div>
      <label style={labelStyle}>
        Tech Stack
      </label>

      <input
        style={inputStyle}
        value={itemForm?.techStack || ''}
        placeholder="React, Node.js, MongoDB"
        onChange={(e) =>
          setItemForm({
            ...itemForm,
            techStack: e.target.value,
          })
        }
      />
    </div>

    <div>
      <label style={labelStyle}>
        Description
      </label>

      <textarea
        style={{
          ...inputStyle,
          minHeight: '90px',
        }}
        value={itemForm?.description || ''}
        placeholder="Describe your project..."
        onChange={(e) =>
          setItemForm({
            ...itemForm,
            description: e.target.value,
          })
        }
      />
    </div>

    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      }}
    >

      <button
        type="button"
        onClick={cancelEdit}
        style={cancelButtonStyle}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSaveProject}
        disabled={saving}
        style={saveButtonStyle}
      >
        {saving ? 'Saving...' : 'Save Project'}
      </button>

    </div>

  </div>
) : (profile.projects || []).length > 0 ? (
  (profile.projects || []).map(
                (project, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '14px',
                      background:
                        'var(--bg-elevated)',
                      borderRadius: '10px',
                      marginBottom: '8px',
                      border:
                        '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: '14px',
                          margin: 0,
                        }}
                      >
                        {project.title}
                      </p>

                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems:
                              'center',
                            gap: '5px',
                            padding:
                              '6px 11px',
                            background:
                              'rgba(230,126,34,0.10)',
                            border:
                              '1px solid rgba(230,126,34,0.25)',
                            borderRadius: '7px',
                            color:
                              'var(--accent-primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            textDecoration:
                              'none',
                          }}
                        >
                          <ExternalLink
                            size={13}
                          />
                          Project Link
                        </a>
                      )}
                    </div>

                    {project.techStack
                      ?.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap:
                            'wrap',
                          gap: '5px',
                          marginTop: '8px',
                        }}
                      >
                        {project.techStack.map(
                          (technology) => (
                          <span
  key={technology}
  style={{
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 9px',
    borderRadius: '999px',
    background: 'rgba(230,126,34,0.10)',
    border: '1px solid rgba(230,126,34,0.25)',
    color: 'var(--accent-primary)',
    fontSize: '11px',
    fontWeight: 700,
  }}
>
  {technology}
</span>
                          )
                        )}
                      </div>
                    )}

                    {project.description && (
                      <p
                        style={{
                          fontSize: '12px',
                          color:
                            'var(--text-secondary)',
                          marginTop: '8px',
                          marginBottom: 0,
                        }}
                      >
                        {
                          project.description
                        }
                      </p>
                    )}
                  </div>
                )
              )
            ) : (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                No projects added
              </span>
            )}
          </Card>

          {/* =================================================
              ACADEMIC ACHIEVEMENTS
          ================================================== */}

         

          {/* =================================================
              PROFESSIONAL SAVE/CANCEL
          ================================================== */}

          {editingSection === 'professional' && (
            <SaveCancel />
          )}
        </div>
      )}

      {/* =====================================================
          CODING PROFILES
      ====================================================== */}

      {tab === 'coding' && (
        <Card>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Code2
                size={18}
                strokeWidth={2.1}
                color="var(--accent-primary)"
              />

              Coding Profiles
            </h3>

            {editingSection !== 'coding' && (
              <button
                type="button"
                onClick={() =>
                  startEdit('coding')
                }
                style={actionButtonStyle}
              >
                <Pencil size={13} />
                Edit Profiles
              </button>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            {/* GitHub */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background:
                    'var(--bg-elevated)',
                  border:
                    '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Github size={19} />
              </div>

              {editingSection === 'coding' ? (
                <input
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                  placeholder="GitHub profile URL"
                  value={
                    form.codingProfiles
                      .github
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      codingProfiles: {
                        ...form.codingProfiles,
                        github:
                          e.target.value,
                      },
                    })
                  }
                />
              ) : profile.codingProfiles
                  ?.github ? (
                <a
                  href={
                    profile.codingProfiles
                      .github
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '7px',
                    color:
                      'var(--accent-primary)',
                    fontSize: '13px',
                    textDecoration:
                      'none',
                  }}
                >
                  GitHub Profile
                  <ExternalLink
                    size={13}
                  />
                </a>
              ) : (
                <span
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  GitHub profile not added
                </span>
              )}
            </div>

            {/* LeetCode */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background:
                    'var(--bg-elevated)',
                  border:
                    '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 800,
                  color:
                    'var(--accent-primary)',
                }}
              >
                LC
              </div>

              {editingSection === 'coding' ? (
                <input
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                  placeholder="LeetCode profile URL"
                  value={
                    form.codingProfiles
                      .leetcode
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      codingProfiles: {
                        ...form.codingProfiles,
                        leetcode:
                          e.target.value,
                      },
                    })
                  }
                />
              ) : profile.codingProfiles
                  ?.leetcode ? (
                <a
                  href={
                    profile.codingProfiles
                      .leetcode
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '7px',
                    color:
                      'var(--accent-primary)',
                    fontSize: '13px',
                    textDecoration:
                      'none',
                  }}
                >
                  LeetCode Profile
                  <ExternalLink
                    size={13}
                  />
                </a>
              ) : (
                <span
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  LeetCode profile not added
                </span>
              )}
            </div>

            {/* HackerRank */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background:
                    'var(--bg-elevated)',
                  border:
                    '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontWeight: 800,
                  color:
                    'var(--accent-primary)',
                }}
              >
                HR
              </div>

              {editingSection === 'coding' ? (
                <input
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                  placeholder="HackerRank profile URL"
                  value={
                    form.codingProfiles
                      .hackerrank
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      codingProfiles: {
                        ...form.codingProfiles,
                        hackerrank:
                          e.target.value,
                      },
                    })
                  }
                />
              ) : profile.codingProfiles
                  ?.hackerrank ? (
                <a
                  href={
                    profile.codingProfiles
                      .hackerrank
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '7px',
                    color:
                      'var(--accent-primary)',
                    fontSize: '13px',
                    textDecoration:
                      'none',
                  }}
                >
                  HackerRank Profile
                  <ExternalLink
                    size={13}
                  />
                </a>
              ) : (
                <span
                  style={{
                    color:
                      'var(--text-muted)',
                    fontSize: '13px',
                  }}
                >
                  HackerRank profile not added
                </span>
              )}
            </div>
          </div>

          {editingSection === 'coding' && (
            <SaveCancel />
          )}
        </Card>
      )}
    </div>
  );
}