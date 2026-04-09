/* ── Constants (dil bağımsız) ── */
export const TABS_KEYS = [
  { id: "dashboard", labelKey: "home", icon: "⌂" },
  { id: "tasks", labelKey: "tasks", icon: "✓" },
  { id: "lifestyle", labelKey: "lifestyle", icon: "◈" },
];

export const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
export const SPORT_EMOJI = {"Koşu":"▸","Yüzme":"≈","Bisiklet":"◎","Yoga":"◉","Ağırlık":"■","Yürüyüş":"▪","Diğer":"●"};
// MET × 70kg × (duration/60) → kcal
export const SPORT_KCAL_PER_MIN = {"Koşu":10,"Yüzme":7,"Bisiklet":7,"Yoga":3.3,"Ağırlık":5,"Yürüyüş":4.7,"Diğer":5};
export const calcSportCal = (type, durationMin) => Math.round((SPORT_KCAL_PER_MIN[type]||5) * (+durationMin||0));
export const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
export const PCOL = { high: "#D85A30", medium: "#BA7517", low: "#1D9E75" };
export const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
export const COLORS = ["#185FA5","#D85A30","#1D9E75","#BA7517","#534AB7","#D85A30","#1D9E75"];

export const DEFAULT_ROOMS = [
  { id: "projects", name: "Projeler", icon: "Pr", color: "#185FA5", type: "project" },
  { id: "news", name: "Haberler", icon: "Hb", color: "#D85A30", type: "news" },
  { id: "music", name: "Müziklerim", icon: "Mz", color: "#534AB7", type: "collection" },
  { id: "clothes", name: "Kıyafetlerim", icon: "St", color: "#D85A30", type: "collection" },
  { id: "memories", name: "Anılar", icon: "An", color: "#1D9E75", type: "collection" },
  { id: "healthcoach", name: "Sağlık Koçu", icon: "Sk", color: "#1D9E75", type: "health" },
];

/* Eski kullanıcılarda eksik odaları otomatik ekle */
export const migrateRooms = (savedRooms) => {
  if (!savedRooms) return [...DEFAULT_ROOMS];
  const ids = new Set(savedRooms.map(r => r.id));
  const missing = DEFAULT_ROOMS.filter(d => !ids.has(d.id));
  return missing.length > 0 ? [...savedRooms, ...missing] : savedRooms;
};

export const COMMON_FOODS = {
  "Çay (şekerli)": 30, "Çay (şekersiz)": 2, "Türk kahvesi": 15, "Süt": 60,
  "Ekmek (1 dilim)": 80, "Yumurta (haşlanmış)": 78, "Yumurta (sahanda)": 120,
  "Peynir (1 dilim)": 80, "Zeytin (5 adet)": 40, "Bal (1 yk)": 64, "Tereyağı (1 yk)": 100,
  "Pilav (1 porsiyon)": 200, "Makarna (1 porsiyon)": 220, "Tavuk göğsü": 165,
  "Kıyma (100g)": 250, "Köfte (4 adet)": 300, "Balık (ızgara)": 200,
  "Salata": 50, "Çorba": 120, "Mercimek çorbası": 150, "Kuru fasulye": 200,
  "Dürüm": 450, "Lahmacun": 200, "Pizza (1 dilim)": 270, "Hamburger": 500,
  "Elma": 52, "Muz": 90, "Portakal": 47, "Üzüm (1 avuç)": 60,
  "Yoğurt": 60, "Ayran": 40, "Kola": 140, "Meyve suyu": 120,
  "Baklava (1 dilim)": 250, "Sütlaç": 200, "Dondurma (1 top)": 140,
  "Ceviz (5 adet)": 130, "Badem (10 adet)": 70, "Çikolata (1 bar)": 230,
};
export const MN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
export const DN = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

export const today = () => new Date().toISOString().split("T")[0];
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
