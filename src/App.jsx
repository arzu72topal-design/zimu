import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "./db.js";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logOut,
  onAuthChange,
} from "./firebase.js";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  scheduleEventReminders,
  scheduleTaskReminders,
  clearAllReminders,
} from "./notifications.js";

/* ── i18n ── */
import { i18n, TRANSLATIONS } from "./i18n";
import { TABS_KEYS } from "./constants";

/* ── Hooks ── */
import { useIsMobile } from "./hooks/useIsMobile";

/* ── Components ── */
import { Toast } from "./components/ui/Toast";
import { VoiceCommand } from "./components/VoiceCommand";
import Dashboard from "./components/Dashboard";
import TasksHub from "./components/TasksHub";
import Projects from "./components/Projects";
import Settings from "./components/Settings";
import LoginScreen from "./components/LoginScreen";
import Projelerim from "./components/Projelerim";
import NebulaBackground, { NEBULA_KEYFRAMES } from "./components/NebulaBackground";

/* ── Global Styles ── */
const GLOBAL_CSS = `
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
  @keyframes checkPop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
  @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
  @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
  @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
  @keyframes pageFadeIn { from { opacity:0 } to { opacity:1 } }
  @keyframes slideInRight { from { opacity:0 } to { opacity:1 } }
  @keyframes slideOutRight { from { opacity:1 } to { opacity:0 } }
  @keyframes cardStagger { from { opacity:0; transform:translateY(18px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
  .stagger-1 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .05s both }
  .stagger-2 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .1s both }
  .stagger-3 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .15s both }
  .stagger-4 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .2s both }
  .stagger-5 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .25s both }
  .stagger-6 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .3s both }
  .page-enter { animation: pageFadeIn .28s cubic-bezier(.22,1,.36,1) both }
  .room-enter { animation: slideInRight .3s cubic-bezier(.22,1,.36,1) both }
  .touch-card {
    transition: transform .15s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;
    cursor: pointer; -webkit-user-select: none; user-select: none;
  }
  .touch-card:active { transform: scale(0.97) !important; }
  .back-btn {
    background: rgba(255,255,255,0.05); backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255,255,255,0.1);
    color: #ccc; width: 36px; height: 36px; border-radius: 10px;
    font-size: 16px; cursor: pointer; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; transition: background .15s, transform .1s;
  }
  .back-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.15); }
  @keyframes modalOverlayIn { from { opacity:0 } to { opacity:1 } }
  @keyframes modalSlideUp { from { transform:translateY(100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
  @keyframes voiceWave { from { height:8px } to { height:32px } }
  .nav-item { transition: all .2s cubic-bezier(.22,1,.36,1); }
  .nav-item:active { transform: scale(0.88); }
  .task-check-done { animation: checkPop .3s ease; }
  * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12);border-radius:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
  html, body { margin:0; padding:0; overscroll-behavior:none; background:#1C1C2E; overflow:auto; height:auto; }
  #root { height:auto; }
  select option { background:#252540; color:#F9FAFB; }
  @media(display-mode:standalone){
    html, body { background:#1C1C2E; overflow:auto; height:auto; }
    #root { height:auto; }
    body { padding-top: env(safe-area-inset-top); }
  }
`;

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [pendingRoom, setPendingRoom] = useState(null);
  const [pendingSubTab, setPendingSubTab] = useState(null);
  const [data, setData] = useState(null);

  const goTo = useCallback((tabId, roomOrSubTab) => {
    if (tabId === "lifestyle") {
      setPendingRoom(roomOrSubTab || null);
      setPendingSubTab(null);
    } else if (tabId === "tasks" && roomOrSubTab) {
      setPendingSubTab(roomOrSubTab);
      setPendingRoom(null);
    } else {
      setPendingRoom(null);
      setPendingSubTab(null);
    }
    setTab(tabId);
    setTimeout(() => { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }, 50);
  }, []);

  const [loading, setLoading] = useState(true);
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(undefined);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isMobile = useIsMobile();
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const scrollRef = useRef(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) { setUser(firebaseUser); }
      else {
        const skipped = localStorage.getItem('zimu-skip-login');
        if (skipped) { setUser(null); } else { setUser(undefined); setLoading(false); }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load data when user is determined
  useEffect(() => {
    if (user === undefined) return;
    const userId = user?.uid || null;
    loadData(userId).then(d => { setData(d); setLoading(false); });
  }, [user]);

  // Splash screen
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1500); return () => clearTimeout(t); }, []);

  // Firebase fallback
  useEffect(() => { const t = setTimeout(() => setLoading(false), 4000); return () => clearTimeout(t); }, []);

  // Schedule notifications
  useEffect(() => {
    if (!data) return;
    if (getNotificationPermission() !== "granted") return;
    const s = data.settings || {};
    if (s.quietEnabled) {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const start = s.quietStart || "23:00";
      const end = s.quietEnd || "08:00";
      const inQuiet = start < end ? (hhmm >= start && hhmm < end) : (hhmm >= start || hhmm < end);
      if (inQuiet) return;
    }
    if (s.eventNotif !== false) scheduleEventReminders(data.events, s.reminderMinutes || 15);
    if (s.taskNotif !== false) scheduleTaskReminders(data.tasks);
  }, [data?.events, data?.tasks, data?.settings]);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const t = setTimeout(() => {
      window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 100);
    return () => clearTimeout(t);
  }, [tab]);

  // Scroll listeners
  useEffect(() => {
    if (!isMobile) return;
    const h = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, [isMobile]);

  const handleScroll = useCallback((e) => {
    const top = e?.target?.scrollTop ?? window.scrollY;
    setShowScrollTop(top > 300);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, handleScroll]);

  const update = useCallback(async (newData) => {
    setData(newData);
    const userId = user?.uid || null;
    await saveData(newData, userId);
  }, [user]);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2000);
  };

  const handleLogin = (firebaseUser) => {
    if (firebaseUser === null) { localStorage.setItem('zimu-skip-login', 'true'); setUser(null); }
  };

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem('zimu-skip-login');
    setUser(undefined); setData(null);
  };

  const T = (key) => i18n(key, data);
  const allTabs = [...TABS_KEYS.map(tb => ({ ...tb, label: T(tb.labelKey) })), { id: "projelerim", label: "Projelerim", icon: "📂" }, { id: "settings", label: T("settings"), icon: "⚙" }];

  // Show login screen
  if (!splash && user === undefined && !loading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Splash / loading
  if (splash || loading || !data) return (
    <NebulaBackground style={{ cursor: "pointer", userSelect: "none", flexDirection: "column" }}
      onClick={() => {
        setSplash(false); setLoading(false);
        if (!data) {
          loadData(null).then(d => setData(d)).catch(() => {
            setData({ tasks: [], events: [], sports: [], projects: [], notes: [], foods: [], rooms: [], roomItems: {}, settings: {}, dailyThoughts: ["", "", ""], memories: { folders: [], items: [] } });
          });
        }
      }}>
      <style>{`${NEBULA_KEYFRAMES}\n@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", maxWidth: 400, padding: "0 40px", minHeight: "100dvh", margin: "0 auto", animation: "fadeIn .6s ease both" }}>
        <div style={{ fontSize: 72, fontWeight: 900, letterSpacing: -4, lineHeight: 1, background: "linear-gradient(135deg,#e0d5f5 0%,#a78bfa 30%,#6366f1 60%,#818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "zimuGlow 4s ease-in-out infinite", display: "inline-block", marginBottom: 16 }}>Zimu</div>
        <div style={{ height: 1, width: "60%", marginBottom: 20, margin: "0 auto 20px", background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.7),transparent)", animation: "lineExpand 1s ease .2s both" }} />
        <div style={{ fontSize: 17, fontStyle: "italic", color: "rgba(196,181,253,0.85)", letterSpacing: .4, lineHeight: 1.6, animation: "fadeInUp .8s ease .4s both" }}>Kendi destanını yaz.</div>
        <div style={{ fontSize: 14, fontStyle: "italic", color: "rgba(167,139,250,0.45)", letterSpacing: .3, marginTop: 4, animation: "fadeInUp .8s ease .55s both" }}>Write your own epic.</div>
      </div>
      <div style={{ position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center", fontSize: 13, color: "rgba(196,181,253,0.45)", letterSpacing: .5, animation: "tapBlink 2.5s ease-in-out infinite" }}>{T("tapToContinue")}</div>
    </NebulaBackground>
  );

  const content = () => {
    switch (tab) {
      case "dashboard": return <Dashboard data={data} setTab={setTab} goTo={goTo} update={update} />;
      case "tasks": return <TasksHub data={data} update={update} initialSubTab={pendingSubTab} onSubTabConsumed={() => setPendingSubTab(null)} />;
      case "lifestyle": return <Projects data={data} update={update} initialRoom={pendingRoom} onRoomConsumed={() => setPendingRoom(null)} />;
      case "projelerim": return <Projelerim />;
      case "settings": return <Settings data={data} update={update} onImport={d => { setData(d); showToast(T("dataImported")); }} user={user} onLogout={handleLogout} />;
    }
  };

  // Swipe navigation
  const tabOrder = allTabs.map(t => t.id);
  const handleTouchStart = (e) => { touchEnd.current = null; touchStart.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (Math.abs(distance) < 80) return;
    const ci = tabOrder.indexOf(tab);
    if (distance > 0 && ci < tabOrder.length - 1) setTab(tabOrder[ci + 1]);
    else if (distance < 0 && ci > 0) setTab(tabOrder[ci - 1]);
    touchStart.current = null; touchEnd.current = null;
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const NAV_HEIGHT = 64;
  const SAFE_BOTTOM = isMobile ? 20 : 0;
  const CONTENT_PAD_BOTTOM = isMobile ? NAV_HEIGHT + SAFE_BOTTOM + 30 : NAV_HEIGHT + 24;

  const phoneContent = (
    <div lang={T("locale").split("-")[0]} style={{ width: "100%", minHeight: isMobile ? "100dvh" : "100vh", background: "#1C1C2E", color: "#F9FAFB", fontFamily: "'SF Pro Display',-apple-system,'Segoe UI',sans-serif", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)", top: "-80px", left: "-60px", animation: "orb1 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.10) 0%,transparent 70%)", bottom: "20%", right: "-50px", animation: "orb2 15s ease-in-out infinite" }} />
        <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)", bottom: "-40px", left: "20%" }} />
      </div>
      <main ref={isMobile ? null : scrollRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onScroll={handleScroll}
        style={{ padding: `16px ${isMobile ? "20px" : "clamp(20px, 5vw, 60px)"} ${CONTENT_PAD_BOTTOM}px`, minHeight: isMobile ? "100dvh" : "100vh", maxWidth: isMobile ? undefined : 800, margin: isMobile ? undefined : "0 auto", touchAction: "pan-y" }}>
        <div key={tab} className="page-enter">{content()}</div>
      </main>

      {showScrollTop && (
        <button onClick={scrollToTop} aria-label="Scroll to top" style={{ position: "fixed", right: 16, bottom: NAV_HEIGHT + SAFE_BOTTOM + 70, width: 40, height: 40, borderRadius: "50%", background: "rgba(59,130,246,0.9)", color: "#fff", border: "none", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 999 }}>▲</button>
      )}

      {data && <VoiceCommand data={data} update={update} goTo={goTo} showToast={showToast} />}

      <nav aria-label="Main navigation" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(28,28,46,0.95)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "center", alignItems: "center", height: NAV_HEIGHT, paddingTop: 4, paddingBottom: isMobile ? "env(safe-area-inset-bottom, 8px)" : "6px", paddingLeft: 4, paddingRight: 4, zIndex: 1000 }}>
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "100%", maxWidth: isMobile ? undefined : 600 }}>
          {allTabs.map(t => (
            <button key={t.id} className="nav-item" onClick={() => setTab(t.id)} aria-current={tab === t.id ? "page" : undefined} aria-label={t.label} style={{
              background: tab === t.id ? "rgba(59,130,246,0.15)" : "none",
              boxShadow: tab === t.id ? "0 0 20px rgba(59,130,246,0.25)" : undefined,
              border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: isMobile ? 4 : 3, padding: isMobile ? "10px 6px" : "8px 12px", minWidth: isMobile ? 52 : 50, borderRadius: 14,
              color: tab === t.id ? "#60a5fa" : "#9CA3AF", flex: 1,
            }}>
              <span style={{ fontSize: isMobile ? 22 : 18, lineHeight: 1 }}>{t.icon}</span>
              <span style={{ fontSize: isMobile ? 11 : 10, fontWeight: tab === t.id ? 700 : 500, letterSpacing: -.2 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Toast {...toast} />
      {phoneContent}
    </>
  );
}
