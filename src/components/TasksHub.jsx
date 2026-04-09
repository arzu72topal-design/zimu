import { useState, useEffect } from "react";
import { i18n } from "../i18n";
import { StickyHeader } from "./ui/StickyHeader";
import { filterBtnStyle } from "../styles";
import Tasks from "./Tasks";
import CalendarView from "./CalendarView";
import Notes from "./Notes";

export default function TasksHub({ data, update, initialSubTab, onSubTabConsumed }) {
  const T = (key) => i18n(key, data);
  const [subTab, setSubTab] = useState("tasks");

  // Dashboard'dan gelen sub-tab yönlendirmesini yakala
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      onSubTabConsumed?.();
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      }, 80);
    }
  }, [initialSubTab]);
  return (
    <div>
      <div style={{
        display:"flex",gap:6,marginBottom:2,
        background:"rgba(245,245,247,0.95)",
        
        padding:"10px 4px 8px",
        borderRadius:14,
        position:"sticky",top:0,zIndex:60,
      }}>
        {[["tasks",T("tasks"),"✓"],["calendar",T("calendar"),"◫"],["notes",T("notes"),"☰"]].map(([k,v,icon])=>(
          <button key={k} className="nav-item" onClick={()=>setSubTab(k)} style={{
            flex:1,
            background:subTab===k?"rgba(59,130,246,0.15)":"#f0f0f5",
            color:subTab===k?"#3b82f6":"#9CA3AF",
            border:subTab===k?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(0,0,0,0.06)",
            padding:"10px 4px",borderRadius:10,fontSize:12,fontWeight:subTab===k?700:500,
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
          }}>
            <span style={{fontSize:16}}>{icon}</span>
            {v}
          </button>
        ))}
      </div>
      <div key={subTab} className="page-enter">
        {subTab==="tasks" && <Tasks data={data} update={update}/>}
        {subTab==="calendar" && <CalendarView data={data} update={update}/>}
        {subTab==="notes" && <Notes data={data} update={update}/>}
      </div>
    </div>
  );
}

/* ═══════════ SETTINGS ═══════════ */
