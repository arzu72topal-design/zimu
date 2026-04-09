/* ── Shared Styles — Warm Light Theme ── */
export const inp = {
  width:"100%",
  background:"#F5F0E8",
  border:"1px solid rgba(0,0,0,0.06)",
  borderRadius:12,padding:"12px 14px",color:"#2C2A26",fontSize:15,
  marginBottom:10,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",
};
export const btnPrimary = {
  width:"100%",background:"linear-gradient(135deg,#185FA5,#534AB7)",
  color:"#fff",border:"none",borderRadius:12,
  padding:"14px",cursor:"pointer",fontSize:15,fontWeight:600,marginTop:4,
  boxShadow:"0 4px 16px rgba(24,95,165,0.2)",
  transition:"box-shadow .2s, transform .1s",
};
export const addBtnStyle = {
  background:"#185FA5",color:"#fff",border:"none",borderRadius:10,
  padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
};
export const filterBtnStyle = (active) => ({
  background: active ? "#185FA5" : "#F5F0E8",
  color: active ? "#fff" : "#5F5E5A",
  border: active ? "1px solid #185FA5" : "1px solid rgba(0,0,0,0.06)",
  padding:"7px 14px",borderRadius:20,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
  fontWeight: active ? 600 : 400,
});
export const cardStyle = {
  background:"#FFFFFF",
  borderRadius:16,padding:"16px",marginBottom:8,
  border:"1px solid rgba(0,0,0,0.05)",
};
export const glowCard = (color) => ({
  ...cardStyle,
  borderLeft:`3px solid ${color}`,
  borderRadius:"0 16px 16px 0",
});
export const delBtnStyle = {
  background:"#F5F0E8",
  border:"1px solid rgba(0,0,0,0.06)",
  color:"#8B8578",fontSize:14,
  cursor:"pointer",padding:0,width:32,height:32,borderRadius:8,
  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
};
export const sectionHeader = {
  display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
};
export const checkBtnStyle = (done) => ({
  width:28,height:28,borderRadius:8,border:`2px solid ${done?"#1D9E75":"rgba(0,0,0,0.12)"}`,
  background:done?"#1D9E75":"transparent",color:"#fff",cursor:"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
  flexShrink:0,padding:0,transition:"all .2s",
  animation:done?"checkPop .3s ease":undefined,
});
