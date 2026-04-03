import { useState, useCallback } from "react";
import { useSpeech, hasSpeech } from "../hooks/useSpeech";

export function VoiceMic({ onResult, size = 32, color = "#3b82f6" }) {
  const { listening, start, stop, supported } = useSpeech();
  if (!supported) return null;

  const handleClick = () => {
    if (listening) { stop(); return; }
    start((text) => { onResult?.(text); });
  };

  return (
    <button onClick={handleClick} style={{
      width:size,height:size,borderRadius:size/2,
      background:listening ? "rgba(239,68,68,0.2)" : "#2A2A35",
      border:`1px solid ${listening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.05)"}`,
      color:listening ? "#ef4444" : color,
      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,padding:0,
      animation:listening ? "pulse 1s ease-in-out infinite" : "none",
      transition:"all .2s",
    }} title={listening ? "Dinleniyor..." : "Sesli giriş"} aria-label={listening ? "Stop listening" : "Voice input"}>
      <svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none">
        {listening ? (
          <>
            <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" opacity=".3"/>
            <rect x="9" y="8" width="6" height="8" rx="1" fill="currentColor"/>
          </>
        ) : (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        )}
      </svg>
    </button>
  );
}

