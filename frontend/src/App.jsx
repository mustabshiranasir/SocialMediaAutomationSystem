import React, { useState, useEffect, useRef } from 'react';
import {
  FaLinkedinIn, FaInstagram, FaXTwitter, FaFacebook, FaPinterest,
  FaTiktok, FaYoutube, FaTelegram, FaWordpress, FaReddit, FaGoogle, FaThreads
} from 'react-icons/fa6';
import { FaTwitter, FaXing } from 'react-icons/fa';

const API_BASE = 'http://localhost:8000';

// ── Utility: parse platform previews & key points from description text ──────
function parseDraftMeta(description) {
  if (!description) return { body: '', keyPoints: [], cta: '', audience: '', platformPreviews: {}, improved: false };

  const improved = description.startsWith('[AI IMPROVED');

  // Key Talking Points
  const keyPointsMatch = description.match(/\[Key Talking Points\]\n([\s\S]*?)(?=\n\[|$)/);
  const keyPoints = keyPointsMatch
    ? keyPointsMatch[1].split('\n').filter(l => l.startsWith('•')).map(l => l.replace('• ', '').trim())
    : [];

  // CTA
  const ctaMatch = description.match(/\[Call to Action\]\n(.*?)(?=\n\[|$)/);
  const cta = ctaMatch ? ctaMatch[1].trim() : '';

  // Target Audience
  const audMatch = description.match(/\[Target Audience\]\n(.*?)(?=\n\[|$)/);
  const audience = audMatch ? audMatch[1].trim() : '';

  // Platform Previews
  const platformPreviews = {};
  const previewMatch = description.match(/\[Platform Previews\]\n([\s\S]*?)$/);
  if (previewMatch) {
    const previewsText = previewMatch[1];
    const platformBlocks = previewsText.split(/\[([A-Z]+)\]\n/);
    for (let i = 1; i < platformBlocks.length; i += 2) {
      const platform = platformBlocks[i].toLowerCase();
      platformPreviews[platform] = platformBlocks[i + 1]?.trim() || '';
    }
  }

  // Body = everything before first metadata section
  const bodyMatch = description.match(/^([\s\S]*?)(?=\n\[Key Talking Points\]|\n\[Target Audience\]|\n\[Call to Action\]|\n\[Marketing Strategy\]|\n\[Platform Previews\])/);
  const body = bodyMatch ? bodyMatch[1].trim() : description;

  return { body, keyPoints, cta, audience, platformPreviews, improved };
}

const ALL_PLATFORMS = [
  'linkedin', 'instagram', 'twitter', 'x', 'facebook', 'pinterest', 
  'google business', 'tiktok', 'youtube', 'telegram', 'threads', 'xing', 'wordpress', 'reddit'
];

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isRegister, setIsRegister] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');

  // Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  // Dashboard & Content State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [promptText, setPromptText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['linkedin', 'instagram']);
  const [tone, setTone] = useState('Professional');
  const [drafts, setDrafts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analyticsOverview, setAnalyticsOverview] = useState({
    total_likes: 0, total_shares: 0, total_reach: 0, total_comments: 0, average_ctr: 0.0
  });
  const [publishedPosts, setPublishedPosts] = useState([]);

  // Per-draft UI state
  const [improvementTexts, setImprovementTexts] = useState({});      // { draftId: string }
  const [improvingDrafts, setImprovingDrafts] = useState({});          // { draftId: bool }
  const [regeneratingImages, setRegeneratingImages] = useState({});    // { draftId: bool }
  const [expandedDescriptions, setExpandedDescriptions] = useState({}); // { draftId: bool }
  const [activePlatformTab, setActivePlatformTab] = useState({});     // { draftId: string }
  const [imageTimestamps, setImageTimestamps] = useState({});          // { draftId: timestamp } for cache busting

  // Preview Modal Overlay state
  const [previewDraft, setPreviewDraft] = useState(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [modalPlatformTab, setModalPlatformTab] = useState('linkedin');
  const [savingPreview, setSavingPreview] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', caption: '', hashtags: '', description: '' });

  // Password Reset State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Campaign Management State
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignPlatforms, setNewCampaignPlatforms] = useState(['linkedin', 'instagram']);
  const [newCampaignStartDate, setNewCampaignStartDate] = useState('');
  const [newCampaignEndDate, setNewCampaignEndDate] = useState('');

  // Scheduling State
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // DevOps & System Diagnostic State (Skills 8 & 10)
  const [systemHealth, setSystemHealth] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(null);

  // Loading & UI feedback
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (token) {
      fetchDrafts();
      fetchAccounts();
      fetchNotifications();
      fetchAnalytics();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchNotifications();
      if (activeTab === 'analytics') fetchAnalytics();
    }, 4000);
    return () => clearInterval(interval);
  }, [token, activeTab]);

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  // ── Auth ─────────────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (isRegister) {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword, name: authName, role: 'requester' })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detailMsg = Array.isArray(data.detail)
            ? data.detail.map(d => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ')
            : (typeof data.detail === 'string' ? data.detail : (data.message || 'Registration failed'));
          throw new Error(detailMsg);
        }
        setToken(data.access_token); setUser(data.user);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        const params = new URLSearchParams();
        params.append('username', authEmail);
        params.append('password', authPassword);
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detailMsg = Array.isArray(data.detail)
            ? data.detail.map(d => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ')
            : (typeof data.detail === 'string' ? data.detail : (data.message || 'Login failed'));
          throw new Error(detailMsg);
        }
        setToken(data.access_token); setUser(data.user);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) { setErrorMsg(err.message || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    setToken(''); setUser(null);
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setActiveTab('dashboard');
  };

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const fetchDrafts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/drafts`, { headers: getHeaders() });
      if (res.ok) setDrafts(await res.json());
    } catch (e) { console.error('fetchDrafts:', e); }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, { headers: getHeaders() });
      if (res.ok) setAccounts(await res.json());
    } catch (e) { console.error('fetchAccounts:', e); }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, { headers: getHeaders() });
      if (res.ok) setNotifications(await res.json());
    } catch (e) { console.error('fetchNotifications:', e); }
  };

  const fetchAnalytics = async () => {
    try {
      const r1 = await fetch(`${API_BASE}/api/analytics`, { headers: getHeaders() });
      if (r1.ok) setAnalyticsOverview(await r1.json());
      const r2 = await fetch(`${API_BASE}/api/analytics/dashboard/posts`, { headers: getHeaders() });
      if (r2.ok) setPublishedPosts(await r2.json());
    } catch (e) { console.error('fetchAnalytics:', e); }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/campaigns`, { headers: getHeaders() });
      if (res.ok) setCampaigns(await res.json());
    } catch (e) { console.error('fetchCampaigns:', e); }
  };

  const fetchSystemDiagnostics = async () => {
    try {
      const h = await fetch(`${API_BASE}/api/system/health`, { headers: getHeaders() });
      if (h.ok) setSystemHealth(await h.json());
      const c = await fetch(`${API_BASE}/api/system/cloud-status`, { headers: getHeaders() });
      if (c.ok) setCloudStatus(await c.json());
    } catch (e) { console.error('fetchSystemDiagnostics:', e); }
  };

  // ── Password Reset & Campaign Handlers ─────────────────────────────────────
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail || !resetNewPassword) return;
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, new_password: resetNewPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Password reset failed');
      setSuccessMsg(`🔒 Password reset successfully! You can now log in with your new password.`);
      setShowResetModal(false);
      setResetEmail(''); setResetNewPassword('');
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/campaigns`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({
          name: newCampaignName,
          target_platforms: newCampaignPlatforms,
          start_date: newCampaignStartDate ? new Date(newCampaignStartDate).toISOString() : null,
          end_date: newCampaignEndDate ? new Date(newCampaignEndDate).toISOString() : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const detailMsg = Array.isArray(data.detail)
          ? data.detail.map(d => `${d.loc ? d.loc.slice(1).join('.') + ': ' : ''}${d.msg}`).join(', ')
          : (typeof data.detail === 'string' ? data.detail : (data.message || 'Failed to create campaign'));
        throw new Error(detailMsg);
      }
      setSuccessMsg(`🎯 Campaign '${data.name}' created successfully!`);
      setNewCampaignName('');
      fetchCampaigns();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleScheduleDraft = async (draftId, targetIsoDate) => {
    if (!targetIsoDate) return;
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${draftId}/schedule`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ scheduled_at: targetIsoDate })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Scheduling failed');
      setSuccessMsg(`📅 Post #${draftId} successfully scheduled for release!`);
      if (previewDraft && previewDraft.id === draftId) setPreviewDraft(data);
      fetchDrafts(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleRunScheduledQueue = async () => {
    setLoading(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/publish/scheduled/run`, {
        method: 'POST', headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Scheduled runner failed');
      setSuccessMsg(`⏰ Scheduled Publish Runner executed. Released ${data.executed_count} due posts.`);
      fetchDrafts(); fetchAnalytics(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  // ── Prompt submit ────────────────────────────────────────────────────────
  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      const body = {
        prompt_text: promptText,
        target_platforms: selectedPlatforms,
        tone,
        ...(selectedCampaignId ? { campaign_id: parseInt(selectedCampaignId) } : {})
      };
      const res = await fetch(`${API_BASE}/api/prompt`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to generate campaign draft');
      setPromptText('');
      setSuccessMsg('✨ AI campaign draft generated and sent to Review Queue!');

      // Auto-schedule if a date was picked
      if (scheduledDateTime && data.id) {
        await handleScheduleDraft(data.id, new Date(scheduledDateTime).toISOString());
        setScheduledDateTime('');
      }

      fetchDrafts(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  // ── Approve / Reject ─────────────────────────────────────────────────────
  const handleApprove = async (draftId) => {
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${draftId}/approve`, {
        method: 'POST', headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to approve draft');
      setSuccessMsg('🚀 Draft Approved and Published successfully!');
      fetchDrafts(); fetchAnalytics(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  // ── AI Improve (opinion-based instant regeneration) ─────────────────────
  const handleImprove = async (draftId) => {
    const opinion = improvementTexts[draftId]?.trim();
    if (!opinion) return;

    setImprovingDrafts(prev => ({ ...prev, [draftId]: true }));
    setErrorMsg(''); setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${draftId}/improve`, {
        method: 'POST', headers: getHeaders(),
        body: JSON.stringify({ opinion, regenerate_image: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Improvement failed');
      setSuccessMsg('✨ Draft improved with your feedback! Image regenerated.');
      setImprovementTexts(prev => ({ ...prev, [draftId]: '' }));
      // Bust image cache
      setImageTimestamps(prev => ({ ...prev, [draftId]: Date.now() }));
      fetchDrafts(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setImprovingDrafts(prev => ({ ...prev, [draftId]: false })); }
  };

  // ── Regenerate Image only ────────────────────────────────────────────────
  const handleRegenerateImage = async (draftId) => {
    setRegeneratingImages(prev => ({ ...prev, [draftId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${draftId}/regenerate-image`, {
        method: 'POST', headers: getHeaders()
      });
      if (!res.ok) throw new Error('Image regeneration failed');
      setImageTimestamps(prev => ({ ...prev, [draftId]: Date.now() }));
      fetchDrafts();
    } catch (err) { setErrorMsg(err.message); }
    finally { setRegeneratingImages(prev => ({ ...prev, [draftId]: false })); }
  };

  // ── Modal & Editing Handlers ──────────────────────────────────────────────
  const openPreviewModal = (draft) => {
    setPreviewDraft(draft);
    setIsEditingPreview(false);
    setEditForm({
      title: draft.title || '',
      caption: draft.caption || '',
      hashtags: draft.hashtags || '',
      description: draft.description || ''
    });
    const meta = parseDraftMeta(draft.description);
    const platforms = Object.keys(meta.platformPreviews);
    setModalPlatformTab(platforms[0] || 'linkedin');
  };

  const closePreviewModal = () => {
    setPreviewDraft(null);
    setIsEditingPreview(false);
  };

  const handleSavePreviewContent = async () => {
    if (!previewDraft) return;
    setSavingPreview(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/drafts/${previewDraft.id}/content`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          title: editForm.title,
          caption: editForm.caption,
          hashtags: editForm.hashtags,
          description: editForm.description
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update post content');
      setSuccessMsg('💾 Post content updated and saved successfully!');
      setPreviewDraft(data);
      setIsEditingPreview(false);
      fetchDrafts();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSavingPreview(false);
    }
  };

  const handlePublishDraft = async (draftId) => {
    setErrorMsg(''); setSuccessMsg(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/publish/${draftId}`, {
        method: 'POST', headers: getHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to publish draft');
      setSuccessMsg('🚀 Post Published successfully to all social channels!');
      if (previewDraft && previewDraft.id === draftId) {
        setPreviewDraft(data);
      }
      fetchDrafts(); fetchAnalytics(); fetchNotifications();
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  // ── Channel ops ──────────────────────────────────────────────────────────
  const handleConnectChannel = async (platform) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/link?platform=${encodeURIComponent(platform)}&auth_code=${encodeURIComponent('code_' + platform)}`, {
        method: 'POST', headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to connect social account');
      fetchAccounts(); setSuccessMsg(`✅ Connected ${platform} account.`);
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const handleDisconnectChannel = async (accountId) => {
    if (!confirm('Disconnect this channel?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, { method: 'DELETE', headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to disconnect account');
      fetchAccounts(); setSuccessMsg('Social channel disconnected.');
    } catch (err) { setErrorMsg(err.message); }
    finally { setLoading(false); }
  };

  const quickFill = (role) => {
    if (role === 'admin') { setAuthEmail('admin@social.com'); setAuthPassword('admin123'); setAuthName('Admin User'); }
    else { setAuthEmail('maria@social.com'); setAuthPassword('maria123'); setAuthName('Maria Noor'); }
  };

  const isPlatformConnected = (platform) => accounts.some(acc => acc.platform.toLowerCase() === platform.toLowerCase());

  // ── Platform icon helper ─────────────────────────────────────────────────
  const PLATFORM_ICONS = {
    linkedin:         { Icon: FaLinkedinIn,  color: '#0A66C2' },
    instagram:        { Icon: FaInstagram,   color: '#E1306C' },
    twitter:          { Icon: FaTwitter,     color: '#1DA1F2' },
    x:                { Icon: FaXTwitter,    color: '#000000' },
    facebook:         { Icon: FaFacebook,    color: '#1877F2' },
    pinterest:        { Icon: FaPinterest,   color: '#BD081C' },
    'google business':{ Icon: FaGoogle,      color: '#4285F4' },
    google_business:  { Icon: FaGoogle,      color: '#4285F4' },
    tiktok:           { Icon: FaTiktok,      color: '#00f2fe' },
    youtube:          { Icon: FaYoutube,     color: '#FF0000' },
    telegram:         { Icon: FaTelegram,    color: '#229ED9' },
    xing:             { Icon: FaXing,        color: '#006567' },
    wordpress:        { Icon: FaWordpress,   color: '#21759B' },
    reddit:           { Icon: FaReddit,      color: '#FF4500' },
    threads:          { Icon: FaThreads,     color: '#101010' },
  };

  const platformIcon = (p, size = 16) => {
    const key = (p || '').toLowerCase();
    const entry = PLATFORM_ICONS[key];
    if (!entry) return <span style={{ fontSize: size * 0.75, fontWeight: 800 }}>{p.slice(0,2).toUpperCase()}</span>;
    const { Icon, color } = entry;
    return <Icon size={size} style={{ color, flexShrink: 0 }} />;
  };

  const platformColor = (p) => (PLATFORM_ICONS[(p || '').toLowerCase()]?.color || 'var(--primary)');

  // ── Login Screen ─────────────────────────────────────────────────────────
  if (!token) {
    return (
      <>
      <style>{`
        @keyframes loginFadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .login-wrapper { display: flex; min-height: 100vh; background: var(--bg-primary); }
        .login-left { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; border-right: 1px solid var(--border-subtle); background: var(--bg-primary); }
        .login-right { width: 480px; min-width: 480px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 50px; background: var(--bg-secondary); }
        .login-card { width: 100%; animation: loginFadeIn 0.5s ease; }
        .login-input { width: 100%; background: var(--bg-primary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 14px 18px; color: var(--text-primary); font-family: var(--font-family); font-size: 14px; outline: none; transition: var(--transition-fast); box-sizing: border-box; }
        .login-input:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(79,70,229,0.2); }
        .login-input::placeholder { color: var(--text-muted); }
        .login-divider { height: 1px; background: var(--border-subtle); margin: 28px 0; }
        @media (max-width: 900px) { .login-left { display: none; } .login-right { width: 100%; min-width: 0; padding: 40px 24px; } }
      `}</style>
      <div className="login-wrapper" style={{ position: 'relative' }}>
        {/* Floating theme toggle on login page */}
        <button
          id="login-theme-toggle-btn"
          className="theme-toggle"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}
        >
          <span className="theme-toggle-thumb">
            <span key={theme} className="theme-toggle-icon">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </span>
        </button>
        {/* Left branding panel */}
        <div className="login-left">
          <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="ClickTake Technologies" style={{ width: '90px', height: '90px', objectFit: 'contain', borderRadius: '20px', background: '#fff', padding: '8px', marginBottom: '36px', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }} />
          <h1 style={{ fontSize: '42px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1.5px', marginBottom: '16px', lineHeight: '1.1' }}>AI Social<br/>Media Engine</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '340px', lineHeight: '1.7', marginBottom: '48px' }}>Generate, review, and publish high-performance social campaigns powered by Groq and Gemini AI.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '340px' }}>
            {[
              { label: 'Multi-Platform Content Generation', desc: 'LinkedIn, Twitter, Instagram, Facebook' },
              { label: 'Live Social Post Simulator', desc: 'See exactly how posts will look per platform' },
              { label: 'Campaign Analytics Dashboard', desc: 'Track reach, engagement and click-through rates' }
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px 18px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, boxShadow: '0 0 8px var(--primary-glow)' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{f.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right login panel */}
        <div className="login-right">
          <div className="login-card">
            <div style={{ marginBottom: '36px' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '10px' }}>ClickTake Technologies</div>
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px', marginBottom: '8px' }}>{isRegister ? 'Create account' : 'Welcome back'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{isRegister ? 'Start managing social media with AI.' : 'Sign in to your content engine.'}</p>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '24px' }}>{errorMsg}</div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {isRegister && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Full Name</label>
                  <input className="login-input" type="text" value={authName} onChange={e => setAuthName(e.target.value)} required placeholder="Your full name" />
                </div>
              )}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Email Address</label>
                <input className="login-input" type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase' }}>Password</label>
                  {!isRegister && (
                    <button type="button" onClick={() => setShowResetModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-family)' }}>Forgot password?</button>
                  )}
                </div>
                <input className="login-input" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required placeholder="Min. 6 characters" />
              </div>
              <button type="submit" className="btn" style={{ width: '100%', padding: '16px', fontSize: '15px', marginTop: '4px' }} disabled={loading}>
                {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font-family)' }} onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}>
                {isRegister ? 'Sign In' : 'Sign Up Free'}
              </button>
            </div>

            <div className="login-divider" />

            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '14px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Demo Quick Access</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button onClick={() => quickFill('admin')} className="btn btn-secondary" style={{ padding: '14px 12px', fontSize: '13px', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: '700' }}>Admin</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>Full access</span>
                </button>
                <button onClick={() => quickFill('requester')} className="btn btn-secondary" style={{ padding: '14px 12px', fontSize: '13px', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: '700' }}>Requester</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '400' }}>Content role</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === 'modal-overlay') setShowResetModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Reset Password</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Enter your email and a new password.</p>
              </div>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>x</button>
            </div>
            <form onSubmit={handlePasswordReset}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label>Registered Email</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="user@example.com" required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} placeholder="Enter new password" required minLength={6} />
                </div>
                {errorMsg && <div style={{ color: '#fca5a5', fontSize: '13px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: '8px' }}>{errorMsg}</div>}
                {successMsg && <div style={{ color: '#a7f3d0', fontSize: '13px', padding: '10px 14px', background: 'rgba(16,185,129,0.08)', borderRadius: '8px' }}>{successMsg}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary" style={{ padding: '10px 20px', fontSize: '13px' }}>Cancel</button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '10px 22px', fontSize: '13px' }}>{loading ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
    );
  }

  // ── Draft Card Component ──────────────────────────────────────────────────
  const DraftCard = ({ draft }) => {
    const meta = parseDraftMeta(draft.description);
    const platforms = Object.keys(meta.platformPreviews);
    const activePlatform = activePlatformTab[draft.id] || (platforms[0] || '');
    const isExpanded = expandedDescriptions[draft.id] || false;
    const isImproving = improvingDrafts[draft.id] || false;
    const isRegeneratingImg = regeneratingImages[draft.id] || false;
    const imgTs = imageTimestamps[draft.id] || '';
    const improveTxt = improvementTexts[draft.id] || '';

    const statusColors = {
      'Under Review': '#f59e0b',
      'Published': '#10b981',
      'Rejected': '#ef4444',
      'Publish Failed': '#f97316',
      'Approved': '#6366f1',
      'Draft': '#64748b'
    };
    const statusColor = statusColors[draft.status] || '#64748b';

    // Mock platform previews
    const renderSocialPreview = () => {
      const textContent = meta.platformPreviews[activePlatform] || draft.caption || '';
      const hasImage = !!draft.image_url;
      const imageUrl = `${API_BASE}${draft.image_url}${imgTs ? '?t=' + imgTs : ''}`;

      if (activePlatform === 'twitter' || activePlatform === 'x') {
        return (
          <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '15px' }}>
                  <span style={{ fontWeight: '700' }}>ClickTake Tech</span>
                  <span style={{ color: '#71767b' }}>@ClickTake</span>
                  <span style={{ color: '#71767b' }}>• Just now</span>
                </div>
                <div style={{ fontSize: '15px', lineHeight: '1.5', marginTop: '4px', whiteSpace: 'pre-wrap', color: '#e7e9ea' }}>{textContent}</div>
                {hasImage && (
                  <div style={{ marginTop: '12px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #2f3336' }}>
                    <img src={imageUrl} alt="Post" style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71767b', marginTop: '12px', maxWidth: '320px', fontSize: '13px' }}>
                  <span>Reply</span>
                  <span>Retweet</span>
                  <span>Like</span>
                  <span>Share</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (activePlatform === 'linkedin') {
        return (
          <div style={{ background: '#1d2226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', color: '#e9ebed', fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '4px', background: '#fff' }} />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: 0 }}>ClickTake Technologies</h4>
                <p style={{ fontSize: '12px', color: '#8f9193', margin: 0 }}>10,240 followers</p>
                <p style={{ fontSize: '12px', color: '#8f9193', margin: 0 }}>Just now • Edited</p>
              </div>
            </div>
            <div style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{textContent}</div>
            {hasImage && (
              <div style={{ margin: '12px -16px -16px -16px', borderTop: '1px solid #3e4042', overflow: 'hidden' }}>
                <img src={imageUrl} alt="Post" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        );
      }

      if (activePlatform === 'instagram') {
        return (
          <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px' }}>
              <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fff' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700' }}>clicktake_tech</span>
                <span style={{ fontSize: '11px', display: 'block', color: '#a8a8a8' }}>Sponsored</span>
              </div>
            </div>
            {hasImage ? (
              <img src={imageUrl} alt="Post" style={{ width: '100%', display: 'block', maxHeight: '320px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '200px', background: '#262626', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8e8e8e' }}>No Media</div>
            )}
            <div style={{ padding: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '16px' }}>
                <span>Like</span>
                <span>Comment</span>
                <span>Share</span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>1,240 likes</p>
              <p style={{ fontSize: '13px', lineHeight: '1.5' }}>
                <span style={{ fontWeight: '700', marginRight: '6px' }}>clicktake_tech</span>
                {textContent}
              </p>
            </div>
          </div>
        );
      }

      // Facebook & Default
      return (
        <div style={{ background: '#242526', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '16px', color: '#e4e6eb', fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif', textAlign: 'left' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="Avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff' }} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: 0 }}>ClickTake Technologies</h4>
              <p style={{ fontSize: '12px', color: '#b0b3b8', margin: 0 }}>Just now</p>
            </div>
          </div>
          <div style={{ fontSize: '15px', lineHeight: '1.5', marginBottom: '12px', whiteSpace: 'pre-wrap' }}>{textContent}</div>
          {hasImage && (
            <div style={{ margin: '12px -16px -16px -16px', borderTop: '1px solid #3e4042' }}>
              <img src={imageUrl} alt="Post" style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0', overflow: 'hidden', padding: '0' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                {meta.improved && (
                  <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                    AI Improved
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {draft.id} • {new Date(draft.created_at).toLocaleString()}
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: '1.3', marginBottom: '0' }}>
                {draft.title}
              </h3>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {platforms.map(p => (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: platformColor(p), background: `${platformColor(p)}15`, padding: '4px 8px', borderRadius: '4px' }}>
                      {platformIcon(p, 12)} {p.toUpperCase()}
                    </span>
                  ))}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <button
                onClick={() => openPreviewModal(draft)}
                className="btn btn-secondary"
                style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Preview Post
              </button>
              <span className={`status-pill ${draft.status.toLowerCase().replace(' ', '-')}`}>
                {draft.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Layout ──────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <img src="https://media.licdn.com/dms/image/v2/D4D0BAQHIO-OBECZQPQ/company-logo_200_200/company-logo_200_200/0/1697892174722?e=2147483647&v=beta&t=iwbyDiYKZkyx2nsJh3Q2FD3sGCXOwSyWDfmZ70xVd2g" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', background: '#fff', borderRadius: '8px', padding: '3px' }} />
          <span>ClickTake Content Engine</span>
        </div>
        <nav className="nav-links">
          <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button className={`nav-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => { setActiveTab('campaigns'); fetchCampaigns(); }}>Campaigns</button>
          <button className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => { setActiveTab('analytics'); fetchAnalytics(); }}>Analytics</button>
          <button className={`nav-btn ${activeTab === 'devops' ? 'active' : ''}`} onClick={() => { setActiveTab('devops'); fetchSystemDiagnostics(); }}>System</button>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name}</p>
            <span className={`status-pill ${user?.role === 'admin' ? 'approved' : 'draft'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>{user?.role?.toUpperCase()}</span>
          </div>
          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="theme-toggle-thumb">
              <span key={theme} className="theme-toggle-icon">
                {theme === 'dark' ? '🌙' : '☀️'}
              </span>
            </span>
          </button>
          <button className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '13px' }} onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      {/* Messages */}
      <div style={{ padding: '0 40px', maxWidth: '1600px', width: '100%', margin: '20px auto 0' }}>
        {successMsg && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#6ee7b7', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
            {successMsg}
            <button onClick={() => setSuccessMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: '16px', opacity: 0.7 }}>x</button>
          </div>
        )}
        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '500' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
            {errorMsg}
            <button onClick={() => setErrorMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '16px', opacity: 0.7 }}>x</button>
          </div>
        )}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Prompt Form */}
            <div className="glass-panel">
              <div style={{ marginBottom: '22px' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Step 1</div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>Generate AI Campaign</h2>
              </div>
              <form onSubmit={handlePromptSubmit}>
                <div className="form-group">
                  <label htmlFor="promptInput">Campaign Topic or Concept</label>
                  <textarea
                    id="promptInput"
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    rows={3}
                    required
                    placeholder="Describe your campaign idea, product launch, or announcement..."
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label>Target Platforms</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {ALL_PLATFORMS.map(plat => (
                        <label key={plat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: selectedPlatforms.includes(plat) ? platformColor(plat) : 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', background: selectedPlatforms.includes(plat) ? `${platformColor(plat)}18` : 'transparent', border: `1px solid ${selectedPlatforms.includes(plat) ? platformColor(plat) + '40' : 'var(--border-glass)'}`, borderRadius: '8px', padding: '6px 12px', transition: 'all 0.2s' }}>
                          <input
                            type="checkbox"
                            checked={selectedPlatforms.includes(plat)}
                            onChange={e => {
                              if (e.target.checked) setSelectedPlatforms([...selectedPlatforms, plat]);
                              else setSelectedPlatforms(selectedPlatforms.filter(p => p !== plat));
                            }}
                            style={{ accentColor: platformColor(plat), width: '14px', height: '14px' }}
                          />
                          {platformIcon(plat, 13)}
                          {plat.charAt(0).toUpperCase() + plat.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="toneSelect">Brand Writing Tone</label>
                    <select id="toneSelect" value={tone} onChange={e => setTone(e.target.value)}>
                      <option value="Professional">Professional / Corporate</option>
                      <option value="Bold">Bold / Energetic</option>
                      <option value="Friendly">Friendly / Social</option>
                      <option value="Witty/Creative">Witty / Playful</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label>Link to Campaign <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)}>
                      <option value="">No Campaign</option>
                      {campaigns.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Schedule Publish Time <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                      {scheduledDateTime && (
                        <button type="button" onClick={() => setScheduledDateTime('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '11px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-family)' }}>Clear</button>
                      )}
                    </div>
                    <input
                      type="datetime-local"
                      value={scheduledDateTime}
                      onChange={e => setScheduledDateTime(e.target.value)}
                      style={{ border: scheduledDateTime ? '1px solid var(--success)' : undefined }}
                    />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading || selectedPlatforms.length === 0} style={{ minWidth: '220px', padding: '15px 32px', fontSize: '15px' }}>
                  {loading ? 'Generating Campaign...' : 'Generate AI Campaign'}
                </button>
              </form>
            </div>

            {/* Review Queue */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '6px' }}>Step 2</div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    Review Queue
                    <span style={{ background: 'rgba(88,80,236,0.12)', border: '1px solid rgba(88,80,236,0.25)', color: 'var(--primary)', fontSize: '12px', padding: '3px 12px', borderRadius: '20px', fontWeight: '700' }}>
                      {drafts.length} drafts
                    </span>
                  </h2>
                </div>
                <button onClick={fetchDrafts} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Refresh</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {drafts.length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(88,80,236,0.1)', border: '1px solid rgba(88,80,236,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '20px', color: 'var(--primary)' }}>0</div>
                    <p style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)' }}>No drafts in queue</p>
                    <p style={{ fontSize: '13px' }}>Submit a prompt above to generate your first AI campaign.</p>
                  </div>
                ) : (
                  drafts.map(draft => <React.Fragment key={draft.id}>{DraftCard({ draft })}</React.Fragment>)
                )}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

            {/* Account connections */}
            <div className="glass-panel">
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>Account Connections</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ALL_PLATFORMS.map(plat => {
                  const linkedObj = accounts.find(acc => acc.platform.toLowerCase() === plat.toLowerCase());
                  const isConnected = !!linkedObj;
                  return (
                    <div key={plat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', background: isConnected ? 'rgba(16,185,129,0.04)' : 'transparent' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '6px', background: `${platformColor(plat)}18` }}>{platformIcon(plat, 15)}</span>
                        {plat.charAt(0).toUpperCase() + plat.slice(1)}
                      </span>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.5px', background: isConnected ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: isConnected ? '#10b981' : '#64748b', border: `1px solid ${isConnected ? '#10b981' : '#64748b'}40` }}>
                          {isConnected ? 'LIVE' : 'OFF'}
                        </span>
                        {isConnected ? (
                          <button onClick={() => handleDisconnectChannel(linkedObj.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-error)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Unlink</button>
                        ) : (
                          <button onClick={() => handleConnectChannel(plat)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>Link</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orchestration logs */}
            <div className="glass-panel" style={{ maxHeight: '440px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-secondary)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>Activity Log</div>
              <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No activity yet.</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ fontSize: '12px', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ color: 'var(--text-primary)', lineHeight: '1.5' }}>{n.message}</p>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{new Date(n.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div style={{ padding: '40px', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <div style={{ marginBottom: '36px' }}>
            <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Overview</div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)' }}>Campaign Analytics</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[
              { label: 'Total Reach', value: analyticsOverview.total_reach.toLocaleString(), change: 'Across all platforms', color: 'var(--success)' },
              { label: 'Total Likes', value: analyticsOverview.total_likes.toLocaleString(), change: 'Engagement metric', color: 'var(--primary)' },
              { label: 'Shares & Retweets', value: analyticsOverview.total_shares.toLocaleString(), change: 'Organic amplification', color: 'var(--secondary)' },
              { label: 'Avg Click-Through', value: `${(analyticsOverview.average_ctr * 100).toFixed(2)}%`, change: 'Conversion rate', color: 'var(--warning)' },
            ].map((kpi, i) => (
              <div key={i} className="glass-panel" style={{ borderTop: `2px solid ${kpi.color}` }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '12px' }}>{kpi.label}</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: '6px', lineHeight: 1 }}>{kpi.value}</div>
                <div style={{ fontSize: '12px', color: kpi.color, fontWeight: '600' }}>{kpi.change}</div>
              </div>
            ))}
          </div>
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Published Posts Registry</h3>
              <button onClick={fetchAnalytics} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}>Refresh</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    {['Post ID', 'Title', 'Platform', 'Published', 'Reach', 'Likes', 'Comments', 'Shares', 'CTR'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {publishedPosts.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No published posts yet. Approve a draft to publish.</td></tr>
                  ) : publishedPosts.map(p => (
                    <tr key={p.id}>
                      <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>{p.platform_post_id}</td>
                      <td style={{ fontWeight: '600' }}>{p.title}</td>
                      <td><span style={{ background: `${platformColor(p.platform)}18`, color: platformColor(p.platform), padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>{p.platform}</span></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{new Date(p.published_at).toLocaleString()}</td>
                      <td style={{ fontWeight: '600' }}>{p.reach?.toLocaleString()}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{p.likes}</td>
                      <td>{p.comments}</td>
                      <td style={{ color: 'var(--secondary)', fontWeight: '600' }}>{p.shares}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: '700' }}>{(p.ctr * 100).toFixed(2)}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Campaign Manager Tab ─────────────────────────────────────────── */}
      {activeTab === 'campaigns' && (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '36px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Campaigns</div>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>Campaign Manager</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Group content posts under named campaigns and track performance.</p>
            </div>
            <button onClick={handleRunScheduledQueue} className="btn btn-secondary" style={{ padding: '12px 22px', fontSize: '13px' }}>
              Run Scheduled Queue
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '28px', alignItems: 'start' }}>

            {/* Create Campaign Panel */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--primary)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>Create New Campaign</div>
              <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Campaign Name</label>
                  <input type="text" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} placeholder="e.g. Summer Launch 2026" required />
                </div>
                <div className="form-group">
                  <label>Target Platforms</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {ALL_PLATFORMS.map(plat => (
                      <label key={plat} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '13px' }}>
                        <input type="checkbox"
                          checked={newCampaignPlatforms.includes(plat)}
                          onChange={e => {
                            if (e.target.checked) setNewCampaignPlatforms([...newCampaignPlatforms, plat]);
                            else setNewCampaignPlatforms(newCampaignPlatforms.filter(p => p !== plat));
                          }}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{platformIcon(plat, 13)}</span>
                        {plat.charAt(0).toUpperCase() + plat.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" value={newCampaignStartDate} onChange={e => setNewCampaignStartDate(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input type="date" value={newCampaignEndDate} onChange={e => setNewCampaignEndDate(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="btn" disabled={loading || !newCampaignName.trim()} style={{ marginTop: '4px' }}>
                  {loading ? '⏳ Creating...' : '🎯 Create Campaign'}
                </button>
              </form>
            </div>

            {/* Campaign List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {campaigns.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No campaigns yet. Create one to group your content posts!
                </div>
              ) : campaigns.map(c => (
                <div key={c.id} className="glass-panel" style={{ padding: '22px 26px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</h3>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {c.target_platforms.split(',').map(p => p.trim()).filter(Boolean).map(p => (
                          <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: `${platformColor(p)}22`, color: platformColor(p), fontSize: '11px', padding: '3px 9px', borderRadius: '10px', fontWeight: '700' }}>{platformIcon(p, 11)} {p.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{c.id} • {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    <div style={{ textAlign: 'center', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary)' }}>{c.total_drafts}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Total Drafts</div>
                    </div>
                    <div style={{ textAlign: 'center', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent)' }}>{c.published_count}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Published</div>
                    </div>
                    {c.start_date && (
                      <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.05)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-warning)' }}>{new Date(c.start_date).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Start Date</div>
                      </div>
                    )}
                    {c.end_date && (
                      <div style={{ textAlign: 'center', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-error)' }}>{new Date(c.end_date).toLocaleDateString()}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>End Date</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── DevOps & Skills Diagnostic Tab ───────────────────────────────── */}
      {activeTab === 'devops' && (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>🛠️ Skills & System Diagnostics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Live status for all 10 AI Skills, Cloud autoscaling, and API health monitoring.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>

            {/* Skills Health */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--accent)' }}>⚡ AI Skills Status (10/10)</h3>
              {systemHealth ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(systemHealth.active_skills_status || {}).map(([skill, status]) => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(16,185,129,0.04)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{skill}</span>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 10px', borderRadius: '10px' }}>● {status.toUpperCase()}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '12px', padding: '14px', background: 'rgba(99,102,241,0.05)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>API Schema Consistency</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)' }}>{systemHealth.api_schema_consistency}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Avg. Endpoint Latency</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--accent-warning)' }}>{systemHealth.avg_endpoint_latency_ms} ms</div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading skill diagnostics...</div>
              )}
            </div>

            {/* Cloud Status + Security */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', color: 'var(--secondary)' }}>☁️ Cloud & Deployment (Skill 8)</h3>
                {cloudStatus ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Build Version</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{cloudStatus.build_version}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Environment</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 10px', borderRadius: '10px' }}>{cloudStatus.environment.toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cluster Health</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>● {cloudStatus.cluster_health}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '4px' }}>
                      <div style={{ textAlign: 'center', background: 'rgba(99,102,241,0.06)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>{cloudStatus.autoscaling?.current_replicas}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Replicas</div>
                      </div>
                      <div style={{ textAlign: 'center', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#f59e0b' }}>{cloudStatus.autoscaling?.cpu_utilization_pct}%</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CPU</div>
                      </div>
                      <div style={{ textAlign: 'center', background: 'rgba(217,70,239,0.06)', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>{cloudStatus.autoscaling?.memory_utilization_pct}%</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Memory</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>CI/CD Pipeline: <span style={{ color: '#10b981', fontWeight: '700' }}>{cloudStatus.cicd?.pipeline_status}</span> — Last deployed: {cloudStatus.cicd?.last_deployed ? new Date(cloudStatus.cicd.last_deployed).toLocaleString() : '—'}</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px' }}>Loading cloud status...</div>
                )}
              </div>

              <div className="glass-panel" style={{ padding: '28px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--accent-warning)' }}>🔐 Security & Compliance</h3>
                {systemHealth?.security && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(systemHealth.security).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>✓ {val}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={fetchSystemDiagnostics} className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', padding: '8px', fontSize: '13px' }}>🔄 Refresh Diagnostics</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Reset Modal ─────────────────────────────────────────── */}
      {showResetModal && (
        <div className="modal-overlay" onClick={e => { if (e.target.className === 'modal-overlay') setShowResetModal(false); }}>
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Reset Password</h2>
              </div>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={handlePasswordReset}>
              <div className="modal-body" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>Registered Email Address</label>
                  <input type="email" className="modal-input" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="user@example.com" required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>New Password</label>
                  <input type="password" className="modal-input" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} placeholder="Enter new password" required minLength={6} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowResetModal(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
                <button type="submit" className="btn" disabled={loading} style={{ padding: '8px 20px', fontSize: '13px' }}>{loading ? '🔄 Resetting...' : '🔒 Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Screen Overlay Post Preview Modal ────────────────────────────── */}
      {previewDraft && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') closePreviewModal(); }}>
          <div className="modal-content">

            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>👁️</span>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                    {isEditingPreview ? 'Edit Social Media Post' : 'Post Screen Preview'}
                  </h2>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    Draft #{previewDraft.id} • Status: {previewDraft.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!isEditingPreview && (
                  <button
                    onClick={() => setIsEditingPreview(true)}
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    ✏️ Edit Post
                  </button>
                )}
                <button
                  onClick={closePreviewModal}
                  style={{
                    background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
                    fontSize: '18px', width: '32px', height: '32px', borderRadius: '50%',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {isEditingPreview ? (
                /* EDIT FORM MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>Post Title</label>
                    <input
                      type="text"
                      className="modal-input"
                      value={editForm.title}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Post Title"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>Post Caption</label>
                    <textarea
                      className="modal-textarea"
                      rows={5}
                      value={editForm.caption}
                      onChange={e => setEditForm(prev => ({ ...prev, caption: e.target.value }))}
                      placeholder="Post Caption"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>Hashtags</label>
                    <input
                      type="text"
                      className="modal-input"
                      value={editForm.hashtags}
                      onChange={e => setEditForm(prev => ({ ...prev, hashtags: e.target.value }))}
                      placeholder="#hashtag1 #hashtag2"
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>Description & Metadata</label>
                    <textarea
                      className="modal-textarea"
                      rows={4}
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed post description"
                    />
                  </div>
                </div>
              ) : (
                /* DISPLAY / PREVIEW MODE */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Image + Title Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: previewDraft.image_url ? '240px 1fr' : '1fr', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
                    {previewDraft.image_url && (
                      <img
                        src={`${API_BASE}${previewDraft.image_url}${imageTimestamps[previewDraft.id] ? '?t=' + imageTimestamps[previewDraft.id] : ''}`}
                        alt={previewDraft.title}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                        {previewDraft.title}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {(previewDraft.hashtags || '').split(' ').filter(Boolean).map((tag, i) => (
                          <span key={i} style={{ background: 'rgba(217,70,239,0.1)', color: 'var(--secondary)', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontFamily: 'monospace' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Platform Previews Bar */}
                  {(() => {
                    const meta = parseDraftMeta(previewDraft.description);
                    const platforms = Object.keys(meta.platformPreviews).length > 0
                      ? Object.keys(meta.platformPreviews)
                      : ALL_PLATFORMS;
                    const activeP = platforms.includes(modalPlatformTab) ? modalPlatformTab : platforms[0];

                    return (
                      <div style={{ border: '1px solid var(--border-glass)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)' }}>
                          {platforms.map(p => (
                            <button
                              key={p}
                              onClick={() => setModalPlatformTab(p)}
                              style={{
                                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: '700',
                                color: activeP === p ? platformColor(p) : 'var(--text-muted)',
                                borderBottom: activeP === p ? `2px solid ${platformColor(p)}` : '2px solid transparent'
                              }}
                            >
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{platformIcon(p, 14)} {p.toUpperCase()} PREVIEW</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ padding: '18px', background: 'rgba(0,0,0,0.15)', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                          {meta.platformPreviews[activeP] || previewDraft.caption}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Caption */}
                  <div style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: '12px', padding: '18px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>📝 Full Post Caption</span>
                    <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                      {previewDraft.caption}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer & Admin Controls */}
            {user?.role === 'admin' && previewDraft.status === 'Under Review' && !isEditingPreview && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase' }}>AI Improvement Directive</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>— type adjustments and AI will regenerate copy and assets</span>
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <textarea
                    value={improvementTexts[previewDraft.id] || ''}
                    onChange={e => setImprovementTexts(prev => ({ ...prev, [previewDraft.id]: e.target.value }))}
                    placeholder="e.g. Make the caption more urgent and emphasize the deadline."
                    rows={2}
                    style={{ flex: 1, padding: '12px 16px', fontSize: '13px', resize: 'vertical', lineHeight: '1.5', borderRadius: '8px', minHeight: '60px', background: 'var(--bg-primary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => handleImprove(previewDraft.id)}
                      disabled={!(improvementTexts[previewDraft.id] || '').trim() || improvingDrafts[previewDraft.id]}
                      className="btn btn-secondary"
                      style={{ padding: '10px 18px', fontSize: '13px', whiteSpace: 'nowrap', minWidth: '160px' }}
                    >
                      {improvingDrafts[previewDraft.id] ? 'Improving...' : 'Apply Improvement'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-footer">
              {isEditingPreview ? (
                <>
                  <button onClick={() => setIsEditingPreview(false)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button onClick={handleSavePreviewContent} disabled={savingPreview} className="btn" style={{ padding: '8px 20px', fontSize: '13px' }}>
                    {savingPreview ? '💾 Saving...' : '💾 Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsEditingPreview(true)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    ✏️ Edit Post
                  </button>
                  {user?.role === 'admin' && previewDraft.status !== 'Published' && (
                    <button
                      onClick={() => { handlePublishDraft(previewDraft.id); }}
                      className="btn btn-primary"
                      style={{ padding: '8px 20px', fontSize: '13px' }}
                    >
                      🚀 Approve & Publish Now
                    </button>
                  )}
                  <button onClick={closePreviewModal} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Close
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
