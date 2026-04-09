export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} role="presentation" style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.3)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:9999,
      padding:0,
      animation:"modalOverlayIn .2s ease both",
    }}>
      <div onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} style={{
        background:"#FFFFFF",
        backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        width:"100%",maxWidth:480,
        maxHeight:"85vh",
        borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column",
        animation:"modalSlideUp .3s cubic-bezier(.22,1,.36,1) both",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px 20px",borderBottom:"1px solid rgba(0,0,0,0.06)",
          flexShrink:0,
        }}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#2C2A26"}}>{title}</h3>
          <button className="back-btn" onClick={onClose} aria-label="Close" style={{width:32,height:32,fontSize:14}}>✕</button>
        </div>
        <div style={{
          padding:"16px 20px calc(80px + env(safe-area-inset-bottom, 20px))",
          overflow:"auto",
          WebkitOverflowScrolling:"touch",
          flex:1,
        }}>{children}</div>
      </div>
    </div>
  );
}
