/* ── Shared Styles ── */
export const inp = {
  width:"100%",
  background:"#2A2A35",
  border:"1px solid rgba(255,255,255,0.05)",
  borderRadius:12,padding:"12px 14px",color:"#F9FAFB",fontSize:15,
  marginBottom:10,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",
};
export const btnPrimary = {
  width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",
  color:"#fff",border:"none",borderRadius:12,
  padding:"14px",cursor:"pointer",fontSize:15,fontWeight:600,marginTop:4,
  boxShadow:"0 4px 20px rgba(99,102,241,0.4)",
  transition:"box-shadow .2s, transform .1s",
};
export const addBtnStyle = {
  background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,
  padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
};
export const filterBtnStyle = (active) => ({
  background: active ? "rgba(59,130,246,0.15)" : "#2A2A35",
  color: active ? "#3b82f6" : "#9CA3AF",
  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
  padding:"7px 14px",borderRadius:20,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
  fontWeight: active ? 600 : 400,
});
export const cardStyle = {
  background:"#1C1C26",
  borderRadius:16,padding:"16px",marginBottom:8,
  border:"1px solid rgba(255,255,255,0.05)",
};
/* Glow card helper: cardStyle + subtle colored accent */
export const glowCard = (color) => ({
  ...cardStyle,
  border:`1px solid ${color}20`,
});
export const delBtnStyle = {
  background:"#2A2A35",
  border:"1px solid rgba(255,255,255,0.05)",
  color:"#9CA3AF",fontSize:14,
  cursor:"pointer",padding:0,width:32,height:32,borderRadius:8,
  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
};
export const sectionHeader = {
  display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
};
export const checkBtnStyle = (done) => ({
  width:28,height:28,borderRadius:8,border:`2px solid ${done?"#22c55e":"rgba(255,255,255,0.15)"}`,
  background:done?"#22c55e":"transparent",color:"#fff",cursor:"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
  flexShrink:0,padding:0,transition:"all .2s",
  animation:done?"checkPop .3s ease":undefined,
});
