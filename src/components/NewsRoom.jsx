import { useState, useEffect, useRef } from "react";
import { i18n } from "../i18n";
import { uid } from "../constants";
import { Modal } from "./ui/Modal";
import { StickyHeader } from "./ui/StickyHeader";
import { cardStyle, inp, btnPrimary, filterBtnStyle } from "../styles";

const NEWS_SOURCES = {
  teknoloji: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                           lang:"TR", color:"#dc2626" },
    { name:"BBC Tech",       url:"https://feeds.bbci.co.uk/news/technology/rss.xml",               lang:"EN", color:"#185FA5" },
    { name:"Ars Technica",   url:"https://feeds.arstechnica.com/arstechnica/index",                lang:"EN", color:"#D85A30" },
    { name:"Hacker News",    url:"https://hnrss.org/frontpage?count=15",                           lang:"EN", color:"#ff6600" },
  ],
  spor: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Sport",      url:"https://feeds.bbci.co.uk/sport/rss.xml",                        lang:"EN", color:"#D85A30" },
    { name:"BBC Football",   url:"https://feeds.bbci.co.uk/sport/football/rss.xml",               lang:"EN", color:"#D85A30" },
    { name:"ESPN",           url:"https://www.espn.com/espn/rss/news",                            lang:"EN", color:"#cc0000" },
  ],
  sanat: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Arts",       url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",  lang:"EN", color:"#534AB7" },
    { name:"NPR Arts",       url:"https://feeds.npr.org/1008/rss.xml",                            lang:"EN", color:"#7c3aed" },
  ],
  saglik: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Health",     url:"https://feeds.bbci.co.uk/news/health/rss.xml",                  lang:"EN", color:"#1D9E75" },
    { name:"NPR Health",     url:"https://feeds.npr.org/1128/rss.xml",                            lang:"EN", color:"#16a34a" },
    { name:"Science Daily",  url:"https://www.sciencedaily.com/rss/health_medicine.xml",          lang:"EN", color:"#0d9488" },
  ],
  ekonomi: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Business",   url:"https://feeds.bbci.co.uk/news/business/rss.xml",                lang:"EN", color:"#BA7517" },
    { name:"NPR Economy",    url:"https://feeds.npr.org/1006/rss.xml",                            lang:"EN", color:"#d97706" },
  ],
  politika: [
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                          lang:"TR", color:"#dc2626" },
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC World",      url:"https://feeds.bbci.co.uk/news/world/rss.xml",                   lang:"EN", color:"#D85A30" },
    { name:"NPR Politics",   url:"https://feeds.npr.org/1014/rss.xml",                            lang:"EN", color:"#b91c1c" },
  ],
  bilim: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"Science Daily",  url:"https://www.sciencedaily.com/rss/top/science.xml",              lang:"EN", color:"#06b6d4" },
    { name:"BBC Science",    url:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", lang:"EN", color:"#0891b2" },
    { name:"NPR Science",    url:"https://feeds.npr.org/1007/rss.xml",                            lang:"EN", color:"#0e7490" },
  ],
  dunya: [
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                          lang:"TR", color:"#dc2626" },
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC World",      url:"https://feeds.bbci.co.uk/news/world/rss.xml",                   lang:"EN", color:"#64748b" },
    { name:"NPR World",      url:"https://feeds.npr.org/1004/rss.xml",                            lang:"EN", color:"#475569" },
  ],
  sondakika: [
    { name:"T24",            url:"https://t24.com.tr/rss/haberler",                               lang:"TR", color:"#e11d48" },
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                          lang:"TR", color:"#dc2626" },
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                            lang:"TR", color:"#0284c7" },
    { name:"BBC Breaking",   url:"https://feeds.bbci.co.uk/news/rss.xml",                         lang:"EN", color:"#D85A30" },
  ],
};

/* ── Önerilen RSS Kaynakları ── */
const SUGGESTED_FEEDS = [
  { name:"T24",           url:"https://t24.com.tr/rss/haberler",           lang:"TR", color:"#e11d48", desc:"Bağımsız haber" },
  { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",      lang:"TR", color:"#dc2626", desc:"Güvenilir dünya haberleri" },
  { name:"DW Türkçe",     url:"https://rss.dw.com/xml/rss-tur-all",       lang:"TR", color:"#0284c7", desc:"Almanya ve dünya" },
  { name:"Ars Technica",  url:"https://feeds.arstechnica.com/arstechnica/index", lang:"EN", color:"#D85A30", desc:"Derinlemesine teknoloji" },
  { name:"Hacker News",   url:"https://hnrss.org/frontpage?count=15",      lang:"EN", color:"#ff6600", desc:"Startup & yazılım" },
  { name:"NPR News",      url:"https://feeds.npr.org/1001/rss.xml",        lang:"EN", color:"#2563eb", desc:"ABD ve dünya haberleri" },
  { name:"Science Daily",  url:"https://www.sciencedaily.com/rss/top/science.xml", lang:"EN", color:"#06b6d4", desc:"Günlük bilim" },
];

/* SVG ikonlar — her haber kategorisi için */
const NEWS_ICONS = {
  spor: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke={c} strokeWidth="1.5" fill="none"/>
      <path d="M18 4 C18 4 14 10 14 18 C14 26 18 32 18 32" stroke={c} strokeWidth="1.5"/>
      <path d="M4 18 C4 18 10 14 18 14 C26 14 32 18 32 18" stroke={c} strokeWidth="1.5"/>
      <path d="M6 11 C6 11 12 15 18 14 C24 13 28 8 28 8" stroke={c} strokeWidth="1" opacity=".5"/>
      <path d="M6 25 C6 25 12 21 18 22 C24 23 28 28 28 28" stroke={c} strokeWidth="1" opacity=".5"/>
    </svg>
  ),
  teknoloji: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="4" y="7" width="28" height="18" rx="2" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <path d="M12 29 L24 29" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M18 25 L18 29" stroke={c} strokeWidth="1.5"/>
      <rect x="8" y="11" width="20" height="10" rx="1" fill={c+"20"} stroke={c} strokeWidth="1" opacity=".6"/>
      <path d="M11 16 L15 13 L18 16 L22 12 L25 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  ekonomi: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M6 28 L11 18 L16 22 L21 12 L26 16 L31 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 28 L31 28" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
      <circle cx="31" cy="6" r="2.5" fill={c}/>
      <path d="M26 16 L31 6 L36 16" stroke="none"/>
    </svg>
  ),
  politika: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <ellipse cx="18" cy="18" rx="6" ry="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <line x1="5" y1="18" x2="31" y2="18" stroke={c} strokeWidth="1.5" opacity=".5"/>
      <path d="M7 11 Q18 14 29 11" stroke={c} strokeWidth="1" opacity=".4" fill="none"/>
      <path d="M7 25 Q18 22 29 25" stroke={c} strokeWidth="1" opacity=".4" fill="none"/>
    </svg>
  ),
  saglik: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M18 30 C18 30 6 22 6 14 C6 9.6 9.6 6 14 6 C16 6 18 8 18 8 C18 8 20 6 22 6 C26.4 6 30 9.6 30 14 C30 22 18 30 18 30Z" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <path d="M14 17 L18 17 L18 13 L20 13 L20 17 L24 17 L24 19 L20 19 L20 23 L18 23 L18 19 L14 19 Z" fill={c} opacity=".8"/>
    </svg>
  ),
  bilim: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="12" r="5" stroke={c} strokeWidth="1.5" fill={c+"15"}/>
      <line x1="18" y1="5" x2="18" y2="2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="24" y1="7" x2="26" y2="5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="7" x2="10" y2="5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 17 L8 28 L28 28 L24 17" stroke={c} strokeWidth="1.5" strokeLinejoin="round" fill={c+"08"}/>
      <line x1="10" y1="23" x2="26" y2="23" stroke={c} strokeWidth="1" opacity=".4"/>
      <circle cx="18" cy="12" r="2" fill={c} opacity=".6"/>
    </svg>
  ),
  sanat: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="12" stroke={c} strokeWidth="1.5" fill={c+"10"}/>
      <circle cx="13" cy="14" r="2.5" fill={c} opacity=".8"/>
      <circle cx="23" cy="14" r="2.5" fill={c} opacity=".6"/>
      <circle cx="13" cy="22" r="2.5" fill={c} opacity=".5"/>
      <circle cx="23" cy="22" r="2.5" fill={c} opacity=".7"/>
      <circle cx="18" cy="18" r="2.5" fill={c}/>
    </svg>
  ),
  dunya: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="13" stroke={c} strokeWidth="1.5" fill="none"/>
      <path d="M12 8 L14 14 L10 16 L8 22 L14 26 L16 30" stroke={c} strokeWidth="1" fill="none" opacity=".6"/>
      <path d="M24 8 L22 12 L26 16 L28 20 L24 26 L22 30" stroke={c} strokeWidth="1" fill="none" opacity=".6"/>
      <path d="M5 18 L10 16 L14 18 L18 15 L22 18 L26 16 L31 18" stroke={c} strokeWidth="1.5" fill="none" opacity=".5"/>
    </svg>
  ),
  sondakika: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M20 4 L14 18 L20 18 L16 32 L26 16 L20 16 Z" stroke={c} strokeWidth="1.5" fill={c+"20"} strokeLinejoin="round"/>
      <circle cx="18" cy="18" r="14" stroke={c} strokeWidth="1" opacity=".3" strokeDasharray="3 3"/>
    </svg>
  ),
  custom: (c) => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="5" y="5" width="26" height="26" rx="6" stroke={c} strokeWidth="1.5" fill={c+"10"}/>
      <path d="M13 13 L23 13" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 18 L23 18" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
      <path d="M13 23 L19 23" stroke={c} strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
};

const NEWS_CATS = [
  { id:"sondakika", label:"Son Dakika", color:"#e11d48", desc:"Anlık gelişmeler & flaş haberler" },
  { id:"spor",      label:"Spor",      color:"#D85A30",  desc:"Futbol, basketbol & dünya sporları" },
  { id:"teknoloji", label:"Teknoloji", color:"#185FA5",  desc:"Yapay zeka, gadget & yazılım" },
  { id:"ekonomi",   label:"Ekonomi",   color:"#BA7517",  desc:"Piyasalar, borsa & iş dünyası" },
  { id:"politika",  label:"Politika",  color:"#D85A30",  desc:"Dünya siyaseti & gündem" },
  { id:"saglik",    label:"Sağlık",    color:"#1D9E75",  desc:"Tıp, beslenme & wellness" },
  { id:"bilim",     label:"Bilim",     color:"#06b6d4",  desc:"Uzay, keşifler & araştırmalar" },
  { id:"sanat",     label:"Sanat",     color:"#534AB7",  desc:"Kültür, sanat & eğlence" },
  { id:"dunya",     label:"Dünya",     color:"#64748b",  desc:"Dünya haberleri & olaylar" },
];

/* ── NewsRoom: Category grid → drill into article list ── */
export default function NewsRoom({ room, onBack, data, update }) {
  const T = (key) => i18n(key, data);
  const CAT_LABEL = {sondakika:"catSon",spor:"catSpor",teknoloji:"catTek",ekonomi:"catEko",politika:"catPol",saglik:"catSag",bilim:"catBil",sanat:"catSan",dunya:"catDun"};
  const CAT_DESC = {sondakika:"catSonD",spor:"catSporD",teknoloji:"catTekD",ekonomi:"catEkoD",politika:"catPolD",saglik:"catSagD",bilim:"catBilD",sanat:"catSanD",dunya:"catDunD"};
  const localCats = NEWS_CATS.map(c=>({...c, label:T(CAT_LABEL[c.id])||c.label, desc:T(CAT_DESC[c.id])||c.desc}));
  const [activeCat, setActiveCat] = useState(null); // null = grid, string = category id
  const [articles, setArticles] = useState({});
  const [loading, setLoading] = useState({});
  const [loaded, setLoaded] = useState({});
  const [langFilter, setLangFilter] = useState("TR");
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [sourceTab, setSourceTab] = useState("suggested"); // "suggested" | "manual"
  const [manualUrl, setManualUrl] = useState("");
  const [manualName, setManualName] = useState("");

  const customFeeds = data?.settings?.customFeeds || [];
  const setCustomFeeds = (feeds) => {
    const s = { ...(data?.settings || {}), customFeeds: feeds };
    update({ ...data, settings: s });
  };

  const timeAgo = (dateStr) => {
    if(!dateStr) return "";
    try {
      const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
      if(diff < 60) return "az önce";
      if(diff < 3600) return Math.floor(diff/60)+"dk önce";
      if(diff < 86400) return Math.floor(diff/3600)+"sa önce";
      return Math.floor(diff/86400)+"g önce";
    } catch { return ""; }
  };

  const fetchOneFeed = async (src) => {
    const raw = await proxyFetch(src.url);
    const text = typeof raw === "string" ? raw : (raw.contents || JSON.stringify(raw));
    const xml = new DOMParser().parseFromString(text, "text/xml");
    const items = [...xml.querySelectorAll("item, entry")].slice(0,10);
    return items.map(item => {
      const txt = (sel) => item.querySelector(sel)?.textContent?.replace(/<[^>]+>/g,"")?.trim() || "";
      const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || "";
      let thumb = "";
      try {
        const enc = item.querySelector("enclosure");
        if(enc && /image/i.test(enc.getAttribute("type")||"")) thumb = enc.getAttribute("url")||"";
        if(!thumb) {
          const mrss = "http://search.yahoo.com/mrss/";
          const mt = item.getElementsByTagNameNS(mrss,"thumbnail")[0]||item.getElementsByTagNameNS(mrss,"content")[0];
          if(mt) thumb = mt.getAttribute("url")||"";
        }
        if(!thumb) {
          const raw2 = item.querySelector("description,summary")?.textContent||"";
          const m = raw2.match(/src=["']([^"']+[.](jpg|jpeg|png|webp|gif)[^"']*)/i);
          if(m) thumb = m[1];
        }
      } catch(e) {}
      const link = txt("link") || attr("link","href") || attr("guid","");
      const pubDate = txt("pubDate") || txt("published") || txt("updated") || "";
      return {
        id: link || txt("guid") || Math.random().toString(36),
        title: txt("title"),
        summary: (txt("description")||txt("summary")).slice(0,160),
        link, thumb, pubDate,
        source: src.name, sourceColor: src.color, lang: src.lang,
      };
    }).filter(a=>a.title && a.link);
  };

  const fetchCategory = async (catId, force=false) => {
    if(loaded[catId] && !force) return;
    setLoading(l=>({...l,[catId]:true}));
    const sources = catId === "custom" ? customFeeds : (NEWS_SOURCES[catId] || []);
    if(sources.length === 0) { setLoading(l=>({...l,[catId]:false})); setLoaded(l=>({...l,[catId]:true})); return; }
    const results = await Promise.allSettled(sources.map(fetchOneFeed));
    const seen = new Set();
    const merged = results
      .flatMap(r => r.status==="fulfilled" ? r.value : [])
      .filter(a => { if(!a.title||seen.has(a.title))return false; seen.add(a.title); return true; })
      .sort((a,b)=>new Date(b.pubDate)-new Date(a.pubDate))
      .slice(0,35);
    setArticles(prev=>({...prev,[catId]:merged}));
    setLoaded(prev=>({...prev,[catId]:true}));
    setLoading(l=>({...l,[catId]:false}));
  };

  const addFeed = (feed) => {
    if(customFeeds.some(f=>f.url===feed.url)) return;
    setCustomFeeds([...customFeeds, { name:feed.name, url:feed.url, lang:feed.lang||"TR", color:feed.color||"#185FA5" }]);
    setLoaded(prev=>({...prev,custom:false}));
  };
  const removeFeed = (url) => {
    setCustomFeeds(customFeeds.filter(f=>f.url!==url));
    setLoaded(prev=>({...prev,custom:false}));
  };
  const addManualFeed = () => {
    const url = manualUrl.trim();
    const name = manualName.trim() || new URL(url).hostname;
    if(!url) return;
    addFeed({ name, url, lang:"TR", color:"#8b5cf6" });
    setManualUrl(""); setManualName("");
  };

  const openCat = (catId) => {
    setActiveCat(catId);
    fetchCategory(catId);
  };

  const catInfo = activeCat==="custom"
    ? { id:"custom", label:T("mySources"), color:"#8b5cf6", desc:T("mySourcesD") }
    : localCats.find(c=>c.id===activeCat);
  const rawList = articles[activeCat] || [];
  const list = langFilter==="all" ? rawList : rawList.filter(a=>a.lang===langFilter);
  const isLoading = loading[activeCat];

  /* ── CATEGORY ARTICLE VIEW ── */
  if(activeCat) return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button className="back-btn" aria-label="Go back" onClick={()=>setActiveCat(null)}>◀</button>
          <div style={{filter:`drop-shadow(0 0 6px ${catInfo?.color}88)`,flexShrink:0}}>
            {NEWS_ICONS[activeCat]?.(catInfo?.color||"#aaa")}
          </div>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:catInfo?.color}}>{catInfo?.label}</h3>
            <div style={{fontSize:11,color:"#8B8578",marginTop:1}}>{catInfo?.desc}</div>
          </div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:"#F5F0E8",border:"1px solid rgba(0,0,0,0.08)",
            color:"#8B8578",width:34,height:34,borderRadius:10,fontSize:14,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>↻</button>
          {activeCat==="custom"&&(
            <button onClick={()=>{setActiveCat(null);setShowSourceModal(true);}} style={{
              background:"rgba(139,92,246,0.15)",border:"1px solid rgba(139,92,246,0.3)",
              color:"#8b5cf6",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>+</button>
          )}
        </div>
        {/* Lang filter */}
        <div style={{display:"flex",gap:5}}>
          {[["all","Tümü"],["TR","TR"],["EN","EN"]].map(([k,v])=>(
            <button key={k} onClick={()=>setLangFilter(k)} style={{
              padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:langFilter===k?700:400,
              background:langFilter===k?`${catInfo?.color}25`:"rgba(0,0,0,0.06)",
              color:langFilter===k?catInfo?.color:"#8B8578",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {isLoading&&(
        <div style={{textAlign:"center",padding:"50px 0"}}>
          <div style={{margin:"0 auto 10px",animation:"pulse 1.5s ease-in-out infinite",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {NEWS_ICONS[activeCat]?.(catInfo?.color||"#aaa")}
          </div>
          <div style={{fontSize:13,color:"#8B8578",marginBottom:4}}>{T("newsLoading")}</div>
          <div style={{fontSize:11,color:"#8B8578"}}>{NEWS_SOURCES[activeCat]?.map(s=>s.name).join(" · ")}</div>
        </div>
      )}

      {!isLoading&&list.length>0&&(
        <div>
          <div style={{fontSize:11,color:"#8B8578",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:catInfo?.color,display:"inline-block"}}/>
            <span>{list.length} haber</span>
          </div>
          {list.map((article,i)=>(
            <a key={article.id||i} href={article.link} target="_blank" rel="noopener noreferrer"
              style={{textDecoration:"none",color:"inherit",display:"block"}}>
              <div className="touch-card" style={{
                ...cardStyle,padding:0,marginBottom:10,overflow:"hidden",
                border:`1px solid ${catInfo?.color}25`,
                boxShadow:`0 0 20px ${catInfo?.color}10`,
              }}
              >
                {/* Thumbnail — full width if present */}
                {article.thumb&&(
                  <div style={{width:"100%",height:140,overflow:"hidden",background:"#111",flexShrink:0}}>
                    <img src={article.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
                      onError={e=>{e.target.parentElement.style.display="none";}}/>
                  </div>
                )}
                <div style={{padding:"12px 14px"}}>
                  <div style={{fontSize:14,fontWeight:700,lineHeight:1.45,marginBottom:6,
                    display:"-webkit-box",WebkitLineClamp:article.thumb?2:3,
                    WebkitBoxOrient:"vertical",overflow:"hidden",
                  }}>{article.title}</div>
                  {!article.thumb&&article.summary&&(
                    <div style={{fontSize:12,color:"#8B8578",lineHeight:1.45,marginBottom:6,
                      display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
                    }}>{article.summary}</div>
                  )}
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{
                      fontSize:10,fontWeight:700,
                      color:article.sourceColor,
                      background:`${article.sourceColor}18`,
                      padding:"2px 8px",borderRadius:5,
                    }}>{article.source}</span>
                    {article.pubDate&&<span style={{fontSize:10,color:"#8B8578"}}>{timeAgo(article.pubDate)}</span>}
                    <span style={{fontSize:10,opacity:.2,marginLeft:"auto"}}>↗ Habere git</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!isLoading&&list.length===0&&loaded[activeCat]&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{marginBottom:10}}>
            <svg width="40" height="40" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="14" r="5" stroke={activeCat==="custom"?"#8b5cf6":"#8B8578"} strokeWidth="1.5"/><line x1="18" y1="19" x2="18" y2="30" stroke={activeCat==="custom"?"#8b5cf6":"#8B8578"} strokeWidth="1.5"/><line x1="12" y1="26" x2="24" y2="26" stroke={activeCat==="custom"?"#8b5cf6":"#8B8578"} strokeWidth="1.5" opacity=".5"/></svg>
          </div>
          {activeCat==="custom"&&customFeeds.length===0 ? (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:6}}>{T("noCustomFeeds")}</div>
              <div style={{fontSize:12,color:"#8B8578",marginBottom:16}}>{T("addFirstSource")}</div>
              <button onClick={()=>{setActiveCat(null);setShowSourceModal(true);}} style={{
                background:"rgba(139,92,246,0.15)",color:"#8b5cf6",
                border:"1px solid rgba(139,92,246,0.3)",borderRadius:10,
                padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>+ {T("addSource")}</button>
            </>
          ) : langFilter!=="all"&&rawList.length>0 ? (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:6}}>{langFilter==="TR"?"Türkçe":"İngilizce"} haber bulunamadı</div>
              <div style={{fontSize:12,color:"#8B8578",marginBottom:16}}>Diğer dillerde {rawList.length} haber mevcut</div>
              <button onClick={()=>setLangFilter("all")} style={{
                background:`${catInfo?.color}20`,color:catInfo?.color,
                border:`1px solid ${catInfo?.color}40`,borderRadius:10,
                padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>Tümünü Göster</button>
            </>
          ) : (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#8B8578",marginBottom:6}}>Haber yüklenemedi</div>
              <div style={{fontSize:12,color:"#8B8578",marginBottom:16}}>İnternet bağlantını kontrol et</div>
              <button onClick={()=>fetchCategory(activeCat,true)} style={{
                background:`${catInfo?.color}20`,color:catInfo?.color,
                border:`1px solid ${catInfo?.color}40`,borderRadius:10,
                padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>↻ Tekrar Dene</button>
            </>
          )}
        </div>
      )}
    </div>
  );

  /* ── CATEGORY GRID (main view) ── */
  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>
          <span style={{fontSize:22}}>
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#D85A30" strokeWidth="1.5" fill="rgba(239,68,68,0.1)"/><line x1="9" y1="13" x2="27" y2="13" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="18" x2="27" y2="18" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/><line x1="9" y1="23" x2="20" y2="23" stroke="#D85A30" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg>
          </span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{T("news")}</h3>
          <span style={{fontSize:11,color:"#8B8578"}}>{localCats.length} {T("categories")}</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,color:"#8B8578"}}>{T("touchToExplore")}</p>
      </StickyHeader>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {localCats.map((cat,idx)=>(
          <div key={cat.id} className={`touch-card stagger-${Math.min(idx+1,6)}`} onClick={()=>openCat(cat.id)}
            style={{
              background:`linear-gradient(145deg,rgba(0,0,0,0.06) 0%,rgba(0,0,0,0.02) 100%)`,
              
              borderRadius:20,padding:"20px 16px",cursor:"pointer",
              border:`1px solid ${cat.color}45`,
              boxShadow:`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(0,0,0,0.06)`,
              minHeight:110,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
            }}
          >
            <div style={{filter:`drop-shadow(0 0 10px ${cat.color}88)`,lineHeight:1}}>
              {NEWS_ICONS[cat.id]?.(cat.color)}
            </div>
            <div style={{fontSize:14,fontWeight:800,color:"#fff",textAlign:"center"}}>{cat.label}</div>
            <div style={{
              fontSize:10,color:cat.color,opacity:.8,
              textAlign:"center",lineHeight:1.3,
              display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",
            }}>{cat.desc}</div>
            {loaded[cat.id]&&articles[cat.id]?.length>0&&(
              <div style={{fontSize:10,color:cat.color,fontWeight:700,opacity:.7}}>
                {articles[cat.id].length} haber
              </div>
            )}
            {loading[cat.id]&&(
              <div style={{fontSize:10,color:"#8B8578",animation:"pulse 1s ease-in-out infinite"}}>yükleniyor...</div>
            )}
          </div>
        ))}

        {/* ── Kaynaklarım kartı ── */}
        <div className="touch-card" onClick={()=>customFeeds.length>0?openCat("custom"):setShowSourceModal(true)}
          style={{
            background:"linear-gradient(145deg,rgba(139,92,246,0.12) 0%,rgba(139,92,246,0.04) 100%)",
            borderRadius:20,padding:"20px 16px",cursor:"pointer",
            border:"1px solid rgba(139,92,246,0.35)",
            boxShadow:"0 0 28px rgba(139,92,246,0.15), inset 0 1px 0 rgba(0,0,0,0.06)",
            minHeight:110,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
          }}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="5" y="5" width="26" height="26" rx="6" stroke="#8b5cf6" strokeWidth="1.5" fill="rgba(139,92,246,0.1)"/>
            <path d="M13 13 L23 13" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 18 L23 18" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/>
            <path d="M13 23 L19 23" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
            <circle cx="26" cy="26" r="6" fill="#8b5cf6"/>
            <path d="M26 23.5 L26 28.5 M23.5 26 L28.5 26" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div style={{fontSize:14,fontWeight:800,color:"#fff",textAlign:"center"}}>{T("mySources")}</div>
          <div style={{fontSize:10,color:"#8b5cf6",opacity:.8,textAlign:"center",lineHeight:1.3}}>
            {customFeeds.length>0?`${customFeeds.length} kaynak`:T("mySourcesD")}
          </div>
          {loaded.custom&&articles.custom?.length>0&&(
            <div style={{fontSize:10,color:"#8b5cf6",fontWeight:700,opacity:.7}}>
              {articles.custom.length} haber
            </div>
          )}
        </div>
      </div>

      {/* ── Kaynak Yönetimi Butonu ── */}
      <button onClick={()=>setShowSourceModal(true)} style={{
        width:"100%",marginTop:16,padding:"14px",borderRadius:16,cursor:"pointer",
        background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.25)",
        color:"#8b5cf6",fontSize:13,fontWeight:700,
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/></svg>
        {T("addSource")}
      </button>

      {/* ── Kaynak Ekle Modal ── */}
      {showSourceModal&&(
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowSourceModal(false);}}>
          <div style={{
            width:"100%",maxWidth:420,maxHeight:"85vh",
            background:"#FFFFFF",borderRadius:"24px 24px 0 0",
            padding:"20px 16px calc(20px + env(safe-area-inset-bottom,0px))",
            overflowY:"auto",
          }}>
            {/* Modal Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:"#fff"}}>{T("addSource")}</h3>
              <button onClick={()=>setShowSourceModal(false)} style={{background:"rgba(0,0,0,0.08)",border:"none",color:"#8B8578",width:32,height:32,borderRadius:10,cursor:"pointer",fontSize:16}}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["suggested",T("suggestedSources")],["manual",T("manualUrl")]].map(([k,v])=>(
                <button key={k} onClick={()=>setSourceTab(k)} style={{
                  flex:1,padding:"10px",borderRadius:12,border:"none",cursor:"pointer",
                  fontSize:12,fontWeight:sourceTab===k?700:400,
                  background:sourceTab===k?"rgba(139,92,246,0.15)":"rgba(0,0,0,0.06)",
                  color:sourceTab===k?"#8b5cf6":"#8B8578",
                }}>{v}</button>
              ))}
            </div>

            {/* Önerilen Kaynaklar */}
            {sourceTab==="suggested"&&(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {SUGGESTED_FEEDS.map(feed=>{
                  const added = customFeeds.some(f=>f.url===feed.url);
                  return (
                    <div key={feed.url} style={{
                      display:"flex",alignItems:"center",gap:12,padding:"12px 14px",
                      background:"rgba(0,0,0,0.03)",borderRadius:14,
                      border:`1px solid ${added?"rgba(139,92,246,0.3)":"rgba(0,0,0,0.06)"}`,
                    }}>
                      <div style={{
                        width:36,height:36,borderRadius:10,flexShrink:0,
                        background:`${feed.color}20`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:800,color:feed.color,
                      }}>{feed.name.slice(0,2)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{feed.name}</div>
                        <div style={{fontSize:10,color:"#8B8578",marginTop:1}}>{feed.desc}</div>
                        <div style={{fontSize:9,color:feed.color,marginTop:2}}>{feed.lang}</div>
                      </div>
                      <button onClick={()=>added?removeFeed(feed.url):addFeed(feed)} style={{
                        padding:"6px 14px",borderRadius:10,border:"none",cursor:"pointer",
                        fontSize:11,fontWeight:700,
                        background:added?"rgba(239,68,68,0.15)":"rgba(139,92,246,0.15)",
                        color:added?"#D85A30":"#8b5cf6",
                      }}>{added?"✕":"+ Ekle"}</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Manuel URL */}
            {sourceTab==="manual"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <input value={manualName} onChange={e=>setManualName(e.target.value)}
                  placeholder={T("feedName")} style={{
                  padding:"12px 14px",borderRadius:12,border:"1px solid rgba(0,0,0,0.08)",
                  background:"rgba(0,0,0,0.06)",color:"#fff",fontSize:13,outline:"none",
                }}/>
                <input value={manualUrl} onChange={e=>setManualUrl(e.target.value)}
                  placeholder="https://example.com/rss.xml" style={{
                  padding:"12px 14px",borderRadius:12,border:"1px solid rgba(0,0,0,0.08)",
                  background:"rgba(0,0,0,0.06)",color:"#fff",fontSize:13,outline:"none",
                }}/>
                <button onClick={addManualFeed} disabled={!manualUrl.trim()} style={{
                  padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                  background:manualUrl.trim()?"#8b5cf6":"rgba(0,0,0,0.08)",
                  color:manualUrl.trim()?"#fff":"#8B8578",fontSize:13,fontWeight:700,
                }}>+ {T("addSource")}</button>
              </div>
            )}

            {/* Mevcut Kaynaklar */}
            {customFeeds.length>0&&(
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#8B8578",marginBottom:8}}>{T("mySources")} ({customFeeds.length})</div>
                {customFeeds.map(feed=>(
                  <div key={feed.url} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                    background:"rgba(0,0,0,0.03)",borderRadius:12,marginBottom:6,
                    border:"1px solid rgba(139,92,246,0.2)",
                  }}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:feed.color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:12,fontWeight:600,color:"#fff"}}>{feed.name}</div>
                    <div style={{fontSize:9,color:"#8B8578"}}>{feed.lang}</div>
                    <button onClick={()=>removeFeed(feed.url)} style={{
                      background:"rgba(239,68,68,0.12)",border:"none",color:"#D85A30",
                      width:26,height:26,borderRadius:8,cursor:"pointer",fontSize:12,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* shared proxy fetch — uses Vercel /api/proxy, falls back to public proxies */
async function proxyFetch(url) {
  // 1. Try Vercel serverless proxy (same origin, no CORS, cached)
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) return res.json();
      return res.text();
    }
  } catch (e) { /* fall through */ }

  // 2. Fallback: allorigins (free public proxy)
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = await res.json();
      if (j.contents !== undefined) {
        try { return JSON.parse(j.contents); }
        catch { return j.contents; }
      }
      return j;
    }
  } catch (e) { /* fall through */ }

  // 3. Last resort: corsproxy.io
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) return res.json();
      return res.text();
    }
  } catch (e) { /* fall through */ }

  throw new Error("All proxies failed for: " + url);
}

/* ═══════════ MUSIC ROOM ═══════════ */
