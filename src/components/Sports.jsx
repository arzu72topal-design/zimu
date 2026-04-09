import { useState, useEffect, useRef } from "react";
import { VoiceMic } from "./VoiceMic";
import { i18n } from "../i18n";
import { today, uid, SPORT_TYPES, SPORT_EMOJI, SPORT_KCAL_PER_MIN, calcSportCal, COMMON_FOODS, MN, DN } from "../constants";
import { Modal } from "./ui/Modal";
import { StickyHeader } from "./ui/StickyHeader";
import { inp, btnPrimary, cardStyle, glowCard, addBtnStyle, filterBtnStyle, delBtnStyle } from "../styles";

export default function Sports({ data, update, initialView, onBack }) {
  const T = (key) => i18n(key, data);
  const [modal,setModal]=useState(false);
  const [foodModal,setFoodModal]=useState(false);
  const [form,setForm]=useState({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  const [foodForm,setFoodForm]=useState({name:"",calories:"",meal:"Öğle",date:today()});
  const [foodSearch,setFoodSearch]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const photoRef=useRef(null);

  // Dashboard'dan gelen yönlendirme — modalı otomatik aç
  useEffect(() => {
    if (initialView === "food") {
      const t = setTimeout(() => setFoodModal(true), 300);
      return () => clearTimeout(t);
    }
    if (initialView === "sport") {
      const t = setTimeout(() => setModal(true), 300);
      return () => clearTimeout(t);
    }
  }, [initialView]);

  const foods = data.foods || [];
  const aiProvider = data.settings?.aiProvider||"none";
  const aiKey = data.settings?.aiKey||"";
  const hasAI = aiProvider!=="none" && aiKey;

  // AI Photo Analysis
  const analyzePhoto = async (file) => {
    if(!hasAI) return;
    setAnalyzing(true);setAiResult(null);
    try {
      const base64 = await new Promise((res,rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      let result;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            contents:[{parts:[
              {inlineData:{mimeType:file.type,data:base64}},
              {text:"Bu yemek fotoğrafını analiz et. JSON formatında cevap ver, başka hiçbir şey yazma. Format: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan. Porsiyon büyüklüğünü tahmin et."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:file.type,data:base64}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({
            model:"gpt-4o-mini",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image_url",image_url:{url:`data:${file.type};base64,${base64}`}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      }
      if(result&&result.items) setAiResult(result);
      else setAiResult({error:"Analiz yapılamadı, tekrar deneyin"});
    } catch(err) {
      console.error("AI error:",err);
      setAiResult({error:"Hata: "+err.message});
    }
    setAnalyzing(false);
  };

  const saveAiResult = () => {
    if(!aiResult||!aiResult.items) return;
    const newFoods = aiResult.items.map(item=>({
      id:uid(),name:item.name,calories:item.calories,meal:foodForm.meal,date:today()
    }));
    update({...data,foods:[...newFoods,...foods]});
    setAiResult(null);
  };

  const addSport=()=>{
    if(!form.duration)return;
    // Auto-calculate calories if not manually entered
    const autoCal = calcSportCal(form.type, form.duration);
    const finalCal = form.calories ? +form.calories : autoCal;
    const ns={id:uid(),...form,duration:+form.duration,distance:+form.distance||0,calories:finalCal};
    update({...data,sports:[ns,...data.sports]});
    setModal(false);setForm({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  };
  const delSport=id=>update({...data,sports:data.sports.filter(s=>s.id!==id)});

  const addFood=()=>{
    if(!foodForm.name.trim()||!foodForm.calories)return;
    const nf={id:uid(),...foodForm,calories:+foodForm.calories};
    // Auto-save to personal food database
    const myFoods = data.myFoods || {};
    const key = foodForm.name.trim();
    const newMyFoods = {...myFoods,[key]:+foodForm.calories};
    update({...data,foods:[nf,...foods],myFoods:newMyFoods});
    setFoodModal(false);setFoodForm({name:"",calories:"",meal:"Öğle",date:today()});setFoodSearch("");
  };
  const delFood=id=>update({...data,foods:foods.filter(f=>f.id!==id)});
  const delMyFood=name=>{const mf={...(data.myFoods||{})};delete mf[name];update({...data,myFoods:mf});};

  const selectCommonFood=(name,cal)=>{
    setFoodForm({...foodForm,name,calories:String(cal)});
    setFoodSearch("");
  };

  // AI text-based calorie lookup
  const [aiLookup,setAiLookup]=useState(false);
  const askAiCalorie = async (foodName) => {
    if(!hasAI||!foodName.trim()) return;
    setAiLookup(true);
    try {
      const prompt = `"${foodName}" yemeğinin 1 porsiyon kalori değerini söyle. SADECE sayı olarak cevap ver, başka hiçbir şey yazma. Örnek: 250`;
      let cal = null;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({model:"gpt-4o-mini",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      }
      if(cal && cal > 0) setFoodForm(f=>({...f,calories:String(cal)}));
    } catch(err) { console.error("AI lookup error:",err); }
    setAiLookup(false);
  };

  const t=today();
  const wk=data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const tMin=wk.reduce((a,s)=>a+(s.duration||0),0);
  const burnedCal=wk.reduce((a,s)=>a+(s.calories||0),0);
  const tDist=wk.reduce((a,s)=>a+(s.distance||0),0);

  const todayFoods=foods.filter(f=>f.date===t);
  const todayCalIn=todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todaySports=data.sports.filter(s=>s.date===t);
  const todayCalOut=todaySports.reduce((a,s)=>a+(s.calories||0),0);
  const dailyGoal=2000;
  const netCal=todayCalIn-todayCalOut;

  // AI Coach advice
  const getCoachTip=()=>{
    if(todayCalIn===0&&todayCalOut===0) return {icon:"●",text:T("noRecordYet"),color:"#185FA5"};
    if(netCal>dailyGoal+300) return {icon:"⚠️",text:`Bugün ${netCal} kcal net kalori — hedefin üzerinde. Hafif bir yürüyüş veya koşu iyi gelir!`,color:"#BA7517"};
    if(netCal<1200&&todayCalIn>0) return {icon:"★",text:`Harika gidiyorsun! ${netCal} kcal net — dengeli ve sağlıklı.`,color:"#1D9E75"};
    if(todayCalOut>300) return {icon:"▲",text:`Bugün ${todayCalOut} kcal yaktın, süpersin! Protein ağırlıklı beslenmeyi unutma.`,color:"#1D9E75"};
    if(todayCalIn>0&&todayCalOut===0) return {icon:"▸",text:`${todayCalIn} kcal aldın ama henüz spor yapmadın. 30dk yürüyüş ~150 kcal yakar!`,color:"#D85A30"};
    return {icon:"✨",text:"Günü dengeli geçiriyorsun, böyle devam!",color:"#185FA5"};
  };
  const tip=getCoachTip();

  // Smart search: COMMON_FOODS + myFoods + recent history
  const myFoods = data.myFoods || {};
  const recentFoodNames = {};
  foods.slice(0,50).forEach(f=>{ if(f.name && f.calories && !recentFoodNames[f.name]) recentFoodNames[f.name]=f.calories; });
  const allFoodDB = {...COMMON_FOODS,...recentFoodNames,...myFoods};
  const filteredFoods = foodSearch
    ? Object.entries(allFoodDB).filter(([k])=>k.toLowerCase().includes(foodSearch.toLowerCase())).slice(0,15)
    : [
        ...Object.entries(myFoods).slice(0,6).map(([k,v])=>[k,v,"my"]),
        ...Object.entries(COMMON_FOODS).slice(0,8),
      ].slice(0,12);
  const noResults = foodSearch && filteredFoods.length === 0;

  const mealGroups = [T("breakfast"),T("lunch"),T("dinner"),T("snack")];

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack && <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>}
          <h3 style={{margin:0,fontSize:20,fontWeight:800,flex:1}}>{T("healthCoach")}</h3>
        </div>
      </StickyHeader>

      {/* Coach tip */}
      <div className="stagger-1" style={{background:`${tip.color}15`,border:`1px solid ${tip.color}30`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"start"}}>
        <span style={{fontSize:20}}>{tip.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:tip.color,marginBottom:1}}>{T("yourCoach")}</div>
          <div style={{fontSize:12,opacity:.8,lineHeight:1.4}}>{tip.text}</div>
        </div>
      </div>

      {/* Kalori denge kartı */}
      <div className="stagger-2" style={{background:"#FFFFFF",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-around",textAlign:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#D85A30"}}>{todayCalIn}</div>
            <div style={{fontSize:10,color:"#8B8578"}}>{T("intake")}</div>
          </div>
          <div style={{fontSize:18,opacity:.2,alignSelf:"center"}}>−</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#1D9E75"}}>{todayCalOut}</div>
            <div style={{fontSize:10,color:"#8B8578"}}>{T("burned")}</div>
          </div>
          <div style={{fontSize:18,opacity:.2,alignSelf:"center"}}>=</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:netCal>dailyGoal?"#D85A30":"#185FA5"}}>{netCal}</div>
            <div style={{fontSize:10,color:"#8B8578"}}>{T("net")}</div>
          </div>
        </div>
        <div style={{height:6,background:"#F5F0E8",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",background:netCal>dailyGoal?"#D85A30":"#185FA5",borderRadius:3,width:`${Math.min(100,netCal/dailyGoal*100)}%`,transition:"width .3s"}}/>
        </div>
        <div style={{fontSize:10,color:"#8B8578",marginTop:4,textAlign:"center"}}>{T("targetKcal").replace("{0}",dailyGoal)}</div>
      </div>

      {/* +Yemek / +Spor butonları */}
      <div className="stagger-3" style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>{setFoodModal(true);setFoodSearch("");}} style={{
          flex:1,background:"rgba(249,115,22,0.1)",color:"#D85A30",
          border:"1px solid rgba(249,115,22,0.3)",borderRadius:12,
          padding:"14px 8px",fontSize:14,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <span style={{fontSize:18}}>+</span> {T("addMeal")}
        </button>
        <button onClick={()=>setModal(true)} style={{
          flex:1,background:"rgba(34,197,94,0.1)",color:"#1D9E75",
          border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,
          padding:"14px 8px",fontSize:14,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <span style={{fontSize:18}}>+</span> {T("addExercise")}
        </button>
      </div>

      {hasAI&&(
        <div style={{marginBottom:12}}>
          <button onClick={()=>photoRef.current?.click()} disabled={analyzing} style={{
            ...addBtnStyle,background:analyzing?"#6B7280":"#1D9E75",width:"100%",padding:"12px",borderRadius:12,fontSize:14,
          }}>{analyzing?`◌ ${T("analyzing")}`:` ◎ ${T("photoCalorie")}`}</button>
          <input ref={photoRef} type="file" accept="image/*" capture="environment"
            onChange={e=>{if(e.target.files?.[0])analyzePhoto(e.target.files[0]);e.target.value="";}}
            style={{display:"none"}}/>
        </div>
      )}

      {/* AI Result card */}
      {aiResult&&!aiResult.error&&(
        <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#1D9E75"}}>AI Analiz Sonucu</span>
            <span style={{fontSize:14,fontWeight:800,color:"#D85A30"}}>{aiResult.total} kcal</span>
          </div>
          {aiResult.items.map((item,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
              <span style={{opacity:.7}}>{item.name}</span>
              <span style={{fontWeight:600,color:"#D85A30"}}>{item.calories} kcal</span>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:10}}>
            <button onClick={saveAiResult} style={{...btnPrimary,flex:1,marginTop:0,background:"#1D9E75",padding:"10px"}}>✓ Kaydet</button>
            <button onClick={()=>setAiResult(null)} style={{...btnPrimary,flex:1,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#D85A30",padding:"10px",border:"1px solid rgba(239,68,68,0.2)"}}>✕ İptal</button>
          </div>
        </div>
      )}
      {aiResult?.error&&(
        <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
          <span style={{fontSize:13,color:"#D85A30"}}>{aiResult.error}</span>
          <button onClick={()=>setAiResult(null)} style={{display:"block",marginTop:6,background:"none",border:"none",color:"#D85A30",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Kapat</button>
        </div>
      )}

      {/* ── Bugünün Yemekleri ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("todayFoods")}</div>
        {todayFoods.length===0 ? (
          <div style={{textAlign:"center",padding:"20px",color:"#8B8578",fontSize:13}}>{T("noFoodYet")}</div>
        ) : mealGroups.map(meal=>{
          const mealFoods=todayFoods.filter(f=>f.meal===meal);
          if(mealFoods.length===0)return null;
          const mealCal=mealFoods.reduce((a,f)=>a+(f.calories||0),0);
          return (
            <div key={meal} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,opacity:.6}}>{meal}</span>
                <span style={{fontSize:11,fontWeight:600,color:"#D85A30"}}>{mealCal} kcal</span>
              </div>
              {mealFoods.map(f=>(
                <div key={f.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
                  <span style={{fontSize:13,flex:1}}>{f.name}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#D85A30"}}>{f.calories}</span>
                  <button onClick={()=>delFood(f.id)} style={delBtnStyle} aria-label="Delete">✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Bugünün Sporları ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("todaySports")}</div>
        {todaySports.length===0 ? (
          <div style={{textAlign:"center",padding:"20px",color:"#8B8578",fontSize:13}}>{T("noSportYet")}</div>
        ) : todaySports.map(s=>(
          <div key={s.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
            <div style={{fontSize:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(34,197,94,0.1)",borderRadius:10}}>{SPORT_EMOJI[s.type]||"⚡"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600}}>{s.type}</div>
              <div style={{fontSize:11,color:"#8B8578"}}>{s.duration}dk {s.distance>0&&`· ${s.distance}km`} · {s.calories||calcSportCal(s.type,s.duration)} kcal</div>
            </div>
            <button onClick={()=>delSport(s.id)} style={delBtnStyle} aria-label="Delete">✕</button>
          </div>
        ))}
      </div>

      {/* ── Haftalık Özet ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#8B8578",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("thisWeek")}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {[
            {icon:"⏱",val:`${tMin} ${T("locale")==="tr-TR"?"dk":"min"}`,label:T("sportDuration"),color:"#185FA5"},
            {icon:"▸",val:`${burnedCal}`,label:T("burnedKcal"),color:"#D85A30"},
            {icon:"―",val:`${tDist.toFixed(1)} km`,label:T("distanceLabel"),color:"#1D9E75"},
            {icon:"▲",val:wk.length,label:T("workout"),color:"#D85A30"},
          ].map((s,i)=>(
            <div key={i} style={{...cardStyle,padding:"12px",borderLeft:`3px solid ${s.color}`,boxShadow:`0 0 12px ${s.color}15`}}>
              <div style={{fontSize:10,color:"#8B8578"}}>{s.icon} {s.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color,marginTop:3}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ YEMEK EKLEME MODAL ═══ */}
      <Modal open={foodModal} onClose={()=>{setFoodModal(false);setFoodSearch("");setAiResult(null);}} title={T("addMealTitle")}>
        <div style={{marginBottom:12}}>
          {/* AI Photo Button */}
          {hasAI&&(
            <div style={{marginBottom:12}}>
              <button onClick={()=>photoRef.current?.click()} disabled={analyzing} style={{
                width:"100%",padding:"14px",borderRadius:12,fontSize:14,fontWeight:600,cursor:"pointer",
                background:analyzing?"#F5F0E8":"#F5F0E8",
                borderLeft:"3px solid #1D9E75",border:"none",borderLeft:"3px solid #1D9E75",
                borderRadius:"0 12px 12px 0",
                color:analyzing?"#8B8578":"#1D9E75",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
              }}>
                <span style={{fontSize:20}}>{analyzing?"⏳":"📷"}</span>
                {analyzing?T("analyzing"):"Fotoğrafla Kalori Bul"}
              </button>
              <input ref={photoRef} type="file" accept="image/*" capture="environment"
                onChange={e=>{if(e.target.files?.[0])analyzePhoto(e.target.files[0]);e.target.value="";}}
                style={{display:"none"}}/>
            </div>
          )}
          {/* AI Result inside modal */}
          {aiResult&&!aiResult.error&&(
            <div style={{background:"rgba(29,158,117,0.06)",borderLeft:"3px solid #1D9E75",borderRadius:"0 12px 12px 0",padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:13,fontWeight:700,color:"#1D9E75"}}>AI Analiz Sonucu</span>
                <span style={{fontSize:14,fontWeight:800,color:"#D85A30"}}>{aiResult.total} kcal</span>
              </div>
              {aiResult.items.map((item,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
                  <span style={{color:"#5F5E5A"}}>{item.name}</span>
                  <span style={{fontWeight:600,color:"#D85A30"}}>{item.calories} kcal</span>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <button onClick={saveAiResult} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:"#1D9E75",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer"}}>✓ Hepsini Kaydet</button>
                <button onClick={()=>setAiResult(null)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid rgba(0,0,0,0.08)",background:"#F5F0E8",color:"#D85A30",fontSize:13,fontWeight:600,cursor:"pointer"}}>✕ İptal</button>
              </div>
            </div>
          )}
          {aiResult?.error&&(
            <div style={{background:"rgba(216,90,48,0.06)",borderLeft:"3px solid #D85A30",borderRadius:"0 12px 12px 0",padding:14,marginBottom:12}}>
              <span style={{fontSize:13,color:"#D85A30"}}>{aiResult.error}</span>
            </div>
          )}
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {mealGroups.map(m=>(
              <button key={m} onClick={()=>setFoodForm({...foodForm,meal:m})} style={{
                background:foodForm.meal===m?"rgba(24,95,165,0.12)":"#F5F0E8",
                color:foodForm.meal===m?"#185FA5":"#aaa",
                border:foodForm.meal===m?"1px solid rgba(24,95,165,0.2)":"1px solid rgba(0,0,0,0.06)",
                padding:"7px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{m}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("searchFood")} value={foodSearch||foodForm.name}
              onChange={e=>{
                const v=e.target.value;
                setFoodSearch(v);
                const exactMatch = allFoodDB[v];
                setFoodForm({...foodForm,name:v,calories:exactMatch?String(exactMatch):""});
              }}/>
            <VoiceMic onResult={(t)=>{setFoodSearch(t);const m=allFoodDB[t];setFoodForm({...foodForm,name:t,calories:m?String(m):""});}} color="#F59E0B"/>
          </div>
          <div style={{height:10}}/>
          {(foodSearch||!foodForm.name)&&(
            <div style={{maxHeight:180,overflow:"auto",marginBottom:10}}>
              {!foodSearch&&Object.keys(myFoods).length>0&&(
                <div style={{fontSize:10,color:"#8B8578",padding:"4px 8px",fontWeight:700}}>⭐ {T("myFoodsLabel")}</div>
              )}
              {filteredFoods.map(([name,cal,source])=>(
                <div key={name} onClick={()=>selectCommonFood(name,cal)} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",cursor:"pointer",
                  borderRadius:8,background:"#FFFFFF",marginBottom:2,
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {(source==="my"||myFoods[name])&&<span style={{fontSize:10,color:"#BA7517"}}>⭐</span>}
                    <span style={{fontSize:13}}>{name}</span>
                  </div>
                  <span style={{fontSize:12,color:"#D85A30",fontWeight:600}}>{cal} kcal</span>
                </div>
              ))}
              {noResults&&(
                <div style={{textAlign:"center",padding:12}}>
                  <p style={{fontSize:12,color:"#8B8578",margin:"0 0 8px"}}>"{foodSearch}" bulunamadı</p>
                  {hasAI?(
                    <button onClick={()=>askAiCalorie(foodSearch)} disabled={aiLookup} style={{
                      background:"rgba(34,197,94,0.15)",color:"#1D9E75",border:"1px solid rgba(34,197,94,0.3)",
                      padding:"8px 16px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                    }}>{aiLookup?`◌ ${T("analyzing")}`:` ◈ ${T("askAI")}`}</button>
                  ):(
                    <p style={{fontSize:11,color:"#8B8578"}}>Kaloriyi elle gir veya Ayarlar'dan AI aç</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,flex:2}} placeholder={T("foodName")} value={foodForm.name} onChange={e=>setFoodForm({...foodForm,name:e.target.value})}/>
            <div style={{flex:1,position:"relative"}}>
              <input style={{...inp,paddingRight:hasAI?36:14}} type="number" placeholder={T("kcalUnit")} value={foodForm.calories} onChange={e=>setFoodForm({...foodForm,calories:e.target.value})}/>
              {hasAI&&foodForm.name&&!foodForm.calories&&(
                <button onClick={()=>askAiCalorie(foodForm.name)} disabled={aiLookup} style={{
                  position:"absolute",right:8,top:8,background:"none",border:"none",
                  fontSize:16,cursor:"pointer",opacity:aiLookup?.4:.8,
                }} title="AI'a sor">{aiLookup?"◌":"◈"}</button>
              )}
            </div>
          </div>
          {foodForm.name&&foodForm.calories&&!allFoodDB[foodForm.name.trim()]&&(
            <div style={{fontSize:10,color:"#8B8578",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
              <span>⭐</span> "{foodForm.name}" kişisel listene kaydedilecek
            </div>
          )}
          <input style={inp} type="date" value={foodForm.date} onChange={e=>setFoodForm({...foodForm,date:e.target.value})}/>
          <button style={{...btnPrimary,background:"linear-gradient(135deg,#D85A30,#D85A30)"}} onClick={()=>{addFood();setFoodModal(false);setFoodSearch("");}}>{T("add")}</button>
        </div>
      </Modal>

      {/* ═══ SPOR EKLEME MODAL ═══ */}
      <Modal open={modal} onClose={()=>setModal(false)} title={T("addSportTitle")}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {SPORT_TYPES.map((s,si)=>(
            <button key={s} onClick={()=>setForm({...form,type:s})} style={{
              background:form.type===s?"rgba(34,197,94,0.2)":"#F5F0E8",
              color:form.type===s?"#1D9E75":"#8B8578",
              border:form.type===s?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(0,0,0,0.06)",
              padding:"7px 14px",borderRadius:10,fontSize:13,cursor:"pointer",
              display:"flex",alignItems:"center",gap:4,
            }}><span>{SPORT_EMOJI[s]}</span>{(T("sportNames")||SPORT_TYPES)[si]}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder={T("duration")} value={form.duration} onChange={e=>setForm({...form,duration:e.target.value,calories:String(calcSportCal(form.type,e.target.value))})}/>
          <input style={{...inp,flex:1}} type="number" placeholder={T("distance")} value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder={T("calorie")+" (kcal)"} value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder={T("notesOpt")} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={{...btnPrimary,background:"linear-gradient(135deg,#1D9E75,#1D9E75)"}} onClick={()=>{addSport();setModal(false);}}>{T("add")}</button>
      </Modal>
    </div>
  );
}



/* ═══════════ NEWS ROOM ═══════════ */
