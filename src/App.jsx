import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData, exportData, importData } from "./db.js";
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
  { id: "sports", label: "Spor", icon: "♦" },
  { id: "projects", label: "Projeler", icon: "◈" },
  { id: "notes", label: "Notlar", icon: "☰" },
];

const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
const SPORT_EMOJI = {"Koşu":"🏃","Yüzme":"🏊","Bisiklet":"🚴","Yoga":"🧘","Ağırlık":"🏋️","Yürüyüş":"🚶","Diğer":"⚡"};
const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const PCOL = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7","#f97316","#14b8a6"];
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
        background:"#1c1c2e",width:"100%",maxWidth:480,maxHeight:"85vh",
        borderRadius:"20px 20px 0 0",overflow:"auto",animation:"slideUp .25s ease",
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
        <div style={{padding:"16px 20px 28px"}}>{children}</div>
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
  const pending = data.tasks.filter(x=>!x.done).length;
  const done = data.tasks.filter(x=>x.done).length;
  const todayEv = data.events.filter(e=>e.date===t);
  const wkSport = data.sports.filter(s=>{ const d=(new Date()-new Date(s.date))/(864e5); return d>=0&&d<=7; });
  const active = data.projects.filter(p=>p.status!=="Tamamlandı");

  const cards = [
    { icon:"⏳",val:pending,label:"Bekleyen",color:"#ef4444",tap:()=>setTab("tasks") },
    { icon:"✓",val:done,label:"Tamamlanan",color:"#22c55e",tap:()=>setTab("tasks") },
    { icon:"📅",val:todayEv.length,label:"Bugün",color:"#3b82f6",tap:()=>setTab("calendar") },
    { icon:"🏃",val:wkSport.length,label:"Haftalık Spor",color:"#f97316",tap:()=>setTab("sports") },
    { icon:"📂",val:active.length,label:"Aktif Proje",color:"#a855f7",tap:()=>setTab("projects") },
    { icon:"📝",val:data.notes.length,label:"Not",color:"#14b8a6",tap:()=>setTab("notes") },
  ];

  const upcoming = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);
  const urgentTasks = data.tasks.filter(x=>!x.done).sort((a,b)=>{
    const po = {high:0,medium:1,low:2};
    return (po[a.priority]||1) - (po[b.priority]||1);
  }).slice(0,4);

  // Overdue indicator
  const overdue = data.tasks.filter(x=>!x.done && x.dueDate && x.dueDate < t);

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{margin:0,fontSize:24,fontWeight:800,letterSpacing:-.5}}>Merhaba! 👋</h2>
        <p style={{margin:"4px 0 0",opacity:.5,fontSize:14}}>
          {new Date().toLocaleDateString("tr-TR",{weekday:"long",day:"numeric",month:"long"})}
        </p>
      </div>

      {overdue.length > 0 && (
        <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
          borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8,
        }}>
          <span style={{fontSize:16}}>🚨</span>
          <span style={{fontSize:13,color:"#ef4444",fontWeight:600}}>{overdue.length} gecikmiş görev var!</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {cards.map((c,i)=>(
          <div key={i} onClick={c.tap} style={{background:"#1c1c2e",borderRadius:14,padding:"14px 10px",textAlign:"center",cursor:"pointer",borderBottom:`3px solid ${c.color}`}}>
            <div style={{fontSize:22,marginBottom:4}}>{c.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.val}</div>
            <div style={{fontSize:10,opacity:.5,marginTop:2}}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>⏳ Yaklaşan Görevler</h4>
        {urgentTasks.length===0 && <p style={{opacity:.3,fontSize:13,margin:0}}>Harika, görev yok!</p>}
        {urgentTasks.map(t=>(
          <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:PCOL[t.priority],flexShrink:0}}/>
            <span style={{fontSize:14,flex:1}}>{t.title}</span>
            {t.dueDate && <span style={{fontSize:11,opacity:.4,color:t.dueDate<today()?"#ef4444":"inherit"}}>{t.dueDate.slice(5)}</span>}
          </div>
        ))}
      </div>

      <div style={{background:"#1c1c2e",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>📅 Yaklaşan Etkinlikler</h4>
        {upcoming.length===0 && <p style={{opacity:.3,fontSize:13,margin:0}}>Etkinlik yok</p>}
        {upcoming.map(e=>(
          <div key={e.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:e.color||"#3b82f6",flexShrink:0}}/>
            <span style={{fontSize:14,flex:1}}>{e.title}</span>
            <span style={{fontSize:11,opacity:.4}}>{e.time || ""} {e.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
function Tasks({ data, update }) {
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState("all");
  const [form,setForm]=useState({title:"",priority:"medium",dueDate:"",category:""});

  const add=()=>{
    if(!form.title.trim())return;
    update({...data,tasks:[{id:uid(),...form,done:false,createdAt:today()},...data.tasks]});
    setModal(false);setForm({title:"",priority:"medium",dueDate:"",category:""});
  };
  const toggle=id=>update({...data,tasks:data.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});
  const del=id=>update({...data,tasks:data.tasks.filter(t=>t.id!==id)});

  const t = today();
  const list = data.tasks.filter(task=>{
    if(filter==="done")return task.done;
    if(filter==="pending")return !task.done;
    if(filter==="high")return task.priority==="high"&&!task.done;
    if(filter==="overdue")return !task.done && task.dueDate && task.dueDate < t;
    return true;
  });

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Görevler</h3>
        <button onClick={()=>setModal(true)} style={addBtnStyle}>+ Yeni</button>
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
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:500,textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
            <div style={{fontSize:11,opacity:.5,marginTop:2,display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
              {task.category&&<span style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#ef4444":"inherit"}}>📅 {task.dueDate}</span>}
            </div>
          </div>
          <span style={{width:10,height:10,borderRadius:"50%",background:PCOL[task.priority],flexShrink:0}}/>
          <button onClick={()=>del(task.id)} style={delBtnStyle}>✕</button>
        </div>
      ))}
      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Görev">
        <input style={inp} placeholder="Görev başlığı..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <input style={inp} placeholder="Kategori (opsiyonel)" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
          <select style={{...inp,flex:1}} value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>
            {Object.entries(PRIORITIES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button style={btnPrimary} onClick={add}>Ekle</button>
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
function Sports({ data, update }) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});

  const add=()=>{
    if(!form.duration)return;
    const ns={id:uid(),...form,duration:+form.duration,distance:+form.distance||0,calories:+form.calories||0};
    update({...data,sports:[ns,...data.sports]});
    setModal(false);setForm({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  };
  const del=id=>update({...data,sports:data.sports.filter(s=>s.id!==id)});

  const wk=data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const tMin=wk.reduce((a,s)=>a+(s.duration||0),0);
  const tCal=wk.reduce((a,s)=>a+(s.calories||0),0);
  const tDist=wk.reduce((a,s)=>a+(s.distance||0),0);

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Spor</h3>
        <button onClick={()=>setModal(true)} style={addBtnStyle}>+ Antrenman</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:16}}>
        {[
          {icon:"⏱",val:`${tMin} dk`,label:"Süre",color:"#3b82f6"},
          {icon:"🔥",val:`${tCal}`,label:"Kalori",color:"#ef4444"},
          {icon:"📏",val:`${tDist.toFixed(1)} km`,label:"Mesafe",color:"#22c55e"},
          {icon:"💪",val:wk.length,label:"Antrenman",color:"#f97316"},
        ].map((s,i)=>(
          <div key={i} style={{background:"#1c1c2e",borderRadius:14,padding:"14px",borderLeft:`3px solid ${s.color}`}}>
            <div style={{fontSize:11,opacity:.5}}>{s.icon} {s.label}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
          </div>
        ))}
      </div>
      {data.sports.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Henüz kayıt yok</p>}
      {data.sports.slice(0,30).map(s=>(
        <div key={s.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:24,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",borderRadius:12}}>{SPORT_EMOJI[s.type]||"⚡"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:600}}>{s.type}</div>
            <div style={{fontSize:12,opacity:.5}}>{s.date} · {s.duration}dk {s.distance>0&&`· ${s.distance}km`} {s.calories>0&&`· ${s.calories}kcal`}</div>
            {s.notes&&<div style={{fontSize:11,opacity:.4,marginTop:2}}>{s.notes}</div>}
          </div>
          <button onClick={()=>del(s.id)} style={delBtnStyle}>✕</button>
        </div>
      ))}
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
          <input style={{...inp,flex:1}} type="number" placeholder="Kalori" value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Notlar (opsiyonel)" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={btnPrimary} onClick={add}>Kaydet</button>
      </Modal>
    </div>
  );
}

/* ═══════════ PROJECTS ═══════════ */
function Projects({ data, update }) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  const [exp,setExp]=useState(null);
  const [tf,setTf]=useState({title:""});

  const add=()=>{
    if(!form.name.trim())return;
    const np={id:uid(),...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),tasks:[],createdAt:today()};
    update({...data,projects:[np,...data.projects]});
    setModal(false);setForm({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  };
  const del=id=>update({...data,projects:data.projects.filter(p=>p.id!==id)});
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

  return (
    <div>
      <div style={sectionHeader}>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Projeler</h3>
        <button onClick={()=>setModal(true)} style={addBtnStyle}>+ Yeni</button>
      </div>
      {data.projects.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>Henüz proje yok</p>}
      {data.projects.map(p=>{
        const tasks=p.tasks||[]; const d=tasks.filter(t=>t.done).length;
        const pct=tasks.length?Math.round(d/tasks.length*100):0;
        const open=exp===p.id;
        return (
          <div key={p.id} style={{background:"#1c1c2e",borderRadius:14,padding:16,marginBottom:8}}>
            <div onClick={()=>setExp(open?null:p.id)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.tags?.map(t=><span key={t} style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
                    {p.deadline&&<span>📅 {p.deadline}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:stCol(p.status),background:`${stCol(p.status)}20`,padding:"4px 10px",borderRadius:8,whiteSpace:"nowrap"}}>{p.status}</span>
              </div>
              {tasks.length>0&&(
                <div style={{marginTop:10}}>
                  <div style={{height:6,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"#3b82f6",borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/>
                  </div>
                  <div style={{fontSize:11,opacity:.4,marginTop:4}}>{d}/{tasks.length} — %{pct}</div>
                </div>
              )}
            </div>
            {open&&(
              <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                {p.description&&<p style={{fontSize:13,opacity:.6,margin:"0 0 10px"}}>{p.description}</p>}
                <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                  {PROJECT_STATUSES.map(s=>(
                    <button key={s} onClick={()=>upSt(p.id,s)} style={{
                      background:p.status===s?`${stCol(s)}20`:"rgba(255,255,255,0.04)",
                      color:p.status===s?stCol(s):"#888",
                      border:`1px solid ${p.status===s?stCol(s)+"40":"rgba(255,255,255,0.06)"}`,
                      padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer",
                    }}>{s}</button>
                  ))}
                </div>
                {tasks.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                    <button onClick={()=>togPT(p.id,t.id)} style={checkBtnStyle(t.done)}>{t.done&&"✓"}</button>
                    <span style={{fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.4:1}}>{t.title}</span>
                  </div>
                ))}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <input style={{...inp,flex:1,marginBottom:0}} placeholder="Alt görev ekle..." value={tf.title}
                    onChange={e=>setTf({title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addPT(p.id)}/>
                  <button onClick={()=>addPT(p.id)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,padding:"0 18px",fontSize:18,cursor:"pointer"}}>+</button>
                </div>
                <button onClick={()=>del(p.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px",width:"100%",marginTop:12,fontSize:13,cursor:"pointer"}}>Projeyi Sil</button>
              </div>
            )}
          </div>
        );
      })}
      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Proje">
        <input style={inp} placeholder="Proje adı..." value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
        <input style={inp} placeholder="Açıklama..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div style={{display:"flex",gap:8}}>
          <select style={{...inp,flex:1}} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
            {PROJECT_STATUSES.map(s=><option key={s}>{s}</option>)}
          </select>
          <input style={{...inp,flex:1}} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Etiketler (virgülle ayırın)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={add}>Oluştur</button>
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
function Settings({ data, update, onImport }) {
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

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const isMobile = useIsMobile();

  useEffect(() => {
    loadData().then(d => { setData(d); setLoading(false); });
  }, []);

  // Schedule notifications when data changes
  useEffect(() => {
    if (!data) return;
    if (getNotificationPermission() === "granted") {
      scheduleEventReminders(data.events, data.settings?.reminderMinutes || 15);
      scheduleTaskReminders(data.tasks);
    }
  }, [data?.events, data?.tasks]);

  const update = useCallback(async (newData) => {
    setData(newData);
    await saveData(newData);
  }, []);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2000);
  };

  if (loading || !data) return (
    <div style={{minHeight:"100vh",minHeight:"100dvh",background:"#0f0f1a",display:"flex",alignItems:"center",justifyContent:"center",color:"#e0e0e0",fontFamily:"'SF Pro Display',-apple-system,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:10,animation:"pulse 1.5s infinite"}}>◉</div>
        <div style={{fontSize:14,opacity:.5}}>Yükleniyor...</div>
      </div>
    </div>
  );

  const allTabs = [...TABS, { id: "settings", label: "Ayarlar", icon: "⚙" }];

  const content = () => {
    switch(tab) {
      case "dashboard": return <Dashboard data={data} setTab={setTab}/>;
      case "tasks": return <Tasks data={data} update={update}/>;
      case "calendar": return <CalendarView data={data} update={update}/>;
      case "sports": return <Sports data={data} update={update}/>;
      case "projects": return <Projects data={data} update={update}/>;
      case "notes": return <Notes data={data} update={update}/>;
      case "settings": return <Settings data={data} update={update} onImport={d=>{setData(d);showToast("Veriler aktarıldı!")}}/>;
    }
  };

  return (
    <div style={{minHeight:"100vh",minHeight:"100dvh",background:"#0f0f1a",color:"#e0e0e0",fontFamily:"'SF Pro Display',-apple-system,'Segoe UI',sans-serif"}}>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1);border-radius:4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
        body { margin:0; overscroll-behavior:none; }
        @media(display-mode:standalone){ body { padding-top: env(safe-area-inset-top); } }
      `}</style>

      <Toast {...toast} />

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{position:"fixed",left:0,top:0,bottom:0,width:200,background:"#151525",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",zIndex:100}}>
          <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:20}}>◉</span>
              <span style={{fontWeight:800,fontSize:15,letterSpacing:-.5}}>Zimu</span>
            </div>
          </div>
          <nav style={{padding:"10px 8px",flex:1}}>
            {allTabs.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",
                border:"none",borderRadius:10,marginBottom:2,cursor:"pointer",fontSize:13,textAlign:"left",
                background:tab===t.id?"rgba(59,130,246,0.12)":"transparent",
                color:tab===t.id?"#3b82f6":"#888",fontWeight:tab===t.id?600:400,
              }}>
                <span style={{fontSize:16,width:22,textAlign:"center"}}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div style={{padding:16,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:10,opacity:.25}}>
            v1.0 · Veriler telefonunuzda
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{
        marginLeft:isMobile?0:200,
        padding:isMobile?"16px 16px 100px":"24px 28px 24px",
        maxWidth:700,
      }}>
        {content()}
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{
          position:"fixed",bottom:0,left:0,right:0,
          background:"rgba(21,21,37,0.95)",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          borderTop:"1px solid rgba(255,255,255,0.08)",
          display:"flex",justifyContent:"space-around",alignItems:"center",
          padding:"4px 0 env(safe-area-inset-bottom, 10px)",
          zIndex:1000,
        }}>
          {allTabs.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:tab===t.id?"rgba(59,130,246,0.15)":"none",
              border:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              padding:"8px 5px",minWidth:40,borderRadius:12,
              color:tab===t.id?"#3b82f6":"#555",
            }}>
              <span style={{fontSize:17,lineHeight:1}}>{t.icon}</span>
              <span style={{fontSize:8,fontWeight:tab===t.id?700:400,letterSpacing:-.2}}>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
