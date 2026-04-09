import { useState } from "react";
import { i18n, TRANSLATIONS } from "../i18n";
import { signInWithGoogle, signInWithEmail, registerWithEmail } from "../firebase.js";
import NebulaBackground, { NEBULA_KEYFRAMES } from "./NebulaBackground";
import { inp, btnPrimary } from "../styles";

export default function LoginScreen({ onLogin }) {
  // Login ekranında data yok, localStorage'dan dil oku
  const loginLang = (() => { try { const d = JSON.parse(localStorage.getItem("zimu-data")||"{}"); return d?.settings?.language || "tr"; } catch { return "tr"; } })();
  const T = (key) => (TRANSLATIONS[loginLang] || TRANSLATIONS.tr)[key] || TRANSLATIONS.tr[key] || key;
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { user, error } = await signInWithGoogle();
    if (error) setError(error);
    setLoading(false);
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setError(T("emailRequired")); return; }
    setLoading(true); setError("");
    const fn = mode === "register" ? registerWithEmail : signInWithEmail;
    const { user, error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const handleSkip = () => { onLogin(null); };

  const glassInp = {
    width:"100%",
    background:"#F5F0E8",
    backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
    border:"1px solid rgba(0,0,0,0.08)",
    borderRadius:14,padding:"13px 16px",color:"#2C2A26",fontSize:15,
    marginBottom:10,outline:"none",boxSizing:"border-box",
    transition:"border-color .2s",
  };

  return (
    <NebulaBackground>
      <style>{NEBULA_KEYFRAMES}</style>
      <div style={{
        width:"100%",maxWidth:380,margin:"0 auto",padding:"24px 20px",
        animation:"fadeInUp .7s ease both",
      }}>
        {/* Title */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{
            fontSize:62,fontWeight:900,letterSpacing:-3,lineHeight:1,
            background:"linear-gradient(135deg,#185FA5 0%,#534AB7 40%,#1D9E75 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"zimuGlow 4s ease-in-out infinite",
            display:"inline-block",
          }}>Zimu</div>

          {/* Decorative line */}
          <div style={{
            height:1,margin:"14px auto 16px",
            background:"linear-gradient(90deg,transparent,rgba(24,95,165,0.3),transparent)",
            animation:"lineExpand 1s ease .3s both",
          }}/>

          <div style={{fontSize:15,fontStyle:"italic",opacity:.7,lineHeight:1.7,letterSpacing:.3}}>
            Kendi destanını yaz.
          </div>
          <div style={{fontSize:13,fontStyle:"italic",color:"#8B8578",marginTop:2,letterSpacing:.2}}>
            Write your own epic.
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background:"#FFFFFF",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          border:"1px solid rgba(0,0,0,0.06)",
          borderRadius:24,padding:"26px 22px",
          boxShadow:"0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(0,0,0,0.02)",
          animation:"glassIn .8s ease .2s both",
        }}>
          {error && (
            <div style={{background:"rgba(216,90,48,0.1)",border:"1px solid rgba(216,90,48,0.25)",
              borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#D85A30",textAlign:"center"}}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:14,
            border:"1px solid rgba(24,95,165,0.2)",
            background:"rgba(24,95,165,0.06)",
            color:"#2C2A26",fontSize:15,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18,
            opacity:loading?.6:1,transition:"all .2s",
            backdropFilter:"blur(8px)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {T("googleLogin")}
          </button>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{flex:1,height:1,background:"#F5F0E8"}}/>
            <span style={{fontSize:12,color:"#8B8578",letterSpacing:.5}}>{T("orDivider")}</span>
            <div style={{flex:1,height:1,background:"#F5F0E8"}}/>
          </div>

          <input type="email" placeholder={T("emailPlaceholder")} value={email}
            onChange={e=>setEmail(e.target.value)}
            style={glassInp} />
          <input type="password" placeholder={T("passwordPlaceholder")} value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleEmail()}
            style={glassInp} />

          <button onClick={handleEmail} disabled={loading} style={{
            width:"100%",
            background:"linear-gradient(135deg,#185FA5,#534AB7)",
            color:"#fff",border:"none",borderRadius:14,
            padding:"14px",cursor:"pointer",fontSize:15,fontWeight:700,marginTop:4,
            boxShadow:"0 4px 24px rgba(24,95,165,0.2)",
            opacity:loading?.6:1,transition:"all .2s",letterSpacing:.3,
          }}>
            {loading ? T("waitLogin") : mode === "register" ? T("registerTitle") : T("loginTitle")}
          </button>

          <div style={{textAlign:"center",marginTop:16}}>
            <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{
              background:"none",border:"none",color:"#185FA5",fontSize:13,cursor:"pointer",opacity:.8,
            }}>
              {mode === "login" ? T("noAccount") : T("hasAccount")}
            </button>
          </div>
        </div>

        {/* Skip */}
        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={handleSkip} style={{
            background:"none",border:"none",color:"#8B8578",fontSize:12,cursor:"pointer",
          }}>
            {T("skipLogin")}
          </button>
          <div style={{fontSize:10,opacity:.25,marginTop:4}}>{T("localOnly")}</div>
        </div>
      </div>
    </NebulaBackground>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
