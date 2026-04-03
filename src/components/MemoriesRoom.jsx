import { useState, useRef } from "react";
import { i18n } from "../i18n";
import { uid, today, COLORS } from "../constants";
import { Modal } from "./ui/Modal";
import { FAB } from "./ui/FAB";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, inp, btnPrimary, filterBtnStyle } from "../styles";

const DEFAULT_MEMORY_FOLDERS = [
  { id:"tatiller", name:"Tatiller", color:"#22c55e", icon:"T" },
  { id:"aile", name:"Aile", color:"#3b82f6", icon:"A" },
  { id:"arkadaslar", name:"Arkadaşlar", color:"#a855f7", icon:"Ar" },
];
const MOOD_LIST = [
  { id:"happy", label:"Mutlu", color:"#22c55e", symbol:"☺" },
  { id:"love", label:"Aşk", color:"#ec4899", symbol:"♥" },
  { id:"excited", label:"Heyecanlı", color:"#f59e0b", symbol:"★" },
  { id:"peaceful", label:"Huzurlu", color:"#06b6d4", symbol:"◉" },
  { id:"sad", label:"Üzgün", color:"#6366f1", symbol:"◎" },
  { id:"angry", label:"Kızgın", color:"#ef4444", symbol:"▲" },
  { id:"thoughtful", label:"Düşünceli", color:"#8b5cf6", symbol:"◆" },
  { id:"funny", label:"Komik", color:"#f97316", symbol:"✦" },
];

function resizeImage(file, maxSize=600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w=img.width, h=img.height;
        if(w>maxSize||h>maxSize){
          if(w>h){h=Math.round(h*maxSize/w);w=maxSize;}
          else{w=Math.round(w*maxSize/h);h=maxSize;}
        }
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function MemoriesRoom({ data, update, onBack }) {
  const T = (key) => i18n(key, data);
  const memories = data?.memories || { folders: [...DEFAULT_MEMORY_FOLDERS], items: [] };
  const folders = memories.folders || [...DEFAULT_MEMORY_FOLDERS];
  const items = memories.items || [];

  const save = (newMem) => update({ ...data, memories: newMem });

  const [view, setView] = useState("folders"); // folders | list | detail
  const [activeFolder, setActiveFolder] = useState(null); // null = all
  const [activeItem, setActiveItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title:"", text:"", date:today(), mood:"", folder:"", tags:"", photos:[] });
  const [folderForm, setFolderForm] = useState({ name:"", color:"#22c55e", icon:"N" });
  const fileRef = useRef(null);

  const FOLDER_ICONS = ["T","A","Ar","Ok","İş","Mü","Ev","Gez","Dk","Pt","Sev","Sp"];

  const openFolder = (folderId) => { setActiveFolder(folderId); setView("list"); };
  const openAll = () => { setActiveFolder(null); setView("list"); };
  const openDetail = (item) => { setActiveItem(item); setView("detail"); };
  const goBack = () => {
    if(view==="detail"){ setView("list"); setActiveItem(null); }
    else if(view==="list"){ setView("folders"); setActiveFolder(null); }
    else onBack();
  };

  const filteredItems = (activeFolder
    ? items.filter(i=>i.folder===activeFolder)
    : items
  ).filter(i=> !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.text?.toLowerCase().includes(search.toLowerCase()))
   .sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));

  const addPhoto = async (e) => {
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    const resized = await Promise.all(files.slice(0,5).map(f=>resizeImage(f)));
    setForm(prev=>({...prev, photos:[...prev.photos,...resized].slice(0,8)}));
  };
  const removePhoto = (idx) => setForm(prev=>({...prev, photos:prev.photos.filter((_,i)=>i!==idx)}));

  const saveMemory = () => {
    if(!form.title.trim()) return;
    const entry = {
      id: editingId || uid(),
      title:form.title.trim(), text:form.text.trim(),
      date:form.date||today(), mood:form.mood, folder:form.folder,
      tags: form.tags ? form.tags.split(",").map(t=>t.trim()).filter(Boolean) : [],
      photos: form.photos,
      createdAt: editingId ? items.find(i=>i.id===editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newItems = editingId ? items.map(i=>i.id===editingId?entry:i) : [entry,...items];
    save({ ...memories, items:newItems });
    setShowAdd(false); setEditingId(null);
    setForm({ title:"", text:"", date:today(), mood:"", folder:activeFolder||"", tags:"", photos:[] });
  };

  const deleteMemory = (id) => {
    save({ ...memories, items:items.filter(i=>i.id!==id) });
    if(view==="detail") goBack();
  };

  const editMemory = (item) => {
    setEditingId(item.id);
    setForm({ title:item.title, text:item.text||"", date:item.date||"", mood:item.mood||"", folder:item.folder||"", tags:(item.tags||[]).join(", "), photos:item.photos||[] });
    setShowAdd(true);
  };

  const addFolder = () => {
    if(!folderForm.name.trim()) return;
    const f = { id:uid(), name:folderForm.name.trim(), color:folderForm.color, icon:folderForm.icon };
    save({ ...memories, folders:[...folders, f] });
    setShowFolderModal(false); setFolderForm({ name:"", color:"#22c55e", icon:"N" });
  };

  const deleteFolder = (folderId) => {
    save({ ...memories, folders:folders.filter(f=>f.id!==folderId), items:items.filter(i=>i.folder!==folderId) });
  };

  const folderInfo = (fId) => folders.find(f=>f.id===fId);
  const itemCountForFolder = (fId) => items.filter(i=>i.folder===fId).length;

  /* ── DETAIL VIEW ── */
  if(view==="detail" && activeItem) {
    const fi = folderInfo(activeItem.folder);
    return (
      <div className="room-enter">
        <StickyHeader>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="back-btn" onClick={goBack}>◀</button>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,flex:1}}>{activeItem.title}</h3>
            <button onClick={()=>editMemory(activeItem)} style={{background:"rgba(59,130,246,0.15)",border:"none",color:"#3b82f6",width:34,height:34,borderRadius:10,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
            <button onClick={()=>deleteMemory(activeItem.id)} style={{background:"rgba(239,68,68,0.1)",border:"none",color:"#ef4444",width:34,height:34,borderRadius:10,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </StickyHeader>

        {/* Photos */}
        {activeItem.photos?.length>0&&(
          <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:6}}>
            {activeItem.photos.map((p,i)=>(
              <img key={i} src={p} alt="" style={{width:activeItem.photos.length===1?"100%":200,height:activeItem.photos.length===1?"auto":200,objectFit:"cover",borderRadius:16,flexShrink:0}}/>
            ))}
          </div>
        )}

        {/* Mood + date + folder */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {activeItem.mood&&<span style={{fontSize:24}}>{activeItem.mood}</span>}
          <span style={{fontSize:12,color:"#9CA3AF"}}>{activeItem.date}</span>
          {fi&&<span style={{fontSize:11,background:`${fi.color}20`,color:fi.color,padding:"2px 10px",borderRadius:8}}>{fi.icon} {fi.name}</span>}
        </div>

        {/* Text */}
        {activeItem.text&&(
          <div style={{fontSize:15,lineHeight:1.7,color:"#F9FAFB",marginBottom:16,whiteSpace:"pre-wrap"}}>{activeItem.text}</div>
        )}

        {/* Tags */}
        {activeItem.tags?.length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {activeItem.tags.map(t=><span key={t} style={{background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"3px 10px",borderRadius:8,fontSize:11}}>#{t}</span>)}
          </div>
        )}
      </div>
    );
  }

  /* ── LIST VIEW ── */
  if(view==="list") {
    const fi = activeFolder ? folderInfo(activeFolder) : null;
    return (
      <div className="room-enter">
        <StickyHeader>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button className="back-btn" onClick={goBack}>◀</button>
            {fi ? (
              <><span style={{fontSize:20}}>{fi.icon}</span>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:fi.color,flex:1}}>{fi.name}</h3></>
            ) : (
              <h3 style={{margin:0,fontSize:18,fontWeight:800,flex:1}}>{T("allMemories")}</h3>
            )}
            <span style={{fontSize:11,color:"#9CA3AF"}}>{filteredItems.length} {T("memoryCount")}</span>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={T("searchMemories")} style={{
            width:"100%",padding:"8px 12px",borderRadius:10,
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
            color:"#F9FAFB",fontSize:13,outline:"none",boxSizing:"border-box",
          }}/>
        </StickyHeader>

        {filteredItems.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{marginBottom:12}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.1)"/><circle cx="12" cy="13" r="4" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#22c55e" strokeWidth="1.5"/></svg>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:6}}>{T("noMemories")}</div>
            <div style={{fontSize:12,color:"#9CA3AF"}}>{T("addFirstMemory")}</div>
          </div>
        ):(
          filteredItems.map(item=>{
            const moodObj = MOOD_LIST.find(m=>m.symbol===item.mood);
            return (
              <div key={item.id} className="touch-card" onClick={()=>openDetail(item)} style={{
                ...cardStyle, display:"flex",gap:12,padding:0,overflow:"hidden",marginBottom:10,
                border:`1px solid ${moodObj?.color||"rgba(255,255,255,0.05)"}25`,
              }}>
                {/* Thumbnail */}
                {item.photos?.[0]?(
                  <div style={{width:80,height:80,flexShrink:0}}>
                    <img src={item.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                ):(
                  <div style={{width:80,height:80,flexShrink:0,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                    {item.mood||<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="#9CA3AF" strokeWidth="1.5"/><line x1="8" y1="13" x2="16" y2="13" stroke="#9CA3AF" strokeWidth="1" opacity=".5"/><line x1="8" y1="17" x2="12" y2="17" stroke="#9CA3AF" strokeWidth="1" opacity=".5"/></svg>}
                  </div>
                )}
                <div style={{flex:1,padding:"10px 12px 10px 0",minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:3,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                  {item.text&&<div style={{fontSize:12,color:"#9CA3AF",marginBottom:4,
                    display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",lineHeight:1.4}}>{item.text}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:"#9CA3AF"}}>{item.date}</span>
                    {item.photos?.length>1&&<span style={{fontSize:10,color:"#9CA3AF"}}>+{item.photos.length} foto</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <FAB onClick={()=>{setEditingId(null);setForm({title:"",text:"",date:today(),mood:"",folder:activeFolder||"",tags:"",photos:[]});setShowAdd(true);}} color="#22c55e"/>

        {/* Add/Edit Memory Modal */}
        <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditingId(null);}} title={editingId?T("editMemory"):T("newMemory")}>
          <input style={inp} placeholder={T("memoryTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <textarea style={{...inp,minHeight:100,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}} placeholder={T("memoryText")} value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>

          {/* Date */}
          <input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>

          {/* Mood selector */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryMood")}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {MOOD_LIST.map(m=>(
                <button key={m.symbol} onClick={()=>setForm({...form,mood:form.mood===m.symbol?"":m.symbol})} style={{
                  padding:"6px 12px",borderRadius:10,cursor:"pointer",fontSize:13,
                  background:form.mood===m.symbol?`${m.color}25`:"rgba(255,255,255,0.05)",
                  color:form.mood===m.symbol?m.color:"#9CA3AF",
                  border:form.mood===m.symbol?`1px solid ${m.color}40`:"1px solid transparent",
                }}>{m.symbol} {m.label}</button>
              ))}
            </div>
          </div>

          {/* Folder selector */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryFolder")}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setForm({...form,folder:""})} style={{
                padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                background:!form.folder?"rgba(156,163,175,0.2)":"rgba(255,255,255,0.05)",
                color:!form.folder?"#F9FAFB":"#9CA3AF",
              }}>{T("noFolder")}</button>
              {folders.map(f=>(
                <button key={f.id} onClick={()=>setForm({...form,folder:f.id})} style={{
                  padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                  background:form.folder===f.id?`${f.color}25`:"rgba(255,255,255,0.05)",
                  color:form.folder===f.id?f.color:"#9CA3AF",
                }}>{f.icon} {f.name}</button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <input style={inp} placeholder="Etiketler (virgülle ayır)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>

          {/* Photos */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryPhotos")}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              {form.photos.map((p,i)=>(
                <div key={i} style={{position:"relative",width:72,height:72}}>
                  <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>
                  <button onClick={()=>removePhoto(i)} style={{
                    position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",
                    background:"#ef4444",color:"#fff",border:"none",fontSize:10,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>✕</button>
                </div>
              ))}
              {form.photos.length<8&&(
                <button onClick={()=>fileRef.current?.click()} style={{
                  width:72,height:72,borderRadius:10,border:"2px dashed rgba(255,255,255,0.15)",
                  background:"rgba(255,255,255,0.03)",color:"#9CA3AF",cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:10,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/><circle cx="8.5" cy="10.5" r="2" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M3 16l4-4 3 3 4-5 7 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {T("addPhoto")}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhoto} style={{display:"none"}}/>
          </div>

          <button style={btnPrimary} onClick={saveMemory}>{T("save")}</button>
        </Modal>
      </div>
    );
  }

  /* ── FOLDERS VIEW (default) ── */
  return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" onClick={onBack}>◀</button>
          <span style={{fontSize:20}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.5"/><circle cx="12" cy="13" r="4" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#22c55e" strokeWidth="1.5"/></svg>
          </span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{T("memories")}</h3>
          <span style={{fontSize:11,color:"#9CA3AF"}}>{items.length} {T("memoryCount")}</span>
        </div>
      </StickyHeader>

      {/* All Memories button */}
      <div className="touch-card" onClick={openAll} style={{
        ...cardStyle,display:"flex",alignItems:"center",gap:14,marginBottom:16,
        background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.03))",
        border:"1px solid rgba(34,197,94,0.2)",
      }}>
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(34,197,94,0.15)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.15)"/></svg>
          </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700}}>{T("allMemories")}</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{items.length} {T("memoryCount")}</div>
        </div>
        <span style={{color:"#9CA3AF",fontSize:14}}>▶</span>
      </div>

      {/* Folder grid */}
      <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("folders")}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {folders.map(f=>(
          <div key={f.id} className="touch-card" onClick={()=>openFolder(f.id)} style={{
            background:`linear-gradient(145deg,${f.color}12,${f.color}05)`,
            borderRadius:18,padding:"18px 14px",cursor:"pointer",
            border:`1px solid ${f.color}30`,
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,minHeight:100,justifyContent:"center",
          }}>
            <span style={{fontSize:28}}>{f.icon}</span>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{f.name}</div>
            <div style={{fontSize:11,color:f.color}}>{itemCountForFolder(f.id)} {T("memoryCount")}</div>
          </div>
        ))}

        {/* Add folder card */}
        <div className="touch-card" onClick={()=>setShowFolderModal(true)} style={{
          background:"rgba(255,255,255,0.03)",borderRadius:18,padding:"18px 14px",
          cursor:"pointer",border:"2px dashed rgba(255,255,255,0.1)",
          display:"flex",flexDirection:"column",alignItems:"center",gap:6,minHeight:100,justifyContent:"center",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{T("newFolder")}</div>
        </div>
      </div>

      {/* Recent memories preview */}
      {items.length>0&&(
        <>
          <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("timeline")}</div>
          {items.slice(0,4).map(item=>(
            <div key={item.id} className="touch-card" onClick={()=>{setActiveFolder(null);setView("list");setTimeout(()=>openDetail(item),50);}} style={{
              ...cardStyle,display:"flex",gap:10,padding:"10px 12px",marginBottom:6,
            }}>
              {item.photos?.[0]?(
                <img src={item.photos[0]} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
              ):(
                <div style={{width:40,height:40,borderRadius:8,background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {item.mood ? <span style={{fontSize:16}}>{item.mood}</span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="#9CA3AF" strokeWidth="1.5"/></svg>}
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                <div style={{fontSize:11,color:"#9CA3AF"}}>{item.date}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add memory FAB */}
      <FAB onClick={()=>{setEditingId(null);setForm({title:"",text:"",date:today(),mood:"",folder:"",tags:"",photos:[]});setShowAdd(true);}} color="#22c55e"/>

      {/* New Folder Modal */}
      <Modal open={showFolderModal} onClose={()=>setShowFolderModal(false)} title={T("newFolder")}>
        <input style={inp} placeholder={T("folderName")} value={folderForm.name} onChange={e=>setFolderForm({...folderForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>Renk</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setFolderForm({...folderForm,color:c})} style={{
              width:32,height:32,borderRadius:10,background:c,border:folderForm.color===c?"3px solid #fff":"3px solid transparent",
              cursor:"pointer",
            }}/>
          ))}
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>İkon</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {FOLDER_ICONS.map(ic=>(
            <button key={ic} onClick={()=>setFolderForm({...folderForm,icon:ic})} style={{
              width:36,height:36,borderRadius:10,border:folderForm.icon===ic?"2px solid #22c55e":"2px solid rgba(255,255,255,0.1)",
              background:folderForm.icon===ic?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.05)",
              cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
            }}>{ic}</button>
          ))}
        </div>
        <button style={btnPrimary} onClick={addFolder}>{T("add")}</button>
      </Modal>

      {/* Add Memory Modal (from folders view) */}
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditingId(null);}} title={editingId?T("editMemory"):T("newMemory")}>
        <input style={inp} placeholder={T("memoryTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:100,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}} placeholder={T("memoryText")} value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>
        <input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryMood")}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MOOD_LIST.map(m=>(
              <button key={m.symbol} onClick={()=>setForm({...form,mood:form.mood===m.symbol?"":m.symbol})} style={{
                padding:"6px 12px",borderRadius:10,border:form.mood===m.symbol?`1px solid ${m.color}40`:"1px solid transparent",cursor:"pointer",fontSize:13,
                background:form.mood===m.symbol?`${m.color}25`:"rgba(255,255,255,0.05)",
                color:form.mood===m.symbol?m.color:"#9CA3AF",
              }}>{m.symbol} {m.label}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryFolder")}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {folders.map(f=>(
              <button key={f.id} onClick={()=>setForm({...form,folder:f.id})} style={{
                padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                background:form.folder===f.id?`${f.color}25`:"rgba(255,255,255,0.05)",
                color:form.folder===f.id?f.color:"#9CA3AF",
              }}>{f.icon} {f.name}</button>
            ))}
          </div>
        </div>
        <input style={inp} placeholder="Etiketler (virgülle ayır)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryPhotos")}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
            {form.photos.map((p,i)=>(
              <div key={i} style={{position:"relative",width:72,height:72}}>
                <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>
                <button onClick={()=>removePhoto(i)} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
            {form.photos.length<8&&(
              <button onClick={()=>fileRef.current?.click()} style={{width:72,height:72,borderRadius:10,border:"2px dashed rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.03)",color:"#9CA3AF",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:10}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/><circle cx="8.5" cy="10.5" r="2" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M3 16l4-4 3 3 4-5 7 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {T("addPhoto")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhoto} style={{display:"none"}}/>
        </div>
        <button style={btnPrimary} onClick={saveMemory}>{T("save")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ TARZIM ═══════════ */
