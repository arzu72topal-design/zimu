import { useState, useRef, useCallback } from "react";

export const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const hasSpeech = !!SpeechRecognition;

export function useSpeech(lang = "tr-TR") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  const start = useCallback((onResult, onEnd) => {
    if (!hasSpeech || listening) return;
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    recRef.current = rec;
    setTranscript("");
    setListening(true);

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0].isFinal) {
        onResult?.(t.trim());
      }
    };
    rec.onerror = () => { setListening(false); onEnd?.(); };
    rec.onend = () => { setListening(false); onEnd?.(); };
    rec.start();
  }, [lang, listening]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, start, stop, supported: hasSpeech };
}

