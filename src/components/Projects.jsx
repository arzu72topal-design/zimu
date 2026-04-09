import { useState, useEffect } from "react";
import { i18n, roomLabel } from "../i18n";
import { uid, today, COLORS, DEFAULT_ROOMS, migrateRooms, PROJECT_STATUSES } from "../constants";
import { Modal } from "./ui/Modal";
import { FAB } from "./ui/FAB";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, glowCard, inp, btnPrimary, addBtnStyle, delBtnStyle, checkBtnStyle } from "../styles";
import NewsRoom from "./NewsRoom";
import MusicRoom from "./MusicRoom";
import BenimStilimRoom from "./BenimStilimRoom";
import MemoriesRoom from "./MemoriesRoom";
import Sports from "./Sports";
import Projelerim from "./Projelerim";
import { VoiceMic } from "./VoiceMic";

export default function Projects({ data, update, initialRoom, onRoomConsumed }) {
  const T = (key) => i18n(key, data);
  const [activeRoom,setActiveRoom]=useState(null);
  const [roomSubView,setRoomSubView]=useState(null);
  const [modal,setModal]=useState(false);
  const [roomModal,setRoomModal]=useState(false);
  const [itemModal,setItemModal]=useState(false);
  const [form,setForm]=useState({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  const [roomForm,setRoomForm]=useState({name:"",icon:"Pr",color:"#185FA5"});
  const [itemForm,setItemForm]=useState({title:"",description:"",tags:""});
  const [exp,setExp]=useState(null);
  const [tf,setTf]=useState({title:""});

  // Dashboard'dan gelen oda yönlendirmesini yakala (format: "roomId" veya "roomId:subView")
  useEffect(() => {
    if (initialRoom) {
      const parts = initialRoom.split(":");
      setActiveRoom(parts[0]);
      setRoomSubView(parts[1] || null);
      onRoomConsumed?.();
    }
  }, [initialRoom]);

  // Oda değiştiğinde scroll sıfırla
  useEffect(() => {
    if (activeRoom) {
      const t = setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 80);
      return () => clearTimeout(t);
    }
  }, [activeRoom]);

  const rooms = migrateRooms(data.rooms);
  const roomItems = data.roomItems || {};

  const addRoom=()=>{
    if(!roomForm.name.trim())return;
    const nr={id:uid(),...roomForm,type:"collection"};
    update({...data,rooms:[...rooms,nr]});
    setRoomModal(false);setRoomForm({name:"",icon:"Pr",color:"#185FA5"});
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
    update({...data,projects:[np,...(data.projects||[])]});
    setModal(false);setForm({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  };
  const delProject=id=>update({...data,projects:(data.projects||[]).filter(p=>p.id!==id)});
  const upSt=(id,st)=>update({...data,projects:(data.projects||[]).map(p=>p.id===id?{...p,status:st}:p)});
  const addPT=pid=>{
    if(!tf.title.trim())return;
    update({...data,projects:(data.projects||[]).map(p=>p.id===pid?{...p,tasks:[...(p.tasks||[]),{id:uid(),title:tf.title,done:false}]}:p)});
    setTf({title:""});
  };
  const togPT=(pid,tid)=>{
    update({...data,projects:(data.projects||[]).map(p=>p.id===pid?{...p,tasks:(p.tasks||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:p)});
  };
  const stCol=s=>s==="Tamamlandı"?"#1D9E75":s==="Devam Ediyor"?"#185FA5":s==="Test"?"#BA7517":"#8B8578";
  const statusLabel=s=>({"Planlama":T("statPlanning"),"Devam Ediyor":T("statProgress"),"Test":T("statTest"),"Tamamlandı":T("statDone")}[s]||s);

  const roomIcons=["Pr","Hb","Mz","St","An","Oy","Kt","İş","Ev","Gz","Hd","Fk","Al","Fm","Yc"];

  /* Her oda için Unsplash fotoğrafı — koyu tema, konuyla uyumlu */
  const ROOM_IMAGES = {
    projects:    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=260&fit=crop&q=80",
    news:        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=260&fit=crop&q=80",
    music:       "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=260&fit=crop&q=80",
    clothes:     "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=260&fit=crop&q=80",
    memories:    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=260&fit=crop&q=80",
    healthcoach: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=260&fit=crop&q=80",
  };
  const getRoomImage = (room) => {
    if (room.photo) return room.photo;
    return ROOM_IMAGES[room.id] || null;
  };

  if(!activeRoom) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("lifestyleTitle")}</h3>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,color:"#8B8578"}}>{T("lifestyleDesc")}</p>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {rooms.map((room,idx)=>{
          const count=room.type==="project"?(data.projects||[]).length:room.type==="health"?(data.sports||[]).length:(roomItems[room.id]||[]).length;
          const photo = getRoomImage(room);
          return (
            <div key={room.id} className={`touch-card stagger-${idx+1}`} onClick={()=>{setActiveRoom(room.id);setRoomSubView(null);}}
              style={{
                borderRadius:20,overflow:"hidden",cursor:"pointer",
                position:"relative",height:160,
                border:"0.5px solid rgba(0,0,0,0.1)",
                background:"#FFFFFF",
              }}>
              {/* Fotoğraf arka plan */}
              {photo ? (
                <img src={photo} alt={room.name} loading="lazy"
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  onError={e=>{e.target.style.display="none";}}/>
              ) : (
                <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${room.color}25 0%,#F5F0E8 100%)`}}/>
              )}
              {/* Gradient overlay — alttan koyulaşma */}
              <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)",
              }}/>
              {/* İçerik — sol alt */}
              <div style={{
                position:"absolute",bottom:0,left:0,right:0,
                padding:"14px 16px",zIndex:1,
              }}>
                <div style={{fontSize:18,fontWeight:700,color:"#FFFFFF",textShadow:"0 1px 4px rgba(0,0,0,0.5)"}}>{roomLabel(room,data)}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.85)",fontWeight:600,marginTop:2,textShadow:"0 1px 3px rgba(0,0,0,0.4)"}}>{count} {T("items")}</div>
              </div>
            </div>
          );
        })}
      </div>
      <FAB onClick={()=>setRoomModal(true)} color="#D85A30"/>
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title={T("newRoom")}>
        <input style={inp} placeholder={T("roomName")} value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#8B8578",marginBottom:6}}>Renk seç:</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setRoomForm({...roomForm,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:roomForm.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={addRoom}>{T("create")}</button>
      </Modal>
    </div>
  );

  const room=rooms.find(r=>r.id===activeRoom);
  if(!room){setActiveRoom(null);return null;}

  if(room.type==="project"||activeRoom==="projects") return (
    <div className="room-enter">
      <div style={{marginBottom:12}}>
        <button className="back-btn" aria-label="Go back" onClick={()=>setActiveRoom(null)}>◀</button>
      </div>
      <Projelerim />
    </div>
  );

  const items=roomItems[activeRoom]||[];

  /* ── SPECIAL ROOM RENDERERS ── */
  if(activeRoom==="news" || room.type==="news") return <div className="room-enter"><NewsRoom room={room} onBack={()=>setActiveRoom(null)} data={data} update={update} /></div>;
  if(activeRoom==="music" || room.id==="music") return <div className="room-enter"><MusicRoom room={room} items={items} data={data} onBack={()=>setActiveRoom(null)} onAdd={(item)=>{const cur=roomItems[activeRoom]||[];update({...data,roomItems:{...roomItems,[activeRoom]:[item,...cur]}});}} onDel={(id)=>delItem(activeRoom,id)} /></div>;
  if(activeRoom==="clothes" || room.id==="clothes") return <div className="room-enter"><BenimStilimRoom data={data} update={update} onBack={()=>setActiveRoom(null)} /></div>;
  if(activeRoom==="memories" || room.id==="memories") return <div className="room-enter"><MemoriesRoom data={data} update={update} onBack={()=>setActiveRoom(null)} /></div>;
  if(activeRoom==="healthcoach" || room.type==="health") return (
    <div className="room-enter">
      <Sports data={data} update={update} initialView={roomSubView} onBack={()=>setActiveRoom(null)}/>
    </div>
  );

  return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={()=>setActiveRoom(null)}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:`${room.color}25`,border:`1px solid ${room.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:room.color,flexShrink:0}}>{roomLabel(room,data)[0]}</div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{roomLabel(room,data)}</h3>
          <button onClick={()=>delRoom(activeRoom)} style={{background:"none",border:"none",color:"#D85A30",fontSize:11,cursor:"pointer"}}>{T("del")}</button>
        </div>
      </StickyHeader>
      {items.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{margin:"0 auto 12px",display:"block",opacity:.3}}>
            <rect x="6" y="20" width="40" height="26" rx="3" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
            <path d="M6 26 L26 33 L46 26" stroke="#6B7280" strokeWidth="1.5"/>
            <path d="M18 20 L18 10 L34 10 L34 20" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
            <path d="M20 15 L32 15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
          </svg>
          <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:4}}>{T("roomEmpty")}</div>
          <div style={{fontSize:12,color:"#8B8578"}}>{T("addItemHint")}</div>
        </div>
      )}
      {items.map(item=>(
        <div key={item.id} style={{background:"#FFFFFF",borderRadius:16,padding:14,marginBottom:8,borderLeft:`3px solid ${room.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
              {item.description&&<div style={{fontSize:12,color:"#8B8578",marginTop:4,lineHeight:1.4}}>{item.description}</div>}
              {item.tags?.length>0&&(<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                {item.tags.map(t=><span key={t} style={{background:`${room.color}20`,color:room.color,padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
              </div>)}
            </div>
            <button onClick={()=>delItem(activeRoom,item.id)} style={delBtnStyle} aria-label="Delete">✕</button>
          </div>
          <div style={{fontSize:10,opacity:.25,marginTop:6}}>{item.createdAt}</div>
        </div>
      ))}
      <FAB onClick={()=>setItemModal(true)} color={room.color}/>
      <Modal open={itemModal} onClose={()=>setItemModal(false)} title={`${room.icon} ${room.name} — Yeni Öğe`}>
        <input style={inp} placeholder={T("noteTitle")} value={itemForm.title} onChange={e=>setItemForm({...itemForm,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("descOpt")} value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})}/>
        <input style={inp} placeholder={T("tagsField")} value={itemForm.tags} onChange={e=>setItemForm({...itemForm,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addItem}>{T("add")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ NOTES ═══════════ */
