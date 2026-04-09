import { useState } from "react";
import { VoiceMic } from "./VoiceMic";
import { GroupLabel } from "./ui/GroupLabel";
import { i18n } from "../i18n";
import { today, uid, MN, DN, COLORS } from "../constants";
import { Modal } from "./ui/Modal";
import { FAB } from "./ui/FAB";
import { StickyHeader } from "./ui/StickyHeader";
import { inp, btnPrimary, cardStyle, delBtnStyle } from "../styles";

export default function CalendarView({ data, update }) {
  const T = (key) => i18n(key, data);
  const [vd,setVd]=useState(new Date());
  const [modal,setModal]=useState(false);
  const [selDay,setSelDay]=useState(null);
  const [form,setForm]=useState({title:"",date:"",time:"",color:"#185FA5",description:"",recurring:"none"});

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
    setModal(false);setForm({title:"",date:"",time:"",color:"#185FA5",description:"",recurring:"none"});
  };
  const del=id=>update({...data,events:data.events.filter(e=>e.id!==id)});

  const openAdd=()=>{setModal(true);setForm({title:"",date:selDay?ds(selDay):"",time:"",color:"#185FA5",description:"",recurring:"none"});};

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("calendar")}</h3>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setVd(new Date(y,m-1))} style={{background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)",color:"#8B8578",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>◀</button>
            <span style={{fontWeight:700,fontSize:14,minWidth:105,textAlign:"center"}}>{T("months")[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1))} style={{background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)",color:"#8B8578",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>▶</button>
          </div>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {T("daysShort").map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#8B8578",padding:"6px 0"}}>{d}</div>)}
        {cells.map((d,i)=>{
          const isToday=d&&ds(d)===t;
          const ev=d?evOn(d):[];
          const isSel=d&&selDay===d;
          return (
            <div key={i} onClick={()=>d&&setSelDay(selDay===d?null:d)} style={{
              background:isToday?"rgba(24,95,165,0.12)":isSel?"rgba(24,95,165,0.08)":"#FFFFFF",
              borderRadius:10,minHeight:48,padding:4,cursor:d?"pointer":"default",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              border:isToday?"1.5px solid #185FA5":isSel?"1.5px solid rgba(24,95,165,0.2)":"1.5px solid transparent",
            }}>
              {d&&<>
                <span style={{fontSize:13,fontWeight:isToday?800:400,color:isToday?"#185FA5":"inherit"}}>{d}</span>
                <div style={{display:"flex",gap:2}}>
                  {ev.slice(0,3).map((e,idx)=><div key={idx} style={{width:5,height:5,borderRadius:"50%",background:e.color||"#185FA5"}}/>)}
                </div>
              </>}
            </div>
          );
        })}
      </div>
      {selDay&&(
        <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{selDay} {T("months")[m]}</h4>
            <button onClick={openAdd} style={{background:"rgba(24,95,165,0.08)",color:"#185FA5",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>+ {T("add")}</button>
          </div>
          {evOn(selDay).length===0&&<p style={{color:"#8B8578",fontSize:13,margin:0}}>{T("noEvents")}</p>}
          {evOn(selDay).map((e,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#185FA5",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500}}>{e.title} {e.recurring&&e.recurring!=="none"&&<span style={{fontSize:10,color:"#8B8578"}}>↻</span>}</div>
                {e.time&&<div style={{fontSize:12,color:"#8B8578"}}>◷ {e.time}</div>}
                {e.description&&<div style={{fontSize:12,color:"#8B8578"}}>{e.description}</div>}
              </div>
              <button onClick={()=>del(e.id)} style={delBtnStyle} aria-label="Delete">✕</button>
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
            <GroupLabel label={T("upcoming")} count={upEv.length} color="#534AB7"/>
            {upEv.map(e=>(
              <div key={e.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#534AB7",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                  <div style={{fontSize:11,color:"#8B8578",marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>
                </div>
                <button onClick={()=>update({...data,events:data.events.filter(ev=>ev.id!==e.id)})} style={delBtnStyle} aria-label="Delete">✕</button>
              </div>
            ))}
          </div>
        );
      })()}

      <FAB onClick={openAdd} color="#534AB7"/>

      <Modal open={modal} onClose={()=>setModal(false)} title={T("newEvent")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("eventName")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))} color="#534AB7"/>
        </div>
        <div style={{height:10}}/>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <input style={{...inp,flex:1}} type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
        </div>
        <input style={inp} placeholder={T("descOpt")} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <select style={inp} value={form.recurring} onChange={e=>setForm({...form,recurring:e.target.value})}>
          <option value="none">{T("repeatNone")}</option>
          <option value="daily">{T("repeatDaily")}</option>
          <option value="weekly">{T("repeatWeekly")}</option>
          <option value="monthly">{T("repeatMonthly")}</option>
        </select>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={add}>{T("add")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ SPORTS ═══════════ */
/* ═══════════ SAĞLIK (Health Coach) ═══════════ */
