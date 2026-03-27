import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData, exportData, importData } from "./db.js";
import {
  signInWithGoogle,
  signInWithEmail,
  registerWithEmail,
  logOut,
  onAuthChange,
} from "./firebase.js";
import {
  requestNotificationPermission,
  isNotificationSupported,
  getNotificationPermission,
  scheduleEventReminders,
  scheduleTaskReminders,
  clearAllReminders,
} from "./notifications.js";

/* ── i18n — Translations ── */
const LANGUAGES = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "da", name: "Dansk", flag: "🇩🇰" },
  { code: "fi", name: "Suomi", flag: "🇫🇮" },
];

const T = {
  // ── Tabs ──
  "tab.home":       { tr:"Ana Sayfa", en:"Home", de:"Startseite", da:"Hjem", fi:"Etusivu" },
  "tab.tasks":      { tr:"Görevler", en:"Tasks", de:"Aufgaben", da:"Opgaver", fi:"Tehtävät" },
  "tab.calendar":   { tr:"Takvim", en:"Calendar", de:"Kalender", da:"Kalender", fi:"Kalenteri" },
  "tab.health":     { tr:"Sağlık", en:"Health", de:"Gesundheit", da:"Sundhed", fi:"Terveys" },
  "tab.style":      { tr:"Tarzım", en:"My Style", de:"Mein Stil", da:"Min Stil", fi:"Tyylini" },
  "tab.notes":      { tr:"Notlar", en:"Notes", de:"Notizen", da:"Noter", fi:"Muistiinpanot" },
  "tab.settings":   { tr:"Ayarlar", en:"Settings", de:"Einstellungen", da:"Indstillinger", fi:"Asetukset" },

  // ── Greetings ──
  "greet.morning":  { tr:"Günaydın", en:"Good morning", de:"Guten Morgen", da:"God morgen", fi:"Hyvää huomenta" },
  "greet.afternoon":{ tr:"İyi günler", en:"Good afternoon", de:"Guten Tag", da:"God eftermiddag", fi:"Hyvää iltapäivää" },
  "greet.evening":  { tr:"İyi akşamlar", en:"Good evening", de:"Guten Abend", da:"God aften", fi:"Hyvää iltaa" },

  // ── Dashboard ──
  "dash.progress":     { tr:"Bugünün İlerlemesi", en:"Today's Progress", de:"Fortschritt heute", da:"Dagens fremskridt", fi:"Päivän edistyminen" },
  "dash.noTasks":      { tr:"görev yok", en:"no tasks", de:"keine Aufgaben", da:"ingen opgaver", fi:"ei tehtäviä" },
  "dash.allDone":      { tr:"Bugünkü tüm görevler tamamlandı!", en:"All today's tasks completed!", de:"Alle heutigen Aufgaben erledigt!", da:"Alle dagens opgaver fuldført!", fi:"Kaikki päivän tehtävät valmiit!" },
  "dash.pending":      { tr:"Bekleyen", en:"Pending", de:"Ausstehend", da:"Afventende", fi:"Odottaa" },
  "dash.overdue":      { tr:"Gecikmiş", en:"Overdue", de:"Überfällig", da:"Forsinket", fi:"Myöhässä" },
  "dash.kcal":         { tr:"kcal", en:"kcal", de:"kcal", da:"kcal", fi:"kcal" },
  "dash.event":        { tr:"Etkinlik", en:"Event", de:"Termin", da:"Begivenhed", fi:"Tapahtuma" },
  "dash.streak":       { tr:"gün seri", en:"day streak", de:"Tage Serie", da:"dages streak", fi:"päivän putki" },
  "dash.quickAdd":     { tr:"Hızlı görev ekle...", en:"Quick add task...", de:"Schnell Aufgabe hinzufügen...", da:"Tilføj hurtig opgave...", fi:"Lisää tehtävä nopeasti..." },
  "dash.overdueWarn":  { tr:"gecikmiş görev!", en:"overdue task(s)!", de:"überfällige Aufgabe(n)!", da:"forsinkede opgave(r)!", fi:"myöhässä olevaa tehtävää!" },
  "dash.checkNow":     { tr:"Hemen kontrol et", en:"Check now", de:"Jetzt prüfen", da:"Tjek nu", fi:"Tarkista nyt" },
  "dash.todayFlow":    { tr:"Bugünün Akışı", en:"Today's Flow", de:"Tagesablauf", da:"Dagens flow", fi:"Päivän kulku" },
  "dash.task":         { tr:"Görev", en:"Task", de:"Aufgabe", da:"Opgave", fi:"Tehtävä" },
  "dash.tapDone":      { tr:"tıkla ✓", en:"tap ✓", de:"tippen ✓", da:"tryk ✓", fi:"napauta ✓" },
  "dash.next7":        { tr:"Önümüzdeki 7 Gün", en:"Next 7 Days", de:"Nächste 7 Tage", da:"Næste 7 dage", fi:"Seuraavat 7 päivää" },
  "dash.moreTasks":    { tr:"görev daha → Tümünü gör", en:"more task(s) → See all", de:"weitere Aufgabe(n) → Alle anzeigen", da:"flere opgaver → Se alle", fi:"tehtävää lisää → Näytä kaikki" },
  "dash.thisWeek":     { tr:"Bu Hafta", en:"This Week", de:"Diese Woche", da:"Denne uge", fi:"Tämä viikko" },
  "dash.workout":      { tr:"Antrenman", en:"Workout", de:"Training", da:"Træning", fi:"Treeni" },
  "dash.kcalBurned":   { tr:"kcal yakıldı", en:"kcal burned", de:"kcal verbrannt", da:"kcal forbrændt", fi:"kcal poltettu" },
  "dash.tasksDone":    { tr:"Görev bitti", en:"Tasks done", de:"Aufgaben erledigt", da:"Opgaver udført", fi:"Tehtävät valmiit" },
  "dash.thoughts":     { tr:"Bugün Kafamı Kurcalayanlar", en:"On My Mind Today", de:"Was mich heute beschäftigt", da:"Det der fylder i dag", fi:"Mielessäni tänään" },
  "dash.thought1":     { tr:"Bugün en çok düşündüğüm şey...", en:"What I'm thinking about most...", de:"Was mich am meisten beschäftigt...", da:"Det jeg tænker mest over...", fi:"Mitä ajattelen eniten..." },
  "dash.thought2":     { tr:"Kafamı karıştıran bir şey...", en:"Something confusing me...", de:"Etwas das mich verwirrt...", da:"Noget der forvirrer mig...", fi:"Jokin hämmentävä..." },
  "dash.thought3":     { tr:"Çözmek istediğim bir sorun...", en:"A problem I want to solve...", de:"Ein Problem das ich lösen will...", da:"Et problem jeg vil løse...", fi:"Ongelma jonka haluan ratkaista..." },
  "dash.news":         { tr:"Haberler", en:"News", de:"Nachrichten", da:"Nyheder", fi:"Uutiset" },
  "dash.music":        { tr:"Müzik", en:"Music", de:"Musik", da:"Musik", fi:"Musiikki" },
  "dash.recentNotes":  { tr:"Son Notlar", en:"Recent Notes", de:"Letzte Notizen", da:"Seneste noter", fi:"Viimeisimmät muistiinpanot" },
  "dash.loading":      { tr:"Yükleniyor...", en:"Loading...", de:"Laden...", da:"Indlæser...", fi:"Ladataan..." },
  "dash.allLabel":     { tr:"Tümü ▶", en:"All ▶", de:"Alle ▶", da:"Alle ▶", fi:"Kaikki ▶" },

  // ── Tasks ──
  "tasks.new":        { tr:"Yeni Görev", en:"New Task", de:"Neue Aufgabe", da:"Ny opgave", fi:"Uusi tehtävä" },
  "tasks.edit":       { tr:"Görevi Düzenle", en:"Edit Task", de:"Aufgabe bearbeiten", da:"Rediger opgave", fi:"Muokkaa tehtävää" },
  "tasks.all":        { tr:"Tümü", en:"All", de:"Alle", da:"Alle", fi:"Kaikki" },
  "tasks.pending":    { tr:"Bekleyen", en:"Pending", de:"Ausstehend", da:"Afventende", fi:"Odottaa" },
  "tasks.done":       { tr:"Bitti", en:"Done", de:"Erledigt", da:"Færdig", fi:"Valmis" },
  "tasks.priority":   { tr:"Öncelikli", en:"Priority", de:"Priorität", da:"Prioritet", fi:"Prioriteetti" },
  "tasks.overdue":    { tr:"Gecikmiş", en:"Overdue", de:"Überfällig", da:"Forsinket", fi:"Myöhässä" },
  "tasks.title":      { tr:"Görev başlığı", en:"Task title", de:"Aufgabentitel", da:"Opgavetitel", fi:"Tehtävän otsikko" },
  "tasks.desc":       { tr:"Açıklama (opsiyonel)...", en:"Description (optional)...", de:"Beschreibung (optional)...", da:"Beskrivelse (valgfri)...", fi:"Kuvaus (valinnainen)..." },
  "tasks.category":   { tr:"Kategori (opsiyonel)", en:"Category (optional)", de:"Kategorie (optional)", da:"Kategori (valgfri)", fi:"Kategoria (valinnainen)" },
  "tasks.save":       { tr:"Kaydet", en:"Save", de:"Speichern", da:"Gem", fi:"Tallenna" },
  "tasks.add":        { tr:"Ekle", en:"Add", de:"Hinzufügen", da:"Tilføj", fi:"Lisää" },
  "tasks.editBtn":    { tr:"Düzenle", en:"Edit", de:"Bearbeiten", da:"Rediger", fi:"Muokkaa" },
  "tasks.delete":     { tr:"Sil", en:"Delete", de:"Löschen", da:"Slet", fi:"Poista" },
  "tasks.today":      { tr:"Bugün", en:"Today", de:"Heute", da:"I dag", fi:"Tänään" },
  "tasks.tomorrow":   { tr:"Yarın", en:"Tomorrow", de:"Morgen", da:"I morgen", fi:"Huomenna" },
  "tasks.overdueGrp": { tr:"Gecikmiş", en:"Overdue", de:"Überfällig", da:"Forsinket", fi:"Myöhässä" },
  "tasks.weekGrp":    { tr:"Bu Hafta", en:"This Week", de:"Diese Woche", da:"Denne uge", fi:"Tämä viikko" },
  "tasks.pendingGrp": { tr:"Bekleyen", en:"Pending", de:"Ausstehend", da:"Afventende", fi:"Odottaa" },
  "tasks.doneGrp":    { tr:"Tamamlanan", en:"Completed", de:"Abgeschlossen", da:"Fuldført", fi:"Valmistuneet" },

  // ── Priorities ──
  "pri.high":   { tr:"Yüksek", en:"High", de:"Hoch", da:"Høj", fi:"Korkea" },
  "pri.medium": { tr:"Orta", en:"Medium", de:"Mittel", da:"Mellem", fi:"Keskitaso" },
  "pri.low":    { tr:"Düşük", en:"Low", de:"Niedrig", da:"Lav", fi:"Matala" },

  // ── Calendar ──
  "cal.add":      { tr:"+ Ekle", en:"+ Add", de:"+ Hinzufügen", da:"+ Tilføj", fi:"+ Lisää" },
  "cal.newEvent": { tr:"Yeni Etkinlik", en:"New Event", de:"Neuer Termin", da:"Ny begivenhed", fi:"Uusi tapahtuma" },
  "cal.title":    { tr:"Etkinlik başlığı", en:"Event title", de:"Terminname", da:"Begivenhedstitel", fi:"Tapahtuman otsikko" },
  "cal.daily":    { tr:"Her gün", en:"Daily", de:"Täglich", da:"Daglig", fi:"Päivittäin" },
  "cal.weekly":   { tr:"Her hafta", en:"Weekly", de:"Wöchentlich", da:"Ugentlig", fi:"Viikoittain" },
  "cal.none":     { tr:"Tekrar yok", en:"No repeat", de:"Keine Wiederholung", da:"Ingen gentagelse", fi:"Ei toistoa" },

  // ── Sports / Health ──
  "sport.new":        { tr:"Yeni Antrenman", en:"New Workout", de:"Neues Training", da:"Ny træning", fi:"Uusi treeni" },
  "sport.run":        { tr:"Koşu", en:"Running", de:"Laufen", da:"Løb", fi:"Juoksu" },
  "sport.swim":       { tr:"Yüzme", en:"Swimming", de:"Schwimmen", da:"Svømning", fi:"Uinti" },
  "sport.bike":       { tr:"Bisiklet", en:"Cycling", de:"Radfahren", da:"Cykling", fi:"Pyöräily" },
  "sport.yoga":       { tr:"Yoga", en:"Yoga", de:"Yoga", da:"Yoga", fi:"Jooga" },
  "sport.weights":    { tr:"Ağırlık", en:"Weights", de:"Gewichte", da:"Vægte", fi:"Painot" },
  "sport.walk":       { tr:"Yürüyüş", en:"Walking", de:"Gehen", da:"Gang", fi:"Kävely" },
  "sport.other":      { tr:"Diğer", en:"Other", de:"Andere", da:"Andet", fi:"Muu" },
  "sport.duration":   { tr:"Süre (dk)", en:"Duration (min)", de:"Dauer (Min)", da:"Varighed (min)", fi:"Kesto (min)" },
  "sport.distance":   { tr:"Mesafe (km)", en:"Distance (km)", de:"Distanz (km)", da:"Distance (km)", fi:"Matka (km)" },
  "sport.calories":   { tr:"Yakılan kalori", en:"Calories burned", de:"Verbrannte Kalorien", da:"Forbrændte kalorier", fi:"Poltetut kalorit" },
  "sport.calOpt":     { tr:"Yakılan kalori (opsiyonel)", en:"Calories burned (optional)", de:"Verbrannte Kalorien (optional)", da:"Forbrændte kalorier (valgfri)", fi:"Poltetut kalorit (valinnainen)" },
  "sport.weeklySport": { tr:"Haftalık Spor", en:"Weekly Sport", de:"Wöchentlicher Sport", da:"Ugentlig sport", fi:"Viikon urheilu" },
  "sport.addFood":    { tr:"Yemek Ekle", en:"Add Food", de:"Essen hinzufügen", da:"Tilføj mad", fi:"Lisää ruoka" },
  "sport.dailyGoal":  { tr:"Günlük hedef", en:"Daily goal", de:"Tagesziel", da:"Dagligt mål", fi:"Päivätavoite" },
  "sport.breakfast":  { tr:"Kahvaltı", en:"Breakfast", de:"Frühstück", da:"Morgenmad", fi:"Aamiainen" },
  "sport.lunch":      { tr:"Öğle", en:"Lunch", de:"Mittagessen", da:"Frokost", fi:"Lounas" },
  "sport.dinner":     { tr:"Akşam", en:"Dinner", de:"Abendessen", da:"Aftensmad", fi:"Illallinen" },
  "sport.snack":      { tr:"Atıştırma", en:"Snack", de:"Snack", da:"Snack", fi:"Välipala" },
  "sport.searching":  { tr:"Aranıyor...", en:"Searching...", de:"Suche...", da:"Søger...", fi:"Haetaan..." },
  "sport.min":        { tr:"dk", en:"min", de:"Min", da:"min", fi:"min" },

  // ── Projects / Style ──
  "proj.new":         { tr:"Yeni Proje", en:"New Project", de:"Neues Projekt", da:"Nyt projekt", fi:"Uusi projekti" },
  "proj.noProjects":  { tr:"Henüz proje yok", en:"No projects yet", de:"Noch keine Projekte", da:"Ingen projekter endnu", fi:"Ei vielä projekteja" },
  "proj.delete":      { tr:"Projeyi Sil", en:"Delete Project", de:"Projekt löschen", da:"Slet projekt", fi:"Poista projekti" },
  "proj.addSub":      { tr:"Alt görev ekle...", en:"Add subtask...", de:"Unteraufgabe hinzufügen...", da:"Tilføj underopgave...", fi:"Lisää alitehtävä..." },
  "proj.planning":    { tr:"Planlama", en:"Planning", de:"Planung", da:"Planlægning", fi:"Suunnittelu" },
  "proj.inProgress":  { tr:"Devam Ediyor", en:"In Progress", de:"In Arbeit", da:"I gang", fi:"Käynnissä" },
  "proj.testing":     { tr:"Test", en:"Testing", de:"Test", da:"Test", fi:"Testaus" },
  "proj.completed":   { tr:"Tamamlandı", en:"Completed", de:"Abgeschlossen", da:"Fuldført", fi:"Valmis" },
  "proj.projects":    { tr:"Projeler", en:"Projects", de:"Projekte", da:"Projekter", fi:"Projektit" },
  "proj.news":        { tr:"Haberler", en:"News", de:"Nachrichten", da:"Nyheder", fi:"Uutiset" },
  "proj.myMusic":     { tr:"Müziklerim", en:"My Music", de:"Meine Musik", da:"Min musik", fi:"Musiikkini" },
  "proj.myStyle":     { tr:"Stilim", en:"My Style", de:"Mein Stil", da:"Min Stil", fi:"Tyylini" },
  "proj.memories":    { tr:"Anılar", en:"Memories", de:"Erinnerungen", da:"Minder", fi:"Muistot" },

  // ── Notes ──
  "notes.new":       { tr:"Yeni Not", en:"New Note", de:"Neue Notiz", da:"Ny note", fi:"Uusi muistiinpano" },
  "notes.edit":      { tr:"Notu Düzenle", en:"Edit Note", de:"Notiz bearbeiten", da:"Rediger note", fi:"Muokkaa muistiinpanoa" },
  "notes.noNotes":   { tr:"Henüz not yok", en:"No notes yet", de:"Noch keine Notizen", da:"Ingen noter endnu", fi:"Ei vielä muistiinpanoja" },
  "notes.noResult":  { tr:"Arama sonucu bulunamadı", en:"No results found", de:"Keine Ergebnisse", da:"Ingen resultater fundet", fi:"Ei tuloksia" },
  "notes.update":    { tr:"Güncelle", en:"Update", de:"Aktualisieren", da:"Opdater", fi:"Päivitä" },
  "notes.search":    { tr:"Not ara...", en:"Search notes...", de:"Notizen suchen...", da:"Søg noter...", fi:"Hae muistiinpanoja..." },

  // ── Settings ──
  "set.title":       { tr:"Ayarlar", en:"Settings", de:"Einstellungen", da:"Indstillinger", fi:"Asetukset" },
  "set.account":     { tr:"Hesap", en:"Account", de:"Konto", da:"Konto", fi:"Tili" },
  "set.cloudSync":   { tr:"Bulut senkronizasyon aktif", en:"Cloud sync active", de:"Cloud-Sync aktiv", da:"Cloud-synk aktiv", fi:"Pilvisynkronointi aktiivinen" },
  "set.syncDesc":    { tr:"Veriler tüm cihazlarında otomatik senkronize edilir", en:"Data syncs across all devices", de:"Daten werden auf allen Geräten synchronisiert", da:"Data synkroniseres på alle enheder", fi:"Tiedot synkronoidaan kaikilla laitteilla" },
  "set.logout":      { tr:"Çıkış Yap", en:"Log Out", de:"Abmelden", da:"Log ud", fi:"Kirjaudu ulos" },
  "set.guest":       { tr:"Misafir modu", en:"Guest mode", de:"Gastmodus", da:"Gæstetilstand", fi:"Vierastila" },
  "set.guestDesc":   { tr:"Veriler sadece bu cihazda saklanıyor. Giriş yaparak tüm cihazlarında senkronize edebilirsin.", en:"Data stored on this device only. Sign in to sync across devices.", de:"Daten nur auf diesem Gerät. Melden Sie sich an, um zu synchronisieren.", da:"Data kun gemt på denne enhed. Log ind for at synkronisere.", fi:"Tiedot vain tällä laitteella. Kirjaudu synkronointiin." },
  "set.loginOrReg":  { tr:"Giriş Yap / Kayıt Ol", en:"Sign In / Register", de:"Anmelden / Registrieren", da:"Log ind / Registrer", fi:"Kirjaudu / Rekisteröidy" },
  "set.notif":       { tr:"Bildirimler", en:"Notifications", de:"Benachrichtigungen", da:"Notifikationer", fi:"Ilmoitukset" },
  "set.notifNoSupp": { tr:"Bu tarayıcı bildirimleri desteklemiyor", en:"This browser doesn't support notifications", de:"Dieser Browser unterstützt keine Benachrichtigungen", da:"Denne browser understøtter ikke notifikationer", fi:"Tämä selain ei tue ilmoituksia" },
  "set.notifActive": { tr:"Bildirimler aktif", en:"Notifications active", de:"Benachrichtigungen aktiv", da:"Notifikationer aktive", fi:"Ilmoitukset aktiiviset" },
  "set.notifDesc":   { tr:"Etkinlik ve görev hatırlatmaları otomatik olarak gönderilecek", en:"Event and task reminders will be sent automatically", de:"Erinnerungen werden automatisch gesendet", da:"Påmindelser sendes automatisk", fi:"Muistutukset lähetetään automaattisesti" },
  "set.notifDenied": { tr:"Bildirimler engellendi. Tarayıcı ayarlarından izin verin.", en:"Notifications blocked. Allow in browser settings.", de:"Benachrichtigungen blockiert. In Browsereinstellungen erlauben.", da:"Notifikationer blokeret. Tillad i browserindstillinger.", fi:"Ilmoitukset estetty. Salli selainasetuksissa." },
  "set.notifEnable": { tr:"Bildirimleri Aç", en:"Enable Notifications", de:"Benachrichtigungen aktivieren", da:"Aktiver notifikationer", fi:"Ota ilmoitukset käyttöön" },
  "set.dataSummary": { tr:"Veri Özeti", en:"Data Summary", de:"Datenübersicht", da:"Dataoversigt", fi:"Tietoyhteenveto" },
  "set.taskLabel":   { tr:"Görev", en:"Task", de:"Aufgabe", da:"Opgave", fi:"Tehtävä" },
  "set.eventLabel":  { tr:"Etkinlik", en:"Event", de:"Termin", da:"Begivenhed", fi:"Tapahtuma" },
  "set.sportLabel":  { tr:"Spor Kaydı", en:"Sport Log", de:"Sportprotokoll", da:"Sportlog", fi:"Urheiluloki" },
  "set.projectLabel":{ tr:"Proje", en:"Project", de:"Projekt", da:"Projekt", fi:"Projekti" },
  "set.noteLabel":   { tr:"Not", en:"Note", de:"Notiz", da:"Note", fi:"Muistiinpano" },
  "set.totalLabel":  { tr:"Toplam", en:"Total", de:"Gesamt", da:"Total", fi:"Yhteensä" },
  "set.dataManage":  { tr:"Veri Yönetimi", en:"Data Management", de:"Datenverwaltung", da:"Datastyring", fi:"Tiedonhallinta" },
  "set.dataDesc":    { tr:"Bilgisayarınızdan veri aktarabilir veya yedeğinizi indirebilirsiniz", en:"Import data or download a backup", de:"Daten importieren oder Backup herunterladen", da:"Importer data eller download backup", fi:"Tuo tietoja tai lataa varmuuskopio" },
  "set.backup":      { tr:"Yedek İndir (JSON)", en:"Download Backup (JSON)", de:"Backup herunterladen (JSON)", da:"Download backup (JSON)", fi:"Lataa varmuuskopio (JSON)" },
  "set.import":      { tr:"Dosyadan Aktar (JSON)", en:"Import from File (JSON)", de:"Aus Datei importieren (JSON)", da:"Importer fra fil (JSON)", fi:"Tuo tiedostosta (JSON)" },
  "set.importing":   { tr:"Aktarılıyor...", en:"Importing...", de:"Importieren...", da:"Importerer...", fi:"Tuodaan..." },
  "set.aiTitle":     { tr:"AI Kalori Asistanı", en:"AI Calorie Assistant", de:"AI-Kalorien-Assistent", da:"AI kalorieassistent", fi:"AI-kaloriavustaja" },
  "set.aiDesc":      { tr:"Yemek fotoğrafı çekerek kalori hesaplatabilirsin. Kendi AI hesabını seç ve API anahtarını gir.", en:"Take a food photo to estimate calories. Choose your AI provider and enter API key.", de:"Fotografiere Essen für Kalorienanalyse. Wähle deinen AI-Anbieter.", da:"Tag et foto af mad for kalorieanalyse. Vælg din AI-udbyder.", fi:"Ota kuva ruoasta kalorilaskentaa varten. Valitse AI-tarjoaja." },
  "set.manualEntry": { tr:"Manuel Giriş", en:"Manual Entry", de:"Manuelle Eingabe", da:"Manuel indtastning", fi:"Manuaalinen syöttö" },
  "set.manualDesc":  { tr:"AI kullanma, kalorileri kendim girerim", en:"No AI, I'll enter calories myself", de:"Kein AI, Kalorien manuell eingeben", da:"Ingen AI, jeg indtaster selv kalorier", fi:"Ei tekoälyä, syötän kalorit itse" },
  "set.keySaved":    { tr:"Anahtar kaydedildi", en:"Key saved", de:"Schlüssel gespeichert", da:"Nøgle gemt", fi:"Avain tallennettu" },
  "set.keyNeeded":   { tr:"Anahtar gerekli", en:"Key required", de:"Schlüssel erforderlich", da:"Nøgle påkrævet", fi:"Avain vaaditaan" },
  "set.keyPrivacy":  { tr:"Anahtarın sadece senin telefonunda saklanır, sunucuya gönderilmez", en:"Your key is stored only on your device, never sent to a server", de:"Ihr Schlüssel wird nur auf Ihrem Gerät gespeichert", da:"Din nøgle gemmes kun på din enhed", fi:"Avaimesi tallennetaan vain laitteeseesi" },
  "set.apiPaste":    { tr:"API anahtarını yapıştır...", en:"Paste API key...", de:"API-Schlüssel einfügen...", da:"Indsæt API-nøgle...", fi:"Liitä API-avain..." },
  "set.danger":      { tr:"Tehlikeli Bölge", en:"Danger Zone", de:"Gefahrenzone", da:"Farezone", fi:"Vaaravyöhyke" },
  "set.deleteAll":   { tr:"Tüm Verileri Sil", en:"Delete All Data", de:"Alle Daten löschen", da:"Slet alle data", fi:"Poista kaikki tiedot" },
  "set.confirmDel":  { tr:"Tüm veriler silinecek. Emin misiniz?", en:"All data will be deleted. Are you sure?", de:"Alle Daten werden gelöscht. Sind Sie sicher?", da:"Alle data slettes. Er du sikker?", fi:"Kaikki tiedot poistetaan. Oletko varma?" },
  "set.deleted":     { tr:"Tüm veriler silindi", en:"All data deleted", de:"Alle Daten gelöscht", da:"Alle data slettet", fi:"Kaikki tiedot poistettu" },
  "set.backupDone":  { tr:"Yedek dosyası indirildi!", en:"Backup file downloaded!", de:"Backup-Datei heruntergeladen!", da:"Backup-fil downloadet!", fi:"Varmuuskopio ladattu!" },
  "set.importDone":  { tr:"Veriler başarıyla aktarıldı!", en:"Data imported successfully!", de:"Daten erfolgreich importiert!", da:"Data importeret!", fi:"Tiedot tuotu onnistuneesti!" },
  "set.language":    { tr:"Dil", en:"Language", de:"Sprache", da:"Sprog", fi:"Kieli" },

  // ── Login ──
  "login.google":    { tr:"Google ile Giriş Yap", en:"Sign in with Google", de:"Mit Google anmelden", da:"Log ind med Google", fi:"Kirjaudu Googlella" },
  "login.or":        { tr:"veya", en:"or", de:"oder", da:"eller", fi:"tai" },
  "login.email":     { tr:"Email adresi", en:"Email address", de:"E-Mail-Adresse", da:"E-mailadresse", fi:"Sähköpostiosoite" },
  "login.password":  { tr:"Şifre (en az 6 karakter)", en:"Password (min 6 chars)", de:"Passwort (mind. 6 Zeichen)", da:"Adgangskode (min. 6 tegn)", fi:"Salasana (vähintään 6 merkkiä)" },
  "login.signIn":    { tr:"Giriş Yap", en:"Sign In", de:"Anmelden", da:"Log ind", fi:"Kirjaudu" },
  "login.register":  { tr:"Kayıt Ol", en:"Register", de:"Registrieren", da:"Registrer", fi:"Rekisteröidy" },
  "login.wait":      { tr:"Bekleyin...", en:"Please wait...", de:"Bitte warten...", da:"Vent venligst...", fi:"Odota..." },
  "login.noAccount": { tr:"Hesabın yok mu? Kayıt ol", en:"No account? Register", de:"Kein Konto? Registrieren", da:"Ingen konto? Registrer", fi:"Ei tiliä? Rekisteröidy" },
  "login.hasAccount":{ tr:"Zaten hesabın var mı? Giriş yap", en:"Already have an account? Sign in", de:"Bereits ein Konto? Anmelden", da:"Har du allerede en konto? Log ind", fi:"Onko jo tili? Kirjaudu" },
  "login.skip":      { tr:"Giriş yapmadan devam et →", en:"Continue without signing in →", de:"Ohne Anmeldung fortfahren →", da:"Fortsæt uden at logge ind →", fi:"Jatka kirjautumatta →" },
  "login.skipNote":  { tr:"Veriler sadece bu cihazda kalır", en:"Data stays on this device only", de:"Daten bleiben nur auf diesem Gerät", da:"Data forbliver kun på denne enhed", fi:"Tiedot pysyvät vain tällä laitteella" },
  "login.emailReq":  { tr:"Email ve şifre gerekli", en:"Email and password required", de:"E-Mail und Passwort erforderlich", da:"E-mail og adgangskode påkrævet", fi:"Sähköposti ja salasana vaaditaan" },

  // ── Splash ──
  "splash.tap":      { tr:"Devam etmek için dokun", en:"Tap to continue", de:"Zum Fortfahren tippen", da:"Tryk for at fortsætte", fi:"Napauta jatkaaksesi" },
  "splash.motto1":   { tr:"Kendi destanını yaz.", en:"Write your own epic.", de:"Schreib dein eigenes Epos.", da:"Skriv dit eget epos.", fi:"Kirjoita oma eepoksesi." },
  "splash.motto2":   { tr:"Write your own epic.", en:"Write your own epic.", de:"Write your own epic.", da:"Write your own epic.", fi:"Write your own epic." },

  // ── Common ──
  "common.save":     { tr:"Kaydet", en:"Save", de:"Speichern", da:"Gem", fi:"Tallenna" },
  "common.cancel":   { tr:"İptal", en:"Cancel", de:"Abbrechen", da:"Annuller", fi:"Peruuta" },
  "common.delete":   { tr:"Sil", en:"Delete", de:"Löschen", da:"Slet", fi:"Poista" },
  "common.edit":     { tr:"Düzenle", en:"Edit", de:"Bearbeiten", da:"Rediger", fi:"Muokkaa" },
  "common.add":      { tr:"Ekle", en:"Add", de:"Hinzufügen", da:"Tilføj", fi:"Lisää" },
  "common.search":   { tr:"Ara...", en:"Search...", de:"Suchen...", da:"Søg...", fi:"Hae..." },
  "common.back":     { tr:"Geri", en:"Back", de:"Zurück", da:"Tilbage", fi:"Takaisin" },
  "common.error":    { tr:"Hata", en:"Error", de:"Fehler", da:"Fejl", fi:"Virhe" },
  "common.descOpt":  { tr:"Açıklama (opsiyonel)...", en:"Description (optional)...", de:"Beschreibung (optional)...", da:"Beskrivelse (valgfri)...", fi:"Kuvaus (valinnainen)..." },

  // ── Day/month names ──
  "months": { tr:["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"], en:["January","February","March","April","May","June","July","August","September","October","November","December"], de:["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"], da:["Januar","Februar","Marts","April","Maj","Juni","Juli","August","September","Oktober","November","December"], fi:["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu","Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"] },
  "days": { tr:["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"], en:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], de:["Mo","Di","Mi","Do","Fr","Sa","So"], da:["Man","Tir","Ons","Tor","Fre","Lør","Søn"], fi:["Ma","Ti","Ke","To","Pe","La","Su"] },


  // ── Style Lookbook ──
  "style.title":       { tr:"Stilim", en:"My Style", de:"Mein Stil", da:"Min Stil", fi:"Tyylini" },
  "style.weather":     { tr:"Bugünün Havası", en:"Today's Weather", de:"Heutiges Wetter", da:"Dagens vejr", fi:"Tämän päivän sää" },
  "style.sugLooks":    { tr:"Önerilen Kombinler", en:"Suggested Looks", de:"Vorgeschlagene Looks", da:"Foreslåede looks", fi:"Ehdotetut asut" },
  "style.rules":       { tr:"Stil Kurallarım", en:"My Style Rules", de:"Meine Stilregeln", da:"Mine stilregler", fi:"Tyylisääntöni" },
  "style.palette":     { tr:"Renk Paletim", en:"My Color Palette", de:"Meine Farbpalette", da:"Min farvepalet", fi:"Väripalettini" },
  "style.addLook":     { tr:"Yeni Kombin / Kural", en:"New Look / Rule", de:"Neuer Look / Regel", da:"Nyt look / Regel", fi:"Uusi asu / Sääntö" },
  "style.wearFreq":    { tr:"Giyim Sıklığı", en:"Wear Frequency", de:"Tragehäufigkeit", da:"Brugsfrekvens", fi:"Käyttötiheys" },
  "style.workOk":      { tr:"İş Yerine Uygun", en:"Workplace Appropriate", de:"Bürotauglich", da:"Arbejdsvenlig", fi:"Työpaikalle sopiva" },
  "style.sustainable": { tr:"Sürdürülebilir Palet", en:"Sustainable Palette", de:"Nachhaltige Palette", da:"Bæredygtig palette", fi:"Kestävä paletti" },
  "style.noPurchase":  { tr:"Bu Ay Alışveriş Yok", en:"No Purchases This Month", de:"Keine Einkäufe diesen Monat", da:"Ingen køb denne måned", fi:"Ei ostoksia tässä kuussa" },
  "style.occasion":    { tr:"Ortam", en:"Occasion", de:"Anlass", da:"Lejlighed", fi:"Tilaisuus" },
  "style.mood":        { tr:"Ruh Hali", en:"Mood", de:"Stimmung", da:"Humør", fi:"Tunnelma" },
  "style.idealWeather":{ tr:"İdeal Hava", en:"Ideal Weather", de:"Ideales Wetter", da:"Ideelt vejr", fi:"Ihannesää" },
  "style.casual":      { tr:"Günlük", en:"Casual", de:"Lässig", da:"Afslappet", fi:"Rento" },
  "style.work":        { tr:"İş", en:"Work", de:"Arbeit", da:"Arbejde", fi:"Työ" },
  "style.night":       { tr:"Gece", en:"Night Out", de:"Abend", da:"Aften", fi:"Ilta" },
  "style.confident":   { tr:"Özgüvenli", en:"Confident", de:"Selbstbewusst", da:"Selvsikker", fi:"Itsevarma" },
  "style.relaxed":     { tr:"Rahat", en:"Relaxed", de:"Entspannt", da:"Afslappet", fi:"Rento" },
  "style.elegant":     { tr:"Şık", en:"Elegant", de:"Elegant", da:"Elegant", fi:"Elegantti" },
  "style.savedLooks":  { tr:"Kayıtlı Kombinler", en:"Saved Looks", de:"Gespeicherte Looks", da:"Gemte looks", fi:"Tallennetut asut" },
  "style.noLooks":     { tr:"Henüz kombin eklenmemiş", en:"No looks added yet", de:"Noch keine Looks", da:"Ingen looks endnu", fi:"Ei asuja vielä" },

  // ── News room ──
  "news.politics":  { tr:"Politika", en:"Politics", de:"Politik", da:"Politik", fi:"Politiikka" },
  "news.health":    { tr:"Sağlık", en:"Health", de:"Gesundheit", da:"Sundhed", fi:"Terveys" },
  "news.world":     { tr:"Dünya", en:"World", de:"Welt", da:"Verden", fi:"Maailma" },
  "news.allCat":    { tr:"Tümü", en:"All", de:"Alle", da:"Alle", fi:"Kaikki" },
  "news.goToNews":  { tr:"Habere git", en:"Go to article", de:"Zum Artikel", da:"Gå til artikel", fi:"Siirry artikkeliin" },

  // ── Music room ──
  "music.addLink":   { tr:"Link Ekle", en:"Add Link", de:"Link hinzufügen", da:"Tilføj link", fi:"Lisää linkki" },
  "music.platform":  { tr:"Müzik", en:"Music", de:"Musik", da:"Musik", fi:"Musiikki" },
  "music.howTo":     { tr:"Nasıl kullanılır?", en:"How to use?", de:"Wie benutzen?", da:"Hvordan bruger man?", fi:"Kuinka käyttää?" },
  "music.addToCol":  { tr:"Koleksiyona Ekle", en:"Add to Collection", de:"Zur Sammlung hinzufügen", da:"Tilføj til samling", fi:"Lisää kokoelmaan" },
};

/* Translation helper — t("key", lang) returns localized string */
const t = (key, lang = "tr") => {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] || entry["en"] || entry["tr"] || key;
};

/* Locale code for date formatting */
const LOCALE_MAP = { tr:"tr-TR", en:"en-US", de:"de-DE", da:"da-DK", fi:"fi-FI" };

/* ── Constants ── */
const getTabs = (lang) => [
  { id: "dashboard", label: t("tab.home", lang), icon: "⌂" },
  { id: "tasks", label: t("tab.tasks", lang), icon: "✓" },
  { id: "calendar", label: t("tab.calendar", lang), icon: "◫" },
  { id: "sports", label: t("tab.health", lang), icon: "♦" },
  { id: "projects", label: t("tab.style", lang), icon: "◈" },
  { id: "notes", label: t("tab.notes", lang), icon: "☰" },
];

const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
const SPORT_EMOJI = {"Koşu":"🏃","Yüzme":"🏊","Bisiklet":"🚴","Yoga":"🧘","Ağırlık":"🏋️","Yürüyüş":"🚶","Diğer":"⚡"};
// MET × 70kg × (duration/60) → kcal
const SPORT_KCAL_PER_MIN = {"Koşu":10,"Yüzme":7,"Bisiklet":7,"Yoga":3.3,"Ağırlık":5,"Yürüyüş":4.7,"Diğer":5};
const calcSportCal = (type, durationMin) => Math.round((SPORT_KCAL_PER_MIN[type]||5) * (+durationMin||0));
const getPriorities = (lang="tr") => ({ high: t("pri.high",lang), medium: t("pri.medium",lang), low: t("pri.low",lang) });
const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const PCOL = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const getProjectStatuses = (lang="tr") => [t("proj.planning",lang),t("proj.inProgress",lang),t("proj.testing",lang),t("proj.completed",lang)];
const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
const statusDisplay = (s, lang="tr") => {
  const idx = PROJECT_STATUSES.indexOf(s);
  return idx >= 0 ? getProjectStatuses(lang)[idx] : s;
};
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7","#f97316","#14b8a6"];

const getDefaultRooms = (lang="tr") => [
  { id: "projects", name: t("proj.projects",lang), icon: "📂", color: "#3b82f6", type: "project" },
  { id: "news", name: t("proj.news",lang), icon: "📰", color: "#ef4444", type: "news" },
  { id: "music", name: t("proj.myMusic",lang), icon: "🎵", color: "#a855f7", type: "collection" },
  { id: "clothes", name: t("proj.myStyle",lang), icon: "✨", color: "#f97316", type: "style" },
  { id: "memories", name: t("proj.memories",lang), icon: "📸", color: "#22c55e", type: "collection" },
];

const COMMON_FOODS = {
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
const getMN = (lang="tr") => t("months",lang);
const MN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const getDN = (lang="tr") => t("days",lang);
const DN = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

const today = () => new Date().toISOString().split("T")[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* ── Nebula Background: splash & login ortak arka plan ── */
const NEBULA_KEYFRAMES = `
  @keyframes nebulaShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes starFloat {
    0%,100% { opacity:.2; transform:translateY(0) scale(1); }
    50%     { opacity:1;  transform:translateY(-8px) scale(1.3); }
  }
  @keyframes glowPulse {
    0%,100% { text-shadow: 0 0 40px rgba(99,102,241,0.4), 0 0 80px rgba(99,102,241,0.15); }
    50%     { text-shadow: 0 0 60px rgba(99,102,241,0.6), 0 0 120px rgba(168,85,247,0.25); }
  }
  @keyframes fadeInUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes shimmer   { 0%{opacity:.4} 50%{opacity:1} 100%{opacity:.4} }
`;

function NebulaBackground({ children, onClick, style }) {
  return (
    <div onClick={onClick} style={{
      minHeight:"100vh", minHeight:"100dvh",
      background:"radial-gradient(ellipse at 20% 50%, #1a0533 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0c1445 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, #1e0a2e 0%, transparent 50%), #060611",
      backgroundSize:"200% 200%",
      animation:"nebulaShift 20s ease-in-out infinite",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#e8e4f0", fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      flexDirection:"column", overflow:"hidden", position:"relative",
      ...style,
    }}>
      {/* Floating stars */}
      {[...Array(18)].map((_,i) => (
        <div key={i} style={{
          position:"absolute",
          width: 2 + Math.random()*3,
          height: 2 + Math.random()*3,
          borderRadius:"50%",
          background: i%3===0 ? "#a78bfa" : i%3===1 ? "#6366f1" : "#e0d5f5",
          left: `${5 + Math.random()*90}%`,
          top: `${5 + Math.random()*90}%`,
          animation: `starFloat ${2.5 + Math.random()*3}s ease-in-out ${Math.random()*3}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}
      {children}
    </div>
  );
}

/* ── Hooks ── */
function useIsMobile() {
  const [m, setM] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setM(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return m;
}

/* ── Styles ── */
const inp = {
  width:"100%",
  background:"rgba(255,255,255,0.06)",
  backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",
  border:"1px solid rgba(255,255,255,0.1)",
  borderRadius:12,padding:"12px 14px",color:"#e0e0e0",fontSize:15,
  marginBottom:10,outline:"none",boxSizing:"border-box",WebkitAppearance:"none",
};
const btnPrimary = {
  width:"100%",background:"linear-gradient(135deg,#3b82f6,#6366f1)",
  color:"#fff",border:"none",borderRadius:12,
  padding:"14px",cursor:"pointer",fontSize:15,fontWeight:600,marginTop:4,
  boxShadow:"0 4px 20px rgba(99,102,241,0.4)",
  transition:"box-shadow .2s, transform .1s",
};
const addBtnStyle = {
  background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,
  padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",
};
const filterBtnStyle = (active) => ({
  background: active ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
  color: active ? "#3b82f6" : "#888",
  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
  padding:"7px 14px",borderRadius:20,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
  fontWeight: active ? 600 : 400,
});
const cardStyle = {
  background:"rgba(255,255,255,0.04)",
  backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
  borderRadius:16,padding:"14px 16px",marginBottom:8,
  border:"1px solid rgba(255,255,255,0.07)",
  boxShadow:"0 4px 24px rgba(0,0,0,0.3)",
};
/* Glow card helper: cardStyle + colored glow border */
const glowCard = (color) => ({
  ...cardStyle,
  border:`1px solid ${color}40`,
  boxShadow:`0 0 20px ${color}22, 0 4px 24px rgba(0,0,0,0.35), inset 0 0 20px ${color}08`,
});
const delBtnStyle = {
  background:"rgba(255,255,255,0.06)",
  border:"1px solid rgba(255,255,255,0.08)",
  color:"#666",fontSize:14,
  cursor:"pointer",padding:0,width:32,height:32,borderRadius:8,
  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
  backdropFilter:"blur(4px)",
};
const sectionHeader = {
  display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,
};
const checkBtnStyle = (done) => ({
  width:28,height:28,borderRadius:8,border:`2px solid ${done?"#22c55e":"rgba(255,255,255,0.15)"}`,
  background:done?"#22c55e":"transparent",color:"#fff",cursor:"pointer",
  display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,
  flexShrink:0,padding:0,transition:"all .2s",
  animation:done?"checkPop .3s ease":undefined,
});

/* ── Modal ── */
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:9999,
      padding:0,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"rgba(255,255,255,0.04)",width:"100%",maxWidth:480,
        maxHeight:"85dvh",
        borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column",
        animation:"slideUp .25s ease",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.07)",
          flexShrink:0,
        }}>
          <h3 style={{margin:0,fontSize:16,fontWeight:700}}>{title}</h3>
          <button onClick={onClose} style={{
            background:"rgba(255,255,255,0.08)",border:"none",color:"#aaa",
            width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        </div>
        <div style={{
          padding:"16px 20px 32px",
          overflow:"auto",
          WebkitOverflowScrolling:"touch",
          flex:1,
        }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Toast ── */
function Toast({ message, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",
      background:"#22c55e",color:"#fff",padding:"10px 20px",borderRadius:12,
      fontSize:14,fontWeight:600,zIndex:10000,animation:"slideDown .3s ease",
      boxShadow:"0 4px 20px rgba(0,0,0,0.3)",
    }}>{message}</div>
  );
}


/* ── Shared UI helpers ── */

function StickyHeader({ children }) {
  return (
    <div style={{
      position:"sticky",top:0,zIndex:50,
      background:"rgba(6,6,17,0.85)",
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      marginLeft:-16,marginRight:-16,
      padding:"14px 16px 12px",
      borderBottom:"1px solid rgba(255,255,255,0.08)",
      marginBottom:14,
    }}>
      {children}
    </div>
  );
}

function GroupLabel({ label, count, color }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:6,
      fontSize:11,fontWeight:700,color:"#666",
      textTransform:"uppercase",letterSpacing:".07em",
      marginBottom:8,marginTop:4,
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
      {count != null && <span style={{opacity:.6}}>({count})</span>}
    </div>
  );
}

function FAB({ onClick, color="#3b82f6" }) {
  return (
    <button
      onClick={onClick}
      style={{
        position:"fixed",right:20,bottom:100,
        width:56,height:56,borderRadius:"50%",
        background:`linear-gradient(135deg,${color}dd,${color}88)`,color:"#fff",border:`1px solid ${color}55`,
        fontSize:28,fontWeight:300,lineHeight:1,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:`0 0 0 1px ${color}30, 0 4px 24px ${color}66, 0 0 50px ${color}33`,
        zIndex:900,transition:"transform .1s, box-shadow .2s",
      }}
      onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"}
      onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}
      onTouchStart={e=>e.currentTarget.style.transform="scale(0.93)"}
      onTouchEnd={e=>e.currentTarget.style.transform="scale(1)"}
    >+</button>
  );
}

/* ═══════════ DASHBOARD ═══════════ */
function Dashboard({ data, setTab, update, lang }) {
  const tdy = today();
  const foods = data.foods || [];
  const rooms = data.rooms || [...getDefaultRooms(lang)];
  const roomItems = data.roomItems || {};

  // ── Task calculations ──
  const allTasks = data.tasks || [];
  const todayTasks = allTasks.filter(x => x.dueDate === tdy);
  const todayDone = todayTasks.filter(x => x.done).length;
  const todayTotal = todayTasks.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const pending = allTasks.filter(x => !x.done).length;
  const overdue = allTasks.filter(x => !x.done && x.dueDate && x.dueDate < tdy).length;
  const urgentTasks = allTasks
    .filter(x => !x.done && (x.dueDate === tdy || x.dueDate === "" || !x.dueDate || x.dueDate <= tdy))
    .sort((a, b) => {
      // Overdue first, then by priority
      const aOver = a.dueDate && a.dueDate < tdy ? -1 : 0;
      const bOver = b.dueDate && b.dueDate < tdy ? -1 : 0;
      if (aOver !== bOver) return aOver - bOver;
      const po = { high: 0, medium: 1, low: 2 };
      return (po[a.priority] || 1) - (po[b.priority] || 1);
    });

  // ── Streak calculation ──
  const calcStreak = () => {
    let streak = 0;
    const d = new Date();
    // Start from yesterday (today is still in progress)
    d.setDate(d.getDate() - 1);
    while (true) {
      const dateStr = d.toISOString().split("T")[0];
      const dayTasks = allTasks.filter(x => x.dueDate === dateStr);
      if (dayTasks.length === 0) { d.setDate(d.getDate() - 1); if (streak === 0) continue; else break; }
      const allDone = dayTasks.every(x => x.done);
      if (allDone) { streak++; d.setDate(d.getDate() - 1); }
      else break;
      if (streak > 365) break; // safety
    }
    // If today's tasks are all done, add today
    if (todayTotal > 0 && todayDone === todayTotal) streak++;
    return streak;
  };
  const streak = calcStreak();

  // ── Events ──
  const todayEv = data.events.filter(e => e.date === tdy);
  const upcoming = data.events.filter(e => e.date >= tdy).sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "")).slice(0, 5);

  // ── Sports & food ──
  const wkSport = data.sports.filter(s => { const d = (new Date() - new Date(s.date)) / 864e5; return d >= 0 && d <= 7; });
  const wkMin = wkSport.reduce((a, s) => a + (s.duration || 0), 0);
  const wkBurned = wkSport.reduce((a, s) => a + (s.calories || 0), 0);
  const todayFoods = foods.filter(f => f.date === tdy);
  const todayCalIn = todayFoods.reduce((a, f) => a + (f.calories || 0), 0);
  const todayCalOut = data.sports.filter(s => s.date === tdy).reduce((a, s) => a + (s.calories || 0), 0);

  // ── Timeline: merge events + due tasks chronologically ──
  const timelineItems = [
    ...todayEv.map(e => ({ type: "event", id: e.id, title: e.title, time: e.time || "", color: e.color || "#a855f7", done: false })),
    ...todayTasks.map(tk => ({ type: "task", id: tk.id, title: tk.title, time: tk.dueTime || "", color: PCOL[tk.priority] || "#888", done: tk.done, priority: tk.priority })),
  ].sort((a, b) => {
    // Items with time first, sorted by time; then items without time
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return 0;
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greet.morning",lang) : hour < 18 ? t("greet.afternoon",lang) : t("greet.evening",lang);

  // ── Daily thoughts ──
  const thoughts = data.dailyThoughts || ["", "", ""];
  const updateThought = (i, val) => {
    const next = [...thoughts];
    next[i] = val;
    update({ ...data, dailyThoughts: next });
  };

  // ── Quick toggle task from dashboard ──
  const toggleTask = (id) => {
    update({ ...data, tasks: data.tasks.map(tk => tk.id === id ? { ...tk, done: !tk.done } : tk) });
  };

  // ── Quick add task ──
  const [quickTask, setQuickTask] = useState("");
  const addQuickTask = () => {
    if (!quickTask.trim()) return;
    update({ ...data, tasks: [{ id: uid(), title: quickTask.trim(), priority: "medium", dueDate: tdy, done: false, createdAt: tdy }, ...data.tasks] });
    setQuickTask("");
  };

  // ── Live news ──
  const [headlines, setHeadlines] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function fetchHeadlines() {
      try {
        const url = "https://www.bbc.com/turkce/index.xml";
        const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
          || await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
        if (!res || !res.ok) return;
        const text = res.url?.includes("allorigins") ? JSON.parse(await res.text()).contents : await res.text();
        const titles = [...text.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>|<title>([^<]+)<\/title>/g)]
          .slice(1, 6)
          .map(m => (m[1] || m[2] || "").trim())
          .filter(t => t.length > 5);
        if (!cancelled) setHeadlines(titles);
      } catch {}
    }
    fetchHeadlines();
    return () => { cancelled = true; };
  }, []);

  const musicItems = (data.roomItems || {})["music"] || [];

  return (
    <div>
      {/* ══ HERO — Greeting + Date + Streak ══ */}
      <div style={{
        background: "linear-gradient(135deg,rgba(26,36,72,0.9) 0%,rgba(28,28,46,0.7) 60%,rgba(31,26,46,0.9) 100%)",
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderRadius: 20, padding: "20px 18px 18px", marginBottom: 14,
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 40px rgba(59,130,246,0.08), 0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 23, fontWeight: 800, letterSpacing: -.5 }}>{greeting}! 👋</h2>
            <p style={{ margin: "4px 0 0", opacity: .45, fontSize: 13 }}>
              {new Date().toLocaleDateString(LOCALE_MAP[lang]||"tr-TR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          {streak > 0 && (
            <div style={{
              background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))",
              border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14,
              padding: "6px 12px", textAlign: "center", minWidth: 56,
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>{streak}🔥</div>
              <div style={{ fontSize: 9, color: "#f59e0b", opacity: .7 }}>gün seri</div>
            </div>
          )}
        </div>

        {/* ── Today's Progress Bar ── */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, opacity: .6 }}>Bugünün İlerlemesi</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: todayProgress === 100 ? "#22c55e" : "#3b82f6" }}>
              {todayTotal > 0 ? `${todayDone}/${todayTotal}` : t("dash.noTasks",lang)}
            </span>
          </div>
          <div style={{
            height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)",
            overflow: "hidden", position: "relative",
          }}>
            <div style={{
              height: "100%", borderRadius: 4,
              background: todayProgress === 100
                ? "linear-gradient(90deg,#22c55e,#16a34a)"
                : "linear-gradient(90deg,#3b82f6,#6366f1)",
              width: `${todayProgress}%`,
              transition: "width .5s cubic-bezier(.4,0,.2,1)",
              boxShadow: todayProgress > 0 ? `0 0 12px ${todayProgress === 100 ? "rgba(34,197,94,0.4)" : "rgba(59,130,246,0.4)"}` : "none",
            }} />
          </div>
          {todayProgress === 100 && todayTotal > 0 && (
            <div style={{ fontSize: 11, color: "#22c55e", marginTop: 6, textAlign: "center", fontWeight: 600 }}>
              ✨ {t("dash.allDone",lang)}
            </div>
          )}
        </div>

        {/* ── Mini stat cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 14 }}>
          {[
            { label: t("dash.pending",lang), val: pending, color: "#3b82f6", tab: "tasks" },
            { label: t("dash.overdue",lang), val: overdue, color: "#ef4444", tab: "tasks" },
            { label: t("dash.kcal",lang), val: todayCalIn, color: "#f97316", tab: "sports" },
            { label: t("dash.event",lang), val: todayEv.length, color: "#a855f7", tab: "calendar" },
          ].map(s => (
            <div key={s.label} onClick={() => setTab(s.tab)} style={{
              background: `linear-gradient(135deg,${s.color}18,${s.color}08)`,
              borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "center",
              border: `1px solid ${s.color}30`,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.val > 0 ? s.color : "rgba(255,255,255,0.2)", letterSpacing: -.5 }}>{s.val}</div>
              <div style={{ fontSize: 9, color: s.color, opacity: .7, marginTop: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ QUICK ADD TASK ══ */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 14,
      }}>
        <input
          value={quickTask}
          onChange={e => setQuickTask(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addQuickTask()}
          placeholder={t("dash.quickAdd",lang)}
          style={{
            ...inp, flex: 1, borderRadius: 14,
            border: "1px solid rgba(59,130,246,0.2)",
            background: "rgba(59,130,246,0.06)",
            fontSize: 13,
          }}
        />
        <button onClick={addQuickTask} style={{
          background: "linear-gradient(135deg,#3b82f6,#6366f1)",
          border: "none", borderRadius: 14, padding: "0 18px",
          color: "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer",
          flexShrink: 0,
        }}>+</button>
      </div>

      {/* ══ OVERDUE WARNING ══ */}
      {overdue > 0 && (
        <div onClick={() => setTab("tasks")} style={{
          background: "rgba(239,68,68,0.08)", backdropFilter: "blur(8px)", border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 14, padding: "12px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
        }}>
          <span style={{ fontSize: 18 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#ef4444" }}>{overdue} {t("dash.overdueWarn",lang)}</div>
            <div style={{ fontSize: 11, opacity: .5 }}>Hemen kontrol et</div>
          </div>
          <span style={{ fontSize: 14, opacity: .3 }}>▶</span>
        </div>
      )}

      {/* ══ TODAY'S TIMELINE — tasks + events chronologically ══ */}
      {timelineItems.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Bugünün Akışı
          </div>
          <div style={{ position: "relative", paddingLeft: 18 }}>
            {/* Timeline line */}
            <div style={{
              position: "absolute", left: 5, top: 4, bottom: 4, width: 2,
              background: "linear-gradient(180deg,rgba(99,102,241,0.4),rgba(99,102,241,0.1))",
              borderRadius: 1,
            }} />
            {timelineItems.map((item, i) => (
              <div key={item.id} style={{
                position: "relative", marginBottom: i < timelineItems.length - 1 ? 6 : 0,
              }}>
                {/* Dot */}
                <div style={{
                  position: "absolute", left: -16, top: 14, width: 10, height: 10,
                  borderRadius: "50%",
                  background: item.done ? "#22c55e" : item.color,
                  border: `2px solid ${item.done ? "#22c55e" : item.color}`,
                  opacity: item.done ? .6 : 1,
                  boxShadow: item.done ? "none" : `0 0 8px ${item.color}40`,
                }} />
                <div
                  onClick={() => item.type === "task" ? toggleTask(item.id) : setTab("calendar")}
                  style={{
                    ...cardStyle, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                    border: `1px solid ${item.done ? "rgba(34,197,94,0.15)" : item.color + "20"}`,
                    opacity: item.done ? .5 : 1,
                    transition: "all .2s",
                  }}>
                  {/* Checkbox or event icon */}
                  {item.type === "task" ? (
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      border: item.done ? "none" : `2px solid ${item.color}60`,
                      background: item.done ? "#22c55e" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all .2s",
                    }}>
                      {item.done && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                    </div>
                  ) : (
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      background: `${item.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontSize: 11,
                    }}>📅</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, fontWeight: 600,
                      textDecoration: item.done ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{item.title}</div>
                    <div style={{ fontSize: 10, opacity: .4, marginTop: 2 }}>
                      {item.type === "task" ? t("dash.task",lang) : t("dash.event",lang)}
                      {item.time && ` · ${item.time}`}
                      {item.priority && ` · ${getPriorities(lang)[item.priority]}`}
                    </div>
                  </div>
                  {item.type === "task" && !item.done && (
                    <div style={{ fontSize: 10, opacity: .25, flexShrink: 0 }}>tıkla ✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ UPCOMING TASKS (not today, next 7 days) ══ */}
      {(() => {
        const nextDays = allTasks.filter(x => !x.done && x.dueDate && x.dueDate > tdy && x.dueDate <= (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })());
        if (nextDays.length === 0) return null;
        return (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>
              {t("dash.next7",lang)} ({nextDays.length} {t("dash.task",lang)})
            </div>
            {nextDays.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5).map(tk => (
              <div key={tk.id} onClick={() => toggleTask(tk.id)} style={{
                ...cardStyle, padding: "11px 14px", marginBottom: 5,
                display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                border: `1px solid ${PCOL[tk.priority] || "#888"}15`,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 6,
                  border: `2px solid ${PCOL[tk.priority] || "#888"}50`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tk.title}</div>
                  <div style={{ fontSize: 10, opacity: .4, marginTop: 1 }}>
                    {new Date(tk.dueDate).toLocaleDateString(LOCALE_MAP[lang]||"tr-TR", { weekday: "short", day: "numeric", month: "short" })}
                    {tk.priority && ` · ${getPriorities(lang)[tk.priority]}`}
                  </div>
                </div>
              </div>
            ))}
            {nextDays.length > 5 && (
              <button onClick={() => setTab("tasks")} style={{
                background: "none", border: "none", color: "#6366f1", fontSize: 12,
                cursor: "pointer", fontWeight: 600, padding: "6px 0", width: "100%", textAlign: "center",
              }}>+{nextDays.length - 5} görev daha → Tümünü gör</button>
            )}
          </div>
        );
      })()}

      {/* ══ THIS WEEK STATS ══ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>{t("dash.thisWeek",lang)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {[
            { val: wkSport.length, label: t("dash.workout",lang), color: "#3b82f6" },
            { val: wkBurned, label: t("dash.kcalBurned",lang), color: "#ef4444" },
            { val: allTasks.filter(x => x.done).length, label: t("dash.tasksDone",lang), color: "#22c55e" },
          ].map((s, i) => (
            <div key={i} style={{
              background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14,
              padding: "12px 10px", textAlign: "center",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: -.5 }}>{s.val}</div>
              <div style={{ fontSize: 10, opacity: .4, marginTop: 3, lineHeight: 1.2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ KAFAMDAKILER ══ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 8 }}>☁️ {t("dash.thoughts",lang)}</div>
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "12px 14px", border: "1px solid rgba(20,184,166,0.2)" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
              <span style={{ fontSize: 13, opacity: .35, flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
              <input
                value={thoughts[i] || ""}
                onChange={e => updateThought(i, e.target.value)}
                placeholder={["Bugün en çok düşündüğüm şey...", "Kafamı karıştıran bir şey...", "Çözmek istediğim bir sorun..."][i]}
                style={{
                  flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10, padding: "9px 12px", color: "#e0e0e0", fontSize: 13, outline: "none",
                  WebkitAppearance: "none", boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ══ COMPACT NEWS ══ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em" }}>📰 {t("dash.news",lang)}</div>
          <button onClick={() => setTab("projects")} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>{t("dash.allLabel",lang)}</button>
        </div>
        <div style={{ background: "rgba(239,68,68,0.05)", borderRadius: 14, padding: "10px 14px", border: "1px solid rgba(239,68,68,0.12)" }}>
          {headlines.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: .4, fontSize: 12 }}>
              <span style={{ animation: "pulse 1.5s infinite" }}>📡</span> Yükleniyor...
            </div>
          ) : headlines.slice(0, 3).map((title, i) => (
            <div key={i} style={{
              fontSize: 12, lineHeight: 1.4, opacity: .8,
              paddingBottom: i < 2 ? 6 : 0, marginBottom: i < 2 ? 6 : 0,
              borderBottom: i < 2 ? "1px solid rgba(239,68,68,0.08)" : "none",
            }}>
              <span style={{ color: "#ef4444", fontWeight: 700, marginRight: 6, fontSize: 10 }}>{i + 1}</span>{title}
            </div>
          ))}
        </div>
      </div>

      {/* ══ COMPACT MUSIC ══ */}
      {musicItems.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em" }}>🎵 {t("dash.music",lang)}</div>
            <button onClick={() => setTab("projects")} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Tümü ▶</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
            {musicItems.slice(0, 5).map((item, i) => (
              <div key={item.id || i}
                onClick={() => item.link && window.open(item.link, "_blank")}
                style={{
                  background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12,
                  padding: "8px 10px", minWidth: 100, maxWidth: 120, flexShrink: 0, cursor: "pointer",
                }}>
                <div style={{ fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || "Parça"}</div>
                {item.artist && <div style={{ fontSize: 9, opacity: .4, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.artist}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RECENT NOTES ══ */}
      {data.notes.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em" }}>{t("dash.recentNotes",lang)}</div>
            <button onClick={() => setTab("notes")} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Tümü ▶</button>
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
            {data.notes.slice(0, 5).map(n => (
              <div key={n.id} onClick={() => setTab("notes")} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "10px 12px",
                minWidth: 130, maxWidth: 160, cursor: "pointer", flexShrink: 0,
                borderTop: `3px solid ${n.color || "#14b8a6"}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                {n.content && <div style={{ fontSize: 11, opacity: .4, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4 }}>{n.content}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
function Tasks({ data, update, lang="tr" }) {
  const [modal,setModal]=useState(false);
  const [filter,setFilter]=useState("all");
  const [editingId,setEditingId]=useState(null);
  const [detail,setDetail]=useState(null);
  const emptyForm = {title:"",priority:"medium",dueDate:"",category:"",description:""};
  const [form,setForm]=useState(emptyForm);

  const openNew=()=>{setEditingId(null);setForm(emptyForm);setModal(true);};
  const openEdit=(task)=>{
    setEditingId(task.id);
    setForm({title:task.title,priority:task.priority,dueDate:task.dueDate||"",category:task.category||"",description:task.description||""});
    setModal(true);setDetail(null);
  };

  const save=()=>{
    if(!form.title.trim())return;
    if(editingId){
      update({...data,tasks:data.tasks.map(t=>t.id===editingId?{...t,...form}:t)});
    } else {
      update({...data,tasks:[{id:uid(),...form,done:false,createdAt:today()},...data.tasks]});
    }
    setModal(false);setForm(emptyForm);setEditingId(null);
  };
  const toggle=id=>update({...data,tasks:data.tasks.map(t=>t.id===id?{...t,done:!t.done}:t)});
  const del=id=>{update({...data,tasks:data.tasks.filter(t=>t.id!==id)});setDetail(null);};

  const tdy = today();
  const tomorrow = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
  const nextWeek = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };
  const nextMonth = ()=>{ const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split("T")[0]; };
  const weekEnd = nextWeek();

  const quickDates = [
    {label:t("tasks.today",lang),val:tdy,icon:"📌"},
    {label:t("tasks.tomorrow",lang),val:tomorrow(),icon:"⏭"},
    {label:"1 Hafta",val:weekEnd,icon:"📅"},
    {label:"1 Ay",val:nextMonth(),icon:"🗓"},
  ];

  const formatDate = (d) => {
    if(!d) return "";
    if(d===tdy) return t("tasks.today",lang);
    if(d===tomorrow()) return t("tasks.tomorrow",lang);
    return new Date(d).toLocaleDateString(LOCALE_MAP[lang]||"tr-TR",{day:"numeric",month:"short"});
  };

  const pending = data.tasks.filter(x=>!x.done).length;

  const list = data.tasks.filter(task=>{
    if(filter==="done")return task.done;
    if(filter==="pending")return !task.done;
    if(filter==="high")return task.priority==="high"&&!task.done;
    if(filter==="overdue")return !task.done && task.dueDate && task.dueDate < tdy;
    return true;
  });

  const groups = filter==="all" ? [
    {key:"overdue",label:t("tasks.overdueGrp",lang),color:"#ef4444",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate<t)},
    {key:"today",label:t("tasks.today",lang),color:"#3b82f6",tasks:list.filter(x=>!x.done&&x.dueDate===t)},
    {key:"week",label:t("tasks.weekGrp",lang),color:"#a855f7",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate>t&&x.dueDate<=weekEnd)},
    {key:"pending",label:t("tasks.pendingGrp",lang),color:"#888",tasks:list.filter(x=>!x.done&&(!x.dueDate||x.dueDate>weekEnd))},
    {key:"done",label:t("tasks.doneGrp",lang),color:"#22c55e",tasks:list.filter(x=>x.done)},
  ].filter(g=>g.tasks.length>0) : null;

  const TaskCard = ({ task }) => (
    <div style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52,opacity:task.done?.5:1,
      border:`1px solid ${task.done?"rgba(34,197,94,0.15)":PCOL[task.priority]+"20"}`,
      boxShadow:task.done?"none":`0 0 16px ${PCOL[task.priority]}12`,
    }}>
      <button onClick={()=>toggle(task.id)} style={checkBtnStyle(task.done)}>{task.done&&"✓"}</button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setDetail(detail===task.id?null:task.id)}>
        <div style={{fontSize:15,fontWeight:600,textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
          {task.priority&&<span style={{background:`${PCOL[task.priority]}20`,color:PCOL[task.priority],padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600}}>{getPriorities(lang)[task.priority]}</span>}
          {task.category&&<span style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontSize:11}}>{task.category}</span>}
          {task.dueDate&&<span style={{fontSize:11,color:!task.done&&task.dueDate<t?"#ef4444":"#666"}}>{formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <button onClick={()=>del(task.id)} style={delBtnStyle}>✕</button>
    </div>
  );

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Görevler</h3>
          <span style={{fontSize:12,opacity:.4,fontWeight:500}}>{pending} bekliyor</span>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
          {[["all",t("tasks.all",lang)],["pending",t("tasks.pending",lang)],["done",t("tasks.done",lang)],["high",t("tasks.priority",lang)],["overdue",t("tasks.overdue",lang)]].map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} style={filterBtnStyle(filter===k)}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {groups ? (
        groups.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Tüm görevler tamamlandı!</div>
              <div style={{fontSize:12,opacity:.25}}>+ ile yeni görev ekle</div>
            </div>
          )
          : groups.map(group=>(
            <div key={group.key} style={{marginBottom:16}}>
              <GroupLabel label={group.label} count={group.tasks.length} color={group.color}/>
              {group.tasks.map(task=><TaskCard key={task.id} task={task}/>)}
            </div>
          ))
      ) : (
        list.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{fontSize:40,marginBottom:8}}>✅</div>
              <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Tüm görevler tamamlandı!</div>
              <div style={{fontSize:12,opacity:.25}}>+ ile yeni görev ekle</div>
            </div>
          )
          : list.map(task=><TaskCard key={task.id} task={task}/>)
      )}

      {detail && (() => {
        const task = data.tasks.find(tk=>tk.id===detail);
        if(!task) return null;
        return (
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:16,marginTop:8,border:"1px solid rgba(59,130,246,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:16,fontWeight:700}}>{task.title}</h4>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>openEdit(task)} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>{t("tasks.editBtn",lang)}</button>
                <button onClick={()=>setDetail(null)} style={{background:"rgba(255,255,255,0.06)",color:"#888",border:"none",borderRadius:8,padding:"6px 10px",fontSize:14,cursor:"pointer"}}>✕</button>
              </div>
            </div>
            {task.description&&<p style={{fontSize:13,opacity:.7,margin:"0 0 10px",whiteSpace:"pre-wrap",lineHeight:1.5}}>{task.description}</p>}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,opacity:.6}}>
              {task.category&&<span>🏷 {task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#ef4444":"inherit"}}>📅 {task.dueDate}</span>}
              <span>⚡ {getPriorities(lang)[task.priority]}</span>
              <span>{task.done?"✅ Tamamlandı":"⏳ Bekliyor"}</span>
            </div>
          </div>
        );
      })()}

      <FAB onClick={openNew}/>

      <Modal open={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId?t("tasks.edit",lang):t("tasks.new",lang)}>
        <input style={inp} placeholder={t("tasks.title",lang)} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={t("common.descOpt",lang)} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input style={inp} placeholder="Kategori (opsiyonel)" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Tarih seç:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {quickDates.map(q=>(
              <button key={q.label} onClick={()=>setForm({...form,dueDate:q.val})} style={{
                background:form.dueDate===q.val?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
                color:form.dueDate===q.val?"#3b82f6":"#aaa",
                border:form.dueDate===q.val?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
                padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{q.icon} {q.label}</button>
            ))}
            {form.dueDate&&<button onClick={()=>setForm({...form,dueDate:""})} style={{
              background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",
              padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>✕ Temizle</button>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            {form.dueDate&&<span style={{fontSize:13,color:"#3b82f6",fontWeight:600,whiteSpace:"nowrap"}}>{formatDate(form.dueDate)}</span>}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Öncelik:</div>
          <div style={{display:"flex",gap:6}}>
            {Object.entries(getPriorities(lang)).map(([k,v])=>(
              <button key={k} onClick={()=>setForm({...form,priority:k})} style={{
                flex:1,padding:"10px",borderRadius:10,fontSize:13,cursor:"pointer",textAlign:"center",fontWeight:600,
                background:form.priority===k?`${PCOL[k]}20`:"rgba(255,255,255,0.04)",
                color:form.priority===k?PCOL[k]:"#888",
                border:`1px solid ${form.priority===k?PCOL[k]+"40":"rgba(255,255,255,0.06)"}`,
              }}>
                <span style={{display:"block",width:8,height:8,borderRadius:"50%",background:PCOL[k],margin:"0 auto 4px"}}/>
                {v}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={save}>{editingId?t("tasks.save",lang):t("tasks.add",lang)}</button>
        {editingId&&<button onClick={()=>{del(editingId);setModal(false);setEditingId(null);}} style={{...btnPrimary,background:"#ef4444",marginTop:8}}>Görevi Sil</button>}
      </Modal>
    </div>
  );
}

/* ═══════════ CALENDAR ═══════════ */
function CalendarView({ data, update, lang="tr" }) {
  const [vd,setVd]=useState(new Date());
  const [modal,setModal]=useState(false);
  const [selDay,setSelDay]=useState(null);
  const [form,setForm]=useState({title:"",date:"",time:"",color:"#3b82f6",description:"",recurring:"none"});

  const y=vd.getFullYear(), m=vd.getMonth();
  const fd=(new Date(y,m,1).getDay()+6)%7;
  const dim=new Date(y,m+1,0).getDate();
  const cells=[]; for(let i=0;i<fd;i++)cells.push(null); for(let d=1;d<=dim;d++)cells.push(d);
  const ds=d=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const evOn = d => {
    const dateStr = ds(d);
    return data.events.filter(e => {
      if (e.date === dateStr) return true;
      // Recurring events
      if (e.recurring === "daily") return e.date <= dateStr;
      if (e.recurring === "weekly") {
        const eDate = new Date(e.date);
        const cDate = new Date(dateStr);
        return e.date <= dateStr && eDate.getDay() === cDate.getDay();
      }
      if (e.recurring === "monthly") {
        const eDay = parseInt(e.date.split("-")[2]);
        return e.date <= dateStr && eDay === d;
      }
      return false;
    });
  };

  const tdy = today();

  const add=()=>{
    if(!form.title.trim()||!form.date)return;
    update({...data,events:[...data.events,{id:uid(),...form}]});
    setModal(false);setForm({title:"",date:"",time:"",color:"#3b82f6",description:"",recurring:"none"});
  };
  const del=id=>update({...data,events:data.events.filter(e=>e.id!==id)});

  const openAdd=()=>{setModal(true);setForm({title:"",date:selDay?ds(selDay):"",time:"",color:"#3b82f6",description:"",recurring:"none"});};

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Takvim</h3>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setVd(new Date(y,m-1))} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>◀</button>
            <span style={{fontWeight:700,fontSize:14,minWidth:105,textAlign:"center"}}>{MN[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1))} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#aaa",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>▶</button>
          </div>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {DN.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,opacity:.4,padding:"6px 0"}}>{d}</div>)}
        {cells.map((d,i)=>{
          const isToday=d&&ds(d)===t;
          const ev=d?evOn(d):[];
          const isSel=d&&selDay===d;
          return (
            <div key={i} onClick={()=>d&&setSelDay(selDay===d?null:d)} style={{
              background:isToday?"rgba(59,130,246,0.2)":isSel?"rgba(59,130,246,0.1)":"rgba(255,255,255,0.03)",
              borderRadius:10,minHeight:48,padding:4,cursor:d?"pointer":"default",
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,
              border:isToday?"1.5px solid #3b82f6":isSel?"1.5px solid rgba(59,130,246,0.3)":"1.5px solid transparent",
            }}>
              {d&&<>
                <span style={{fontSize:13,fontWeight:isToday?800:400,color:isToday?"#3b82f6":"inherit"}}>{d}</span>
                <div style={{display:"flex",gap:2}}>
                  {ev.slice(0,3).map((e,idx)=><div key={idx} style={{width:5,height:5,borderRadius:"50%",background:e.color||"#3b82f6"}}/>)}
                </div>
              </>}
            </div>
          );
        })}
      </div>
      {selDay&&(
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{selDay} {MN[m]}</h4>
            <button onClick={openAdd} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>{t("cal.add",lang)}</button>
          </div>
          {evOn(selDay).length===0&&<p style={{opacity:.3,fontSize:13,margin:0}}>Etkinlik yok</p>}
          {evOn(selDay).map((e,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#3b82f6",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500}}>{e.title} {e.recurring&&e.recurring!=="none"&&<span style={{fontSize:10,opacity:.4}}>🔁</span>}</div>
                {e.time&&<div style={{fontSize:12,opacity:.5}}>🕐 {e.time}</div>}
                {e.description&&<div style={{fontSize:12,opacity:.5}}>{e.description}</div>}
              </div>
              <button onClick={()=>del(e.id)} style={delBtnStyle}>✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Upcoming events list */}
      {(() => {
        const upEv = data.events.filter(e=>e.date>=tdy).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
        if(upEv.length===0) return null;
        return (
          <div style={{marginBottom:14}}>
            <GroupLabel label="Yaklaşan" count={upEv.length} color="#a855f7"/>
            {upEv.map(e=>(
              <div key={e.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#a855f7",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                  <div style={{fontSize:11,opacity:.45,marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>
                </div>
                <button onClick={()=>update({...data,events:data.events.filter(ev=>ev.id!==e.id)})} style={delBtnStyle}>✕</button>
              </div>
            ))}
          </div>
        );
      })()}

      <FAB onClick={openAdd} color="#a855f7"/>

      <Modal open={modal} onClose={()=>setModal(false)} title="Yeni Etkinlik">
        <input style={inp} placeholder="Etkinlik adı..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <input style={{...inp,flex:1}} type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
        </div>
        <input style={inp} placeholder="Açıklama (opsiyonel)" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <select style={inp} value={form.recurring} onChange={e=>setForm({...form,recurring:e.target.value})}>
          <option value="none">Tekrarlama yok</option>
          <option value="daily">{t("cal.daily",lang)}</option>
          <option value="weekly">{t("cal.weekly",lang)}</option>
          <option value="monthly">Her ay</option>
        </select>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={add}>Ekle</button>
      </Modal>
    </div>
  );
}

/* ═══════════ SPORTS ═══════════ */
/* ═══════════ SAĞLIK (Health Coach) ═══════════ */
function Sports({ data, update, lang="tr" }) {
  const [view,setView]=useState("overview"); // overview, sport, food
  const [modal,setModal]=useState(false);
  const [foodModal,setFoodModal]=useState(false);
  const [form,setForm]=useState({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  const [foodForm,setFoodForm]=useState({name:"",calories:"",meal:"Öğle",date:today()});
  const [foodSearch,setFoodSearch]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const photoRef=useRef(null);

  const foods = data.foods || [];
  const aiProvider = data.settings?.aiProvider||"none";
  const aiKey = data.settings?.aiKey||"";
  const hasAI = aiProvider!=="none" && aiKey;

  // AI Photo Analysis
  const analyzePhoto = async (file) => {
    if(!hasAI) return;
    setAnalyzing(true);setAiResult(null);
    try {
      const base64 = await new Promise((res,rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });

      let result;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            contents:[{parts:[
              {inlineData:{mimeType:file.type,data:base64}},
              {text:"Bu yemek fotoğrafını analiz et. JSON formatında cevap ver, başka hiçbir şey yazma. Format: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan. Porsiyon büyüklüğünü tahmin et."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({
            model:"claude-sonnet-4-20250514",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image",source:{type:"base64",media_type:file.type,data:base64}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({
            model:"gpt-4o-mini",max_tokens:500,
            messages:[{role:"user",content:[
              {type:"image_url",image_url:{url:`data:${file.type};base64,${base64}`}},
              {type:"text",text:"Bu yemek fotoğrafını analiz et. SADECE JSON formatında cevap ver: {\"items\":[{\"name\":\"yemek adı\",\"calories\":sayı}],\"total\":toplam_kalori}. Türkçe yemek isimleri kullan."}
            ]}]
          })
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if(jsonMatch) result = JSON.parse(jsonMatch[0]);
      }
      if(result&&result.items) setAiResult(result);
      else setAiResult({error:"Analiz yapılamadı, tekrar deneyin"});
    } catch(err) {
      console.error("AI error:",err);
      setAiResult({error:"Hata: "+err.message});
    }
    setAnalyzing(false);
  };

  const saveAiResult = () => {
    if(!aiResult||!aiResult.items) return;
    const newFoods = aiResult.items.map(item=>({
      id:uid(),name:item.name,calories:item.calories,meal:foodForm.meal,date:today()
    }));
    update({...data,foods:[...newFoods,...foods]});
    setAiResult(null);
  };

  const addSport=()=>{
    if(!form.duration)return;
    // Auto-calculate calories if not manually entered
    const autoCal = calcSportCal(form.type, form.duration);
    const finalCal = form.calories ? +form.calories : autoCal;
    const ns={id:uid(),...form,duration:+form.duration,distance:+form.distance||0,calories:finalCal};
    update({...data,sports:[ns,...data.sports]});
    setModal(false);setForm({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  };
  const delSport=id=>update({...data,sports:data.sports.filter(s=>s.id!==id)});

  const addFood=()=>{
    if(!foodForm.name.trim()||!foodForm.calories)return;
    const nf={id:uid(),...foodForm,calories:+foodForm.calories};
    // Auto-save to personal food database
    const myFoods = data.myFoods || {};
    const key = foodForm.name.trim();
    const newMyFoods = {...myFoods,[key]:+foodForm.calories};
    update({...data,foods:[nf,...foods],myFoods:newMyFoods});
    setFoodModal(false);setFoodForm({name:"",calories:"",meal:"Öğle",date:today()});setFoodSearch("");
  };
  const delFood=id=>update({...data,foods:foods.filter(f=>f.id!==id)});
  const delMyFood=name=>{const mf={...(data.myFoods||{})};delete mf[name];update({...data,myFoods:mf});};

  const selectCommonFood=(name,cal)=>{
    setFoodForm({...foodForm,name,calories:String(cal)});
    setFoodSearch("");
  };

  // AI text-based calorie lookup
  const [aiLookup,setAiLookup]=useState(false);
  const askAiCalorie = async (foodName) => {
    if(!hasAI||!foodName.trim()) return;
    setAiLookup(true);
    try {
      const prompt = `"${foodName}" yemeğinin 1 porsiyon kalori değerini söyle. SADECE sayı olarak cevap ver, başka hiçbir şey yazma. Örnek: 250`;
      let cal = null;
      if(aiProvider==="gemini") {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${aiKey}`, {
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})
        });
        const d = await resp.json();
        const text = d.candidates?.[0]?.content?.parts?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="claude") {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":aiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.content?.[0]?.text||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      } else if(aiProvider==="openai") {
        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${aiKey}`},
          body:JSON.stringify({model:"gpt-4o-mini",max_tokens:50,messages:[{role:"user",content:prompt}]})
        });
        const d = await resp.json();
        const text = d.choices?.[0]?.message?.content||"";
        cal = parseInt(text.match(/\d+/)?.[0]);
      }
      if(cal && cal > 0) setFoodForm(f=>({...f,calories:String(cal)}));
    } catch(err) { console.error("AI lookup error:",err); }
    setAiLookup(false);
  };

  const t=today();
  const wk=data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const tMin=wk.reduce((a,s)=>a+(s.duration||0),0);
  const burnedCal=wk.reduce((a,s)=>a+(s.calories||0),0);
  const tDist=wk.reduce((a,s)=>a+(s.distance||0),0);

  const todayFoods=foods.filter(f=>f.date===tdy);
  const todayCalIn=todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todaySports=data.sports.filter(s=>s.date===tdy);
  const todayCalOut=todaySports.reduce((a,s)=>a+(s.calories||0),0);
  const dailyGoal=2000;
  const netCal=todayCalIn-todayCalOut;

  // AI Coach advice
  const getCoachTip=()=>{
    if(todayCalIn===0&&todayCalOut===0) return {icon:"💡",text:"Bugün henüz kayıt yok. Yediklerini ve sporunu kaydet, sağlık koçun seni yönlendirsin!",color:"#3b82f6"};
    if(netCal>dailyGoal+300) return {icon:"⚠️",text:`Bugün ${netCal} kcal net kalori — hedefin üzerinde. Hafif bir yürüyüş veya koşu iyi gelir!`,color:"#f59e0b"};
    if(netCal<1200&&todayCalIn>0) return {icon:"🌟",text:`Harika gidiyorsun! ${netCal} kcal net — dengeli ve sağlıklı.`,color:"#22c55e"};
    if(todayCalOut>300) return {icon:"💪",text:`Bugün ${todayCalOut} kcal yaktın, süpersin! Protein ağırlıklı beslenmeyi unutma.`,color:"#22c55e"};
    if(todayCalIn>0&&todayCalOut===0) return {icon:"🏃",text:`${todayCalIn} kcal aldın ama henüz spor yapmadın. 30dk yürüyüş ~150 kcal yakar!`,color:"#f97316"};
    return {icon:"✨",text:"Günü dengeli geçiriyorsun, böyle devam!",color:"#3b82f6"};
  };
  const tip=getCoachTip();

  // Smart search: COMMON_FOODS + myFoods + recent history
  const myFoods = data.myFoods || {};
  const recentFoodNames = {};
  foods.slice(0,50).forEach(f=>{ if(f.name && f.calories && !recentFoodNames[f.name]) recentFoodNames[f.name]=f.calories; });
  const allFoodDB = {...COMMON_FOODS,...recentFoodNames,...myFoods};
  const filteredFoods = foodSearch
    ? Object.entries(allFoodDB).filter(([k])=>k.toLowerCase().includes(foodSearch.toLowerCase())).slice(0,15)
    : [
        ...Object.entries(myFoods).slice(0,6).map(([k,v])=>[k,v,"my"]),
        ...Object.entries(COMMON_FOODS).slice(0,8),
      ].slice(0,12);
  const noResults = foodSearch && filteredFoods.length === 0;

  const mealGroups = [t("sport.breakfast",lang),t("sport.lunch",lang),t("sport.dinner",lang),t("sport.snack",lang)];

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:"0 0 12px",fontSize:20,fontWeight:800}}>Sağlık Koçu</h3>
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",borderRadius:12,padding:3,display:"flex"}}>
          {[["overview","Özet"],["sport","Spor"],["food","Beslenme"]].map(([k,v])=>(
            <button key={k} onClick={()=>setView(k)} style={{
              flex:1,padding:"9px 6px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:13,fontWeight:view===k?700:500,letterSpacing:-.2,
              background:view===k?"rgba(255,255,255,0.12)":"transparent",
              color:view===k?"#e0e0e0":"#666",transition:"all .2s",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {/* ── OVERVIEW ── */}
      {view==="overview"&&(<>
        {/* Coach tip */}
        <div style={{background:`${tip.color}15`,border:`1px solid ${tip.color}30`,borderRadius:14,padding:14,marginBottom:14,display:"flex",gap:10,alignItems:"start"}}>
          <span style={{fontSize:24}}>{tip.icon}</span>
          <div>
            <div style={{fontSize:12,fontWeight:700,color:tip.color,marginBottom:2}}>Sağlık Koçun</div>
            <div style={{fontSize:13,opacity:.8,lineHeight:1.4}}>{tip.text}</div>
          </div>
        </div>

        {/* Today's balance */}
        <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
          <h4 style={{margin:"0 0 10px",fontSize:14,fontWeight:700}}>Bugünkü Denge</h4>
          <div style={{display:"flex",justifyContent:"space-around",textAlign:"center",marginBottom:10}}>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:"#f97316"}}>{todayCalIn}</div>
              <div style={{fontSize:10,opacity:.5}}>Alınan kcal</div>
            </div>
            <div style={{fontSize:20,opacity:.3,alignSelf:"center"}}>−</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:"#22c55e"}}>{todayCalOut}</div>
              <div style={{fontSize:10,opacity:.5}}>Yakılan kcal</div>
            </div>
            <div style={{fontSize:20,opacity:.3,alignSelf:"center"}}>=</div>
            <div>
              <div style={{fontSize:22,fontWeight:800,color:netCal>dailyGoal?"#ef4444":"#3b82f6"}}>{netCal}</div>
              <div style={{fontSize:10,opacity:.5}}>Net kcal</div>
            </div>
          </div>
          <div style={{height:8,background:"rgba(255,255,255,0.08)",backdropFilter:"blur(2px)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:netCal>dailyGoal?"#ef4444":"#3b82f6",borderRadius:4,width:`${Math.min(100,netCal/dailyGoal*100)}%`,transition:"width .3s"}}/>
          </div>
          <div style={{fontSize:10,opacity:.4,marginTop:4,textAlign:"center"}}>Günlük hedef: {dailyGoal} kcal</div>
        </div>

        {/* Weekly stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
          {[
            {icon:"⏱",val:`${tMin} dk`,label:t("sport.weeklySport",lang),color:"#3b82f6"},
            {icon:"🔥",val:`${burnedCal}`,label:"Yakılan kcal",color:"#ef4444"},
            {icon:"📏",val:`${tDist.toFixed(1)} km`,label:"Mesafe",color:"#22c55e"},
            {icon:"💪",val:wk.length,label:t("dash.workout",lang),color:"#f97316"},
          ].map((s,i)=>(
            <div key={i} style={{...cardStyle,padding:"14px",borderLeft:`3px solid ${s.color}`,boxShadow:`0 0 16px ${s.color}18`}}>
              <div style={{fontSize:11,opacity:.5}}>{s.icon} {s.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color,marginTop:4}}>{s.val}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* ── SPORT ── */}
      {view==="sport"&&(<>
        {data.sports.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>🏃</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Henüz antrenman kaydı yok</div>
            <div style={{fontSize:12,opacity:.25}}>Sağ alttaki + butonuna bas</div>
          </div>
        )}
        {data.sports.slice(0,30).map(s=>(
          <div key={s.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:24,width:44,height:44,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(255,255,255,0.04)",borderRadius:12}}>{SPORT_EMOJI[s.type]||"⚡"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{s.type}</div>
              <div style={{fontSize:12,opacity:.5}}>{s.date} · {s.duration}dk {s.distance>0&&`· ${s.distance}km`} {s.calories>0&&`· ${s.calories}kcal`}</div>
            </div>
            <button onClick={()=>delSport(s.id)} style={delBtnStyle}>✕</button>
          </div>
        ))}
      </>)}

      {/* ── FOOD ── */}
      {view==="food"&&(<>
        {hasAI&&(
          <div style={{marginBottom:10}}>
            <button onClick={()=>photoRef.current?.click()} disabled={analyzing} style={{
              ...addBtnStyle,background:analyzing?"#555":"#22c55e",width:"100%",padding:"12px",borderRadius:12,fontSize:14,
            }}>{analyzing?"🔄 Analiz ediliyor...":"📸 Fotoğrafla Kalori Hesapla"}</button>
            <input ref={photoRef} type="file" accept="image/*" capture="environment"
              onChange={e=>{if(e.target.files?.[0])analyzePhoto(e.target.files[0]);e.target.value="";}}
              style={{display:"none"}}/>
          </div>
        )}

        {/* AI Result card */}
        {aiResult&&!aiResult.error&&(
          <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>🤖 AI Analiz Sonucu</span>
              <span style={{fontSize:14,fontWeight:800,color:"#f97316"}}>{aiResult.total} kcal</span>
            </div>
            {aiResult.items.map((item,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontSize:13}}>
                <span style={{opacity:.7}}>{item.name}</span>
                <span style={{fontWeight:600,color:"#f97316"}}>{item.calories} kcal</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <button onClick={saveAiResult} style={{...btnPrimary,flex:1,marginTop:0,background:"#22c55e",padding:"10px"}}>✓ Kaydet</button>
              <button onClick={()=>setAiResult(null)} style={{...btnPrimary,flex:1,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#ef4444",padding:"10px",border:"1px solid rgba(239,68,68,0.2)"}}>✕ İptal</button>
            </div>
          </div>
        )}
        {aiResult?.error&&(
          <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
            <span style={{fontSize:13,color:"#ef4444"}}>{aiResult.error}</span>
            <button onClick={()=>setAiResult(null)} style={{display:"block",marginTop:6,background:"none",border:"none",color:"#ef4444",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>Kapat</button>
          </div>
        )}

        {!hasAI&&(
          <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:12,padding:12,marginBottom:12,textAlign:"center"}}>
            <div style={{fontSize:12,opacity:.6,marginBottom:4}}>📸 Fotoğrafla kalori hesaplamak için</div>
            <div style={{fontSize:11,opacity:.4}}>Ayarlar → AI Kalori Asistanı'ndan bir AI seç ve API anahtarını gir</div>
          </div>
        )}

        {/* Today's meals grouped */}
        {mealGroups.map(meal=>{
          const mealFoods=todayFoods.filter(f=>f.meal===meal);
          if(mealFoods.length===0)return null;
          const mealCal=mealFoods.reduce((a,f)=>a+(f.calories||0),0);
          return (
            <div key={meal} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:13,fontWeight:700,opacity:.7}}>{meal}</span>
                <span style={{fontSize:12,fontWeight:600,color:"#f97316"}}>{mealCal} kcal</span>
              </div>
              {mealFoods.map(f=>(
                <div key={f.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14,flex:1}}>{f.name}</span>
                  <span style={{fontSize:13,fontWeight:600,color:"#f97316"}}>{f.calories}</span>
                  <button onClick={()=>delFood(f.id)} style={delBtnStyle}>✕</button>
                </div>
              ))}
            </div>
          );
        })}
        {todayFoods.length===0&&!aiResult&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>🍽</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Bugün yemek kaydı yok</div>
            <div style={{fontSize:12,opacity:.25}}>+ butonuna basarak ekle</div>
          </div>
        )}
      </>)}

      {view==="sport"&&<FAB onClick={()=>setModal(true)} color="#22c55e"/>}
      {view==="food"&&<FAB onClick={()=>setFoodModal(true)} color="#f97316"/>}

      {/* Sport Modal */}
      <Modal open={modal} onClose={()=>setModal(false)} title={t("sport.new",lang)}>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
          {SPORT_TYPES.map(t=>(
            <button key={t} onClick={()=>setForm({...form,type:t})} style={{
              background:form.type===t?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              color:form.type===t?"#3b82f6":"#aaa",
              border:form.type===t?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              padding:"8px 14px",borderRadius:10,fontSize:14,cursor:"pointer",
            }}>{SPORT_EMOJI[t]} {t}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder="Süre (dk)" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/>
          <input style={{...inp,flex:1}} type="number" placeholder="Mesafe (km)" value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,position:"relative"}}>
            <input style={inp} type="number" placeholder={t("sport.calOpt",lang)} value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
            {form.duration&&!form.calories&&(
              <div style={{fontSize:11,color:"#22c55e",marginTop:-8,marginBottom:8,paddingLeft:4,opacity:.8}}>
                ≈ {calcSportCal(form.type,form.duration)} kcal otomatik hesaplanacak
              </div>
            )}
          </div>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder={t("common.descOpt",lang)} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={btnPrimary} onClick={addSport}>Kaydet</button>
      </Modal>

      {/* Food Modal */}
      <Modal open={foodModal} onClose={()=>{setFoodModal(false);setFoodSearch("");setAiLookup(false);}} title={t("sport.addFood",lang)}>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {mealGroups.map(m=>(
            <button key={m} onClick={()=>setFoodForm({...foodForm,meal:m})} style={{
              background:foodForm.meal===m?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              color:foodForm.meal===m?"#3b82f6":"#aaa",
              border:foodForm.meal===m?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              padding:"7px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>{m}</button>
          ))}
        </div>

        {/* Smart search input */}
        <input style={inp} placeholder="🔍 Yemek ara (pancake, pilav, salata...)" value={foodSearch||foodForm.name}
          onChange={e=>{
            const v=e.target.value;
            setFoodSearch(v);
            // Auto-fill calories if exact match found
            const exactMatch = allFoodDB[v];
            setFoodForm({...foodForm,name:v,calories:exactMatch?String(exactMatch):""});
          }}/>

        {/* Search results */}
        {(foodSearch||!foodForm.name)&&(
          <div style={{maxHeight:180,overflow:"auto",marginBottom:10}}>
            {/* Personal foods section */}
            {!foodSearch&&Object.keys(myFoods).length>0&&(
              <div style={{fontSize:10,opacity:.4,padding:"4px 8px",fontWeight:700}}>⭐ Benim Yemeklerim</div>
            )}
            {filteredFoods.map(([name,cal,source])=>(
              <div key={name} onClick={()=>selectCommonFood(name,cal)} style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",cursor:"pointer",
                borderRadius:8,background:"rgba(255,255,255,0.03)",marginBottom:2,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {(source==="my"||myFoods[name])&&<span style={{fontSize:10,color:"#f59e0b"}}>⭐</span>}
                  <span style={{fontSize:13}}>{name}</span>
                </div>
                <span style={{fontSize:12,color:"#f97316",fontWeight:600}}>{cal} kcal</span>
              </div>
            ))}
            {/* No results + AI button */}
            {noResults&&(
              <div style={{textAlign:"center",padding:12}}>
                <p style={{fontSize:12,opacity:.4,margin:"0 0 8px"}}>"{foodSearch}" bulunamadı</p>
                {hasAI?(
                  <button onClick={()=>askAiCalorie(foodSearch)} disabled={aiLookup} style={{
                    background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",
                    padding:"8px 16px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                  }}>{aiLookup?"🔄 AI hesaplıyor...":"🤖 AI'a Kaloriyi Sor"}</button>
                ):(
                  <p style={{fontSize:11,opacity:.3}}>Kaloriyi elle gir veya Ayarlar'dan AI aç</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Name + calorie inputs */}
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:2}} placeholder="Yemek adı" value={foodForm.name} onChange={e=>setFoodForm({...foodForm,name:e.target.value})}/>
          <div style={{flex:1,position:"relative"}}>
            <input style={{...inp,paddingRight:hasAI?36:14}} type="number" placeholder="kcal" value={foodForm.calories} onChange={e=>setFoodForm({...foodForm,calories:e.target.value})}/>
            {hasAI&&foodForm.name&&!foodForm.calories&&(
              <button onClick={()=>askAiCalorie(foodForm.name)} disabled={aiLookup} style={{
                position:"absolute",right:8,top:8,background:"none",border:"none",
                fontSize:16,cursor:"pointer",opacity:aiLookup?.4:.8,
              }} title="AI'a sor">{aiLookup?"⏳":"🤖"}</button>
            )}
          </div>
        </div>

        {/* Auto-save info */}
        {foodForm.name&&foodForm.calories&&!allFoodDB[foodForm.name.trim()]&&(
          <div style={{fontSize:10,opacity:.4,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
            <span>⭐</span> Ekledikten sonra "{foodForm.name}" kişisel listene kaydedilecek
          </div>
        )}

        <input style={inp} type="date" value={foodForm.date} onChange={e=>setFoodForm({...foodForm,date:e.target.value})}/>
        <button style={btnPrimary} onClick={addFood}>Ekle</button>

        {/* Personal food list management */}
        {Object.keys(myFoods).length>0&&(
          <div style={{marginTop:16,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
            <div style={{fontSize:12,fontWeight:700,opacity:.5,marginBottom:8}}>⭐ Kişisel Yemek Listen ({Object.keys(myFoods).length})</div>
            <div style={{maxHeight:120,overflow:"auto"}}>
              {Object.entries(myFoods).map(([name,cal])=>(
                <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",fontSize:12}}>
                  <span style={{opacity:.6}}>{name}</span>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{color:"#f97316",fontWeight:600}}>{cal} kcal</span>
                    <button onClick={()=>delMyFood(name)} style={{background:"none",border:"none",color:"#555",fontSize:12,cursor:"pointer"}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}



/* ═══════════ NEWS ROOM ═══════════ */
const NEWS_SOURCES = {
  teknoloji: [
    { name:"BBC Tech",      url:"https://feeds.bbci.co.uk/news/technology/rss.xml",             lang:"EN", color:"#3b82f6" },
    { name:"Ars Technica",  url:"https://feeds.arstechnica.com/arstechnica/index",               lang:"EN", color:"#f97316" },
    { name:"Hacker News",   url:"https://hnrss.org/frontpage?count=15",                         lang:"EN", color:"#ff6600" },
  ],
  spor: [
    { name:"BBC Sport",     url:"https://feeds.bbci.co.uk/sport/rss.xml",                       lang:"EN", color:"#ef4444" },
    { name:"BBC Football",  url:"https://feeds.bbci.co.uk/sport/football/rss.xml",              lang:"EN", color:"#ef4444" },
    { name:"ESPN",          url:"https://www.espn.com/espn/rss/news",                           lang:"EN", color:"#cc0000" },
  ],
  sanat: [
    { name:"BBC Arts",      url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", lang:"EN", color:"#a855f7" },
    { name:"NPR Arts",      url:"https://feeds.npr.org/1008/rss.xml",                           lang:"EN", color:"#7c3aed" },
    { name:"Smithsonian",   url:"https://www.smithsonianmag.com/rss/arts-culture/",             lang:"EN", color:"#6d28d9" },
  ],
  saglik: [
    { name:"BBC Health",    url:"https://feeds.bbci.co.uk/news/health/rss.xml",                 lang:"EN", color:"#22c55e" },
    { name:"NPR Health",    url:"https://feeds.npr.org/1128/rss.xml",                           lang:"EN", color:"#16a34a" },
    { name:"Science Daily", url:"https://www.sciencedaily.com/rss/health_medicine.xml",         lang:"EN", color:"#0d9488" },
  ],
  ekonomi: [
    { name:"BBC Business",  url:"https://feeds.bbci.co.uk/news/business/rss.xml",               lang:"EN", color:"#f59e0b" },
    { name:"NPR Economy",   url:"https://feeds.npr.org/1006/rss.xml",                           lang:"EN", color:"#d97706" },
    { name:"MarketWatch",   url:"https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", lang:"EN", color:"#b45309" },
  ],
  politika: [
    { name:"BBC World",     url:"https://feeds.bbci.co.uk/news/world/rss.xml",                  lang:"EN", color:"#ef4444" },
    { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",                         lang:"TR", color:"#dc2626" },
    { name:"NPR Politics",  url:"https://feeds.npr.org/1014/rss.xml",                           lang:"EN", color:"#b91c1c" },
  ],
  bilim: [
    { name:"Science Daily", url:"https://www.sciencedaily.com/rss/top/science.xml",             lang:"EN", color:"#06b6d4" },
    { name:"BBC Science",   url:"https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",lang:"EN", color:"#0891b2" },
    { name:"NPR Science",   url:"https://feeds.npr.org/1007/rss.xml",                           lang:"EN", color:"#0e7490" },
  ],
  dunya: [
    { name:"BBC World",     url:"https://feeds.bbci.co.uk/news/world/rss.xml",                  lang:"EN", color:"#64748b" },
    { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",                         lang:"TR", color:"#bb1919" },
    { name:"NPR World",     url:"https://feeds.npr.org/1004/rss.xml",                           lang:"EN", color:"#475569" },
  ],
};

const NEWS_CATS = [
  { id:"spor",      label:"Spor",      icon:"⚽", color:"#ef4444",  desc:"Futbol, basketbol & dünya sporları" },
  { id:"teknoloji", label:"Teknoloji", icon:"💻", color:"#3b82f6",  desc:"Yapay zeka, gadget & yazılım" },
  { id:"ekonomi",   label:"Ekonomi",   icon:"📈", color:"#f59e0b",  desc:"Piyasalar, borsa & iş dünyası" },
  { id:"politika",  label:"Politika",  icon:"🌐", color:"#ef4444",  desc:"Dünya siyaseti & gündem" },
  { id:"saglik",    label:"Sağlık",    icon:"🏥", color:"#22c55e",  desc:"Tıp, beslenme & wellness" },
  { id:"bilim",     label:"Bilim",     icon:"🔭", color:"#06b6d4",  desc:"Uzay, keşifler & araştırmalar" },
  { id:"sanat",     label:"Sanat",     icon:"🎨", color:"#a855f7",  desc:"Kültür, sanat & eğlence" },
  { id:"dunya",     label:"Dünya",     icon:"🗺", color:"#64748b",  desc:"Dünya haberleri & olaylar" },
];

/* ── NewsRoom: Category grid → drill into article list ── */
function NewsRoom({ room, onBack }) {
  const [activeCat, setActiveCat] = useState(null); // null = grid, string = category id
  const [articles, setArticles] = useState({});
  const [loading, setLoading] = useState({});
  const [loaded, setLoaded] = useState({});
  const [langFilter, setLangFilter] = useState("all");

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
    const sources = NEWS_SOURCES[catId] || [];
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

  const openCat = (catId) => {
    setActiveCat(catId);
    fetchCategory(catId);
  };

  const catInfo = NEWS_CATS.find(c=>c.id===activeCat);
  const rawList = articles[activeCat] || [];
  const list = langFilter==="all" ? rawList : rawList.filter(a=>a.lang===langFilter);
  const isLoading = loading[activeCat];

  /* ── CATEGORY ARTICLE VIEW ── */
  if(activeCat) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <button onClick={()=>setActiveCat(null)} style={{
            background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",
            border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",
            width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>◀</button>
          <span style={{fontSize:22,filter:`drop-shadow(0 0 6px ${catInfo?.color}88)`}}>{catInfo?.icon}</span>
          <div style={{flex:1}}>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,color:catInfo?.color}}>{catInfo?.label}</h3>
            <div style={{fontSize:11,opacity:.4,marginTop:1}}>{catInfo?.desc}</div>
          </div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",
            color:"#aaa",width:34,height:34,borderRadius:10,fontSize:14,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>↻</button>
        </div>
        {/* Lang filter */}
        <div style={{display:"flex",gap:5}}>
          {[["all","🌍 Tümü"],["TR","🇹🇷 TR"],["EN","🌐 EN"]].map(([k,v])=>(
            <button key={k} onClick={()=>setLangFilter(k)} style={{
              padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:langFilter===k?700:400,
              background:langFilter===k?`${catInfo?.color}25`:"rgba(255,255,255,0.05)",
              color:langFilter===k?catInfo?.color:"#555",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {isLoading&&(
        <div style={{textAlign:"center",padding:"50px 0"}}>
          <div style={{fontSize:36,marginBottom:10,animation:"pulse 1.5s ease-in-out infinite"}}>{catInfo?.icon}</div>
          <div style={{fontSize:13,opacity:.4,marginBottom:4}}>Haberler yükleniyor...</div>
          <div style={{fontSize:11,opacity:.2}}>{NEWS_SOURCES[activeCat]?.map(s=>s.name).join(" · ")}</div>
        </div>
      )}

      {!isLoading&&list.length>0&&(
        <div>
          <div style={{fontSize:11,opacity:.3,marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:5,height:5,borderRadius:"50%",background:catInfo?.color,display:"inline-block"}}/>
            <span>{list.length} haber</span>
          </div>
          {list.map((article,i)=>(
            <a key={article.id||i} href={article.link} target="_blank" rel="noopener noreferrer"
              style={{textDecoration:"none",color:"inherit",display:"block"}}>
              <div style={{
                ...cardStyle,padding:0,marginBottom:10,overflow:"hidden",
                border:`1px solid ${catInfo?.color}25`,
                boxShadow:`0 0 20px ${catInfo?.color}10`,
                transition:"transform .15s, box-shadow .15s",
              }}
              onTouchStart={e=>{e.currentTarget.style.transform="scale(0.98)";}}
              onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
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
                    <div style={{fontSize:12,opacity:.45,lineHeight:1.45,marginBottom:6,
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
                    {article.pubDate&&<span style={{fontSize:10,opacity:.3}}>{timeAgo(article.pubDate)}</span>}
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
          <div style={{fontSize:40,marginBottom:10}}>📡</div>
          <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:6}}>Haber yüklenemedi</div>
          <div style={{fontSize:12,opacity:.25,marginBottom:16}}>İnternet bağlantını kontrol et</div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:`${catInfo?.color}20`,color:catInfo?.color,
            border:`1px solid ${catInfo?.color}40`,borderRadius:10,
            padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
          }}>↻ Tekrar Dene</button>
        </div>
      )}
    </div>
  );

  /* ── CATEGORY GRID (main view) ── */
  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={onBack} style={{
            background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",
            border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",
            width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
          }}>◀</button>
          <span style={{fontSize:22}}>📰</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>Haberler</h3>
          <span style={{fontSize:11,opacity:.3}}>{NEWS_CATS.length} kategori</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,opacity:.35}}>Bir kategoriye dokun ve haberleri keşfet</p>
      </StickyHeader>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {NEWS_CATS.map(cat=>(
          <div key={cat.id} onClick={()=>openCat(cat.id)}
            style={{
              background:`linear-gradient(145deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)`,
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              borderRadius:20,padding:"20px 16px",cursor:"pointer",
              border:`1px solid ${cat.color}45`,
              boxShadow:`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.08)`,
              minHeight:110,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,
              transition:"transform .15s, box-shadow .2s",
            }}
            onTouchStart={e=>{e.currentTarget.style.transform="scale(0.96)";}}
            onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 40px ${cat.color}40, 0 0 80px ${cat.color}15, inset 0 1px 0 rgba(255,255,255,0.1)`;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.08)`;e.currentTarget.style.transform="scale(1)";}}
          >
            <div style={{
              fontSize:34,
              filter:`drop-shadow(0 0 10px ${cat.color}88)`,
              lineHeight:1,
            }}>{cat.icon}</div>
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
              <div style={{fontSize:10,opacity:.4,animation:"pulse 1s ease-in-out infinite"}}>yükleniyor...</div>
            )}
          </div>
        ))}
      </div>
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
function MusicRoom({ room, items, onBack, onAdd, onDel }) {
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
        setChartTracks((json.feed?.entry||[]).map((e,i)=>({
          id:"itunes_"+i,
          title:e["im:name"]?.label||"",
          artist:e["im:artist"]?.label||"",
          albumArt:e["im:image"]?.[2]?.label||e["im:image"]?.[0]?.label||"",
          link:e.link?.attributes?.href||"",
          preview:"",
          source:"itunes",
          rank:i+1,
        })));
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
      if(audioRef.current) { audioRef.current.pause(); audioRef.current.src=track.preview; audioRef.current.play().catch(()=>{}); }
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
    let icon = "🎵";
    let color = "#1DB954";

    if(u.includes("spotify.com")) { platform="Spotify"; icon="🟢"; color="#1DB954"; }
    else if(u.includes("youtube.com")||u.includes("youtu.be")) { platform="YouTube"; icon="🔴"; color="#FF0000"; }
    else if(u.includes("soundcloud.com")) { platform="SoundCloud"; icon="🟠"; color="#FF5500"; }
    else if(u.includes("apple.com/music")||u.includes("music.apple")) { platform="Apple Music"; icon="⚪"; color="#FC3C44"; }
    else if(u.includes("deezer.com")) { platform="Deezer"; icon="🟣"; color="#A238FF"; }
    else if(u.includes("tidal.com")) { platform="Tidal"; icon="🔵"; color="#00FEEE"; }

    // Try to extract title from URL path
    let title = url.split("/").filter(Boolean).pop()?.replace(/-/g," ")?.replace(/\?.*/,"") || "Yeni parça";
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { url, platform, icon, color, title };
  };

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
    if(item.source==="deezer") return "🎵";
    const u=(item.link||"").toLowerCase();
    if(u.includes("spotify"))return "🟢";
    if(u.includes("youtube")||u.includes("youtu.be"))return "🔴";
    if(u.includes("soundcloud"))return "🟠";
    if(u.includes("apple"))return "⚪";
    return "🎵";
  };

  return (
    <div>
      <audio ref={audioRef} onEnded={()=>setPreview(null)} style={{display:"none"}}/>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <span style={{fontSize:22}}>🎵</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
          <span style={{fontSize:12,opacity:.4}}>{items.length} parça</span>
        </div>
        {/* Tab switcher — 4 tabs */}
        <div style={{background:"rgba(255,255,255,0.06)",backdropFilter:"blur(8px)",borderRadius:12,padding:3,display:"flex",gap:1}}>
          {[["collection","Benim"],["charts","Top 🏆"],["search","Ara"],["link","Link"]].map(([k,v])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1,padding:"8px 2px",borderRadius:9,border:"none",cursor:"pointer",
              fontSize:11,fontWeight:tab===k?700:500,
              background:tab===k?"rgba(255,255,255,0.12)":"transparent",
              color:tab===k?"#e0e0e0":"#666",transition:"all .2s",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {/* ── COLLECTION ── */}
      {tab==="collection"&&(
        items.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:44,marginBottom:10}}>🎵</div>
            <div style={{fontSize:15,fontWeight:700,opacity:.5,marginBottom:6}}>Koleksiyonun boş</div>
            <div style={{fontSize:12,opacity:.3,marginBottom:20}}>Deezer'dan ara veya link yapıştır</div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <button onClick={()=>setTab("search")} style={{background:"rgba(162,56,255,0.15)",color:"#a238ff",border:"1px solid rgba(162,56,255,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔍 Deezer'da Ara</button>
              <button onClick={()=>setTab("link")} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>🔗 Link Ekle</button>
            </div>
          </div>
        ) : (
          items.map(item=>(
            <div key={item.id} style={{
              ...cardStyle,padding:"12px 14px",marginBottom:8,
              display:"flex",alignItems:"center",gap:12,minHeight:64,
            }}>
              {/* Album art or placeholder */}
              <div style={{
                width:48,height:48,borderRadius:10,flexShrink:0,overflow:"hidden",
                background:item.albumArt?"#000":"rgba(162,56,255,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",
              }}>
                {item.albumArt
                  ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <span style={{fontSize:22}}>🎵</span>
                }
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                {item.artist&&<div style={{fontSize:12,opacity:.5,marginTop:2}}>{item.artist}</div>}
                <div style={{fontSize:11,opacity:.35,marginTop:2,display:"flex",alignItems:"center",gap:4}}>
                  <span>{platformIcon(item)}</span>
                  <span>{item.platform||item.source||"Müzik"}</span>
                </div>
              </div>
              {/* Preview play button (Deezer tracks) */}
              {item.preview&&(
                <button onClick={()=>togglePreview(item)} style={{
                  width:36,height:36,borderRadius:"50%",
                  background:preview?.id===item.id?"rgba(162,56,255,0.9)":"rgba(255,255,255,0.08)",
                  border:"none",color:"#fff",fontSize:14,cursor:"pointer",
                  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  {preview?.id===item.id?"⏸":"▶"}
                </button>
              )}
              {/* Open link button */}
              {item.link&&(
                <a href={item.link} target="_blank" rel="noopener noreferrer" style={{
                  width:36,height:36,borderRadius:"50%",
                  background:"rgba(255,255,255,0.05)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  textDecoration:"none",fontSize:14,flexShrink:0,
                }}>↗</a>
              )}
              <button onClick={()=>onDel(item.id)} style={delBtnStyle}>✕</button>
            </div>
          ))
        )
      )}

      {/* ── SEARCH (Deezer) ── */}
      {tab==="search"&&(
        <div>
          <input
            style={{...inp,marginBottom:12}}
            placeholder="🔍 Şarkı, sanatçı veya albüm ara..."
            value={searchQ}
            onChange={e=>setSearchQ(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&searchMusic(searchQ)}
          />
          <button onClick={()=>searchMusic(searchQ)} style={{...btnPrimary,marginTop:0,marginBottom:16,background:"#a238ff"}}>
            {searching?"Aranıyor...":"Deezer'da Ara"}
          </button>
          {searching&&(
            <div style={{textAlign:"center",padding:20,opacity:.4,fontSize:13}}>🎵 Aranıyor...</div>
          )}
          {!searching&&searchResults.length===0&&searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0",opacity:.4,fontSize:13}}>Sonuç bulunamadı</div>
          )}
          {!searching&&searchResults.length===0&&!searchQ&&(
            <div style={{textAlign:"center",padding:"20px 0"}}>
              <div style={{fontSize:32,marginBottom:8}}>🎧</div>
              <div style={{fontSize:13,opacity:.4}}>Deezer veritabanında 90M+ parça</div>
              <div style={{fontSize:11,opacity:.25,marginTop:4}}>Arama yap → 30 sn önizleme dinle → Ekle</div>
            </div>
          )}
          {searchResults.map(track=>{
            const inColl = items.some(i=>i.link===track.link);
            return (
              <div key={track.id} style={{
                background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
                opacity:inColl?.6:1,
              }}>
                <div style={{width:44,height:44,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.album?.cover_medium
                    ? <img src={track.album.cover_medium} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎵</div>
                  }
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:1}}>{track.artist?.name}</div>
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
          <div style={{fontSize:12,opacity:.5,marginBottom:8,lineHeight:1.5}}>
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
              {name:"Spotify",color:"#1DB954",icon:"🟢"},
              {name:"YouTube",color:"#FF0000",icon:"🔴"},
              {name:"SoundCloud",color:"#FF5500",icon:"🟠"},
              {name:"Apple Music",color:"#FC3C44",icon:"⚪"},
              {name:"Deezer",color:"#A238FF",icon:"🟣"},
            ].map(p=>(
              <div key={p.name} style={{display:"flex",alignItems:"center",gap:4,background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"4px 10px",fontSize:11,opacity:.6}}>
                <span>{p.icon}</span><span>{p.name}</span>
              </div>
            ))}
          </div>

          {/* Link preview card */}
          {linkFetching&&<div style={{textAlign:"center",opacity:.4,fontSize:13,padding:12}}>Kontrol ediliyor...</div>}
          {linkPreview&&(
            <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{fontSize:11,opacity:.5,marginBottom:4}}>{linkPreview.icon} {linkPreview.platform}</div>
              <div style={{fontSize:14,fontWeight:700}}>{linkPreview.title}</div>
            </div>
          )}

          {/* Title override */}
          <input
            style={inp}
            placeholder="Parça adı (opsiyonel, otomatik doldurulamadıysa)"
            value={linkPreview?.title||""}
            onChange={e=>setLinkPreview(lp=>lp?{...lp,title:e.target.value}:{title:e.target.value,url:linkInput,platform:"Müzik",color:"#888"})}
          />

          <button onClick={addFromLink} disabled={!linkInput.trim()} style={{
            ...btnPrimary,marginTop:0,
            background:linkInput.trim()?"#3b82f6":"#333",
            opacity:linkInput.trim()?1:.5,
          }}>Koleksiyona Ekle</button>

          <div style={{marginTop:16,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:12}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.4,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Nasıl kullanılır?</div>
            <div style={{fontSize:11,opacity:.4,lineHeight:1.7}}>
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
            {[["tr","🇹🇷 Türkiye"],["global","🌍 Global"],["genre","🎸 Tür"]].map(([k,v])=>(
              <button key={k} onClick={()=>setChartSource(k)} style={{
                flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",
                fontSize:12,fontWeight:chartSource===k?700:500,
                background:chartSource===k?"rgba(162,56,255,0.25)":"rgba(255,255,255,0.05)",
                color:chartSource===k?"#c084fc":"#666",
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
                  color:chartGenre===k?"#c084fc":"#666",
                }}>{v}</button>
              ))}
            </div>
          )}

          {/* Source label */}
          <div style={{fontSize:11,opacity:.4,marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
            <span>
              {chartSource==="tr"&&"🍎 Apple Music Türkiye · Güncel Top 25"}
              {chartSource==="global"&&"🟣 Deezer Global · Top 25 · 30sn önizleme"}
              {chartSource==="genre"&&`🟣 Deezer ${GENRE_LABELS[chartGenre]} Listesi · 30sn önizleme`}
            </span>
          </div>

          {/* Loading */}
          {chartLoading&&(
            <div style={{textAlign:"center",padding:"30px 0"}}>
              <div style={{fontSize:32,marginBottom:8,animation:"pulse 1.5s ease-in-out infinite"}}>🎵</div>
              <div style={{fontSize:13,opacity:.4}}>Liste yükleniyor...</div>
            </div>
          )}

          {/* Track list */}
          {!chartLoading&&chartTracks.map((track,i)=>{
            const inColl = items.some(it=>it.link===track.link||it.title===track.title);
            return (
              <div key={track.id||i} style={{
                background:"rgba(255,255,255,0.04)",borderRadius:16,padding:"10px 12px",marginBottom:6,
                display:"flex",alignItems:"center",gap:10,minHeight:60,
              }}>
                {/* Rank */}
                <div style={{
                  width:26,height:26,borderRadius:8,flexShrink:0,
                  background:i<3?"rgba(162,56,255,0.2)":"rgba(255,255,255,0.04)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:11,fontWeight:700,
                  color:i<3?"#c084fc":"#666",
                }}>{i+1}</div>
                {/* Album art */}
                <div style={{width:42,height:42,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#111"}}>
                  {track.albumArt
                    ? <img src={track.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🎵</div>
                  }
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.title}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{track.artist}</div>
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
                {/* Open link (iTunes tracks) */}
                {track.link&&!track.preview&&(
                  <a href={track.link} target="_blank" rel="noopener noreferrer" style={{
                    width:32,height:32,borderRadius:"50%",flexShrink:0,
                    background:"rgba(255,255,255,0.05)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    textDecoration:"none",fontSize:13,color:"#aaa",
                  }}>↗</a>
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
              <div style={{fontSize:32,marginBottom:8}}>📡</div>
              <div style={{fontSize:13,opacity:.4}}>Liste yüklenemedi</div>
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

/* ═══════════ STYLE LOOKBOOK ═══════════ */
function StyleLookbook({ room, items, onBack, onAdd, onDel, lang="tr" }) {
  const [showAddLook, setShowAddLook] = useState(false);
  const [lookForm, setLookForm] = useState({ title: "", occasion: "casual", mood: "confident", weather: "mild", notes: "" });
  const [weather, setWeather] = useState(null);

  // Style rules stored in items as type:"rule" 
  const looks = items.filter(i => i.type !== "rule");
  const rules = items.filter(i => i.type === "rule");

  // Fetch weather
  useEffect(() => {
    let c = false;
    (async () => {
      try {
        // Try geolocation
        const pos = await new Promise((res, rej) => navigator.geolocation?.getCurrentPosition(res, rej, { timeout: 5000 })).catch(() => null);
        const lat = pos?.coords?.latitude || 41.01;
        const lon = pos?.coords?.longitude || 28.97;
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`, { signal: AbortSignal.timeout(6000) });
        const d = await r.json();
        if (!c && d.current) {
          const code = d.current.weather_code;
          let condition = "clear";
          if ([0, 1].includes(code)) condition = "clear";
          else if ([2, 3].includes(code)) condition = "cloudy";
          else if ([45, 48].includes(code)) condition = "foggy";
          else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) condition = "rainy";
          else if ([71, 73, 75, 77, 85, 86].includes(code)) condition = "snowy";
          else if ([95, 96, 99].includes(code)) condition = "stormy";
          setWeather({ temp: Math.round(d.current.temperature_2m), wind: Math.round(d.current.wind_speed_10m), condition });
        }
      } catch {}
    })();
    return () => { c = true; };
  }, []);

  const weatherIcon = { clear: "☀️", cloudy: "☁️", foggy: "🌫️", rainy: "🌧️", snowy: "❄️", stormy: "⛈️" };
  const weatherLabel = {
    clear: { tr: "Güneşli", en: "Sunny", de: "Sonnig", da: "Solrigt", fi: "Aurinkoinen" },
    cloudy: { tr: "Bulutlu", en: "Cloudy", de: "Bewölkt", da: "Overskyet", fi: "Pilvinen" },
    foggy: { tr: "Sisli", en: "Foggy", de: "Neblig", da: "Tåget", fi: "Sumuinen" },
    rainy: { tr: "Yağmurlu", en: "Rainy", de: "Regnerisch", da: "Regnfuldt", fi: "Sateinen" },
    snowy: { tr: "Karlı", en: "Snowy", de: "Verschneit", da: "Snevejr", fi: "Luminen" },
    stormy: { tr: "Fırtınalı", en: "Stormy", de: "Stürmisch", da: "Stormfuldt", fi: "Myrskyinen" },
  };

  // Generate weather-based outfit suggestions
  const getSuggestions = () => {
    if (!weather) return [];
    const temp = weather.temp;
    const cond = weather.condition;
    const suggestions = [];

    if (temp >= 25) {
      suggestions.push({ title: lang === "tr" ? "Hafif & Serin" : "Light & Breezy", pieces: ["👕 T-shirt", "🩳 Shorts", "🩴 Sandals"], occasion: "casual", mood: "relaxed", color: "#f97316" });
      suggestions.push({ title: lang === "tr" ? "Şık Yaz" : "Chic Summer", pieces: ["👗 Dress", "🕶️ Sunglasses", "👜 Tote"], occasion: "work", mood: "elegant", color: "#a855f7" });
    } else if (temp >= 15) {
      suggestions.push({ title: lang === "tr" ? "Katmanlı & Rahat" : "Layered & Cool", pieces: ["🧥 Jacket", "👖 Jeans", "👟 Sneakers"], occasion: "casual", mood: "confident", color: "#3b82f6" });
      suggestions.push({ title: lang === "tr" ? "İş Şıklığı" : "Office Smart", pieces: ["🧥 Blazer", "👔 Shirt", "👞 Loafers"], occasion: "work", mood: "elegant", color: "#14b8a6" });
    } else if (temp >= 5) {
      suggestions.push({ title: lang === "tr" ? "Sıcak Tutan" : "Warm & Cozy", pieces: ["🧶 Sweater", "🧣 Scarf", "🥾 Boots"], occasion: "casual", mood: "relaxed", color: "#f59e0b" });
      suggestions.push({ title: lang === "tr" ? "Sonbahar Şıklığı" : "Autumn Elegance", pieces: ["🧥 Coat", "👖 Trousers", "🧣 Scarf"], occasion: "work", mood: "confident", color: "#ef4444" });
    } else {
      suggestions.push({ title: lang === "tr" ? "Kış Savaşçısı" : "Winter Warrior", pieces: ["🧥 Puffer", "🧤 Gloves", "🥾 Boots"], occasion: "casual", mood: "confident", color: "#6366f1" });
      suggestions.push({ title: lang === "tr" ? "Kar Şıklığı" : "Snow Chic", pieces: ["🧥 Wool Coat", "🧣 Cashmere", "👢 Tall Boots"], occasion: "night", mood: "elegant", color: "#ec4899" });
    }

    if (cond === "rainy" || cond === "stormy") {
      suggestions.push({ title: lang === "tr" ? "Yağmur Hazır" : "Rain Ready", pieces: ["☂️ Umbrella", "🧥 Raincoat", "🥾 Waterproof"], occasion: "casual", mood: "relaxed", color: "#64748b" });
    }

    return suggestions;
  };

  const suggestions = getSuggestions();

  // Style rule toggles (persisted in items as type:"rule")
  const defaultRules = [
    { key: "workOk", default: true },
    { key: "sustainable", default: false },
    { key: "noPurchase", default: false },
  ];
  const getRuleVal = (key) => {
    const r = rules.find(i => i.ruleKey === key);
    return r ? r.enabled : defaultRules.find(d => d.key === key)?.default ?? false;
  };
  const toggleRule = (key) => {
    const existing = rules.find(i => i.ruleKey === key);
    if (existing) {
      // Update the item
      const updated = items.map(i => i.id === existing.id ? { ...i, enabled: !existing.enabled } : i);
      // Reconstruct: we need to call onAdd/onDel approach... simpler: pass update
      // Actually onAdd and onDel are separate, let's toggle via onDel + onAdd
      onDel(existing.id);
      setTimeout(() => onAdd({ id: uid(), type: "rule", ruleKey: key, enabled: !existing.enabled, title: key }), 50);
    } else {
      onAdd({ id: uid(), type: "rule", ruleKey: key, enabled: true, title: key });
    }
  };

  // Color palette
  const palette = [
    { name: "Navy", hex: "#1e3a5f" }, { name: "Charcoal", hex: "#374151" },
    { name: "Beige", hex: "#d4b896" }, { name: "Cream", hex: "#f5f0e8" },
    { name: "Olive", hex: "#6b7c3f" }, { name: "Burgundy", hex: "#7c2d3a" },
    { name: "Camel", hex: "#c4956a" }, { name: "Stone", hex: "#9ca3af" },
  ];

  const occasionLabel = { casual: t("style.casual", lang), work: t("style.work", lang), night: t("style.night", lang) };
  const moodLabel = { confident: t("style.confident", lang), relaxed: t("style.relaxed", lang), elegant: t("style.elegant", lang) };
  const occasionColor = { casual: "#22c55e", work: "#3b82f6", night: "#a855f7" };
  const moodColor = { confident: "#f59e0b", relaxed: "#14b8a6", elegant: "#ec4899" };

  const addLook = () => {
    if (!lookForm.title.trim()) return;
    onAdd({ id: uid(), type: "look", ...lookForm, createdAt: today() });
    setLookForm({ title: "", occasion: "casual", mood: "confident", weather: "mild", notes: "" });
    setShowAddLook(false);
  };

  // Wear frequency mock (based on saved looks count)
  const wearPct = Math.min(100, looks.length * 12);

  return (
    <div>
      <StickyHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#ccc", width: 34, height: 34, borderRadius: 10, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>◀</button>
          <span style={{ fontSize: 22 }}>✨</span>
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, flex: 1 }}>{t("style.title", lang)}</h3>
        </div>
      </StickyHeader>

      {/* ── WEATHER WIDGET ── */}
      <div style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.08), rgba(249,115,22,0.06))",
        border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20,
        padding: "18px 20px", marginBottom: 14,
        boxShadow: "0 0 30px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          {t("style.weather", lang)}
        </div>
        {weather ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontSize: 44 }}>{weatherIcon[weather.condition] || "🌤️"}</div>
            <div>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1 }}>{weather.temp}°C</div>
              <div style={{ fontSize: 13, opacity: .6 }}>
                {weatherLabel[weather.condition]?.[lang] || weather.condition}
                {weather.wind > 15 && ` · 💨 ${weather.wind} km/h`}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: .4 }}>
            <span style={{ fontSize: 28, animation: "pulse 1.5s infinite" }}>🌤️</span>
            <span style={{ fontSize: 13 }}>{t("dash.loading", lang)}</span>
          </div>
        )}
      </div>

      {/* ── SUGGESTED LOOKS (weather-based) ── */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            {t("style.sugLooks", lang)}
          </div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6, WebkitOverflowScrolling: "touch" }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                minWidth: 180, maxWidth: 200, flexShrink: 0,
                background: `linear-gradient(135deg, ${s.color}15, ${s.color}05)`,
                border: `1px solid ${s.color}30`,
                borderRadius: 18, padding: "16px 14px",
                boxShadow: `0 0 20px ${s.color}10, inset 0 1px 0 ${s.color}15`,
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, color: s.color }}>{s.title}</div>
                {s.pieces.map((p, j) => (
                  <div key={j} style={{ fontSize: 13, opacity: .8, marginBottom: 3 }}>{p}</div>
                ))}
                <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                  <span style={{ background: `${occasionColor[s.occasion]}20`, color: occasionColor[s.occasion], padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700 }}>
                    {occasionLabel[s.occasion]}
                  </span>
                  <span style={{ background: `${moodColor[s.mood]}20`, color: moodColor[s.mood], padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 700 }}>
                    {moodLabel[s.mood]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STYLE RULES & DISCIPLINE ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          {t("style.rules", lang)}
        </div>
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 18, padding: "16px", overflow: "hidden",
        }}>
          {/* Wear Frequency meter */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t("style.wearFreq", lang)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: wearPct > 60 ? "#22c55e" : "#f59e0b" }}>{wearPct}%</span>
            </div>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto" }}>
              <svg viewBox="0 0 36 36" style={{ width: 80, height: 80, transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={wearPct > 60 ? "#22c55e" : "#f59e0b"}
                  strokeWidth="3" strokeDasharray={`${wearPct} ${100 - wearPct}`} strokeLinecap="round"
                  style={{ transition: "stroke-dasharray .6s ease", filter: `drop-shadow(0 0 6px ${wearPct > 60 ? "rgba(34,197,94,0.4)" : "rgba(245,158,11,0.4)"})` }}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👗</div>
            </div>
          </div>

          {/* Rule toggles */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            {[
              { key: "workOk", label: t("style.workOk", lang), icon: "💼", color: "#3b82f6" },
              { key: "sustainable", label: t("style.sustainable", lang), icon: "🌿", color: "#22c55e" },
              { key: "noPurchase", label: t("style.noPurchase", lang), icon: "🚫", color: "#ef4444" },
            ].map(rule => {
              const on = getRuleVal(rule.key);
              return (
                <div key={rule.key} onClick={() => toggleRule(rule.key)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                }}>
                  <span style={{ fontSize: 18 }}>{rule.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{rule.label}</span>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: on ? `${rule.color}30` : "rgba(255,255,255,0.06)",
                    border: `1px solid ${on ? rule.color + "50" : "rgba(255,255,255,0.1)"}`,
                    position: "relative", transition: "all .2s",
                    boxShadow: on ? `0 0 12px ${rule.color}20` : "none",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: on ? rule.color : "#555",
                      position: "absolute", top: 2,
                      left: on ? 23 : 3,
                      transition: "all .2s",
                      boxShadow: on ? `0 0 8px ${rule.color}60` : "none",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── COLOR PALETTE ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          {t("style.palette", lang)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
          {palette.map(c => (
            <div key={c.hex} style={{
              aspectRatio: "1", borderRadius: 14,
              background: c.hex,
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
              paddingBottom: 6,
              boxShadow: `0 4px 16px ${c.hex}30, inset 0 -20px 30px rgba(0,0,0,0.3)`,
            }}>
              <span style={{ fontSize: 9, color: "#fff", fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.6)", letterSpacing: ".03em" }}>{c.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SAVED LOOKS ── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, opacity: .4, textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
          {t("style.savedLooks", lang)}
        </div>
        {looks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✨</div>
            <div style={{ fontSize: 13, opacity: .4 }}>{t("style.noLooks", lang)}</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {looks.map(look => (
              <div key={look.id} style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.15)",
                borderRadius: 16, padding: "14px 12px", position: "relative",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{look.title}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ background: `${occasionColor[look.occasion] || "#888"}20`, color: occasionColor[look.occasion] || "#888", padding: "1px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>
                    {occasionLabel[look.occasion] || look.occasion}
                  </span>
                  <span style={{ background: `${moodColor[look.mood] || "#888"}20`, color: moodColor[look.mood] || "#888", padding: "1px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700 }}>
                    {moodLabel[look.mood] || look.mood}
                  </span>
                </div>
                {look.notes && <div style={{ fontSize: 11, opacity: .5, lineHeight: 1.3 }}>{look.notes}</div>}
                <button onClick={() => onDel(look.id)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", width: 22, height: 22, borderRadius: 6, fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <div onClick={() => setShowAddLook(true)} style={{
        position: "fixed", bottom: 80, right: 20, width: 56, height: 56,
        borderRadius: 18,
        background: "linear-gradient(135deg, #f97316, #a855f7, #3b82f6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, color: "#fff", cursor: "pointer", zIndex: 100,
        boxShadow: "0 4px 20px rgba(249,115,22,0.3), 0 4px 20px rgba(168,85,247,0.2)",
      }}>+</div>

      {/* ── ADD LOOK MODAL ── */}
      <Modal open={showAddLook} onClose={() => setShowAddLook(false)} title={t("style.addLook", lang)}>
        <input style={inp} placeholder={lang === "tr" ? "Kombin adı..." : "Look name..."} value={lookForm.title} onChange={e => setLookForm({ ...lookForm, title: e.target.value })} autoFocus />

        <div style={{ fontSize: 12, opacity: .5, marginBottom: 6 }}>{t("style.occasion", lang)}:</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["casual", "work", "night"].map(o => (
            <button key={o} onClick={() => setLookForm({ ...lookForm, occasion: o })} style={{
              flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontWeight: 600,
              background: lookForm.occasion === o ? `${occasionColor[o]}20` : "rgba(255,255,255,0.04)",
              color: lookForm.occasion === o ? occasionColor[o] : "#888",
              border: `1px solid ${lookForm.occasion === o ? occasionColor[o] + "40" : "rgba(255,255,255,0.06)"}`,
            }}>{occasionLabel[o]}</button>
          ))}
        </div>

        <div style={{ fontSize: 12, opacity: .5, marginBottom: 6 }}>{t("style.mood", lang)}:</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["confident", "relaxed", "elegant"].map(m => (
            <button key={m} onClick={() => setLookForm({ ...lookForm, mood: m })} style={{
              flex: 1, padding: "8px", borderRadius: 10, fontSize: 12, cursor: "pointer", fontWeight: 600,
              background: lookForm.mood === m ? `${moodColor[m]}20` : "rgba(255,255,255,0.04)",
              color: lookForm.mood === m ? moodColor[m] : "#888",
              border: `1px solid ${lookForm.mood === m ? moodColor[m] + "40" : "rgba(255,255,255,0.06)"}`,
            }}>{moodLabel[m]}</button>
          ))}
        </div>

        <textarea style={{ ...inp, minHeight: 60, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
          placeholder={t("common.descOpt", lang)} value={lookForm.notes}
          onChange={e => setLookForm({ ...lookForm, notes: e.target.value })} />

        <button style={{ ...btnPrimary, background: "linear-gradient(135deg, #f97316, #a855f7)" }} onClick={addLook}>
          {t("common.add", lang)}
        </button>
      </Modal>
    </div>
  );
}

/* ═══════════ TARZIM ═══════════ */
function Projects({ data, update, lang="tr" }) {
  const [activeRoom,setActiveRoom]=useState(null);
  const [modal,setModal]=useState(false);
  const [roomModal,setRoomModal]=useState(false);
  const [itemModal,setItemModal]=useState(false);
  const [form,setForm]=useState({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  const [roomForm,setRoomForm]=useState({name:"",icon:"📂",color:"#3b82f6"});
  const [itemForm,setItemForm]=useState({title:"",description:"",tags:""});
  const [exp,setExp]=useState(null);
  const [tf,setTf]=useState({title:""});

  const rooms = data.rooms || [...getDefaultRooms(lang)];
  const roomItems = data.roomItems || {};

  const addRoom=()=>{
    if(!roomForm.name.trim())return;
    const nr={id:uid(),...roomForm,type:"collection"};
    update({...data,rooms:[...rooms,nr]});
    setRoomModal(false);setRoomForm({name:"",icon:"📂",color:"#3b82f6"});
  };
  const delRoom=id=>{
    const newRooms=rooms.filter(r=>r.id!==id);
    const ni={...roomItems};delete ni[id];
    update({...data,rooms:newRooms,roomItems:ni});
    setActiveRoom(null);
  };
  const addItem=()=>{
    if(!itemForm.title.trim())return;
    const items=roomItems[activeRoom]||[];
    const ni={id:uid(),...itemForm,tags:itemForm.tags.split(",").map(t=>t.trim()).filter(Boolean),createdAt:today()};
    update({...data,roomItems:{...roomItems,[activeRoom]:[ni,...items]}});
    setItemModal(false);setItemForm({title:"",description:"",tags:""});
  };
  const delItem=(roomId,itemId)=>{
    const items=(roomItems[roomId]||[]).filter(i=>i.id!==itemId);
    update({...data,roomItems:{...roomItems,[roomId]:items}});
  };

  const addProject=()=>{
    if(!form.name.trim())return;
    const np={id:uid(),...form,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),tasks:[],createdAt:today()};
    update({...data,projects:[np,...data.projects]});
    setModal(false);setForm({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  };
  const delProject=id=>update({...data,projects:data.projects.filter(p=>p.id!==id)});
  const upSt=(id,st)=>update({...data,projects:data.projects.map(p=>p.id===id?{...p,status:st}:p)});
  const addPT=pid=>{
    if(!tf.title.trim())return;
    update({...data,projects:data.projects.map(p=>p.id===pid?{...p,tasks:[...(p.tasks||[]),{id:uid(),title:tf.title,done:false}]}:p)});
    setTf({title:""});
  };
  const togPT=(pid,tid)=>{
    update({...data,projects:data.projects.map(p=>p.id===pid?{...p,tasks:(p.tasks||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:p)});
  };
  const stCol=s=>s==="Tamamlandı"?"#22c55e":s==="Devam Ediyor"?"#3b82f6":s==="Test"?"#f59e0b":"#888";

  const roomIcons=["📂","🎵","👗","📸","🎮","📚","🎨","💼","🏠","✈️","🎯","💡","🛒","🎬","🍳"];

  if(!activeRoom) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Tarzım</h3>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,opacity:.4}}>Kişisel alanların — odalarına dokun ve keşfet</p>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
        {rooms.map(room=>{
          const count=room.type==="project"?data.projects.length:(roomItems[room.id]||[]).length;
          return (
            <div key={room.id} onClick={()=>setActiveRoom(room.id)} style={{
              background:`linear-gradient(145deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)`,
              backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",
              borderRadius:20,padding:20,cursor:"pointer",
              border:`1px solid ${room.color}50`,
              boxShadow:`0 0 30px ${room.color}25, 0 0 60px ${room.color}10, inset 0 1px 0 rgba(255,255,255,0.08)`,
              textAlign:"center",minHeight:110,
              display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,
              transition:"box-shadow .2s, transform .15s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow=`0 0 40px ${room.color}45, 0 0 80px ${room.color}20, inset 0 1px 0 rgba(255,255,255,0.1)`;e.currentTarget.style.transform="scale(1.02)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow=`0 0 30px ${room.color}25, 0 0 60px ${room.color}10, inset 0 1px 0 rgba(255,255,255,0.08)`;e.currentTarget.style.transform="scale(1)";}}
            onTouchStart={e=>{e.currentTarget.style.transform="scale(0.97)";}}
            onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";}}
            >
              <div style={{fontSize:36,filter:`drop-shadow(0 0 8px ${room.color}66)`}}>{room.icon}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{room.name}</div>
              <div style={{fontSize:11,color:`${room.color}cc`,fontWeight:500}}>{count} öğe</div>
            </div>
          );
        })}
      </div>
      <FAB onClick={()=>setRoomModal(true)} color="#f97316"/>
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title="Yeni Oda">
        <input style={inp} placeholder="Oda adı..." value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>İkon seç:</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:12}}>
          {roomIcons.map(ic=>(
            <button key={ic} onClick={()=>setRoomForm({...roomForm,icon:ic})} style={{
              width:40,height:40,borderRadius:10,fontSize:20,cursor:"pointer",
              background:roomForm.icon===ic?"rgba(59,130,246,0.2)":"rgba(255,255,255,0.04)",
              border:roomForm.icon===ic?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.06)",
              display:"flex",alignItems:"center",justifyContent:"center",
            }}>{ic}</button>
          ))}
        </div>
        <div style={{fontSize:12,opacity:.5,marginBottom:6}}>Renk seç:</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setRoomForm({...roomForm,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:roomForm.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={addRoom}>Oluştur</button>
      </Modal>
    </div>
  );

  const room=rooms.find(r=>r.id===activeRoom);
  if(!room){setActiveRoom(null);return null;}

  if(room.type==="project"||activeRoom==="projects") return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <span style={{fontSize:22}}>{room.icon}</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
        </div>
      </StickyHeader>
      {data.projects.length===0&&<p style={{textAlign:"center",opacity:.3,fontSize:14,padding:40}}>{t("proj.noProjects",lang)}</p>}
      {data.projects.map(p=>{
        const tasks=p.tasks||[];const d=tasks.filter(t=>t.done).length;
        const pct=tasks.length?Math.round(d/tasks.length*100):0;const open=exp===p.id;
        return (
          <div key={p.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:8}}>
            <div onClick={()=>setExp(open?null:p.id)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:11,opacity:.5,marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.tags?.map(t=><span key={t} style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
                    {p.deadline&&<span>📅 {p.deadline}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:stCol(p.status),background:`${stCol(p.status)}20`,padding:"4px 10px",borderRadius:8}}>{p.status}</span>
              </div>
              {tasks.length>0&&(<div style={{marginTop:10}}>
                <div style={{height:6,background:"rgba(255,255,255,0.08)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"#3b82f6",borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/>
                </div>
                <div style={{fontSize:11,opacity:.4,marginTop:4}}>{d}/{tasks.length} — %{pct}</div>
              </div>)}
            </div>
            {open&&(<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
              {p.description&&<p style={{fontSize:13,opacity:.6,margin:"0 0 10px"}}>{p.description}</p>}
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {PROJECT_STATUSES.map(s=>(<button key={s} onClick={()=>upSt(p.id,s)} style={{background:p.status===s?`${stCol(s)}20`:"rgba(255,255,255,0.04)",color:p.status===s?stCol(s):"#888",border:`1px solid ${p.status===s?stCol(s)+"40":"rgba(255,255,255,0.06)"}`,padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>{statusDisplay(s,lang)}</button>))}
              </div>
              {tasks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                <button onClick={()=>togPT(p.id,t.id)} style={checkBtnStyle(t.done)}>{t.done&&"✓"}</button>
                <span style={{fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.4:1}}>{t.title}</span>
              </div>))}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <input style={{...inp,flex:1,marginBottom:0}} placeholder={t("proj.addSub",lang)} value={tf.title} onChange={e=>setTf({title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addPT(p.id)}/>
                <button onClick={()=>addPT(p.id)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,padding:"0 18px",fontSize:18,cursor:"pointer"}}>+</button>
              </div>
              <button onClick={()=>delProject(p.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px",width:"100%",marginTop:12,fontSize:13,cursor:"pointer"}}>{t("proj.delete",lang)}</button>
            </div>)}
          </div>
        );
      })}
      <FAB onClick={()=>setModal(true)}/>
      <Modal open={modal} onClose={()=>setModal(false)} title={t("proj.new",lang)}>
        <input style={inp} placeholder={t("proj.new",lang)} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
        <input style={inp} placeholder={t("common.descOpt",lang)} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div style={{display:"flex",gap:8}}>
          <select style={{...inp,flex:1}} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{PROJECT_STATUSES.map(s=><option key={s} value={s}>{statusDisplay(s,lang)}</option>)}</select>
          <input style={{...inp,flex:1}} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
        </div>
        <input style={inp} placeholder={t("common.descOpt",lang)} value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addProject}>Oluştur</button>
      </Modal>
    </div>
  );

  const items=roomItems[activeRoom]||[];

  /* ── SPECIAL ROOM RENDERERS ── */
  if(activeRoom==="news" || room.type==="news") return <NewsRoom room={room} onBack={()=>setActiveRoom(null)} />;
  if(activeRoom==="music" || room.name==="Müziklerim") return <MusicRoom room={room} items={items} onBack={()=>setActiveRoom(null)} onAdd={(item)=>{const cur=roomItems[activeRoom]||[];update({...data,roomItems:{...roomItems,[activeRoom]:[item,...cur]}});}} onDel={(id)=>delItem(activeRoom,id)} />;
  if(activeRoom==="clothes" || room.type==="style") return <StyleLookbook room={room} items={items} onBack={()=>setActiveRoom(null)} onAdd={(item)=>{const cur=roomItems[activeRoom]||[];update({...data,roomItems:{...roomItems,[activeRoom]:[item,...cur]}});}} onDel={(id)=>delItem(activeRoom,id)} lang={lang} />;

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setActiveRoom(null)} style={{background:"rgba(255,255,255,0.08)",backdropFilter:"blur(4px)",border:"1px solid rgba(255,255,255,0.1)",color:"#ccc",width:34,height:34,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>◀</button>
          <span style={{fontSize:22}}>{room.icon}</span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{room.name}</h3>
          <button onClick={()=>delRoom(activeRoom)} style={{background:"none",border:"none",color:"#ef4444",fontSize:11,cursor:"pointer",opacity:.5}}>Sil</button>
        </div>
      </StickyHeader>
      {items.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:40,marginBottom:8}}>📦</div>
          <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>Bu oda boş</div>
          <div style={{fontSize:12,opacity:.25}}>+ ile öğe ekle</div>
        </div>
      )}
      {items.map(item=>(
        <div key={item.id} style={{background:"rgba(255,255,255,0.04)",borderRadius:16,padding:14,marginBottom:8,borderLeft:`3px solid ${room.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
              {item.description&&<div style={{fontSize:12,opacity:.5,marginTop:4,lineHeight:1.4}}>{item.description}</div>}
              {item.tags?.length>0&&(<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                {item.tags.map(t=><span key={t} style={{background:`${room.color}20`,color:room.color,padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
              </div>)}
            </div>
            <button onClick={()=>delItem(activeRoom,item.id)} style={delBtnStyle}>✕</button>
          </div>
          <div style={{fontSize:10,opacity:.25,marginTop:6}}>{item.createdAt}</div>
        </div>
      ))}
      <FAB onClick={()=>setItemModal(true)} color={room.color}/>
      <Modal open={itemModal} onClose={()=>setItemModal(false)} title={`${room.icon} ${room.name} — Yeni Öğe`}>
        <input style={inp} placeholder="Başlık..." value={itemForm.title} onChange={e=>setItemForm({...itemForm,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="Açıklama (opsiyonel)..." value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})}/>
        <input style={inp} placeholder="Etiketler (virgülle ayırın)" value={itemForm.tags} onChange={e=>setItemForm({...itemForm,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addItem}>Ekle</button>
      </Modal>
    </div>
  );
}

/* ═══════════ NOTES ═══════════ */
function Notes({ data, update, lang="tr" }) {
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState({title:"",content:"",color:"#3b82f6"});
  const [search,setSearch]=useState("");

  const save2=()=>{
    if(!form.title.trim())return;
    if(editing){
      update({...data,notes:data.notes.map(n=>n.id===editing?{...n,...form,updatedAt:today()}:n)});
    } else {
      update({...data,notes:[{id:uid(),...form,createdAt:today(),updatedAt:today()},...data.notes]});
    }
    setModal(false);setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});
  };
  const del=id=>update({...data,notes:data.notes.filter(n=>n.id!==id)});
  const edit=n=>{setForm({title:n.title,content:n.content,color:n.color||"#3b82f6"});setEditing(n.id);setModal(true);};

  const filtered=data.notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase())||n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>Notlar</h3>
          <span style={{fontSize:12,opacity:.4}}>{data.notes.length} not</span>
        </div>
        <input
          style={{...inp,marginBottom:0,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.06)"}}
          placeholder="🔍 Notlarda ara..."
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:8}}>📝</div>
            <div style={{fontSize:14,fontWeight:600,opacity:.4,marginBottom:4}}>{data.notes.length===0?t("notes.noNotes",lang):t("notes.noResult",lang)}</div>
            {data.notes.length===0&&<div style={{fontSize:12,opacity:.25}}>+ butonuna basarak ilk notunu yaz</div>}
          </div>
        )}
        {filtered.map(n=>(
          <div key={n.id} onClick={()=>edit(n)} style={{...cardStyle,padding:14,cursor:"pointer",borderTop:`3px solid ${n.color||"#3b82f6"}`,minHeight:100,boxShadow:`0 0 20px ${n.color||"#3b82f6"}18`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <h4 style={{margin:0,fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</h4>
              <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...delBtnStyle,fontSize:14,marginLeft:4}}>✕</button>
            </div>
            <p style={{fontSize:12,opacity:.5,margin:"8px 0 0",whiteSpace:"pre-wrap",maxHeight:70,overflow:"hidden",lineHeight:1.4}}>{n.content}</p>
            <div style={{fontSize:10,opacity:.25,marginTop:8}}>{n.updatedAt}</div>
          </div>
        ))}
      </div>
      <FAB onClick={()=>{setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});setModal(true);}} color="#14b8a6"/>
      <Modal open={modal} onClose={()=>{setModal(false);setEditing(null);}} title={editing?t("notes.edit",lang):t("notes.new",lang)}>
        <input style={inp} placeholder="Başlık..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:140,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder="İçerik yazın..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={save2}>{editing?t("notes.update",lang):t("common.save",lang)}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ SETTINGS ═══════════ */
function Settings({ data, update, onImport, user, onLogout, lang="tr", setLang }) {
  const fileRef = useRef(null);
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission());
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const enableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
    if (granted) {
      update({ ...data, settings: { ...data.settings, notifications: true } });
    }
  };

  const handleExport = () => {
    exportData();
    setMsg(t("set.backupDone",lang));
    setTimeout(() => setMsg(""), 2000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await importData(file);
      onImport(imported);
      setMsg(t("set.importDone",lang));
    } catch (err) {
      setMsg(t("common.error",lang) + ": " + err.message);
    }
    setImporting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const clearAll = () => {
    if (confirm(t("set.confirmDel",lang))) {
      const empty = { tasks: [], events: [], sports: [], projects: [], notes: [], settings: data.settings };
      update(empty);
      setMsg(t("set.deleted",lang));
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const taskCount = data.tasks.length;
  const eventCount = data.events.length;
  const sportCount = data.sports.length;
  const projectCount = data.projects.length;
  const noteCount = data.notes.length;

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{t("set.title",lang)}</h3>
      </StickyHeader>

      {msg && <div style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#3b82f6"}}>{msg}</div>}

      {/* User info */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>👤 {t("set.account",lang)}</h4>
        {user ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" style={{width:40,height:40,borderRadius:"50%"}}/>
              ) : (
                <div style={{width:40,height:40,borderRadius:"50%",background:"rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,color:"#3b82f6",fontWeight:700}}>
                  {(user.displayName||user.email||"?")[0].toUpperCase()}
                </div>
              )}
              <div>
                {user.displayName && <div style={{fontSize:14,fontWeight:600}}>{user.displayName}</div>}
                <div style={{fontSize:12,opacity:.5}}>{user.email}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:12,color:"#22c55e"}}>{t("set.cloudSync",lang)}</span>
            </div>
            <p style={{fontSize:11,opacity:.4,margin:"0 0 12px"}}>{t("set.syncDesc",lang)}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)"}}>
              {t("set.logout",lang)}
            </button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:12,color:"#f59e0b"}}>{t("set.guest",lang)}</span>
            </div>
            <p style={{fontSize:11,opacity:.4,margin:"0 0 12px"}}>{t("set.guestDesc",lang)}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"#3b82f6"}}>
              {t("set.loginOrReg",lang)}
            </button>
          </div>
        )}
      </div>

      {/* Language selector */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>🌍 {t("set.language",lang)}</h4>
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
          {LANGUAGES.map(l => {
            const active = lang === l.code;
            return (
              <div key={l.code} onClick={() => setLang(l.code)} style={{
                background: active ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                border: active ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "10px 4px", textAlign: "center", cursor: "pointer",
                transition: "all .2s",
                boxShadow: active ? "0 0 16px rgba(99,102,241,0.15)" : "none",
              }}>
                <div style={{fontSize:22,marginBottom:4}}>{l.flag}</div>
                <div style={{fontSize:10,fontWeight:active?700:500,color:active?"#818cf8":"#999",letterSpacing:".02em"}}>{l.code.toUpperCase()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>🔔 {t("set.notif",lang)}</h4>
        {!isNotificationSupported() ? (
          <p style={{fontSize:13,opacity:.5}}>{t("set.notifNoSupp",lang)}</p>
        ) : notifStatus === "granted" ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:13,color:"#22c55e"}}>{t("set.notifActive",lang)}</span>
            </div>
            <p style={{fontSize:12,opacity:.5,margin:0}}>{t("set.notifDesc",lang)}</p>
          </div>
        ) : notifStatus === "denied" ? (
          <p style={{fontSize:13,color:"#ef4444"}}>{t("set.notifDenied",lang)}</p>
        ) : (
          <button onClick={enableNotif} style={{...btnPrimary,marginTop:0,background:"#22c55e"}}>{t("set.notifEnable",lang)}</button>
        )}
      </div>

      {/* Data Stats */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>📊 {t("set.dataSummary",lang)}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {l:t("set.taskLabel",lang),v:taskCount},{l:t("set.eventLabel",lang),v:eventCount},
            {l:t("set.sportLabel",lang),v:sportCount},{l:t("set.projectLabel",lang),v:projectCount},
            {l:t("set.noteLabel",lang),v:noteCount},{l:t("set.totalLabel",lang),v:taskCount+eventCount+sportCount+projectCount+noteCount},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span style={{fontSize:13,opacity:.6}}>{s.l}</span>
              <span style={{fontSize:13,fontWeight:600}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>💾 {t("set.dataManage",lang)}</h4>
        <p style={{fontSize:12,opacity:.5,margin:"0 0 12px"}}>{t("set.dataDesc",lang)}</p>
        <button onClick={handleExport} style={{...btnPrimary,marginTop:0,marginBottom:8,background:"#14b8a6"}}>
          📥 {t("set.backup",lang)}
        </button>
        <button onClick={()=>fileRef.current?.click()} disabled={importing} style={{...btnPrimary,marginTop:0,background:"#a855f7"}}>
          {importing ? t("set.importing",lang) : "📤 "+t("set.import",lang)}
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
      </div>

      {/* AI Kalori Asistanı */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>🤖 {t("set.aiTitle",lang)}</h4>
        <p style={{fontSize:12,opacity:.5,margin:"0 0 12px"}}>{t("set.aiDesc",lang)}</p>

        {/* Provider selection */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[
            {id:"none",name:t("set.manualEntry",lang),desc:t("set.manualDesc",lang),icon:"✏️",color:"#888"},
            {id:"gemini",name:"Google Gemini",desc:"Ücretsiz, günde 60 istek",icon:"✨",color:"#3b82f6"},
            {id:"claude",name:"Claude (Anthropic)",desc:"En akıllı analiz, ücretli",icon:"🧠",color:"#a855f7"},
            {id:"openai",name:"OpenAI (ChatGPT)",desc:"Popüler, ücretli",icon:"🤖",color:"#22c55e"},
          ].map(p=>{
            const selected = (data.settings?.aiProvider||"none")===p.id;
            return (
              <div key={p.id} onClick={()=>update({...data,settings:{...data.settings,aiProvider:p.id}})} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,cursor:"pointer",
                background:selected?`${p.color}15`:"rgba(255,255,255,0.02)",
                border:selected?`1px solid ${p.color}40`:"1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:selected?p.color:"#ccc"}}>{p.name}</div>
                  <div style={{fontSize:10,opacity:.5}}>{p.desc}</div>
                </div>
                {selected&&<span style={{color:p.color,fontSize:16}}>●</span>}
              </div>
            );
          })}
        </div>

        {/* API Key input */}
        {data.settings?.aiProvider && data.settings.aiProvider!=="none" && (<>
          <input style={inp} type="password" placeholder={t("set.apiPaste",lang)}
            value={data.settings?.aiKey||""}
            onChange={e=>update({...data,settings:{...data.settings,aiKey:e.target.value}})}/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            {data.settings?.aiKey ? (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:11,color:"#22c55e"}}>{t("set.keySaved",lang)}</span></>
            ) : (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:11,color:"#f59e0b"}}>{t("set.keyNeeded",lang)}</span></>
            )}
          </div>
          <div style={{fontSize:10,opacity:.3,marginBottom:10}}>🔒 {t("set.keyPrivacy",lang)}</div>

          {/* Guide button */}
          <button onClick={()=>setMsg(
            data.settings.aiProvider==="gemini" ?
              "GOOGLE GEMİNİ REHBERİ:\n\n1. aistudio.google.com/apikey adresine git\n2. Gmail ile giriş yap\n3. 'Create API Key' butonuna bas\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n✅ Ücretsiz: Günde 60 istek, dakikada 15 istek\n💡 Gmail hesabın varsa 2 dakikada hazır!" :
            data.settings.aiProvider==="claude" ?
              "CLAUDE (ANTHROPİC) REHBERİ:\n\n1. console.anthropic.com adresine git\n2. Hesap oluştur (kredi kartı gerekli)\n3. API Keys → Create Key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n💰 Ücretli: İlk $5 ücretsiz kredi\n🧠 En detaylı analiz" :
              "OPENAİ (CHATGPT) REHBERİ:\n\n1. platform.openai.com adresine git\n2. Hesap oluştur veya giriş yap\n3. API Keys → Create new secret key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n💰 Ücretli: İlk $5 ücretsiz kredi\n🤖 Popüler ve güvenilir"
          )} style={{
            width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(59,130,246,0.2)",
            background:"rgba(59,130,246,0.08)",color:"#3b82f6",fontSize:13,cursor:"pointer",fontWeight:600,
          }}>
            📖 {data.settings.aiProvider==="gemini"?"Gemini":data.settings.aiProvider==="claude"?"Claude":"OpenAI"} API Anahtarı Nasıl Alınır?
          </button>
        </>)}
      </div>

      {/* Danger zone */}
      <div style={{background:"rgba(255,255,255,0.04)",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#ef4444"}}>⚠️ {t("set.danger",lang)}</h4>
        <button onClick={clearAll} style={{...btnPrimary,marginTop:0,background:"#ef4444"}}>
          {t("set.deleteAll",lang)}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ LOGIN SCREEN ═══════════ */
function LoginScreen({ onLogin, lang="tr", setLang }) {
  const [mode, setMode] = useState("login"); // login, register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true); setError("");
    const { user, error } = await signInWithGoogle();
    if (error) setError(error);
    setLoading(false);
  };

  const handleEmail = async () => {
    if (!email.trim() || !password.trim()) { setError(t("login.emailReq",lang)); return; }
    setLoading(true); setError("");
    const fn = mode === "register" ? registerWithEmail : signInWithEmail;
    const { user, error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const handleSkip = () => { onLogin(null); };

  return (
    <NebulaBackground style={{padding:16,cursor:"default"}}>
      <style>{NEBULA_KEYFRAMES}</style>
      {/* Mini language switcher */}
      {setLang && (
        <div style={{position:"absolute",top:16,right:16,display:"flex",gap:4,zIndex:10}}>
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} style={{
              background: lang===l.code ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              border: lang===l.code ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "4px 8px", cursor: "pointer", fontSize: 14,
              transition: "all .2s",
            }}>{l.flag}</button>
          ))}
        </div>
      )}
      <div style={{width:"100%",maxWidth:380,animation:"fadeInUp 0.7s ease both"}}>
        {/* Title block */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{
            fontSize:52,fontWeight:900,letterSpacing:-2,
            background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 40%,#6366f1 70%,#818cf8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"glowPulse 4s ease-in-out infinite",
            lineHeight:1.1,
          }}>Zimu</div>
          <div style={{
            fontSize:14,opacity:.55,marginTop:10,fontStyle:"italic",
            letterSpacing:.5,lineHeight:1.6,
          }}>
            {t("splash.motto1",lang)}<br/>
            <span style={{opacity:.7,fontSize:12}}>{t("splash.motto2",lang)}</span>
          </div>
        </div>

        {/* Glassmorphism card */}
        <div style={{
          background:"rgba(255,255,255,0.04)",
          backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
          border:"1px solid rgba(255,255,255,0.08)",
          borderRadius:20,padding:"28px 24px",
          boxShadow:"0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          {/* Error */}
          {error && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
              borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#ef4444",textAlign:"center"}}>
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:14,border:"1px solid rgba(255,255,255,0.1)",
            background:"rgba(255,255,255,0.06)",color:"#e0d5f5",fontSize:15,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18,
            opacity:loading?.6:1,transition:"all .2s",
          }}>
            <span style={{fontSize:18,fontWeight:700}}>G</span>
            {t("login.google",lang)}
          </button>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent)"}}/>
            <span style={{fontSize:12,opacity:.35,letterSpacing:1}}>{t("login.or",lang)}</span>
            <div style={{flex:1,height:1,background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.2),transparent)"}}/>
          </div>

          {/* Email/Password */}
          <input type="email" placeholder={t("login.email",lang)} value={email}
            onChange={e=>setEmail(e.target.value)}
            style={{...inp,marginBottom:8,borderRadius:14,border:"1px solid rgba(255,255,255,0.08)"}} />
          <input type="password" placeholder={t("login.password",lang)} value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleEmail()}
            style={{...inp,borderRadius:14,border:"1px solid rgba(255,255,255,0.08)"}} />

          <button onClick={handleEmail} disabled={loading} style={{
            ...btnPrimary,opacity:loading?.6:1,marginBottom:12,borderRadius:14,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
          }}>
            {loading ? t("login.wait",lang) : mode === "register" ? t("login.register",lang) : t("login.signIn",lang)}
          </button>

          {/* Toggle mode */}
          <div style={{textAlign:"center",marginBottom:4}}>
            <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{
              background:"none",border:"none",color:"#a78bfa",fontSize:13,cursor:"pointer",
            }}>
              {mode === "login" ? t("login.noAccount",lang) : t("login.hasAccount",lang)}
            </button>
          </div>
        </div>

        {/* Skip */}
        <div style={{textAlign:"center",marginTop:20,animation:"fadeIn 1s ease 0.5s both"}}>
          <button onClick={handleSkip} style={{
            background:"none",border:"none",color:"rgba(167,139,250,0.45)",fontSize:12,cursor:"pointer",
          }}>
            {t("login.skip",lang)}
          </button>
          <div style={{fontSize:10,opacity:.2,marginTop:4}}>
            {t("login.skipNote",lang)}
          </div>
        </div>
      </div>
    </NebulaBackground>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
const DEFAULT_DATA = {tasks:[],events:[],sports:[],projects:[],notes:[],foods:[],rooms:[],roomItems:{},settings:{},dailyThoughts:["","",""]};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lang, setLang] = useState(() => localStorage.getItem("zimu-lang") || "tr");
  const isMobile = useIsMobile();
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { localStorage.setItem("zimu-lang", lang); }, [lang]);
  const TABS = getTabs(lang);

  // ── BOOT SEQUENCE: load data immediately, don't wait for anything ──
  useEffect(() => {
    // 1. Load local data RIGHT NOW
    try {
      loadData(null).then(d => {
        setData(d && typeof d === "object" ? d : DEFAULT_DATA);
      }).catch(() => setData(DEFAULT_DATA));
    } catch(e) {
      setData(DEFAULT_DATA);
    }

    // 2. Listen firebase auth in background (non-blocking)
    try {
      const unsub = onAuthChange((fu) => {
        if (fu) {
          setUser(fu);
          // Re-load with user ID
          loadData(fu.uid).then(d => {
            if (d && typeof d === "object") setData(d);
          }).catch(() => {});
        }
      });
      // cleanup
      return () => { try { unsub(); } catch(e) {} };
    } catch(e) {
      // firebase broken? no problem, app still works
    }
  }, []);

  // 3. Splash auto-dismiss + GUARANTEED data after 3s
  useEffect(() => {
    const t1 = setTimeout(() => setShowSplash(false), 2500);
    const t2 = setTimeout(() => {
      setData(prev => {
        if (!prev || typeof prev !== "object") return DEFAULT_DATA;
        return prev;
      });
      setShowSplash(false);
    }, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Schedule notifications
  useEffect(() => {
    if (!data) return;
    if (getNotificationPermission() === "granted") {
      scheduleEventReminders(data.events, data.settings?.reminderMinutes || 15);
      scheduleTaskReminders(data.tasks);
    }
  }, [data?.events, data?.tasks]);

  // Scroll to top when tab changes
  useEffect(() => {
    if (isMobile) {
      window.scrollTo(0, 0);
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [tab, isMobile]);

  // Mobile scroll listener
  useEffect(() => {
    if (!isMobile) return;
    const handleWindowScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [isMobile]);

  // Desktop scroll listener
  const handleScroll = useCallback((e) => {
    const top = e?.target?.scrollTop ?? window.scrollY;
    setShowScrollTop(top > 300);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile, handleScroll]);

  const update = useCallback(async (newData) => {
    setData(newData);
    const userId = user?.uid || null;
    await saveData(newData, userId);
  }, [user]);

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 2000);
  };

  const handleLogin = (firebaseUser) => {
    if (firebaseUser === null) {
      localStorage.setItem('zimu-skip-login', 'true');
    }
  };

  const handleLogout = async () => {
    try { await logOut(); } catch(e) {}
    localStorage.removeItem('zimu-skip-login');
    setUser(null);
    setData(DEFAULT_DATA);
  };

  const allTabs = [...TABS, { id: "settings", label: t("tab.settings", lang), icon: "⚙" }];

  // ══════════ RENDER ══════════
  // Only two states: splash or app. NO login gate.

  // Use appData everywhere — guaranteed non-null
  const appData = data || DEFAULT_DATA;

  // SPLASH: show while splash timer active AND data not ready
  if (showSplash) return (
    <NebulaBackground
      onClick={() => {
        setShowSplash(false);
        if (!data) setData(DEFAULT_DATA);
      }}
      style={{cursor:"pointer",userSelect:"none"}}
    >
      <style>{NEBULA_KEYFRAMES + `
        @keyframes titleReveal {
          0%   { opacity:0; letter-spacing:12px; filter:blur(12px); }
          100% { opacity:1; letter-spacing:-3px;  filter:blur(0); }
        }
        @keyframes lineGrow { from { width:0; opacity:0; } to { width:120px; opacity:1; } }
        @keyframes subtitleIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
      `}</style>
      <div style={{
        fontSize:72,fontWeight:900,
        background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 30%,#6366f1 60%,#818cf8 100%)",
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
        animation:"titleReveal 1.2s cubic-bezier(.22,1,.36,1) both, glowPulse 4s ease-in-out 1.2s infinite",
        lineHeight:1,marginBottom:8,textAlign:"center",
      }}>Zimu</div>
      <div style={{ height:2,borderRadius:1,marginBottom:20,
        background:"linear-gradient(90deg, transparent, rgba(167,139,250,0.5), rgba(99,102,241,0.6), rgba(167,139,250,0.5), transparent)",
        animation:"lineGrow 0.8s ease 0.6s both",
      }}/>
      <div style={{textAlign:"center",animation:"subtitleIn 0.8s ease 1s both"}}>
        <div style={{fontSize:16,opacity:.6,fontStyle:"italic",letterSpacing:.5,lineHeight:1.8}}>{t("splash.motto1", lang)}</div>
        <div style={{fontSize:13,opacity:.35,fontStyle:"italic",letterSpacing:.5}}>{t("splash.motto2", lang)}</div>
      </div>
      <div style={{ position:"absolute",bottom:48, fontSize:11,opacity:.3,letterSpacing:1, display:"flex",alignItems:"center",gap:8 }}>
        <span style={{animation:"shimmer 2s ease-in-out 1.5s infinite"}}>{t("splash.tap", lang)}</span>
      </div>
    </NebulaBackground>
  );

  // ── MAIN APP ──

  const content = () => {
    switch(tab) {
      case "dashboard": return <Dashboard data={appData} setTab={setTab} update={update} lang={lang}/>;
      case "tasks": return <Tasks data={appData} update={update} lang={lang}/>;
      case "calendar": return <CalendarView data={appData} update={update} lang={lang}/>;
      case "sports": return <Sports data={appData} update={update} lang={lang}/>;
      case "projects": return <Projects data={appData} update={update} lang={lang}/>;
      case "notes": return <Notes data={appData} update={update} lang={lang}/>;
      case "settings": return <Settings data={appData} update={update} onImport={d=>{setData(d);showToast(t("set.importDone",lang))}} user={user} onLogout={handleLogout} lang={lang} setLang={setLang}/>;
    }
  };

  // Swipe navigation
  const tabOrder = allTabs.map(t => t.id);

  const handleTouchStart = (e) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    const minSwipe = 80;
    if (Math.abs(distance) < minSwipe) return;
    const currentIndex = tabOrder.indexOf(tab);
    if (distance > 0 && currentIndex < tabOrder.length - 1) {
      setTab(tabOrder[currentIndex + 1]);
    } else if (distance < 0 && currentIndex > 0) {
      setTab(tabOrder[currentIndex - 1]);
    }
    touchStart.current = null;
    touchEnd.current = null;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const NAV_HEIGHT = 64;
  const SAFE_BOTTOM = isMobile ? 20 : 0;
  const CONTENT_PAD_BOTTOM = (isMobile ? NAV_HEIGHT + SAFE_BOTTOM + 30 : NAV_HEIGHT + 24);

  const phoneContent = (
    <div style={{
      width:"100%",
      minHeight:isMobile?"100dvh":"100vh",
      background:"#060611",color:"#e0e0e0",
      fontFamily:"'SF Pro Display',-apple-system,'Segoe UI',sans-serif",
      position:"relative",
    }}>
      {/* Nebula ambient orbs — fixed position, behind content */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",width:300,height:300,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)",
          top:"-80px",left:"-60px",animation:"orb1 12s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:250,height:250,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(168,85,247,0.10) 0%,transparent 70%)",
          bottom:"20%",right:"-50px",animation:"orb2 15s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:200,height:200,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(34,197,94,0.07) 0%,transparent 70%)",
          bottom:"-40px",left:"20%"}}/>
      </div>
      {/* Content area */}
      <div
        ref={isMobile?null:scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
        style={{
          padding:`16px ${isMobile?"16px":"clamp(16px, 5vw, 60px)"} ${CONTENT_PAD_BOTTOM}px`,
          minHeight: isMobile ? "100dvh" : "100vh",
          maxWidth: isMobile ? undefined : 800,
          margin: isMobile ? undefined : "0 auto",
        }}
      >
        {content()}
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} style={{
          position:"fixed",
          right:16,
          bottom:NAV_HEIGHT + SAFE_BOTTOM + 70,
          width:40,height:40,
          borderRadius:"50%",
          background:"rgba(59,130,246,0.9)",
          color:"#fff",border:"none",
          fontSize:18,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 4px 12px rgba(0,0,0,0.3)",
          zIndex:999,
        }}>▲</button>
      )}

      {/* Bottom nav bar */}
      <div style={{
        position:"fixed",
        bottom:0,
        left:0,right:0,
        background:"rgba(4,4,14,0.95)",
        backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        borderTop:"1px solid rgba(255,255,255,0.1)",
        display:"flex",justifyContent:"center",alignItems:"center",
        height:NAV_HEIGHT,
        paddingTop:4,
        paddingBottom:isMobile?"env(safe-area-inset-bottom, 8px)":"6px",
        paddingLeft:4,paddingRight:4,
        zIndex:1000,
      }}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",width:"100%",maxWidth:isMobile?undefined:600}}>
        {allTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:tab===t.id?"rgba(59,130,246,0.15)":"none",
            boxShadow:tab===t.id?"0 0 20px rgba(59,130,246,0.25)":undefined,
            border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:isMobile?4:3,
            padding:isMobile?"10px 6px":"8px 12px",
            minWidth:isMobile?52:50,
            borderRadius:14,
            color:tab===t.id?"#3b82f6":"#555",
            transition:"all .15s",
            flex:1,
          }}>
            <span style={{fontSize:isMobile?22:18,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:isMobile?10:9,fontWeight:tab===t.id?700:500,letterSpacing:-.2}}>{t.label}</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
        @keyframes slideDown { from{transform:translateY(-20px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes checkPop { 0%{transform:scale(1)} 40%{transform:scale(1.25)} 70%{transform:scale(0.9)} 100%{transform:scale(1)} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes orb1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-20px)} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
        .task-check-done { animation: checkPop .3s ease; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12);border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
        html, body { margin:0; padding:0; overscroll-behavior:none; background:#060611; overflow:auto; height:auto; }
        #root { height:auto; }
        select option { background:#1a1a2e; color:#e0e0e0; }
        @media(display-mode:standalone){ 
          html, body { background:#060611; overflow:auto; height:auto; }
          #root { height:auto; }
          body { padding-top: env(safe-area-inset-top); } 
        }
      `}</style>

      <Toast {...toast} />

      {isMobile ? (
        /* Mobile: full screen */
        phoneContent
      ) : (
        /* Desktop: full page, no phone frame */
        phoneContent
      )}
    </>
  );
}
