export function FAB({ onClick, color="#3b82f6", label="Add" }) {
  return (
    <button
      className="touch-card"
      onClick={onClick}
      aria-label={label}
      role="button"
      style={{
        position:"fixed",right:20,bottom:100,
        width:56,height:56,borderRadius:"50%",
        background:`linear-gradient(135deg,${color}dd,${color}88)`,color:"#fff",border:`1px solid ${color}55`,
        fontSize:28,fontWeight:300,lineHeight:1,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 0 1px ${color}30, 0 4px 24px ${color}66, 0 0 50px ${color}33`,
        zIndex:900,
      }}
    >+</button>
  );
}
