export function StickyHeader({ children }) {
  return (
    <div style={{
      position:"sticky",top:0,zIndex:50,
      background:"rgba(245,240,232,0.95)",
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      marginLeft:-20,marginRight:-20,
      padding:"14px 20px 12px",
      borderBottom:"1px solid rgba(0,0,0,0.06)",
      marginBottom:16,
    }}>
      {children}
    </div>
  );
}
