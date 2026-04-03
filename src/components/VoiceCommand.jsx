import { useState } from "react";
import { useSpeech } from "../hooks/useSpeech";
import { i18n } from "../i18n";
import { today, uid, COMMON_FOODS, SPORT_TYPES, calcSportCal } from "../constants";

export function VoiceCommand({ data, update, goTo, showToast }) {
  const { listening, transcript, start, stop, supported } = useSpeech();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);

  if (!supported) return null;

  const parseCommand = (text) => {
    const t = text.toLowerCase().trim();

    // Görev ekleme
    if (t.startsWith("görev ekle") || t.startsWith("görev:") || t.startsWith("task")) {
      const title = text.replace(/^(görev ekle[: ]*|görev[: ]*|task[: ]*)/i, "").trim();
      if (title) {
        const tasks = [...data.tasks, { id: uid(), title, priority: "medium", done: false, dueDate: "", category: "", description: "", createdAt: today() }];
        update({ ...data, tasks });
        return { type: "success", msg: `Görev eklendi: "${title}"` };
      }
    }

    // Not ekleme
    if (t.startsWith("not ekle") || t.startsWith("not:") || t.startsWith("note")) {
      const title = text.replace(/^(not ekle[: ]*|not[: ]*|note[: ]*)/i, "").trim();
      if (title) {
        const notes = [{ id: uid(), title, content: "", color: "#3b82f6", createdAt: today(), updatedAt: today() }, ...data.notes];
        update({ ...data, notes });
        return { type: "success", msg: `Not eklendi: "${title}"` };
      }
    }

    // Yemek ekleme — "yemek ekle: pilav 200 kalori" veya "yemek: çay 30"
    if (t.startsWith("yemek ekle") || t.startsWith("yemek:") || t.startsWith("food")) {
      const raw = text.replace(/^(yemek ekle[: ]*|yemek[: ]*|food[: ]*)/i, "").trim();
      const calMatch = raw.match(/(\d+)\s*(kalori|kcal|cal)?/i);
      const cal = calMatch ? parseInt(calMatch[1]) : 0;
      const name = raw.replace(/\d+\s*(kalori|kcal|cal)?/i, "").trim() || raw;
      if (name) {
        const foods = [...(data.foods || []), { id: uid(), name, calories: cal || 100, meal: "Öğle", date: today() }];
        update({ ...data, foods });
        return { type: "success", msg: `Yemek eklendi: "${name}" ${cal || 100} kcal` };
      }
    }

    // Spor ekleme — "spor ekle: 30 dakika koşu"
    if (t.startsWith("spor ekle") || t.startsWith("spor:") || t.startsWith("sport")) {
      const raw = text.replace(/^(spor ekle[: ]*|spor[: ]*|sport[: ]*)/i, "").trim();
      const durMatch = raw.match(/(\d+)\s*(dk|dakika|min)?/i);
      const duration = durMatch ? parseInt(durMatch[1]) : 30;
      const typeMatch = raw.match(/(koşu|yüzme|bisiklet|yoga|ağırlık|yürüyüş)/i);
      const type = typeMatch ? typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1) : "Diğer";
      const cal = calcSportCal(type, duration);
      const sports = [...data.sports, { id: uid(), type, duration, distance: 0, calories: cal, date: today(), notes: "" }];
      update({ ...data, sports });
      return { type: "success", msg: `Spor eklendi: ${type} ${duration}dk (${cal} kcal)` };
    }

    // Etkinlik ekleme — "etkinlik ekle: yarın toplantı"
    if (t.startsWith("etkinlik ekle") || t.startsWith("etkinlik:") || t.startsWith("event")) {
      const title = text.replace(/^(etkinlik ekle[: ]*|etkinlik[: ]*|event[: ]*)/i, "").trim();
      if (title) {
        const events = [...data.events, { id: uid(), title, date: today(), time: "", color: "#8B5CF6", description: "", recurring: "none" }];
        update({ ...data, events });
        return { type: "success", msg: `Etkinlik eklendi: "${title}"` };
      }
    }

    // Sayfa navigasyonu
    if (t.includes("görevler") || t.includes("tasks")) { goTo("tasks"); return { type: "nav", msg: "Görevler'e gidiliyor" }; }
    if (t.includes("takvim") || t.includes("calendar")) { goTo("tasks", "calendar"); return { type: "nav", msg: "Takvim'e gidiliyor" }; }
    if (t.includes("notlar")) { goTo("tasks", "notes"); return { type: "nav", msg: "Notlar'a gidiliyor" }; }
    if (t.includes("sağlık") || t.includes("yemek") || t.includes("spor")) { goTo("lifestyle", "healthcoach"); return { type: "nav", msg: "Sağlık Koçu'na gidiliyor" }; }
    if (t.includes("stilim") || t.includes("kıyafet")) { goTo("lifestyle", "clothes"); return { type: "nav", msg: "Kıyafetlerim'e gidiliyor" }; }
    if (t.includes("haber")) { goTo("lifestyle", "news"); return { type: "nav", msg: "Haberler'e gidiliyor" }; }
    if (t.includes("müzik")) { goTo("lifestyle", "music"); return { type: "nav", msg: "Müziklerim'e gidiliyor" }; }
    if (t.includes("ayarlar")) { goTo("settings"); return { type: "nav", msg: "Ayarlar'a gidiliyor" }; }

    return { type: "unknown", msg: `Anlaşılamadı: "${text}"` };
  };

  const handleStart = () => {
    setResult(null);
    setOpen(true);
    start((text) => {
      const r = parseCommand(text);
      setResult(r);
      if (r.type === "success") showToast?.(r.msg);
      setTimeout(() => setOpen(false), r.type === "success" ? 1500 : 3000);
    }, () => {
      // onEnd — listening bitti ama sonuç gelmezse
    });
  };

  return (
    <>
      {/* FAB mikrofon butonu */}
      <button className="touch-card" onClick={open && listening ? stop : handleStart} aria-label="Voice command" style={{
        position:"fixed",left:20,bottom:100,
        width:52,height:52,borderRadius:"50%",
        background:listening ? "#ef4444" : "linear-gradient(135deg,#3b82f6,#6366f1)",
        color:"#fff",border:"none",
        fontSize:22,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:listening ? "0 0 0 8px rgba(239,68,68,0.2), 0 4px 20px rgba(239,68,68,0.4)" : "0 4px 20px rgba(59,130,246,0.4)",
        zIndex:900,
        animation:listening ? "pulse 1s ease-in-out infinite" : "none",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" stroke="#fff" strokeWidth="1.5" fill={listening ? "rgba(255,255,255,0.3)" : "none"}/>
          <path d="M5 11a7 7 0 0014 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dinleme overlay */}
      {open && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          zIndex:9998,gap:16,padding:40,
          animation:"modalOverlayIn .2s ease both",
        }} onClick={() => { stop(); setOpen(false); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#1C1C26",borderRadius:20,padding:"28px 24px",
            maxWidth:340,width:"100%",textAlign:"center",
            border:"1px solid rgba(255,255,255,0.05)",
            animation:"modalSlideUp .3s cubic-bezier(.22,1,.36,1) both",
          }}>
            {/* Animasyonlu dalga */}
            {listening && !result && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:16,height:40}}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    width:4,borderRadius:2,background:"#3b82f6",
                    animation:`voiceWave .8s ease-in-out ${i*0.1}s infinite alternate`,
                  }}/>
                ))}
              </div>
            )}

            {/* Durum */}
            {listening && !result && (
              <>
                <div style={{fontSize:16,fontWeight:600,color:"#F9FAFB",marginBottom:6}}>Dinliyorum...</div>
                <div style={{fontSize:13,color:"#9CA3AF",marginBottom:transcript ? 12 : 0}}>
                  {transcript || "Konuşmaya başlayın"}
                </div>
                {transcript && (
                  <div style={{background:"#2A2A35",borderRadius:10,padding:"10px 14px",fontSize:14,color:"#F9FAFB",fontStyle:"italic"}}>
                    "{transcript}"
                  </div>
                )}
              </>
            )}

            {/* Sonuç */}
            {result && (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{
                  width:48,height:48,borderRadius:"50%",
                  background:result.type === "success" ? "rgba(16,185,129,0.15)" : result.type === "nav" ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {result.type === "success" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : result.type === "nav" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                  )}
                </div>
                <div style={{fontSize:14,fontWeight:600,color:"#F9FAFB"}}>{result.msg}</div>
                {result.type === "unknown" && (
                  <div style={{fontSize:12,color:"#9CA3AF",marginTop:4,lineHeight:1.4}}>
                    Komutlar: "görev ekle: ...", "not ekle: ...", "yemek ekle: ...", "spor ekle: ...", "etkinlik ekle: ..."
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
