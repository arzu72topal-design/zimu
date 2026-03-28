import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData, exportData, importData } from "./db.js";
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

/* ── Constants ── */
const TABS = [
  { id: "dashboard", label: "Ana Sayfa", icon: "⌂" },
  { id: "tasks", label: "Görevler", icon: "✓" },
  { id: "lifestyle", label: "Life Style", icon: "◈" },
];

const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
const SPORT_EMOJI = {"Koşu":"🏃","Yüzme":"🏊","Bisiklet":"🚴","Yoga":"🧘","Ağırlık":"🏋️","Yürüyüş":"🚶","Diğer":"⚡"};
// MET × 70kg × (duration/60) → kcal
const SPORT_KCAL_PER_MIN = {"Koşu":10,"Yüzme":7,"Bisiklet":7,"Yoga":3.3,"Ağırlık":5,"Yürüyüş":4.7,"Diğer":5};
const calcSportCal = (type, durationMin) => Math.round((SPORT_KCAL_PER_MIN[type]||5) * (+durationMin||0));
const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const PCOL = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7","#f97316","#14b8a6"];

const DEFAULT_ROOMS = [
  { id: "projects", name: "Projeler", icon: "📂", color: "#3b82f6", type: "project" },
  { id: "news", name: "Haberler", icon: "📰", color: "#ef4444", type: "news" },
  { id: "music", name: "Müziklerim", icon: "🎵", color: "#a855f7", type: "collection" },
  { id: "clothes", name: "Kıyafetlerim", icon: "👗", color: "#f97316", type: "collection" },
  { id: "memories", name: "Anılar", icon: "📸", color: "#22c55e", type: "collection" },
  { id: "healthcoach", name: "Sağlık Koçu", icon: "♥", color: "#14b8a6", type: "health" },
];

const COMMON_FOODS = {
  "Çay (şekerli)": 30, "Çay (şekersiz)": 2, "Türk kahvesi": 15, "Süt": 60,
  "Ekmek (1 dilim)": 80, "Yumurta (haşlanmış)": 78, "Yumurta (sahanda)": 120,
  "Peynir (1 dilim)": 80, "Zeytin (5 adet)": 40, "Bal (1 yk)": 64, "Tereyağı (1 yk)": 100,
  "Pilav (1 porsiyon)": 200, "Makarna (1 porsiyon)": 220, "Tavuk göğsü": 165,
  "Kıyma (100g)": 250, "Köfte (4 adet)": 300, "Balık (ızgara)": 200,
  "Salata": 50, "Çorba": 120, "Mercimek çorbası": 150, "Kuru fasulye": 200,
  "Dürüm": 450, "Lahmacun": 200, "Pizza (1 dilim)": 270, "Hamburger": 500,
  "Elma": 52, "Muz": 90, "Portakal": 47, "Üzüm (1 avuç)": 60,
  "Yoğurt": 60, "Ayran": 40, "Kola": 140, "Meyve suyu": 120,
  "Baklava (1 dilim)": 250, "Sütlaç": 200, "Dondurma (1 top)": 140,
  "Ceviz (5 adet)": 130, "Badem (10 adet)": 70, "Çikolata (1 bar)": 230,
};
const MN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DN = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

const today = () => new Date().toISOString().split("T")[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* ── MascotImage: kareli kağıt arka planını canvas ile kaldırır ── */
function MascotImage({ src, style }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // Beyaz ve krem kağıt rengi
        const isWhitePaper = r > 180 && g > 175 && b > 165;
        // Kareli kağıt mavi çizgileri (açık mavi/gri tonlar)
        const isGridLine = r > 160 && g > 175 && b > 185 && b > r;
        // Sarımtırak kağıt tonu
        const isYellowish = r > 200 && g > 190 && b > 150 && r > b + 30;
        if (isWhitePaper || isGridLine || isYellowish) {
          // Hafif yumuşatma — tam şeffaf yerine kontura göre
          const brightness = (r + g + b) / 3;
          const alpha = Math.max(0, Math.min(255, (255 - brightness) * 2.5));
          d[i+3] = Math.round(alpha);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setReady(true);
    };
    img.onerror = () => setReady(true); // yüklenemezse de göster
    img.src = src;
  }, [src]);
  return <canvas ref={canvasRef} style={{...style, opacity: ready ? 1 : 0, transition:"opacity .3s"}} />;
}

/* ── Hooks ── */
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

/* ── Styles ── */
const inp = {
  width:"100%",
  background:"rgba(255,255,255,0.06)",
  backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:12,padding:"12px 14px",color:"#e0e0e0",fontSize:15,
  marginBottom:10,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",
};
const btnPrimary = {
  width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",
  color:"#fff",border:"none",borderRadius:12,
  padding:"14px",cursor:"pointer",fontSize:15,fontWeight:600,marginTop:4,
  boxShadow:"0 4px 20px rgba(99,102,241,0.4)",
  transition:"box-shadow .2s, transform .1s",
};
const addBtnStyle = {
  background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,
  padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
};
const filterBtnStyle = (active) => ({
  background: active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
  color: active ? "#3b82f6" : "#888",
  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
  padding:"7px 14px",borderRadius:20,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
  fontWeight: active ? 600 : 400,
});
const cardStyle = {
  background:"rgba(255,255,255,0.04)",
  backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
  borderRadius:16,padding:"14px 16px",marginBottom:8,
  border:"1px solid rgba(255,255,255,0.07)",
  boxShadow:"0 4px 24px rgba(0,0,0,0.3)",
};
/* Glow card helper: cardStyle + colored glow border */
const glowCard = (color) => ({
  ...cardStyle,
  border:`1px solid ${color}40`,
  boxShadow:`0 0 20px ${color}22, 0 4px 24px rgba(0,0,0,0.35), inset 0 0 20px ${color}08`,
});
const delBtnStyle = {
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.08)",
  color:"#666",fontSize:14,
  cursor:"pointer",padding:0,width:32,height:32,borderRadius:8,
  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
  backdropFilter:"blur(4px)",
};
const sectionHeader = {
  display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
};
const checkBtnStyle = (done) => ({
  width:28,height:28,borderRadius:8,border:`2px solid ${done?"#22c55e":"rgba(255,255,255,0.15)"}`,
  background:done?"#22c55e":"transparent",color:"#fff",cursor:"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
  flexShrink:0,padding:0,transition:"all .2s",
  animation:done?"checkPop .3s ease":undefined,
});

/* ── Modal ── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:9999,
      padding:0,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"rgba(255,255,255,0.04)",width:"100%",maxWidth:480,
        maxHeight:"85dvh",
        borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column",
        animation:"slideUp .25s ease",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",
          flexShrink:0,
        }}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.08)",border:"none",color:"#aaa",
            width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        </div>
        <div style={{
          padding:"16px 20px 32px",
          overflow:"auto",
          WebkitOverflowScrolling:"touch",
          flex:1,
        }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
      background:"#22c55e",color:"#fff",padding:"10px 20px",borderRadius:12,
      fontSize:14,fontWeight:600,zIndex:10000,animation:"slideDown .3s ease",
      boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
    }}>{message}</div>
  );
}


/* ── Shared UI helpers ── */

function StickyHeader({ children }) {
  return (
    <div style={{
      position:"sticky",top:0,zIndex:50,
      background:"rgba(6,6,17,0.85)",
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      marginLeft:-16,marginRight:-16,
      padding:"14px 16px 12px",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
      marginBottom:14,
    }}>
      {children}
    </div>
  );
}

function GroupLabel({ label, count, color }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:6,
      fontSize:11,fontWeight:700,color:"#666",
      textTransform:"uppercase",letterSpacing:".07em",
      marginBottom:8,marginTop:4,
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
      {count != null && <span style={{opacity:.6}}>({count})</span>}
    </div>
  );
}

function FAB({ onClick, color="#3b82f6" }) {
  return (
    <button
      onClick={onClick}
      style={{
        position:"fixed",right:20,bottom:100,
        width:56,height:56,borderRadius:"50%",
        background:`linear-gradient(135deg,${color}dd,${color}88)`,color:"#fff",border:`1px solid ${color}55`,
        fontSize:28,fontWeight:300,lineHeight:1,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 0 1px ${color}30, 0 4px 24px ${color}66, 0 0 50px ${color}33`,
        zIndex:900,transition:"transform .1s, box-shadow .2s",
      }}
      onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.93)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
    >+</button>
  );
}

/* ═══════════ DASHBOARD ═══════════ */
function Dashboard({ data, setTab, update }) {
  const t = today();
  const foods = data.foods || [];
  const rooms = data.rooms || [...DEFAULT_ROOMS];
  const roomItems = data.roomItems || {};

  const pending = data.tasks.filter(x=>!x.done).length;
  const done = data.tasks.filter(x=>x.done).length;
  const overdue = data.tasks.filter(x=>!x.done && x.dueDate && x.dueDate < t).length;
  const urgentTasks = data.tasks
    .filter(x=>!x.done)
    .sort((a,b)=>{const po={high:0,medium:1,low:2};return (po[a.priority]||1)-(po[b.priority]||1);})
    .slice(0,3);

  const todayEv = data.events.filter(e=>e.date===t);
  const upcoming = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  const wkSport = data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const wkMin = wkSport.reduce((a,s)=>a+(s.duration||0),0);
  const wkBurned = wkSport.reduce((a,s)=>a+(s.calories||0),0);
  const todayFoods = foods.filter(f=>f.date===t);
  const todayCalIn = todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todayCalOut = data.sports.filter(s=>s.date===t).reduce((a,s)=>a+(s.calories||0),0);
  const activeProjects = data.projects.filter(p=>p.status!=="Tamamlandı").length;

  const hour = new Date().getHours();
  const greeting = hour<12 ? "Günaydın" : hour<18 ? "İyi günler" : "İyi akşamlar";

  // Daily thoughts (3 slots)
  const thoughts = data.dailyThoughts || ["","",""];
  const updateThought = (i, val) => {
    const next = [...thoughts];
    next[i] = val;
    update({ ...data, dailyThoughts: next });
  };

  // Live news headlines
  const [headlines, setHeadlines] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function fetchHeadlines() {
      try {
        const url = "https://www.bbc.com/turkce/index.xml";
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
          || await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
        if (!res || !res.ok) return;
        const text = res.url?.includes("allorigins") ? JSON.parse(await res.text()).contents : await res.text();
        const titles = [...text.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>|<title>([^<]+)<\/title>/g)]
          .slice(1, 6)
          .map(m => (m[1] || m[2] || "").trim())
          .filter(t => t.length > 5);
        if (!cancelled) setHeadlines(titles);
      } catch {}
    }
    fetchHeadlines();
    return () => { cancelled = true; };
  }, []);

  const musicItems = (data.roomItems || {})["music"] || [];

  const scheduleItems = [
    ...urgentTasks.slice(0,2).map(tk=>({ type:"task", id:tk.id, title:tk.title, sub:PRIORITIES[tk.priority]+" öncelik", color:PCOL[tk.priority] })),
    ...upcoming.slice(0,2).map(e=>({ type:"event", id:e.id, title:e.title, sub:e.time||e.date.slice(5), color:e.color||"#a855f7" })),
  ].slice(0,4);

  return (
    <div>
      {/* HERO - Greeting */}
      <div style={{marginBottom:14}}>
        <h2 style={{margin:0,fontSize:23,fontWeight:800,letterSpacing:-.5}}>{greeting}! 👋</h2>
        <p style={{margin:"4px 0 0",opacity:.45,fontSize:13}}>
          {new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}
        </p>
      </div>

      {/* 3 AKILLI KART */}
      {/* Kart 1: Görev + Etkinlik + Proje */}
      <div onClick={()=>setTab("tasks")} style={{
        ...glowCard("#3b82f6"),cursor:"pointer",marginBottom:10,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700}}>Görev Durumu</div>
            <div style={{fontSize:11,opacity:.4}}>Bugünün özeti</div>
          </div>
          <span style={{fontSize:14,opacity:.2}}>▶</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{background:"rgba(59,130,246,0.1)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#3b82f6"}}>{pending}</div>
            <div style={{fontSize:10,color:"#3b82f6",opacity:.7,marginTop:2}}>Bekleyen</div>
          </div>
          <div style={{background:"rgba(168,85,247,0.1)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#a855f7"}}>{todayEv.length}</div>
            <div style={{fontSize:10,color:"#a855f7",opacity:.7,marginTop:2}}>Etkinlik</div>
          </div>
          <div style={{background:"rgba(34,197,94,0.1)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:800,color:"#22c55e"}}>{activeProjects}</div>
            <div style={{fontSize:10,color:"#22c55e",opacity:.7,marginTop:2}}>Proje</div>
          </div>
        </div>
      </div>

      {/* Kart 2: Kalori + Yemek/Spor butonları */}
      <div style={{...glowCard("#f97316"),marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(249,115,22,0.15)",border:"1px solid rgba(249,115,22,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#f97316" strokeWidth="2" fill="none"/><path d="M12 6v6l4 2" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700}}>Kalori Takibi</div>
            <div style={{fontSize:11,opacity:.4}}>Bugün: {todayCalIn} kcal alındı · {todayCalOut} kcal yakıldı</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <div style={{flex:1,height:8,background:"rgba(255,255,255,0.08)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",borderRadius:4,width:`${Math.min(100,Math.round(todayCalIn/2000*100))}%`,background:"linear-gradient(90deg,#f97316,#ef4444)",transition:"width .5s"}}/>
          </div>
          <span style={{fontSize:11,color:"#f97316",fontWeight:600,flexShrink:0}}>{Math.round(todayCalIn/2000*100)}%</span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setTab("lifestyle")} style={{
            flex:1,background:"rgba(249,115,22,0.12)",color:"#f97316",border:"1px solid rgba(249,115,22,0.3)",
            borderRadius:10,padding:"9px 4px",fontSize:12,fontWeight:700,cursor:"pointer",
          }}>+ Yemek</button>
          <button onClick={()=>setTab("lifestyle")} style={{
            flex:1,background:"rgba(34,197,94,0.12)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",
            borderRadius:10,padding:"9px 4px",fontSize:12,fontWeight:700,cursor:"pointer",
          }}>+ Spor</button>
        </div>
      </div>

      {/* Kart 3: Stil Motivasyon */}
      <div onClick={()=>setTab("lifestyle")} style={{
        ...glowCard("#a855f7"),cursor:"pointer",marginBottom:14,
        display:"flex",alignItems:"center",gap:14,
      }}>
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(168,85,247,0.15)",border:"1px solid rgba(168,85,247,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke="#a855f7" strokeWidth="1.5" fill="rgba(168,85,247,0.15)" strokeLinejoin="round"/></svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#c4b5fd"}}>Bugün harika görüneceksin!</div>
          <div style={{fontSize:11,opacity:.45,marginTop:3}}>Hava durumuna göre stil önerilerin hazır</div>
        </div>
        <span style={{fontSize:14,opacity:.2}}>▶</span>
      </div>

      {overdue>0&&(
        <div onClick={()=>setTab("tasks")} style={{
          background:"rgba(239,68,68,0.1)",backdropFilter:"blur(8px)",border:"1px solid rgba(239,68,68,0.3)",
          borderRadius:14,padding:"12px 14px",marginBottom:12,
          display:"flex",alignItems:"center",gap:10,cursor:"pointer",
          boxShadow:"0 0 20px rgba(239,68,68,0.1)",
        }}>
          <span style={{fontSize:20}}>🚨</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>{overdue} gecikmiş görev!</div>
            <div style={{fontSize:11,opacity:.5}}>Hemen kontrol et</div>
          </div>
          <span style={{fontSize:14,opacity:.3}}>▶</span>
        </div>
      )}

      {scheduleItems.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Bugünün Programı</div>
          {scheduleItems.map(item=>(
            <div key={item.id} onClick={()=>setTab("tasks")} style={{
              ...cardStyle,padding:"13px 14px",marginBottom:6,
              display:"flex",alignItems:"center",gap:12,cursor:"pointer",minHeight:54,
              border:`1px solid ${item.color}25`,boxShadow:`0 0 16px ${item.color}10`,
            }}>
              <div style={{width:3,height:36,background:item.color,borderRadius:2,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                <div style={{fontSize:11,opacity:.4,marginTop:2}}>{item.type==="task"?"Görev":"Etkinlik"} · {item.sub}</div>
              </div>
              <span style={{fontSize:11,opacity:.2}}>▶</span>
            </div>
          ))}
        </div>
      )}

      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Bu Hafta</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[
            {val:wkSport.length,label:"Antrenman",color:"#3b82f6"},
            {val:wkBurned,label:"kcal yakıldı",color:"#ef4444"},
            {val:done,label:"Görev bitti",color:"#22c55e"},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"12px 10px",textAlign:"center",boxShadow:"0 4px 16px rgba(0,0,0,0.2)"}}>
              <div style={{fontSize:20,fontWeight:800,color:s.color,letterSpacing:-.5}}>{s.val}</div>
              <div style={{fontSize:10,opacity:.4,marginTop:3,lineHeight:1.2}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KAFAMDAKILER ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>☁️ Bugün Kafamı Kurcalayanlar</div>
        <div style={{background:"rgba(255,255,255,0.04)",backdropFilter:"blur(12px)",borderRadius:16,padding:"12px 14px",border:"1px solid rgba(20,184,166,0.2)",boxShadow:"0 0 20px rgba(20,184,166,0.08)"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:i<2?8:0}}>
              <span style={{fontSize:13,opacity:.35,flexShrink:0,fontWeight:700}}>{i+1}.</span>
              <input
                value={thoughts[i]||""}
                onChange={e=>updateThought(i,e.target.value)}
                placeholder={["Bugün en çok düşündüğüm şey...","Kafamı karıştıran bir şey...","Çözmek istediğim bir sorun..."][i]}
                style={{
                  flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",
                  borderRadius:10,padding:"9px 12px",color:"#e0e0e0",fontSize:13,outline:"none",
                  WebkitAppearance:"none",boxSizing:"border-box",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ HABERLER ── */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#ef4444" strokeWidth="2" fill="none"/><line x1="9" y1="13" x2="27" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="22" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity=".6"/></svg>
            BBC Türkçe Haberler
          </div>
          <button onClick={()=>setTab("lifestyle")} style={{background:"none",border:"none",color:"#ef4444",fontSize:12,cursor:"pointer",fontWeight:600}}>Tümü ▶</button>
        </div>
        <div style={{background:"rgba(239,68,68,0.06)",backdropFilter:"blur(12px)",borderRadius:16,padding:"12px 14px",border:"1px solid rgba(239,68,68,0.18)",boxShadow:"0 0 20px rgba(239,68,68,0.06)"}}>
          {headlines.length === 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:10,opacity:.5}}>
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none" style={{animation:"pulse 1.5s infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" stroke="#ef4444" strokeWidth="1.5" fill="none"/><path d="M14 18 A4 4 0 0 0 22 18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/><line x1="18" y1="5" x2="18" y2="2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="25" y1="7" x2="27" y2="5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="11" y1="7" x2="9" y2="5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{fontSize:13}}>Haberler yükleniyor...</span>
            </div>
          ) : headlines.slice(0,4).map((title,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,
              paddingBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              marginBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              borderBottom: i < headlines.slice(0,4).length-1 ? "1px solid rgba(239,68,68,0.1)" : "none",
            }}>
              <span style={{fontSize:10,color:"#ef4444",fontWeight:800,marginTop:3,flexShrink:0,minWidth:16}}>{i+1}</span>
              <span style={{fontSize:13,lineHeight:1.4,opacity:.85}}>{title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ MÜZİK ── */}
      <div style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><circle cx="12" cy="28" r="5" stroke="#a855f7" strokeWidth="2" fill="none"/><circle cx="28" cy="24" r="5" stroke="#a855f7" strokeWidth="2" fill="none"/><path d="M17 28 L17 8 L33 4 L33 24" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="8" x2="33" y2="4" stroke="#a855f7" strokeWidth="1.5"/></svg>
            Müzik Koleksiyonu
          </div>
          <button onClick={()=>setTab("lifestyle")} style={{background:"none",border:"none",color:"#a855f7",fontSize:12,cursor:"pointer",fontWeight:600}}>Tümü ▶</button>
        </div>
        {musicItems.length === 0 ? (
          <div onClick={()=>setTab("lifestyle")} style={{
            background:"rgba(168,85,247,0.06)",border:"1px solid rgba(168,85,247,0.18)",borderRadius:16,
            padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,
          }}>
            <div style={{width:48,height:48,borderRadius:14,background:"rgba(168,85,247,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none"><path d="M6 18 C6 11 11 6 18 6 C25 6 30 11 30 18" stroke="#a855f7" strokeWidth="1.5" fill="none"/><rect x="4" y="17" width="6" height="10" rx="3" fill="#a855f7" opacity=".7"/><rect x="26" y="17" width="6" height="10" rx="3" fill="#a855f7" opacity=".7"/></svg>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#a855f7"}}>Müzik koleksiyonu boş</div>
              <div style={{fontSize:12,opacity:.45,marginTop:3}}>Tarzım → Müziklerim'e git ve ekle</div>
            </div>
            <span style={{marginLeft:"auto",opacity:.3,fontSize:16}}>▶</span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch"}}>
            {musicItems.slice(0,6).map((item,i)=>(
              <div key={item.id||i}
                onClick={()=>item.link&&window.open(item.link,"_blank")}
                style={{
                  background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.18)",borderRadius:14,
                  padding:"10px 12px",minWidth:120,maxWidth:140,flexShrink:0,cursor:"pointer",
                  boxShadow:"0 0 12px rgba(168,85,247,0.1)",
                }}>
                <div style={{width:44,height:44,borderRadius:10,background:item.albumArt?"#000":"rgba(168,85,247,0.2)",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  {item.albumArt
                    ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <svg width="20" height="20" viewBox="0 0 36 36" fill="none"><circle cx="11" cy="27" r="5" stroke="#a855f7" strokeWidth="1.5" fill="rgba(168,85,247,0.2)"/><path d="M16 27 L16 9 L30 5 L30 23" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title||"Parça"}</div>
                {item.artist&&<div style={{fontSize:10,opacity:.5,marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.artist}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {data.notes.length>0&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.4,textTransform:"uppercase",letterSpacing:".07em"}}>Son Notlar</div>
            <button onClick={()=>setTab("tasks")} style={{background:"none",border:"none",color:"#3b82f6",fontSize:12,cursor:"pointer",fontWeight:600}}>Tümü ▶</button>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
            {data.notes.slice(0,5).map(n=>(
              <div key={n.id} onClick={()=>setTab("tasks")} style={{
                background:"rgba(255,255,255,0.04)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"10px 12px",
                minWidth:130,maxWidth:160,cursor:"pointer",flexShrink:0,
                borderTop:`3px solid ${n.color||"#14b8a6"}`,
              }}>
                <div style={{fontSize:12,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
                {n.content&&<div style={{fontSize:11,opacity:.4,marginTop:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.4}}>{n.content}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
function Tasks({ data, update }) {
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState("all");
  const [editingId,setEditingId]=useState(null);
  const [detail,setDetail]=useState(null);
  const emptyForm = {title:"",priority:"medium",dueDate:"",category:"",description:""};
  const [form,setForm]=useState(emptyForm);

  const openNew=()=>{setEditingId(null);setForm(emptyForm);setModal(true);};
  const openEdit=(task)=>{
    setEditingId(task.id);
    setForm({title:task.title,priority:task.priority,dueDate:task.dueDate||"",category:task.category||"",description:task.description||""});
    setModal(true);setDetail(null);
  };

  const save=()=>{
    if(!form.title.trim())return;
    if(editingId){
      update({...data,tasks:data.tasks.map(t=>t.id===editingId?{...t,...form}:t)});
    } else {
      update({...data,tasks:[{id:uid(),...form,done:false,createdAt:today()},...data.tasks]});
    }
    setModal(false);setForm(emptyForm);setEditingId(null);
  };
  const toggle=id=>update({...data,tasks:data.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});
  const del=id=>{update({...data,tasks:data.tasks.filter(t=>t.id!==id)});setDetail(null);};

  const t = today();
  const tomorrow = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
  const nextWeek = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };
  const nextMonth = ()=>{ const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split("T")[0]; };
  const weekEnd = nextWeek();

  const quickDates = [
    {label:"Bugün",val:t,icon:"📌"},
    {label:"Yarın",val:tomorrow(),icon:"⏭"},
    {label:"1 Hafta",val:weekEnd,icon:"📅"},
    {label:"1 Ay",val:nextMonth(),icon:"🗓"},
  ];

  const formatDate = (d) => {
    if(!d) return "";
    if(d===t) return "Bugün";
    if(d===tomorrow()) return "Yarın";
    return new Date(d).toLocaleDateString("tr-TR",{day:"numeric",month:"short"});
  };

  const pending = data.tasks.filter(x=>!x.done).length;

  const list = data.tasks.filter(task=>{
    if(filter==="done")return task.done;
    if(filter==="pending")return !task.done;
    if(filter==="high")return task.priority==="high"&&!task.done;
    if(filter==="overdue")return !task.done && task.dueDate && task.dueDate < t;
    return true;
  });

  const groups = filter==="all" ? [
    {key:"overdue",label:"Gecikmiş",color:"#ef4444",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate<t)},
    {key:"today",label:"Bugün",color:"#3b82f6",tasks:list.filter(x=>!x.done&&x.dueDate===t)},
    {key:"week",label:"Bu Hafta",color:"#a855f7",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate>t&&x.dueDate<=weekEnd)},
    {key:"pending",label:"Bekleyen",color:"#888",tasks:list.filter(x=>!x.done&&(!x.dueDate||x.dueDate>weekEnd))},
    {key:"done",label:"Tamamlanan",color:"#22c55e",tasks:list.filter(x=>x.done)},
  ].filter(g=>g.tasks.length>0) : null;

  const TaskCard = ({ task }) => (
    <div style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52,opacity:task.done?.5:1,
      border:`1px solid ${task.done?"rgba(34,197,94,0.15)":PCOL[task.priority]+"20"}`,
      boxShadow:task.done?"none":`0 0 16px ${PCOL[task.priority]}12`,
    }}>
      <button onClick={()=>toggle(task.id)} style={checkBtnStyle(task.done)}>{task.done&&"✓"}</button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setDetail(detail===task.id?null:task.id)}>
        <div style={{fontSize:15,fontWeight:600,textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
          {task.priority&&<span style={{background:`${PCOL[task.priority]}20`,color:PCOL[task.priority],padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600}}>{PRIORITIES[task.priority]}</span>}
          {task.category&&<span style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontSize:11}}>{task.category}</span>}
          {task.dueDate&&<span style={{fontSize:11,color:!task.done&&task.dueDate<t?"#ef4444":"#666"}}>{formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <button onClick={()=>del(task.id)} style={delBtnStyle}>✕</button>
    </div>
  );

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Görevler</h3>
          <span style={{fontSize:12,opacity:.4,fontWeight:500}}>{pending} bekliyor</span>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
          {[["all","Tümü"],["pending","Bekleyen"],["done","Bitti"],["high","Öncelikli"],["overdue","Gecikmiş"]].map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} style={filterBtnStyle(filter===k)}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {groups ? (
        groups.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Tüm görevler tamamlandı!</div>
              <div style={{fontSize:12,opacity:.25}}>+ ile yeni görev ekle</div>
            </div>
          )
          : groups.map(group=>(
            <div key={group.key} style={{marginBottom:16}}>
              <GroupLabel label={group.label} count={group.tasks.length} color={group.color}/>
              {group.tasks.map(task=><TaskCard key={task.id} task={task}/>)}
            </div>
          ))
      ) : (
        list.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Tüm görevler tamamlandı!</div>
              <div style={{fontSize:12,opacity:.25}}>+ ile yeni görev ekle</div>
            </div>
          )
          : list.map(task=><TaskCard key={task.id} task={task}/>)
      )}

      {detail && (() => {
        const task = data.tasks.find(tk=>tk.id===detail);
        if(!task) return null;
        return (
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:16,marginTop:8,border:"1px solid rgba(59,130,246,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:16,fontWeight:700}}>{task.title}</h4>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>openEdit(task)} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>Düzenle</button>
                <button onClick={()=>setDetail(null)} style={{background:"rgba(255,255,255,0.06)",color:"#888",border:"none",borderRadius:8,padding:"6px 10px",fontSize:14,cursor:"pointer"}}>✕</button>
              </div>
            </div>
            {task.description&&<p style={{fontSize:13,opacity:.7,margin:"0 0 10px",whiteSpace:"pre-wrap",lineHeight:1.5}}>{task.description}</p>}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,opacity:.6}}>
              {task.category&&<span>🏷 {task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#ef4444":"inherit"}}>📅 {task.dueDate}</span>}
              <span>⚡ {PRIORITIES[task.priority]}</span>
              <span>{task.done?"✅ Tamamlandı":"⏳ Bekliyor"}</span>
            </div>
          </div>
        );
      })()}

      <FAB onClick={openNew}/>

      <Modal open={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId?"Görevi Düzenle":"Yeni Görev"}>
        <input style={inp} placeholder="Görev başlığı..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="Açıklama (opsiyonel)..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input style={inp} placeholder="Kategori (opsiyonel)" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Tarih seç:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {quickDates.map(q=>(
              <button key={q.label} onClick={()=>setForm({...form,dueDate:q.val})} style={{
                background:form.dueDate===q.val?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
                color:form.dueDate===q.val?"#3b82f6":"#aaa",
                border:form.dueDate===q.val?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
                padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{q.icon} {q.label}</button>
            ))}
            {form.dueDate&&<button onClick={()=>setForm({...form,dueDate:""})} style={{
              background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",
              padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>✕ Temizle</button>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            {form.dueDate&&<span style={{fontSize:13,color:"#3b82f6",fontWeight:600,whiteSpace:"nowrap"}}>{formatDate(form.dueDate)}</span>}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Öncelik:</div>
          <div style={{display:"flex",gap:6}}>
            {Object.entries(PRIORITIES).map(([k,v])=>(
              <button key={k} onClick={()=>setForm({...form,priority:k})} style={{
                flex:1,padding:"10px",borderRadius:10,fontSize:13,cursor:"pointer",textAlign:"center",fontWeight:600,
                background:form.priority===k?`${PCOL[k]}20`:"rgba(255,255,255,0.04)",
                color:form.priority===k?PCOL[k]:"#888",
                border:`1px solid ${form.priority===k?PCOL[k]+"40":"rgba(255,255,255,0.06)"}`,
              }}>
                <span style={{display:"block",width:8,height:8,borderRadius:"50%",background:PCOL[k],margin:"0 auto 4px"}}/>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={save}>{editingId?"Kaydet":"Ekle"}</button>
        {editingId&&<button onClick={()=>{del(editingId);setModal(false);setEditingId(null);}} style={{...btnPrimary,background:"#ef4444",marginTop:8}}>Görevi Sil</button>}
      </Modal>
    </div>
  );
}

/* ═══════════ CALENDAR ═══════════ */
function CalendarView({ data, update }) {
  const [vd,setVd]=useState(new Date());
  const [modal,setModal]=useState(false);
  const [selDay,setSelDay]=useState(null);
  const [form,setForm]=useState({title:"",date:"",time:"",color:"#3b82f6",description:"",recurring:"none"});

  const y=vd.getFullYear(), m=vd.getMonth();
  const fd=(new Date(y,m,1).getDay()+6)%7;
  const dim=new Date(y,m+1,0).getDate();
  const cells=[]; for(let i=0;i<fd;i++)cells.push(null); for(let d=1;d<=dim;d++)cells.push(d);
  const ds=d=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const evOn = d => {
    const dateStr = ds(d);
    return data.events.filter(e => {
      if (e.date === dateStr) return true;
      // Recurring events
      if (e.recurring === "daily") return e.date <= dateStr;
      if (e.recurring === "weekly") {
        const eDate = new Date(e.date);
        const cDate = new Date(dateStr);
        return e.date <= dateStr && eDate.getDay() === cDate.getDay();
      }
      if (e.recurring === "monthly") {
        const eDay = parseInt(e.date.split("-")[2]);
        return e.date <= dateStr && eDay === d;
      }
      return false;
    });
  };

  const t = today();

  const add=()=>{
    if(!form.title.trim()||!form.date)return;
    update({...data,events:[...data.events,{id:uid(),...form}]});
    setModal(false);setForm({title:"",date:"",time:"",color:"#3b82f6",description:"",recurring:"none"});
  };
  const del=id=>update({...data,events:data.events.filter(e=>e.id!==id)});

  const openAdd=()=>{setModal(true);setForm({title:"",date:selDay?ds(selDay):"",time:"",color:"#3b82f6",description:"",recurring:"none"});};

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Takvim</h3>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setVd(new Date(y,m-1))} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>◀</button>
            <span style={{fontWeight:700,fontSize:14,minWidth:105,textAlign:"center"}}>{MN[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1))} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>▶</button>
          </div>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {DN.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,opacity:.4,padding:"6px 0"}}>{d}</div>)}
        {cells.map((d,i)=>{
          const isToday=d&&ds(d)===t;
          const ev=d?evOn(d):[];
          const isSel=d&&selDay===d;
          return (
            <div key={i} onClick={()=>d&&setSelDay(selDay===d?null:d)} style={{
              background:isToday?"rgba(59,130,246,0.2)":isSel?"rgba(59,130,246,0.1)":"rgba(255,255,255,0.03)",
              borderRadius:10,minHeight:48,padding:4,cursor:d?"pointer":"default",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              border:isToday?"1.5px solid #3b82f6":isSel?"1.5px solid rgba(59,130,246,0.3)":"1.5px solid transparent",
            }}>
              {d&&<>
                <span style={{fontSize:13,fontWeight:isToday?800:400,color:isToday?"#3b82f6":"inherit"}}>{d}</span>
                <div style={{display:"flex",gap:2}}>
                  {ev.slice(0,3).map((e,idx)=><div key={idx} style={{width:5,height:5,borderRadius:"50%",background:e.color||"#3b82f6"}}/>)}
                </div>
              </>}
            </div>
          );
        })}
      </div>
      {selDay&&(
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{selDay} {MN[m]}</h4>
            <button onClick={openAdd} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>+ Ekle</button>
          </div>
          {evOn(selDay).length===0&&<p style={{opacity:.3,fontSize:13,margin:0}}>Etkinlik yok</p>}
          {evOn(selDay).map((e,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#3b82f6",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500}}>{e.title} {e.recurring&&e.recurring!=="none"&&<span style={{fontSize:10,opacity:.4}}>🔁</span>}</div>
                {e.time&&<div style={{fontSize:12,opacity:.5}}>🕐 {e.time}</div>}
                {e.description&&<div style={{fontSize:12,opacity:.5}}>{e.description}</div>}
              </div>
              <button onClick={()=>del(e.id)} style={delBtnStyle}>✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Upcoming events list */}
      {(() => {
        const upEv = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
        if(upEv.length===0) return null;
        return (
          <div style={{marginBottom:14}}>
            <GroupLabel label="Yaklaşan" count={upEv.length} color="#a855f7"/>
            {upEv.map(e=>(
              <div key={e.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#a855f7",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                  <div style={{fontSize:11,opacity:.45,marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>
                </div>
                <button onClick={()=>update({...data,events:data.events.filter(ev=>ev.id!==e.id)})} style={delBtnStyle}>✕</button>
              </div>
            ))}
          </div>
        );
      })()}

      <FAB onClick={openAdd} color="#a855f7"/>

      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Etkinlik">
        <input style={inp} placeholder="Etkinlik adı..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <input style={{...inp,flex:1}} type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <select style={inp} value={form.recurring} onChange={e=>setForm({...form,recurring:e.target.value})}>
          <option value="none">Tekrarlama yok</option>
          <option value="daily">Her gün</option>
          <option value="weekly">Her hafta</option>
          <option value="monthly">Her ay</option>
        </select>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={add}>Ekle</button>
      </Modal>
    </div>
  );
}

/* ═══════════ SPORTS ═══════════ */
/* ═══════════ SAĞLIK (Health Coach) ═══════════ */
function Sports({ data, update }) {
  const [view,setView]=useState("overview"); // overview, sport, food
  const [modal,setModal]=useState(false);
  const [foodModal,setFoodModal]=useState(false);
  const [form,setForm]=useState({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  const [foodForm,setFoodForm]=useState({name:"",calories:"",meal:"Öğle",date:today()});
  const [foodSearch,setFoodSearch]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const photoRef=useRef(null);

  const foods = data.foods || [];
  const aiProvider = data.settings?.aiProvider||"none";
  const aiKey = data.settings?.aiKey||"";
  const hasAI = aiProvider!=="none" && aiKey;

  // AI Photo Analysis
  const analyzePhoto = async (file) => {
    if(!hasAI) return;
    setAnalyzing(true);setAiResult(null);
    try {
      const base64 = await new Promise((res,rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      let result;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            contents:[{parts:[
              {inlineData:{mimeType:file.type,data:base64}},
              {text:"Bu yemek fotoğrafını analiz et. JSON formatında cevap ver, başka hiçbir şey yazma. Format: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan. Porsiyon büyüklüğünü tahmin et."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:file.type,data:base64}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({
            model:"gpt-4o-mini",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image_url",image_url:{url:`data:${file.type};base64,${base64}`}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      }
      if(result&&result.items) setAiResult(result);
      else setAiResult({error:"Analiz yapılamadı, tekrar deneyin"});
    } catch(err) {
      console.error("AI error:",err);
      setAiResult({error:"Hata: "+err.message});
    }
    setAnalyzing(false);
  };

  const saveAiResult = () => {
    if(!aiResult||!aiResult.items) return;
    const newFoods = aiResult.items.map(item=>({
      id:uid(),name:item.name,calories:item.calories,meal:foodForm.meal,date:today()
    }));
    update({...data,foods:[...newFoods,...foods]});
    setAiResult(null);
  };

  const addSport=()=>{
    if(!form.duration)return;
    // Auto-calculate calories if not manually entered
    const autoCal = calcSportCal(form.type, form.duration);
    const finalCal = form.calories ? +form.calories : autoCal;
    const ns={id:uid(),...form,duration:+form.duration,distance:+form.distance||0,calories:finalCal};
    update({...data,sports:[ns,...data.sports]});
    setModal(false);setForm({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  };
  const delSport=id=>update({...data,sports:data.sports.filter(s=>s.id!==id)});

  const addFood=()=>{
    if(!foodForm.name.trim()||!foodForm.calories)return;
    const nf={id:uid(),...foodForm,calories:+foodForm.calories};
    // Auto-save to personal food database
    const myFoods = data.myFoods || {};
    const key = foodForm.name.trim();
    const newMyFoods = {...myFoods,[key]:+foodForm.calories};
    update({...data,foods:[nf,...foods],myFoods:newMyFoods});
    setFoodModal(false);setFoodForm({name:"",calories:"",meal:"Öğle",date:today()});setFoodSearch("");
  };
  const delFood=id=>update({...data,foods:foods.filter(f=>f.id!==id)});
  const delMyFood=name=>{const mf={...(data.myFoods||{})};delete mf[name];update({...data,myFoods:mf});};

  const selectCommonFood=(name,cal)=>{
    setFoodForm({...foodForm,name,calories:String(cal)});
    setFoodSearch("");
  };

  // AI text-based calorie lookup
  const [aiLookup,setAiLookup]=useState(false);
  const askAiCalorie = async (foodName) => {
    if(!hasAI||!foodName.trim()) return;
    setAiLookup(true);
    try {
      const prompt = `"${foodName}" yemeğinin 1 porsiyon kalori değerini söyle. SADECE sayı olarak cevap ver, başka hiçbir şey yazma. Örnek: 250`;
      let cal = null;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({model:"gpt-4o-mini",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      }
      if(cal && cal > 0) setFoodForm(f=>({...f,calories:String(cal)}));
    } catch(err) { console.error("AI lookup error:",err); }
    setAiLookup(false);
  };

  const t=today();
  const wk=data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const tMin=wk.reduce((a,s)=>a+(s.duration||0),0);
  const burnedCal=wk.reduce((a,s)=>a+(s.calories||0),0);
  const tDist=wk.reduce((a,s)=>a+(s.distance||0),0);

  const todayFoods=foods.filter(f=>f.date===t);
  const todayCalIn=todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todaySports=data.sports.filter(s=>s.date===t);
  const todayCalOut=todaySports.reduce((a,s)=>a+(s.calories||0),0);
  const dailyGoal=2000;
  const netCal=todayCalIn-todayCalOut;

  // AI Coach advice
  const getCoachTip=()=>{
    if(todayCalIn===0&&todayCalOut===0) return {icon:"💡",text:"Bugün henüz kayıt yok. Yediklerini ve sporunu kaydet, sağlık koçun seni yönlendirsin!",color:"#3b82f6"};
    if(netCal>dailyGoal+300) return {icon:"⚠️",text:`Bugün ${netCal} kcal net kalori — hedefin üzerinde. Hafif bir yürüyüş veya koşu iyi gelir!`,color:"#f59e0b"};
    if(netCal<1200&&todayCalIn>0) return {icon:"🌟",text:`Harika gidiyorsun! ${netCal} kcal net — dengeli ve sağlıklı.`,color:"#22c55e"};
    if(todayCalOut>300) return {icon:"💪",text:`Bugün ${todayCalOut} kcal yaktın, süpersin! Protein ağırlıklı beslenmeyi unutma.`,color:"#22c55e"};
    if(todayCalIn>0&&todayCalOut===0) return {icon:"🏃",text:`${todayCalIn} kcal aldın ama henüz spor yapmadın. 30dk yürüyüş ~150 kcal yakar!`,color:"#f97316"};
    return {icon:"✨",text:"Günü dengeli geçiriyorsun, böyle devam!",color:"#3b82f6"};
  };
  const tip=getCoachTip();

  // Smart search: COMMON_FOODS + myFoods + recent history
  const myFoods = data.myFoods || {};
  const recentFoodNames = {};
  foods.slice(0,50).forEach(f=>{ if(f.name && f.calories && !recentFoodNames[f.name]) recentFoodNames[f.name]=f.calories; });
  const allFoodDB = {...COMMON_FOODS,...recentFoodNames,...myFoods};
  const filteredFoods = foodSearch
    ? Object.entries(allFoodDB).filter(([k])=>k.toLowerCase().includes(foodSearch.toLowerCase())).slice(0,15)
    : [
        ...Object.entries(myFoods).slice(0,6).map(([k,v])=>[k,v,"my"]),
        ...Object.entries(COMMON_FOODS).slice(0,8),
      ].slice(0,12);
  const noResults = foodSearch && filteredFoods.length === 0;

  const mealGroups = ["Kahvaltı","Öğle","Akşam","Atıştırma"];

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:"0 0 12px",fontSize:20,fontWeight:800}}>Sağlık Koçu</h3>
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",borderRadius:12,padding:3,display:"flex"}}>
          {[["overview","Özet"],["sport","Spor"],["food","Beslenme"]].map(([k,v])=>(
            <button key={k} onClick={()=>setView(k)} style={{
              flex:1,padding:"9px 6px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:view===k?700:500,letterSpacing:-.2,
              background:view===k?"rgba(255,255,255,0.12)":"transparent",
              color:view===k?"#e0e0e0":"#666",transition:"all .2s",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {/* ── OVERVIEW ── */}
      {view==="overview"&&(<>
        {/* Coach tip */}
        <div style={{background:`${tip.color}15`,border:`1px solid ${tip.color}30`,borderRadius:14,padding:14,marginBottom:14,display:"flex",gap:10,alignItems:"start"}}>
          <span style={{fontSize:24}}>{tip.icon}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:tip.color,marginBottom:2}}>Sağlık Koçun</div>
            <div style={{fontSize:13,opacity:.8,lineHeight:1.4}}>{tip.text}</div>
          </div>
        </div>

        {/* Today's balance */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Bugünkü Denge</h4>
          <div style={{display:"flex",justifyContent:"space-around",textAlign:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:"#f97316"}}>{todayCalIn}</div>
              <div style={{fontSize:10,opacity:.5}}>Alınan kcal</div>
            </div>
            <div style={{fontSize:20,opacity:.3,alignSelf:"center"}}>−</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:"#22c55e"}}>{todayCalOut}</div>
              <div style={{fontSize:10,opacity:.5}}>Yakılan kcal</div>
            </div>
            <div style={{fontSize:20,opacity:.3,alignSelf:"center"}}>=</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:netCal>dailyGoal?"#ef4444":"#3b82f6"}}>{netCal}</div>
              <div style={{fontSize:10,opacity:.5}}>Net kcal</div>
            </div>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,0.08)",backdropFilter:"blur(2px)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:netCal>dailyGoal?"#ef4444":"#3b82f6",borderRadius:4,width:`${Math.min(100,netCal/dailyGoal*100)}%`,transition:"width .3s"}}/>
          </div>
          <div style={{fontSize:10,opacity:.4,marginTop:4,textAlign:"center"}}>Günlük hedef: {dailyGoal} kcal</div>
        </div>

        {/* Weekly stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
          {[
            {icon:"⏱",val:`${tMin} dk`,label:"Haftalık Spor",color:"#3b82f6"},
            {icon:"🔥",val:`${burnedCal}`,label:"Yakılan kcal",color:"#ef4444"},
            {icon:"📏",val:`${tDist.toFixed(1)} km`,label:"Mesafe",color:"#22c55e"},
            {icon:"💪",val:wk.length,label:"Antrenman",color:"#f97316"},
          ].map((s,i)=>(
            <div key={i} style={{...cardStyle,padding:"14px",borderLeft:`3px solid ${s.color}`,boxShadow:`0 0 16px ${s.color}18`}}>
              <div style={{fontSize:11,opacity:.5}}>{s.icon} {s.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── SPORT ── */}
      {view==="sport"&&(<>
        {data.sports.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>🏃</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Henüz antrenman kaydı yok</div>
            <div style={{fontSize:12,opacity:.25}}>Sağ alttaki + butonuna bas</div>
          </div>
        )}
        {data.sports.slice(0,30).map(s=>(
          <div key={s.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:24,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",borderRadius:12}}>{SPORT_EMOJI[s.type]||"⚡"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{s.type}</div>
              <div style={{fontSize:12,opacity:.5}}>{s.date} · {s.duration}dk {s.distance>0&&`· ${s.distance}km`} {s.calories>0&&`· ${s.calories}kcal`}</div>
            </div>
            <button onClick={()=>delSport(s.id)} style={delBtnStyle}>✕</button>
          </div>
        ))}
      </>)}

      {/* ── FOOD ── */}
      {view==="food"&&(<>
        {hasAI&&(
          <div style={{marginBottom:10}}>
            <button onClick={()=>photoRef.current?.click()} disabled={analyzing} style={{
              ...addBtnStyle,background:analyzing?"#555":"#22c55e",width:"100%",padding:"12px",borderRadius:12,fontSize:14,
            }}>{analyzing?"🔄 Analiz ediliyor...":"📸 Fotoğrafla Kalori Hesapla"}</button>
            <input ref={photoRef} type="file" accept="image/*" capture="environment"
              onChange={e=>{if(e.target.files?.[0])analyzePhoto(e.target.files[0]);e.target.value="";}}
              style={{display:"none"}}/>
          </div>
        )}

        {/* AI Result card */}
        {aiResult&&!aiResult.error&&(
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>🤖 AI Analiz Sonucu</span>
              <span style={{fontSize:14,fontWeight:800,color:"#f97316"}}>{aiResult.total} kcal</span>
            </div>
            {aiResult.items.map((item,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
                <span style={{opacity:.7}}>{item.name}</span>
                <span style={{fontWeight:600,color:"#f97316"}}>{item.calories} kcal</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={saveAiResult} style={{...btnPrimary,flex:1,marginTop:0,background:"#22c55e",padding:"10px"}}>✓ Kaydet</button>
              <button onClick={()=>setAiResult(null)} style={{...btnPrimary,flex:1,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#ef4444",padding:"10px",border:"1px solid rgba(239,68,68,0.2)"}}>✕ İptal</button>
            </div>
          </div>
        )}
        {aiResult?.error&&(
          <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
            <span style={{fontSize:13,color:"#ef4444"}}>{aiResult.error}</span>
            <button onClick={()=>setAiResult(null)} style={{display:"block",marginTop:6,background:"none",border:"none",color:"#ef4444",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Kapat</button>
          </div>
        )}

        {!hasAI&&(
          <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:12,padding:12,marginBottom:12,textAlign:"center"}}>
            <div style={{fontSize:12,opacity:.6,marginBottom:4}}>📸 Fotoğrafla kalori hesaplamak için</div>
            <div style={{fontSize:11,opacity:.4}}>Ayarlar → AI Kalori Asistanı'ndan bir AI seç ve API anahtarını gir</div>
          </div>
        )}

        {/* Today's meals grouped */}
        {mealGroups.map(meal=>{
          const mealFoods=todayFoods.filter(f=>f.meal===meal);
          if(mealFoods.length===0)return null;
          const mealCal=mealFoods.reduce((a,f)=>a+(f.calories||0),0);
          return (
            <div key={meal} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700,opacity:.7}}>{meal}</span>
                <span style={{fontSize:12,fontWeight:600,color:"#f97316"}}>{mealCal} kcal</span>
              </div>
              {mealFoods.map(f=>(
                <div key={f.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14,flex:1}}>{f.name}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#f97316"}}>{f.calories}</span>
                  <button onClick={()=>delFood(f.id)} style={delBtnStyle}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
        {todayFoods.length===0&&!aiResult&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>🍽</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Bugün yemek kaydı yok</div>
            <div style={{fontSize:12,opacity:.25}}>+ butonuna basarak ekle</div>
          </div>
        )}
      </>)}

      {view==="sport"&&<FAB onClick={()=>setModal(true)} color="#22c55e"/>}
      {view==="food"&&<FAB onClick={()=>setFoodModal(true)} color="#f97316"/>}

      {/* Sport Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Antrenman">
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {SPORT_TYPES.map(t=>(
            <button key={t} onClick={()=>setForm({...form,type:t})} style={{
              background:form.type===t?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              color:form.type===t?"#3b82f6":"#aaa",
              border:form.type===t?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              padding:"8px 14px",borderRadius:10,fontSize:14,cursor:"pointer",
            }}>{SPORT_EMOJI[t]} {t}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder="Süre (dk)" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/>
          <input style={{...inp,flex:1}} type="number" placeholder="Mesafe (km)" value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,position:"relative"}}>
            <input style={inp} type="number" placeholder="Yakılan kalori (opsiyonel)" value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
            {form.duration&&!form.calories&&(
              <div style={{fontSize:11,color:"#22c55e",marginTop:-8,marginBottom:8,paddingLeft:4,opacity:.8}}>
                ≈ {calcSportCal(form.type,form.duration)} kcal otomatik hesaplanacak
              </div>
            )}
          </div>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Notlar (opsiyonel)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={btnPrimary} onClick={addSport}>Kaydet</button>
      </Modal>

      {/* Food Modal */}
      <Modal open={foodModal} onClose={()=>{setFoodModal(false);setFoodSearch("");setAiLookup(false);}} title="Yemek Ekle">
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {mealGroups.map(m=>(
            <button key={m} onClick={()=>setFoodForm({...foodForm,meal:m})} style={{
              background:foodForm.meal===m?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              color:foodForm.meal===m?"#3b82f6":"#aaa",
              border:foodForm.meal===m?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              padding:"7px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>{m}</button>
          ))}
        </div>

        {/* Smart search input */}
        <input style={inp} placeholder="🔍 Yemek ara (pancake, pilav, salata...)" value={foodSearch||foodForm.name}
          onChange={e=>{
            const v=e.target.value;
            setFoodSearch(v);
            // Auto-fill calories if exact match found
            const exactMatch = allFoodDB[v];
            setFoodForm({...foodForm,name:v,calories:exactMatch?String(exactMatch):""});
          }}/>

        {/* Search results */}
        {(foodSearch||!foodForm.name)&&(
          <div style={{maxHeight:180,overflow:"auto",marginBottom:10}}>
            {/* Personal foods section */}
            {!foodSearch&&Object.keys(myFoods).length>0&&(
              <div style={{fontSize:10,opacity:.4,padding:"4px 8px",fontWeight:700}}>⭐ Benim Yemeklerim</div>
            )}
            {filteredFoods.map(([name,cal,source])=>(
              <div key={name} onClick={()=>selectCommonFood(name,cal)} style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",cursor:"pointer",
                borderRadius:8,background:"rgba(255,255,255,0.03)",marginBottom:2,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {(source==="my"||myFoods[name])&&<span style={{fontSize:10,color:"#f59e0b"}}>⭐</span>}
                  <span style={{fontSize:13}}>{name}</span>
                </div>
                <span style={{fontSize:12,color:"#f97316",fontWeight:600}}>{cal} kcal</span>
              </div>
            ))}
            {/* No results + AI button */}
            {noResults&&(
              <div style={{textAlign:"center",padding:12}}>
                <p style={{fontSize:12,opacity:.4,margin:"0 0 8px"}}>"{foodSearch}" bulunamadı</p>
                {hasAI?(
                  <button onClick={()=>askAiCalorie(foodSearch)} disabled={aiLookup} style={{
                    background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",
                    padding:"8px 16px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                  }}>{aiLookup?"🔄 AI hesaplıyor...":"🤖 AI'a Kaloriyi Sor"}</button>
                ):(
                  <p style={{fontSize:11,opacity:.3}}>Kaloriyi elle gir veya Ayarlar'dan AI aç</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Name + calorie inputs */}
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:2}} placeholder="Yemek adı" value={foodForm.name} onChange={e=>setFoodForm({...foodForm,name:e.target.value})}/>
          <div style={{flex:1,position:"relative"}}>
            <input style={{...inp,paddingRight:hasAI?36:14}} type="number" placeholder="kcal" value={foodForm.calories} onChange={e=>setFoodForm({...foodForm,calories:e.target.value})}/>
            {hasAI&&foodForm.name&&!foodForm.calories&&(
              <button onClick={()=>askAiCalorie(foodForm.name)} disabled={aiLookup} style={{
                position:"absolute",right:8,top:8,background:"none",border:"none",
                fontSize:16,cursor:"pointer",opacity:aiLookup?.4:.8,
              }} title="AI'a sor">{aiLookup?"⏳":"🤖"}</button>
            )}
          </div>
        </div>

        {/* Auto-save info */}
        {foodForm.name&&foodForm.calories&&!allFoodDB[foodForm.name.trim()]&&(
          <div style={{fontSize:10,opacity:.4,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
            <span>⭐</span> Ekledikten sonra "{foodForm.name}" kişisel listene kaydedilecek
          </div>
        )}

        <input style={inp} type="date" value={foodForm.date} onChange={e=>setFoodForm({...foodForm,date:e.target.value})}/>
        <button style={btnPrimary} onClick={addFood}>Ekle</button>

        {/* Personal food list management */}
        {Object.keys(myFoods).length>0&&(
          <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
            <div style={{fontSize:12,fontWeight:700,opacity:.5,marginBottom:8}}>⭐ Kişisel Yemek Listen ({Object.keys(myFoods).length})</div>
            <div style={{maxHeight:120,overflow:"auto"}}>
              {Object.entries(myFoods).map(([name,cal])=>(
                <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",fontSize:12}}>
                  <span style={{opacity:.6}}>{name}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#f97316",fontWeight:600}}>{cal} kcal</span>
                    <button onClick={()=>delMyFood(name)} style={{background:"none",border:"none",color:"#555",fontSize:12,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}



/* ═══════════ NEWS ROOM ═══════════ */
const NEWS_SOURCES = {
  teknoloji: [
    { name:"BBC Tech",      url:"https://feeds.bbci.co.uk/news/technology/rss.xml",             lang:"EN", color:"#3b82f6" },
    { name:"Ars Technica",  url:"https://feeds.arstechnica.com/arstechnica/index",               lang:"EN", color:"#f97316" },
    { name:"Hacker News",   url:"https://hnrss.org/frontpage?count=15",                         lang:"EN", color:"#ff6600" },
  ],
  spor: [
    { name:"BBC Sport",     url:"https://feeds.bbci.co.uk/sport/rss.xml",                       lang:"EN", color:"#ef4444" },
    { name:"BBC Football",  url:"https://feeds.bbci.co.uk/sport/football/rss.xml",              lang:"EN", color:"#ef4444" },
    { name:"ESPN",          url:"https://www.espn.com/espn/rss/news",                           lang:"EN", color:"#cc0000" },
  ],
  sanat: [
    { name:"BBC Arts",      url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", lang:"EN", color:"#a855f7" },
    { name:"NPR Arts",      url:"https://feeds.npr.org/1008/rss.xml",                           lang:"EN", color:"#7c3aed" },
    { name:"Smithsonian",   url:"https://www.smithsonianmag.com/rss/arts-culture/",             lang:"EN", color:"#6d28d9" },
  ],
  saglik: [
    { name:"BBC Health",    url:"https://feeds.bbci.co.uk/news/health/rss.xml",                 lang:"EN", color:"#22c55e" },
    { name:"NPR Health",    url:"https://feeds.npr.org/1128/rss.xml",                           lang:"EN", color:"#16a34a" },
    { name:"Science Daily", url:"https://www.sciencedaily.com/rss/health_medicine.xml",         lang:"EN", color:"#0d9488" },
  ],
  ekonomi: [
    { name:"BBC Business",  url:"https://feeds.bbci.co.uk/news/business/rss.xml",               lang:"EN", color:"#f59e0b" },
    { name:"NPR Economy",   url:"https://feeds.npr.org/1006/rss.xml",                           lang:"EN", color:"#d97706" },
    { name:"MarketWatch",   url:"https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", lang:"EN", color:"#b45309" },
  ],
  politika: [
    { name:"BBC World",     url:"https://feeds.bbci.co.uk/news/world/rss.xml",                  lang:"EN", color:"#ef4444" },
    { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",                         lang:"TR", color:"#dc2626" },
    { name:"NPR Politics",  url:"https://feeds.npr.org/1014/rss.xml",                           lang:"EN", color:"#b91c1c" },
  ],
  bilim: [
    { name:"Science Daily", url:"https://www.sciencedaily.com/rss/top/science.xml",             lang:"EN", color:"#06b6d4" },
    { name:"BBC Science",   url:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",lang:"EN", color:"#0891b2" },
    { name:"NPR Science",   url:"https://feeds.npr.org/1007/rss.xml",                           lang:"EN", color:"#0e7490" },
  ],
  dunya: [
    { name:"BBC World",     url:"https://feeds.bbci.co.uk/news/world/rss.xml",                  lang:"EN", color:"#64748b" },
    { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",                         lang:"TR", color:"#bb1919" },
    { name:"NPR World",     url:"https://feeds.npr.org/1004/rss.xml",                           lang:"EN", color:"#475569" },
  ],
};

/* SVG ikonlar — her haber kategorisi için */
const NEWS_ICONS = {
  spor: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke={c} strokeWidth="1.5" fill="none"/>
      <path d="M18 4 C18 4 14 10 14 18 C14 26 18 32 18 32" stroke={c} strokeWidth="1.5"/>
      <path d="M4 18 C4 18 10 14 18 14 C26 14 32 18 32 18" stroke={c} strokeWidth="1.5"/>
      <path d="M6 11 C6 11 12 15 18 14 C24 13 28 8 28 8" stroke={c} strokeWidth="1" opacity=".5"/>
      <path d="M6 25 C6 25 12 21 18 22 C24 23 28 28 28 28" stroke={c} strokeWidth="1" opacity=".5"/>
    </svg>
  ),
  teknoloji: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="4" y="7" width="28" height="18" rx="2" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <path d="M12 29 L24 29" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 25 L18 29" stroke={c} strokeWidth="1.5"/>
      <rect x="8" y="11" width="20" height="10" rx="1" fill={c+"20"} stroke={c} strokeWidth="1" opacity=".6"/>
      <path d="M11 16 L15 13 L18 16 L22 12 L25 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  ekonomi: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M6 28 L11 18 L16 22 L21 12 L26 16 L31 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 28 L31 28" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
      <circle cx="31" cy="6" r="2.5" fill={c}/>
      <path d="M26 16 L31 6 L36 16" stroke="none"/>
    </svg>
  ),
  politika: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <ellipse cx="18" cy="18" rx="6" ry="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <line x1="5" y1="18" x2="31" y2="18" stroke={c} strokeWidth="1.5" opacity=".5"/>
      <path d="M7 11 Q18 14 29 11" stroke={c} strokeWidth="1" opacity=".4" fill="none"/>
      <path d="M7 25 Q18 22 29 25" stroke={c} strokeWidth="1" opacity=".4" fill="none"/>
    </svg>
  ),
  saglik: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 30 C18 30 6 22 6 14 C6 9.6 9.6 6 14 6 C16 6 18 8 18 8 C18 8 20 6 22 6 C26.4 6 30 9.6 30 14 C30 22 18 30 18 30Z" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <path d="M14 17 L18 17 L18 13 L20 13 L20 17 L24 17 L24 19 L20 19 L20 23 L18 23 L18 19 L14 19 Z" fill={c} opacity=".8"/>
    </svg>
  ),
  bilim: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="12" r="5" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <line x1="18" y1="5" x2="18" y2="2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="7" x2="26" y2="5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="7" x2="10" y2="5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 17 L8 28 L28 28 L24 17" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={c+"08"}/>
      <line x1="10" y1="23" x2="26" y2="23" stroke={c} strokeWidth="1" opacity=".4"/>
      <circle cx="18" cy="12" r="2" fill={c} opacity=".6"/>
    </svg>
  ),
  sanat: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="12" stroke={c} strokeWidth="1.5" fill={c+"10"}/>
      <circle cx="13" cy="14" r="2.5" fill={c} opacity=".8"/>
      <circle cx="23" cy="14" r="2.5" fill={c} opacity=".6"/>
      <circle cx="13" cy="22" r="2.5" fill={c} opacity=".5"/>
      <circle cx="23" cy="22" r="2.5" fill={c} opacity=".7"/>
      <circle cx="18" cy="18" r="2.5" fill={c}/>
    </svg>
  ),
  dunya: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <path d="M12 8 L14 14 L10 16 L8 22 L14 26 L16 30" stroke={c} strokeWidth="1" fill="none" opacity=".6"/>
      <path d="M24 8 L22 12 L26 16 L28 20 L24 26 L22 30" stroke={c} strokeWidth="1" fill="none" opacity=".6"/>
      <path d="M5 18 L10 16 L14 18 L18 15 L22 18 L26 16 L31 18" stroke={c} strokeWidth="1.5" fill="none" opacity=".5"/>
    </svg>
  ),
};

const NEWS_CATS = [
  { id:"spor",      label:"Spor",      color:"#ef4444",  desc:"Futbol, basketbol & dünya sporları" },
  { id:"teknoloji", label:"Teknoloji", color:"#3b82f6",  desc:"Yapay zeka, gadget & yazılım" },
  { id:"ekonomi",   label:"Ekonomi",   color:"#f59e0b",  desc:"Piyasalar, borsa & iş dünyası" },
  { id:"politika",  label:"Politika",  color:"#ef4444",  desc:"Dünya siyaseti & gündem" },
  { id:"saglik",    label:"Sağlık",    color:"#22c55e",  desc:"Tıp, beslenme & wellness" },
  { id:"bilim",     label:"Bilim",     color:"#06b6d4",  desc:"Uzay, keşifler & araştırmalar" },
  { id:"sanat",     label:"Sanat",     color:"#a855f7",  desc:"Kültür, sanat & eğlence" },
  { id:"dunya",     label:"Dünya",     color:"#64748b",  desc:"Dünya haberleri & olaylar" },
];

/* ── NewsRoom: Category grid → drill into article list ── */
function NewsRoom({ room, onBack }) {
  const [activeCat, setActiveCat] = useState(null); // null = grid, string = category id
  const [articles, setArticles] = useState({});
  const [loading, setLoading] = useState({});
  const [loaded, setLoaded] = useState({});
  const [langFilter, setLangFilter] = useState("all");

  const timeAgo = (dateStr) => {
    if(!dateStr) return "";
    try {
      const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
      if(diff < 60) return "az önce";
      if(diff < 3600) return Math.floor(diff/60)+"dk önce";
      if(diff < 86400) return Math.floor(diff/3600)+"sa önce";
      return Math.floor(diff/86400)+"g önce";
    } catch { return ""; }
  };

  const fetchOneFeed = async (src) => {
    const raw = await proxyFetch(src.url);
    const text = typeof raw === "string" ? raw : (raw.contents || JSON.stringify(raw));
    const xml = new DOMParser().parseFromString(text, "text/xml");
    const items = [...xml.querySelectorAll("item, entry")].slice(0,10);
    return items.map(item => {
      const txt = (sel) => item.querySelector(sel)?.textContent?.replace(/<[^>]+>/g,"")?.trim() || "";
      const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || "";
      let thumb = "";
      try {
        const enc = item.querySelector("enclosure");
        if(enc && /image/i.test(enc.getAttribute("type")||"")) thumb = enc.getAttribute("url")||"";
        if(!thumb) {
          const mrss = "http://search.yahoo.com/mrss/";
          const mt = item.getElementsByTagNameNS(mrss,"thumbnail")[0]||item.getElementsByTagNameNS(mrss,"content")[0];
          if(mt) thumb = mt.getAttribute("url")||"";
        }
        if(!thumb) {
          const raw2 = item.querySelector("description,summary")?.textContent||"";
          const m = raw2.match(/src=["']([^"']+[.](jpg|jpeg|png|webp|gif)[^"']*)/i);
          if(m) thumb = m[1];
        }
      } catch(e) {}
      const link = txt("link") || attr("link","href") || attr("guid","");
      const pubDate = txt("pubDate") || txt("published") || txt("updated") || "";
      return {
        id: link || txt("guid") || Math.random().toString(36),
        title: txt("title"),
        summary: (txt("description")||txt("summary")).slice(0,160),
        link, thumb, pubDate,
        source: src.name, sourceColor: src.color, lang: src.lang,
      };
    }).filter(a=>a.title && a.link);
  };

  const fetchCategory = async (catId, force=false) => {
    if(loaded[catId] && !force) return;
    setLoading(l=>({...l,[catId]:true}));
    const sources = NEWS_SOURCES[catId] || [];
    const results = await Promise.allSettled(sources.map(fetchOneFeed));
    const seen = new Set();
    const merged = results
      .flatMap(r => r.status==="fulfilled" ? r.value : [])
      .filter(a => { if(!a.title||seen.has(a.title))return false; seen.add(a.title); return true; })
      .sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))
      .slice(0,35);
    setArticles(prev=>({...prev,[catId]:merged}));
    setLoaded(prev=>({...prev,[catId]:true}));
    setLoading(l=>({...l,[catId]:false}));
  };

  const openCat = (catId) => {
    setActiveCat(catId);
    fetchCategory(catId);
  };

  const catInfo = NEWS_CATS.find(c=>c.id===activeCat);
  const rawList = articles[activeCat] || [];
  const list = langFilter==="all" ? rawList : rawList.filter(a=>a.lang===langFilter);
  const isLoading = loading[activeCat];

  /* ── CATEGORY ARTICLE VIEW ── */
  if(activeCat) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={()=>setActiveCat(null)} style={{
            background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",
            border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",
            width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>◀</button>
          <div style={{filter:`drop-shadow(0 0 6px ${catInfo?.color}88)`,flexShrink:0}}>
            {NEWS_ICONS[activeCat]?.(catInfo?.color||"#aaa")}
          </div>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:catInfo?.color}}>{catInfo?.label}</h3>
            <div style={{fontSize:11,opacity:.4,marginTop:1}}>{catInfo?.desc}</div>
          </div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",
            color:"#aaa",width:34,height:34,borderRadius:10,fontSize:14,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>↻</button>
        </div>
        {/* Lang filter */}
        <div style={{display:"flex",gap:5}}>
          {[["all","🌍 Tümü"],["TR","🇹🇷 TR"],["EN","🌐 EN"]].map(([k,v])=>(
            <button key={k} onClick={()=>setLangFilter(k)} style={{
              padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:langFilter===k?700:400,
              background:langFilter===k?`${catInfo?.color}25`:"rgba(255,255,255,0.05)",
              color:langFilter===k?catInfo?.color:"#555",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {isLoading&&(
        <div style={{textAlign:"center",padding:"50px 0"}}>
          <div style={{margin:"0 auto 10px",animation:"pulse 1.5s ease-in-out infinite",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {NEWS_ICONS[activeCat]?.(catInfo?.color||"#aaa")}
          </div>
          <div style={{fontSize:13,opacity:.4,marginBottom:4}}>Haberler yükleniyor...</div>
          <div style={{fontSize:11,opacity:.2}}>{NEWS_SOURCES[activeCat]?.map(s=>s.name).join(" · ")}</div>
        </div>
      )}

      {!isLoading&&list.length>0&&(
        <div>
          <div style={{fontSize:11,opacity:.3,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:catInfo?.color,display:"inline-block"}}/>
            <span>{list.length} haber</span>
          </div>
          {list.map((article,i)=>(
            <a key={article.id||i} href={article.link} target="_blank" rel="noopener noreferrer"
              style={{textDecoration:"none",color:"inherit",display:"block"}}>
              <div style={{
                ...cardStyle,padding:0,marginBottom:10,overflow:"hidden",
                border:`1px solid ${catInfo?.color}25`,
                boxShadow:`0 0 20px ${catInfo?.color}10`,
                transition:"transform .15s, box-shadow .15s",
              }}
              onTouchStart={e=>{e.currentTarget.style.transform="scale(0.98)";}}
              onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
              >
                {/* Thumbnail — full width if present */}
                {article.thumb&&(
                  <div style={{width:"100%",height:140,overflow:"hidden",background:"#111",flexShrink:0}}>
                    <img src={article.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{e.target.parentElement.style.display="none";}}/>
                  </div>
                )}
                <div style={{padding:"12px 14px"}}>
                  <div style={{fontSize:14,fontWeight:700,lineHeight:1.45,marginBottom:6,
                    display:"-webkit-box",WebkitLineClamp:article.thumb?2:3,
                    WebkitBoxOrient:"vertical",overflow:"hidden",
                  }}>{article.title}</div>
                  {!article.thumb&&article.summary&&(
                    <div style={{fontSize:12,opacity:.45,lineHeight:1.45,marginBottom:6,
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
                    }}>{article.summary}</div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{
                      fontSize:10,fontWeight:700,
                      color:article.sourceColor,
                      background:`${article.sourceColor}18`,
                      padding:"2px 8px",borderRadius:5,
                    }}>{article.source}</span>
                    {article.pubDate&&<span style={{fontSize:10,opacity:.3}}>{timeAgo(article.pubDate)}</span>}
                    <span style={{fontSize:10,opacity:.2,marginLeft:"auto"}}>↗ Habere git</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!isLoading&&list.length===0&&loaded[activeCat]&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:40,marginBottom:10}}>📡</div>
          <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:6}}>Haber yüklenemedi</div>
          <div style={{fontSize:12,opacity:.25,marginBottom:16}}>İnternet bağlantını kontrol et</div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:`${catInfo?.color}20`,color:catInfo?.color,
            border:`1px solid ${catInfo?.color}40`,borderRadius:10,
            padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
          }}>↻ Tekrar Dene</button>
        </div>
      )}
    </div>
  );

  /* ── CATEGORY GRID (main view) ── */
  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{
            background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",
            border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",
            width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>◀</button>
          <span style={{fontSize:22}}>
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#ef4444" strokeWidth="1.5" fill="rgba(239,68,68,0.1)"/><line x1="9" y1="13" x2="27" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="18" x2="27" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/><line x1="9" y1="23" x2="20" y2="23" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg>
          </span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>Haberler</h3>
          <span style={{fontSize:11,opacity:.3}}>{NEWS_CATS.length} kategori</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,opacity:.35}}>Bir kategoriye dokun ve haberleri keşfet</p>
      </StickyHeader>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {NEWS_CATS.map(cat=>(
          <div key={cat.id} onClick={()=>openCat(cat.id)}
            style={{
              background:`linear-gradient(145deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)`,
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              borderRadius:20,padding:"20px 16px",cursor:"pointer",
              border:`1px solid ${cat.color}45`,
              boxShadow:`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.08)`,
              minHeight:110,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
              transition:"transform .15s, box-shadow .2s",
            }}
            onTouchStart={e=>{e.currentTarget.style.transform="scale(0.96)";}}
            onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 40px ${cat.color}40, 0 0 80px ${cat.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.08)`;e.currentTarget.style.transform="scale(1)";}}
          >
            <div style={{filter:`drop-shadow(0 0 10px ${cat.color}88)`,lineHeight:1}}>
              {NEWS_ICONS[cat.id]?.(cat.color)}
            </div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff",textAlign:"center"}}>{cat.label}</div>
            <div style={{
              fontSize:10,color:cat.color,opacity:.8,
              textAlign:"center",lineHeight:1.3,
              display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
            }}>{cat.desc}</div>
            {loaded[cat.id]&&articles[cat.id]?.length>0&&(
              <div style={{fontSize:10,color:cat.color,fontWeight:700,opacity:.7}}>
                {articles[cat.id].length} haber
              </div>
            )}
            {loading[cat.id]&&(
              <div style={{fontSize:10,opacity:.4,animation:"pulse 1s ease-in-out infinite"}}>yükleniyor...</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* shared proxy fetch — uses Vercel /api/proxy, falls back to public proxies */
async function proxyFetch(url) {
  // 1. Try Vercel serverless proxy (same origin, no CORS, cached)
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) return res.json();
      return res.text();
    }
  } catch (e) { /* fall through */ }

  // 2. Fallback: allorigins (free public proxy)
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = await res.json();
      if (j.contents !== undefined) {
        try { return JSON.parse(j.contents); }
        catch { return j.contents; }
      }
      return j;
    }
  } catch (e) { /* fall through */ }

  // 3. Last resort: corsproxy.io
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) return res.json();
      return res.text();
    }
  } catch (e) { /* fall through */ }

  throw new Error("All proxies failed for: " + url);
}

/* ═══════════ MUSIC ROOM ═══════════ */
function MusicRoom({ room, items, onBack, onAdd, onDel }) {
  const [tab, setTab] = useState("collection"); // collection | search | link | charts
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkFetching, setLinkFetching] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const audioRef = useRef(null);

  // Charts state
  const [chartSource, setChartSource] = useState("tr"); // tr | global | genre
  const [chartGenre, setChartGenre] = useState("pop");
  const [chartTracks, setChartTracks] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartLoaded, setChartLoaded] = useState("");

  const GENRE_IDS = {pop:132,hiphop:116,rock:152,elektronik:106,rnb:165,latin:195,kpop:113};
  const GENRE_LABELS = {pop:"Pop",hiphop:"Hip-Hop",rock:"Rock",elektronik:"Elektronik",rnb:"R&B",latin:"Latin",kpop:"K-Pop"};

  const fetchCharts = async (source, genre) => {
    const key = source+genre;
    if(chartLoaded===key && chartTracks.length>0) return;
    setChartLoading(true);
    setChartTracks([]);
    try {
      if(source==="tr") {
        // iTunes Turkey — direct fetch, no CORS needed
        const json = await fetch("https://itunes.apple.com/tr/rss/topsongs/limit=25/json")
          .then(r=>r.json());
        setChartTracks((json.feed?.entry||[]).map((e,i)=>({
          id:"itunes_"+i,
          title:e["im:name"]?.label||"",
          artist:e["im:artist"]?.label||"",
          albumArt:e["im:image"]?.[2]?.label||e["im:image"]?.[0]?.label||"",
          link:e.link?.attributes?.href||"",
          preview:"",
          source:"itunes",
          rank:i+1,
        })));
      } else {
        // Deezer via multi-proxy fallback
        const deezerUrl = source==="global"
          ? "https://api.deezer.com/chart/0/tracks?limit=25"
          : `https://api.deezer.com/chart/${GENRE_IDS[genre]||132}/tracks?limit=20`;
        const json = await proxyFetch(deezerUrl);
        const data = (typeof json === "string" ? JSON.parse(json) : json);
        setChartTracks((data.data||[]).map((t,i)=>({
          id:t.id, title:t.title,
          artist:t.artist?.name||"",
          albumArt:t.album?.cover_medium||"",
          link:t.link||"",
          preview:t.preview||"",
          source:"deezer", rank:i+1,
        })));
      }
      setChartLoaded(key);
    } catch(e) {
      console.error("Chart fetch error:", e);
    }
    setChartLoading(false);
  };

  useEffect(()=>{
    if(tab==="charts") fetchCharts(chartSource, chartGenre);
  }, [tab, chartSource, chartGenre]);

  /* ── Deezer search via multi-proxy fallback ── */
  const searchMusic = async (q) => {
    if(!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`;
      const json = await proxyFetch(deezerUrl);
      const data = typeof json === "string" ? JSON.parse(json) : json;
      setSearchResults(data.data || []);
    } catch(e) {
      console.error("Music search error:", e);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const togglePreview = (track) => {
    if(!track.preview) return;
    if(preview?.id===track.id) {
      audioRef.current?.pause();
      setPreview(null);
    } else {
      if(audioRef.current) { audioRef.current.pause(); audioRef.current.src=track.preview; audioRef.current.play().catch(()=>{}); }
      setPreview(track);
    }
  };

  const addFromDeezer = (track) => {
    onAdd({
      id: uid(),
      type: "music",
      title: track.title,
      artist: track.artist?.name || "",
      albumArt: track.album?.cover_medium || track.album?.cover || "",
      link: track.link || "",
      preview: track.preview || "",
      source: "deezer",
      createdAt: today(),
    });
  };

  /* ── Link metadata fetch ── */
  const fetchLinkMeta = async (url) => {
    if(!url.trim()) return;
    setLinkFetching(true);
    setLinkPreview(null);
    try {
      // Detect platform & extract info from URL patterns
      const meta = parseMusicLink(url);
      setLinkPreview(meta);
    } catch(e) {}
    setLinkFetching(false);
  };

  const parseMusicLink = (url) => {
    const u = url.toLowerCase();
    let platform = "Müzik";
    let icon = "🎵";
    let color = "#1DB954";

    if(u.includes("spotify.com")) { platform="Spotify"; icon="🟢"; color="#1DB954"; }
    else if(u.includes("youtube.com")||u.includes("youtu.be")) { platform="YouTube"; icon="🔴"; color="#FF0000"; }
    else if(u.includes("soundcloud.com")) { platform="SoundCloud"; icon="🟠"; color="#FF5500"; }
    else if(u.includes("apple.com/music")||u.includes("music.apple")) { platform="Apple Music"; icon="⚪"; color="#FC3C44"; }
    else if(u.includes("deezer.com")) { platform="Deezer"; icon="🟣"; color="#A238FF"; }
    else if(u.includes("tidal.com")) { platform="Tidal"; icon="🔵"; color="#00FEEE"; }

    // Try to extract title from URL path
    let title = url.split("/").filter(Boolean).pop()?.replace(/-/g," ")?.replace(/\?.*/,"") || "Yeni parça";
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { url, platform, icon, color, title };
  };

  const addFromLink = () => {
    if(!linkPreview && !linkInput.trim()) return;
    const meta = linkPreview || parseMusicLink(linkInput);
    onAdd({
      id: uid(),
      type: "music",
      title: meta.title,
      artist: "",
      albumArt: "",
      link: linkInput || meta.url,
      preview: "",
      source: "link",
      platform: meta.platform,
      platformColor: meta.color,
      createdAt: today(),
    });
    setLinkInput("");
    setLinkPreview(null);
    setTab("collection");
  };

  const isInCollection = (deezerTrackId) => items.some(i=>i.deezerTrackId===String(deezerTrackId));

  const platformColor = (item) => {
    if(item.source==="deezer") return "#A238FF";
    return item.platformColor || "#1DB954";
  };

  const platformIcon = (item) => {
    if(item.source==="deezer") return "🎵";
    const u=(item.link||"").toLowerCase();
    if(u.includes("spotify"))return "🟢";
    if(u.includes("youtube")||u.includes("youtu.be"))return "🔴";
    if(u.includes("soundcloud"))return "🟠";
    if(u.includes("apple"))return "⚪";
    return "🎵";
  };

  return (
    <div>
      <audio ref={audioRef} onEnded={()=>setPreview(null)} style={{display:"none"}}/>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <span style={{fontSize:22}}>🎵</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
          <span style={{fontSize:12,opacity:.4}}>{items.length} parça</span>
        </div>
        {/* Tab switcher — 4 tabs */}
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",borderRadius:12,padding:3,display:"flex",gap:1}}>
          {[["collection","Benim"],["charts","Top 🏆"],["search","Ara"],["link","Link"]].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1,padding:"8px 2px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:tab===k?700:500,
              background:tab===k?"rgba(255,255,255,0.12)":"transparent",
              color:tab===k?"#e0e0e0":"#666",transition:"all .2s",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {/* ── COLLECTION ── */}
      {tab==="collection"&&(
        items.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:44,marginBottom:10}}>🎵</div>
            <div style={{fontSize:15,fontWeight:700,opacity:.5,marginBottom:6}}>Koleksiyonun boş</div>
            <div style={{fontSize:12,opacity:.3,marginBottom:20}}>Deezer'dan ara veya link yapıştır</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>setTab("search")} style={{background:"rgba(162,56,255,0.15)",color:"#a238ff",border:"1px solid rgba(162,56,255,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔍 Deezer'da Ara</button>
              <button onClick={()=>setTab("link")} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔗 Link Ekle</button>
            </div>
          </div>
        ) : (
          items.map(item=>(
            <div key={item.id} style={{
              ...cardStyle,padding:"12px 14px",marginBottom:8,
              display:"flex",alignItems:"center",gap:12,minHeight:64,
            }}>
              {/* Album art or placeholder */}
              <div style={{
                width:48,height:48,borderRadius:10,flexShrink:0,overflow:"hidden",
                background:item.albumArt?"#000":"rgba(162,56,255,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {item.albumArt
                  ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:22}}>🎵</span>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                {item.artist&&<div style={{fontSize:12,opacity:.5,marginTop:2}}>{item.artist}</div>}
                <div style={{fontSize:11,opacity:.35,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  <span>{platformIcon(item)}</span>
                  <span>{item.platform||item.source||"Müzik"}</span>
                </div>
              </div>
              {/* Preview play button (Deezer tracks) */}
              {item.preview&&(
                <button onClick={()=>togglePreview(item)} style={{
                  width:36,height:36,borderRadius:"50%",
                  background:preview?.id===item.id?"rgba(162,56,255,0.9)":"rgba(255,255,255,0.08)",
                  border:"none",color:"#fff",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  {preview?.id===item.id?"⏸":"▶"}
                </button>
              )}
              {/* Open link button */}
              {item.link&&(
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
                  width:36,height:36,borderRadius:"50%",
                  background:"rgba(255,255,255,0.05)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  textDecoration:"none",fontSize:14,flexShrink:0,
                }}>↗</a>
              )}
              <button onClick={()=>onDel(item.id)} style={delBtnStyle}>✕</button>
            </div>
          ))
        )
      )}

      {/* ── SEARCH (Deezer) ── */}
      {tab==="search"&&(
        <div>
          <input
            style={{...inp,marginBottom:12}}
            placeholder="🔍 Şarkı, sanatçı veya albüm ara..."
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&searchMusic(searchQ)}
          />
          <button onClick={()=>searchMusic(searchQ)} style={{...btnPrimary,marginTop:0,marginBottom:16,background:"#a238ff"}}>
            {searching?"Aranıyor...":"Deezer'da Ara"}
          </button>
          {searching&&(
            <div style={{textAlign:"center",padding:20,opacity:.4,fontSize:13}}>🎵 Aranıyor...</div>
          )}
          {!searching&&searchResults.length===0&&searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0",opacity:.4,fontSize:13}}>Sonuç bulunamadı</div>
          )}
          {!searching&&searchResults.length===0&&!searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>🎧</div>
              <div style={{fontSize:13,opacity:.4}}>Deezer veritabanında 90M+ parça</div>
              <div style={{fontSize:11,opacity:.25,marginTop:4}}>Arama yap → 30 sn önizleme dinle → Ekle</div>
            </div>
          )}
          {searchResults.map(track=>{
            const inColl = items.some(i=>i.link===track.link);
            return (
              <div key={track.id} style={{
                background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
                opacity:inColl?.6:1,
              }}>
                <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.album?.cover_medium
                    ? <img src={track.album.cover_medium} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎵</div>
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:1}}>{track.artist?.name}</div>
                  {track.preview&&(
                    <div style={{fontSize:10,color:"#a238ff",marginTop:1,opacity:.7}}>▶ 30sn önizleme var</div>
                  )}
                </div>
                {track.preview&&(
                  <button onClick={()=>togglePreview(track)} style={{
                    width:34,height:34,borderRadius:"50%",flexShrink:0,
                    background:preview?.id===track.id?"#a238ff":"rgba(162,56,255,0.15)",
                    border:"1px solid rgba(162,56,255,0.3)",
                    color:preview?.id===track.id?"#fff":"#a238ff",
                    fontSize:13,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{preview?.id===track.id?"⏸":"▶"}</button>
                )}
                <button onClick={()=>{if(!inColl)addFromDeezer(track);}} style={{
                  width:34,height:34,borderRadius:"50%",flexShrink:0,
                  background:inColl?"rgba(34,197,94,0.15)":"rgba(162,56,255,0.15)",
                  border:inColl?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(162,56,255,0.3)",
                  color:inColl?"#22c55e":"#a238ff",
                  fontSize:inColl?14:18,cursor:inColl?"default":"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{inColl?"✓":"+"}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LINK ── */}
      {tab==="link"&&(
        <div>
          <div style={{fontSize:12,opacity:.5,marginBottom:8,lineHeight:1.5}}>
            Spotify, YouTube, SoundCloud, Apple Music veya herhangi bir müzik linkini yapıştır.
          </div>
          <input
            style={inp}
            placeholder="https://open.spotify.com/track/..."
            value={linkInput}
            onChange={e=>{setLinkInput(e.target.value);setLinkPreview(null);}}
            onBlur={()=>linkInput&&fetchLinkMeta(linkInput)}
          />
          {/* Platform icons */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {name:"Spotify",color:"#1DB954",icon:"🟢"},
              {name:"YouTube",color:"#FF0000",icon:"🔴"},
              {name:"SoundCloud",color:"#FF5500",icon:"🟠"},
              {name:"Apple Music",color:"#FC3C44",icon:"⚪"},
              {name:"Deezer",color:"#A238FF",icon:"🟣"},
            ].map(p=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"4px 10px",fontSize:11,opacity:.6}}>
                <span>{p.icon}</span><span>{p.name}</span>
              </div>
            ))}
          </div>

          {/* Link preview card */}
          {linkFetching&&<div style={{textAlign:"center",opacity:.4,fontSize:13,padding:12}}>Kontrol ediliyor...</div>}
          {linkPreview&&(
            <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontSize:11,opacity:.5,marginBottom:4}}>{linkPreview.icon} {linkPreview.platform}</div>
              <div style={{fontSize:14,fontWeight:700}}>{linkPreview.title}</div>
            </div>
          )}

          {/* Title override */}
          <input
            style={inp}
            placeholder="Parça adı (opsiyonel, otomatik doldurulamadıysa)"
            value={linkPreview?.title||""}
            onChange={e=>setLinkPreview(lp=>lp?{...lp,title:e.target.value}:{title:e.target.value,url:linkInput,platform:"Müzik",color:"#888"})}
          />

          <button onClick={addFromLink} disabled={!linkInput.trim()} style={{
            ...btnPrimary,marginTop:0,
            background:linkInput.trim()?"#3b82f6":"#333",
            opacity:linkInput.trim()?1:.5,
          }}>Koleksiyona Ekle</button>

          <div style={{marginTop:16,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.4,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Nasıl kullanılır?</div>
            <div style={{fontSize:11,opacity:.4,lineHeight:1.7}}>
              1. Spotify'dan bir parça aç → 3 nokta → "Paylaş" → "Linki kopyala"<br/>
              2. Yukarıdaki kutuya yapıştır<br/>
              3. "Koleksiyona Ekle" ye bas
            </div>
          </div>
        </div>
      )}

      {/* ── CHARTS ── */}
      {tab==="charts"&&(
        <div>
          {/* Source selector */}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[["tr","🇹🇷 Türkiye"],["global","🌍 Global"],["genre","🎸 Tür"]].map(([k,v])=>(
              <button key={k} onClick={()=>setChartSource(k)} style={{
                flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",
                fontSize:12,fontWeight:chartSource===k?700:500,
                background:chartSource===k?"rgba(162,56,255,0.25)":"rgba(255,255,255,0.05)",
                color:chartSource===k?"#c084fc":"#666",
                transition:"all .2s",
              }}>{v}</button>
            ))}
          </div>

          {/* Genre picker — only when source=genre */}
          {chartSource==="genre"&&(
            <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
              {Object.entries(GENRE_LABELS).map(([k,v])=>(
                <button key={k} onClick={()=>setChartGenre(k)} style={{
                  padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",
                  fontSize:12,fontWeight:chartGenre===k?700:400,
                  background:chartGenre===k?"rgba(162,56,255,0.25)":"rgba(255,255,255,0.05)",
                  color:chartGenre===k?"#c084fc":"#666",
                }}>{v}</button>
              ))}
            </div>
          )}

          {/* Source label */}
          <div style={{fontSize:11,opacity:.4,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <span>
              {chartSource==="tr"&&"🍎 Apple Music Türkiye · Güncel Top 25"}
              {chartSource==="global"&&"🟣 Deezer Global · Top 25 · 30sn önizleme"}
              {chartSource==="genre"&&`🟣 Deezer ${GENRE_LABELS[chartGenre]} Listesi · 30sn önizleme`}
            </span>
          </div>

          {/* Loading */}
          {chartLoading&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8,animation:"pulse 1.5s ease-in-out infinite"}}>🎵</div>
              <div style={{fontSize:13,opacity:.4}}>Liste yükleniyor...</div>
            </div>
          )}

          {/* Track list */}
          {!chartLoading&&chartTracks.map((track,i)=>{
            const inColl = items.some(it=>it.link===track.link||it.title===track.title);
            return (
              <div key={track.id||i} style={{
                background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
              }}>
                {/* Rank */}
                <div style={{
                  width:26,height:26,borderRadius:8,flexShrink:0,
                  background:i<3?"rgba(162,56,255,0.2)":"rgba(255,255,255,0.04)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:700,
                  color:i<3?"#c084fc":"#666",
                }}>{i+1}</div>
                {/* Album art */}
                <div style={{width:42,height:42,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.albumArt
                    ? <img src={track.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎵</div>
                  }
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.artist}</div>
                  {track.preview&&<div style={{fontSize:10,color:"#a238ff",opacity:.7,marginTop:1}}>▶ önizleme</div>}
                </div>
                {/* Preview button */}
                {track.preview&&(
                  <button onClick={()=>togglePreview(track)} style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:preview?.id===track.id?"#a238ff":"rgba(162,56,255,0.15)",
                    border:"1px solid rgba(162,56,255,0.3)",
                    color:preview?.id===track.id?"#fff":"#a238ff",
                    fontSize:12,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{preview?.id===track.id?"⏸":"▶"}</button>
                )}
                {/* Open link (iTunes tracks) */}
                {track.link&&!track.preview&&(
                  <a href={track.link} target="_blank" rel="noopener noreferrer" style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:"rgba(255,255,255,0.05)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    textDecoration:"none",fontSize:13,color:"#aaa",
                  }}>↗</a>
                )}
                {/* Add to collection */}
                <button onClick={()=>{
                  if(!inColl) onAdd({
                    id:uid(),type:"music",
                    title:track.title,artist:track.artist,
                    albumArt:track.albumArt,link:track.link,
                    preview:track.preview,
                    source:track.source==="itunes"?"itunes":"deezer",
                    platform:track.source==="itunes"?"Apple Music":"Deezer",
                    platformColor:track.source==="itunes"?"#FC3C44":"#A238FF",
                    createdAt:today(),
                  });
                }} style={{
                  width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background:inColl?"rgba(34,197,94,0.15)":"rgba(162,56,255,0.15)",
                  border:inColl?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(162,56,255,0.3)",
                  color:inColl?"#22c55e":"#a238ff",
                  fontSize:inColl?13:18,cursor:inColl?"default":"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{inColl?"✓":"+"}</button>
              </div>
            );
          })}

          {!chartLoading&&chartTracks.length===0&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>📡</div>
              <div style={{fontSize:13,opacity:.4}}>Liste yüklenemedi</div>
              <div style={{fontSize:11,opacity:.25,marginTop:4}}>İnternet bağlantını kontrol et</div>
              <button onClick={()=>{setChartLoaded("");fetchCharts(chartSource,chartGenre);}} style={{
                marginTop:12,background:"rgba(162,56,255,0.15)",color:"#a238ff",
                border:"1px solid rgba(162,56,255,0.3)",borderRadius:10,
                padding:"8px 20px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>Tekrar Dene</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ═══════════ BENİM STİLİM ODASI ═══════════ */
const WMO_TR={0:"Açık",1:"Çoğunlukla açık",2:"Kısmen bulutlu",3:"Bulutlu",45:"Sisli",61:"Hafif yağmurlu",63:"Orta yağmurlu",65:"Şiddetli yağmurlu",71:"Hafif karlı",80:"Hafif sağanak",95:"Gök gürültülü"};
function getStyleHint(t){if(t<8)return"Kalın katmanlar, kaşmir ve palto zamanı";if(t<14)return"Ceket veya trençkot — katmanlı kombinler";if(t<18)return"Uzun kollu + hafif ceket, mükemmel geçiş havası";if(t<23)return"İnce kazak veya gömlek — konfor bölgesi";if(t<28)return"Hafif kumaşlar, nefes alan renkler";return"Yazlık kombinler, pamuklu ve keten öncelik";}
function getWeatherLooks(t){if(t<14)return[{icon:"coat",name:"Katmanlı Şık",tags:[{l:"İş",c:"work"},{l:"Serin",c:"cool"}],mood:"Özgüvenli & Profesyonel"},{icon:"scarf",name:"Casual Layered",tags:[{l:"Günlük",c:"casual"},{l:"Serin",c:"cool"}],mood:"Rahat & Sıcak"},{icon:"smart",name:"Smart Cozy",tags:[{l:"Zarif",c:"elegant"}],mood:"Huzurlu & Güçlü"}];if(t<23)return[{icon:"coat",name:"Business Classic",tags:[{l:"İş",c:"work"},{l:"Zarif",c:"elegant"}],mood:"Özgüvenli"},{icon:"dress",name:"Smart Casual",tags:[{l:"Günlük",c:"casual"}],mood:"Rahat & Şık"},{icon:"smart",name:"Minimalist",tags:[{l:"Sade",c:"casual"}],mood:"Güçlü & Net"}];return[{icon:"dress",name:"Summer Chic",tags:[{l:"Günlük",c:"casual"},{l:"Yaz",c:"warm"}],mood:"Enerjik & Hafif"},{icon:"linen",name:"Linen Look",tags:[{l:"Zarif",c:"elegant"},{l:"Yaz",c:"warm"}],mood:"Doğal & Serin"},{icon:"smart",name:"Minimalist",tags:[{l:"Sade",c:"casual"}],mood:"Güçlü & Özgür"}];}
function ClothingIcon({type,size=28,color="#a78bfa"}){const s=size;
  if(type==="coat"||type==="blazer")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/></svg>);
  if(type==="dress")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M12 4L20 4L22 12L26 28L6 28L10 12Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><line x1="12" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="scarf")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><path d="M13 7 Q16 9 19 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>);
  if(type==="bottom")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M6 4L26 4L24 28L18 28L16 18L14 28L8 28Z" stroke={color} strokeWidth="1.5" fill={color+"15"} strokeLinejoin="round"/><line x1="6" y1="4" x2="26" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="linen")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><line x1="12" y1="18" x2="20" y2="18" stroke={color} strokeWidth="1" opacity=".4"/></svg>);
  return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><path d="M16 8L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/></svg>);
}
const CLOTH_CATS=[{id:"top",label:"Üst Giyim",color:"#6366f1",svgType:"smart"},{id:"alt",label:"Alt Giyim",color:"#a78bfa",svgType:"bottom"},{id:"dis",label:"Dış Giyim",color:"#3b82f6",svgType:"coat"},{id:"elbise",label:"Elbise/Etek",color:"#ec4899",svgType:"dress"}];
const CLOTH_FREQ={favorite:{bg:"rgba(34,197,94,0.15)",border:"rgba(34,197,94,0.3)",text:"#86efac",label:"Favori"},frequent:{bg:"rgba(99,102,241,0.15)",border:"rgba(99,102,241,0.3)",text:"#a5b4fc",label:"Sık"},waiting:{bg:"rgba(239,68,68,0.15)",border:"rgba(239,68,68,0.3)",text:"#fca5a5",label:"Bekliyor"},new:{bg:"rgba(167,139,250,0.15)",border:"rgba(167,139,250,0.3)",text:"#c4b5fd",label:"Yeni"}};
const TAG_COL={work:{bg:"rgba(59,130,246,0.2)",text:"#93c5fd"},casual:{bg:"rgba(34,197,94,0.2)",text:"#86efac"},elegant:{bg:"rgba(168,85,247,0.2)",text:"#d8b4fe"},warm:{bg:"rgba(249,115,22,0.2)",text:"#fdba74"},cool:{bg:"rgba(99,102,241,0.15)",text:"#a5b4fc"}};
const PALETTE_COLS=[{hex:"#c8b8a2",name:"Bej"},{hex:"#9fa8a3",name:"Gri"},{hex:"#1e3a5f",name:"Lacivert"},{hex:"#3d3d3d",name:"Antrasit"},{hex:"#f5f0e8",name:"Krem"},{hex:"#8b7355",name:"Kahve"},{hex:"#6b4c3b",name:"Terracotta"},{hex:"#2c4a3e",name:"Koyu Yeşil"}];
const DEFAULT_WARDROBE2=[{id:"w1",name:"Lacivert Blazer",cat:"dis",wornCount:3,lastWorn:"12 gün önce",freq:60,freqStatus:"frequent",color:"#1e3a5f"},{id:"w2",name:"Bej Oversize Bluz",cat:"top",wornCount:1,lastWorn:"25 gün önce",freq:20,freqStatus:"waiting",color:"#c8b8a2"},{id:"w3",name:"Antrasit Slim Pantolon",cat:"alt",wornCount:5,lastWorn:"5 gün önce",freq:85,freqStatus:"favorite",color:"#3d3d3d"},{id:"w4",name:"Beyaz Basic Tişört",cat:"top",wornCount:7,lastWorn:"2 gün önce",freq:95,freqStatus:"frequent",color:"#f5f0e8"}];
const DEFAULT_RULES2=[{id:"r1",label:"İş ortamına uygun",on:true},{id:"r2",label:"Sürdürülebilir palet",on:true},{id:"r3",label:"Bu ay yeni alım yok",on:false},{id:"r4",label:"Tekrar giymeden ekleme yok",on:true}];
const catIconMap={top:"smart",alt:"bottom",dis:"coat",elbise:"dress"};

function BenimStilimRoom({data,update,onBack}){
  const [weather,setWeather]=useState(null);
  const [wxLoad,setWxLoad]=useState(true);
  const [activeLook,setActiveLook]=useState(0);
  const [wardFilter,setWardFilter]=useState("all");
  const [addModal,setAddModal]=useState(false);
  const [addForm,setAddForm]=useState({name:"",cat:"top",color:"#c8b8a2"});
  const stilData=data.stilData||{wardrobe:DEFAULT_WARDROBE2,rules:DEFAULT_RULES2,paletteActive:[]};
  const wardrobe=stilData.wardrobe||DEFAULT_WARDROBE2;
  const rules=stilData.rules||DEFAULT_RULES2;
  const paletteActive=stilData.paletteActive||[];
  const saveStil=(patch)=>update({...data,stilData:{...stilData,...patch}});
  useEffect(()=>{
    setWxLoad(true);
    fetch("https://api.open-meteo.com/v1/forecast?latitude=41.0082&longitude=28.9784&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=Europe/Istanbul")
      .then(r=>r.json()).then(d=>{const c=d.current;setWeather({temp:Math.round(c.temperature_2m),feel:Math.round(c.apparent_temperature),humid:Math.round(c.relative_humidity_2m),wind:Math.round(c.wind_speed_10m),desc:WMO_TR[c.weather_code]||"Bilinmiyor"});}).catch(()=>setWeather(null)).finally(()=>setWxLoad(false));
  },[]);
  const looks=getWeatherLooks(weather?.temp??18);
  const freqScore=wardrobe.length===0?0:Math.round(wardrobe.filter(w=>w.freq>50).length/wardrobe.length*100);
  const filtered=wardFilter==="all"?wardrobe:wardrobe.filter(w=>w.cat===wardFilter);
  const toggleRule=(id)=>saveStil({rules:rules.map(r=>r.id===id?{...r,on:!r.on}:r)});
  const togglePalette=(hex)=>saveStil({paletteActive:paletteActive.includes(hex)?paletteActive.filter(h=>h!==hex):[...paletteActive,hex]});
  const wearCloth=(id)=>saveStil({wardrobe:wardrobe.map(w=>{if(w.id!==id)return w;const wc=(w.wornCount||0)+1;const freq=Math.min(100,(w.freq||0)+15);const fs=freq>=70?"favorite":freq>=40?"frequent":wc<=1?"new":"waiting";return{...w,wornCount:wc,lastWorn:"Bugün",freq,freqStatus:fs};})});
  const delCloth=(id)=>saveStil({wardrobe:wardrobe.filter(w=>w.id!==id)});
  const addCloth=()=>{if(!addForm.name.trim())return;const ni={id:uid(),name:addForm.name,cat:addForm.cat,wornCount:0,lastWorn:"Henüz giyilmedi",freq:0,freqStatus:"new",color:addForm.color};saveStil({wardrobe:[ni,...wardrobe]});setAddModal(false);setAddForm({name:"",cat:"top",color:"#c8b8a2"});};
  return(
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
          <div>
            <div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#e0d5f5,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Benim Stilim</div>
            <div style={{fontSize:10,opacity:.35}}>Kişisel stil & moodboard</div>
          </div>
        </div>
      </StickyHeader>
      <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.1))",border:"1px solid rgba(59,130,246,0.2)",borderRadius:16,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:10,fontWeight:700,opacity:.5,letterSpacing:1,textTransform:"uppercase"}}>Bugünün Havası</div><div style={{fontSize:12,opacity:.55,marginTop:2}}>İstanbul, Türkiye</div></div>
          <div style={{textAlign:"right"}}>{wxLoad?<div style={{fontSize:12,opacity:.4,animation:"pulse 1.5s infinite"}}>Yükleniyor...</div>:weather?<><div style={{fontSize:26,fontWeight:800,color:"#e0d5f5"}}>{weather.temp}°C</div><div style={{fontSize:11,opacity:.5}}>{weather.desc}</div></>:<div style={{fontSize:11,opacity:.4}}>Veri alınamadı</div>}</div>
        </div>
        {weather&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",gap:16}}><div style={{fontSize:10,opacity:.4}}>{weather.wind} km/s rüzgar</div><div style={{fontSize:10,opacity:.4}}>%{weather.humid} nem</div><div style={{fontSize:10,opacity:.4}}>{weather.feel}°C hissedilen</div></div>}
        <div style={{marginTop:10,background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"8px 12px"}}><div style={{fontSize:10,opacity:.45,marginBottom:3}}>Stil Önerisi</div><div style={{fontSize:13,color:"#c4b5fd",fontWeight:600}}>{wxLoad?"Hesaplanıyor...":weather?getStyleHint(weather.temp):"Hava bilgisi mevcut değil"}</div></div>
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,opacity:.4,textTransform:"uppercase",marginBottom:10}}>Bugün İçin Görünümler</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {looks.map((look,i)=>(
          <div key={i} onClick={()=>setActiveLook(i)} style={{background:activeLook===i?"rgba(167,139,250,0.1)":"rgba(255,255,255,0.04)",border:`1px solid ${activeLook===i?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.08)"}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",flex:1,minWidth:0,transition:"all .2s"}}>
            <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><ClothingIcon type={look.icon} size={26} color={activeLook===i?"#a78bfa":"#555"}/></div>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{look.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>{look.tags.map((t,ti)=><span key={ti} style={{fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:20,background:TAG_COL[t.c]?.bg,color:TAG_COL[t.c]?.text}}>{t.l}</span>)}</div>
            <div style={{fontSize:9,opacity:.4,marginTop:4,textAlign:"center"}}>{look.mood}</div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,opacity:.4,textTransform:"uppercase",marginBottom:12}}>Stil Kuralları & Sınırlar</div>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.7,marginBottom:4}}><span>Giyim Sıklığı Skoru</span><span style={{color:"#a78bfa",fontWeight:700}}>{freqScore}%</span></div>
          <div style={{height:6,borderRadius:3,background:"rgba(255,255,255,0.08)"}}><div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#6366f1,#a78bfa)",width:`${freqScore}%`,transition:"width .8s"}}/></div>
          <div style={{fontSize:10,opacity:.3,marginTop:4}}>{freqScore<50?"Dolapta bekleyen parçalar var":freqScore<80?"Optimum aralıkta":"Mükemmel, aktif dolap!"}</div>
        </div>
        {rules.map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{fontSize:13,opacity:.85}}>{r.label}</span>
            <div onClick={()=>toggleRule(r.id)} style={{width:38,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:r.on?"rgba(167,139,250,0.7)":"rgba(255,255,255,0.1)",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",width:16,height:16,borderRadius:"50%",background:"#fff",top:3,left:r.on?19:3,transition:"left .2s"}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,opacity:.4,textTransform:"uppercase",marginBottom:12}}>Renk Paleti Disiplini</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>togglePalette(p.hex)} style={{width:36,height:36,borderRadius:10,background:p.hex,cursor:"pointer",flexShrink:0,transition:"transform .15s",outline:paletteActive.includes(p.hex)?"2.5px solid rgba(167,139,250,0.9)":"none",transform:paletteActive.includes(p.hex)?"scale(1.12)":"scale(1)"}}/>))}
          <div style={{width:36,height:36,borderRadius:10,border:"1.5px dashed rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,opacity:.4,cursor:"pointer"}}>+</div>
        </div>
        <div style={{fontSize:10,opacity:.3,marginTop:8}}>{paletteActive.length===0?"Renklere dokun — aktif paletini belirle":`${paletteActive.length} renk seçili — disiplin aktif`}</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,opacity:.4,textTransform:"uppercase"}}>Dolabım</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",l:"Tümü"},{id:"top",l:"Üst"},{id:"alt",l:"Alt"},{id:"dis",l:"Dış"},{id:"elbise",l:"Elbise"}].map(f=>(
              <button key={f.id} onClick={()=>setWardFilter(f.id)} style={{background:wardFilter===f.id?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)",border:`1px solid ${wardFilter===f.id?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`,color:wardFilter===f.id?"#c4b5fd":"#555",borderRadius:20,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:wardFilter===f.id?700:400}}>{f.l}</button>
            ))}
          </div>
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"30px 0",opacity:.3,fontSize:13}}>Bu kategoride kıyafet yok</div>}
        {filtered.map(item=>{
          const fc=CLOTH_FREQ[item.freqStatus]||CLOTH_FREQ.new;
          return(
            <div key={item.id} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:44,height:44,borderRadius:12,background:(item.color||"#a78bfa")+"25",border:`1px solid ${(item.color||"#a78bfa")}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ClothingIcon type={catIconMap[item.cat]||"smart"} size={24} color={item.color||"#a78bfa"}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                <div style={{fontSize:10,opacity:.4,marginTop:2}}>{item.wornCount} kez giyildi · {item.lastWorn}</div>
                <div style={{height:5,borderRadius:3,background:"rgba(255,255,255,0.08)",marginTop:5}}><div style={{height:"100%",borderRadius:3,width:`${item.freq}%`,background:item.freqStatus==="favorite"?"linear-gradient(90deg,#22c55e,#14b8a6)":item.freqStatus==="waiting"?"linear-gradient(90deg,#f59e0b,#ef4444)":"linear-gradient(90deg,#6366f1,#a78bfa)",transition:"width .6s"}}/></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <div style={{background:fc.bg,border:`1px solid ${fc.border}`,color:fc.text,fontSize:10,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{fc.label}</div>
                <button onClick={()=>wearCloth(item.id)} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",color:"#a78bfa",fontSize:9,padding:"2px 8px",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap"}}>Bugün Giydim</button>
                <button onClick={()=>delCloth(item.id)} style={{background:"none",border:"none",color:"#444",fontSize:10,cursor:"pointer",padding:"2px 4px"}}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{height:20}}/>
      <button onClick={()=>setAddModal(true)} style={{position:"fixed",bottom:84,right:16,background:"linear-gradient(135deg,#6366f1,#a78bfa)",border:"none",borderRadius:18,padding:"12px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(99,102,241,0.5)",zIndex:100}}>
        <span style={{fontSize:18}}>+</span> Kıyafet Ekle
      </button>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="Kıyafet Ekle">
        <input style={inp} placeholder="Kıyafet adı (örn: Lacivert Blazer)" value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Kategori:</div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {CLOTH_CATS.map(c=>(<button key={c.id} onClick={()=>setAddForm({...addForm,cat:c.id})} style={{background:addForm.cat===c.id?`${c.color}25`:"rgba(255,255,255,0.04)",border:`1px solid ${addForm.cat===c.id?c.color+"60":"rgba(255,255,255,0.08)"}`,color:addForm.cat===c.id?c.color:"#777",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><ClothingIcon type={c.svgType} size={14} color={addForm.cat===c.id?c.color:"#666"}/>{c.label}</button>))}
        </div>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Kıyafet rengi:</div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>setAddForm({...addForm,color:p.hex})} style={{width:30,height:30,borderRadius:8,background:p.hex,cursor:"pointer",outline:addForm.color===p.hex?"2.5px solid #a78bfa":"none",transform:addForm.color===p.hex?"scale(1.15)":"scale(1)",transition:"all .15s"}}/>))}
        </div>
        <button style={btnPrimary} onClick={addCloth}>Dolaba Ekle</button>
      </Modal>
    </div>
  );
}
/* ═══════════ TARZIM ═══════════ */
function Projects({ data, update }) {
  const [activeRoom,setActiveRoom]=useState(null);
  const [modal,setModal]=useState(false);
  const [roomModal,setRoomModal]=useState(false);
  const [itemModal,setItemModal]=useState(false);
  const [form,setForm]=useState({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  const [roomForm,setRoomForm]=useState({name:"",icon:"📂",color:"#3b82f6"});
  const [itemForm,setItemForm]=useState({title:"",description:"",tags:""});
  const [exp,setExp]=useState(null);
  const [tf,setTf]=useState({title:""});

  const rooms = data.rooms || [...DEFAULT_ROOMS];
  const roomItems = data.roomItems || {};

  const addRoom=()=>{
    if(!roomForm.name.trim())return;
    const nr={id:uid(),...roomForm,type:"collection"};
    update({...data,rooms:[...rooms,nr]});
    setRoomModal(false);setRoomForm({name:"",icon:"📂",color:"#3b82f6"});
  };
  const delRoom=id=>{
    const newRooms=rooms.filter(r=>r.id!==id);
    const ni={...roomItems};delete ni[id];
    update({...data,rooms:newRooms,roomItems:ni});
    setActiveRoom(null);
  };
  const addItem=()=>{
    if(!itemForm.title.trim())return;
    const items=roomItems[activeRoom]||[];
    const ni={id:uid(),...itemForm,tags:itemForm.tags.split(",").map(t=>t.trim()).filter(Boolean),createdAt:today()};
    update({...data,roomItems:{...roomItems,[activeRoom]:[ni,...items]}});
    setItemModal(false);setItemForm({title:"",description:"",tags:""});
  };
  const delItem=(roomId,itemId)=>{
    const items=(roomItems[roomId]||[]).filter(i=>i.id!==itemId);
    update({...data,roomItems:{...roomItems,[roomId]:items}});
  };

  const addProject=()=>{
    if(!form.name.trim())return;
    const np={id:uid(),...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),tasks:[],createdAt:today()};
    update({...data,projects:[np,...data.projects]});
    setModal(false);setForm({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  };
  const delProject=id=>update({...data,projects:data.projects.filter(p=>p.id!==id)});
  const upSt=(id,st)=>update({...data,projects:data.projects.map(p=>p.id===id?{...p,status:st}:p)});
  const addPT=pid=>{
    if(!tf.title.trim())return;
    update({...data,projects:data.projects.map(p=>p.id===pid?{...p,tasks:[...(p.tasks||[]),{id:uid(),title:tf.title,done:false}]}:p)});
    setTf({title:""});
  };
  const togPT=(pid,tid)=>{
    update({...data,projects:data.projects.map(p=>p.id===pid?{...p,tasks:(p.tasks||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:p)});
  };
  const stCol=s=>s==="Tamamlandı"?"#22c55e":s==="Devam Ediyor"?"#3b82f6":s==="Test"?"#f59e0b":"#888";

  const roomIcons=["📂","🎵","👗","📸","🎮","📚","🎨","💼","🏠","✈️","🎯","💡","🛒","🎬","🍳"];

  /* Her oda için Unsplash fotoğrafı — id sabit, fallback gradient var */
  /* picsum.photos — seed ile sabit, hızlı, ücretsiz */
  const ROOM_PHOTOS = {
    projects: "https://picsum.photos/seed/workspace/400/220",
    news:     "https://picsum.photos/seed/newspaper/400/220",
    music:    "https://picsum.photos/seed/concert/400/220",
    clothes:  "https://picsum.photos/seed/streetfashion/400/220",
    memories: "https://picsum.photos/seed/memories/400/220",
    healthcoach: "https://picsum.photos/seed/wellness/400/220",
  };
  const KEYWORD_PHOTOS = {
    kitap:   "https://picsum.photos/seed/library/400/220",
    seyahat: "https://picsum.photos/seed/travel/400/220",
    yemek:   "https://picsum.photos/seed/food/400/220",
    spor:    "https://picsum.photos/seed/sport/400/220",
    oyun:    "https://picsum.photos/seed/gaming/400/220",
    film:    "https://picsum.photos/seed/cinema/400/220",
  };
  const getRoomPhoto = (room) => {
    if (room.photo) return room.photo; // kullanıcı kendi fotoğrafını yüklemiş
    if (ROOM_PHOTOS[room.id]) return ROOM_PHOTOS[room.id];
    const nameLower = room.name.toLowerCase();
    for (const [kw, url] of Object.entries(KEYWORD_PHOTOS)) {
      if (nameLower.includes(kw)) return url;
    }
    return null; // gradient fallback
  };

  if(!activeRoom) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Life Style</h3>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,opacity:.4}}>Kişisel alanların — odalarına dokun ve keşfet</p>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {rooms.map(room=>{
          const count=room.type==="project"?data.projects.length:(roomItems[room.id]||[]).length;
          const photo = getRoomPhoto(room);
          return (
            <div key={room.id} onClick={()=>setActiveRoom(room.id)}
              onTouchStart={e=>{e.currentTarget.style.transform="scale(0.97)";}}
              onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
              style={{
                borderRadius:20,overflow:"hidden",cursor:"pointer",
                position:"relative",minHeight:130,
                border:`1px solid ${room.color}40`,
                boxShadow:`0 0 24px ${room.color}20`,
                transition:"transform .15s, box-shadow .2s",
              }}>
              {/* Fotoğraf ya da gradient arka plan */}
              {photo ? (
                <img src={photo} alt={room.name}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  onError={e=>{e.target.style.display="none";}}
                />
              ) : (
                <div style={{position:"absolute",inset:0,background:`linear-gradient(145deg,${room.color}30,${room.color}08)`}}/>
              )}
              {/* Karartma overlay */}
              <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(160deg,rgba(8,7,26,0.15) 0%,rgba(8,7,26,0.75) 100%)",
              }}/>
              {/* Glow border efekti */}
              <div style={{
                position:"absolute",inset:0,borderRadius:20,
                boxShadow:`inset 0 0 0 1px ${room.color}35`,
              }}/>
              {/* İçerik */}
              <div style={{
                position:"relative",zIndex:1,
                padding:"12px 14px",height:"100%",minHeight:130,
                display:"flex",flexDirection:"column",justifyContent:"flex-end",
              }}>
                <div style={{fontSize:15,fontWeight:800,color:"#fff",textShadow:"0 1px 8px rgba(0,0,0,0.6)"}}>{room.name}</div>
                <div style={{fontSize:11,color:`${room.color}ee`,fontWeight:600,marginTop:3,
                  textShadow:"0 1px 4px rgba(0,0,0,0.8)"}}>{count} öğe</div>
              </div>
            </div>
          );
        })}
      </div>
      <FAB onClick={()=>setRoomModal(true)} color="#f97316"/>
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title="Yeni Oda">
        <input style={inp} placeholder="Oda adı..." value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Renk seç:</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setRoomForm({...roomForm,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:roomForm.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={addRoom}>Oluştur</button>
      </Modal>
    </div>
  );

  const room=rooms.find(r=>r.id===activeRoom);
  if(!room){setActiveRoom(null);return null;}

  if(room.type==="project"||activeRoom==="projects") return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:`${room.color}25`,border:`1px solid ${room.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:room.color,flexShrink:0}}>{room.name[0]}</div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
        </div>
      </StickyHeader>
      {data.projects.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Henüz proje yok</p>}
      {data.projects.map(p=>{
        const tasks=p.tasks||[];const d=tasks.filter(t=>t.done).length;
        const pct=tasks.length?Math.round(d/tasks.length*100):0;const open=exp===p.id;
        return (
          <div key={p.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:8}}>
            <div onClick={()=>setExp(open?null:p.id)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.tags?.map(t=><span key={t} style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
                    {p.deadline&&<span>📅 {p.deadline}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:stCol(p.status),background:`${stCol(p.status)}20`,padding:"4px 10px",borderRadius:8}}>{p.status}</span>
              </div>
              {tasks.length>0&&(<div style={{marginTop:10}}>
                <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"#3b82f6",borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/>
                </div>
                <div style={{fontSize:11,opacity:.4,marginTop:4}}>{d}/{tasks.length} — %{pct}</div>
              </div>)}
            </div>
            {open&&(<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              {p.description&&<p style={{fontSize:13,opacity:.6,margin:"0 0 10px"}}>{p.description}</p>}
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {PROJECT_STATUSES.map(s=>(<button key={s} onClick={()=>upSt(p.id,s)} style={{background:p.status===s?`${stCol(s)}20`:"rgba(255,255,255,0.04)",color:p.status===s?stCol(s):"#888",border:`1px solid ${p.status===s?stCol(s)+"40":"rgba(255,255,255,0.06)"}`,padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>{s}</button>))}
              </div>
              {tasks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                <button onClick={()=>togPT(p.id,t.id)} style={checkBtnStyle(t.done)}>{t.done&&"✓"}</button>
                <span style={{fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.4:1}}>{t.title}</span>
              </div>))}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <input style={{...inp,flex:1,marginBottom:0}} placeholder="Alt görev ekle..." value={tf.title} onChange={e=>setTf({title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addPT(p.id)}/>
                <button onClick={()=>addPT(p.id)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,padding:"0 18px",fontSize:18,cursor:"pointer"}}>+</button>
              </div>
              <button onClick={()=>delProject(p.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px",width:"100%",marginTop:12,fontSize:13,cursor:"pointer"}}>Projeyi Sil</button>
            </div>)}
          </div>
        );
      })}
      <FAB onClick={()=>setModal(true)}/>
      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Proje">
        <input style={inp} placeholder="Proje adı..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
        <input style={inp} placeholder="Açıklama..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div style={{display:"flex",gap:8}}>
          <select style={{...inp,flex:1}} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{PROJECT_STATUSES.map(s=><option key={s}>{s}</option>)}</select>
          <input style={{...inp,flex:1}} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Etiketler (virgülle ayırın)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addProject}>Oluştur</button>
      </Modal>
    </div>
  );

  const items=roomItems[activeRoom]||[];

  /* ── SPECIAL ROOM RENDERERS ── */
  if(activeRoom==="news" || room.type==="news") return <NewsRoom room={room} onBack={()=>setActiveRoom(null)} />;
  if(activeRoom==="music" || room.name==="Müziklerim") return <MusicRoom room={room} items={items} onBack={()=>setActiveRoom(null)} onAdd={(item)=>{const cur=roomItems[activeRoom]||[];update({...data,roomItems:{...roomItems,[activeRoom]:[item,...cur]}});}} onDel={(id)=>delItem(activeRoom,id)} />;
  if(activeRoom==="clothes" || room.name==="Kıyafetlerim") return <BenimStilimRoom data={data} update={update} onBack={()=>setActiveRoom(null)} />;
  if(activeRoom==="healthcoach" || room.type==="health") return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:"rgba(20,184,166,0.2)",border:"1px solid rgba(20,184,166,0.4)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21C12 21 4 15 4 9C4 5.69 6.69 3 10 3C11.5 3 12.5 4 12 4.5C12 4.5 12.5 3 14 3C17.31 3 20 5.69 20 9C20 15 12 21 12 21Z" stroke="#14b8a6" strokeWidth="1.5" fill="rgba(20,184,166,0.2)"/></svg>
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:800,background:"linear-gradient(135deg,#5eead4,#14b8a6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Sağlık Koçu</div>
            <div style={{fontSize:10,opacity:.35}}>Beslenme & spor takibi</div>
          </div>
        </div>
      </StickyHeader>
      <Sports data={data} update={update}/>
    </div>
  );

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:`${room.color}25`,border:`1px solid ${room.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:room.color,flexShrink:0}}>{room.name[0]}</div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
          <button onClick={()=>delRoom(activeRoom)} style={{background:"none",border:"none",color:"#ef4444",fontSize:11,cursor:"pointer",opacity:.5}}>Sil</button>
        </div>
      </StickyHeader>
      {items.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{margin:"0 auto 12px",display:"block",opacity:.3}}>
            <rect x="6" y="20" width="40" height="26" rx="3" stroke="#e0e0e0" strokeWidth="1.5" fill="none"/>
            <path d="M6 26 L26 33 L46 26" stroke="#e0e0e0" strokeWidth="1.5"/>
            <path d="M18 20 L18 10 L34 10 L34 20" stroke="#e0e0e0" strokeWidth="1.5" fill="none"/>
            <path d="M20 15 L32 15" stroke="#e0e0e0" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
          </svg>
          <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Bu oda boş</div>
          <div style={{fontSize:12,opacity:.25}}>+ ile öğe ekle</div>
        </div>
      )}
      {items.map(item=>(
        <div key={item.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:14,marginBottom:8,borderLeft:`3px solid ${room.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
              {item.description&&<div style={{fontSize:12,opacity:.5,marginTop:4,lineHeight:1.4}}>{item.description}</div>}
              {item.tags?.length>0&&(<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                {item.tags.map(t=><span key={t} style={{background:`${room.color}20`,color:room.color,padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
              </div>)}
            </div>
            <button onClick={()=>delItem(activeRoom,item.id)} style={delBtnStyle}>✕</button>
          </div>
          <div style={{fontSize:10,opacity:.25,marginTop:6}}>{item.createdAt}</div>
        </div>
      ))}
      <FAB onClick={()=>setItemModal(true)} color={room.color}/>
      <Modal open={itemModal} onClose={()=>setItemModal(false)} title={`${room.icon} ${room.name} — Yeni Öğe`}>
        <input style={inp} placeholder="Başlık..." value={itemForm.title} onChange={e=>setItemForm({...itemForm,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="Açıklama (opsiyonel)..." value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})}/>
        <input style={inp} placeholder="Etiketler (virgülle ayırın)" value={itemForm.tags} onChange={e=>setItemForm({...itemForm,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addItem}>Ekle</button>
      </Modal>
    </div>
  );
}

/* ═══════════ NOTES ═══════════ */
function Notes({ data, update }) {
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({title:"",content:"",color:"#3b82f6"});
  const [search,setSearch]=useState("");

  const save2=()=>{
    if(!form.title.trim())return;
    if(editing){
      update({...data,notes:data.notes.map(n=>n.id===editing?{...n,...form,updatedAt:today()}:n)});
    } else {
      update({...data,notes:[{id:uid(),...form,createdAt:today(),updatedAt:today()},...data.notes]});
    }
    setModal(false);setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});
  };
  const del=id=>update({...data,notes:data.notes.filter(n=>n.id!==id)});
  const edit=n=>{setForm({title:n.title,content:n.content,color:n.color||"#3b82f6"});setEditing(n.id);setModal(true);};

  const filtered=data.notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Notlar</h3>
          <span style={{fontSize:12,opacity:.4}}>{data.notes.length} not</span>
        </div>
        <input
          style={{...inp,marginBottom:0,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.06)"}}
          placeholder="🔍 Notlarda ara..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>📝</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>{data.notes.length===0?"Henüz not yok":"Arama sonucu bulunamadı"}</div>
            {data.notes.length===0&&<div style={{fontSize:12,opacity:.25}}>+ butonuna basarak ilk notunu yaz</div>}
          </div>
        )}
        {filtered.map(n=>(
          <div key={n.id} onClick={()=>edit(n)} style={{...cardStyle,padding:14,cursor:"pointer",borderTop:`3px solid ${n.color||"#3b82f6"}`,minHeight:100,boxShadow:`0 0 20px ${n.color||"#3b82f6"}18`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <h4 style={{margin:0,fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</h4>
              <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...delBtnStyle,fontSize:14,marginLeft:4}}>✕</button>
            </div>
            <p style={{fontSize:12,opacity:.5,margin:"8px 0 0",whiteSpace:"pre-wrap",maxHeight:70,overflow:"hidden",lineHeight:1.4}}>{n.content}</p>
            <div style={{fontSize:10,opacity:.25,marginTop:8}}>{n.updatedAt}</div>
          </div>
        ))}
      </div>
      <FAB onClick={()=>{setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});setModal(true);}} color="#14b8a6"/>
      <Modal open={modal} onClose={()=>{setModal(false);setEditing(null);}} title={editing?"Notu Düzenle":"Yeni Not"}>
        <input style={inp} placeholder="Başlık..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:140,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="İçerik yazın..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={save2}>{editing?"Güncelle":"Kaydet"}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ TASKS HUB (Görevler + Takvim + Notlar) ═══════════ */
function TasksHub({ data, update }) {
  const [subTab, setSubTab] = useState("tasks");
  return (
    <div>
      <div style={{
        display:"flex",gap:6,marginBottom:2,
        background:"rgba(6,6,17,0.7)",
        backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
        padding:"10px 4px 8px",
        borderRadius:14,
        position:"sticky",top:0,zIndex:60,
      }}>
        {[["tasks","Görevler","✓"],["calendar","Takvim","◫"],["notes","Notlar","☰"]].map(([k,v,icon])=>(
          <button key={k} onClick={()=>setSubTab(k)} style={{
            flex:1,
            background:subTab===k?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)",
            color:subTab===k?"#3b82f6":"#666",
            border:subTab===k?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
            padding:"10px 4px",borderRadius:10,fontSize:12,fontWeight:subTab===k?700:500,
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
            transition:"all .15s",
          }}>
            <span style={{fontSize:16}}>{icon}</span>
            {v}
          </button>
        ))}
      </div>
      {subTab==="tasks" && <Tasks data={data} update={update}/>}
      {subTab==="calendar" && <CalendarView data={data} update={update}/>}
      {subTab==="notes" && <Notes data={data} update={update}/>}
    </div>
  );
}

/* ═══════════ SETTINGS ═══════════ */
function Settings({ data, update, onImport, user, onLogout }) {
  const fileRef = useRef(null);
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission());
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const enableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
    if (granted) {
      update({ ...data, settings: { ...data.settings, notifications: true } });
    }
  };

  const handleExport = () => {
    exportData();
    setMsg("Yedek dosyası indirildi!");
    setTimeout(() => setMsg(""), 2000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await importData(file);
      onImport(imported);
      setMsg("Veriler başarıyla aktarıldı!");
    } catch (err) {
      setMsg("Hata: " + err.message);
    }
    setImporting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const clearAll = () => {
    if (confirm("Tüm veriler silinecek. Emin misiniz?")) {
      const empty = { tasks: [], events: [], sports: [], projects: [], notes: [], settings: data.settings };
      update(empty);
      setMsg("Tüm veriler silindi");
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const taskCount = data.tasks.length;
  const eventCount = data.events.length;
  const sportCount = data.sports.length;
  const projectCount = data.projects.length;
  const noteCount = data.notes.length;

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Ayarlar</h3>
      </StickyHeader>

      {msg && <div style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#3b82f6"}}>{msg}</div>}

      {/* User info */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>👤 Hesap</h4>
        {user ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" style={{width:40,height:40,borderRadius:"50%"}}/>
              ) : (
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#3b82f6",fontWeight:700}}>
                  {(user.displayName||user.email||"?")[0].toUpperCase()}
                </div>
              )}
              <div>
                {user.displayName && <div style={{fontSize:14,fontWeight:600}}>{user.displayName}</div>}
                <div style={{fontSize:12,opacity:.5}}>{user.email}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:12,color:"#22c55e"}}>Bulut senkronizasyon aktif</span>
            </div>
            <p style={{fontSize:11,opacity:.4,margin:"0 0 12px"}}>Veriler tüm cihazlarında otomatik senkronize edilir</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)"}}>
              Çıkış Yap
            </button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:12,color:"#f59e0b"}}>Misafir modu</span>
            </div>
            <p style={{fontSize:11,opacity:.4,margin:"0 0 12px"}}>Veriler sadece bu cihazda saklanıyor. Giriş yaparak tüm cihazlarında senkronize edebilirsin.</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"#3b82f6"}}>
              Giriş Yap / Kayıt Ol
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>🔔 Bildirimler</h4>
        {!isNotificationSupported() ? (
          <p style={{fontSize:13,opacity:.5}}>Bu tarayıcı bildirimleri desteklemiyor</p>
        ) : notifStatus === "granted" ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:13,color:"#22c55e"}}>Bildirimler aktif</span>
            </div>
            <p style={{fontSize:12,opacity:.5,margin:0}}>Etkinlik ve görev hatırlatmaları otomatik olarak gönderilecek</p>
          </div>
        ) : notifStatus === "denied" ? (
          <p style={{fontSize:13,color:"#ef4444"}}>Bildirimler engellendi. Tarayıcı ayarlarından izin verin.</p>
        ) : (
          <button onClick={enableNotif} style={{...btnPrimary,marginTop:0,background:"#22c55e"}}>Bildirimleri Aç</button>
        )}
      </div>

      {/* Data Stats */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>📊 Veri Özeti</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {l:"Görev",v:taskCount},{l:"Etkinlik",v:eventCount},
            {l:"Spor Kaydı",v:sportCount},{l:"Proje",v:projectCount},
            {l:"Not",v:noteCount},{l:"Toplam",v:taskCount+eventCount+sportCount+projectCount+noteCount},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{fontSize:13,opacity:.6}}>{s.l}</span>
              <span style={{fontSize:13,fontWeight:600}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>💾 Veri Yönetimi</h4>
        <p style={{fontSize:12,opacity:.5,margin:"0 0 12px"}}>Bilgisayarınızdan veri aktarabilir veya yedeğinizi indirebilirsiniz</p>
        <button onClick={handleExport} style={{...btnPrimary,marginTop:0,marginBottom:8,background:"#14b8a6"}}>
          📥 Yedek İndir (JSON)
        </button>
        <button onClick={()=>fileRef.current?.click()} disabled={importing} style={{...btnPrimary,marginTop:0,background:"#a855f7"}}>
          {importing ? "Aktarılıyor..." : "📤 Dosyadan Aktar (JSON)"}
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
      </div>

      {/* AI Kalori Asistanı */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>🤖 AI Kalori Asistanı</h4>
        <p style={{fontSize:12,opacity:.5,margin:"0 0 12px"}}>Yemek fotoğrafı çekerek kalori hesaplatabilirsin. Kendi AI hesabını seç ve API anahtarını gir.</p>

        {/* Provider selection */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[
            {id:"none",name:"Manuel Giriş",desc:"AI kullanma, kalorileri kendim girerim",icon:"✏️",color:"#888"},
            {id:"gemini",name:"Google Gemini",desc:"Ücretsiz, günde 60 istek",icon:"✨",color:"#3b82f6"},
            {id:"claude",name:"Claude (Anthropic)",desc:"En akıllı analiz, ücretli",icon:"🧠",color:"#a855f7"},
            {id:"openai",name:"OpenAI (ChatGPT)",desc:"Popüler, ücretli",icon:"🤖",color:"#22c55e"},
          ].map(p=>{
            const selected = (data.settings?.aiProvider||"none")===p.id;
            return (
              <div key={p.id} onClick={()=>update({...data,settings:{...data.settings,aiProvider:p.id}})} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,cursor:"pointer",
                background:selected?`${p.color}15`:"rgba(255,255,255,0.02)",
                border:selected?`1px solid ${p.color}40`:"1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:selected?p.color:"#ccc"}}>{p.name}</div>
                  <div style={{fontSize:10,opacity:.5}}>{p.desc}</div>
                </div>
                {selected&&<span style={{color:p.color,fontSize:16}}>●</span>}
              </div>
            );
          })}
        </div>

        {/* API Key input */}
        {data.settings?.aiProvider && data.settings.aiProvider!=="none" && (<>
          <input style={inp} type="password" placeholder="API anahtarını yapıştır..."
            value={data.settings?.aiKey||""}
            onChange={e=>update({...data,settings:{...data.settings,aiKey:e.target.value}})}/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            {data.settings?.aiKey ? (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:11,color:"#22c55e"}}>Anahtar kaydedildi</span></>
            ) : (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:11,color:"#f59e0b"}}>Anahtar gerekli</span></>
            )}
          </div>
          <div style={{fontSize:10,opacity:.3,marginBottom:10}}>🔒 Anahtarın sadece senin telefonunda saklanır, sunucuya gönderilmez</div>

          {/* Guide button */}
          <button onClick={()=>setMsg(
            data.settings.aiProvider==="gemini" ?
              "GOOGLE GEMİNİ REHBERİ:\n\n1. aistudio.google.com/apikey adresine git\n2. Gmail ile giriş yap\n3. 'Create API Key' butonuna bas\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n✅ Ücretsiz: Günde 60 istek, dakikada 15 istek\n💡 Gmail hesabın varsa 2 dakikada hazır!" :
            data.settings.aiProvider==="claude" ?
              "CLAUDE (ANTHROPİC) REHBERİ:\n\n1. console.anthropic.com adresine git\n2. Hesap oluştur (kredi kartı gerekli)\n3. API Keys → Create Key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n💰 Ücretli: İlk $5 ücretsiz kredi\n🧠 En detaylı analiz" :
              "OPENAİ (CHATGPT) REHBERİ:\n\n1. platform.openai.com adresine git\n2. Hesap oluştur veya giriş yap\n3. API Keys → Create new secret key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n💰 Ücretli: İlk $5 ücretsiz kredi\n🤖 Popüler ve güvenilir"
          )} style={{
            width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(59,130,246,0.2)",
            background:"rgba(59,130,246,0.08)",color:"#3b82f6",fontSize:13,cursor:"pointer",fontWeight:600,
          }}>
            📖 {data.settings.aiProvider==="gemini"?"Gemini":data.settings.aiProvider==="claude"?"Claude":"OpenAI"} API Anahtarı Nasıl Alınır?
          </button>
        </>)}
      </div>

      {/* Danger zone */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#ef4444"}}>⚠️ Tehlikeli Bölge</h4>
        <button onClick={clearAll} style={{...btnPrimary,marginTop:0,background:"#ef4444"}}>
          Tüm Verileri Sil
        </button>
      </div>
    </div>
  );
}

/* ═══════════ LOGIN SCREEN ═══════════ */
/* ── Nebula background shared by splash + login ── */
const NEBULA_STARS = Array.from({length:28},(_,i)=>({
  id:i,
  size: i%5===0?3:i%3===0?2:1.5,
  color: i%3===0?"#a78bfa":i%3===1?"#6366f1":"#c4b5fd",
  left: 4+((i*37)%92),
  top: 3+((i*53)%94),
  dur: 2.5+((i*17)%30)/10,
  delay: ((i*23)%30)/10,
  twinkle: i%4===0,
}));

const NEBULA_KEYFRAMES = `
  @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes starFloat {
    0%,100%{transform:translateY(0) scale(1);opacity:.7}
    50%{transform:translateY(-8px) scale(1.3);opacity:1}
  }
  @keyframes starTwinkle {
    0%,100%{opacity:.3;transform:scale(.8)}
    50%{opacity:1;transform:scale(1.4)}
  }
  @keyframes nebulaOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-18px) scale(1.08)} }
  @keyframes nebulaOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,22px) scale(1.05)} }
  @keyframes nebulaOrb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,16px) scale(1.06)} }
  @keyframes zimuGlow  { 0%,100%{filter:drop-shadow(0 0 18px rgba(167,139,250,.45))} 50%{filter:drop-shadow(0 0 36px rgba(167,139,250,.85))} }
  @keyframes lineExpand { from{width:0;opacity:0} to{width:100%;opacity:1} }
  @keyframes shimmer   { 0%,100%{opacity:.45} 50%{opacity:.9} }
  @keyframes tapBlink  { 0%,100%{opacity:.25} 50%{opacity:.55} }
  @keyframes glassIn   { from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;

function NebulaBackground({ children, style }) {
  return (
    <div style={{
      minHeight:"100dvh", background:"#08071a",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#e0e0e0", fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      position:"relative", overflow:"hidden", ...style,
    }}>
      {/* Orbs */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:420,height:420,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)",
          top:"-120px",left:"-80px",animation:"nebulaOrb1 14s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:340,height:340,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(167,139,250,0.14) 0%,transparent 70%)",
          bottom:"5%",right:"-60px",animation:"nebulaOrb2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)",
          top:"40%",left:"50%",animation:"nebulaOrb3 22s ease-in-out infinite"}}/>
      </div>
      {/* Stars */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        {NEBULA_STARS.map(s=>(
          <div key={s.id} style={{
            position:"absolute",
            width:s.size,height:s.size,borderRadius:"50%",
            background:s.color,
            boxShadow:`0 0 ${s.size*3}px ${s.color}`,
            left:`${s.left}%`,top:`${s.top}%`,
            animation:`${s.twinkle?"starTwinkle":"starFloat"} ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}/>
        ))}
      </div>
      {/* Content */}
      <div style={{position:"relative",zIndex:1,width:"100%"}}>
        {children}
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { user, error } = await signInWithGoogle();
    if (error) setError(error);
    setLoading(false);
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setError("Email ve şifre gerekli"); return; }
    setLoading(true); setError("");
    const fn = mode === "register" ? registerWithEmail : signInWithEmail;
    const { user, error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const handleSkip = () => { onLogin(null); };

  const glassInp = {
    width:"100%",
    background:"rgba(255,255,255,0.05)",
    backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
    border:"1px solid rgba(167,139,250,0.18)",
    borderRadius:14,padding:"13px 16px",color:"#e0e0e0",fontSize:15,
    marginBottom:10,outline:"none",boxSizing:"border-box",
    transition:"border-color .2s",
  };

  return (
    <NebulaBackground>
      <style>{NEBULA_KEYFRAMES}</style>
      <div style={{
        width:"100%",maxWidth:380,margin:"0 auto",padding:"24px 20px",
        animation:"fadeInUp .7s ease both",
      }}>
        {/* Title */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{
            fontSize:62,fontWeight:900,letterSpacing:-3,lineHeight:1,
            background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 35%,#6366f1 65%,#818cf8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"zimuGlow 4s ease-in-out infinite",
            display:"inline-block",
          }}>Zimu</div>

          {/* Decorative line */}
          <div style={{
            height:1,margin:"14px auto 16px",
            background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent)",
            animation:"lineExpand 1s ease .3s both",
          }}/>

          <div style={{fontSize:15,fontStyle:"italic",opacity:.7,lineHeight:1.7,letterSpacing:.3}}>
            Kendi destanını yaz.
          </div>
          <div style={{fontSize:13,fontStyle:"italic",opacity:.35,marginTop:2,letterSpacing:.2}}>
            Write your own epic.
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background:"rgba(255,255,255,0.04)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          border:"1px solid rgba(167,139,250,0.15)",
          borderRadius:24,padding:"26px 22px",
          boxShadow:"0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
          animation:"glassIn .8s ease .2s both",
        }}>
          {error && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",
              borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#f87171",textAlign:"center"}}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:14,
            border:"1px solid rgba(167,139,250,0.25)",
            background:"rgba(99,102,241,0.08)",
            color:"#e0e0e0",fontSize:15,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18,
            opacity:loading?.6:1,transition:"all .2s",
            backdropFilter:"blur(8px)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
            <span style={{fontSize:12,opacity:.35,letterSpacing:.5}}>veya</span>
            <div style={{flex:1,height:1,background:"rgba(255,255,255,0.07)"}}/>
          </div>

          <input type="email" placeholder="Email adresi" value={email}
            onChange={e=>setEmail(e.target.value)}
            style={glassInp} />
          <input type="password" placeholder="Şifre (en az 6 karakter)" value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleEmail()}
            style={glassInp} />

          <button onClick={handleEmail} disabled={loading} style={{
            width:"100%",
            background:"linear-gradient(135deg,#6366f1,#a78bfa)",
            color:"#fff",border:"none",borderRadius:14,
            padding:"14px",cursor:"pointer",fontSize:15,fontWeight:700,marginTop:4,
            boxShadow:"0 4px 24px rgba(99,102,241,0.45)",
            opacity:loading?.6:1,transition:"all .2s",letterSpacing:.3,
          }}>
            {loading ? "Bekleyin..." : mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
          </button>

          <div style={{textAlign:"center",marginTop:16}}>
            <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{
              background:"none",border:"none",color:"#a78bfa",fontSize:13,cursor:"pointer",opacity:.8,
            }}>
              {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
            </button>
          </div>
        </div>

        {/* Skip */}
        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={handleSkip} style={{
            background:"none",border:"none",color:"#555",fontSize:12,cursor:"pointer",
          }}>
            Giriş yapmadan devam et →
          </button>
          <div style={{fontSize:10,opacity:.25,marginTop:4}}>Veriler sadece bu cihazda kalır</div>
        </div>
      </div>
    </NebulaBackground>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
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
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        const skipped = localStorage.getItem('zimu-skip-login');
        if (skipped) {
          setUser(null);
        } else {
          setUser(undefined);
          setLoading(false);
        }
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

  // Splash screen — 2.5s, sonra zorla geç
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Firebase 6 saniyede cevap vermezse zorla login göster
  useEffect(() => {
    const fallback = setTimeout(() => {
      setLoading(false);
    }, 6000);
    return () => clearTimeout(fallback);
  }, []);

  // Schedule notifications
  useEffect(() => {
    if (!data) return;
    if (getNotificationPermission() === "granted") {
      scheduleEventReminders(data.events, data.settings?.reminderMinutes || 15);
      scheduleTaskReminders(data.tasks);
    }
  }, [data?.events, data?.tasks]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (isMobile) {
      window.scrollTo(0, 0);
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [tab, isMobile]);

  // Mobile scroll listener
  useEffect(() => {
    if (!isMobile) return;
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [isMobile]);

  // Desktop scroll listener
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
    if (firebaseUser === null) {
      localStorage.setItem('zimu-skip-login', 'true');
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem('zimu-skip-login');
    setUser(undefined);
    setData(null);
  };

  const allTabs = [...TABS, { id: "settings", label: "Ayarlar", icon: "⚙" }];

  // Show login screen (after splash, when not authenticated)
  if (!splash && user === undefined && !loading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (splash || loading || !data) return (
    <NebulaBackground style={{cursor:"pointer",userSelect:"none",flexDirection:"column"}}
      onClick={() => {
        setSplash(false);
        setLoading(false);
        if (!data) {
          loadData(null).then(d => setData(d)).catch(() => {
            import("./db.js").then(m => setData(m.getDefaultData ? m.getDefaultData() : {tasks:[],events:[],sports:[],projects:[],notes:[],foods:[],rooms:[],roomItems:{},settings:{},dailyThoughts:["","",""]}));
          });
        }
      }}>
      <style>{`
        ${NEBULA_KEYFRAMES}
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes checkPop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        .task-check-done { animation: checkPop .3s ease; }
      `}</style>

      {/* Center content */}
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        textAlign:"center",
        width:"100%",maxWidth:400,padding:"0 40px",minHeight:"100dvh",margin:"0 auto",
        animation:"fadeIn .6s ease both",
      }}>
        {/* Zimu title */}
        <div style={{
          fontSize:72,fontWeight:900,letterSpacing:-4,lineHeight:1,
          background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 30%,#6366f1 60%,#818cf8 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          animation:"zimuGlow 4s ease-in-out infinite",
          display:"inline-block",marginBottom:16,
        }}>Zimu</div>

        {/* Decorative line */}
        <div style={{
          height:1,width:"60%",marginBottom:20,margin:"0 auto 20px",
          background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.7),transparent)",
          animation:"lineExpand 1s ease .2s both",
        }}/>

        {/* Tagline */}
        <div style={{
          fontSize:17,fontStyle:"italic",
          color:"rgba(196,181,253,0.85)",
          letterSpacing:.4,lineHeight:1.6,
          animation:"fadeInUp .8s ease .4s both",
        }}>
          Kendi destanını yaz.
        </div>
        <div style={{
          fontSize:14,fontStyle:"italic",
          color:"rgba(167,139,250,0.45)",
          letterSpacing:.3,marginTop:4,
          animation:"fadeInUp .8s ease .55s both",
        }}>
          Write your own epic.
        </div>
      </div>

      {/* Bottom tap hint */}
      <div style={{
        position:"absolute",bottom:44,left:0,right:0,
        textAlign:"center",
        fontSize:13,color:"rgba(196,181,253,0.45)",
        letterSpacing:.5,
        animation:"tapBlink 2.5s ease-in-out infinite",
      }}>
        Devam etmek için dokun
      </div>
    </NebulaBackground>
  );

  const content = () => {
    switch(tab) {
      case "dashboard": return <Dashboard data={data} setTab={setTab} update={update}/>;
      case "tasks": return <TasksHub data={data} update={update}/>;
      case "lifestyle": return <Projects data={data} update={update}/>;
      case "settings": return <Settings data={data} update={update} onImport={d=>{setData(d);showToast("Veriler aktarıldı!")}} user={user} onLogout={handleLogout}/>;
    }
  };

  // Swipe navigation
  const tabOrder = allTabs.map(t => t.id);

  const handleTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const minSwipe = 80;
    if (Math.abs(distance) < minSwipe) return;
    const currentIndex = tabOrder.indexOf(tab);
    if (distance > 0 && currentIndex < tabOrder.length - 1) {
      setTab(tabOrder[currentIndex + 1]);
    } else if (distance < 0 && currentIndex > 0) {
      setTab(tabOrder[currentIndex - 1]);
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const NAV_HEIGHT = 64;
  const SAFE_BOTTOM = isMobile ? 20 : 0;
  const CONTENT_PAD_BOTTOM = (isMobile ? NAV_HEIGHT + SAFE_BOTTOM + 30 : NAV_HEIGHT + 24);

  const phoneContent = (
    <div style={{
      width:"100%",
      minHeight:isMobile?"100dvh":"100vh",
      background:"#060611",color:"#e0e0e0",
      fontFamily:"'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      position:"relative",
    }}>
      {/* Nebula ambient orbs — fixed position, behind content */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)",
          top:"-80px",left:"-60px",animation:"orb1 12s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:250,height:250,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(168,85,247,0.10) 0%,transparent 70%)",
          bottom:"20%",right:"-50px",animation:"orb2 15s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)",
          bottom:"-40px",left:"20%"}}/>
      </div>
      {/* Content area */}
      <div
        ref={isMobile?null:scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
        style={{
          padding:`16px ${isMobile?"16px":"clamp(16px, 5vw, 60px)"} ${CONTENT_PAD_BOTTOM}px`,
          minHeight: isMobile ? "100dvh" : "100vh",
          maxWidth: isMobile ? undefined : 800,
          margin: isMobile ? undefined : "0 auto",
        }}
      >
        {content()}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={{
          position:"fixed",
          right:16,
          bottom:NAV_HEIGHT + SAFE_BOTTOM + 70,
          width:40,height:40,
          borderRadius:"50%",
          background:"rgba(59,130,246,0.9)",
          color:"#fff",border:"none",
          fontSize:18,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
          zIndex:999,
        }}>▲</button>
      )}

      {/* Bottom nav bar */}
      <div style={{
        position:"fixed",
        bottom:0,
        left:0,right:0,
        background:"rgba(4,4,14,0.95)",
        backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        borderTop:"1px solid rgba(255,255,255,0.1)",
        display:"flex",justifyContent:"center",alignItems:"center",
        height:NAV_HEIGHT,
        paddingTop:4,
        paddingBottom:isMobile?"env(safe-area-inset-bottom, 8px)":"6px",
        paddingLeft:4,paddingRight:4,
        zIndex:1000,
      }}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",width:"100%",maxWidth:isMobile?undefined:600}}>
        {allTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?"rgba(59,130,246,0.15)":"none",
            boxShadow:tab===t.id?"0 0 20px rgba(59,130,246,0.25)":undefined,
            border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:isMobile?4:3,
            padding:isMobile?"10px 6px":"8px 12px",
            minWidth:isMobile?52:50,
            borderRadius:14,
            color:tab===t.id?"#3b82f6":"#555",
            transition:"all .15s",
            flex:1,
          }}>
            <span style={{fontSize:isMobile?22:18,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:isMobile?10:9,fontWeight:tab===t.id?700:500,letterSpacing:-.2}}>{t.label}</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes checkPop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
        .task-check-done { animation: checkPop .3s ease; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12);border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
        html, body { margin:0; padding:0; overscroll-behavior:none; background:#060611; overflow:auto; height:auto; }
        #root { height:auto; }
        select option { background:#1a1a2e; color:#e0e0e0; }
        @media(display-mode:standalone){ 
          html, body { background:#060611; overflow:auto; height:auto; }
          #root { height:auto; }
          body { padding-top: env(safe-area-inset-top); } 
        }
      `}</style>

      <Toast {...toast} />

      {isMobile ? (
        /* Mobile: full screen */
        phoneContent
      ) : (
        /* Desktop: full page, no phone frame */
        phoneContent
      )}
    </>
  );
}
