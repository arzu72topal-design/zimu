import { useState, useEffect, useRef } from "react";
import { i18n } from "../i18n";
import { today, MN, DN, COMMON_FOODS, migrateRooms, uid } from "../constants";
import { cardStyle, glowCard, sectionHeader } from "../styles";

const WMO_TR={0:"Açık",1:"Az bulutlu",2:"Parçalı bulutlu",3:"Bulutlu",45:"Sisli",48:"Kırağılı sis",51:"Hafif çisenti",53:"Çisenti",55:"Yoğun çisenti",56:"Dondurucu çisenti",57:"Yoğun dondurucu çisenti",61:"Hafif yağmur",63:"Yağmur",65:"Şiddetli yağmur",66:"Dondurucu yağmur",67:"Şiddetli dondurucu yağmur",71:"Hafif kar",73:"Kar",75:"Yoğun kar",77:"Kar taneleri",80:"Hafif sağanak",81:"Sağanak",82:"Şiddetli sağanak",85:"Hafif kar sağanağı",86:"Şiddetli kar sağanağı",95:"Gök gürültülü fırtına",96:"Dolu ile fırtına",99:"Şiddetli dolu ile fırtına"};

export default function Dashboard({ data, setTab, goTo, update }) {
  const t = today();
  const foods = data.foods || [];
  const rooms = migrateRooms(data.rooms);
  const roomItems = data.roomItems || {};

  const pending = data.tasks.filter(x=>!x.done).length;
  const done = data.tasks.filter(x=>x.done).length;
  const overdue = data.tasks.filter(x=>!x.done && x.dueDate && x.dueDate < t).length;
  const urgentTasks = data.tasks
    .filter(x=>!x.done)
    .sort((a,b)=>{const po={high:0,medium:1,low:2};return (po[a.priority]||1)-(po[b.priority]||1);})
    .slice(0,3);

  const todayEv = data.events.filter(e=>e.date===t);
  const upcoming = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  const wkSport = data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const wkMin = wkSport.reduce((a,s)=>a+(s.duration||0),0);
  const wkBurned = wkSport.reduce((a,s)=>a+(s.calories||0),0);
  const todayFoods = foods.filter(f=>f.date===t);
  const todayCalIn = todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todayCalOut = data.sports.filter(s=>s.date===t).reduce((a,s)=>a+(s.calories||0),0);
  const activeProjects = (data.projects||[]).filter(p=>p.status!=="Tamamlandı").length;

  const hour = new Date().getHours();
  const T = (key) => i18n(key, data);
  const greeting = hour<12 ? T("goodMorning") : hour<18 ? T("goodAfternoon") : T("goodEvening");

  // Live clock (updates every minute)
  const [clock, setClock] = useState(new Date().toLocaleTimeString(T("locale"), {hour:"2-digit",minute:"2-digit"}));
  useEffect(()=>{
    const iv=setInterval(()=>setClock(new Date().toLocaleTimeString(T("locale"),{hour:"2-digit",minute:"2-digit"})),30000);
    return ()=>clearInterval(iv);
  },[]);

  // Dashboard weather
  const [dashWx, setDashWx] = useState(null);
  useEffect(()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude:lat,longitude:lon}=pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`)
        .then(r=>r.json()).then(d=>{
          const c=d.current;
          setDashWx({temp:Math.round(c.temperature_2m),humid:Math.round(c.relative_humidity_2m),code:c.weather_code,city:null});
          // Reverse geocode for city name
          fetch(`https://geocoding-api.open-meteo.com/v1/search?name=_&count=1&latitude=${lat}&longitude=${lon}`)
            .catch(()=>{});
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10&accept-language=tr`)
            .then(r=>r.json()).then(geo=>{
              const city=geo.address?.city||geo.address?.town||geo.address?.province||geo.address?.state||"";
              const district=geo.address?.suburb||geo.address?.district||geo.address?.county||"";
              setDashWx(prev=>prev?{...prev,city:district?`${district}, ${city}`:city}:prev);
            }).catch(()=>{});
        }).catch(()=>{});
    },()=>{},{timeout:5000,maximumAge:300000});
  },[]);

  // Daily thoughts (3 slots)
  const thoughts = data.dailyThoughts || ["","",""];
  const updateThought = (i, val) => {
    const next = [...thoughts];
    next[i] = val;
    update({ ...data, dailyThoughts: next });
  };
  const thoughtToNote = (i) => {
    const text = (thoughts[i]||"").trim();
    if(!text) return;
    const newNote = {id:uid(),title:text,content:"",color:"#1D9E75",createdAt:today(),updatedAt:today()};
    const next = [...thoughts]; next[i] = "";
    update({...data, notes:[newNote,...(data.notes||[])], dailyThoughts:next});
  };

  // Live news headlines — custom feeds first, fallback BBC Türkçe
  const [headlines, setHeadlines] = useState([]);
  const customFeedsRef = useRef(data?.settings?.customFeeds || []);
  customFeedsRef.current = data?.settings?.customFeeds || [];
  useEffect(() => {
    let cancelled = false;
    async function fetchOneDashFeed(feedUrl) {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
        || await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(5000) });
      if (!res || !res.ok) return [];
      const text = res.url?.includes("allorigins") ? JSON.parse(await res.text()).contents : await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      return [...xml.querySelectorAll("item, entry")].slice(0,8).map(item => {
        const txt = (sel) => item.querySelector(sel)?.textContent?.replace(/<[^>]+>/g,"")?.trim() || "";
        const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || "";
        return {
          title: txt("title"),
          link: txt("link") || attr("link","href"),
          pubDate: txt("pubDate") || txt("published") || "",
        };
      }).filter(a=>a.title && a.title.length > 5);
    }
    async function fetchHeadlines() {
      try {
        const feeds = customFeedsRef.current;
        let items = [];
        if (feeds.length > 0) {
          const results = await Promise.allSettled(feeds.slice(0,4).map(f => fetchOneDashFeed(f.url)));
          items = results.flatMap(r => r.status==="fulfilled" ? r.value : []);
        }
        // Fallback: always add BBC Türkçe if few results
        if (items.length < 4) {
          const bbc = await fetchOneDashFeed("https://www.bbc.com/turkce/index.xml").catch(()=>[]);
          const existing = new Set(items.map(i=>i.title));
          items = [...items, ...bbc.filter(b=>!existing.has(b.title))];
        }
        // Sort by date, take top 5
        items.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
        if (!cancelled) setHeadlines(items.slice(0,5));
      } catch {}
    }
    fetchHeadlines();
    return () => { cancelled = true; };
  }, []);

  const musicItems = (data.roomItems || {})["music"] || [];

  const scheduleItems = upcoming.slice(0,4).map(e=>({ type:"event", id:e.id, title:e.title, sub:e.time||e.date.slice(5), color:e.color||"#8B5CF6" }));

  const hourIcon = hour<6 ? "moon" : hour<12 ? "sunrise" : hour<18 ? "sun" : "moon";

  return (
    <div>
      {/* HERO - Greeting + Weather + Clock */}
      <div className="stagger-1" style={{
        background:"#FFFFFF",
        borderRadius:16,padding:"20px",marginBottom:16,
        border:"1px solid rgba(0,0,0,0.06)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"#F5F0E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {hourIcon==="moon" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#a5b4fc" strokeWidth="1.5" fill="rgba(165,180,252,0.15)"/></svg>
            ) : hourIcon==="sunrise" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.15)"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#BA7517" strokeWidth="1.5" fill="rgba(245,158,11,0.15)"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/></svg>
            )}
          </div>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:28,fontWeight:700,letterSpacing:-.5,color:"#2C2A26",lineHeight:1.2}}>{greeting}!</h2>
            <p style={{margin:"4px 0 0",color:"#8B8578",fontSize:13}}>
              {new Date().toLocaleDateString(T("locale"),{weekday:"long",day:"numeric",month:"long"})}
            </p>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:700,color:"#2C2A26",letterSpacing:-.5,lineHeight:1}}>{clock}</div>
            {dashWx&&<div style={{fontSize:13,fontWeight:600,color:"#a5b4fc",marginTop:4}}>{dashWx.temp}°C</div>}
          </div>
        </div>
        {dashWx&&(
          <div style={{display:"flex",gap:12,marginTop:12,paddingTop:12,borderTop:"1px solid rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#8B8578"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="#BA7517" strokeWidth="1.5" fill="rgba(245,158,11,0.1)"/></svg>
              {dashWx.temp}°C
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#8B8578"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="#185FA5" strokeWidth="1.5" fill="rgba(59,130,246,0.1)"/></svg>
              %{dashWx.humid} {T("humidity")||"nem"}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#8B8578"}}>
              {WMO_TR[dashWx.code]||""}
            </div>
            {dashWx.city&&(
              <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#BA7517",fontWeight:500,marginLeft:"auto"}}>
                📍 {dashWx.city}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Kart 3: Stil Motivasyon */}
      <div className="stagger-2 touch-card" onClick={()=>goTo("lifestyle","clothes")} style={{
        background:"linear-gradient(135deg,#F5F0E8 0%,rgba(83,74,183,0.08) 100%)",
        borderRadius:16,padding:"16px",marginBottom:16,
        border:"1px solid rgba(139,92,246,0.15)",
        cursor:"pointer",display:"flex",alignItems:"center",gap:14,
      }}>
        <div style={{width:48,height:48,borderRadius:14,background:"rgba(139,92,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path d="M11 8C11 8 14 4 18 4C22 4 25 8 25 8" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="18" cy="4" r="2" stroke="#c4b5fd" strokeWidth="1.2" fill="none"/>
            <path d="M6 18L18 14L30 18" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="18" y1="8" x2="18" y2="14" stroke="#c4b5fd" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M8 26C8 23 11 21 15 21C17 21 18 23 21 23C25 23 28 23 28 26" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" fill="rgba(139,92,246,0.08)"/>
            <circle cx="28" cy="10" r="4" stroke="#8B8578" strokeWidth="1" fill="none"/>
            <circle cx="24" cy="8" r="2.5" stroke="#8B8578" strokeWidth="1" fill="none"/>
            <path d="M22 11C22 11 24 13 28 13C30 13 32 12 32 10" stroke="#8B8578" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:600,color:"#2C2A26"}}>{T("styleMotiv")}</div>
          <div style={{fontSize:13,color:"#c4b5fd",marginTop:3}}>{T("styleReady")}</div>
        </div>
        <span style={{fontSize:14,color:"#8B5CF6"}}>▶</span>
      </div>

      {/* 3 AKILLI KART */}
      {/* Kart 1: Görev + Etkinlik + Proje */}
      <div className="stagger-3 touch-card" onClick={()=>setTab("tasks")} style={{
        ...glowCard("#185FA5"),cursor:"pointer",marginBottom:12,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(24,95,165,0.08)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:600,color:"#2C2A26"}}>{T("taskStatus")}</div>
            <div style={{fontSize:13,color:"#8B8578"}}>{T("todaySummary")}</div>
          </div>
          <span style={{fontSize:14,color:"#8B8578"}}>▶</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{background:"#2563eb",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{pending}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("pending")}</div>
          </div>
          <div style={{background:"#7c3aed",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{todayEv.length}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("event")}</div>
          </div>
          <div style={{background:"#047857",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{activeProjects}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("project")}</div>
          </div>
        </div>
      </div>


      {overdue>0&&(
        <div onClick={()=>setTab("tasks")} style={{
          background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.15)",
          borderRadius:16,padding:"14px 16px",marginBottom:16,
          display:"flex",alignItems:"center",gap:12,cursor:"pointer",
        }}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#EF4444"}}>{overdue} {T("overdueAlert")}</div>
            <div style={{fontSize:13,color:"#8B8578"}}>{T("checkNow")}</div>
          </div>
          <span style={{fontSize:14,color:"#8B8578"}}>▶</span>
        </div>
      )}

      {/* Bugünün Programı — sadece etkinlikler */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("todaySchedule")}</div>
        {scheduleItems.length > 0 ? scheduleItems.map(item=>(
          <div key={item.id} onClick={()=>goTo("tasks","calendar")} className="touch-card" style={{
            ...cardStyle,padding:"14px 16px",marginBottom:8,
            display:"flex",alignItems:"center",gap:12,cursor:"pointer",minHeight:54,
          }}>
            <div style={{width:3,height:36,background:item.color,borderRadius:2,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#2C2A26",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
              <div style={{fontSize:13,color:"#8B8578",marginTop:2}}>{T("eventType")} · {item.sub}</div>
            </div>
            <span style={{fontSize:11,color:"#8B8578"}}>▶</span>
          </div>
        )) : (
          <div onClick={()=>goTo("tasks","calendar")} className="touch-card" style={{
            ...cardStyle,padding:"20px 16px",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:8,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#8B8578" strokeWidth="1.2" fill="none"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="#8B8578" strokeWidth="1"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="#8B8578" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="#8B8578" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <div style={{fontSize:13,color:"#8B8578"}}>{T("noEventToday")}</div>
            <div style={{fontSize:11,color:"#8B8578"}}>{T("goCalendar")}</div>
          </div>
        )}
      </div>

      {/* Kart 2: Kalori + Yemek/Spor butonları */}
      <div className="stagger-4" style={{...glowCard("#D85A30"),marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(245,158,11,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22c-4.97 0-9-4.03-9-9 0-4 3-7.5 5-9.5.5 3 2 4 3.5 4.5C13 7 12.5 4 14 2c2.5 3.5 7 7.5 7 11 0 4.97-4.03 9-9 9z" stroke="#F59E0B" strokeWidth="1.5" fill="rgba(245,158,11,0.1)"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:600,color:"#2C2A26"}}>{T("calorieTrack")}</div>
            <div style={{fontSize:13,color:"#8B8578"}}>{T("todayIntake").replace("{0}",todayCalIn).replace("{1}",todayCalOut)}</div>
          </div>
        </div>
        {todayCalIn > 0 ? (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{flex:1,height:8,background:"#F5F0E8",borderRadius:8,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:8,width:`${Math.min(100,Math.round(todayCalIn/2000*100))}%`,background:"#10B981",transition:"width .5s"}}/>
            </div>
            <span style={{fontSize:12,color:"#F59E0B",fontWeight:600,flexShrink:0}}>{Math.round(todayCalIn/2000*100)}%</span>
          </div>
        ) : (
          <div style={{fontSize:13,color:"#8B8578",textAlign:"center",padding:"8px 0",marginBottom:12}}>{T("noFoodToday")}</div>
        )}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>goTo("lifestyle","healthcoach:food")} style={{
            flex:1,background:"rgba(245,158,11,0.1)",color:"#F59E0B",border:"1px solid rgba(245,158,11,0.2)",
            borderRadius:12,padding:"11px 4px",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>{T("addFood")}</button>
          <button onClick={()=>goTo("lifestyle","healthcoach:sport")} style={{
            flex:1,background:"rgba(16,185,129,0.1)",color:"#10B981",border:"1px solid rgba(16,185,129,0.2)",
            borderRadius:12,padding:"11px 4px",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>{T("addSport")}</button>
        </div>
      </div>

      {/* ── KAFAMDAKILER ── */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.5 19H9.5a7 7 0 117.9-10.5 5 5 0 110 10.5z" stroke="#1D9E75" strokeWidth="1.5" fill="rgba(20,184,166,0.1)"/></svg>
          {T("thoughts")}
        </div>
        <div style={{background:"#FFFFFF",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(0,0,0,0.06)"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<2?10:0}}>
              <span style={{fontSize:13,color:"#8B8578",flexShrink:0,fontWeight:700}}>{i+1}.</span>
              <input
                value={thoughts[i]||""}
                onChange={e=>updateThought(i,e.target.value)}
                placeholder={[T("thought1"),T("thought2"),T("thought3")][i]}
                style={{
                  flex:1,background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.06)",
                  borderRadius:10,padding:"10px 12px",color:"#2C2A26",fontSize:13,outline:"none",
                  WebkitAppearance:"none",boxSizing:"border-box",
                }}
              />
              {(thoughts[i]||"").trim()&&(
                <button onClick={()=>thoughtToNote(i)} title={T("saveToNotes")||"Notlara kaydet"} style={{
                  width:32,height:32,borderRadius:8,border:"1px solid rgba(20,184,166,0.2)",
                  background:"rgba(20,184,166,0.1)",color:"#1D9E75",fontSize:14,
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="#1D9E75" strokeWidth="1.5"/><polyline points="17,21 17,13 7,13 7,21" stroke="#1D9E75" strokeWidth="1.5"/><polyline points="7,3 7,8 15,8" stroke="#1D9E75" strokeWidth="1.5"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ HABERLER ── */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#D85A30" strokeWidth="2" fill="none"/><line x1="9" y1="13" x2="27" y2="13" stroke="#D85A30" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="22" y2="18" stroke="#D85A30" strokeWidth="2" strokeLinecap="round" opacity=".6"/></svg>
            {T("bbcNews")}
          </div>
          <button onClick={()=>goTo("lifestyle","news")} style={{background:"none",border:"none",color:"#D85A30",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
        </div>
        <div style={{background:"#FFFFFF",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(0,0,0,0.06)"}}>
          {headlines.length === 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:10,color:"#8B8578"}}>
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none" style={{animation:"pulse 1.5s infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" stroke="#D85A30" strokeWidth="1.5" fill="none"/><path d="M14 18 A4 4 0 0 0 22 18" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round"/><line x1="18" y1="5" x2="18" y2="2" stroke="#D85A30" strokeWidth="2" strokeLinecap="round"/><line x1="25" y1="7" x2="27" y2="5" stroke="#D85A30" strokeWidth="2" strokeLinecap="round"/><line x1="11" y1="7" x2="9" y2="5" stroke="#D85A30" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{fontSize:13}}>{T("newsLoading")}</span>
            </div>
          ) : headlines.slice(0,4).map((item,i)=>(
            <div key={i} onClick={()=>item.link&&window.open(item.link,"_blank","noopener")}
              style={{display:"flex",alignItems:"flex-start",gap:10,cursor:item.link?"pointer":"default",
              paddingBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              marginBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              borderBottom: i < headlines.slice(0,4).length-1 ? "1px solid rgba(0,0,0,0.06)" : "none",
            }}>
              <span style={{fontSize:10,color:"#D85A30",fontWeight:700,marginTop:3,flexShrink:0,minWidth:16}}>{i+1}</span>
              <span style={{fontSize:13,lineHeight:1.4,color:"#2C2A26",opacity:.85}}>{typeof item==="string"?item:item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ MÜZİK ── */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><circle cx="12" cy="28" r="5" stroke="#8B5CF6" strokeWidth="2" fill="none"/><circle cx="28" cy="24" r="5" stroke="#8B5CF6" strokeWidth="2" fill="none"/><path d="M17 28 L17 8 L33 4 L33 24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="8" x2="33" y2="4" stroke="#8B5CF6" strokeWidth="1.5"/></svg>
            {T("musicCol")}
          </div>
          <button onClick={()=>goTo("lifestyle","music")} style={{background:"none",border:"none",color:"#8B5CF6",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
        </div>
        {musicItems.length === 0 ? (
          <div onClick={()=>goTo("lifestyle","music")} style={{
            background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:16,
            padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,
          }}>
            <div style={{width:48,height:48,borderRadius:14,background:"#F5F0E8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none"><path d="M6 18 C6 11 11 6 18 6 C25 6 30 11 30 18" stroke="#8B5CF6" strokeWidth="1.5" fill="none"/><rect x="4" y="17" width="6" height="10" rx="3" fill="#8B5CF6" opacity=".7"/><rect x="26" y="17" width="6" height="10" rx="3" fill="#8B5CF6" opacity=".7"/></svg>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#2C2A26"}}>{T("musicEmpty")}</div>
              <div style={{fontSize:13,color:"#8B8578",marginTop:3}}>{T("musicEmptyDesc")}</div>
            </div>
            <span style={{marginLeft:"auto",color:"#8B8578",fontSize:16}}>▶</span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch"}}>
            {musicItems.slice(0,6).map((item,i)=>(
              <div key={item.id||i}
                onClick={()=>item.link&&window.open(item.link,"_blank","noopener")}
                style={{
                  background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:14,
                  padding:"10px 12px",minWidth:120,maxWidth:140,flexShrink:0,cursor:"pointer",
                }}>
                <div style={{width:44,height:44,borderRadius:10,background:item.albumArt?"#000":"#F5F0E8",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  {item.albumArt
                    ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <svg width="20" height="20" viewBox="0 0 36 36" fill="none"><circle cx="11" cy="27" r="5" stroke="#8B5CF6" strokeWidth="1.5" fill="rgba(139,92,246,0.15)"/><path d="M16 27 L16 9 L30 5 L30 23" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:"#2C2A26",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title||"Parça"}</div>
                {item.artist&&<div style={{fontSize:10,color:"#8B8578",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.artist}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>{T("thisWeek")}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {val:wkSport.length,label:T("workout"),color:"#3B82F6",max:7},
            {val:wkBurned,label:T("kcalBurned"),color:"#EF4444",max:Math.max(wkBurned,2000)},
            {val:done,label:T("taskDone"),color:"#10B981",max:Math.max(done,10)},
          ].map((s,i)=>{
            const pct = s.max > 0 ? Math.min(100, (s.val / s.max) * 100) : 0;
            const r = 20; const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;
            return (
              <div key={i} style={{background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:16,padding:"16px 8px",textAlign:"center"}}>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{display:"block",margin:"0 auto 8px"}}>
                  <circle cx="26" cy="26" r={r} fill="none" stroke="#F5F0E8" strokeWidth="4"/>
                  <circle cx="26" cy="26" r={r} fill="none" stroke={s.color} strokeWidth="4"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 26 26)"
                    style={{transition:"stroke-dashoffset .6s ease"}}/>
                </svg>
                <div style={{fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
                <div style={{fontSize:10,color:"#8B8578",marginTop:2,lineHeight:1.2}}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>


      {data.notes.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px"}}>{T("recentNotes")}</div>
            <button onClick={()=>goTo("tasks","notes")} style={{background:"none",border:"none",color:"#185FA5",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
            {data.notes.slice(0,5).map(n=>(
              <div key={n.id} onClick={()=>goTo("tasks","notes")} style={{
                background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:14,padding:"12px",
                minWidth:130,maxWidth:160,cursor:"pointer",flexShrink:0,
                borderTop:`3px solid ${n.color||"#1D9E75"}`,
              }}>
                <div style={{fontSize:12,fontWeight:600,color:"#2C2A26",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
                {n.content&&<div style={{fontSize:11,color:"#8B8578",marginTop:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.4}}>{n.content}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
