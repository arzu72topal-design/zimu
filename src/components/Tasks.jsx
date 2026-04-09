import { useState } from "react";
import { VoiceMic } from "./VoiceMic";
import { i18n } from "../i18n";
import { today, uid, PCOL, PRIORITIES } from "../constants";
import { Modal } from "./ui/Modal";
import { FAB } from "./ui/FAB";
import { StickyHeader } from "./ui/StickyHeader";
import { GroupLabel } from "./ui/GroupLabel";
import { inp, btnPrimary, cardStyle, filterBtnStyle, checkBtnStyle, delBtnStyle } from "../styles";

export default function Tasks({ data, update }) {
  const T = (key) => i18n(key, data);
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
    {label:T("today"),val:t,icon:"●"},
    {label:T("tomorrow"),val:tomorrow(),icon:"⏭"},
    {label:T("oneWeek"),val:weekEnd,icon:"◆"},
    {label:T("oneMonth"),val:nextMonth(),icon:"▪"},
  ];

  const formatDate = (d) => {
    if(!d) return "";
    if(d===t) return T("today");
    if(d===tomorrow()) return T("tomorrow");
    return new Date(d).toLocaleDateString(T("locale"),{day:"numeric",month:"short"});
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
    {key:"overdue",label:T("grpOverdue"),color:"#D85A30",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate<t)},
    {key:"today",label:T("grpToday"),color:"#185FA5",tasks:list.filter(x=>!x.done&&x.dueDate===t)},
    {key:"week",label:T("grpWeek"),color:"#534AB7",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate>t&&x.dueDate<=weekEnd)},
    {key:"pending",label:T("grpPending"),color:"#8B8578",tasks:list.filter(x=>!x.done&&(!x.dueDate||x.dueDate>weekEnd))},
    {key:"done",label:T("grpDone"),color:"#1D9E75",tasks:list.filter(x=>x.done)},
  ].filter(g=>g.tasks.length>0) : null;

  const TaskCard = ({ task }) => (
    <div style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52,opacity:task.done?.5:1,
      border:`1px solid ${task.done?"rgba(16,185,129,0.1)":PCOL[task.priority]+"15"}`,
    }}>
      <button onClick={()=>toggle(task.id)} style={checkBtnStyle(task.done)} aria-label={task.done?"Mark incomplete":"Mark complete"}>{task.done&&"✓"}</button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setDetail(detail===task.id?null:task.id)}>
        <div style={{fontSize:14,fontWeight:600,color:"#2C2A26",textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
          {task.priority&&<span style={{background:`${PCOL[task.priority]}15`,color:PCOL[task.priority],padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600}}>{({high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[task.priority])}</span>}
          {task.category&&<span style={{background:"rgba(24,95,165,0.08)",color:"#185FA5",padding:"2px 8px",borderRadius:6,fontSize:11}}>{task.category}</span>}
          {task.dueDate&&<span style={{fontSize:11,color:!task.done&&task.dueDate<t?"#D85A30":"#8B8578"}}>{formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <button onClick={()=>del(task.id)} style={delBtnStyle} aria-label="Delete">✕</button>
    </div>
  );

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("tasks")}</h3>
          <span style={{fontSize:12,color:"#8B8578",fontWeight:500}}>{pending} {T("waiting")}</span>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
          {[["all",T("all")],["pending",T("pendingF")],["done",T("done")],["high",T("priorityF")],["overdue",T("overdueF")]].map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} style={filterBtnStyle(filter===k)}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {groups ? (
        groups.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="#1D9E75" strokeWidth="1.5" fill="rgba(29,158,117,0.1)"/><path d="M13 20l5 5 9-10" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:4}}>{T("allDone")}</div>
              <div style={{fontSize:12,color:"#8B8578"}}>{T("addFirst")}</div>
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
              <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="#1D9E75" strokeWidth="1.5" fill="rgba(29,158,117,0.1)"/><path d="M13 20l5 5 9-10" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:4}}>{T("allDone")}</div>
              <div style={{fontSize:12,color:"#8B8578"}}>{T("addFirst")}</div>
            </div>
          )
          : list.map(task=><TaskCard key={task.id} task={task}/>)
      )}

      {detail && (() => {
        const task = data.tasks.find(tk=>tk.id===detail);
        if(!task) return null;
        return (
          <div style={{background:"#FFFFFF",borderRadius:16,padding:16,marginTop:8,border:"1px solid rgba(24,95,165,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:16,fontWeight:700}}>{task.title}</h4>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>openEdit(task)} style={{background:"rgba(24,95,165,0.08)",color:"#185FA5",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("edit")}</button>
                <button onClick={()=>setDetail(null)} style={{background:"#F5F0E8",color:"#8B8578",border:"none",borderRadius:8,padding:"6px 10px",fontSize:14,cursor:"pointer"}}>✕</button>
              </div>
            </div>
            {task.description&&<p style={{fontSize:13,opacity:.7,margin:"0 0 10px",whiteSpace:"pre-wrap",lineHeight:1.5}}>{task.description}</p>}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,opacity:.6}}>
              {task.category&&<span>● {task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#D85A30":"inherit"}}>◆ {task.dueDate}</span>}
              <span>▸ {({high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[task.priority])}</span>
              <span>{task.done?`◉ ${T("statusDone")}`:`◎ ${T("statusWaiting")}`}</span>
            </div>
          </div>
        );
      })()}

      <FAB onClick={openNew}/>

      <Modal open={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId?T("editTask"):T("newTask")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("taskTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))}/>
        </div>
        <div style={{height:10}}/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("descOpt")} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input style={inp} placeholder={T("catOpt")} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#8B8578",marginBottom:6}}>Tarih seç:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {quickDates.map(q=>(
              <button key={q.label} onClick={()=>setForm({...form,dueDate:q.val})} style={{
                background:form.dueDate===q.val?"rgba(24,95,165,0.12)":"#F5F0E8",
                color:form.dueDate===q.val?"#185FA5":"#aaa",
                border:form.dueDate===q.val?"1px solid rgba(24,95,165,0.2)":"1px solid rgba(0,0,0,0.06)",
                padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{q.icon} {q.label}</button>
            ))}
            {form.dueDate&&<button onClick={()=>setForm({...form,dueDate:""})} style={{
              background:"rgba(216,90,48,0.1)",color:"#D85A30",border:"1px solid rgba(216,90,48,0.2)",
              padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>✕ {T("clear")}</button>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            {form.dueDate&&<span style={{fontSize:13,color:"#185FA5",fontWeight:600,whiteSpace:"nowrap"}}>{formatDate(form.dueDate)}</span>}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:"#8B8578",marginBottom:6}}>{T("selPriority")}</div>
          <div style={{display:"flex",gap:6}}>
            {Object.keys(PCOL).map(k=>(
              <button key={k} onClick={()=>setForm({...form,priority:k})} style={{
                flex:1,padding:"10px",borderRadius:10,fontSize:13,cursor:"pointer",textAlign:"center",fontWeight:600,
                background:form.priority===k?`${PCOL[k]}20`:"#F5F0E8",
                color:form.priority===k?PCOL[k]:"#8B8578",
                border:`1px solid ${form.priority===k?PCOL[k]+"40":"rgba(0,0,0,0.06)"}`,
              }}>
                <span style={{display:"block",width:8,height:8,borderRadius:"50%",background:PCOL[k],margin:"0 auto 4px"}}/>
                {{high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[k]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={save}>{editingId?T("save"):T("add")}</button>
        {editingId&&<button onClick={()=>{del(editingId);setModal(false);setEditingId(null);}} style={{...btnPrimary,background:"#D85A30",marginTop:8}}>{T("deleteTask")}</button>}
      </Modal>
    </div>
  );
}

/* ═══════════ CALENDAR ═══════════ */
