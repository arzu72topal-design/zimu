/* ── Warm light background for splash + login ── */
export const NEBULA_STARS = Array.from({length:20},(_,i)=>({
  id:i,
  size: i%5===0?4:i%3===0?3:2,
  color: i%3===0?"#185FA5":i%3===1?"#1D9E75":"#BA7517",
  left: 4+((i*37)%92),
  top: 3+((i*53)%94),
  dur: 3+((i*17)%30)/10,
  delay: ((i*23)%30)/10,
  twinkle: i%4===0,
}));

export const NEBULA_KEYFRAMES = `
  @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes starFloat {
    0%,100%{transform:translateY(0) scale(1);opacity:.25}
    50%{transform:translateY(-6px) scale(1.2);opacity:.5}
  }
  @keyframes starTwinkle {
    0%,100%{opacity:.15;transform:scale(.8)}
    50%{opacity:.45;transform:scale(1.3)}
  }
  @keyframes nebulaOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-18px) scale(1.08)} }
  @keyframes nebulaOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,22px) scale(1.05)} }
  @keyframes nebulaOrb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,16px) scale(1.06)} }
  @keyframes zimuGlow  { 0%,100%{filter:drop-shadow(0 0 12px rgba(24,95,165,.2))} 50%{filter:drop-shadow(0 0 24px rgba(24,95,165,.4))} }
  @keyframes lineExpand { from{width:0;opacity:0} to{width:100%;opacity:1} }
  @keyframes shimmer   { 0%,100%{opacity:.45} 50%{opacity:.9} }
  @keyframes tapBlink  { 0%,100%{opacity:.25} 50%{opacity:.55} }
  @keyframes glassIn   { from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;

export default function NebulaBackground({ children, style }) {
  return (
    <div style={{
      minHeight:"100dvh", background:"#F5F0E8",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#2C2A26", fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      position:"relative", overflow:"hidden", ...style,
    }}>
      {/* Soft orbs */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:420,height:420,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(24,95,165,0.08) 0%,transparent 70%)",
          top:"-120px",left:"-80px",animation:"nebulaOrb1 14s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:340,height:340,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(29,158,117,0.06) 0%,transparent 70%)",
          bottom:"5%",right:"-60px",animation:"nebulaOrb2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(186,117,23,0.06) 0%,transparent 70%)",
          top:"40%",left:"50%",animation:"nebulaOrb3 22s ease-in-out infinite"}}/>
      </div>
      {/* Subtle dots */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        {NEBULA_STARS.map(s=>(
          <div key={s.id} style={{
            position:"absolute",
            width:s.size,height:s.size,borderRadius:"50%",
            background:s.color,
            opacity:0.2,
            left:`${s.left}%`,top:`${s.top}%`,
            animation:`${s.twinkle?"starTwinkle":"starFloat"} ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}/>
        ))}
      </div>
      {/* Content */}
      <div style={{position:"relative",zIndex:1,width:"100%"}}>
        {children}
      </div>
    </div>
  );
}
