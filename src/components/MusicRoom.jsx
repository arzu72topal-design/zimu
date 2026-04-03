import { useState, useEffect, useRef, useCallback } from "react";
import { i18n, roomLabel } from "../i18n";
import { uid, today } from "../constants";
import { Modal } from "./ui/Modal";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, inp, btnPrimary, filterBtnStyle, addBtnStyle, delBtnStyle } from "../styles";

export default function MusicRoom({ room, items, onBack, onAdd, onDel, data }) {
  const T = (key) => i18n(key, data);
  const [tab, setTab] = useState("collection"); // collection | search | link | charts
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [preview, setPreview] = useState(null);
  const [linkInput, setLinkInput] = useState("");
  const [linkFetching, setLinkFetching] = useState(false);
  const [linkPreview, setLinkPreview] = useState(null);
  const audioRef = useRef(null);

  // Charts state
  const [chartSource, setChartSource] = useState("tr"); // tr | global | genre
  const [chartGenre, setChartGenre] = useState("pop");
  const [chartTracks, setChartTracks] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartLoaded, setChartLoaded] = useState("");

  const GENRE_IDS = {pop:132,hiphop:116,rock:152,elektronik:106,rnb:165,latin:195,kpop:113};
  const GENRE_LABELS = {pop:"Pop",hiphop:"Hip-Hop",rock:"Rock",elektronik:"Elektronik",rnb:"R&B",latin:"Latin",kpop:"K-Pop"};

  const fetchCharts = async (source, genre) => {
    const key = source+genre;
    if(chartLoaded===key && chartTracks.length>0) return;
    setChartLoading(true);
    setChartTracks([]);
    try {
      if(source==="tr") {
        // iTunes Turkey — direct fetch, no CORS needed
        const json = await fetch("https://itunes.apple.com/tr/rss/topsongs/limit=25/json")
          .then(r=>r.json());
        setChartTracks((json.feed?.entry||[]).map((e,i)=>{
          const links = Array.isArray(e.link) ? e.link : (e.link ? [e.link] : []);
          const pageLink = links.find(l=>l.attributes?.type==="text/html")?.attributes?.href || links[0]?.attributes?.href || "";
          const audioLink = links.find(l=>l.attributes?.rel==="enclosure"&&l.attributes?.href)?.attributes?.href || "";
          return {
            id:"itunes_"+i,
            title:e["im:name"]?.label||"",
            artist:e["im:artist"]?.label||"",
            albumArt:e["im:image"]?.[2]?.label||e["im:image"]?.[0]?.label||"",
            link:pageLink,
            preview:audioLink,
            source:"itunes",
            rank:i+1,
          };
        }));
      } else {
        // Deezer via multi-proxy fallback
        const deezerUrl = source==="global"
          ? "https://api.deezer.com/chart/0/tracks?limit=25"
          : `https://api.deezer.com/chart/${GENRE_IDS[genre]||132}/tracks?limit=20`;
        const json = await proxyFetch(deezerUrl);
        const data = (typeof json === "string" ? JSON.parse(json) : json);
        setChartTracks((data.data||[]).map((t,i)=>({
          id:t.id, title:t.title,
          artist:t.artist?.name||"",
          albumArt:t.album?.cover_medium||"",
          link:t.link||"",
          preview:t.preview||"",
          source:"deezer", rank:i+1,
        })));
      }
      setChartLoaded(key);
    } catch(e) {
      console.error("Chart fetch error:", e);
    }
    setChartLoading(false);
  };

  useEffect(()=>{
    if(tab==="charts") fetchCharts(chartSource, chartGenre);
  }, [tab, chartSource, chartGenre]);

  /* ── Deezer search via multi-proxy fallback ── */
  const searchMusic = async (q) => {
    if(!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=15`;
      const json = await proxyFetch(deezerUrl);
      const data = typeof json === "string" ? JSON.parse(json) : json;
      setSearchResults(data.data || []);
    } catch(e) {
      console.error("Music search error:", e);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const togglePreview = (track) => {
    if(!track.preview) return;
    if(preview?.id===track.id) {
      audioRef.current?.pause();
      setPreview(null);
    } else {
      if(audioRef.current) {
        audioRef.current.pause();
        // Ensure HTTPS for preview URLs
        const src = (track.preview||"").replace(/^http:\/\//,"https://");
        audioRef.current.src = src;
        audioRef.current.load();
        audioRef.current.play().catch(err=>{
          console.warn("Audio play failed:",err.message);
          setPreview(null);
        });
      }
      setPreview(track);
    }
  };

  const addFromDeezer = (track) => {
    onAdd({
      id: uid(),
      type: "music",
      title: track.title,
      artist: track.artist?.name || "",
      albumArt: track.album?.cover_medium || track.album?.cover || "",
      link: track.link || "",
      preview: track.preview || "",
      source: "deezer",
      createdAt: today(),
    });
  };

  /* ── Link metadata fetch ── */
  const fetchLinkMeta = async (url) => {
    if(!url.trim()) return;
    setLinkFetching(true);
    setLinkPreview(null);
    try {
      // Detect platform & extract info from URL patterns
      const meta = parseMusicLink(url);
      setLinkPreview(meta);
    } catch(e) {}
    setLinkFetching(false);
  };

  const parseMusicLink = (url) => {
    const u = url.toLowerCase();
    let platform = "Müzik";
    let icon = "♪";
    let color = "#1DB954";

    if(u.includes("spotify.com")) { platform="Spotify"; icon="●"; color="#1DB954"; }
    else if(u.includes("youtube.com")||u.includes("youtu.be")) { platform="YouTube"; icon="●"; color="#FF0000"; }
    else if(u.includes("soundcloud.com")) { platform="SoundCloud"; icon="●"; color="#FF5500"; }
    else if(u.includes("apple.com/music")||u.includes("music.apple")) { platform="Apple Music"; icon="●"; color="#FC3C44"; }
    else if(u.includes("deezer.com")) { platform="Deezer"; icon="●"; color="#A238FF"; }
    else if(u.includes("tidal.com")) { platform="Tidal"; icon="●"; color="#00FEEE"; }

    // Try to extract title from URL path
    let title = url.split("/").filter(Boolean).pop()?.replace(/-/g," ")?.replace(/\?.*/,"") || "Yeni parça";
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { url, platform, icon, color, title };
  };

  /* Spotify/YouTube embed URL çıkar */
  const getEmbedUrl = (link) => {
    if (!link) return null;
    const u = link.toLowerCase();
    // Spotify: open.spotify.com/track/XXXX → embed
    if (u.includes("spotify.com/track/")) {
      const id = link.match(/track\/([a-zA-Z0-9]+)/)?.[1];
      if (id) return { type: "spotify", url: `https://open.spotify.com/embed/track/${id}?theme=0&utm_source=generator`, height: 80 };
    }
    // Spotify playlist/album
    if (u.includes("spotify.com/playlist/") || u.includes("spotify.com/album/")) {
      const match = link.match(/(playlist|album)\/([a-zA-Z0-9]+)/);
      if (match) return { type: "spotify", url: `https://open.spotify.com/embed/${match[1]}/${match[2]}?theme=0`, height: 152 };
    }
    // YouTube: youtube.com/watch?v=XXXX veya youtu.be/XXXX
    if (u.includes("youtube.com/watch")) {
      const id = link.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1];
      if (id) return { type: "youtube", url: `https://www.youtube.com/embed/${id}`, height: 200 };
    }
    if (u.includes("youtu.be/")) {
      const id = link.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1];
      if (id) return { type: "youtube", url: `https://www.youtube.com/embed/${id}`, height: 200 };
    }
    return null;
  };

  const [expandedEmbed, setExpandedEmbed] = useState(null);

  const addFromLink = () => {
    if(!linkPreview && !linkInput.trim()) return;
    const meta = linkPreview || parseMusicLink(linkInput);
    onAdd({
      id: uid(),
      type: "music",
      title: meta.title,
      artist: "",
      albumArt: "",
      link: linkInput || meta.url,
      preview: "",
      source: "link",
      platform: meta.platform,
      platformColor: meta.color,
      createdAt: today(),
    });
    setLinkInput("");
    setLinkPreview(null);
    setTab("collection");
  };

  const isInCollection = (deezerTrackId) => items.some(i=>i.deezerTrackId===String(deezerTrackId));

  const platformColor = (item) => {
    if(item.source==="deezer") return "#A238FF";
    return item.platformColor || "#1DB954";
  };

  const platformIcon = (item) => {
    if(item.source==="deezer") return "♪";
    const u=(item.link||"").toLowerCase();
    if(u.includes("spotify"))return "●";
    if(u.includes("youtube")||u.includes("youtu.be"))return "●";
    if(u.includes("soundcloud"))return "●";
    if(u.includes("apple"))return "●";
    return "♪";
  };

  return (
    <div>
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" onEnded={()=>setPreview(null)} onError={()=>setPreview(null)} style={{display:"none"}}/>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>
          <span style={{fontSize:22}}>♪</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{roomLabel(room,data)}</h3>
          <span style={{fontSize:12,color:"#9CA3AF"}}>{items.length} parça</span>
        </div>
        {/* Tab switcher — 4 tabs */}
        <div style={{background:"#2A2A35",borderRadius:12,padding:3,display:"flex",gap:1}}>
          {[["collection",T("musicTabMine")],["charts","Top"],["search",T("musicTabSearch")],["link","Link"]].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1,padding:"8px 2px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:tab===k?700:500,
              background:tab===k?"rgba(255,255,255,0.12)":"transparent",
              color:tab===k?"#F9FAFB":"#9CA3AF",transition:"all .2s",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {/* ── COLLECTION ── */}
      {tab==="collection"&&(
        items.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:44,marginBottom:10}}>♪</div>
            <div style={{fontSize:15,fontWeight:700,color:"#9CA3AF",marginBottom:6}}>Koleksiyonun boş</div>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:20}}>Deezer'dan ara veya link yapıştır</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>setTab("search")} style={{background:"rgba(162,56,255,0.15)",color:"#a238ff",border:"1px solid rgba(162,56,255,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>▸ Deezer'da Ara</button>
              <button onClick={()=>setTab("link")} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>▸ Link Ekle</button>
            </div>
          </div>
        ) : (
          items.map(item=>{
            const embed = getEmbedUrl(item.link);
            const isExpanded = expandedEmbed === item.id;
            return (
            <div key={item.id} style={{marginBottom:8}}>
            <div style={{
              ...cardStyle,padding:"12px 14px",marginBottom:0,
              display:"flex",alignItems:"center",gap:12,minHeight:64,
              borderRadius: isExpanded ? "16px 16px 0 0" : 16,
            }}>
              {/* Album art or placeholder */}
              <div style={{
                width:48,height:48,borderRadius:10,flexShrink:0,overflow:"hidden",
                background:item.albumArt?"#000":"rgba(162,56,255,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {item.albumArt
                  ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:22}}>♪</span>
                }
              </div>
              <div style={{flex:1,minWidth:0,cursor:item.link?"pointer":"default"}} onClick={()=>{if(item.link&&!embed&&!item.preview)window.open(item.link,"_blank","noopener");}}>
                <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                {item.artist&&<div style={{fontSize:12,color:"#9CA3AF",marginTop:2}}>{item.artist}</div>}
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  <span>{platformIcon(item)}</span>
                  <span>{item.platform||item.source||"Müzik"}</span>
                </div>
              </div>
              {/* Preview play button (Deezer tracks) */}
              {item.preview&&(
                <button onClick={()=>togglePreview(item)} style={{
                  width:36,height:36,borderRadius:"50%",
                  background:preview?.id===item.id?"rgba(162,56,255,0.9)":"rgba(255,255,255,0.05)",
                  border:"none",color:"#fff",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  {preview?.id===item.id?"⏸":"▶"}
                </button>
              )}
              {/* Embed play button (Spotify/YouTube) */}
              {embed&&!item.preview&&(
                <button onClick={()=>setExpandedEmbed(isExpanded?null:item.id)} style={{
                  width:36,height:36,borderRadius:"50%",
                  background:isExpanded?(embed.type==="spotify"?"#1DB954":"#FF0000"):"rgba(255,255,255,0.05)",
                  border:"none",color:"#fff",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  {isExpanded?"⏸":"▶"}
                </button>
              )}
              {/* Open link button (non-embeddable) */}
              {item.link&&!embed&&!item.preview&&(
                <button onClick={()=>window.open(item.link,"_blank","noopener")} style={{
                  width:36,height:36,borderRadius:"50%",
                  background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.25)",
                  color:"#3b82f6",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <button onClick={()=>onDel(item.id)} style={delBtnStyle} aria-label="Delete">✕</button>
            </div>
            {/* Embedded player (Spotify/YouTube iframe) */}
            {isExpanded&&embed&&(
              <div style={{
                background:"#1C1C26",borderRadius:"0 0 16px 16px",overflow:"hidden",
                border:"1px solid rgba(255,255,255,0.05)",borderTop:"none",
              }}>
                <iframe
                  src={embed.url}
                  width="100%"
                  height={embed.height}
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{display:"block",borderRadius:"0 0 16px 16px"}}
                />
              </div>
            )}
            </div>
          );})
        )
      )}

      {/* ── SEARCH (Deezer) ── */}
      {tab==="search"&&(
        <div>
          <input
            style={{...inp,marginBottom:12}}
            placeholder={T("searchSongs")}
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&searchMusic(searchQ)}
          />
          <button onClick={()=>searchMusic(searchQ)} style={{...btnPrimary,marginTop:0,marginBottom:16,background:"#a238ff"}}>
            {searching?"Aranıyor...":"Deezer'da Ara"}
          </button>
          {searching&&(
            <div style={{textAlign:"center",padding:20,color:"#9CA3AF",fontSize:13}}>♪ Aranıyor...</div>
          )}
          {!searching&&searchResults.length===0&&searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0",color:"#9CA3AF",fontSize:13}}>Sonuç bulunamadı</div>
          )}
          {!searching&&searchResults.length===0&&!searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>♪</div>
              <div style={{fontSize:13,color:"#9CA3AF"}}>Deezer veritabanında 90M+ parça</div>
              <div style={{fontSize:11,opacity:.25,marginTop:4}}>Arama yap → 30 sn önizleme dinle → Ekle</div>
            </div>
          )}
          {searchResults.map(track=>{
            const inColl = items.some(i=>i.link===track.link);
            return (
              <div key={track.id} style={{
                background:"#1C1C26",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
                opacity:inColl?.6:1,
              }}>
                <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.album?.cover_medium
                    ? <img src={track.album.cover_medium} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>♪</div>
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{track.artist?.name}</div>
                  {track.preview&&(
                    <div style={{fontSize:10,color:"#a238ff",marginTop:1,opacity:.7}}>▶ 30sn önizleme var</div>
                  )}
                </div>
                {track.preview&&(
                  <button onClick={()=>togglePreview(track)} style={{
                    width:34,height:34,borderRadius:"50%",flexShrink:0,
                    background:preview?.id===track.id?"#a238ff":"rgba(162,56,255,0.15)",
                    border:"1px solid rgba(162,56,255,0.3)",
                    color:preview?.id===track.id?"#fff":"#a238ff",
                    fontSize:13,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{preview?.id===track.id?"⏸":"▶"}</button>
                )}
                <button onClick={()=>{if(!inColl)addFromDeezer(track);}} style={{
                  width:34,height:34,borderRadius:"50%",flexShrink:0,
                  background:inColl?"rgba(34,197,94,0.15)":"rgba(162,56,255,0.15)",
                  border:inColl?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(162,56,255,0.3)",
                  color:inColl?"#22c55e":"#a238ff",
                  fontSize:inColl?14:18,cursor:inColl?"default":"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{inColl?"✓":"+"}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LINK ── */}
      {tab==="link"&&(
        <div>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8,lineHeight:1.5}}>
            Spotify, YouTube, SoundCloud, Apple Music veya herhangi bir müzik linkini yapıştır.
          </div>
          <input
            style={inp}
            placeholder="https://open.spotify.com/track/..."
            value={linkInput}
            onChange={e=>{setLinkInput(e.target.value);setLinkPreview(null);}}
            onBlur={()=>linkInput&&fetchLinkMeta(linkInput)}
          />
          {/* Platform icons */}
          <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
            {[
              {name:"Spotify",color:"#1DB954",icon:"●"},
              {name:"YouTube",color:"#FF0000",icon:"●"},
              {name:"SoundCloud",color:"#FF5500",icon:"●"},
              {name:"Apple Music",color:"#FC3C44",icon:"●"},
              {name:"Deezer",color:"#A238FF",icon:"●"},
            ].map(p=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:4,background:"#1C1C26",borderRadius:8,padding:"4px 10px",fontSize:11,opacity:.6}}>
                <span>{p.icon}</span><span>{p.name}</span>
              </div>
            ))}
          </div>

          {/* Link preview card */}
          {linkFetching&&<div style={{textAlign:"center",color:"#9CA3AF",fontSize:13,padding:12}}>Kontrol ediliyor...</div>}
          {linkPreview&&(
            <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontSize:11,color:"#9CA3AF",marginBottom:4}}>{linkPreview.icon} {linkPreview.platform}</div>
              <div style={{fontSize:14,fontWeight:700}}>{linkPreview.title}</div>
            </div>
          )}

          {/* Title override */}
          <input
            style={inp}
            placeholder={T("trackNameOpt")}
            value={linkPreview?.title||""}
            onChange={e=>setLinkPreview(lp=>lp?{...lp,title:e.target.value}:{title:e.target.value,url:linkInput,platform:"Müzik",color:"#9CA3AF"})}
          />

          <button onClick={addFromLink} disabled={!linkInput.trim()} style={{
            ...btnPrimary,marginTop:0,
            background:linkInput.trim()?"#3b82f6":"#333",
            opacity:linkInput.trim()?1:.5,
          }}>Koleksiyona Ekle</button>

          <div style={{marginTop:16,background:"#1C1C26",borderRadius:12,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,color:"#9CA3AF",marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Nasıl kullanılır?</div>
            <div style={{fontSize:11,color:"#9CA3AF",lineHeight:1.7}}>
              1. Spotify'dan bir parça aç → 3 nokta → "Paylaş" → "Linki kopyala"<br/>
              2. Yukarıdaki kutuya yapıştır<br/>
              3. "Koleksiyona Ekle" ye bas
            </div>
          </div>
        </div>
      )}

      {/* ── CHARTS ── */}
      {tab==="charts"&&(
        <div>
          {/* Source selector */}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {[["tr","Türkiye"],["global","Global"],["genre","Tür"]].map(([k,v])=>(
              <button key={k} onClick={()=>setChartSource(k)} style={{
                flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",
                fontSize:12,fontWeight:chartSource===k?700:500,
                background:chartSource===k?"rgba(162,56,255,0.25)":"rgba(255,255,255,0.05)",
                color:chartSource===k?"#c084fc":"#9CA3AF",
                transition:"all .2s",
              }}>{v}</button>
            ))}
          </div>

          {/* Genre picker — only when source=genre */}
          {chartSource==="genre"&&(
            <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
              {Object.entries(GENRE_LABELS).map(([k,v])=>(
                <button key={k} onClick={()=>setChartGenre(k)} style={{
                  padding:"6px 14px",borderRadius:20,border:"none",cursor:"pointer",whiteSpace:"nowrap",
                  fontSize:12,fontWeight:chartGenre===k?700:400,
                  background:chartGenre===k?"rgba(162,56,255,0.25)":"rgba(255,255,255,0.05)",
                  color:chartGenre===k?"#c084fc":"#9CA3AF",
                }}>{v}</button>
              ))}
            </div>
          )}

          {/* Source label */}
          <div style={{fontSize:11,color:"#9CA3AF",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <span>
              {chartSource==="tr"&&"● Apple Music Türkiye · Güncel Top 25"}
              {chartSource==="global"&&"● Deezer Global · Top 25 · 30sn önizleme"}
              {chartSource==="genre"&&`● Deezer ${GENRE_LABELS[chartGenre]} Listesi · 30sn önizleme`}
            </span>
          </div>

          {/* Loading */}
          {chartLoading&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8,animation:"pulse 1.5s ease-in-out infinite"}}>♪</div>
              <div style={{fontSize:13,color:"#9CA3AF"}}>Liste yükleniyor...</div>
            </div>
          )}

          {/* Track list */}
          {!chartLoading&&chartTracks.map((track,i)=>{
            const inColl = items.some(it=>(track.link&&it.link===track.link)||(track.title&&track.artist&&it.title===track.title&&it.artist===track.artist));
            return (
              <div key={track.id||i} style={{
                background:"#1C1C26",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
              }}>
                {/* Rank */}
                <div style={{
                  width:26,height:26,borderRadius:8,flexShrink:0,
                  background:i<3?"rgba(162,56,255,0.2)":"#2A2A35",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:700,
                  color:i<3?"#c084fc":"#9CA3AF",
                }}>{i+1}</div>
                {/* Album art */}
                <div style={{width:42,height:42,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.albumArt
                    ? <img src={track.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>♪</div>
                  }
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.artist}</div>
                  {track.preview&&<div style={{fontSize:10,color:"#a238ff",opacity:.7,marginTop:1}}>▶ önizleme</div>}
                </div>
                {/* Preview button */}
                {track.preview&&(
                  <button onClick={()=>togglePreview(track)} style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:preview?.id===track.id?"#a238ff":"rgba(162,56,255,0.15)",
                    border:"1px solid rgba(162,56,255,0.3)",
                    color:preview?.id===track.id?"#fff":"#a238ff",
                    fontSize:12,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>{preview?.id===track.id?"⏸":"▶"}</button>
                )}
                {/* Open link (iTunes tracks without preview) */}
                {track.link&&!track.preview&&(
                  <button onClick={()=>window.open(track.link,"_blank","noopener")} style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.25)",
                    color:"#3b82f6",fontSize:12,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
                {/* Add to collection */}
                <button onClick={()=>{
                  if(!inColl) onAdd({
                    id:uid(),type:"music",
                    title:track.title,artist:track.artist,
                    albumArt:track.albumArt,link:track.link,
                    preview:track.preview,
                    source:track.source==="itunes"?"itunes":"deezer",
                    platform:track.source==="itunes"?"Apple Music":"Deezer",
                    platformColor:track.source==="itunes"?"#FC3C44":"#A238FF",
                    createdAt:today(),
                  });
                }} style={{
                  width:32,height:32,borderRadius:"50%",flexShrink:0,
                  background:inColl?"rgba(34,197,94,0.15)":"rgba(162,56,255,0.15)",
                  border:inColl?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(162,56,255,0.3)",
                  color:inColl?"#22c55e":"#a238ff",
                  fontSize:inColl?13:18,cursor:inColl?"default":"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>{inColl?"✓":"+"}</button>
              </div>
            );
          })}

          {!chartLoading&&chartTracks.length===0&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{marginBottom:8}}><svg width="32" height="32" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="18" r="4" fill="#9CA3AF"/><path d="M10 26A13 13 0 0126 10" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity=".4"/><path d="M6 30A19 19 0 0130 6" stroke="#9CA3AF" strokeWidth="1.5" fill="none" opacity=".2"/></svg></div>
              <div style={{fontSize:13,color:"#9CA3AF"}}>Liste yüklenemedi</div>
              <div style={{fontSize:11,opacity:.25,marginTop:4}}>İnternet bağlantını kontrol et</div>
              <button onClick={()=>{setChartLoaded("");fetchCharts(chartSource,chartGenre);}} style={{
                marginTop:12,background:"rgba(162,56,255,0.15)",color:"#a238ff",
                border:"1px solid rgba(162,56,255,0.3)",borderRadius:10,
                padding:"8px 20px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>Tekrar Dene</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


/* ═══════════ BENİM STİLİM ODASI ═══════════ */
