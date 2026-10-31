import React, { useState, useRef, useEffect } from 'react';
import { studentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, Badge, Tabs, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

import {
  Sparkles,
  MessageCircle,
  Link2,
  Send,
  Menu,
  Plus,
  Trash2,
  Bot,
  UserRound,
  ExternalLink,
  Linkedin,
  BriefcaseBusiness,
  Zap,
  Search,
  GraduationCap,
  Building2,
  Rocket,
  Code2,
} from 'lucide-react';
export default function AITools() {
  const [tab, setTab] = useState('chatbot');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* AI Tools Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles
            size={25}
            color="var(--accent-primary)"
            strokeWidth={2.2}
          />

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 800,
              margin: 0,
            }}
          >
            AI Tools
          </h1>
        </div>

        <p
          style={{
            color: 'var(--text-secondary)',
            marginTop: '6px',
          }}
        >
          AI-powered placement assistance, drive guidance and external job search links.
        </p>
      </div>

      {/* AI Tool Tabs */}
      <Tabs
        tabs={[
          {
            value: 'chatbot',
            label: 'Drive Chatbot',
            icon: <MessageCircle size={15} />,
          },
          {
            value: 'joblinks',
            label: 'Job Search Links',
            icon: <Link2 size={15} />,
          },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* Tool Content */}
      {tab === 'chatbot' && <DriveChatbot />}
      {tab === 'joblinks' && <JobLinks />}

    </div>
  );
}
// Drive Chatbot
// Drive Chatbot
// Drive Chatbot
function DriveChatbot() {
  const { profile } = useAuth();

  const welcomeMsg = {
  role: 'assistant',
  content: `Hi ${profile?.name?.split(' ')[0] || 'there'}! I'm your placement assistant. Ask me anything about upcoming drives, company details, eligibility, exam dates, or preparation tips!`,
};

  const [messages, setMessages]           = useState([welcomeMsg]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats]                 = useState([]);
  const [sidebarOpen, setSidebarOpen]     = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + 'px';
    }
  }, [input]);

  // Fetch chat history list
  const fetchChats = async () => {
    try {
      const res = await studentAPI.getChatHistory();
      setChats(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => { fetchChats(); }, []);

  const handleNewChat = () => {
    setMessages([welcomeMsg]);
    setCurrentChatId(null);
    setInput('');
  };

  const handleSelectChat = async (chatId) => {
    try {
      const res = await studentAPI.getChatById(chatId);
      setMessages(res.data.data.messages || [welcomeMsg]);
      setCurrentChatId(chatId);
    } catch { /* silent */ }
  };

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    try {
      await studentAPI.deleteChatHistory(chatId);
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (currentChatId === chatId) handleNewChat();
    } catch { /* silent */ }
  };

  const formatDate = (dateStr) => {
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  const QUICK = [
    'What companies are coming?',
    'What skills does TCS require?',
    'How to prepare for Infosys?',
    'What is the selection ratio?',
    'Tell me about off-campus drives',
  ];

  const sendMessage = async (text) => {
  const msg = (text || input).trim();
  if (!msg || loading) return;
  setInput('');
  setMessages(prev => [...prev, { role: 'user', content: msg }]);
  setLoading(true);
  try {
    const res = await studentAPI.chatbotMessage({
      message: msg,
      profile,
      chatId: currentChatId || null,   // ← always send current chat id
    });
    const { reply, chatId: returnedChatId } = res.data.data;
    setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    if (returnedChatId) {
      setCurrentChatId(returnedChatId); // ← lock onto this chat for all future messages
      fetchChats();                      // ← refresh sidebar list
    }
  } catch {
    setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again shortly." }]);
  } finally {
    setLoading(false);
  }
};

  const isNewChat = messages.length <= 1;

  return (
    <div
  style={{
    display: 'flex',
    height: '80vh',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: 'var(--bg-primary)',
  }}
>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: sidebarOpen ? '260px' : '0',
        minWidth: sidebarOpen ? '260px' : '0',
        background: 'var(--bg-secondary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
        borderRight: '1px solid var(--border)',
      }}>
        {sidebarOpen && (
          <>
            {/* Sidebar header */}
            <div style={{ padding: '16px',borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setSidebarOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                  title="Close sidebar"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
               <span
  style={{
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  }}
>
  Placement Bot
</span>
              </div>
              {/* New Chat button */}
              <button onClick={handleNewChat}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-elevated)',
border: '1px solid var(--border)',
color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
               onMouseEnter={e =>
  e.currentTarget.style.background = 'rgba(230,126,34,0.12)'
}
onMouseLeave={e =>
  e.currentTarget.style.background = 'var(--bg-elevated)'
}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Chat
              </button>
            </div>

            {/* Chat history list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {chats.length === 0 ? (
                <p style={{ color: '#6b6b6b', fontSize: '13px', padding: '12px', textAlign: 'center' }}>No chats yet</p>
              ) : chats.map(chat => (
                <div key={chat._id} onClick={() => handleSelectChat(chat._id)}
                  style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background:
  currentChatId === chat._id
    ? 'rgba(230,126,34,0.12)'
    : 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (currentChatId !== chat._id) {
  e.currentTarget.style.background = 'rgba(230,126,34,0.06)';
} }}
                  onMouseLeave={e => {if (currentChatId !== chat._id) {
  e.currentTarget.style.background = 'transparent';
} }}
                >
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>
                      {chat.title}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(chat.updatedAt)}</p>
                  </div>
                  <button onClick={e => handleDeleteChat(e, chat._id)}
                    className="chatbot-del-btn"
                    title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b6b', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0, transition: 'opacity 0.15s' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Sidebar footer */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #2d2d2d' }}>
              <p style={{ fontSize: '11px', color: '#6b6b6b', textAlign: 'center' }}>JobLens Placement Assistant</p>
            </div>
          </>
        )}
      </div>

      {/* ── CHAT AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #2d2d2d', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hamburger — show when sidebar closed */}
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            >
             <Menu size={20} />
            </button>
          )}
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)',
boxShadow: '0 0 6px var(--accent-primary)'}} />
          <span style={{ fontSize: '14px', fontWeight: 600,color: 'var(--text-primary)'

           }}>Placement Assistant</span>
          <span style={{ fontSize: '12px', color: '#6b6b6b', marginLeft: '4px' }}>Powered by Gemini · Live DB</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
          {isNewChat ? (
            /* Welcome screen */
            <div style={{ maxWidth: '560px', margin: '40px auto 0', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '14px', background:'var(--accent-primary)' , display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: '24px' }}><GraduationCap size={28} color="var(--bg-primary)" /></div>
              <h2 style={{ fontSize: '20px', fontWeight: 600,color: 'var(--text-primary)', marginBottom: '8px' }}>How can I help you today?</h2>
              <p style={{ color: '#9b9b9b', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
                Ask me about placement drives, salary packages, eligibility, exam dates and more.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {QUICK.map((s, i) => (
                  <button key={i} onClick={() => sendMessage(s)}
                    style={{ padding: '9px 15px',  borderRadius: '20px',background: 'var(--bg-elevated)',
border: '1px solid var(--border)',
color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' }}
                  onMouseEnter={e => {
  e.currentTarget.style.background = 'rgba(230,126,34,0.10)';
  e.currentTarget.style.borderColor = 'rgba(230,126,34,0.45)';
}}

onMouseLeave={e => {
  e.currentTarget.style.background = 'var(--bg-elevated)';
  e.currentTarget.style.borderColor = 'var(--border)';
}}

onMouseDown={e => {
  e.currentTarget.style.background = 'rgba(230,126,34,0.18)';
}}

onMouseUp={e => {
  e.currentTarget.style.background = 'rgba(230,126,34,0.10)';
}}
                  >{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '16px', gap: '10px', alignItems: 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background:'var(--accent-primary)' , display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', fontSize: '14px' }}>🤖</div>
                  )}
                  <div style={{ maxWidth: '72%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',background:
  msg.role === 'user'
    ? 'var(--accent-primary)'
    : 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%',background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                      <UserRound size={15} color="var(--bg-primary)" />
                    </div>
                  )}
                </div>
              ))}
              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10a37f, #0d8a6e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px' }}></div>
                  <div style={{ padding: '14px 18px', background: '#2d2d2d', borderRadius: '18px 18px 18px 4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width: '7px', height: '7px', background: '#6b6b6b', borderRadius: '50%', display: 'inline-block', animation: 'chatbotBounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div style={{ padding: '14px 18px 18px', background: 'var(--bg-primary)', borderTop: '1px solid #2d2d2d' }}>
          <div style={{ maxWidth: '700px', margin: '0 auto',borderRadius: '12px', background: 'var(--bg-elevated)',
border: '1px solid var(--border)',
color: 'var(--text-primary)', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 12px' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask about any placement drive..."
              rows={1}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '14px', resize: 'none', lineHeight: 1.6, maxHeight: '140px', overflowY: 'auto', fontFamily: 'inherit' }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: input.trim() && !loading ? '#10a37f' : '#404040', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#6b6b6b', marginTop: '8px' }}>Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes chatbotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .chatbot-del-btn { opacity: 0 !important; }
        div:hover > .chatbot-del-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

// Job Search Links
function JobLinks() {
  const [form, setForm]     = useState({ role: '', location: '', experience: '0' });
  const [links, setLinks]   = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async (e) => {
    e.preventDefault();
    if (!form.role) return toast.error('Enter a role');
    setLoading(true);
    try {
      const res = await studentAPI.generateJobLinks(form);
      setLinks(res.data.data.links);
    } catch { toast.error('Failed to generate links'); }
    finally { setLoading(false); }
  };
const PLATFORMS = [
  {
    key: 'linkedin',
    icon: Linkedin,
    label: 'LinkedIn',
  },
  {
    key: 'naukri',
    icon: BriefcaseBusiness,
    label: 'Naukri',
  },
  {
    key: 'unstop',
    icon: Zap,
    label: 'Unstop',
  },
  {
    key: 'indeed',
    icon: Search,
    label: 'Indeed',
  },
  {
    key: 'internshala',
    icon: GraduationCap,
    label: 'Internshala',
  },
  {
    key: 'glassdoor',
    icon: Building2,
    label: 'Glassdoor',
  },
  {
    key: 'wellfound',
    icon: Rocket,
    label: 'Wellfound',
  },
  {
    key: 'hirist',
    icon: Code2,
    label: 'Hirist',
  },
];
  const inputStyle = { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', padding: '10px 14px', fontSize: '14px' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3
  style={{
    fontFamily: 'var(--font-display)',
    fontSize: '16px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }}
>
  <Link2 size={18} color="var(--accent-primary)" />
  Generate Job Search Links
</h3>
        <form onSubmit={generate} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>ROLE *</label>
            <input style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>LOCATION</label>
            <input style={inputStyle} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Hyderabad" />
          </div>
          <div style={{ minWidth: '120px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>EXPERIENCE</label>
            <select style={inputStyle} value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })}>
              <option value="0">Fresher</option>
              <option value="1">1 Year</option>
              <option value="2">2 Years</option>
            </select>
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '10px 24px', background: 'var(--accent-primary)', border: 'none', borderRadius: 'var(--radius)', color: 'var(--bg-primary)', cursor: 'pointer', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            {loading && <Spinner size={14} color="var(--bg-primary)" />}Generate Links
          </button>
        </form>
      </Card>
      {links && (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Showing links for <strong style={{ color: 'var(--text-primary)' }}>{form.role}</strong> {form.location && `in ${form.location}`}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {PLATFORMS.map(({ key, icon: Icon, label }) => (
              links[key] && (
                <a key={key} href={links[key]} target="_blank" rel="noreferrer"
                  style={{
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 16px',
  background: 'var(--bg-card)',
  border: '1px solid rgba(230,126,34,0.22)',
  borderRadius: '12px',
  textDecoration: 'none',
  color: 'var(--text-primary)',
  transition: 'var(--transition)',
}}
onMouseEnter={e => {
  e.currentTarget.style.background = 'rgba(230,126,34,0.10)';
  e.currentTarget.style.borderColor = 'rgba(230,126,34,0.45)';
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 8px 22px rgba(230,126,34,0.10)';
}}
onMouseLeave={e => {
  e.currentTarget.style.background = 'var(--bg-card)';
  e.currentTarget.style.borderColor = 'rgba(230,126,34,0.22)';
  e.currentTarget.style.transform = 'none';
  e.currentTarget.style.boxShadow = 'none';
}}
                >
                  <span
  style={{
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(230,126,34,0.10)',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }}
>
  <Icon size={20} strokeWidth={2} />
</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>{label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Search →</p>
                  </div>
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Score Ring SVG
function ScoreRing({ score, color }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="90" height="90" viewBox="0 0 90 90">
      <circle cx="45" cy="45" r={r} fill="none" stroke="var(--bg-elevated)" strokeWidth="8" />
      <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 45 45)"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x="45" y="49" textAnchor="middle" fill="var(--text-primary)" fontSize="16" fontWeight="800">
        {score}
      </text>
    </svg>
  );
}