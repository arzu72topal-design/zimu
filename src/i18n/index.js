import tr from "./tr";
import en from "./en";
import de from "./de";
import fr from "./fr";
import es from "./es";
import nl from "./nl";
import el from "./el";
import it from "./it";

export const TRANSLATIONS = { tr, en, de, fr, es, nl, el, it };

export const SUPPORTED_LANGUAGES = [
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "el", label: "Ελληνικά", flag: "🇬🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
];

export const getLang = (data) => data?.settings?.language || "tr";
export const i18n = (key, data) =>
  (TRANSLATIONS[getLang(data)] || TRANSLATIONS.tr)[key] || TRANSLATIONS.tr[key] || key;

export const ROOM_LABEL_MAP = {
  projects: "rmProjects",
  news: "rmNews",
  music: "rmMusic",
  clothes: "rmClothes",
  memories: "rmMemories",
  healthcoach: "rmHealth",
};
export const roomLabel = (room, data) =>
  ROOM_LABEL_MAP[room.id] ? i18n(ROOM_LABEL_MAP[room.id], data) : room.name;
