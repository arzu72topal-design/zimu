import { useState, useRef } from "react";
import { i18n, SUPPORTED_LANGUAGES } from "../i18n";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, btnPrimary, inp } from "../styles";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
} from "../notifications.js";
import { exportData, importData } from "../db.js";

export default function Settings({ data, update, onImport, user, onLogout }) {
  const fileRef = useRef(null);
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission());
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const T = (key) => i18n(key, data);
  const curLang = data.settings?.language || "tr";
  const setLang = (lang) => update({...data, settings:{...data.settings, language:lang}});

  const enableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
    if (granted) {
      update({ ...data, settings: { ...data.settings, notifications: true } });
    }
  };

  const handleExport = () => {
    exportData();
    setMsg(T("backupDownloaded"));
    setTimeout(() => setMsg(""), 2000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await importData(file);
      onImport(imported);
      setMsg(T("dataImported"));
    } catch (err) {
      setMsg("Hata: " + err.message);
    }
    setImporting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const clearAll = () => {
    if (confirm(T("deleteConfirm"))) {
      const empty = { tasks: [], events: [], sports: [], projects: [], notes: [], settings: data.settings };
      update(empty);
      setMsg(T("dataDeleted"));
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const taskCount = data.tasks.length;
  const eventCount = data.events.length;
  const sportCount = data.sports.length;
  const projectCount = (data.projects||[]).length;
  const noteCount = data.notes.length;

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("settingsTitle")}</h3>
      </StickyHeader>

      {msg && <div style={{background:"rgba(24,95,165,0.08)",border:"1px solid rgba(24,95,165,0.2)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#185FA5"}}>{msg}</div>}

      {/* Language selector */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>{T("language")}</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {SUPPORTED_LANGUAGES.map(({code,label,flag})=>(
            <button key={code} onClick={()=>setLang(code)} style={{
              padding:"12px 10px",borderRadius:12,cursor:"pointer",
              fontSize:13,fontWeight:curLang===code?700:400,
              background:curLang===code?"rgba(24,95,165,0.08)":"#F5F0E8",
              color:curLang===code?"#185FA5":"#8B8578",
              border:curLang===code?"1px solid rgba(24,95,165,0.2)":"1px solid rgba(0,0,0,0.06)",
              transition:"all .2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,
            }}><span>{flag}</span> {label}</button>
          ))}
        </div>
      </div>

      {/* User info */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("account")}</h4>
        {user ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" style={{width:40,height:40,borderRadius:"50%"}}/>
              ) : (
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(24,95,165,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#185FA5",fontWeight:700}}>
                  {(user.displayName||user.email||"?")[0].toUpperCase()}
                </div>
              )}
              <div>
                {user.displayName && <div style={{fontSize:14,fontWeight:600}}>{user.displayName}</div>}
                <div style={{fontSize:12,color:"#8B8578"}}>{user.email}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#1D9E75"}}/>
              <span style={{fontSize:12,color:"#1D9E75"}}>{T("cloudSync")}</span>
            </div>
            <p style={{fontSize:11,color:"#8B8578",margin:"0 0 12px"}}>{T("cloudSyncDesc")}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#D85A30",border:"1px solid rgba(239,68,68,0.2)"}}>
              {T("logout")}
            </button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517"}}/>
              <span style={{fontSize:12,color:"#BA7517"}}>{T("guestMode")}</span>
            </div>
            <p style={{fontSize:11,color:"#8B8578",margin:"0 0 12px"}}>{T("localOnlyDesc")}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"#185FA5"}}>
              {T("loginTitle")} / {T("registerTitle")}
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("notifications")}</h4>
        {!isNotificationSupported() ? (
          <p style={{fontSize:13,color:"#8B8578"}}>Bu tarayıcı bildirimleri desteklemiyor</p>
        ) : notifStatus === "granted" ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:"#1D9E75"}}/>
              <span style={{fontSize:13,color:"#1D9E75"}}>{T("notifActive")}</span>
            </div>

            {/* Reminder time selector */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#8B8578",marginBottom:8}}>{T("reminderBefore")}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[5,10,15,30,60].map(m=>{
                  const active=(data.settings?.reminderMinutes||15)===m;
                  return <button key={m} onClick={()=>update({...data,settings:{...data.settings,reminderMinutes:m}})} style={{
                    padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:active?700:400,
                    background:active?"rgba(34,197,94,0.15)":"#F5F0E8",
                    color:active?"#1D9E75":"#8B8578",
                    border:active?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(0,0,0,0.06)",
                  }}>{m} {T("reminderMinLabel")}</button>;
                })}
              </div>
            </div>

            {/* Event reminders toggle */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#2C2A26"}}>{T("eventReminders")}</div>
              </div>
              <button onClick={()=>update({...data,settings:{...data.settings,eventNotif:!(data.settings?.eventNotif!==false)}})} style={{
                width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                background:(data.settings?.eventNotif!==false)?"#1D9E75":"#F5F0E8",
                position:"relative",transition:"background .2s",
              }}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                  left:(data.settings?.eventNotif!==false)?23:3,transition:"left .2s"}}/>
              </button>
            </div>

            {/* Task reminders toggle */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#2C2A26"}}>{T("taskReminders")}</div>
                <div style={{fontSize:11,color:"#8B8578",marginTop:2}}>{T("taskRemindDesc")}</div>
              </div>
              <button onClick={()=>update({...data,settings:{...data.settings,taskNotif:!(data.settings?.taskNotif!==false)}})} style={{
                width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                background:(data.settings?.taskNotif!==false)?"#1D9E75":"#F5F0E8",
                position:"relative",transition:"background .2s",
              }}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                  left:(data.settings?.taskNotif!==false)?23:3,transition:"left .2s"}}/>
              </button>
            </div>

            {/* Quiet hours */}
            <div style={{padding:"10px 0",borderTop:"1px solid rgba(0,0,0,0.06)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#2C2A26"}}>{T("quietHours")}</div>
                  <div style={{fontSize:11,color:"#8B8578",marginTop:2}}>{T("quietHoursDesc")}</div>
                </div>
                <button onClick={()=>update({...data,settings:{...data.settings,quietEnabled:!data.settings?.quietEnabled}})} style={{
                  width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                  background:data.settings?.quietEnabled?"#1D9E75":"#F5F0E8",
                  position:"relative",transition:"background .2s",
                }}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                    left:data.settings?.quietEnabled?23:3,transition:"left .2s"}}/>
                </button>
              </div>
              {data.settings?.quietEnabled&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="time" value={data.settings?.quietStart||"23:00"} onChange={e=>update({...data,settings:{...data.settings,quietStart:e.target.value}})}
                    style={{background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)",borderRadius:8,padding:"6px 10px",color:"#2C2A26",fontSize:13,flex:1}}/>
                  <span style={{color:"#8B8578",fontSize:12}}>—</span>
                  <input type="time" value={data.settings?.quietEnd||"08:00"} onChange={e=>update({...data,settings:{...data.settings,quietEnd:e.target.value}})}
                    style={{background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)",borderRadius:8,padding:"6px 10px",color:"#2C2A26",fontSize:13,flex:1}}/>
                </div>
              )}
            </div>
          </div>
        ) : notifStatus === "denied" ? (
          <p style={{fontSize:13,color:"#D85A30"}}>{T("notifBlocked")}</p>
        ) : (
          <button onClick={enableNotif} style={{...btnPrimary,marginTop:0,background:"#1D9E75"}}>{T("enableNotif")}</button>
        )}
      </div>

      {/* Data Stats */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("dataSummary")}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {l:T("task"),v:taskCount},{l:T("eventType"),v:eventCount},
            {l:T("sportRecord"),v:sportCount},{l:T("project"),v:projectCount},
            {l:T("note"),v:noteCount},{l:T("total"),v:taskCount+eventCount+sportCount+projectCount+noteCount},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
              <span style={{fontSize:13,opacity:.6}}>{s.l}</span>
              <span style={{fontSize:13,fontWeight:600}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("dataManagement")}</h4>
        <p style={{fontSize:12,color:"#8B8578",margin:"0 0 12px"}}>{T("dataDesc")}</p>
        <button onClick={handleExport} style={{...btnPrimary,marginTop:0,marginBottom:8,background:"#1D9E75"}}>
          ▸ {T("exportData")} (JSON)
        </button>
        <button onClick={()=>fileRef.current?.click()} disabled={importing} style={{...btnPrimary,marginTop:0,background:"#534AB7"}}>
          {importing ? "Aktarılıyor..." : "▸ Dosyadan Aktar (JSON)"}
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
      </div>

      {/* AI Kalori Asistanı */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>AI Kalori Asistanı</h4>
        <p style={{fontSize:12,color:"#8B8578",margin:"0 0 12px"}}>Yemek fotoğrafı çekerek kalori hesaplatabilirsin. Kendi AI hesabını seç ve API anahtarını gir.</p>

        {/* Provider selection */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[
            {id:"none",name:"Manuel Giriş",desc:"AI kullanma, kalorileri kendim girerim",icon:"✏️",color:"#8B8578"},
            {id:"gemini",name:"Google Gemini",desc:"Ücretsiz, günde 60 istek",icon:"✨",color:"#185FA5"},
            {id:"claude",name:"Claude (Anthropic)",desc:"En akıllı analiz, ücretli",icon:"◈",color:"#534AB7"},
            {id:"openai",name:"OpenAI (ChatGPT)",desc:"Popüler, ücretli",icon:"◈",color:"#1D9E75"},
          ].map(p=>{
            const selected = (data.settings?.aiProvider||"none")===p.id;
            return (
              <div key={p.id} onClick={()=>update({...data,settings:{...data.settings,aiProvider:p.id}})} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,cursor:"pointer",
                background:selected?`${p.color}15`:"rgba(0,0,0,0.02)",
                border:selected?`1px solid ${p.color}40`:"1px solid rgba(0,0,0,0.06)",
              }}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:selected?p.color:"#8B8578"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#8B8578"}}>{p.desc}</div>
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
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#1D9E75"}}/>
              <span style={{fontSize:11,color:"#1D9E75"}}>Anahtar kaydedildi</span></>
            ) : (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517"}}/>
              <span style={{fontSize:11,color:"#BA7517"}}>Anahtar gerekli</span></>
            )}
          </div>
          <div style={{fontSize:10,color:"#8B8578",marginBottom:10}}>● Anahtarın sadece senin telefonunda saklanır, sunucuya gönderilmez</div>

          {/* Guide button */}
          <button onClick={()=>setMsg(
            data.settings.aiProvider==="gemini" ?
              "GOOGLE GEMİNİ REHBERİ:\n\n1. aistudio.google.com/apikey adresine git\n2. Gmail ile giriş yap\n3. 'Create API Key' butonuna bas\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretsiz: Günde 60 istek, dakikada 15 istek\n● Gmail hesabın varsa 2 dakikada hazır!" :
            data.settings.aiProvider==="claude" ?
              "CLAUDE (ANTHROPİC) REHBERİ:\n\n1. console.anthropic.com adresine git\n2. Hesap oluştur (kredi kartı gerekli)\n3. API Keys → Create Key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretli: İlk $5 ücretsiz kredi\n● En detaylı analiz" :
              "OPENAİ (CHATGPT) REHBERİ:\n\n1. platform.openai.com adresine git\n2. Hesap oluştur veya giriş yap\n3. API Keys → Create new secret key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretli: İlk $5 ücretsiz kredi\n● Popüler ve güvenilir"
          )} style={{
            width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(24,95,165,0.12)",
            background:"rgba(59,130,246,0.08)",color:"#185FA5",fontSize:13,cursor:"pointer",fontWeight:600,
          }}>
            ▸ {data.settings.aiProvider==="gemini"?"Gemini":data.settings.aiProvider==="claude"?"Claude":"OpenAI"} API Anahtarı Nasıl Alınır?
          </button>
        </>)}
      </div>

      {/* Danger zone */}
      <div style={{background:"#FFFFFF",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#D85A30"}}>⚠️ {T("dangerZone")}</h4>
        <button onClick={clearAll} style={{...btnPrimary,marginTop:0,background:"#D85A30"}}>
          {T("deleteAll")}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ LOGIN SCREEN ═══════════ */
