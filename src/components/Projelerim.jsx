import { useState, useEffect, useRef, useCallback } from "react";
import { saveFile, getFile, deleteFile, downloadFile, createBlobUrl } from "../fileStore";

// ─── Constants ───────────────────────────────────────────────────────
const STORAGE_KEY = "projelerim-hub-v8";

const EMOJIS = ["📋","⚡","⚖️","📱","🚀","🎯","💼","🏗️","🔬","📈","🎨","💡","🌍","🛒","📚","🔧","🎪","🏥"];

const COLORS = [
  { color: "#D85A30", gradient: "linear-gradient(135deg,#D85A30,#ff9a76)" },
  { color: "#185FA5", gradient: "linear-gradient(135deg,#185FA5,#8bb4ff)" },
  { color: "#BA7517", gradient: "linear-gradient(135deg,#BA7517,#f0d078)" },
  { color: "#1D9E75", gradient: "linear-gradient(135deg,#1D9E75,#a0e8cc)" },
  { color: "#534AB7", gradient: "linear-gradient(135deg,#534AB7,#b794f6)" },
  { color: "#D85A30", gradient: "linear-gradient(135deg,#D85A30,#f9a8d4)" },
  { color: "#1D9E75", gradient: "linear-gradient(135deg,#1D9E75,#5eead4)" },
  { color: "#BA7517", gradient: "linear-gradient(135deg,#BA7517,#fcd34d)" },
];

const MODULES = [
  { id:"strategy", name:"Strateji Planlama", icon:"🎯", color:"#534AB7", desc:"Hedef, SWOT, yol haritası", prompts:["SWOT analizi yap","Yol haritası oluştur","Önceliklendirme matrisi","Risk analizi yap"] },
  { id:"legal", name:"Hukuki Yazışma", icon:"⚖️", color:"#BA7517", desc:"Yazışma, sözleşme, ihtar", prompts:["Resmi yazışma taslağı","İhtar mektubu taslağı","Toplantı özeti","Sözleşme maddeleri"] },
  { id:"dev", name:"Yazılım Geliştirme", icon:"💻", color:"#185FA5", desc:"Kod, debug, API, mimari", prompts:["Veritabanı şeması","API endpoint planla","Bug analizi","Kod review"] },
  { id:"uiux", name:"UI/UX Tasarım", icon:"🎨", color:"#D85A30", desc:"Arayüz, akış, wireframe", prompts:["Kullanıcı akışı","Wireframe açıkla","Renk paleti","Erişilebilirlik"] },
  { id:"content", name:"İçerik Üretimi", icon:"✍️", color:"#1D9E75", desc:"Blog, sosyal medya", prompts:["Blog taslağı","Sosyal medya","E-posta şablonu","Landing page"] },
  { id:"data", name:"Veri Analizi", icon:"📊", color:"#D85A30", desc:"Rapor, grafik, veri", prompts:["Veri özeti","KPI dashboard","Trend analizi","Karşılaştırma"] },
  { id:"pm", name:"Proje Yönetimi", icon:"📋", color:"#1D9E75", desc:"Sprint, görev, timeline", prompts:["Sprint planı","Gantt chart","Meeting notları","Haftalık rapor"] },
  { id:"research", name:"Araştırma", icon:"🔍", color:"#BA7517", desc:"Pazar, rakip analizi", prompts:["Pazar araştırması","Rakip analizi","Trend raporu","Persona yaz"] },
];

const NOTE_TAGS = [
  { label: "Karar", color: "#D85A30" },
  { label: "Bilgi", color: "#185FA5" },
  { label: "Önemli", color: "#D85A30" },
  { label: "Fikir", color: "#BA7517" },
];

const DEFAULTS = [
  { id:"egura", name:"Egura", emoji:"📋", color:"#D85A30", gradient:"linear-gradient(135deg,#D85A30,#ff9a76)", desc:"Biten app için yeni başvuru kararları", status:"active", completedAt:null, lastActivity:Date.now(), tasks:[{id:1,t:"Başvuru sürecini gözden geçir",d:false,p:"high"},{id:2,t:"Başvuru kriterlerini belirle",d:false,p:"high"},{id:3,t:"Karar matrisi oluştur",d:false,p:"medium"},{id:4,t:"Başvuru formu hazırla",d:false,p:"low"}], notes:[], files:[], sessions:[] },
  { id:"zibu", name:"Zibu", emoji:"⚡", color:"#185FA5", gradient:"linear-gradient(135deg,#185FA5,#8bb4ff)", desc:"App tamamlama", status:"active", completedAt:null, lastActivity:Date.now()-60000, tasks:[{id:1,t:"Kalan modülleri listele",d:false,p:"high"},{id:2,t:"UI/UX düzeltmeleri",d:false,p:"medium"},{id:3,t:"Test yazımı",d:false,p:"medium"},{id:4,t:"Deploy hazırlığı",d:false,p:"low"}], notes:[], files:[], sessions:[] },
  { id:"finland", name:"Finland", emoji:"⚖️", color:"#BA7517", gradient:"linear-gradient(135deg,#BA7517,#f0d078)", desc:"Hukuki ticari anlaşmazlık çözümü", status:"active", completedAt:null, lastActivity:Date.now()-120000, tasks:[{id:1,t:"Anlaşmazlık özetini hazırla",d:false,p:"high"},{id:2,t:"Hukuki belgeleri topla",d:false,p:"high"},{id:3,t:"Strateji seçenekleri belirle",d:false,p:"high"},{id:4,t:"Yazışma taslakları oluştur",d:false,p:"medium"}], notes:[], files:[], sessions:[] },
  { id:"dudu", name:"Dudu", emoji:"📱", color:"#1D9E75", gradient:"linear-gradient(135deg,#1D9E75,#a0e8cc)", desc:"App uygulamasını tamamlama", status:"active", completedAt:null, lastActivity:Date.now()-180000, tasks:[{id:1,t:"Mevcut durumu değerlendir",d:false,p:"high"},{id:2,t:"Eksik özellikleri kodla",d:false,p:"medium"},{id:3,t:"Hata düzeltmeleri",d:false,p:"medium"},{id:4,t:"Yayın öncesi test",d:false,p:"low"}], notes:[], files:[], sessions:[] },
];

// ─── Helpers ─────────────────────────────────────────────────────────
function fileIcon(name) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const map = { pdf:"📕",doc:"📄",docx:"📄",txt:"📄",rtf:"📄",xls:"📊",xlsx:"📊",csv:"📊",ppt:"📽️",pptx:"📽️",jpg:"🖼️",jpeg:"🖼️",png:"🖼️",gif:"🖼️",svg:"🖼️",webp:"🖼️",mp4:"🎬",mov:"🎬",avi:"🎬",mkv:"🎬",mp3:"🎵",wav:"🎵",zip:"📦",rar:"📦","7z":"📦",js:"💻",ts:"💻",py:"💻",html:"💻",css:"💻",jsx:"💻",json:"💻",eml:"📧",psd:"🎨",ai:"🎨",fig:"🎨" };
  return map[ext] || "📄";
}

function fileSizeFmt(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function genId() { return Math.random().toString(36).slice(2, 8); }
function now() { return new Date().toLocaleString("tr-TR"); }
function timeAgo(ts) {
  if (!ts) return "";
  const d = Date.now() - ts;
  if (d < 60000) return "Az önce";
  if (d < 3600000) return Math.floor(d / 60000) + " dk önce";
  if (d < 86400000) return Math.floor(d / 3600000) + " saat önce";
  return Math.floor(d / 86400000) + " gün önce";
}

const priorityIcon = { high: "🔴", medium: "🟡", low: "🟢" };

// ─── Styles ──────────────────────────────────────────────────────────
const css = `

.plm * { box-sizing: border-box; margin: 0; padding: 0; }
.plm {
  font-family: 'DM Sans', -apple-system, 'SF Pro Display', sans-serif;
  color: #1a1a2e;
}

/* ── Animations ── */
@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }

.plm .fade-in { animation: fadeIn .4s ease both; }
.plm .slide-up { animation: slideUp .5s ease both; }

/* ── Stats Row ── */
.plm .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px; }
.plm .stat-card {
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px;
  padding: 16px;
  text-align: center;
  transition: transform .2s, border-color .2s;
}
.plm .stat-card:hover { transform: translateY(-2px); border-color: rgba(0,0,0,0.1); }
.plm .stat-card .num { font-size: 28px; font-weight: 700; }
.plm .stat-card .lbl { font-size: 12px; color: #8B8578; margin-top: 4px; }

/* ── Header ── */
.plm .page-hdr { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.plm .page-hdr h1 { font-size: 26px; font-weight: 700; }
.plm .hdr-btns { display: flex; gap: 8px; }
.plm .btn {
  background: rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.08);
  color: #1a1a2e;
  padding: 8px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: all .2s;
  white-space: nowrap;
}
.plm .btn:hover { background: rgba(0,0,0,0.08); transform: translateY(-1px); }
.plm .btn-primary { background: #185FA5; border-color: #185FA5; color: #fff; }
.plm .btn-primary:hover { background: #4a7de0; }
.plm .btn-danger { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.3); color: #D85A30; }
.plm .btn-danger:hover { background: rgba(239,68,68,0.25); }
.plm .btn-sm { padding: 5px 10px; font-size: 12px; }

/* ── Project Cards Grid ── */
.plm .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }
.plm .pcard {
  background: rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: transform .25s, box-shadow .25s;
  animation: fadeIn .4s ease both;
}
.plm .pcard:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
.plm .pcard-top { padding: 20px; position: relative; min-height: 100px; display: flex; flex-direction: column; justify-content: flex-end; }
.plm .pcard-emoji { font-size: 32px; margin-bottom: 8px; }
.plm .pcard-name { font-size: 18px; font-weight: 700; color: #fff; }
.plm .pcard-desc { font-size: 12px; color: rgba(255,255,255,0.75); margin-top: 4px; }
.plm .pcard-bottom { padding: 14px 20px; background: rgba(0,0,0,0.05); }
.plm .progress-bar { height: 6px; background: rgba(0,0,0,0.08); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.plm .progress-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
.plm .pcard-meta { font-size: 11px; color: #8B8578; display: flex; justify-content: space-between; }
.plm .pcard-sessions { margin-top: 8px; font-size: 10px; color: #8B8578; }
.plm .pcard-sessions div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── Add Card ── */
.plm .add-card {
  border: 2px dashed rgba(0,0,0,0.08);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  cursor: pointer;
  font-size: 40px;
  color: #8B8578;
  transition: all .2s;
}
.plm .add-card:hover { border-color: rgba(0,0,0,0.2); color: #8B8578; transform: translateY(-2px); }

/* ── Completed Section ── */
.plm .completed-section { opacity: 0.5; margin-top: 16px; }
.plm .completed-section:hover { opacity: 0.75; }
.plm .section-title { font-size: 14px; font-weight: 600; color: #8B8578; margin-bottom: 12px; }

/* ── Modal ── */
.plm .overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn .2s ease;
}
.plm .modal {
  background: #FFFFFF; border: 1px solid rgba(0,0,0,0.05);
  border-radius: 20px; padding: 28px; width: 100%; max-width: 520px;
  max-height: 90vh; overflow-y: auto; animation: slideUp .3s ease;
}
.plm .modal h2 { font-size: 20px; margin-bottom: 20px; }
.plm .modal label { display: block; font-size: 12px; color: #8B8578; margin-bottom: 6px; margin-top: 16px; }
.plm .modal input, .plm .modal textarea {
  width: 100%; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px; padding: 10px 14px; color: #1a1a2e; font-family: inherit; font-size: 14px;
  outline: none; transition: border-color .2s;
}
.plm .modal input:focus, .plm .modal textarea:focus { border-color: #185FA5; }
.plm .modal textarea { resize: vertical; min-height: 60px; }

.plm .emoji-grid { display: flex; flex-wrap: wrap; gap: 6px; }
.plm .emoji-opt {
  width: 40px; height: 40px; border-radius: 10px; border: 2px solid transparent;
  background: rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: center;
  font-size: 20px; cursor: pointer; transition: all .15s;
}
.plm .emoji-opt:hover { background: rgba(0,0,0,0.08); }
.plm .emoji-opt.sel { border-color: #185FA5; background: rgba(91,141,239,0.15); }

.plm .color-grid { display: flex; gap: 8px; flex-wrap: wrap; }
.plm .color-opt {
  width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  border: 3px solid transparent; transition: all .15s;
}
.plm .color-opt:hover { transform: scale(1.15); }
.plm .color-opt.sel { border-color: #fff; box-shadow: 0 0 12px rgba(255,255,255,0.3); }

.plm .preview-card {
  background: rgba(0,0,0,0.03); border-radius: 14px; overflow: hidden; margin-top: 20px;
}
.plm .preview-top { padding: 16px; min-height: 60px; display: flex; align-items: center; gap: 10px; }
.plm .preview-bottom { padding: 10px 16px; background: rgba(0,0,0,0.05); font-size: 12px; color: #8B8578; }

.plm .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

/* ── Detail Page ── */
.plm .detail-hdr {
  border-radius: 18px; padding: 28px; margin-bottom: 20px; position: relative;
}
.plm .detail-hdr .emoji { font-size: 40px; }
.plm .detail-hdr h1 { font-size: 28px; color: #fff; margin-top: 8px; }
.plm .detail-hdr .desc { color: rgba(255,255,255,0.8); margin-top: 6px; font-size: 14px; }
.plm .detail-btns { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }

.plm .back-btn { background: none; border: none; color: #8B8578; cursor: pointer; font-size: 14px; margin-bottom: 12px; font-family: inherit; }
.plm .back-btn:hover { color: #1a1a2e; }

/* ── Tabs ── */
.plm .tabs { display: flex; gap: 4px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; }
.plm .tab {
  padding: 8px 14px; border-radius: 10px; font-size: 13px; cursor: pointer;
  background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);
  color: #8B8578; white-space: nowrap; font-family: inherit; transition: all .2s;
}
.plm .tab:hover { background: rgba(0,0,0,0.05); color: #1a1a2e; }
.plm .tab.active { background: rgba(0,0,0,0.08); color: #fff; border-color: rgba(0,0,0,0.1); }

/* ── Claude Box ── */
.plm .claude-box {
  background: rgba(91,141,239,0.08); border: 1px solid rgba(91,141,239,0.2);
  border-radius: 14px; padding: 16px; margin-bottom: 20px;
  display: flex; gap: 10px; align-items: center;
}
.plm .claude-box input { flex: 1; }
.plm .claude-box .btn { flex-shrink: 0; }

/* ── Tasks ── */
.plm .task-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: rgba(0,0,0,0.03); border-radius: 10px; margin-bottom: 6px;
  transition: background .15s;
}
.plm .task-item:hover { background: rgba(0,0,0,0.06); }
.plm .task-item input[type="checkbox"] { width: 18px; height: 18px; accent-color: #185FA5; cursor: pointer; }
.plm .task-item .task-text { flex: 1; font-size: 14px; }
.plm .task-item .task-text.done { text-decoration: line-through; opacity: 0.5; }
.plm .task-item .pri { font-size: 12px; }
.plm .task-item .del { background: none; border: none; color: #8B8578; cursor: pointer; font-size: 16px; }
.plm .task-item .del:hover { color: #D85A30; }

.plm .add-row { display: flex; gap: 8px; margin-top: 12px; }
.plm .add-row input { flex: 1; }
.plm .add-row select {
  background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08);
  color: #1a1a2e; border-radius: 10px; padding: 8px; font-family: inherit; outline: none;
}

/* ── Notes ── */
.plm .note-card {
  background: rgba(0,0,0,0.03); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
  border-left: 3px solid;
}
.plm .note-card .note-tag { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 6px; }
.plm .note-card .note-text { font-size: 14px; line-height: 1.5; }
.plm .note-card .note-date { font-size: 11px; color: #8B8578; margin-top: 6px; }
.plm .note-card .note-del { float: right; background: none; border: none; color: #8B8578; cursor: pointer; }

/* ── Files ── */
.plm .drop-zone {
  border: 2px dashed rgba(0,0,0,0.1); border-radius: 14px;
  padding: 40px; text-align: center; color: #8B8578; cursor: pointer;
  transition: all .2s; margin-bottom: 16px;
}
.plm .drop-zone:hover, .plm .drop-zone.over { border-color: #185FA5; color: #185FA5; background: rgba(91,141,239,0.05); }
.plm .file-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px;
  background: rgba(0,0,0,0.03); border-radius: 10px; margin-bottom: 6px;
}
.plm .file-item .file-icon { font-size: 24px; }
.plm .file-item .file-info { flex: 1; }
.plm .file-item .file-name { font-size: 14px; }
.plm .file-item .file-meta { font-size: 11px; color: #8B8578; }

/* ── Sessions ── */
.plm .session-item {
  background: rgba(0,0,0,0.03); border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;
}
.plm .session-item .s-prompt { font-size: 13px; line-height: 1.4; }
.plm .session-item .s-date { font-size: 11px; color: #8B8578; margin-top: 4px; }

/* ── Modules ── */
.plm .mod-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.plm .mod-card {
  background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06);
  border-radius: 14px; padding: 16px; cursor: pointer; transition: all .2s;
}
.plm .mod-card:hover { transform: translateY(-2px); border-color: rgba(0,0,0,0.1); }
.plm .mod-card .mod-icon { font-size: 28px; margin-bottom: 8px; }
.plm .mod-card .mod-name { font-size: 14px; font-weight: 600; }
.plm .mod-card .mod-desc { font-size: 12px; color: #8B8578; margin-top: 4px; }

.plm .mod-prompts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.plm .mod-prompt-btn {
  padding: 8px 14px; border-radius: 10px; font-size: 13px; cursor: pointer;
  border: 1px solid rgba(0,0,0,0.08); background: rgba(0,0,0,0.03);
  color: #1a1a2e; font-family: inherit; transition: all .2s;
}
.plm .mod-prompt-btn:hover { background: rgba(0,0,0,0.08); transform: translateY(-1px); }

/* ── Toast ── */
.plm .toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: #2C2A26; color: #fff; padding: 12px 24px; border-radius: 12px;
  font-size: 13px; z-index: 2000; animation: slideUp .3s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}

/* ── Manual file add ── */
.plm details { margin-top: 12px; }
.plm summary { cursor: pointer; color: #8B8578; font-size: 13px; }
.plm summary:hover { color: #1a1a2e; }
`;

// ─── Main Component ──────────────────────────────────────────────────
export default function Projelerim() {
  const [projects, setProjects] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return d && d.length ? d : DEFAULTS;
    } catch { return DEFAULTS; }
  });
  const [view, setView] = useState("home"); // home | detail | modules-page
  const [selId, setSelId] = useState(null);
  const [modal, setModal] = useState(null); // null | "new" | "edit"
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [selModule, setSelModule] = useState(null);

  const save = useCallback((p) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    setProjects([...p]);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };
  const proj = selId ? projects.find(p => p.id === selId) : null;

  // ─── Project CRUD ──────────────────────────────────────────────
  const addProject = (data) => {
    const p = { id: genId(), ...data, status: "active", completedAt: null, lastActivity: Date.now(), tasks: [], notes: [], files: [], sessions: [] };
    const np = [p, ...projects];
    save(np);
    setModal(null);
    showToast("✅ Proje oluşturuldu");
  };

  const updateProject = (data) => {
    const np = projects.map(p => p.id === selId ? { ...p, ...data, lastActivity: Date.now() } : p);
    save(np);
    setModal(null);
    showToast("✅ Güncellendi");
  };

  const completeProject = () => {
    const np = projects.map(p => p.id === selId ? { ...p, status: "done", completedAt: Date.now(), tasks: p.tasks.map(t => ({ ...t, d: true })) } : p);
    save(np);
    showToast("✅ Proje tamamlandı");
  };

  const reopenProject = () => {
    const np = projects.map(p => p.id === selId ? { ...p, status: "active", completedAt: null } : p);
    save(np);
    showToast("🔄 Proje tekrar açıldı");
  };

  const deleteProject = () => {
    if (!confirm("Bu projeyi silmek istediğinize emin misiniz?")) return;
    const np = projects.filter(p => p.id !== selId);
    save(np);
    setView("home"); setSelId(null);
    showToast("🗑 Proje silindi");
  };

  // ─── Task helpers ──────────────────────────────────────────────
  const toggleTask = (tid) => {
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), tasks: p.tasks.map(t => t.id === tid ? { ...t, d: !t.d } : t) } : p);
    save(np);
  };
  const addTask = (text, pri) => {
    if (!text.trim()) return;
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), tasks: [...p.tasks, { id: Date.now(), t: text.trim(), d: false, p: pri }] } : p);
    save(np);
  };
  const delTask = (tid) => {
    const np = projects.map(p => p.id === selId ? { ...p, tasks: p.tasks.filter(t => t.id !== tid) } : p);
    save(np);
  };

  // ─── Note helpers ──────────────────────────────────────────────
  const addNote = (text, tag) => {
    if (!text.trim()) return;
    const tc = NOTE_TAGS.find(t => t.label === tag)?.color || "#888";
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), notes: [{ text: text.trim(), date: now(), tag, tagColor: tc }, ...p.notes] } : p);
    save(np);
  };
  const delNote = (i) => {
    const np = projects.map(p => p.id === selId ? { ...p, notes: p.notes.filter((_, j) => j !== i) } : p);
    save(np);
  };

  // ─── File helpers (IndexedDB backed) ────────────────────────────
  const addFiles = async (fileList) => {
    const files = Array.from(fileList);
    const newMeta = [];
    for (const f of files) {
      const fid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      try {
        await saveFile(selId, fid, f);
        newMeta.push({ id: fid, name: f.name, icon: fileIcon(f.name), size: fileSizeFmt(f.size), type: f.type || "bilinmiyor", note: "", date: now(), stored: true });
      } catch {
        newMeta.push({ id: fid, name: f.name, icon: fileIcon(f.name), size: fileSizeFmt(f.size), type: f.type || "bilinmiyor", note: "", date: now(), stored: false });
      }
    }
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), files: [...newMeta, ...p.files] } : p);
    save(np);
    showToast(`📎 ${newMeta.length} dosya eklendi`);
  };
  const addManualFile = (name) => {
    if (!name.trim()) return;
    const fid = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), files: [{ id: fid, name: name.trim(), icon: fileIcon(name.trim()), size: "-", type: "-", note: "", date: now(), stored: false }, ...p.files] } : p);
    save(np);
  };
  const delFile = async (i) => {
    const file = proj?.files?.[i];
    if (file?.stored && file?.id) {
      try { await deleteFile(selId, file.id); } catch {}
    }
    const np = projects.map(p => p.id === selId ? { ...p, files: p.files.filter((_, j) => j !== i) } : p);
    save(np);
  };
  const handleDownload = async (file) => {
    if (!file?.stored || !file?.id) return;
    try { await downloadFile(selId, file.id, file.name); } catch { showToast("İndirme başarısız"); }
  };

  // ─── Journal helpers ──────────────────────────────────────────
  const addJournal = (title, content) => {
    if (!title.trim() && !content.trim()) return;
    const entry = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: title.trim(), content: content.trim(), date: now(), ts: Date.now() };
    const np = projects.map(p => p.id === selId ? { ...p, lastActivity: Date.now(), journal: [entry, ...(p.journal || [])] } : p);
    save(np);
  };
  const delJournal = (id) => {
    const np = projects.map(p => p.id === selId ? { ...p, journal: (p.journal || []).filter(j => j.id !== id) } : p);
    save(np);
  };
  const updateJournal = (id, title, content) => {
    const np = projects.map(p => p.id === selId ? { ...p, journal: (p.journal || []).map(j => j.id === id ? { ...j, title, content, date: now() } : j) } : p);
    save(np);
  };

  // ─── Claude ────────────────────────────────────────────────────
  const prepClaude = (prompt) => {
    if (!proj) return;
    const full = `[Proje: ${proj.name}] ${proj.desc}\n\nMevcut görevler:\n${proj.tasks.map(t => `${t.d ? "✅" : "⬜"} [${t.p}] ${t.t}`).join("\n")}\n\n${prompt}`;
    navigator.clipboard?.writeText(full).catch(() => {});
    const np = projects.map(p => {
      if (p.id !== selId) return p;
      const sessions = [{ prompt, date: now(), ts: Date.now() }, ...p.sessions].slice(0, 20);
      return { ...p, sessions, lastActivity: Date.now() };
    });
    save(np);
    showToast("📋 Prompt kopyalandı!");
  };

  // ─── Stats ─────────────────────────────────────────────────────
  const active = projects.filter(p => p.status === "active");
  const done = projects.filter(p => p.status === "done");
  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = projects.reduce((s, p) => s + p.tasks.filter(t => t.d).length, 0);
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const totalNotes = projects.reduce((s, p) => s + p.notes.length, 0);
  const totalFiles = projects.reduce((s, p) => s + p.files.length, 0);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="plm">
        {toast && <div className="toast">{toast}</div>}

        {/* ────── HOME ────── */}
        {view === "home" && (
          <div className="fade-in">
            <div className="page-hdr">
              <h1>📂 Projelerim</h1>
              <div className="hdr-btns">
                <button className="btn" onClick={() => setView("modules-page")}>🧩 Modüller</button>
                <button className="btn btn-primary" onClick={() => setModal("new")}>+ Yeni Proje</button>
              </div>
            </div>

            <div className="stats">
              <div className="stat-card"><div className="num" style={{ color: "#185FA5" }}>{active.length}</div><div className="lbl">Aktif Proje</div></div>
              <div className="stat-card"><div className="num" style={{ color: "#1D9E75" }}>{done.length}</div><div className="lbl">Tamamlanan</div></div>
              <div className="stat-card"><div className="num">{doneTasks}/{totalTasks}</div><div className="lbl">Görev İlerleme</div></div>
              <div className="stat-card"><div className="num" style={{ color: "#BA7517" }}>%{pct}</div><div className="lbl">Genel İlerleme</div></div>
              <div className="stat-card"><div className="num">{totalNotes}</div><div className="lbl">Not</div></div>
              <div className="stat-card"><div className="num">{totalFiles}</div><div className="lbl">Dosya</div></div>
            </div>

            <div className="cards">
              {active.sort((a, b) => b.lastActivity - a.lastActivity).map((p, i) => {
                const tt = p.tasks.length, dt = p.tasks.filter(t => t.d).length, pp = tt ? Math.round((dt / tt) * 100) : 0;
                return (
                  <div className="pcard" key={p.id} style={{ animationDelay: `${i * 0.06}s` }} onClick={() => { setSelId(p.id); setTab("overview"); setView("detail"); }}>
                    <div className="pcard-top" style={{ background: p.gradient }}>
                      <div className="pcard-emoji">{p.emoji}</div>
                      <div className="pcard-name">{p.name}</div>
                      <div className="pcard-desc">{p.desc}</div>
                    </div>
                    <div className="pcard-bottom">
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pp}%`, background: p.color }} /></div>
                      <div className="pcard-meta">
                        <span>{dt}/{tt} görev</span>
                        <span>{timeAgo(p.lastActivity)}</span>
                      </div>
                      {p.sessions.length > 0 && (
                        <div className="pcard-sessions">
                          <div>🤖 {p.sessions[0].prompt.slice(0, 50)}...</div>
                          {p.sessions[1] && <div style={{ opacity: 0.6 }}>🤖 {p.sessions[1].prompt.slice(0, 40)}...</div>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="add-card" onClick={() => setModal("new")}>+</div>
            </div>

            {done.length > 0 && (
              <div className="completed-section">
                <div className="section-title">✅ Tamamlanan Projeler</div>
                <div className="cards">
                  {done.map(p => (
                    <div className="pcard" key={p.id} onClick={() => { setSelId(p.id); setTab("overview"); setView("detail"); }}>
                      <div className="pcard-top" style={{ background: p.gradient, filter: "grayscale(0.4)" }}>
                        <div className="pcard-emoji">{p.emoji}</div>
                        <div className="pcard-name">{p.name}</div>
                      </div>
                      <div className="pcard-bottom">
                        <div className="pcard-meta"><span>Tamamlandı</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────── DETAIL ────── */}
        {view === "detail" && proj && (
          <div className="fade-in">
            <button className="back-btn" onClick={() => { setView("home"); setSelId(null); }}>← Projelerim</button>

            <div className="detail-hdr" style={{ background: proj.gradient }}>
              <div className="emoji">{proj.emoji}</div>
              <h1>{proj.name}</h1>
              <div className="desc">{proj.desc}</div>
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar" style={{ maxWidth: 300 }}>
                  <div className="progress-fill" style={{ width: `${proj.tasks.length ? Math.round((proj.tasks.filter(t => t.d).length / proj.tasks.length) * 100) : 0}%`, background: "rgba(255,255,255,0.8)" }} />
                </div>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  {proj.tasks.filter(t => t.d).length}/{proj.tasks.length} görev tamamlandı
                </span>
              </div>
              <div className="detail-btns">
                <button className="btn" onClick={() => setModal("edit")}>✏️ Düzenle</button>
                {proj.status === "active" ? (
                  <button className="btn" onClick={completeProject}>✅ Tamamla</button>
                ) : (
                  <button className="btn" onClick={reopenProject}>🔄 Tekrar Aç</button>
                )}
                <button className="btn btn-danger" onClick={deleteProject}>🗑 Sil</button>
              </div>
            </div>

            {/* Claude Box */}
            <ClaudeBox onSend={prepClaude} color={proj.color} />

            {/* Tabs */}
            <div className="tabs">
              {[["overview","📊 Genel"],["journal","📓 Günlük"],["tasks","📋 Görevler"],["notes","📝 Notlar"],["files","📎 Dosyalar"],["sessions","💬 Oturumlar"],["modules","🧩 Modüller"]].map(([k, l]) => (
                <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="slide-up" key={tab}>
              {tab === "overview" && <OverviewTab project={proj} modules={MODULES} onOpenModule={(m) => { setSelModule(m); setTab("modules"); }} sessions={proj.sessions} onOpenClaude={prepClaude} />}
              {tab === "journal" && <JournalTab journal={proj.journal || []} onAdd={addJournal} onDel={delJournal} onUpdate={updateJournal} />}
              {tab === "tasks" && <TasksTab tasks={proj.tasks} onToggle={toggleTask} onAdd={addTask} onDel={delTask} />}
              {tab === "notes" && <NotesTab notes={proj.notes} onAdd={addNote} onDel={delNote} />}
              {tab === "files" && <FilesTab files={proj.files} projectId={selId} onAddFiles={addFiles} onAddManual={addManualFile} onDel={delFile} onDownload={handleDownload} />}
              {tab === "sessions" && <SessionsTab sessions={proj.sessions} onReopen={prepClaude} />}
              {tab === "modules" && <ModulesTab modules={MODULES} selected={selModule} onSelect={setSelModule} onPrompt={(prompt) => prepClaude(prompt)} project={proj} />}
            </div>
          </div>
        )}

        {/* ────── MODULES PAGE ────── */}
        {view === "modules-page" && (
          <div className="fade-in">
            <button className="back-btn" onClick={() => setView("home")}>← Projelerim</button>
            <h1 style={{ marginBottom: 20 }}>🧩 Çalışma Modülleri</h1>
            <p style={{ color: "#888", marginBottom: 20, fontSize: 14 }}>Bir proje seçip modülleri kullanmak için proje detay sayfasına gidin.</p>
            <div className="mod-grid">
              {MODULES.map(m => (
                <div className="mod-card" key={m.id}>
                  <div className="mod-icon">{m.icon}</div>
                  <div className="mod-name">{m.name}</div>
                  <div className="mod-desc">{m.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────── MODAL ────── */}
        {modal && (
          <ProjectModal
            mode={modal}
            project={modal === "edit" ? proj : null}
            onSave={modal === "new" ? addProject : updateProject}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </>
  );
}

// ─── Sub Components ──────────────────────────────────────────────────

function ClaudeBox({ onSend, color }) {
  const [val, setVal] = useState("");
  const handleClick = () => { if (val.trim()) { onSend(val.trim()); setVal(""); } };
  return (
    <div className="claude-box" style={{ borderColor: color + "44" }}>
      <input placeholder="Claude'a ne sormak istiyorsun?" value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && val.trim()) { handleClick(); } }} />
      <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
        className="btn btn-primary"
        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
        onClick={handleClick}>Claude Aç →</a>
    </div>
  );
}

function ProjectModal({ mode, project, onSave, onClose }) {
  const [emoji, setEmoji] = useState(project?.emoji || "📋");
  const [ci, setCi] = useState(project ? COLORS.findIndex(c => c.color === project.color) : 0);
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.desc || "");

  const c = COLORS[ci] || COLORS[0];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{mode === "new" ? "Yeni Proje" : "Projeyi Düzenle"}</h2>

        <label>Emoji</label>
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <div key={e} className={`emoji-opt ${emoji === e ? "sel" : ""}`} onClick={() => setEmoji(e)}>{e}</div>
          ))}
        </div>

        <label>Renk</label>
        <div className="color-grid">
          {COLORS.map((co, i) => (
            <div key={i} className={`color-opt ${ci === i ? "sel" : ""}`} style={{ background: co.gradient }} onClick={() => setCi(i)} />
          ))}
        </div>

        <label>Proje Adı *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Proje adı" />

        <label>Açıklama</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kısa açıklama" />

        <div className="preview-card">
          <div className="preview-top" style={{ background: c.gradient }}>
            <span style={{ fontSize: 28 }}>{emoji}</span>
            <span style={{ fontWeight: 700, color: "#fff" }}>{name || "Proje Adı"}</span>
          </div>
          <div className="preview-bottom">{desc || "Açıklama"}</div>
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>İptal</button>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onSave({ emoji, color: c.color, gradient: c.gradient, name: name.trim(), desc: desc.trim() })}>
            {mode === "new" ? "Oluştur" : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ project, modules, onOpenModule, sessions }) {
  return (
    <div>
      <div className="section-title" style={{ marginBottom: 12 }}>Önerilen Modüller</div>
      <div className="mod-grid" style={{ marginBottom: 24 }}>
        {modules.slice(0, 4).map(m => (
          <div className="mod-card" key={m.id} onClick={() => onOpenModule(m)}>
            <div className="mod-icon">{m.icon}</div>
            <div className="mod-name">{m.name}</div>
            <div className="mod-desc">{m.desc}</div>
          </div>
        ))}
      </div>
      {sessions.length > 0 && (
        <>
          <div className="section-title">Son Oturumlar</div>
          {sessions.slice(0, 5).map((s, i) => (
            <div className="session-item" key={i}>
              <div className="s-prompt">🤖 {s.prompt}</div>
              <div className="s-date">{s.date}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function TasksTab({ tasks, onToggle, onAdd, onDel }) {
  const [text, setText] = useState("");
  const [pri, setPri] = useState("medium");
  return (
    <div>
      {tasks.map(t => (
        <div className="task-item" key={t.id}>
          <input type="checkbox" checked={t.d} onChange={() => onToggle(t.id)} />
          <span className={`task-text ${t.d ? "done" : ""}`}>{t.t}</span>
          <span className="pri">{priorityIcon[t.p]}</span>
          <button className="del" onClick={() => onDel(t.id)}>×</button>
        </div>
      ))}
      <div className="add-row">
        <input placeholder="Yeni görev..." value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onAdd(text, pri); setText(""); } }} />
        <select value={pri} onChange={e => setPri(e.target.value)}>
          <option value="high">🔴 Yüksek</option>
          <option value="medium">🟡 Orta</option>
          <option value="low">🟢 Düşük</option>
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => { onAdd(text, pri); setText(""); }}>Ekle</button>
      </div>
    </div>
  );
}

function NotesTab({ notes, onAdd, onDel }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("Bilgi");
  return (
    <div>
      <div className="add-row" style={{ marginBottom: 16 }}>
        <input placeholder="Yeni not..." value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onAdd(text, tag); setText(""); } }} />
        <select value={tag} onChange={e => setTag(e.target.value)}>
          {NOTE_TAGS.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => { onAdd(text, tag); setText(""); }}>Ekle</button>
      </div>
      {notes.map((n, i) => (
        <div className="note-card" key={i} style={{ borderColor: n.tagColor }}>
          <button className="note-del" onClick={() => onDel(i)}>×</button>
          <span className="note-tag" style={{ background: n.tagColor + "22", color: n.tagColor }}>{n.tag}</span>
          <div className="note-text">{n.text}</div>
          <div className="note-date">{n.date}</div>
        </div>
      ))}
    </div>
  );
}

function JournalTab({ journal, onAdd, onDel, onUpdate }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [expanded, setExpanded] = useState(null);

  const handleSave = () => {
    if (editing) {
      onUpdate(editing, editTitle, editContent);
      setEditing(null);
    } else {
      onAdd(title, content);
      setTitle(""); setContent("");
    }
  };

  const startEdit = (entry) => {
    setEditing(entry.id); setEditTitle(entry.title); setEditContent(entry.content);
  };

  return (
    <div>
      {/* Add new entry */}
      <div style={{ background: "#F5F0E8", borderRadius: 14, padding: 16, marginBottom: 16, borderLeft: "3px solid #BA7517", borderRadius: "0 14px 14px 0" }}>
        <input placeholder="Başlık (ör: Bugün yapılanlar)" value={title} onChange={e => setTitle(e.target.value)}
          style={{ width: "100%", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#2C2A26", outline: "none", marginBottom: 8, boxSizing: "border-box" }} />
        <textarea placeholder="Çalışma detayları, kararlar, notlar..." value={content} onChange={e => setContent(e.target.value)}
          style={{ width: "100%", background: "#fff", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#2C2A26", outline: "none", minHeight: 100, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} />
        <button className="btn btn-primary" style={{ marginTop: 8, width: "100%" }} onClick={handleSave} disabled={!title.trim() && !content.trim()}>
          📓 Günlük Kaydı Ekle
        </button>
      </div>

      {/* Entries */}
      {journal.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#8B8578", fontSize: 13 }}>Henüz günlük kaydı yok. İlk çalışma notunuzu ekleyin!</div>}

      {journal.map(entry => {
        const isExp = expanded === entry.id;
        const isEdit = editing === entry.id;

        return (
          <div key={entry.id} style={{ background: "#fff", borderRadius: 14, borderLeft: "3px solid #BA7517", borderRadius: "0 14px 14px 0", padding: "14px 16px", marginBottom: 8, border: "1px solid rgba(0,0,0,0.05)", borderLeft: "3px solid #BA7517" }}>
            {isEdit ? (
              <div>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)}
                  style={{ width: "100%", background: "#F5F0E8", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#2C2A26", outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                  style={{ width: "100%", background: "#F5F0E8", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#2C2A26", outline: "none", minHeight: 80, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave}>Kaydet</button>
                  <button className="btn btn-sm" onClick={() => setEditing(null)}>İptal</button>
                </div>
              </div>
            ) : (
              <div>
                <div onClick={() => setExpanded(isExp ? null : entry.id)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#2C2A26" }}>{entry.title || "Başlıksız"}</div>
                    <span style={{ fontSize: 10, color: "#8B8578" }}>{entry.date}</span>
                  </div>
                  {!isExp && entry.content && <div style={{ fontSize: 12, color: "#8B8578", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.content.slice(0, 80)}...</div>}
                </div>
                {isExp && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ fontSize: 13, color: "#2C2A26", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{entry.content}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button className="btn btn-sm" onClick={() => startEdit(entry)}>✏️ Düzenle</button>
                      <button className="btn btn-sm btn-danger" onClick={() => { if (confirm("Bu kaydı silmek istiyor musunuz?")) onDel(entry.id); }}>🗑 Sil</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FilesTab({ files, projectId, onAddFiles, onAddManual, onDel, onDownload }) {
  const [over, setOver] = useState(false);
  const [manualName, setManualName] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleDrop = (e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) onAddFiles(e.dataTransfer.files); };

  const openPreview = async (file) => {
    if (!file.stored || !file.id) return;
    try {
      const record = await getFile(projectId, file.id);
      if (!record) return;
      const url = createBlobUrl(record);
      setPreviewUrl(url);
      setPreview(file);
    } catch {}
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreview(null); setPreviewUrl(null);
  };

  const isImage = (type) => type && type.startsWith("image/");
  const isPdf = (type) => type && type.includes("pdf");

  return (
    <div>
      <div className={`drop-zone ${over ? "over" : ""}`}
        onDragOver={e => { e.preventDefault(); setOver(true); }}
        onDragLeave={e => { e.preventDefault(); setOver(false); }}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
        <div>Dosyaları sürükle-bırak veya tıkla</div>
        <div style={{ fontSize: 11, color: "#8B8578", marginTop: 4 }}>Dosyalar cihazınızda kalıcı olarak saklanır</div>
        <input ref={inputRef} type="file" multiple hidden onChange={e => { if (e.target.files.length) onAddFiles(e.target.files); e.target.value = ""; }} />
      </div>

      <details>
        <summary>✏️ Manuel dosya kaydı ekle</summary>
        <div className="add-row" style={{ marginTop: 8 }}>
          <input placeholder="dosya-adi.pdf" value={manualName} onChange={e => setManualName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { onAddManual(manualName); setManualName(""); } }} />
          <button className="btn btn-sm" onClick={() => { onAddManual(manualName); setManualName(""); }}>Ekle</button>
        </div>
      </details>

      <div style={{ marginTop: 16 }}>
        {files.map((f, i) => (
          <div className="file-item" key={i} style={{ borderLeft: f.stored ? "3px solid #1D9E75" : "3px solid #8B8578", borderRadius: "0 10px 10px 0" }}>
            <div className="file-icon" style={{ cursor: f.stored ? "pointer" : "default" }} onClick={() => f.stored && openPreview(f)}>{f.icon}</div>
            <div className="file-info" style={{ cursor: f.stored ? "pointer" : "default" }} onClick={() => f.stored && openPreview(f)}>
              <div className="file-name">{f.name}</div>
              <div className="file-meta">
                {f.size} · {f.date}
                {f.stored && <span style={{ color: "#1D9E75", marginLeft: 6, fontSize: 10 }}>● Kayıtlı</span>}
                {!f.stored && f.size !== "-" && <span style={{ color: "#8B8578", marginLeft: 6, fontSize: 10 }}>○ Sadece bilgi</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {f.stored && <button className="btn btn-sm" onClick={() => onDownload(f)} title="İndir">⬇</button>}
              <button className="del" style={{ background: "none", border: "none", color: "#8B8578", cursor: "pointer" }} onClick={() => onDel(i)}>×</button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview overlay */}
      {preview && previewUrl && (
        <div className="overlay" onClick={closePreview}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: "90vh" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16 }}>{preview.icon} {preview.name}</h2>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-sm" onClick={() => onDownload(preview)}>⬇ İndir</button>
                <button className="btn btn-sm" onClick={closePreview}>✕</button>
              </div>
            </div>
            {isImage(preview.type) && <img src={previewUrl} alt={preview.name} style={{ width: "100%", borderRadius: 10, maxHeight: "70vh", objectFit: "contain" }} />}
            {isPdf(preview.type) && <iframe src={previewUrl} style={{ width: "100%", height: "70vh", border: "none", borderRadius: 10 }} />}
            {!isImage(preview.type) && !isPdf(preview.type) && (
              <div style={{ textAlign: "center", padding: 40, color: "#8B8578" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{preview.icon}</div>
                <div>Bu dosya türü önizlenemez</div>
                <button className="btn btn-primary" style={{ marginTop: 12, width: "auto" }} onClick={() => onDownload(preview)}>⬇ İndir</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionsTab({ sessions, onReopen }) {
  return (
    <div>
      {sessions.length === 0 && <div style={{ color: "#8B8578", textAlign: "center", padding: 40 }}>Henüz oturum yok. Claude ile çalışmaya başlayın!</div>}
      {sessions.map((s, i) => (
        <div className="session-item" key={i}>
          <div className="s-prompt">🤖 {s.prompt}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
            <span className="s-date">{s.date}</span>
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
              className="btn btn-sm" style={{ textDecoration: "none" }}
              onClick={() => onReopen(s.prompt)}>Tekrar Aç</a>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModulesTab({ modules, selected, onSelect, onPrompt, project }) {
  const [custom, setCustom] = useState("");

  if (selected) {
    return (
      <div>
        <button className="back-btn" onClick={() => onSelect(null)}>← Tüm Modüller</button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 36 }}>{selected.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{selected.name}</div>
            <div style={{ color: "#888", fontSize: 13 }}>{selected.desc}</div>
          </div>
        </div>
        <div className="mod-prompts">
          {selected.prompts.map((pr, i) => (
            <a key={i} href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
              className="mod-prompt-btn" style={{ borderColor: selected.color + "44", textDecoration: "none" }}
              onClick={() => onPrompt(`[${selected.name}] ${pr}`)}>
              {pr}
            </a>
          ))}
        </div>
        <div className="claude-box" style={{ marginTop: 16, borderColor: selected.color + "44" }}>
          <input placeholder={`${selected.name} için özel istek...`} value={custom} onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && custom.trim()) { onPrompt(`[${selected.name}] ${custom.trim()}`); setCustom(""); } }} />
          <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer"
            className="btn btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            onClick={() => { if (custom.trim()) { onPrompt(`[${selected.name}] ${custom.trim()}`); setCustom(""); } }}>Gönder</a>
        </div>
      </div>
    );
  }

  return (
    <div className="mod-grid">
      {modules.map(m => (
        <div className="mod-card" key={m.id} onClick={() => onSelect(m)} style={{ borderColor: m.color + "22" }}>
          <div className="mod-icon">{m.icon}</div>
          <div className="mod-name">{m.name}</div>
          <div className="mod-desc">{m.desc}</div>
        </div>
      ))}
    </div>
  );
}
