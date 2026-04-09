export function GroupLabel({ label, count, color }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:6,
      fontSize:11,fontWeight:700,color:"#8B8578",
      textTransform:"uppercase",letterSpacing:".07em",
      marginBottom:8,marginTop:4,
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
      {count != null && <span style={{opacity:.6}}>({count})</span>}
    </div>
  );
}
