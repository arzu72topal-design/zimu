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
  { id: "calendar", label: "Takvim", icon: "◫" },
  { id: "sports", label: "Sağlık", icon: "♦" },
  { id: "projects", label: "Tarzım", icon: "◈" },
  { id: "notes", label: "Notlar", icon: "☰" },
];

const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
const SPORT_EMOJI = {"Koşu":"🏃","Yüzme":"🏊","Bisiklet":"🚴","Yoga":"🧘","Ağırlık":"🏋️","Yürüyüş":"🚶","Diğer":"⚡"};
const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const PCOL = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7","#f97316","#14b8a6"];

const DEFAULT_ROOMS = [
  { id: "projects", name: "Projeler", icon: "📂", color: "#3b82f6", type: "project" },
  { id: "music", name: "Müziklerim", icon: "🎵", color: "#a855f7", type: "collection" },
  { id: "clothes", name: "Kıyafetlerim", icon: "👗", color: "#f97316", type: "collection" },
  { id: "memories", name: "Anılar", icon: "📸", color: "#ef4444", type: "collection" },
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
  width:"100%",background:"#13132a",border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:12,padding:"12px 14px",color:"#e0e0e0",fontSize:15,
  marginBottom:10,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",
};
const btnPrimary = {
  width:"100%",background:"#3b82f6",color:"#fff",border:"none",borderRadius:12,
  padding:"14px",cursor:"pointer",fontSize:15,fontWeight:600,marginTop:4,
};
const addBtnStyle = {
  background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,
  padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
};
const filterBtnStyle = (active) => ({
  background: active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
  color: active ? "#3b82f6" : "#888",
  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
  padding:"7px 14px",borderRadius:10,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
});
const cardStyle = {
  background:"#1c1c2e",borderRadius:12,padding:"12px 14px",marginBottom:6,
};
const delBtnStyle = {
  background:"none",border:"none",color:"#555",fontSize:18,cursor:"pointer",padding:4,
};
const sectionHeader = {
  display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
};
const checkBtnStyle = (done) => ({
  width:26,height:26,borderRadius:8,border:`2px solid ${done?"#22c55e":"#444"}`,
  background:done?"#22c55e":"transparent",color:"#fff",cursor:"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
  flexShrink:0,padding:0,
});

/* ── Modal ── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:9999,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#1c1c2e",width:"100%",maxWidth:480,maxHeight:"90vh",
        borderRadius:"20px 20px 0 0",overflow:"auto",animation:"slideUp .25s ease",
        paddingBottom:20,
        marginBottom:0,
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",
          position:"sticky",top:0,background:"#1c1c2e",zIndex:1,
        }}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.08)",border:"none",color:"#aaa",
            width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        </div>
        <div style={{padding:"16px 20px 40px"}}>{children}</div>
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

/* ═══════════ DASHBOARD ═══════════ */
function Dashboard({ data, setTab }) {
  const t = today();
  const foods = data.foods || [];
  const rooms = data.rooms || [...DEFAULT_ROOMS];
  const roomItems = data.roomItems || {};

  const pending = data.tasks.filter(x=>!x.done).length;
  const done = data.tasks.filter(x=>x.done).length;
  const total = data.tasks.length;
  const overdue = data.tasks.filter(x=>!x.done && x.dueDate && x.dueDate < t).length;
  const taskScore = total > 0 ? Math.round(done/total*100) : 0;
  const urgentTasks = data.tasks.filter(x=>!x.done).sort((a,b)=>{
    const po={high:0,medium:1,low:2}; return (po[a.priority]||1)-(po[b.priority]||1);
  }).slice(0,3);

  const todayEv = data.events.filter(e=>e.date===t);
  const upcoming = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  const wkSport = data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const wkMin = wkSport.reduce((a,s)=>a+(s.duration||0),0);
  const wkBurned = wkSport.reduce((a,s)=>a+(s.calories||0),0);
  const todayFoods = foods.filter(f=>f.date===t);
  const todayCalIn = todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todayCalOut = data.sports.filter(s=>s.date===t).reduce((a,s)=>a+(s.calories||0),0);
  const netCal = todayCalIn - todayCalOut;
  const healthGoal = 2000;
  const healthScore = todayCalIn>0 ? (netCal<=healthGoal ? "Dengeli" : "Fazla") : "Kayıt yok";

  const totalRoomItems = rooms.reduce((a,r)=> a + (r.type==="project" ? data.projects.length : (roomItems[r.id]||[]).length), 0);
  const activeProjects = data.projects.filter(p=>p.status!=="Tamamlandı").length;

  const hour = new Date().getHours();
  const greeting = hour<12 ? "Günaydın" : hour<18 ? "İyi günler" : "İyi akşamlar";

  return (
    <div>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:22,fontWeight:800,letterSpacing:-.5}}>{greeting}! 👋</h2>
        <p style={{margin:"4px 0 0",opacity:.5,fontSize:13}}>
          {new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}
        </p>
      </div>

      {overdue > 0 && (
        <div onClick={()=>setTab("tasks")} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
          borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
          <span style={{fontSize:20}}>🚨</span>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#ef4444"}}>{overdue} gecikmiş görev!</div>
            <div style={{fontSize:11,opacity:.5}}>Hemen kontrol et</div>
          </div>
          <span style={{fontSize:14,opacity:.3}}>▶</span>
        </div>
      )}

      {/* GÖREVLER */}
      <div onClick={()=>setTab("tasks")} style={{
        background:"#1c1c2e",borderRadius:16,padding:16,marginBottom:10,cursor:"pointer",borderLeft:"4px solid #3b82f6",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>✓</span>
            <span style={{fontSize:15,fontWeight:700}}>Görevler</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{
              background:taskScore>=70?"rgba(34,197,94,0.15)":taskScore>=40?"rgba(245,158,11,0.15)":"rgba(239,68,68,0.15)",
              color:taskScore>=70?"#22c55e":taskScore>=40?"#f59e0b":"#ef4444",
              padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700,
            }}>%{taskScore}</div>
            <span style={{fontSize:12,opacity:.3}}>▶</span>
          </div>
        </div>
        <div style={{display:"flex",gap:12,marginBottom:10}}>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:20,fontWeight:800,color:"#ef4444"}}>{pending}</div>
            <div style={{fontSize:9,opacity:.4}}>Bekleyen</div>
          </div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:20,fontWeight:800,color:"#22c55e"}}>{done}</div>
            <div style={{fontSize:9,opacity:.4}}>Tamamlanan</div>
          </div>
          <div style={{textAlign:"center",flex:1}}>
            <div style={{fontSize:20,fontWeight:800,color:"#f59e0b"}}>{overdue}</div>
            <div style={{fontSize:9,opacity:.4}}>Gecikmiş</div>
          </div>
        </div>
        {urgentTasks.length>0&&(
          <div style={{borderTop:"1px solid rgba(255,255,255,0.04)",paddingTop:8}}>
            {urgentTasks.map(task=>(
              <div key={task.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:PCOL[task.priority],flexShrink:0}}/>
                <span style={{fontSize:12,opacity:.7,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</span>
                {task.dueDate&&<span style={{fontSize:10,opacity:.3}}>{task.dueDate.slice(5)}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TAKVİM */}
      <div onClick={()=>setTab("calendar")} style={{
        background:"#1c1c2e",borderRadius:16,padding:16,marginBottom:10,cursor:"pointer",borderLeft:"4px solid #a855f7",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>◫</span>
            <span style={{fontSize:15,fontWeight:700}}>Takvim</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:"rgba(168,85,247,0.15)",color:"#a855f7",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700}}>{todayEv.length} bugün</div>
            <span style={{fontSize:12,opacity:.3}}>▶</span>
          </div>
        </div>
        {upcoming.length===0 ? (
          <p style={{opacity:.3,fontSize:12,margin:0}}>Yaklaşan etkinlik yok</p>
        ) : upcoming.map(e=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:e.color||"#a855f7",flexShrink:0}}/>
            <span style={{fontSize:12,opacity:.7,flex:1}}>{e.title}</span>
            <span style={{fontSize:10,opacity:.3}}>{e.time||""} {e.date.slice(5)}</span>
          </div>
        ))}
      </div>

      {/* SAĞLIK */}
      <div onClick={()=>setTab("sports")} style={{
        background:"#1c1c2e",borderRadius:16,padding:16,marginBottom:10,cursor:"pointer",borderLeft:"4px solid #22c55e",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>♦</span>
            <span style={{fontSize:15,fontWeight:700}}>Sağlık Koçu</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{
              background:healthScore==="Dengeli"?"rgba(34,197,94,0.15)":healthScore==="Fazla"?"rgba(239,68,68,0.15)":"rgba(59,130,246,0.15)",
              color:healthScore==="Dengeli"?"#22c55e":healthScore==="Fazla"?"#ef4444":"#3b82f6",
              padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700,
            }}>{healthScore}</div>
            <span style={{fontSize:12,opacity:.3}}>▶</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <div style={{flex:1,background:"rgba(249,115,22,0.08)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#f97316"}}>{todayCalIn}</div>
            <div style={{fontSize:9,opacity:.4}}>Alınan kcal</div>
          </div>
          <div style={{flex:1,background:"rgba(34,197,94,0.08)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:"#22c55e"}}>{todayCalOut}</div>
            <div style={{fontSize:9,opacity:.4}}>Yakılan kcal</div>
          </div>
          <div style={{flex:1,background:"rgba(59,130,246,0.08)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:16,fontWeight:800,color:netCal>healthGoal?"#ef4444":"#3b82f6"}}>{netCal}</div>
            <div style={{fontSize:9,opacity:.4}}>Net kcal</div>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <span style={{fontSize:11,opacity:.4}}>💪 {wkSport.length} antrenman</span>
          <span style={{fontSize:11,opacity:.4}}>⏱ {wkMin} dk</span>
          <span style={{fontSize:11,opacity:.4}}>🔥 {wkBurned} kcal</span>
        </div>
      </div>

      {/* TARZIM */}
      <div onClick={()=>setTab("projects")} style={{
        background:"#1c1c2e",borderRadius:16,padding:16,marginBottom:10,cursor:"pointer",borderLeft:"4px solid #f97316",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>◈</span>
            <span style={{fontSize:15,fontWeight:700}}>Tarzım</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:"rgba(249,115,22,0.15)",color:"#f97316",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700}}>{totalRoomItems} öğe</div>
            <span style={{fontSize:12,opacity:.3}}>▶</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {rooms.slice(0,4).map(room=>{
            const count=room.type==="project"?data.projects.length:(roomItems[room.id]||[]).length;
            return (
              <div key={room.id} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"6px 10px"}}>
                <span style={{fontSize:16}}>{room.icon}</span>
                <span style={{fontSize:11,opacity:.6}}>{room.name}</span>
                <span style={{fontSize:11,fontWeight:700,color:room.color}}>{count}</span>
              </div>
            );
          })}
        </div>
        {activeProjects>0&&<div style={{fontSize:11,opacity:.4,marginTop:8}}>📂 {activeProjects} aktif proje devam ediyor</div>}
      </div>

      {/* NOTLAR */}
      <div onClick={()=>setTab("notes")} style={{
        background:"#1c1c2e",borderRadius:16,padding:16,marginBottom:10,cursor:"pointer",borderLeft:"4px solid #14b8a6",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>☰</span>
            <span style={{fontSize:15,fontWeight:700}}>Notlar</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{background:"rgba(20,184,166,0.15)",color:"#14b8a6",padding:"3px 10px",borderRadius:8,fontSize:12,fontWeight:700}}>{data.notes.length} not</div>
            <span style={{fontSize:12,opacity:.3}}>▶</span>
          </div>
        </div>
        {data.notes.length>0&&(
          <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
            {data.notes.slice(0,3).map(n=>(
              <div key={n.id} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"4px 10px",borderTop:`2px solid ${n.color||"#14b8a6"}`}}>
                <span style={{fontSize:11,opacity:.6}}>{n.title}</span>
              </div>
            ))}
            {data.notes.length>3&&<span style={{fontSize:11,opacity:.3,alignSelf:"center"}}>+{data.notes.length-3}</span>}
          </div>
        )}
      </div>
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
  const list = data.tasks.filter(task=>{
    if(filter==="done")return task.done;
    if(filter==="pending")return !task.done;
    if(filter==="high")return task.priority==="high"&&!task.done;
    if(filter==="overdue")return !task.done && task.dueDate && task.dueDate < t;
    return true;
  });

  // Quick date helpers
  const todayStr = today();
  const tomorrow = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
  const nextWeek = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };
  const nextMonth = ()=>{ const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split("T")[0]; };

  const quickDates = [
    {label:"Bugün",val:todayStr,icon:"📌"},
    {label:"Yarın",val:tomorrow(),icon:"⏭"},
    {label:"1 Hafta",val:nextWeek(),icon:"📅"},
    {label:"1 Ay",val:nextMonth(),icon:"🗓"},
  ];

  const formatDate = (d) => {
    if(!d) return "";
    if(d===todayStr) return "Bugün";
    if(d===tomorrow()) return "Yarın";
    const dt = new Date(d);
    return dt.toLocaleDateString("tr-TR",{day:"numeric",month:"short"});
  };

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Görevler</h3>
        <button onClick={openNew} style={addBtnStyle}>+ Yeni</button>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
        {[["all","Tümü"],["pending","Bekleyen"],["done","Bitti"],["high","Öncelikli"],["overdue","Gecikmiş"]].map(([k,v])=>(
          <button key={k} onClick={()=>setFilter(k)} style={filterBtnStyle(filter===k)}>{v}</button>
        ))}
      </div>
      {list.length===0 && <p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Görev yok</p>}
      {list.map(task=>(
        <div key={task.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12,opacity:task.done?.5:1}}>
          <button onClick={()=>toggle(task.id)} style={checkBtnStyle(task.done)}>{task.done&&"✓"}</button>
          <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setDetail(detail===task.id?null:task.id)}>
            <div style={{fontSize:15,fontWeight:500,textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
            <div style={{fontSize:11,opacity:.5,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {task.category&&<span style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#ef4444":"inherit"}}>📅 {formatDate(task.dueDate)}</span>}
              {task.description&&<span style={{opacity:.4}}>📝</span>}
            </div>
          </div>
          <span style={{width:10,height:10,borderRadius:"50%",background:PCOL[task.priority],flexShrink:0}}/>
          <button onClick={()=>del(task.id)} style={delBtnStyle}>✕</button>
        </div>
      ))}

      {/* Task Detail View */}
      {detail && (() => {
        const task = data.tasks.find(t=>t.id===detail);
        if(!task) return null;
        return (
          <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginTop:8,border:"1px solid rgba(59,130,246,0.2)"}}>
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

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId?"Görevi Düzenle":"Yeni Görev"}>
        <input style={inp} placeholder="Görev başlığı..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="Açıklama (opsiyonel)..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input style={inp} placeholder="Kategori (opsiyonel)" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>

        {/* Quick date buttons */}
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
              background:"rgba(239,68,68,0.1)",color:"#ef4444",
              border:"1px solid rgba(239,68,68,0.2)",
              padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>✕ Temizle</button>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            {form.dueDate&&<span style={{fontSize:13,color:"#3b82f6",fontWeight:600,whiteSpace:"nowrap"}}>{formatDate(form.dueDate)}</span>}
          </div>
        </div>

        {/* Priority */}
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

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Takvim</h3>
        <button onClick={()=>{setModal(true);setForm({title:"",date:"",time:"",color:"#3b82f6",description:"",recurring:"none"});}} style={addBtnStyle}>+ Etkinlik</button>
      </div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,background:"#1c1c2e",borderRadius:12,padding:"10px 14px"}}>
        <button onClick={()=>setVd(new Date(y,m-1))} style={{background:"none",border:"none",color:"#aaa",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>◀</button>
        <span style={{fontWeight:700,fontSize:16}}>{MN[m]} {y}</span>
        <button onClick={()=>setVd(new Date(y,m+1))} style={{background:"none",border:"none",color:"#aaa",fontSize:20,cursor:"pointer",padding:"4px 10px"}}>▶</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {DN.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,opacity:.4,padding:"6px 0"}}>{d}</div>)}
        {cells.map((d,i)=>{
          const isToday=d&&ds(d)===t;
          const ev=d?evOn(d):[];
          const isSel=d&&selDay===d;
          return (
            <div key={i} onClick={()=>d&&setSelDay(selDay===d?null:d)} style={{
              background:isToday?"rgba(59,130,246,0.2)":isSel?"rgba(59,130,246,0.1)":"#1c1c2e",
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
        <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{selDay} {MN[m]}</h4>
            <button onClick={()=>{setModal(true);setForm({title:"",date:ds(selDay),time:"",color:"#3b82f6",description:"",recurring:"none"});}} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>+ Ekle</button>
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

  const foods = data.foods || [];

  const addSport=()=>{
    if(!form.duration)return;
    const ns={id:uid(),...form,duration:+form.duration,distance:+form.distance||0,calories:+form.calories||0};
    update({...data,sports:[ns,...data.sports]});
    setModal(false);setForm({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  };
  const delSport=id=>update({...data,sports:data.sports.filter(s=>s.id!==id)});

  const addFood=()=>{
    if(!foodForm.name.trim()||!foodForm.calories)return;
    const nf={id:uid(),...foodForm,calories:+foodForm.calories};
    update({...data,foods:[nf,...foods]});
    setFoodModal(false);setFoodForm({name:"",calories:"",meal:"Öğle",date:today()});setFoodSearch("");
  };
  const delFood=id=>update({...data,foods:foods.filter(f=>f.id!==id)});

  const selectCommonFood=(name,cal)=>{
    setFoodForm({...foodForm,name,calories:String(cal)});
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

  const filteredFoods = foodSearch ? Object.entries(COMMON_FOODS).filter(([k])=>k.toLowerCase().includes(foodSearch.toLowerCase())) : Object.entries(COMMON_FOODS).slice(0,12);

  const mealGroups = ["Kahvaltı","Öğle","Akşam","Atıştırma"];

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Sağlık Koçu</h3>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:6,marginBottom:14}}>
        {[["overview","📊 Özet"],["sport","🏃 Spor"],["food","🍽 Beslenme"]].map(([k,v])=>(
          <button key={k} onClick={()=>setView(k)} style={filterBtnStyle(view===k)}>{v}</button>
        ))}
      </div>

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
        <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
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
          <div style={{height:8,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
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
            <div key={i} style={{background:"#1c1c2e",borderRadius:14,padding:"14px",borderLeft:`3px solid ${s.color}`}}>
              <div style={{fontSize:11,opacity:.5}}>{s.icon} {s.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── SPORT ── */}
      {view==="sport"&&(<>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>setModal(true)} style={addBtnStyle}>+ Antrenman</button>
        </div>
        {data.sports.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Henüz kayıt yok</p>}
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
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={()=>setFoodModal(true)} style={addBtnStyle}>+ Yemek Ekle</button>
        </div>
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
        {todayFoods.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Bugün yemek kaydı yok</p>}
      </>)}

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
          <input style={{...inp,flex:1}} type="number" placeholder="Yakılan kalori" value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Notlar (opsiyonel)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={btnPrimary} onClick={addSport}>Kaydet</button>
      </Modal>

      {/* Food Modal */}
      <Modal open={foodModal} onClose={()=>{setFoodModal(false);setFoodSearch("");}} title="Yemek Ekle">
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
        <input style={inp} placeholder="🔍 Yemek ara veya yaz..." value={foodSearch||foodForm.name} onChange={e=>{setFoodSearch(e.target.value);setFoodForm({...foodForm,name:e.target.value,calories:""});}}/>
        {foodSearch&&(
          <div style={{maxHeight:160,overflow:"auto",marginBottom:10}}>
            {filteredFoods.map(([name,cal])=>(
              <div key={name} onClick={()=>{selectCommonFood(name,cal);setFoodSearch("");}} style={{
                display:"flex",justifyContent:"space-between",padding:"8px 10px",cursor:"pointer",
                borderRadius:8,background:"rgba(255,255,255,0.03)",marginBottom:2,
              }}>
                <span style={{fontSize:13}}>{name}</span>
                <span style={{fontSize:12,color:"#f97316",fontWeight:600}}>{cal} kcal</span>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:2}} placeholder="Yemek adı" value={foodForm.name} onChange={e=>setFoodForm({...foodForm,name:e.target.value})}/>
          <input style={{...inp,flex:1}} type="number" placeholder="kcal" value={foodForm.calories} onChange={e=>setFoodForm({...foodForm,calories:e.target.value})}/>
        </div>
        <input style={inp} type="date" value={foodForm.date} onChange={e=>setFoodForm({...foodForm,date:e.target.value})}/>
        <button style={btnPrimary} onClick={addFood}>Ekle</button>
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

  if(!activeRoom) return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Tarzım</h3>
        <button onClick={()=>setRoomModal(true)} style={addBtnStyle}>+ Oda Ekle</button>
      </div>
      <p style={{fontSize:12,opacity:.4,marginBottom:14}}>Kişisel alanların — odalarına dokun ve keşfet</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {rooms.map(room=>{
          const count=room.type==="project"?data.projects.length:(roomItems[room.id]||[]).length;
          return (
            <div key={room.id} onClick={()=>setActiveRoom(room.id)} style={{
              background:"#1c1c2e",borderRadius:16,padding:20,cursor:"pointer",
              borderTop:`3px solid ${room.color}`,textAlign:"center",
            }}>
              <div style={{fontSize:36,marginBottom:8}}>{room.icon}</div>
              <div style={{fontSize:14,fontWeight:700}}>{room.name}</div>
              <div style={{fontSize:11,opacity:.4,marginTop:4}}>{count} öğe</div>
            </div>
          );
        })}
      </div>
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title="Yeni Oda">
        <input style={inp} placeholder="Oda adı..." value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>İkon seç:</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {roomIcons.map(ic=>(
            <button key={ic} onClick={()=>setRoomForm({...roomForm,icon:ic})} style={{
              width:40,height:40,borderRadius:10,fontSize:20,cursor:"pointer",
              background:roomForm.icon===ic?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              border:roomForm.icon===ic?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{ic}</button>
          ))}
        </div>
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
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
        <span style={{fontSize:24}}>{room.icon}</span>
        <h3 style={{margin:0,fontSize:20,fontWeight:800,flex:1}}>{room.name}</h3>
        <button onClick={()=>setModal(true)} style={addBtnStyle}>+ Yeni</button>
      </div>
      {data.projects.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Henüz proje yok</p>}
      {data.projects.map(p=>{
        const tasks=p.tasks||[];const d=tasks.filter(t=>t.done).length;
        const pct=tasks.length?Math.round(d/tasks.length*100):0;const open=exp===p.id;
        return (
          <div key={p.id} style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:8}}>
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
                <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
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
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>◀</button>
        <span style={{fontSize:24}}>{room.icon}</span>
        <h3 style={{margin:0,fontSize:20,fontWeight:800,flex:1}}>{room.name}</h3>
        <button onClick={()=>setItemModal(true)} style={addBtnStyle}>+ Ekle</button>
      </div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:10}}>
        <button onClick={()=>delRoom(activeRoom)} style={{background:"none",border:"none",color:"#ef4444",fontSize:11,cursor:"pointer",opacity:.5}}>Odayı Sil</button>
      </div>
      {items.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Bu oda boş — öğe ekle!</p>}
      {items.map(item=>(
        <div key={item.id} style={{background:"#1c1c2e",borderRadius:14,padding:14,marginBottom:6,borderLeft:`3px solid ${room.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div>
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
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Notlar</h3>
        <button onClick={()=>{setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});setModal(true);}} style={addBtnStyle}>+ Yeni</button>
      </div>
      <input style={{...inp,marginBottom:14}} placeholder="🔍 Notlarda ara..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {filtered.length===0&&<p style={{opacity:.3,fontSize:14,padding:20,gridColumn:"1/-1",textAlign:"center"}}>Not bulunamadı</p>}
        {filtered.map(n=>(
          <div key={n.id} onClick={()=>edit(n)} style={{background:"#1c1c2e",borderRadius:14,padding:14,cursor:"pointer",borderTop:`3px solid ${n.color||"#3b82f6"}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <h4 style={{margin:0,fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</h4>
              <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...delBtnStyle,fontSize:14,marginLeft:4}}>✕</button>
            </div>
            <p style={{fontSize:12,opacity:.5,margin:"8px 0 0",whiteSpace:"pre-wrap",maxHeight:70,overflow:"hidden",lineHeight:1.4}}>{n.content}</p>
            <div style={{fontSize:10,opacity:.25,marginTop:8}}>{n.updatedAt}</div>
          </div>
        ))}
      </div>
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
      <h3 style={{margin:"0 0 16px",fontSize:20,fontWeight:800}}>Ayarlar</h3>

      {msg && <div style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#3b82f6"}}>{msg}</div>}

      {/* User info */}
      <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
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
      <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
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
      <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
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
      <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
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

      {/* Danger zone */}
      <div style={{background:"#1c1c2e",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#ef4444"}}>⚠️ Tehlikeli Bölge</h4>
        <button onClick={clearAll} style={{...btnPrimary,marginTop:0,background:"#ef4444"}}>
          Tüm Verileri Sil
        </button>
      </div>
    </div>
  );
}

/* ═══════════ LOGIN SCREEN ═══════════ */
function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // login, register
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

  return (
    <div style={{
      minHeight:"100vh",minHeight:"100dvh",background:"#0f0f1a",
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#e0e0e0",fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      padding:16,
    }}>
      <div style={{width:"100%",maxWidth:360}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <img src="/zimu-mascot.png" alt="Zimu" style={{width:120,height:120,objectFit:"contain",marginBottom:12}} />
          <div style={{fontSize:28,fontWeight:800,letterSpacing:-1}}>Zimu</div>
          <div style={{fontSize:13,opacity:.4,marginTop:4}}>Hayatını yönet</div>
        </div>

        {/* Error */}
        {error && (
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
            borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#ef4444",textAlign:"center"}}>
            {error}
          </div>
        )}

        {/* Google Sign In */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width:"100%",padding:"14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",
          background:"#1c1c2e",color:"#e0e0e0",fontSize:15,fontWeight:600,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,
          opacity:loading?.6:1,
        }}>
          <span style={{fontSize:18}}>G</span>
          Google ile Giriş Yap
        </button>

        {/* Divider */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}}/>
          <span style={{fontSize:12,opacity:.4}}>veya</span>
          <div style={{flex:1,height:1,background:"rgba(255,255,255,0.08)"}}/>
        </div>

        {/* Email/Password */}
        <input type="email" placeholder="Email adresi" value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{...inp,marginBottom:8}} />
        <input type="password" placeholder="Şifre (en az 6 karakter)" value={password}
          onChange={e=>setPassword(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleEmail()}
          style={inp} />

        <button onClick={handleEmail} disabled={loading} style={{
          ...btnPrimary,opacity:loading?.6:1,marginBottom:12,
        }}>
          {loading ? "Bekleyin..." : mode === "register" ? "Kayıt Ol" : "Giriş Yap"}
        </button>

        {/* Toggle mode */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{
            background:"none",border:"none",color:"#3b82f6",fontSize:13,cursor:"pointer",
          }}>
            {mode === "login" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
          </button>
        </div>

        {/* Skip - use without login */}
        <div style={{textAlign:"center"}}>
          <button onClick={handleSkip} style={{
            background:"none",border:"none",color:"#666",fontSize:12,cursor:"pointer",
          }}>
            Giriş yapmadan devam et →
          </button>
          <div style={{fontSize:10,opacity:.3,marginTop:4}}>
            Veriler sadece bu cihazda kalır
          </div>
        </div>
      </div>
    </div>
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

  // Splash screen
  useEffect(() => {
    const timer = setTimeout(() => setSplash(false), 4000);
    return () => clearTimeout(timer);
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
    <div style={{
      minHeight:"100vh",minHeight:"100dvh",background:"#0f0f1a",
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#e0e0e0",fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      flexDirection:"column",overflow:"hidden",position:"relative",
    }}>
      <style>{`
        @keyframes walkAcross { 
          0% { transform: translateX(-120px) scaleX(1); }
          45% { transform: translateX(40px) scaleX(1); }
          50% { transform: translateX(40px) scaleX(-1); }
          95% { transform: translateX(-40px) scaleX(-1); }
          100% { transform: translateX(-40px) scaleX(1); }
        }
        @keyframes bobWalk {
          0%,100% { transform: translateY(0) rotate(-3deg); }
          25% { transform: translateY(-12px) rotate(3deg); }
          50% { transform: translateY(0) rotate(-3deg); }
          75% { transform: translateY(-12px) rotate(3deg); }
        }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes shimmer { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
        @keyframes groundDraw { from{width:0} to{width:80%} }
      `}</style>

      {/* Walking mascot */}
      <div style={{
        animation:"walkAcross 4s ease-in-out infinite",
        marginBottom:8,
      }}>
        <div style={{animation:"bobWalk 0.6s ease-in-out infinite"}}>
          <img src="/zimu-mascot.png" alt="Zimu" style={{
            width:280,height:280,objectFit:"contain",
            filter:"drop-shadow(0 12px 32px rgba(59,130,246,0.25))",
          }}/>
        </div>
      </div>

      {/* Ground line */}
      <div style={{
        width:"80%",maxWidth:360,height:2,
        background:"linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(59,130,246,0.5), rgba(59,130,246,0.3), transparent)",
        borderRadius:1,marginBottom:24,
        animation:"groundDraw 1s ease-out",
      }}/>

      {/* Text */}
      <div style={{animation:"fadeInUp 0.8s ease 0.3s both",textAlign:"center"}}>
        <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,marginBottom:6}}>Zimu</div>
        <div style={{fontSize:14,opacity:.4,animation:"shimmer 2s ease-in-out infinite"}}>Hayatını yönet...</div>
      </div>
    </div>
  );

  const content = () => {
    switch(tab) {
      case "dashboard": return <Dashboard data={data} setTab={setTab}/>;
      case "tasks": return <Tasks data={data} update={update}/>;
      case "calendar": return <CalendarView data={data} update={update}/>;
      case "sports": return <Sports data={data} update={update}/>;
      case "projects": return <Projects data={data} update={update}/>;
      case "notes": return <Notes data={data} update={update}/>;
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

  const handleScroll = (e) => {
    setShowScrollTop(e.target.scrollTop > 300);
  };
  const scrollToTop = () => {
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const NAV_HEIGHT = isMobile ? 72 : 56;

  const phoneContent = (
    <div style={{
      width:"100%",
      height:isMobile?"auto":"100%",
      minHeight:isMobile?"100dvh":"100%",
      background:"#0f0f1a",color:"#e0e0e0",
      fontFamily:"'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      position:isMobile?"static":"relative",
      overflow:isMobile?"visible":"hidden",
    }}>
      {/* Content area */}
      <div
        ref={isMobile?null:scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={isMobile?undefined:handleScroll}
        style={isMobile ? {
          /* Mobile: normal flow, padding at bottom for fixed nav */
          padding:"16px 16px 100px",
          minHeight:"100dvh",
        } : {
          /* Desktop frame: absolute positioned scroll area */
          position:"absolute",
          top:0,left:0,right:0,
          bottom:NAV_HEIGHT + 10,
          overflow:"auto",
          overflowX:"hidden",
          padding:"16px 16px 20px",
          WebkitOverflowScrolling:"touch",
        }}
      >
        {content()}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={{
          position:"fixed",
          right:16,
          bottom:NAV_HEIGHT + 28,
          width:44,height:44,
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
        position:isMobile?"fixed":"absolute",
        bottom:0,
        left:isMobile?0:0,
        right:isMobile?0:0,
        width:isMobile?undefined:"100%",
        background:"#0c0c16",
        borderTop:"1px solid rgba(255,255,255,0.1)",
        display:"flex",justifyContent:"space-around",alignItems:"center",
        paddingTop:8,
        paddingBottom:isMobile?"max(env(safe-area-inset-bottom, 14px), 14px)":"8px",
        paddingLeft:4,paddingRight:4,
        zIndex:1000,
      }}>
        {allTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?"rgba(59,130,246,0.18)":"none",
            border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:isMobile?4:3,
            padding:isMobile?"10px 6px":"8px 5px",
            minWidth:isMobile?52:40,
            borderRadius:14,
            color:tab===t.id?"#3b82f6":"#666",
            transition:"all .15s",
            flex:1,
          }}>
            <span style={{fontSize:isMobile?24:17,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:isMobile?11:8,fontWeight:tab===t.id?700:500,letterSpacing:-.2}}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1);border-radius:4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
        html, body { margin:0; padding:0; overscroll-behavior:none; background:#080810; height:100%; overflow:hidden; }
        #root { height:100%; }
        @media(display-mode:standalone){ 
          html, body { background:#0f0f1a; }
          body { padding-top: env(safe-area-inset-top); } 
        }
      `}</style>

      <Toast {...toast} />

      {isMobile ? (
        /* Mobile: full screen */
        phoneContent
      ) : (
        /* Desktop: phone frame centered */
        <div style={{
          minHeight:"100vh",background:"#080810",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:"20px",
        }}>
          {/* Phone label */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <span style={{fontSize:18}}>◉</span>
              <span style={{fontWeight:800,fontSize:18,color:"#e0e0e0",letterSpacing:-.5}}>Zimu</span>
            </div>
            {/* Phone frame */}
            <div style={{
              width:390,height:760,
              borderRadius:40,
              border:"4px solid #2a2a3e",
              background:"#0f0f1a",
              overflow:"hidden",
              boxShadow:"0 0 60px rgba(59,130,246,0.08), 0 0 120px rgba(0,0,0,0.5)",
              position:"relative",
            }}>
              {/* Notch */}
              <div style={{
                position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
                width:120,height:28,background:"#080810",
                borderRadius:"0 0 18px 18px",zIndex:100,
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                <div style={{width:60,height:5,borderRadius:3,background:"#1a1a2e"}}/>
              </div>
              {/* Status bar */}
              <div style={{
                position:"absolute",top:0,left:0,right:0,height:44,
                display:"flex",justifyContent:"space-between",alignItems:"flex-end",
                padding:"0 24px 4px",fontSize:12,fontWeight:600,color:"#aaa",zIndex:99,
                background:"linear-gradient(to bottom, rgba(15,15,26,0.9), transparent)",
              }}>
                <span>9:41</span>
                <span style={{display:"flex",gap:4,alignItems:"center"}}>
                  <span style={{fontSize:10}}>5G</span>
                  <span style={{display:"inline-block",width:22,height:10,border:"1.5px solid #aaa",borderRadius:3,position:"relative"}}>
                    <span style={{position:"absolute",left:1.5,top:1.5,bottom:1.5,width:14,background:"#22c55e",borderRadius:1.5}}/>
                  </span>
                </span>
              </div>
              {/* App content */}
              <div style={{paddingTop:44,height:"100%",boxSizing:"border-box"}}>
                {phoneContent}
              </div>
            </div>
            <div style={{fontSize:11,opacity:.25,color:"#888",marginTop:4}}>
              Telefonundan aç → Ana ekrana ekle
            </div>
          </div>
        </div>
      )}
    </>
  );
}
