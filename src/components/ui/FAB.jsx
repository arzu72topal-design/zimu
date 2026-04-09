export function FAB({ onClick, color="#185FA5", label="Add" }) {
  return (
    <button
      className="touch-card"
      onClick={onClick}
      aria-label={label}
      role="button"
      style={{
        position:"fixed",right:20,bottom:100,
        width:56,height:56,borderRadius:"50%",
        background:color,color:"#fff",border:"2px solid #FFFFFF",
        fontSize:28,fontWeight:300,lineHeight:1,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 4px 16px ${color}40`,
        zIndex:900,
      }}
    >+</button>
  );
}
