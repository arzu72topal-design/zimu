import { useState, useEffect } from "react";
import { i18n } from "../i18n";
import { uid } from "../constants";
import { Modal } from "./ui/Modal";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, glowCard, inp, btnPrimary } from "../styles";

const WMO_TR={0:"Açık",1:"Çoğunlukla açık",2:"Kısmen bulutlu",3:"Bulutlu",45:"Sisli",61:"Hafif yağmurlu",63:"Orta yağmurlu",65:"Şiddetli yağmurlu",71:"Hafif karlı",80:"Hafif sağanak",95:"Gök gürültülü"};
function getStyleHint(t,T){if(t<8)return T("style1");if(t<14)return T("style2");if(t<18)return T("style3");if(t<23)return T("style4");if(t<28)return T("style5");return T("style6");}
function getWeatherLooks(t,T){if(t<14)return[{icon:"coat",name:T("lookLayered"),tags:[{l:T("tagWork"),c:"work"},{l:T("tagCool"),c:"cool"}],mood:T("moodConfidentPro")},{icon:"scarf",name:T("lookCasualLayer"),tags:[{l:T("tagCasual"),c:"casual"},{l:T("tagCool"),c:"cool"}],mood:T("moodComfy")},{icon:"smart",name:T("lookSmartCozy"),tags:[{l:T("tagElegant"),c:"elegant"}],mood:T("moodPeaceful")}];if(t<23)return[{icon:"coat",name:"Business Classic",tags:[{l:T("tagWork"),c:"work"},{l:T("tagElegant"),c:"elegant"}],mood:T("moodConfident")},{icon:"dress",name:"Smart Casual",tags:[{l:T("tagCasual"),c:"casual"}],mood:T("moodChic")},{icon:"smart",name:"Minimalist",tags:[{l:T("tagSimple"),c:"casual"}],mood:T("moodStrong")}];return[{icon:"dress",name:"Summer Chic",tags:[{l:T("tagCasual"),c:"casual"},{l:T("tagWarm"),c:"warm"}],mood:T("moodEnergetic")},{icon:"linen",name:"Linen Look",tags:[{l:T("tagElegant"),c:"elegant"},{l:T("tagWarm"),c:"warm"}],mood:T("moodNatural")},{icon:"smart",name:"Minimalist",tags:[{l:T("tagSimple"),c:"casual"}],mood:T("moodFree")}];}
function ClothingIcon({type,size=28,color="#a78bfa"}){const s=size;
  if(type==="coat"||type==="blazer")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/></svg>);
  if(type==="dress")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M12 4L20 4L22 12L26 28L6 28L10 12Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><line x1="12" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="scarf")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><path d="M13 7 Q16 9 19 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>);
  if(type==="bottom")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M6 4L26 4L24 28L18 28L16 18L14 28L8 28Z" stroke={color} strokeWidth="1.5" fill={color+"15"} strokeLinejoin="round"/><line x1="6" y1="4" x2="26" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="linen")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><line x1="12" y1="18" x2="20" y2="18" stroke={color} strokeWidth="1" opacity=".4"/></svg>);
  return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><path d="M16 8L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/></svg>);
}
const CLOTH_CATS=[{id:"top",label:"Üst Giyim",color:"#534AB7",svgType:"smart"},{id:"alt",label:"Alt Giyim",color:"#a78bfa",svgType:"bottom"},{id:"dis",label:"Dış Giyim",color:"#185FA5",svgType:"coat"},{id:"elbise",label:"Elbise/Etek",color:"#ec4899",svgType:"dress"}];
const CLOTH_FREQ={favorite:{bg:"rgba(34,197,94,0.15)",border:"rgba(34,197,94,0.3)",text:"#86efac",label:"Favori"},frequent:{bg:"rgba(99,102,241,0.15)",border:"rgba(99,102,241,0.3)",text:"#a5b4fc",label:"Sık"},waiting:{bg:"rgba(239,68,68,0.15)",border:"rgba(239,68,68,0.3)",text:"#fca5a5",label:"Bekliyor"},new:{bg:"rgba(167,139,250,0.15)",border:"rgba(167,139,250,0.3)",text:"#c4b5fd",label:"Yeni"}};
const TAG_COL={work:{bg:"rgba(24,95,165,0.12)",text:"#93c5fd"},casual:{bg:"rgba(34,197,94,0.2)",text:"#86efac"},elegant:{bg:"rgba(168,85,247,0.2)",text:"#d8b4fe"},warm:{bg:"rgba(249,115,22,0.2)",text:"#fdba74"},cool:{bg:"rgba(99,102,241,0.15)",text:"#a5b4fc"}};
const PALETTE_COLS=[{hex:"#c8b8a2",name:"Bej"},{hex:"#9fa8a3",name:"Gri"},{hex:"#1e3a5f",name:"Lacivert"},{hex:"#3d3d3d",name:"Antrasit"},{hex:"#f5f0e8",name:"Krem"},{hex:"#8b7355",name:"Kahve"},{hex:"#6b4c3b",name:"Terracotta"},{hex:"#2c4a3e",name:"Koyu Yeşil"}];
const DEFAULT_WARDROBE2=[{id:"w1",name:"Lacivert Blazer",cat:"dis",wornCount:3,lastWorn:"12 gün önce",freq:60,freqStatus:"frequent",color:"#1e3a5f"},{id:"w2",name:"Bej Oversize Bluz",cat:"top",wornCount:1,lastWorn:"25 gün önce",freq:20,freqStatus:"waiting",color:"#c8b8a2"},{id:"w3",name:"Antrasit Slim Pantolon",cat:"alt",wornCount:5,lastWorn:"5 gün önce",freq:85,freqStatus:"favorite",color:"#3d3d3d"},{id:"w4",name:"Beyaz Basic Tişört",cat:"top",wornCount:7,lastWorn:"2 gün önce",freq:95,freqStatus:"frequent",color:"#f5f0e8"}];
const DEFAULT_RULES2=[{id:"r1",label:"İş ortamına uygun",on:true},{id:"r2",label:"Sürdürülebilir palet",on:true},{id:"r3",label:"Bu ay yeni alım yok",on:false},{id:"r4",label:"Tekrar giymeden ekleme yok",on:true}];
const catIconMap={top:"smart",alt:"bottom",dis:"coat",elbise:"dress"};

export default function BenimStilimRoom({data,update,onBack}){
  const T = (key) => i18n(key, data);
  const [weather,setWeather]=useState(null);
  const [wxLoad,setWxLoad]=useState(true);
  const [cityName,setCityName]=useState(T("gettingLoc"));
  const [activeLook,setActiveLook]=useState(0);
  const [wardFilter,setWardFilter]=useState("all");
  const [addModal,setAddModal]=useState(false);
  const [addForm,setAddForm]=useState({name:"",cat:"top",color:"#c8b8a2"});
  const stilData=data.stilData||{wardrobe:DEFAULT_WARDROBE2,rules:DEFAULT_RULES2,paletteActive:[]};
  const wardrobe=stilData.wardrobe||DEFAULT_WARDROBE2;
  const rules=stilData.rules||DEFAULT_RULES2;
  const paletteActive=stilData.paletteActive||[];
  const saveStil=(patch)=>update({...data,stilData:{...stilData,...patch}});
  useEffect(()=>{
    setWxLoad(true);
    const fetchWeather = (lat, lon, tz) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=${tz||"auto"}`)
        .then(r=>r.json()).then(d=>{const c=d.current;setWeather({temp:Math.round(c.temperature_2m),feel:Math.round(c.apparent_temperature),humid:Math.round(c.relative_humidity_2m),wind:Math.round(c.wind_speed_10m),desc:WMO_TR[c.weather_code]||"Bilinmiyor"});}).catch(()=>setWeather(null)).finally(()=>setWxLoad(false));
    };
    const getCityName = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`)
        .then(r=>r.json()).then(d=>{ setCityName(d.timezone?.split("/").pop()?.replace(/_/g," ") || `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`); }).catch(()=>{});
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          fetchWeather(lat, lon, "auto");
          getCityName(lat, lon);
        },
        () => { fetchWeather(41.0082, 28.9784, "Europe/Istanbul"); setCityName("İstanbul"); },
        { timeout: 8000 }
      );
    } else {
      fetchWeather(41.0082, 28.9784, "Europe/Istanbul"); setCityName("İstanbul");
    }
  },[]);
  const looks=getWeatherLooks(weather?.temp??18,T);
  const freqScore=wardrobe.length===0?0:Math.round(wardrobe.filter(w=>w.freq>50).length/wardrobe.length*100);
  const filtered=wardFilter==="all"?wardrobe:wardrobe.filter(w=>w.cat===wardFilter);
  const toggleRule=(id)=>saveStil({rules:rules.map(r=>r.id===id?{...r,on:!r.on}:r)});
  const togglePalette=(hex)=>saveStil({paletteActive:paletteActive.includes(hex)?paletteActive.filter(h=>h!==hex):[...paletteActive,hex]});
  const wearCloth=(id)=>saveStil({wardrobe:wardrobe.map(w=>{if(w.id!==id)return w;const wc=(w.wornCount||0)+1;const freq=Math.min(100,(w.freq||0)+15);const fs=freq>=70?"favorite":freq>=40?"frequent":wc<=1?"new":"waiting";return{...w,wornCount:wc,lastWorn:"Bugün",freq,freqStatus:fs};})});
  const delCloth=(id)=>saveStil({wardrobe:wardrobe.filter(w=>w.id!==id)});
  const addCloth=()=>{if(!addForm.name.trim())return;const ni={id:uid(),name:addForm.name,cat:addForm.cat,wornCount:0,lastWorn:T("neverWorn"),freq:0,freqStatus:"new",color:addForm.color};saveStil({wardrobe:[ni,...wardrobe]});setAddModal(false);setAddForm({name:"",cat:"top",color:"#c8b8a2"});};
  return(
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>
          <div>
            <div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#e0d5f5,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{T("myStyle")}</div>
            <div style={{fontSize:10,color:"#8B8578"}}>{T("lifestyleDesc")}</div>
          </div>
        </div>
      </StickyHeader>
      <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.1))",border:"1px solid rgba(24,95,165,0.12)",borderRadius:16,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#8B8578",letterSpacing:1,textTransform:"uppercase"}}>{T("todayWeather")}</div><div style={{fontSize:12,color:"#8B8578",marginTop:2}}>{cityName}</div></div>
          <div style={{textAlign:"right"}}>{wxLoad?<div style={{fontSize:12,color:"#8B8578",animation:"pulse 1.5s infinite"}}>Yükleniyor...</div>:weather?<><div style={{fontSize:26,fontWeight:800,color:"#e0d5f5"}}>{weather.temp}°C</div><div style={{fontSize:11,color:"#8B8578"}}>{weather.desc}</div></>:<div style={{fontSize:11,color:"#8B8578"}}>Veri alınamadı</div>}</div>
        </div>
        {weather&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(0,0,0,0.06)",display:"flex",gap:16}}><div style={{fontSize:10,color:"#8B8578"}}>{weather.wind} km/s {T("wind")}</div><div style={{fontSize:10,color:"#8B8578"}}>%{weather.humid} {T("humidity")}</div><div style={{fontSize:10,color:"#8B8578"}}>{weather.feel}°C {T("feelsLike")}</div></div>}
        <div style={{marginTop:10,background:"#F5F0E8",borderRadius:10,padding:"8px 12px"}}><div style={{fontSize:10,color:"#8B8578",marginBottom:3}}>{T("styleAdvice")}</div><div style={{fontSize:13,color:"#c4b5fd",fontWeight:600}}>{wxLoad?T("calculating"):weather?getStyleHint(weather.temp,T):T("noWeather")}</div></div>
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#8B8578",textTransform:"uppercase",marginBottom:10}}>{T("todayLooks")}</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {looks.map((look,i)=>(
          <div key={i} onClick={()=>setActiveLook(i)} style={{background:activeLook===i?"rgba(167,139,250,0.1)":"#F5F0E8",border:`1px solid ${activeLook===i?"rgba(167,139,250,0.5)":"rgba(0,0,0,0.06)"}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",flex:1,minWidth:0,transition:"all .2s"}}>
            <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><ClothingIcon type={look.icon} size={26} color={activeLook===i?"#a78bfa":"#8B8578"}/></div>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{look.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>{look.tags.map((t,ti)=><span key={ti} style={{fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:20,background:TAG_COL[t.c]?.bg,color:TAG_COL[t.c]?.text}}>{t.l}</span>)}</div>
            <div style={{fontSize:9,color:"#8B8578",marginTop:4,textAlign:"center"}}>{look.mood}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#8B8578",textTransform:"uppercase",marginBottom:12}}>{T("styleRules")}</div>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.7,marginBottom:4}}><span>{T("wearScore")}</span><span style={{color:"#a78bfa",fontWeight:700}}>{freqScore}%</span></div>
          <div style={{height:6,borderRadius:3,background:"#F5F0E8"}}><div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#534AB7,#a78bfa)",width:`${freqScore}%`,transition:"width .8s"}}/></div>
          <div style={{fontSize:10,color:"#8B8578",marginTop:4}}>{freqScore<50?T("wardrobeWaiting"):freqScore<80?T("wardrobeOptimal"):T("wardrobePerfect")}</div>
        </div>
        {rules.map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
            <span style={{fontSize:13,opacity:.85}}>{{r1:T("rule1"),r2:T("rule2"),r3:T("rule3"),r4:T("rule4")}[r.id]||r.label}</span>
            <div onClick={()=>toggleRule(r.id)} style={{width:38,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:r.on?"rgba(167,139,250,0.7)":"rgba(0,0,0,0.08)",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",width:16,height:16,borderRadius:"50%",background:"#fff",top:3,left:r.on?19:3,transition:"left .2s"}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#8B8578",textTransform:"uppercase",marginBottom:12}}>{T("colorPalette")}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>togglePalette(p.hex)} style={{width:36,height:36,borderRadius:10,background:p.hex,cursor:"pointer",flexShrink:0,transition:"transform .15s",outline:paletteActive.includes(p.hex)?"2.5px solid rgba(167,139,250,0.9)":"none",transform:paletteActive.includes(p.hex)?"scale(1.12)":"scale(1)"}}/>))}
          <div style={{width:36,height:36,borderRadius:10,border:"1.5px dashed rgba(0,0,0,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#8B8578",cursor:"pointer"}}>+</div>
        </div>
        <div style={{fontSize:10,color:"#8B8578",marginTop:8}}>{paletteActive.length===0?T("paletteTap"):T("paletteActive").replace("{0}",paletteActive.length)}</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#8B8578",textTransform:"uppercase"}}>{T("myCloset")}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",l:T("all")},{id:"top",l:T("top")},{id:"alt",l:T("bottom")},{id:"dis",l:T("outer")},{id:"elbise",l:T("dress")}].map(f=>(
              <button key={f.id} onClick={()=>setWardFilter(f.id)} style={{background:wardFilter===f.id?"rgba(167,139,250,0.15)":"#F5F0E8",border:`1px solid ${wardFilter===f.id?"rgba(167,139,250,0.4)":"rgba(0,0,0,0.06)"}`,color:wardFilter===f.id?"#c4b5fd":"#8B8578",borderRadius:20,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:wardFilter===f.id?700:400}}>{f.l}</button>
            ))}
          </div>
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#8B8578",fontSize:13}}>Bu kategoride kıyafet yok</div>}
        {filtered.map(item=>{
          const fc=CLOTH_FREQ[item.freqStatus]||CLOTH_FREQ.new;
          return(
            <div key={item.id} style={{background:"#FFFFFF",border:"1px solid rgba(0,0,0,0.06)",borderRadius:14,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:44,height:44,borderRadius:12,background:(item.color||"#a78bfa")+"25",border:`1px solid ${(item.color||"#a78bfa")}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ClothingIcon type={catIconMap[item.cat]||"smart"} size={24} color={item.color||"#a78bfa"}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                <div style={{fontSize:10,color:"#8B8578",marginTop:2}}>{T("timesWorn").replace("{0}",item.wornCount)} · {item.lastWorn}</div>
                <div style={{height:5,borderRadius:3,background:"#F5F0E8",marginTop:5}}><div style={{height:"100%",borderRadius:3,width:`${item.freq}%`,background:item.freqStatus==="favorite"?"linear-gradient(90deg,#1D9E75,#1D9E75)":item.freqStatus==="waiting"?"linear-gradient(90deg,#BA7517,#D85A30)":"linear-gradient(90deg,#534AB7,#a78bfa)",transition:"width .6s"}}/></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <div style={{background:fc.bg,border:`1px solid ${fc.border}`,color:fc.text,fontSize:10,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{{favorite:T("freqFavorite"),frequent:T("freqFrequent"),waiting:T("freqWaiting"),new:T("freqNew")}[item.freqStatus]||fc.label}</div>
                <button onClick={()=>wearCloth(item.id)} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",color:"#a78bfa",fontSize:9,padding:"2px 8px",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap"}}>{T("woreToday")}</button>
                <button onClick={()=>delCloth(item.id)} style={{background:"none",border:"none",color:"#444",fontSize:10,cursor:"pointer",padding:"2px 4px"}}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{height:20}}/>
      <button onClick={()=>setAddModal(true)} style={{position:"fixed",bottom:84,right:16,background:"linear-gradient(135deg,#534AB7,#a78bfa)",border:"none",borderRadius:18,padding:"12px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(99,102,241,0.5)",zIndex:100}}>
        <span style={{fontSize:18}}>+</span> Kıyafet Ekle
      </button>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title={T("addClothing")}>
        <input style={inp} placeholder={T("clothingName")} value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#8B8578",marginBottom:6}}>{T("categoryLabel")}</div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {CLOTH_CATS.map(c=>(<button key={c.id} onClick={()=>setAddForm({...addForm,cat:c.id})} style={{background:addForm.cat===c.id?`${c.color}25`:"#F5F0E8",border:`1px solid ${addForm.cat===c.id?c.color+"60":"rgba(0,0,0,0.06)"}`,color:addForm.cat===c.id?c.color:"#777",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><ClothingIcon type={c.svgType} size={14} color={addForm.cat===c.id?c.color:"#8B8578"}/>{c.label}</button>))}
        </div>
        <div style={{fontSize:12,color:"#8B8578",marginBottom:6}}>{T("clothColor")}</div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>setAddForm({...addForm,color:p.hex})} style={{width:30,height:30,borderRadius:8,background:p.hex,cursor:"pointer",outline:addForm.color===p.hex?"2.5px solid #a78bfa":"none",transform:addForm.color===p.hex?"scale(1.15)":"scale(1)",transition:"all .15s"}}/>))}
        </div>
        <button style={btnPrimary} onClick={addCloth}>{T("addToCloset")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ MEMORIES ROOM ═══════════ */
