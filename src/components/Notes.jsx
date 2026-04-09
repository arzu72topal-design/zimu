import { useState } from "react";
import { VoiceMic } from "./VoiceMic";
import { i18n } from "../i18n";
import { uid, today, COLORS } from "../constants";
import { Modal } from "./ui/Modal";
import { FAB } from "./ui/FAB";
import { StickyHeader } from "./ui/StickyHeader";
import { inp, btnPrimary, cardStyle, delBtnStyle } from "../styles";

export default function Notes({ data, update }) {
  const T = (key) => i18n(key, data);
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({title:"",content:"",color:"#185FA5"});
  const [search,setSearch]=useState("");

  const save2=()=>{
    if(!form.title.trim())return;
    if(editing){
      update({...data,notes:data.notes.map(n=>n.id===editing?{...n,...form,updatedAt:today()}:n)});
    } else {
      update({...data,notes:[{id:uid(),...form,createdAt:today(),updatedAt:today()},...data.notes]});
    }
    setModal(false);setEditing(null);setForm({title:"",content:"",color:"#185FA5"});
  };
  const del=id=>update({...data,notes:data.notes.filter(n=>n.id!==id)});
  const edit=n=>{setForm({title:n.title,content:n.content,color:n.color||"#185FA5"});setEditing(n.id);setModal(true);};

  const filtered=data.notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("notes")}</h3>
          <span style={{fontSize:12,color:"#8B8578"}}>{data.notes.length} not</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input
            style={{...inp,flex:1,marginBottom:0,background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)"}}
            placeholder={T("searchNotes")}
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <VoiceMic onResult={(t)=>setSearch(t)} color="#1D9E75" size={34}/>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px"}}>
            <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="4" width="24" height="32" rx="3" stroke="#8B8578" strokeWidth="1.5" fill="none"/><line x1="14" y1="12" x2="26" y2="12" stroke="#8B8578" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="18" x2="26" y2="18" stroke="#8B8578" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/><line x1="14" y1="24" x2="22" y2="24" stroke="#8B8578" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg></div>
            <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:4}}>{data.notes.length===0?T("noNotesYet"):T("noResult")}</div>
            {data.notes.length===0&&<div style={{fontSize:12,color:"#8B8578"}}>{T("addFirstNote")}</div>}
          </div>
        )}
        {filtered.map(n=>(
          <div key={n.id} onClick={()=>edit(n)} style={{...cardStyle,padding:14,cursor:"pointer",borderTop:`3px solid ${n.color||"#185FA5"}`,minHeight:100,boxShadow:`0 0 20px ${n.color||"#185FA5"}18`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <h4 style={{margin:0,fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</h4>
              <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...delBtnStyle,fontSize:14,marginLeft:4}}>✕</button>
            </div>
            <p style={{fontSize:12,color:"#8B8578",margin:"8px 0 0",whiteSpace:"pre-wrap",maxHeight:70,overflow:"hidden",lineHeight:1.4}}>{n.content}</p>
            <div style={{fontSize:10,opacity:.25,marginTop:8}}>{n.updatedAt}</div>
          </div>
        ))}
      </div>
      <FAB onClick={()=>{setEditing(null);setForm({title:"",content:"",color:"#185FA5"});setModal(true);}} color="#1D9E75"/>
      <Modal open={modal} onClose={()=>{setModal(false);setEditing(null);}} title={editing?T("editNote"):T("newNote")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("noteTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))} color="#1D9E75"/>
        </div>
        <div style={{height:10}}/>
        <textarea style={{...inp,minHeight:140,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("noteContent")} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={save2}>{editing?T("update"):T("save")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ TASKS HUB (Görevler + Takvim + Notlar) ═══════════ */
