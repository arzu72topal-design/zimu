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

/* ── i18n — Dil Desteği ── */
const TRANSLATIONS = {
  tr: {
    // Nav
    home:"Ana Sayfa", tasks:"Görevler", lifestyle:"Yaşam Tarzı", settings:"Ayarlar",
    // Greetings
    goodMorning:"Günaydın", goodAfternoon:"İyi günler", goodEvening:"İyi akşamlar",
    // Dashboard
    taskStatus:"Görev Durumu", todaySummary:"Bugünün özeti",
    pending:"Bekleyen", event:"Etkinlik", project:"Proje",
    calorieTrack:"Kalori Takibi", noFoodToday:"Henüz bugün yemek kaydı yok",
    addFood:"+ Yemek", addSport:"+ Spor",
    styleMotiv:"Bugün harika görüneceksin!", styleReady:"Hava durumuna göre stil önerilerin hazır",
    overdueAlert:"gecikmiş görev!", checkNow:"Hemen kontrol et",
    todaySchedule:"Bugünün Programı", noEventToday:"Bugün planlanmış etkinlik yok",
    goCalendar:"Takvim'e git ve etkinlik ekle",
    thisWeek:"Bu Hafta", workout:"Antrenman", kcalBurned:"kcal yakıldı", taskDone:"Görev bitti",
    thoughts:"Bugün Kafamı Kurcalayanlar",
    thought1:"Bugün en çok düşündüğüm şey...", thought2:"Kafamı karıştıran bir şey...", thought3:"Çözmek istediğim bir sorun...", saveToNotes:"Notlara kaydet",
    bbcNews:"Haberler", newsLoading:"Haberler yükleniyor...",
    musicCol:"Müzik Koleksiyonu", musicEmpty:"Müzik koleksiyonu boş",
    musicEmptyDesc:"Yaşam Tarzı → Müziklerim'e git ve ekle",
    recentNotes:"Son Notlar",
    // Tasks
    waiting:"bekliyor", all:"Tümü", pendingF:"Bekleyen", done:"Bitti",
    priorityF:"Öncelikli", overdueF:"Gecikmiş",
    allDone:"Tüm görevler tamamlandı!", noTasks:"Henüz görev yok", addFirst:"İlk görevini ekle",
    newTask:"Yeni Görev", editTask:"Görevi Düzenle", taskTitle:"Görev başlığı...",
    selDate:"Tarih seç:", today:"Bugün", tomorrow:"Yarın", thisWeekS:"Bu Hafta",
    selPriority:"Öncelik:", low:"Düşük", medium:"Orta", high:"Yüksek",
    category:"Kategori (opsiyonel):",
    save:"Kaydet", add:"Ekle", del:"Sil", cancel:"İptal", update:"Güncelle", create:"Oluştur",
    // Calendar
    calendar:"Takvim", newEvent:"Yeni Etkinlik", eventName:"Etkinlik adı...",
    noEvents:"Etkinlik yok", time:"Saat", desc:"Açıklama", color:"Renk",
    repeat:"Tekrar", none:"Yok", daily:"Günlük", weekly:"Haftalık", monthly:"Aylık",
    upcomingEv:"Yaklaşan Etkinlikler",
    // Notes
    notes:"Notlar", newNote:"Yeni Not", editNote:"Notu Düzenle",
    searchNotes:"Notlarda ara...", noNotes:"Henüz not yok", noResult:"Arama sonucu bulunamadı",
    noteTitle:"Başlık...", noteContent:"İçerik...",
    // Health Coach
    healthCoach:"Sağlık Koçu", dailyBalance:"Günlük Denge",
    intake:"Alınan", burned:"Yakılan", net:"Net", target:"Hedef",
    todayFoods:"Bugünün Yemekleri", noFoodYet:"Henüz yemek kaydı yok",
    todaySports:"Bugünün Sporları", noSportYet:"Henüz spor kaydı yok",
    addMeal:"Yemek Ekle", addExercise:"Spor Ekle",
    searchFood:"Yemek ara (pilav, salata...)", myFoods:"Benim Yemeklerim",
    notFound:"bulunamadı", enterManual:"Kaloriyi elle gir veya Ayarlar'dan AI aç",
    meal:"Öğün:", breakfast:"Kahvaltı", lunch:"Öğle", dinner:"Akşam", snack:"Atıştırma",
    calorie:"Kalori", sportType:"Spor Türü:", duration:"Süre (dk)", distance:"Mesafe (km)",
    sportTypes:["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"],
    // Lifestyle
    lifestyleTitle:"Yaşam Tarzı", lifestyleDesc:"Kişisel alanların — odalarına dokun ve keşfet",
    items:"öğe", newRoom:"Yeni Oda", roomName:"Oda adı...", selColor:"Renk seç:",
    // Projects
    projects:"Projeler", newProject:"Yeni Proje", projectName:"Proje adı...", noProjects:"Henüz proje yok",
    // News
    news:"Haberler", newsLoadFail:"Haber yüklenemedi", checkInternet:"İnternet bağlantını kontrol et",
    retry:"Tekrar Dene", noTrNews:"Türkçe haber bulunamadı",
    otherLangAvail:"Diğer dillerde haber mevcut", showAll:"Tümünü Göster",
    categories:"kategori",
    // Music
    myMusic:"Müziklerim", emptyCol:"Koleksiyonun boş",
    emptyColDesc:"Deezer'dan ara veya link yapıştır",
    searchDeezer:"Deezer'da Ara", addLink:"Link Ekle",
    searchMusic:"Şarkı, sanatçı veya albüm ara...",
    collection:"Koleksiyon", search:"Ara", charts:"Listeler", link:"Link",
    piece:"parça", howToUse:"Nasıl kullanılır?",
    // Clothing
    myStyle:"Kıyafetlerim", todayWeather:"Bugünün Havası", gettingLoc:"Konum alınıyor...",
    styleAdvice:"Stil Önerisi", calculating:"Hesaplanıyor...", noWeather:"Hava bilgisi mevcut değil",
    todayLooks:"Bugün İçin Görünümler", styleRules:"Stil Kuralları & Sınırlar",
    colorPalette:"Renk Paleti Disiplini", myCloset:"Dolabım",
    top:"Üst", bottom:"Alt", outer:"Dış", dress:"Elbise", wore:"Giydim",
    addClothing:"Kıyafet Ekle", clothingName:"Kıyafet adı (örn: Lacivert Blazer)",
    noClothesCat:"Bu kategoride kıyafet yok",
    wind:"rüzgar", humidity:"nem", feelsLike:"hissedilen",
    // Settings
    settingsTitle:"Ayarlar", language:"Dil",
    aiCalorie:"AI Kalori Tahmini", notifTitle:"Bildirimler",
    dataBackup:"Veri Yedekleme", exportData:"Yedek İndir", importData:"Yedek Yükle",
    deleteAll:"Tüm Verileri Sil", logout:"Çıkış Yap",
    notifNotSupported:"Bu tarayıcı bildirimleri desteklemiyor",
    deleteConfirm:"Tüm veriler silinecek. Emin misiniz?",
    // Voice
    listening:"Dinliyorum...", startSpeaking:"Konuşmaya başlayın", voiceInput:"Sesli giriş",
    notUnderstood:"Anlaşılamadı",
    taskAdded:"Görev eklendi", noteAdded:"Not eklendi", foodAdded:"Yemek eklendi",
    sportAdded:"Spor eklendi", eventAdded:"Etkinlik eklendi",
    goingTo:"gidiliyor",
    // Sağlık Koçu detay
    yourCoach:"Sağlık Koçun", targetKcal:"Hedef: {0} kcal",
    noRecordYet:"Bugün henüz kayıt yok. Yediklerini ve sporunu kaydet, sağlık koçun seni yönlendirsin!",
    addMealBtn:"+ Yemek Ekle", addSportBtn:"+ Spor Ekle",
    sportDuration:"Spor süresi", burnedKcal:"Yakılan kcal", distanceLabel:"Mesafe",
    myFoodsLabel:"Benim Yemeklerim",
    // Common
    back:"Geri", viewAll:"Tümü ▶", loading:"Yükleniyor...",
    note:"not", task:"Görev", eventType:"Etkinlik",
    // Eksik çeviriler
    addMealTitle:"Yemek Ekle", addSportTitle:"Spor Ekle", addClothTitle:"Kıyafet Ekle",
    askAI:"AI'a sor", analyzing:"Analiz ediliyor...", photoCalorie:"Fotoğrafla Kalori Hesapla",
    descOpt:"Açıklama (opsiyonel)...", catOpt:"Kategori (opsiyonel)",
    foodName:"Yemek adı", kcalUnit:"kcal", notesOpt:"Notlar (opsiyonel)",
    addSubtask:"Alt görev ekle...", descField:"Açıklama...", tagsField:"Etiketler (virgülle ayırın)",
    trackNameOpt:"Parça adı (opsiyonel)",
    account:"Hesap", cloudSync:"Bulut senkronizasyon aktif",
    cloudSyncDesc:"Veriler tüm cihazlarında otomatik senkronize edilir",
    backupDownloaded:"Yedek dosyası indirildi!", dataImported:"Veriler başarıyla aktarıldı!",
    dataDeleted:"Tüm veriler silindi", enableNotif:"Bildirimleri Aç",
    searchSongs:"Şarkı, sanatçı veya albüm ara...",
    sportNames:["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"],
    locale:"tr-TR", speechLang:"tr-TR",
    // Ay ve gün isimleri
    months:["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
    daysShort:["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],
    // Öncelik
    priHigh:"Yüksek", priMed:"Orta", priLow:"Düşük",
    // Görev grupları
    grpOverdue:"Gecikmiş", grpToday:"Bugün", grpWeek:"Bu Hafta", grpPending:"Bekleyen",
    // Oda isimleri
    rmProjects:"Projeler", rmNews:"Haberler", rmMusic:"Müziklerim",
    rmClothes:"Kıyafetlerim", rmMemories:"Anılar", rmHealth:"Sağlık Koçu",
    // Haber kategorileri
    catSpor:"Spor", catTek:"Teknoloji", catEko:"Ekonomi", catPol:"Politika",
    catSag:"Sağlık", catBil:"Bilim", catSan:"Sanat", catDun:"Dünya",
    catSporD:"Futbol, basketbol & dünya sporları", catTekD:"Yapay zeka, gadget & yazılım",
    catEkoD:"Piyasalar, borsa & iş dünyası", catPolD:"Dünya siyaseti & gündem",
    catSagD:"Tıp, beslenme & wellness", catBilD:"Uzay, keşifler & araştırmalar",
    catSanD:"Kültür, sanat & eğlence", catDunD:"Dünya haberleri & olaylar",
    catSon:"Son Dakika", catSonD:"Anlık gelişmeler & flaş haberler",
    mySources:"Kaynaklarım", mySourcesD:"Kendi eklediğin haber kaynakları",
    addSource:"Kaynak Ekle", suggestedSources:"Önerilen Kaynaklar", manualUrl:"Manuel URL",
    feedUrl:"RSS feed URL'si", feedName:"Kaynak adı", feedAdded:"Kaynak eklendi",
    feedRemoved:"Kaynak kaldırıldı", feedExists:"Bu kaynak zaten ekli",
    noCustomFeeds:"Henüz kaynak eklemedin", addFirstSource:"İlk kaynağını ekle",
    // Memories
    memories:"Anılar", allMemories:"Tüm Anılar", newMemory:"Yeni Anı", editMemory:"Anıyı Düzenle",
    memoryTitle:"Anı başlığı...", memoryText:"Ne oldu? Neler hissettin...",
    memoryDate:"Tarih", memoryMood:"Nasıl hissettirdi?", memoryFolder:"Klasör",
    memoryPhotos:"Fotoğraflar", addPhoto:"Fotoğraf Ekle", takePhoto:"Çek", choosePhoto:"Seç",
    newFolder:"Yeni Klasör", folderName:"Klasör adı...", noMemories:"Henüz anı yok",
    addFirstMemory:"İlk anını kaydet", memoryCount:"anı", timeline:"Zaman Çizelgesi",
    folders:"Klasörler", deleteFolder:"Klasörü sil", deleteFolderConfirm:"Bu klasör ve içindeki anılar silinsin mi?",
    noFolder:"Klasörsüz", searchMemories:"Anılarda ara...",
    touchToExplore:"Bir kategoriye dokun ve haberleri keşfet",
    // Settings bölümleri
    notifications:"Bildirimler", dataSummary:"Veri Özeti", dataManagement:"Veri Yönetimi",
    dangerZone:"Tehlikeli Bölge", notifActive:"Bildirimler aktif",
    reminderBefore:"Hatırlatma zamanı", reminderMinLabel:"dk önce",
    eventReminders:"Etkinlik hatırlatmaları", taskReminders:"Görev hatırlatmaları",
    taskRemindDesc:"Bugünkü görevler için sabah hatırlatma", quietHours:"Sessiz saatler",
    quietHoursDesc:"Bu saatler arasında bildirim gelmez",
    notifBlocked:"Bildirimler engellendi. Tarayıcı ayarlarından izin verin.",
    dataDesc:"Bilgisayarınızdan veri aktarabilir veya yedeğinizi indirebilirsiniz",
    total:"Toplam", sportRecord:"Spor Kaydı",
    // Kalori detay
    todayIntake:"Bugün: {0} alındı · {1} yakıldı",
    // Not boş durum
    noNotesYet:"Henüz not yok", addFirstNote:"+ butonuna basarak ilk notunu yaz",
    // Hızlı tarih
    // Kıyafet detay
    wearScore:"Giyim Sıklığı Skoru", wardrobeWaiting:"Dolapta bekleyen parçalar var",
    wardrobeOptimal:"Optimum aralıkta", wardrobePerfect:"Mükemmel, aktif dolap!",
    paletteTap:"Renklere dokun — aktif paletini belirle", paletteActive:"{0} renk seçili — disiplin aktif",
    timesWorn:"{0} kez giyildi", neverWorn:"Henüz giyilmedi", woreToday:"Bugün Giydim",
    addToCloset:"Dolaba Ekle", categoryLabel:"Kategori:", clothColor:"Kıyafet rengi:",
    rule1:"İş ortamına uygun", rule2:"Sürdürülebilir palet", rule3:"Bu ay yeni alım yok", rule4:"Tekrar giymeden ekleme yok",
    // Stil önerileri
    style1:"Kalın katmanlar, kaşmir ve palto zamanı", style2:"Ceket veya trençkot — katmanlı kombinler",
    style3:"Uzun kollu + hafif ceket, mükemmel geçiş havası", style4:"İnce kazak veya gömlek — konfor bölgesi",
    style5:"Hafif kumaşlar, nefes alan renkler", style6:"Yazlık kombinler, pamuklu ve keten öncelik",
    // Look tag ve mood
    tagWork:"İş", tagCasual:"Günlük", tagElegant:"Zarif", tagCool:"Serin", tagWarm:"Yaz", tagSimple:"Sade",
    moodConfident:"Özgüvenli", moodConfidentPro:"Özgüvenli & Profesyonel",
    moodComfy:"Rahat & Sıcak", moodPeaceful:"Huzurlu & Güçlü",
    moodChic:"Rahat & Şık", moodStrong:"Güçlü & Net",
    moodEnergetic:"Enerjik & Hafif", moodNatural:"Doğal & Serin", moodFree:"Güçlü & Özgür",
    lookLayered:"Katmanlı Şık", lookCasualLayer:"Casual Layered", lookSmartCozy:"Smart Cozy",
    noDue:"Tarih yok", roomEmpty:"Bu oda boş", addItemHint:"+ ile öğe ekle",
    // Login
    loginTitle:"Giriş Yap", registerTitle:"Kayıt Ol", waitLogin:"Bekleyin...",
    guestMode:"Misafir modu", noAccount:"Hesabın yok mu? Kayıt ol",
    hasAccount:"Zaten hesabın var mı? Giriş yap", googleLogin:"Google ile Giriş Yap",
    orDivider:"veya", emailPlaceholder:"Email adresi", passwordPlaceholder:"Şifre (en az 6 karakter)",
    emailRequired:"Email ve şifre gerekli", skipLogin:"Giriş yapmadan devam et →",
    localOnly:"Veriler sadece bu cihazda kalır", localOnlyDesc:"Veriler sadece bu cihazda saklanıyor. Giriş yaparak tüm cihazlarında senkronize edebilirsin.",
    tapToContinue:"Devam etmek için dokun",
    // Proje statusleri
    statPlanning:"Planlama", statProgress:"Devam Ediyor", statTest:"Test", statDone:"Tamamlandı",
    // Takvim select
    repeatNone:"Tekrarlama yok", repeatDaily:"Her gün", repeatWeekly:"Her hafta", repeatMonthly:"Her ay",
    // Kıyafet frekans
    freqFavorite:"Favori", freqFrequent:"Sık", freqWaiting:"Bekliyor", freqNew:"Yeni",
    // Görev detay
    edit:"Düzenle", deleteTask:"Görevi Sil", deleteProject:"Projeyi Sil",
    statusDone:"Tamamlandı", statusWaiting:"Bekliyor", grpDone:"Tamamlanan",
    // Hızlı tarih
    oneWeek:"1 Hafta", oneMonth:"1 Ay", clear:"Temizle",
    // Takvim ek
    upcoming:"Yaklaşan", addBtn:"+ Ekle",
    // Müzik tabs
    musicTabMine:"Benim", musicTabSearch:"Ara",
    musicSearching:"Aranıyor...", musicSearchDeezer:"Deezer'da Ara", musicNoResult:"Sonuç bulunamadı",
    musicAddToCol:"Koleksiyona Ekle", musicChecking:"Kontrol ediliyor...",
    musicChartLoading:"Liste yükleniyor...", musicChartFail:"Liste yüklenemedi",
    musicDeezerSearch:"Deezer veritabanında 90M+ parça",
    musicLinkDesc:"Spotify, YouTube, SoundCloud, Apple Music veya herhangi bir müzik linkini yapıştır.",
    musicHowTo:"Nasıl kullanılır?",
    musicHowToSteps:"1. Spotify'dan bir parça aç → 3 nokta → \"Paylaş\" → \"Linki kopyala\"\n2. Yukarıdaki kutuya yapıştır\n3. \"Koleksiyona Ekle\" ye bas",
    // Voice
    voiceCommands:"Komutlar: \"görev ekle: ...\", \"not ekle: ...\", \"yemek ekle: ...\", \"spor ekle: ...\", \"etkinlik ekle: ...\"",
  },
  en: {
    home:"Home", tasks:"Tasks", lifestyle:"Lifestyle", settings:"Settings",
    goodMorning:"Good morning", goodAfternoon:"Good afternoon", goodEvening:"Good evening",
    taskStatus:"Task Status", todaySummary:"Today's summary",
    pending:"Pending", event:"Event", project:"Project",
    calorieTrack:"Calorie Tracking", noFoodToday:"No food logged today",
    addFood:"+ Food", addSport:"+ Sport",
    styleMotiv:"You'll look amazing today!", styleReady:"Style suggestions ready based on weather",
    overdueAlert:"overdue task(s)!", checkNow:"Check now",
    todaySchedule:"Today's Schedule", noEventToday:"No events scheduled for today",
    goCalendar:"Go to Calendar and add an event",
    thisWeek:"This Week", workout:"Workout", kcalBurned:"kcal burned", taskDone:"Tasks done",
    thoughts:"What's on My Mind",
    thought1:"What I'm thinking about the most...", thought2:"Something that's bugging me...", thought3:"A problem I want to solve...", saveToNotes:"Save to notes",
    bbcNews:"News", newsLoading:"Loading news...",
    musicCol:"Music Collection", musicEmpty:"Music collection is empty",
    musicEmptyDesc:"Go to Lifestyle → My Music and add some",
    recentNotes:"Recent Notes",
    waiting:"waiting", all:"All", pendingF:"Pending", done:"Done",
    priorityF:"Priority", overdueF:"Overdue",
    allDone:"All tasks completed!", noTasks:"No tasks yet", addFirst:"Add your first task",
    newTask:"New Task", editTask:"Edit Task", taskTitle:"Task title...",
    selDate:"Select date:", today:"Today", tomorrow:"Tomorrow", thisWeekS:"This Week",
    selPriority:"Priority:", low:"Low", medium:"Medium", high:"High",
    category:"Category (optional):",
    save:"Save", add:"Add", del:"Delete", cancel:"Cancel", update:"Update", create:"Create",
    calendar:"Calendar", newEvent:"New Event", eventName:"Event name...",
    noEvents:"No events", time:"Time", desc:"Description", color:"Color",
    repeat:"Repeat", none:"None", daily:"Daily", weekly:"Weekly", monthly:"Monthly",
    upcomingEv:"Upcoming Events",
    notes:"Notes", newNote:"New Note", editNote:"Edit Note",
    searchNotes:"Search notes...", noNotes:"No notes yet", noResult:"No results found",
    noteTitle:"Title...", noteContent:"Content...",
    healthCoach:"Health Coach", dailyBalance:"Daily Balance",
    intake:"Intake", burned:"Burned", net:"Net", target:"Target",
    todayFoods:"Today's Meals", noFoodYet:"No food logged yet",
    todaySports:"Today's Sports", noSportYet:"No sport logged yet",
    addMeal:"Add Meal", addExercise:"Add Exercise",
    searchFood:"Search food (rice, salad...)", myFoods:"My Foods",
    notFound:"not found", enterManual:"Enter calories manually or enable AI in Settings",
    meal:"Meal:", breakfast:"Breakfast", lunch:"Lunch", dinner:"Dinner", snack:"Snack",
    calorie:"Calorie", sportType:"Sport Type:", duration:"Duration (min)", distance:"Distance (km)",
    sportTypes:["Running","Swimming","Cycling","Yoga","Weights","Walking","Other"],
    lifestyleTitle:"Lifestyle", lifestyleDesc:"Your personal spaces — tap a room to explore",
    items:"items", newRoom:"New Room", roomName:"Room name...", selColor:"Pick color:",
    projects:"Projects", newProject:"New Project", projectName:"Project name...", noProjects:"No projects yet",
    news:"News", newsLoadFail:"Failed to load news", checkInternet:"Check your internet connection",
    retry:"Retry", noTrNews:"No Turkish news found",
    otherLangAvail:"News available in other languages", showAll:"Show All",
    categories:"categories",
    myMusic:"My Music", emptyCol:"Your collection is empty",
    emptyColDesc:"Search on Deezer or paste a link",
    searchDeezer:"Search Deezer", addLink:"Add Link",
    searchMusic:"Search songs, artists or albums...",
    collection:"Collection", search:"Search", charts:"Charts", link:"Link",
    piece:"tracks", howToUse:"How to use?",
    myStyle:"My Wardrobe", todayWeather:"Today's Weather", gettingLoc:"Getting location...",
    styleAdvice:"Style Advice", calculating:"Calculating...", noWeather:"Weather data unavailable",
    todayLooks:"Today's Looks", styleRules:"Style Rules & Limits",
    colorPalette:"Color Palette Discipline", myCloset:"My Closet",
    top:"Top", bottom:"Bottom", outer:"Outer", dress:"Dress", wore:"Wore it",
    addClothing:"Add Clothing", clothingName:"Clothing name (e.g. Navy Blazer)",
    noClothesCat:"No clothes in this category",
    wind:"wind", humidity:"humidity", feelsLike:"feels like",
    settingsTitle:"Settings", language:"Language",
    aiCalorie:"AI Calorie Estimation", notifTitle:"Notifications",
    dataBackup:"Data Backup", exportData:"Download Backup", importData:"Upload Backup",
    deleteAll:"Delete All Data", logout:"Log Out",
    notifNotSupported:"This browser doesn't support notifications",
    deleteConfirm:"All data will be deleted. Are you sure?",
    listening:"Listening...", startSpeaking:"Start speaking", voiceInput:"Voice input",
    notUnderstood:"Not understood",
    taskAdded:"Task added", noteAdded:"Note added", foodAdded:"Food added",
    sportAdded:"Sport added", eventAdded:"Event added",
    goingTo:"going to",
    yourCoach:"Health Coach", targetKcal:"Target: {0} kcal",
    noRecordYet:"No records yet today. Log your meals and exercises, your health coach will guide you!",
    addMealBtn:"+ Add Meal", addSportBtn:"+ Add Sport",
    sportDuration:"Sport duration", burnedKcal:"Burned kcal", distanceLabel:"Distance",
    myFoodsLabel:"My Foods",
    back:"Back", viewAll:"All ▶", loading:"Loading...",
    note:"note", task:"Task", eventType:"Event",
    addMealTitle:"Add Meal", addSportTitle:"Add Sport", addClothTitle:"Add Clothing",
    askAI:"Ask AI", analyzing:"Analyzing...", photoCalorie:"Calculate Calories from Photo",
    descOpt:"Description (optional)...", catOpt:"Category (optional)",
    foodName:"Food name", kcalUnit:"kcal", notesOpt:"Notes (optional)",
    addSubtask:"Add subtask...", descField:"Description...", tagsField:"Tags (comma separated)",
    trackNameOpt:"Track name (optional)",
    account:"Account", cloudSync:"Cloud sync active",
    cloudSyncDesc:"Data syncs automatically across all your devices",
    backupDownloaded:"Backup downloaded!", dataImported:"Data imported successfully!",
    dataDeleted:"All data deleted", enableNotif:"Enable Notifications",
    searchSongs:"Search songs, artists or albums...",
    sportNames:["Running","Swimming","Cycling","Yoga","Weights","Walking","Other"],
    locale:"en-US", speechLang:"en-US",
    months:["January","February","March","April","May","June","July","August","September","October","November","December"],
    daysShort:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    priHigh:"High", priMed:"Medium", priLow:"Low",
    grpOverdue:"Overdue", grpToday:"Today", grpWeek:"This Week", grpPending:"Pending",
    rmProjects:"Projects", rmNews:"News", rmMusic:"My Music",
    rmClothes:"My Wardrobe", rmMemories:"Memories", rmHealth:"Health Coach",
    catSpor:"Sports", catTek:"Technology", catEko:"Economy", catPol:"Politics",
    catSag:"Health", catBil:"Science", catSan:"Art", catDun:"World",
    catSporD:"Football, basketball & world sports", catTekD:"AI, gadgets & software",
    catEkoD:"Markets, stocks & business", catPolD:"World politics & agenda",
    catSagD:"Medicine, nutrition & wellness", catBilD:"Space, discoveries & research",
    catSanD:"Culture, art & entertainment", catDunD:"World news & events",
    catSon:"Breaking", catSonD:"Breaking news & flash updates",
    mySources:"My Sources", mySourcesD:"Your custom news sources",
    addSource:"Add Source", suggestedSources:"Suggested Sources", manualUrl:"Manual URL",
    feedUrl:"RSS feed URL", feedName:"Source name", feedAdded:"Source added",
    feedRemoved:"Source removed", feedExists:"This source is already added",
    noCustomFeeds:"No sources added yet", addFirstSource:"Add your first source",
    // Memories
    memories:"Memories", allMemories:"All Memories", newMemory:"New Memory", editMemory:"Edit Memory",
    memoryTitle:"Memory title...", memoryText:"What happened? How did you feel...",
    memoryDate:"Date", memoryMood:"How did it feel?", memoryFolder:"Folder",
    memoryPhotos:"Photos", addPhoto:"Add Photo", takePhoto:"Take", choosePhoto:"Choose",
    newFolder:"New Folder", folderName:"Folder name...", noMemories:"No memories yet",
    addFirstMemory:"Save your first memory", memoryCount:"memories", timeline:"Timeline",
    folders:"Folders", deleteFolder:"Delete folder", deleteFolderConfirm:"Delete this folder and its memories?",
    noFolder:"No folder", searchMemories:"Search memories...",
    touchToExplore:"Tap a category to explore news",
    notifications:"Notifications", dataSummary:"Data Summary", dataManagement:"Data Management",
    dangerZone:"Danger Zone", notifActive:"Notifications active",
    reminderBefore:"Reminder time", reminderMinLabel:"min before",
    eventReminders:"Event reminders", taskReminders:"Task reminders",
    taskRemindDesc:"Morning reminder for today's tasks", quietHours:"Quiet hours",
    quietHoursDesc:"No notifications during these hours",
    notifBlocked:"Notifications blocked. Allow in browser settings.",
    dataDesc:"You can import data or download your backup",
    total:"Total", sportRecord:"Sport Records",
    todayIntake:"Today: {0} intake · {1} burned",
    noNotesYet:"No notes yet", addFirstNote:"Tap + to write your first note",
    wearScore:"Wear Frequency Score", wardrobeWaiting:"Some items waiting in closet",
    wardrobeOptimal:"Optimal range", wardrobePerfect:"Perfect, active closet!",
    paletteTap:"Tap colors to set your active palette", paletteActive:"{0} colors selected — discipline active",
    timesWorn:"{0} times worn", neverWorn:"Never worn", woreToday:"Wore Today",
    addToCloset:"Add to Closet", categoryLabel:"Category:", clothColor:"Clothing color:",
    rule1:"Work appropriate", rule2:"Sustainable palette", rule3:"No new purchases this month", rule4:"No adding without re-wearing",
    style1:"Heavy layers, cashmere and coat weather", style2:"Jacket or trench — layered outfits",
    style3:"Long sleeves + light jacket, perfect transition weather", style4:"Light sweater or shirt — comfort zone",
    style5:"Light fabrics, breathable colors", style6:"Summer outfits, cotton and linen priority",
    tagWork:"Work", tagCasual:"Casual", tagElegant:"Elegant", tagCool:"Cool", tagWarm:"Summer", tagSimple:"Simple",
    moodConfident:"Confident", moodConfidentPro:"Confident & Professional",
    moodComfy:"Cozy & Warm", moodPeaceful:"Peaceful & Strong",
    moodChic:"Casual & Chic", moodStrong:"Strong & Clear",
    moodEnergetic:"Energetic & Light", moodNatural:"Natural & Cool", moodFree:"Strong & Free",
    lookLayered:"Layered Chic", lookCasualLayer:"Casual Layered", lookSmartCozy:"Smart Cozy",
    noDue:"No date", roomEmpty:"This room is empty", addItemHint:"Tap + to add items",
    loginTitle:"Log In", registerTitle:"Sign Up", waitLogin:"Please wait...",
    guestMode:"Guest mode", noAccount:"Don't have an account? Sign up",
    hasAccount:"Already have an account? Log in", googleLogin:"Sign in with Google",
    orDivider:"or", emailPlaceholder:"Email address", passwordPlaceholder:"Password (min 6 characters)",
    emailRequired:"Email and password required", skipLogin:"Continue without signing in →",
    localOnly:"Data stays on this device only", localOnlyDesc:"Data is stored only on this device. Sign in to sync across all your devices.",
    tapToContinue:"Tap to continue",
    statPlanning:"Planning", statProgress:"In Progress", statTest:"Testing", statDone:"Completed",
    repeatNone:"No repeat", repeatDaily:"Daily", repeatWeekly:"Weekly", repeatMonthly:"Monthly",
    freqFavorite:"Favorite", freqFrequent:"Frequent", freqWaiting:"Waiting", freqNew:"New",
    edit:"Edit", deleteTask:"Delete Task", deleteProject:"Delete Project",
    statusDone:"Completed", statusWaiting:"Pending", grpDone:"Completed",
    oneWeek:"1 Week", oneMonth:"1 Month", clear:"Clear",
    upcoming:"Upcoming", addBtn:"+ Add",
    musicTabMine:"Mine", musicTabSearch:"Search",
    musicSearching:"Searching...", musicSearchDeezer:"Search Deezer", musicNoResult:"No results found",
    musicAddToCol:"Add to Collection", musicChecking:"Checking...",
    musicChartLoading:"Loading charts...", musicChartFail:"Failed to load charts",
    musicDeezerSearch:"90M+ tracks on Deezer",
    musicLinkDesc:"Paste a Spotify, YouTube, SoundCloud, Apple Music or any music link.",
    musicHowTo:"How to use?",
    musicHowToSteps:"1. Open a track on Spotify → three dots → \"Share\" → \"Copy link\"\n2. Paste in the box above\n3. Tap \"Add to Collection\"",
    voiceCommands:"Commands: \"task add: ...\", \"note add: ...\", \"food add: ...\", \"sport add: ...\", \"event add: ...\"",
  },
};

/* t() helper — dil anahtarına göre çeviri döndürür */
const getLang = (data) => data?.settings?.language || "tr";
const i18n = (key, data) => (TRANSLATIONS[getLang(data)] || TRANSLATIONS.tr)[key] || TRANSLATIONS.tr[key] || key;
const ROOM_LABEL_MAP = {projects:"rmProjects",news:"rmNews",music:"rmMusic",clothes:"rmClothes",memories:"rmMemories",healthcoach:"rmHealth"};
const roomLabel = (room, data) => ROOM_LABEL_MAP[room.id] ? i18n(ROOM_LABEL_MAP[room.id], data) : room.name;

/* ── Constants (dil bağımsız) ── */
const TABS_KEYS = [
  { id: "dashboard", labelKey: "home", icon: "⌂" },
  { id: "tasks", labelKey: "tasks", icon: "✓" },
  { id: "lifestyle", labelKey: "lifestyle", icon: "◈" },
];

const SPORT_TYPES = ["Koşu","Yüzme","Bisiklet","Yoga","Ağırlık","Yürüyüş","Diğer"];
const SPORT_EMOJI = {"Koşu":"▸","Yüzme":"≈","Bisiklet":"◎","Yoga":"◉","Ağırlık":"■","Yürüyüş":"▪","Diğer":"●"};
// MET × 70kg × (duration/60) → kcal
const SPORT_KCAL_PER_MIN = {"Koşu":10,"Yüzme":7,"Bisiklet":7,"Yoga":3.3,"Ağırlık":5,"Yürüyüş":4.7,"Diğer":5};
const calcSportCal = (type, durationMin) => Math.round((SPORT_KCAL_PER_MIN[type]||5) * (+durationMin||0));
const PRIORITIES = { high: "Yüksek", medium: "Orta", low: "Düşük" };
const PCOL = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const PROJECT_STATUSES = ["Planlama","Devam Ediyor","Test","Tamamlandı"];
const COLORS = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#a855f7","#f97316","#14b8a6"];

const DEFAULT_ROOMS = [
  { id: "projects", name: "Projeler", icon: "Pr", color: "#3b82f6", type: "project" },
  { id: "news", name: "Haberler", icon: "Hb", color: "#ef4444", type: "news" },
  { id: "music", name: "Müziklerim", icon: "Mz", color: "#a855f7", type: "collection" },
  { id: "clothes", name: "Kıyafetlerim", icon: "St", color: "#f97316", type: "collection" },
  { id: "memories", name: "Anılar", icon: "An", color: "#22c55e", type: "collection" },
  { id: "healthcoach", name: "Sağlık Koçu", icon: "Sk", color: "#14b8a6", type: "health" },
];

/* Eski kullanıcılarda eksik odaları otomatik ekle */
const migrateRooms = (savedRooms) => {
  if (!savedRooms) return [...DEFAULT_ROOMS];
  const ids = new Set(savedRooms.map(r => r.id));
  const missing = DEFAULT_ROOMS.filter(d => !ids.has(d.id));
  return missing.length > 0 ? [...savedRooms, ...missing] : savedRooms;
};

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
const MN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DN = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

const today = () => new Date().toISOString().split("T")[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

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

/* ── Speech Recognition Hook ── */
const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const hasSpeech = !!SpeechRecognition;

function useSpeech(lang = "tr-TR") {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  const start = useCallback((onResult, onEnd) => {
    if (!hasSpeech || listening) return;
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    recRef.current = rec;
    setTranscript("");
    setListening(true);

    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[0].isFinal) {
        onResult?.(t.trim());
      }
    };
    rec.onerror = () => { setListening(false); onEnd?.(); };
    rec.onend = () => { setListening(false); onEnd?.(); };
    rec.start();
  }, [lang, listening]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, transcript, start, stop, supported: hasSpeech };
}

/* ── VoiceMic: küçük mikrofon butonu (input yanına) ── */
function VoiceMic({ onResult, size = 32, color = "#3b82f6" }) {
  const { listening, start, stop, supported } = useSpeech();
  if (!supported) return null;

  const handleClick = () => {
    if (listening) { stop(); return; }
    start((text) => { onResult?.(text); });
  };

  return (
    <button onClick={handleClick} style={{
      width:size,height:size,borderRadius:size/2,
      background:listening ? "rgba(239,68,68,0.2)" : "#2A2A35",
      border:`1px solid ${listening ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.05)"}`,
      color:listening ? "#ef4444" : color,
      cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
      flexShrink:0,padding:0,
      animation:listening ? "pulse 1s ease-in-out infinite" : "none",
      transition:"all .2s",
    }} title={listening ? "Dinleniyor..." : "Sesli giriş"} aria-label={listening ? "Stop listening" : "Voice input"}>
      <svg width={size*0.5} height={size*0.5} viewBox="0 0 24 24" fill="none">
        {listening ? (
          <>
            <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" opacity=".3"/>
            <rect x="9" y="8" width="6" height="8" rx="1" fill="currentColor"/>
          </>
        ) : (
          <>
            <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
            <path d="M5 11a7 7 0 0014 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="22" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        )}
      </svg>
    </button>
  );
}

/* ── VoiceCommand: akıllı sesli komut FAB ── */
function VoiceCommand({ data, update, goTo, showToast }) {
  const { listening, transcript, start, stop, supported } = useSpeech();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState(null);

  if (!supported) return null;

  const parseCommand = (text) => {
    const t = text.toLowerCase().trim();

    // Görev ekleme
    if (t.startsWith("görev ekle") || t.startsWith("görev:") || t.startsWith("task")) {
      const title = text.replace(/^(görev ekle[: ]*|görev[: ]*|task[: ]*)/i, "").trim();
      if (title) {
        const tasks = [...data.tasks, { id: uid(), title, priority: "medium", done: false, dueDate: "", category: "", description: "", createdAt: today() }];
        update({ ...data, tasks });
        return { type: "success", msg: `Görev eklendi: "${title}"` };
      }
    }

    // Not ekleme
    if (t.startsWith("not ekle") || t.startsWith("not:") || t.startsWith("note")) {
      const title = text.replace(/^(not ekle[: ]*|not[: ]*|note[: ]*)/i, "").trim();
      if (title) {
        const notes = [{ id: uid(), title, content: "", color: "#3b82f6", createdAt: today(), updatedAt: today() }, ...data.notes];
        update({ ...data, notes });
        return { type: "success", msg: `Not eklendi: "${title}"` };
      }
    }

    // Yemek ekleme — "yemek ekle: pilav 200 kalori" veya "yemek: çay 30"
    if (t.startsWith("yemek ekle") || t.startsWith("yemek:") || t.startsWith("food")) {
      const raw = text.replace(/^(yemek ekle[: ]*|yemek[: ]*|food[: ]*)/i, "").trim();
      const calMatch = raw.match(/(\d+)\s*(kalori|kcal|cal)?/i);
      const cal = calMatch ? parseInt(calMatch[1]) : 0;
      const name = raw.replace(/\d+\s*(kalori|kcal|cal)?/i, "").trim() || raw;
      if (name) {
        const foods = [...(data.foods || []), { id: uid(), name, calories: cal || 100, meal: "Öğle", date: today() }];
        update({ ...data, foods });
        return { type: "success", msg: `Yemek eklendi: "${name}" ${cal || 100} kcal` };
      }
    }

    // Spor ekleme — "spor ekle: 30 dakika koşu"
    if (t.startsWith("spor ekle") || t.startsWith("spor:") || t.startsWith("sport")) {
      const raw = text.replace(/^(spor ekle[: ]*|spor[: ]*|sport[: ]*)/i, "").trim();
      const durMatch = raw.match(/(\d+)\s*(dk|dakika|min)?/i);
      const duration = durMatch ? parseInt(durMatch[1]) : 30;
      const typeMatch = raw.match(/(koşu|yüzme|bisiklet|yoga|ağırlık|yürüyüş)/i);
      const type = typeMatch ? typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1) : "Diğer";
      const cal = calcSportCal(type, duration);
      const sports = [...data.sports, { id: uid(), type, duration, distance: 0, calories: cal, date: today(), notes: "" }];
      update({ ...data, sports });
      return { type: "success", msg: `Spor eklendi: ${type} ${duration}dk (${cal} kcal)` };
    }

    // Etkinlik ekleme — "etkinlik ekle: yarın toplantı"
    if (t.startsWith("etkinlik ekle") || t.startsWith("etkinlik:") || t.startsWith("event")) {
      const title = text.replace(/^(etkinlik ekle[: ]*|etkinlik[: ]*|event[: ]*)/i, "").trim();
      if (title) {
        const events = [...data.events, { id: uid(), title, date: today(), time: "", color: "#8B5CF6", description: "", recurring: "none" }];
        update({ ...data, events });
        return { type: "success", msg: `Etkinlik eklendi: "${title}"` };
      }
    }

    // Sayfa navigasyonu
    if (t.includes("görevler") || t.includes("tasks")) { goTo("tasks"); return { type: "nav", msg: "Görevler'e gidiliyor" }; }
    if (t.includes("takvim") || t.includes("calendar")) { goTo("tasks", "calendar"); return { type: "nav", msg: "Takvim'e gidiliyor" }; }
    if (t.includes("notlar")) { goTo("tasks", "notes"); return { type: "nav", msg: "Notlar'a gidiliyor" }; }
    if (t.includes("sağlık") || t.includes("yemek") || t.includes("spor")) { goTo("lifestyle", "healthcoach"); return { type: "nav", msg: "Sağlık Koçu'na gidiliyor" }; }
    if (t.includes("stilim") || t.includes("kıyafet")) { goTo("lifestyle", "clothes"); return { type: "nav", msg: "Kıyafetlerim'e gidiliyor" }; }
    if (t.includes("haber")) { goTo("lifestyle", "news"); return { type: "nav", msg: "Haberler'e gidiliyor" }; }
    if (t.includes("müzik")) { goTo("lifestyle", "music"); return { type: "nav", msg: "Müziklerim'e gidiliyor" }; }
    if (t.includes("ayarlar")) { goTo("settings"); return { type: "nav", msg: "Ayarlar'a gidiliyor" }; }

    return { type: "unknown", msg: `Anlaşılamadı: "${text}"` };
  };

  const handleStart = () => {
    setResult(null);
    setOpen(true);
    start((text) => {
      const r = parseCommand(text);
      setResult(r);
      if (r.type === "success") showToast?.(r.msg);
      setTimeout(() => setOpen(false), r.type === "success" ? 1500 : 3000);
    }, () => {
      // onEnd — listening bitti ama sonuç gelmezse
    });
  };

  return (
    <>
      {/* FAB mikrofon butonu */}
      <button className="touch-card" onClick={open && listening ? stop : handleStart} aria-label="Voice command" style={{
        position:"fixed",left:20,bottom:100,
        width:52,height:52,borderRadius:"50%",
        background:listening ? "#ef4444" : "linear-gradient(135deg,#3b82f6,#6366f1)",
        color:"#fff",border:"none",
        fontSize:22,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",
        boxShadow:listening ? "0 0 0 8px rgba(239,68,68,0.2), 0 4px 20px rgba(239,68,68,0.4)" : "0 4px 20px rgba(59,130,246,0.4)",
        zIndex:900,
        animation:listening ? "pulse 1s ease-in-out infinite" : "none",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="2" width="6" height="12" rx="3" stroke="#fff" strokeWidth="1.5" fill={listening ? "rgba(255,255,255,0.3)" : "none"}/>
          <path d="M5 11a7 7 0 0014 0" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dinleme overlay */}
      {open && (
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
          zIndex:9998,gap:16,padding:40,
          animation:"modalOverlayIn .2s ease both",
        }} onClick={() => { stop(); setOpen(false); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background:"#1C1C26",borderRadius:20,padding:"28px 24px",
            maxWidth:340,width:"100%",textAlign:"center",
            border:"1px solid rgba(255,255,255,0.05)",
            animation:"modalSlideUp .3s cubic-bezier(.22,1,.36,1) both",
          }}>
            {/* Animasyonlu dalga */}
            {listening && !result && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,marginBottom:16,height:40}}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{
                    width:4,borderRadius:2,background:"#3b82f6",
                    animation:`voiceWave .8s ease-in-out ${i*0.1}s infinite alternate`,
                  }}/>
                ))}
              </div>
            )}

            {/* Durum */}
            {listening && !result && (
              <>
                <div style={{fontSize:16,fontWeight:600,color:"#F9FAFB",marginBottom:6}}>Dinliyorum...</div>
                <div style={{fontSize:13,color:"#9CA3AF",marginBottom:transcript ? 12 : 0}}>
                  {transcript || "Konuşmaya başlayın"}
                </div>
                {transcript && (
                  <div style={{background:"#2A2A35",borderRadius:10,padding:"10px 14px",fontSize:14,color:"#F9FAFB",fontStyle:"italic"}}>
                    "{transcript}"
                  </div>
                )}
              </>
            )}

            {/* Sonuç */}
            {result && (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
                <div style={{
                  width:48,height:48,borderRadius:"50%",
                  background:result.type === "success" ? "rgba(16,185,129,0.15)" : result.type === "nav" ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.15)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                }}>
                  {result.type === "success" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : result.type === "nav" ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
                  )}
                </div>
                <div style={{fontSize:14,fontWeight:600,color:"#F9FAFB"}}>{result.msg}</div>
                {result.type === "unknown" && (
                  <div style={{fontSize:12,color:"#9CA3AF",marginTop:4,lineHeight:1.4}}>
                    Komutlar: "görev ekle: ...", "not ekle: ...", "yemek ekle: ...", "spor ekle: ...", "etkinlik ekle: ..."
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Styles ── */
const inp = {
  width:"100%",
  background:"#2A2A35",
  border:"1px solid rgba(255,255,255,0.05)",
  borderRadius:12,padding:"12px 14px",color:"#F9FAFB",fontSize:15,
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
  background: active ? "rgba(59,130,246,0.15)" : "#2A2A35",
  color: active ? "#3b82f6" : "#9CA3AF",
  border: active ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.05)",
  padding:"7px 14px",borderRadius:20,fontSize:13,cursor:"pointer",whiteSpace:"nowrap",
  fontWeight: active ? 600 : 400,
});
const cardStyle = {
  background:"#1C1C26",
  borderRadius:16,padding:"16px",marginBottom:8,
  border:"1px solid rgba(255,255,255,0.05)",
};
/* Glow card helper: cardStyle + subtle colored accent */
const glowCard = (color) => ({
  ...cardStyle,
  border:`1px solid ${color}20`,
});
const delBtnStyle = {
  background:"#2A2A35",
  border:"1px solid rgba(255,255,255,0.05)",
  color:"#9CA3AF",fontSize:14,
  cursor:"pointer",padding:0,width:32,height:32,borderRadius:8,
  display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
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
    <div onClick={onClose} role="presentation" style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",
      alignItems:"flex-end",justifyContent:"center",zIndex:9999,
      padding:0,
      animation:"modalOverlayIn .2s ease both",
    }}>
      <div onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} style={{
        background:"#1C1C26",
        backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",
        width:"100%",maxWidth:480,
        maxHeight:"85vh",
        borderRadius:"20px 20px 0 0",
        display:"flex",flexDirection:"column",
        animation:"modalSlideUp .3s cubic-bezier(.22,1,.36,1) both",
      }}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",
          flexShrink:0,
        }}>
          <h3 style={{margin:0,fontSize:16,fontWeight:600,color:"#F9FAFB"}}>{title}</h3>
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
      background:"rgba(13,13,18,0.92)",
      backdropFilter:"blur(20px) saturate(180%)",
      WebkitBackdropFilter:"blur(20px) saturate(180%)",
      marginLeft:-20,marginRight:-20,
      padding:"14px 20px 12px",
      borderBottom:"1px solid rgba(255,255,255,0.05)",
      marginBottom:16,
    }}>
      {children}
    </div>
  );
}

function GroupLabel({ label, count, color }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:6,
      fontSize:11,fontWeight:700,color:"#9CA3AF",
      textTransform:"uppercase",letterSpacing:".07em",
      marginBottom:8,marginTop:4,
    }}>
      <span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
      {label}
      {count != null && <span style={{opacity:.6}}>({count})</span>}
    </div>
  );
}

function FAB({ onClick, color="#3b82f6", label="Add" }) {
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

/* ═══════════ DASHBOARD ═══════════ */
function Dashboard({ data, setTab, goTo, update }) {
  const t = today();
  const foods = data.foods || [];
  const rooms = migrateRooms(data.rooms);
  const roomItems = data.roomItems || {};

  const pending = data.tasks.filter(x=>!x.done).length;
  const done = data.tasks.filter(x=>x.done).length;
  const overdue = data.tasks.filter(x=>!x.done && x.dueDate && x.dueDate < t).length;
  const urgentTasks = data.tasks
    .filter(x=>!x.done)
    .sort((a,b)=>{const po={high:0,medium:1,low:2};return (po[a.priority]||1)-(po[b.priority]||1);})
    .slice(0,3);

  const todayEv = data.events.filter(e=>e.date===t);
  const upcoming = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  const wkSport = data.sports.filter(s=>{const d=(new Date()-new Date(s.date))/864e5;return d>=0&&d<=7;});
  const wkMin = wkSport.reduce((a,s)=>a+(s.duration||0),0);
  const wkBurned = wkSport.reduce((a,s)=>a+(s.calories||0),0);
  const todayFoods = foods.filter(f=>f.date===t);
  const todayCalIn = todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todayCalOut = data.sports.filter(s=>s.date===t).reduce((a,s)=>a+(s.calories||0),0);
  const activeProjects = (data.projects||[]).filter(p=>p.status!=="Tamamlandı").length;

  const hour = new Date().getHours();
  const T = (key) => i18n(key, data);
  const greeting = hour<12 ? T("goodMorning") : hour<18 ? T("goodAfternoon") : T("goodEvening");

  // Live clock (updates every minute)
  const [clock, setClock] = useState(new Date().toLocaleTimeString(T("locale"), {hour:"2-digit",minute:"2-digit"}));
  useEffect(()=>{
    const iv=setInterval(()=>setClock(new Date().toLocaleTimeString(T("locale"),{hour:"2-digit",minute:"2-digit"})),30000);
    return ()=>clearInterval(iv);
  },[]);

  // Dashboard weather
  const [dashWx, setDashWx] = useState(null);
  useEffect(()=>{
    if(!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos=>{
      const {latitude:lat,longitude:lon}=pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`)
        .then(r=>r.json()).then(d=>{
          const c=d.current;
          setDashWx({temp:Math.round(c.temperature_2m),humid:Math.round(c.relative_humidity_2m),code:c.weather_code});
        }).catch(()=>{});
    },()=>{},{timeout:5000,maximumAge:300000});
  },[]);

  // Daily thoughts (3 slots)
  const thoughts = data.dailyThoughts || ["","",""];
  const updateThought = (i, val) => {
    const next = [...thoughts];
    next[i] = val;
    update({ ...data, dailyThoughts: next });
  };
  const thoughtToNote = (i) => {
    const text = (thoughts[i]||"").trim();
    if(!text) return;
    const newNote = {id:uid(),title:text,content:"",color:"#14b8a6",createdAt:today(),updatedAt:today()};
    const next = [...thoughts]; next[i] = "";
    update({...data, notes:[newNote,...(data.notes||[])], dailyThoughts:next});
  };

  // Live news headlines — custom feeds first, fallback BBC Türkçe
  const [headlines, setHeadlines] = useState([]);
  const customFeedsRef = useRef(data?.settings?.customFeeds || []);
  customFeedsRef.current = data?.settings?.customFeeds || [];
  useEffect(() => {
    let cancelled = false;
    async function fetchOneDashFeed(feedUrl) {
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(5000) }).catch(() => null)
        || await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(5000) });
      if (!res || !res.ok) return [];
      const text = res.url?.includes("allorigins") ? JSON.parse(await res.text()).contents : await res.text();
      const xml = new DOMParser().parseFromString(text, "text/xml");
      return [...xml.querySelectorAll("item, entry")].slice(0,8).map(item => {
        const txt = (sel) => item.querySelector(sel)?.textContent?.replace(/<[^>]+>/g,"")?.trim() || "";
        const attr = (sel, a) => item.querySelector(sel)?.getAttribute(a) || "";
        return {
          title: txt("title"),
          link: txt("link") || attr("link","href"),
          pubDate: txt("pubDate") || txt("published") || "",
        };
      }).filter(a=>a.title && a.title.length > 5);
    }
    async function fetchHeadlines() {
      try {
        const feeds = customFeedsRef.current;
        let items = [];
        if (feeds.length > 0) {
          const results = await Promise.allSettled(feeds.slice(0,4).map(f => fetchOneDashFeed(f.url)));
          items = results.flatMap(r => r.status==="fulfilled" ? r.value : []);
        }
        // Fallback: always add BBC Türkçe if few results
        if (items.length < 4) {
          const bbc = await fetchOneDashFeed("https://www.bbc.com/turkce/index.xml").catch(()=>[]);
          const existing = new Set(items.map(i=>i.title));
          items = [...items, ...bbc.filter(b=>!existing.has(b.title))];
        }
        // Sort by date, take top 5
        items.sort((a,b) => new Date(b.pubDate) - new Date(a.pubDate));
        if (!cancelled) setHeadlines(items.slice(0,5));
      } catch {}
    }
    fetchHeadlines();
    return () => { cancelled = true; };
  }, []);

  const musicItems = (data.roomItems || {})["music"] || [];

  const scheduleItems = upcoming.slice(0,4).map(e=>({ type:"event", id:e.id, title:e.title, sub:e.time||e.date.slice(5), color:e.color||"#8B5CF6" }));

  const hourIcon = hour<6 ? "moon" : hour<12 ? "sunrise" : hour<18 ? "sun" : "moon";

  return (
    <div>
      {/* HERO - Greeting + Weather + Clock */}
      <div className="stagger-1" style={{
        background:"#1C1C26",
        borderRadius:16,padding:"20px",marginBottom:16,
        border:"1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"#2A2A35",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {hourIcon==="moon" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="#a5b4fc" strokeWidth="1.5" fill="rgba(165,180,252,0.15)"/></svg>
            ) : hourIcon==="sunrise" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="#fbbf24" strokeWidth="1.5" fill="rgba(251,191,36,0.15)"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.15)"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"/></svg>
            )}
          </div>
          <div style={{flex:1}}>
            <h2 style={{margin:0,fontSize:28,fontWeight:700,letterSpacing:-.5,color:"#F9FAFB",lineHeight:1.2}}>{greeting}!</h2>
            <p style={{margin:"4px 0 0",color:"#9CA3AF",fontSize:13}}>
              {new Date().toLocaleDateString(T("locale"),{weekday:"long",day:"numeric",month:"long"})}
            </p>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:22,fontWeight:700,color:"#F9FAFB",letterSpacing:-.5,lineHeight:1}}>{clock}</div>
            {dashWx&&<div style={{fontSize:13,fontWeight:600,color:"#a5b4fc",marginTop:4}}>{dashWx.temp}°C</div>}
          </div>
        </div>
        {dashWx&&(
          <div style={{display:"flex",gap:12,marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#9CA3AF"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke="#f59e0b" strokeWidth="1.5" fill="rgba(245,158,11,0.1)"/></svg>
              {dashWx.temp}°C
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#9CA3AF"}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59,130,246,0.1)"/></svg>
              %{dashWx.humid} {T("humidity")||"nem"}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:12,color:"#9CA3AF"}}>
              {WMO_TR[dashWx.code]||""}
            </div>
          </div>
        )}
      </div>


      {/* Kart 3: Stil Motivasyon */}
      <div className="stagger-2 touch-card" onClick={()=>goTo("lifestyle","clothes")} style={{
        background:"linear-gradient(135deg,#1C1C26 0%,rgba(139,92,246,0.12) 100%)",
        borderRadius:16,padding:"16px",marginBottom:16,
        border:"1px solid rgba(139,92,246,0.15)",
        cursor:"pointer",display:"flex",alignItems:"center",gap:14,
      }}>
        <div style={{width:48,height:48,borderRadius:14,background:"rgba(139,92,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
            <path d="M11 8C11 8 14 4 18 4C22 4 25 8 25 8" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="18" cy="4" r="2" stroke="#c4b5fd" strokeWidth="1.2" fill="none"/>
            <path d="M6 18L18 14L30 18" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="18" y1="8" x2="18" y2="14" stroke="#c4b5fd" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M8 26C8 23 11 21 15 21C17 21 18 23 21 23C25 23 28 23 28 26" stroke="#8B5CF6" strokeWidth="1.2" strokeLinecap="round" fill="rgba(139,92,246,0.08)"/>
            <circle cx="28" cy="10" r="4" stroke="#9CA3AF" strokeWidth="1" fill="none"/>
            <circle cx="24" cy="8" r="2.5" stroke="#9CA3AF" strokeWidth="1" fill="none"/>
            <path d="M22 11C22 11 24 13 28 13C30 13 32 12 32 10" stroke="#9CA3AF" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:600,color:"#F9FAFB"}}>{T("styleMotiv")}</div>
          <div style={{fontSize:13,color:"#c4b5fd",marginTop:3}}>{T("styleReady")}</div>
        </div>
        <span style={{fontSize:14,color:"#8B5CF6"}}>▶</span>
      </div>

      {/* 3 AKILLI KART */}
      {/* Kart 1: Görev + Etkinlik + Proje */}
      <div className="stagger-3 touch-card" onClick={()=>setTab("tasks")} style={{
        ...glowCard("#3b82f6"),cursor:"pointer",marginBottom:12,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(59,130,246,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:600,color:"#F9FAFB"}}>{T("taskStatus")}</div>
            <div style={{fontSize:13,color:"#9CA3AF"}}>{T("todaySummary")}</div>
          </div>
          <span style={{fontSize:14,color:"#9CA3AF"}}>▶</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{background:"#2563eb",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{pending}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("pending")}</div>
          </div>
          <div style={{background:"#7c3aed",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{todayEv.length}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("event")}</div>
          </div>
          <div style={{background:"#047857",borderRadius:12,padding:"14px 8px",textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:"#fff"}}>{activeProjects}</div>
            <div style={{fontSize:12,color:"#fff",marginTop:2}}>{T("project")}</div>
          </div>
        </div>
      </div>


      {overdue>0&&(
        <div onClick={()=>setTab("tasks")} style={{
          background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.15)",
          borderRadius:16,padding:"14px 16px",marginBottom:16,
          display:"flex",alignItems:"center",gap:12,cursor:"pointer",
        }}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(239,68,68,0.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:600,color:"#EF4444"}}>{overdue} {T("overdueAlert")}</div>
            <div style={{fontSize:13,color:"#9CA3AF"}}>{T("checkNow")}</div>
          </div>
          <span style={{fontSize:14,color:"#9CA3AF"}}>▶</span>
        </div>
      )}

      {/* Bugünün Programı — sadece etkinlikler */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("todaySchedule")}</div>
        {scheduleItems.length > 0 ? scheduleItems.map(item=>(
          <div key={item.id} onClick={()=>goTo("tasks","calendar")} className="touch-card" style={{
            ...cardStyle,padding:"14px 16px",marginBottom:8,
            display:"flex",alignItems:"center",gap:12,cursor:"pointer",minHeight:54,
          }}>
            <div style={{width:3,height:36,background:item.color,borderRadius:2,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#F9FAFB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
              <div style={{fontSize:13,color:"#9CA3AF",marginTop:2}}>{T("eventType")} · {item.sub}</div>
            </div>
            <span style={{fontSize:11,color:"#9CA3AF"}}>▶</span>
          </div>
        )) : (
          <div onClick={()=>goTo("tasks","calendar")} className="touch-card" style={{
            ...cardStyle,padding:"20px 16px",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",gap:8,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#9CA3AF" strokeWidth="1.2" fill="none"/>
              <line x1="3" y1="9" x2="21" y2="9" stroke="#9CA3AF" strokeWidth="1"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="#9CA3AF" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <div style={{fontSize:13,color:"#9CA3AF"}}>{T("noEventToday")}</div>
            <div style={{fontSize:11,color:"#9CA3AF"}}>{T("goCalendar")}</div>
          </div>
        )}
      </div>

      {/* Kart 2: Kalori + Yemek/Spor butonları */}
      <div className="stagger-4" style={{...glowCard("#f97316"),marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
          <div style={{width:36,height:36,borderRadius:10,background:"rgba(245,158,11,0.12)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 22c-4.97 0-9-4.03-9-9 0-4 3-7.5 5-9.5.5 3 2 4 3.5 4.5C13 7 12.5 4 14 2c2.5 3.5 7 7.5 7 11 0 4.97-4.03 9-9 9z" stroke="#F59E0B" strokeWidth="1.5" fill="rgba(245,158,11,0.1)"/></svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:600,color:"#F9FAFB"}}>{T("calorieTrack")}</div>
            <div style={{fontSize:13,color:"#9CA3AF"}}>{T("todayIntake").replace("{0}",todayCalIn).replace("{1}",todayCalOut)}</div>
          </div>
        </div>
        {todayCalIn > 0 ? (
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{flex:1,height:8,background:"#2A2A35",borderRadius:8,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:8,width:`${Math.min(100,Math.round(todayCalIn/2000*100))}%`,background:"#10B981",transition:"width .5s"}}/>
            </div>
            <span style={{fontSize:12,color:"#F59E0B",fontWeight:600,flexShrink:0}}>{Math.round(todayCalIn/2000*100)}%</span>
          </div>
        ) : (
          <div style={{fontSize:13,color:"#9CA3AF",textAlign:"center",padding:"8px 0",marginBottom:12}}>{T("noFoodToday")}</div>
        )}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>goTo("lifestyle","healthcoach:food")} style={{
            flex:1,background:"rgba(245,158,11,0.1)",color:"#F59E0B",border:"1px solid rgba(245,158,11,0.2)",
            borderRadius:12,padding:"11px 4px",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>{T("addFood")}</button>
          <button onClick={()=>goTo("lifestyle","healthcoach:sport")} style={{
            flex:1,background:"rgba(16,185,129,0.1)",color:"#10B981",border:"1px solid rgba(16,185,129,0.2)",
            borderRadius:12,padding:"11px 4px",fontSize:13,fontWeight:600,cursor:"pointer",
          }}>{T("addSport")}</button>
        </div>
      </div>

      {/* ── KAFAMDAKILER ── */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17.5 19H9.5a7 7 0 117.9-10.5 5 5 0 110 10.5z" stroke="#14b8a6" strokeWidth="1.5" fill="rgba(20,184,166,0.1)"/></svg>
          {T("thoughts")}
        </div>
        <div style={{background:"#1C1C26",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.05)"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<2?10:0}}>
              <span style={{fontSize:13,color:"#9CA3AF",flexShrink:0,fontWeight:700}}>{i+1}.</span>
              <input
                value={thoughts[i]||""}
                onChange={e=>updateThought(i,e.target.value)}
                placeholder={[T("thought1"),T("thought2"),T("thought3")][i]}
                style={{
                  flex:1,background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)",
                  borderRadius:10,padding:"10px 12px",color:"#F9FAFB",fontSize:13,outline:"none",
                  WebkitAppearance:"none",boxSizing:"border-box",
                }}
              />
              {(thoughts[i]||"").trim()&&(
                <button onClick={()=>thoughtToNote(i)} title={T("saveToNotes")||"Notlara kaydet"} style={{
                  width:32,height:32,borderRadius:8,border:"1px solid rgba(20,184,166,0.2)",
                  background:"rgba(20,184,166,0.1)",color:"#14b8a6",fontSize:14,
                  cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="#14b8a6" strokeWidth="1.5"/><polyline points="17,21 17,13 7,13 7,21" stroke="#14b8a6" strokeWidth="1.5"/><polyline points="7,3 7,8 15,8" stroke="#14b8a6" strokeWidth="1.5"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ HABERLER ── */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#ef4444" strokeWidth="2" fill="none"/><line x1="9" y1="13" x2="27" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="9" y1="18" x2="22" y2="18" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity=".6"/></svg>
            {T("bbcNews")}
          </div>
          <button onClick={()=>goTo("lifestyle","news")} style={{background:"none",border:"none",color:"#ef4444",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
        </div>
        <div style={{background:"#1C1C26",borderRadius:16,padding:"14px 16px",border:"1px solid rgba(255,255,255,0.05)"}}>
          {headlines.length === 0 ? (
            <div style={{display:"flex",alignItems:"center",gap:10,color:"#9CA3AF"}}>
              <svg width="20" height="20" viewBox="0 0 36 36" fill="none" style={{animation:"pulse 1.5s infinite",flexShrink:0}}><circle cx="18" cy="18" r="13" stroke="#ef4444" strokeWidth="1.5" fill="none"/><path d="M14 18 A4 4 0 0 0 22 18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/><line x1="18" y1="5" x2="18" y2="2" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="25" y1="7" x2="27" y2="5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/><line x1="11" y1="7" x2="9" y2="5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{fontSize:13}}>{T("newsLoading")}</span>
            </div>
          ) : headlines.slice(0,4).map((item,i)=>(
            <div key={i} onClick={()=>item.link&&window.open(item.link,"_blank")}
              style={{display:"flex",alignItems:"flex-start",gap:10,cursor:item.link?"pointer":"default",
              paddingBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              marginBottom: i < headlines.slice(0,4).length-1 ? 8 : 0,
              borderBottom: i < headlines.slice(0,4).length-1 ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{fontSize:10,color:"#ef4444",fontWeight:700,marginTop:3,flexShrink:0,minWidth:16}}>{i+1}</span>
              <span style={{fontSize:13,lineHeight:1.4,color:"#F9FAFB",opacity:.85}}>{typeof item==="string"?item:item.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MİNİ MÜZİK ── */}
      <div style={{marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",display:"flex",alignItems:"center",gap:5}}>
            <svg width="12" height="12" viewBox="0 0 36 36" fill="none"><circle cx="12" cy="28" r="5" stroke="#8B5CF6" strokeWidth="2" fill="none"/><circle cx="28" cy="24" r="5" stroke="#8B5CF6" strokeWidth="2" fill="none"/><path d="M17 28 L17 8 L33 4 L33 24" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="8" x2="33" y2="4" stroke="#8B5CF6" strokeWidth="1.5"/></svg>
            {T("musicCol")}
          </div>
          <button onClick={()=>goTo("lifestyle","music")} style={{background:"none",border:"none",color:"#8B5CF6",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
        </div>
        {musicItems.length === 0 ? (
          <div onClick={()=>goTo("lifestyle","music")} style={{
            background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,
            padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,
          }}>
            <div style={{width:48,height:48,borderRadius:14,background:"#2A2A35",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none"><path d="M6 18 C6 11 11 6 18 6 C25 6 30 11 30 18" stroke="#8B5CF6" strokeWidth="1.5" fill="none"/><rect x="4" y="17" width="6" height="10" rx="3" fill="#8B5CF6" opacity=".7"/><rect x="26" y="17" width="6" height="10" rx="3" fill="#8B5CF6" opacity=".7"/></svg>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#F9FAFB"}}>{T("musicEmpty")}</div>
              <div style={{fontSize:13,color:"#9CA3AF",marginTop:3}}>{T("musicEmptyDesc")}</div>
            </div>
            <span style={{marginLeft:"auto",color:"#9CA3AF",fontSize:16}}>▶</span>
          </div>
        ) : (
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:6,WebkitOverflowScrolling:"touch"}}>
            {musicItems.slice(0,6).map((item,i)=>(
              <div key={item.id||i}
                onClick={()=>item.link&&window.open(item.link,"_blank")}
                style={{
                  background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,
                  padding:"10px 12px",minWidth:120,maxWidth:140,flexShrink:0,cursor:"pointer",
                }}>
                <div style={{width:44,height:44,borderRadius:10,background:item.albumArt?"#000":"#2A2A35",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
                  {item.albumArt
                    ? <img src={item.albumArt} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <svg width="20" height="20" viewBox="0 0 36 36" fill="none"><circle cx="11" cy="27" r="5" stroke="#8B5CF6" strokeWidth="1.5" fill="rgba(139,92,246,0.15)"/><path d="M16 27 L16 9 L30 5 L30 23" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <div style={{fontSize:12,fontWeight:600,color:"#F9FAFB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title||"Parça"}</div>
                {item.artist&&<div style={{fontSize:10,color:"#9CA3AF",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.artist}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>{T("thisWeek")}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {[
            {val:wkSport.length,label:T("workout"),color:"#3B82F6",max:7},
            {val:wkBurned,label:T("kcalBurned"),color:"#EF4444",max:Math.max(wkBurned,2000)},
            {val:done,label:T("taskDone"),color:"#10B981",max:Math.max(done,10)},
          ].map((s,i)=>{
            const pct = s.max > 0 ? Math.min(100, (s.val / s.max) * 100) : 0;
            const r = 20; const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;
            return (
              <div key={i} style={{background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"16px 8px",textAlign:"center"}}>
                <svg width="52" height="52" viewBox="0 0 52 52" style={{display:"block",margin:"0 auto 8px"}}>
                  <circle cx="26" cy="26" r={r} fill="none" stroke="#2A2A35" strokeWidth="4"/>
                  <circle cx="26" cy="26" r={r} fill="none" stroke={s.color} strokeWidth="4"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 26 26)"
                    style={{transition:"stroke-dashoffset .6s ease"}}/>
                </svg>
                <div style={{fontSize:20,fontWeight:700,color:s.color}}>{s.val}</div>
                <div style={{fontSize:10,color:"#9CA3AF",marginTop:2,lineHeight:1.2}}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>


      {data.notes.length>0&&(
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px"}}>{T("recentNotes")}</div>
            <button onClick={()=>goTo("tasks","notes")} style={{background:"none",border:"none",color:"#3b82f6",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("viewAll")}</button>
          </div>
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
            {data.notes.slice(0,5).map(n=>(
              <div key={n.id} onClick={()=>goTo("tasks","notes")} style={{
                background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px",
                minWidth:130,maxWidth:160,cursor:"pointer",flexShrink:0,
                borderTop:`3px solid ${n.color||"#14b8a6"}`,
              }}>
                <div style={{fontSize:12,fontWeight:600,color:"#F9FAFB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</div>
                {n.content&&<div style={{fontSize:11,color:"#9CA3AF",marginTop:4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",lineHeight:1.4}}>{n.content}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════ TASKS ═══════════ */
function Tasks({ data, update }) {
  const T = (key) => i18n(key, data);
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

  const t = today();
  const tomorrow = ()=>{ const d=new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; };
  const nextWeek = ()=>{ const d=new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; };
  const nextMonth = ()=>{ const d=new Date(); d.setMonth(d.getMonth()+1); return d.toISOString().split("T")[0]; };
  const weekEnd = nextWeek();

  const quickDates = [
    {label:T("today"),val:t,icon:"●"},
    {label:T("tomorrow"),val:tomorrow(),icon:"⏭"},
    {label:T("oneWeek"),val:weekEnd,icon:"◆"},
    {label:T("oneMonth"),val:nextMonth(),icon:"▪"},
  ];

  const formatDate = (d) => {
    if(!d) return "";
    if(d===t) return T("today");
    if(d===tomorrow()) return T("tomorrow");
    return new Date(d).toLocaleDateString(T("locale"),{day:"numeric",month:"short"});
  };

  const pending = data.tasks.filter(x=>!x.done).length;

  const list = data.tasks.filter(task=>{
    if(filter==="done")return task.done;
    if(filter==="pending")return !task.done;
    if(filter==="high")return task.priority==="high"&&!task.done;
    if(filter==="overdue")return !task.done && task.dueDate && task.dueDate < t;
    return true;
  });

  const groups = filter==="all" ? [
    {key:"overdue",label:T("grpOverdue"),color:"#ef4444",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate<t)},
    {key:"today",label:T("grpToday"),color:"#3b82f6",tasks:list.filter(x=>!x.done&&x.dueDate===t)},
    {key:"week",label:T("grpWeek"),color:"#a855f7",tasks:list.filter(x=>!x.done&&x.dueDate&&x.dueDate>t&&x.dueDate<=weekEnd)},
    {key:"pending",label:T("grpPending"),color:"#9CA3AF",tasks:list.filter(x=>!x.done&&(!x.dueDate||x.dueDate>weekEnd))},
    {key:"done",label:T("grpDone"),color:"#22c55e",tasks:list.filter(x=>x.done)},
  ].filter(g=>g.tasks.length>0) : null;

  const TaskCard = ({ task }) => (
    <div style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52,opacity:task.done?.5:1,
      border:`1px solid ${task.done?"rgba(16,185,129,0.1)":PCOL[task.priority]+"15"}`,
    }}>
      <button onClick={()=>toggle(task.id)} style={checkBtnStyle(task.done)} aria-label={task.done?"Mark incomplete":"Mark complete"}>{task.done&&"✓"}</button>
      <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>setDetail(detail===task.id?null:task.id)}>
        <div style={{fontSize:14,fontWeight:600,color:"#F9FAFB",textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</div>
        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
          {task.priority&&<span style={{background:`${PCOL[task.priority]}15`,color:PCOL[task.priority],padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600}}>{({high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[task.priority])}</span>}
          {task.category&&<span style={{background:"rgba(59,130,246,0.1)",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontSize:11}}>{task.category}</span>}
          {task.dueDate&&<span style={{fontSize:11,color:!task.done&&task.dueDate<t?"#ef4444":"#9CA3AF"}}>{formatDate(task.dueDate)}</span>}
        </div>
      </div>
      <button onClick={()=>del(task.id)} style={delBtnStyle} aria-label="Delete">✕</button>
    </div>
  );

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("tasks")}</h3>
          <span style={{fontSize:12,color:"#9CA3AF",fontWeight:500}}>{pending} {T("waiting")}</span>
        </div>
        <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:2,WebkitOverflowScrolling:"touch"}}>
          {[["all",T("all")],["pending",T("pendingF")],["done",T("done")],["high",T("priorityF")],["overdue",T("overdueF")]].map(([k,v])=>(
            <button key={k} onClick={()=>setFilter(k)} style={filterBtnStyle(filter===k)}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {groups ? (
        groups.length===0
          ? (
            <div style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.1)"/><path d="M13 20l5 5 9-10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:4}}>{T("allDone")}</div>
              <div style={{fontSize:12,color:"#9CA3AF"}}>{T("addFirst")}</div>
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
              <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.1)"/><path d="M13 20l5 5 9-10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
              <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:4}}>{T("allDone")}</div>
              <div style={{fontSize:12,color:"#9CA3AF"}}>{T("addFirst")}</div>
            </div>
          )
          : list.map(task=><TaskCard key={task.id} task={task}/>)
      )}

      {detail && (() => {
        const task = data.tasks.find(tk=>tk.id===detail);
        if(!task) return null;
        return (
          <div style={{background:"#1C1C26",borderRadius:16,padding:16,marginTop:8,border:"1px solid rgba(59,130,246,0.2)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <h4 style={{margin:0,fontSize:16,fontWeight:700}}>{task.title}</h4>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>openEdit(task)} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>{T("edit")}</button>
                <button onClick={()=>setDetail(null)} style={{background:"#2A2A35",color:"#9CA3AF",border:"none",borderRadius:8,padding:"6px 10px",fontSize:14,cursor:"pointer"}}>✕</button>
              </div>
            </div>
            {task.description&&<p style={{fontSize:13,opacity:.7,margin:"0 0 10px",whiteSpace:"pre-wrap",lineHeight:1.5}}>{task.description}</p>}
            <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:12,opacity:.6}}>
              {task.category&&<span>● {task.category}</span>}
              {task.dueDate&&<span style={{color:!task.done&&task.dueDate<today()?"#ef4444":"inherit"}}>◆ {task.dueDate}</span>}
              <span>▸ {({high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[task.priority])}</span>
              <span>{task.done?`◉ ${T("statusDone")}`:`◎ ${T("statusWaiting")}`}</span>
            </div>
          </div>
        );
      })()}

      <FAB onClick={openNew}/>

      <Modal open={modal} onClose={()=>{setModal(false);setEditingId(null);}} title={editingId?T("editTask"):T("newTask")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("taskTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))}/>
        </div>
        <div style={{height:10}}/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("descOpt")} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <input style={inp} placeholder={T("catOpt")} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>Tarih seç:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
            {quickDates.map(q=>(
              <button key={q.label} onClick={()=>setForm({...form,dueDate:q.val})} style={{
                background:form.dueDate===q.val?"rgba(59,130,246,0.2)":"#2A2A35",
                color:form.dueDate===q.val?"#3b82f6":"#aaa",
                border:form.dueDate===q.val?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.05)",
                padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{q.icon} {q.label}</button>
            ))}
            {form.dueDate&&<button onClick={()=>setForm({...form,dueDate:""})} style={{
              background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",
              padding:"8px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
            }}>✕ {T("clear")}</button>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
            {form.dueDate&&<span style={{fontSize:13,color:"#3b82f6",fontWeight:600,whiteSpace:"nowrap"}}>{formatDate(form.dueDate)}</span>}
          </div>
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("selPriority")}</div>
          <div style={{display:"flex",gap:6}}>
            {Object.keys(PCOL).map(k=>(
              <button key={k} onClick={()=>setForm({...form,priority:k})} style={{
                flex:1,padding:"10px",borderRadius:10,fontSize:13,cursor:"pointer",textAlign:"center",fontWeight:600,
                background:form.priority===k?`${PCOL[k]}20`:"#2A2A35",
                color:form.priority===k?PCOL[k]:"#9CA3AF",
                border:`1px solid ${form.priority===k?PCOL[k]+"40":"rgba(255,255,255,0.05)"}`,
              }}>
                <span style={{display:"block",width:8,height:8,borderRadius:"50%",background:PCOL[k],margin:"0 auto 4px"}}/>
                {{high:T("priHigh"),medium:T("priMed"),low:T("priLow")}[k]}
              </button>
            ))}
          </div>
        </div>
        <button style={btnPrimary} onClick={save}>{editingId?T("save"):T("add")}</button>
        {editingId&&<button onClick={()=>{del(editingId);setModal(false);setEditingId(null);}} style={{...btnPrimary,background:"#ef4444",marginTop:8}}>{T("deleteTask")}</button>}
      </Modal>
    </div>
  );
}

/* ═══════════ CALENDAR ═══════════ */
function CalendarView({ data, update }) {
  const T = (key) => i18n(key, data);
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

  const t = today();

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
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("calendar")}</h3>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>setVd(new Date(y,m-1))} style={{background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)",color:"#9CA3AF",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>◀</button>
            <span style={{fontWeight:700,fontSize:14,minWidth:105,textAlign:"center"}}>{T("months")[m]} {y}</span>
            <button onClick={()=>setVd(new Date(y,m+1))} style={{background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)",color:"#9CA3AF",width:32,height:32,borderRadius:10,fontSize:16,cursor:"pointer"}}>▶</button>
          </div>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {T("daysShort").map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"6px 0"}}>{d}</div>)}
        {cells.map((d,i)=>{
          const isToday=d&&ds(d)===t;
          const ev=d?evOn(d):[];
          const isSel=d&&selDay===d;
          return (
            <div key={i} onClick={()=>d&&setSelDay(selDay===d?null:d)} style={{
              background:isToday?"rgba(59,130,246,0.2)":isSel?"rgba(59,130,246,0.1)":"#1C1C26",
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
        <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <h4 style={{margin:0,fontSize:15,fontWeight:700}}>{selDay} {T("months")[m]}</h4>
            <button onClick={openAdd} style={{background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",fontWeight:600}}>+ {T("add")}</button>
          </div>
          {evOn(selDay).length===0&&<p style={{color:"#9CA3AF",fontSize:13,margin:0}}>{T("noEvents")}</p>}
          {evOn(selDay).map((e,idx)=>(
            <div key={idx} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#3b82f6",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:500}}>{e.title} {e.recurring&&e.recurring!=="none"&&<span style={{fontSize:10,color:"#9CA3AF"}}>↻</span>}</div>
                {e.time&&<div style={{fontSize:12,color:"#9CA3AF"}}>◷ {e.time}</div>}
                {e.description&&<div style={{fontSize:12,color:"#9CA3AF"}}>{e.description}</div>}
              </div>
              <button onClick={()=>del(e.id)} style={delBtnStyle} aria-label="Delete">✕</button>
            </div>
          ))}
        </div>
      )}
      {/* Upcoming events list */}
      {(() => {
        const upEv = data.events.filter(e=>e.date>=t).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,8);
        if(upEv.length===0) return null;
        return (
          <div style={{marginBottom:14}}>
            <GroupLabel label={T("upcoming")} count={upEv.length} color="#a855f7"/>
            {upEv.map(e=>(
              <div key={e.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:12,minHeight:52}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:e.color||"#a855f7",flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.title}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{e.date}{e.time?` · ${e.time}`:""}</div>
                </div>
                <button onClick={()=>update({...data,events:data.events.filter(ev=>ev.id!==e.id)})} style={delBtnStyle} aria-label="Delete">✕</button>
              </div>
            ))}
          </div>
        );
      })()}

      <FAB onClick={openAdd} color="#a855f7"/>

      <Modal open={modal} onClose={()=>setModal(false)} title={T("newEvent")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("eventName")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))} color="#8B5CF6"/>
        </div>
        <div style={{height:10}}/>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
          <input style={{...inp,flex:1}} type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/>
        </div>
        <input style={inp} placeholder={T("descOpt")} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <select style={inp} value={form.recurring} onChange={e=>setForm({...form,recurring:e.target.value})}>
          <option value="none">{T("repeatNone")}</option>
          <option value="daily">{T("repeatDaily")}</option>
          <option value="weekly">{T("repeatWeekly")}</option>
          <option value="monthly">{T("repeatMonthly")}</option>
        </select>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={add}>{T("add")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ SPORTS ═══════════ */
/* ═══════════ SAĞLIK (Health Coach) ═══════════ */
function Sports({ data, update, initialView, onBack }) {
  const T = (key) => i18n(key, data);
  const [modal,setModal]=useState(false);
  const [foodModal,setFoodModal]=useState(false);
  const [form,setForm]=useState({type:"Koşu",duration:"",distance:"",calories:"",date:today(),notes:""});
  const [foodForm,setFoodForm]=useState({name:"",calories:"",meal:"Öğle",date:today()});
  const [foodSearch,setFoodSearch]=useState("");
  const [analyzing,setAnalyzing]=useState(false);
  const [aiResult,setAiResult]=useState(null);
  const photoRef=useRef(null);

  // Dashboard'dan gelen yönlendirme — modalı otomatik aç
  useEffect(() => {
    if (initialView === "food") {
      const t = setTimeout(() => setFoodModal(true), 300);
      return () => clearTimeout(t);
    }
    if (initialView === "sport") {
      const t = setTimeout(() => setModal(true), 300);
      return () => clearTimeout(t);
    }
  }, [initialView]);

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

  const todayFoods=foods.filter(f=>f.date===t);
  const todayCalIn=todayFoods.reduce((a,f)=>a+(f.calories||0),0);
  const todaySports=data.sports.filter(s=>s.date===t);
  const todayCalOut=todaySports.reduce((a,s)=>a+(s.calories||0),0);
  const dailyGoal=2000;
  const netCal=todayCalIn-todayCalOut;

  // AI Coach advice
  const getCoachTip=()=>{
    if(todayCalIn===0&&todayCalOut===0) return {icon:"●",text:T("noRecordYet"),color:"#3b82f6"};
    if(netCal>dailyGoal+300) return {icon:"⚠️",text:`Bugün ${netCal} kcal net kalori — hedefin üzerinde. Hafif bir yürüyüş veya koşu iyi gelir!`,color:"#f59e0b"};
    if(netCal<1200&&todayCalIn>0) return {icon:"★",text:`Harika gidiyorsun! ${netCal} kcal net — dengeli ve sağlıklı.`,color:"#22c55e"};
    if(todayCalOut>300) return {icon:"▲",text:`Bugün ${todayCalOut} kcal yaktın, süpersin! Protein ağırlıklı beslenmeyi unutma.`,color:"#22c55e"};
    if(todayCalIn>0&&todayCalOut===0) return {icon:"▸",text:`${todayCalIn} kcal aldın ama henüz spor yapmadın. 30dk yürüyüş ~150 kcal yakar!`,color:"#f97316"};
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

  const mealGroups = [T("breakfast"),T("lunch"),T("dinner"),T("snack")];

  return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {onBack && <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>}
          <h3 style={{margin:0,fontSize:20,fontWeight:800,flex:1}}>{T("healthCoach")}</h3>
        </div>
      </StickyHeader>

      {/* Coach tip */}
      <div className="stagger-1" style={{background:`${tip.color}15`,border:`1px solid ${tip.color}30`,borderRadius:14,padding:"12px 14px",marginBottom:12,display:"flex",gap:10,alignItems:"start"}}>
        <span style={{fontSize:20}}>{tip.icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:tip.color,marginBottom:1}}>{T("yourCoach")}</div>
          <div style={{fontSize:12,opacity:.8,lineHeight:1.4}}>{tip.text}</div>
        </div>
      </div>

      {/* Kalori denge kartı */}
      <div className="stagger-2" style={{background:"#1C1C26",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-around",textAlign:"center",marginBottom:10}}>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#f97316"}}>{todayCalIn}</div>
            <div style={{fontSize:10,color:"#9CA3AF"}}>{T("intake")}</div>
          </div>
          <div style={{fontSize:18,opacity:.2,alignSelf:"center"}}>−</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:"#22c55e"}}>{todayCalOut}</div>
            <div style={{fontSize:10,color:"#9CA3AF"}}>{T("burned")}</div>
          </div>
          <div style={{fontSize:18,opacity:.2,alignSelf:"center"}}>=</div>
          <div>
            <div style={{fontSize:22,fontWeight:800,color:netCal>dailyGoal?"#ef4444":"#3b82f6"}}>{netCal}</div>
            <div style={{fontSize:10,color:"#9CA3AF"}}>{T("net")}</div>
          </div>
        </div>
        <div style={{height:6,background:"#2A2A35",borderRadius:3,overflow:"hidden"}}>
          <div style={{height:"100%",background:netCal>dailyGoal?"#ef4444":"#3b82f6",borderRadius:3,width:`${Math.min(100,netCal/dailyGoal*100)}%`,transition:"width .3s"}}/>
        </div>
        <div style={{fontSize:10,color:"#9CA3AF",marginTop:4,textAlign:"center"}}>{T("targetKcal").replace("{0}",dailyGoal)}</div>
      </div>

      {/* +Yemek / +Spor butonları */}
      <div className="stagger-3" style={{display:"flex",gap:8,marginBottom:14}}>
        <button onClick={()=>{setFoodModal(true);setFoodSearch("");}} style={{
          flex:1,background:"rgba(249,115,22,0.1)",color:"#f97316",
          border:"1px solid rgba(249,115,22,0.3)",borderRadius:12,
          padding:"14px 8px",fontSize:14,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <span style={{fontSize:18}}>+</span> {T("addMeal")}
        </button>
        <button onClick={()=>setModal(true)} style={{
          flex:1,background:"rgba(34,197,94,0.1)",color:"#22c55e",
          border:"1px solid rgba(34,197,94,0.3)",borderRadius:12,
          padding:"14px 8px",fontSize:14,fontWeight:700,cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        }}>
          <span style={{fontSize:18}}>+</span> {T("addExercise")}
        </button>
      </div>

      {hasAI&&(
        <div style={{marginBottom:12}}>
          <button onClick={()=>photoRef.current?.click()} disabled={analyzing} style={{
            ...addBtnStyle,background:analyzing?"#6B7280":"#22c55e",width:"100%",padding:"12px",borderRadius:12,fontSize:14,
          }}>{analyzing?`◌ ${T("analyzing")}`:` ◎ ${T("photoCalorie")}`}</button>
          <input ref={photoRef} type="file" accept="image/*" capture="environment"
            onChange={e=>{if(e.target.files?.[0])analyzePhoto(e.target.files[0]);e.target.value="";}}
            style={{display:"none"}}/>
        </div>
      )}

      {/* AI Result card */}
      {aiResult&&!aiResult.error&&(
        <div style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:14,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:13,fontWeight:700,color:"#22c55e"}}>AI Analiz Sonucu</span>
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

      {/* ── Bugünün Yemekleri ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("todayFoods")}</div>
        {todayFoods.length===0 ? (
          <div style={{textAlign:"center",padding:"20px",color:"#9CA3AF",fontSize:13}}>{T("noFoodYet")}</div>
        ) : mealGroups.map(meal=>{
          const mealFoods=todayFoods.filter(f=>f.meal===meal);
          if(mealFoods.length===0)return null;
          const mealCal=mealFoods.reduce((a,f)=>a+(f.calories||0),0);
          return (
            <div key={meal} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,opacity:.6}}>{meal}</span>
                <span style={{fontSize:11,fontWeight:600,color:"#f97316"}}>{mealCal} kcal</span>
              </div>
              {mealFoods.map(f=>(
                <div key={f.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
                  <span style={{fontSize:13,flex:1}}>{f.name}</span>
                  <span style={{fontSize:12,fontWeight:600,color:"#f97316"}}>{f.calories}</span>
                  <button onClick={()=>delFood(f.id)} style={delBtnStyle} aria-label="Delete">✕</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Bugünün Sporları ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("todaySports")}</div>
        {todaySports.length===0 ? (
          <div style={{textAlign:"center",padding:"20px",color:"#9CA3AF",fontSize:13}}>{T("noSportYet")}</div>
        ) : todaySports.map(s=>(
          <div key={s.id} style={{...cardStyle,display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
            <div style={{fontSize:20,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(34,197,94,0.1)",borderRadius:10}}>{SPORT_EMOJI[s.type]||"⚡"}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600}}>{s.type}</div>
              <div style={{fontSize:11,color:"#9CA3AF"}}>{s.duration}dk {s.distance>0&&`· ${s.distance}km`} · {s.calories||calcSportCal(s.type,s.duration)} kcal</div>
            </div>
            <button onClick={()=>delSport(s.id)} style={delBtnStyle} aria-label="Delete">✕</button>
          </div>
        ))}
      </div>

      {/* ── Haftalık Özet ── */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>{T("thisWeek")}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
          {[
            {icon:"⏱",val:`${tMin} ${T("locale")==="tr-TR"?"dk":"min"}`,label:T("sportDuration"),color:"#3b82f6"},
            {icon:"▸",val:`${burnedCal}`,label:T("burnedKcal"),color:"#ef4444"},
            {icon:"―",val:`${tDist.toFixed(1)} km`,label:T("distanceLabel"),color:"#22c55e"},
            {icon:"▲",val:wk.length,label:T("workout"),color:"#f97316"},
          ].map((s,i)=>(
            <div key={i} style={{...cardStyle,padding:"12px",borderLeft:`3px solid ${s.color}`,boxShadow:`0 0 12px ${s.color}15`}}>
              <div style={{fontSize:10,color:"#9CA3AF"}}>{s.icon} {s.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:s.color,marginTop:3}}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ YEMEK EKLEME MODAL ═══ */}
      <Modal open={foodModal} onClose={()=>{setFoodModal(false);setFoodSearch("");}} title={T("addMealTitle")}>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            {mealGroups.map(m=>(
              <button key={m} onClick={()=>setFoodForm({...foodForm,meal:m})} style={{
                background:foodForm.meal===m?"rgba(59,130,246,0.2)":"#2A2A35",
                color:foodForm.meal===m?"#3b82f6":"#aaa",
                border:foodForm.meal===m?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.05)",
                padding:"7px 12px",borderRadius:10,fontSize:13,cursor:"pointer",
              }}>{m}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("searchFood")} value={foodSearch||foodForm.name}
              onChange={e=>{
                const v=e.target.value;
                setFoodSearch(v);
                const exactMatch = allFoodDB[v];
                setFoodForm({...foodForm,name:v,calories:exactMatch?String(exactMatch):""});
              }}/>
            <VoiceMic onResult={(t)=>{setFoodSearch(t);const m=allFoodDB[t];setFoodForm({...foodForm,name:t,calories:m?String(m):""});}} color="#F59E0B"/>
          </div>
          <div style={{height:10}}/>
          {(foodSearch||!foodForm.name)&&(
            <div style={{maxHeight:180,overflow:"auto",marginBottom:10}}>
              {!foodSearch&&Object.keys(myFoods).length>0&&(
                <div style={{fontSize:10,color:"#9CA3AF",padding:"4px 8px",fontWeight:700}}>⭐ {T("myFoodsLabel")}</div>
              )}
              {filteredFoods.map(([name,cal,source])=>(
                <div key={name} onClick={()=>selectCommonFood(name,cal)} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 10px",cursor:"pointer",
                  borderRadius:8,background:"#1C1C26",marginBottom:2,
                }}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {(source==="my"||myFoods[name])&&<span style={{fontSize:10,color:"#f59e0b"}}>⭐</span>}
                    <span style={{fontSize:13}}>{name}</span>
                  </div>
                  <span style={{fontSize:12,color:"#f97316",fontWeight:600}}>{cal} kcal</span>
                </div>
              ))}
              {noResults&&(
                <div style={{textAlign:"center",padding:12}}>
                  <p style={{fontSize:12,color:"#9CA3AF",margin:"0 0 8px"}}>"{foodSearch}" bulunamadı</p>
                  {hasAI?(
                    <button onClick={()=>askAiCalorie(foodSearch)} disabled={aiLookup} style={{
                      background:"rgba(34,197,94,0.15)",color:"#22c55e",border:"1px solid rgba(34,197,94,0.3)",
                      padding:"8px 16px",borderRadius:10,fontSize:13,cursor:"pointer",fontWeight:600,
                    }}>{aiLookup?`◌ ${T("analyzing")}`:` ◈ ${T("askAI")}`}</button>
                  ):(
                    <p style={{fontSize:11,color:"#9CA3AF"}}>Kaloriyi elle gir veya Ayarlar'dan AI aç</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,flex:2}} placeholder={T("foodName")} value={foodForm.name} onChange={e=>setFoodForm({...foodForm,name:e.target.value})}/>
            <div style={{flex:1,position:"relative"}}>
              <input style={{...inp,paddingRight:hasAI?36:14}} type="number" placeholder={T("kcalUnit")} value={foodForm.calories} onChange={e=>setFoodForm({...foodForm,calories:e.target.value})}/>
              {hasAI&&foodForm.name&&!foodForm.calories&&(
                <button onClick={()=>askAiCalorie(foodForm.name)} disabled={aiLookup} style={{
                  position:"absolute",right:8,top:8,background:"none",border:"none",
                  fontSize:16,cursor:"pointer",opacity:aiLookup?.4:.8,
                }} title="AI'a sor">{aiLookup?"◌":"◈"}</button>
              )}
            </div>
          </div>
          {foodForm.name&&foodForm.calories&&!allFoodDB[foodForm.name.trim()]&&(
            <div style={{fontSize:10,color:"#9CA3AF",marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
              <span>⭐</span> "{foodForm.name}" kişisel listene kaydedilecek
            </div>
          )}
          <input style={inp} type="date" value={foodForm.date} onChange={e=>setFoodForm({...foodForm,date:e.target.value})}/>
          <button style={{...btnPrimary,background:"linear-gradient(135deg,#f97316,#ef4444)"}} onClick={()=>{addFood();setFoodModal(false);setFoodSearch("");}}>{T("add")}</button>
        </div>
      </Modal>

      {/* ═══ SPOR EKLEME MODAL ═══ */}
      <Modal open={modal} onClose={()=>setModal(false)} title={T("addSportTitle")}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {SPORT_TYPES.map((s,si)=>(
            <button key={s} onClick={()=>setForm({...form,type:s})} style={{
              background:form.type===s?"rgba(34,197,94,0.2)":"#2A2A35",
              color:form.type===s?"#22c55e":"#9CA3AF",
              border:form.type===s?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(255,255,255,0.05)",
              padding:"7px 14px",borderRadius:10,fontSize:13,cursor:"pointer",
              display:"flex",alignItems:"center",gap:4,
            }}><span>{SPORT_EMOJI[s]}</span>{(T("sportNames")||SPORT_TYPES)[si]}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder={T("duration")} value={form.duration} onChange={e=>setForm({...form,duration:e.target.value,calories:String(calcSportCal(form.type,e.target.value))})}/>
          <input style={{...inp,flex:1}} type="number" placeholder={T("distance")} value={form.distance} onChange={e=>setForm({...form,distance:e.target.value})}/>
        </div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...inp,flex:1}} type="number" placeholder={T("calorie")+" (kcal)"} value={form.calories} onChange={e=>setForm({...form,calories:e.target.value})}/>
          <input style={{...inp,flex:1}} type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        </div>
        <input style={inp} placeholder={T("notesOpt")} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <button style={{...btnPrimary,background:"linear-gradient(135deg,#22c55e,#14b8a6)"}} onClick={()=>{addSport();setModal(false);}}>{T("add")}</button>
      </Modal>
    </div>
  );
}



/* ═══════════ NEWS ROOM ═══════════ */
const NEWS_SOURCES = {
  teknoloji: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                           lang:"TR", color:"#dc2626" },
    { name:"BBC Tech",       url:"https://feeds.bbci.co.uk/news/technology/rss.xml",               lang:"EN", color:"#3b82f6" },
    { name:"Ars Technica",   url:"https://feeds.arstechnica.com/arstechnica/index",                lang:"EN", color:"#f97316" },
    { name:"Hacker News",    url:"https://hnrss.org/frontpage?count=15",                           lang:"EN", color:"#ff6600" },
  ],
  spor: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Sport",      url:"https://feeds.bbci.co.uk/sport/rss.xml",                        lang:"EN", color:"#ef4444" },
    { name:"BBC Football",   url:"https://feeds.bbci.co.uk/sport/football/rss.xml",               lang:"EN", color:"#ef4444" },
    { name:"ESPN",           url:"https://www.espn.com/espn/rss/news",                            lang:"EN", color:"#cc0000" },
  ],
  sanat: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Arts",       url:"https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml",  lang:"EN", color:"#a855f7" },
    { name:"NPR Arts",       url:"https://feeds.npr.org/1008/rss.xml",                            lang:"EN", color:"#7c3aed" },
  ],
  saglik: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Health",     url:"https://feeds.bbci.co.uk/news/health/rss.xml",                  lang:"EN", color:"#22c55e" },
    { name:"NPR Health",     url:"https://feeds.npr.org/1128/rss.xml",                            lang:"EN", color:"#16a34a" },
    { name:"Science Daily",  url:"https://www.sciencedaily.com/rss/health_medicine.xml",          lang:"EN", color:"#0d9488" },
  ],
  ekonomi: [
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC Business",   url:"https://feeds.bbci.co.uk/news/business/rss.xml",                lang:"EN", color:"#f59e0b" },
    { name:"NPR Economy",    url:"https://feeds.npr.org/1006/rss.xml",                            lang:"EN", color:"#d97706" },
  ],
  politika: [
    { name:"BBC Türkçe",     url:"https://www.bbc.com/turkce/index.xml",                          lang:"TR", color:"#dc2626" },
    { name:"DW Türkçe",      url:"https://rss.dw.com/xml/rss-tur-all",                              lang:"TR", color:"#0284c7" },
    { name:"BBC World",      url:"https://feeds.bbci.co.uk/news/world/rss.xml",                   lang:"EN", color:"#ef4444" },
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
    { name:"BBC Breaking",   url:"https://feeds.bbci.co.uk/news/rss.xml",                         lang:"EN", color:"#ef4444" },
  ],
};

/* ── Önerilen RSS Kaynakları ── */
const SUGGESTED_FEEDS = [
  { name:"T24",           url:"https://t24.com.tr/rss/haberler",           lang:"TR", color:"#e11d48", desc:"Bağımsız haber" },
  { name:"BBC Türkçe",    url:"https://www.bbc.com/turkce/index.xml",      lang:"TR", color:"#dc2626", desc:"Güvenilir dünya haberleri" },
  { name:"DW Türkçe",     url:"https://rss.dw.com/xml/rss-tur-all",       lang:"TR", color:"#0284c7", desc:"Almanya ve dünya" },
  { name:"Ars Technica",  url:"https://feeds.arstechnica.com/arstechnica/index", lang:"EN", color:"#f97316", desc:"Derinlemesine teknoloji" },
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
  { id:"spor",      label:"Spor",      color:"#ef4444",  desc:"Futbol, basketbol & dünya sporları" },
  { id:"teknoloji", label:"Teknoloji", color:"#3b82f6",  desc:"Yapay zeka, gadget & yazılım" },
  { id:"ekonomi",   label:"Ekonomi",   color:"#f59e0b",  desc:"Piyasalar, borsa & iş dünyası" },
  { id:"politika",  label:"Politika",  color:"#ef4444",  desc:"Dünya siyaseti & gündem" },
  { id:"saglik",    label:"Sağlık",    color:"#22c55e",  desc:"Tıp, beslenme & wellness" },
  { id:"bilim",     label:"Bilim",     color:"#06b6d4",  desc:"Uzay, keşifler & araştırmalar" },
  { id:"sanat",     label:"Sanat",     color:"#a855f7",  desc:"Kültür, sanat & eğlence" },
  { id:"dunya",     label:"Dünya",     color:"#64748b",  desc:"Dünya haberleri & olaylar" },
];

/* ── NewsRoom: Category grid → drill into article list ── */
function NewsRoom({ room, onBack, data, update }) {
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
    setCustomFeeds([...customFeeds, { name:feed.name, url:feed.url, lang:feed.lang||"TR", color:feed.color||"#3b82f6" }]);
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
            <div style={{fontSize:11,color:"#9CA3AF",marginTop:1}}>{catInfo?.desc}</div>
          </div>
          <button onClick={()=>fetchCategory(activeCat,true)} style={{
            background:"#2A2A35",border:"1px solid rgba(255,255,255,0.1)",
            color:"#9CA3AF",width:34,height:34,borderRadius:10,fontSize:14,cursor:"pointer",
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
              background:langFilter===k?`${catInfo?.color}25`:"rgba(255,255,255,0.05)",
              color:langFilter===k?catInfo?.color:"#9CA3AF",
            }}>{v}</button>
          ))}
        </div>
      </StickyHeader>

      {isLoading&&(
        <div style={{textAlign:"center",padding:"50px 0"}}>
          <div style={{margin:"0 auto 10px",animation:"pulse 1.5s ease-in-out infinite",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center"}}>
            {NEWS_ICONS[activeCat]?.(catInfo?.color||"#aaa")}
          </div>
          <div style={{fontSize:13,color:"#9CA3AF",marginBottom:4}}>{T("newsLoading")}</div>
          <div style={{fontSize:11,color:"#9CA3AF"}}>{NEWS_SOURCES[activeCat]?.map(s=>s.name).join(" · ")}</div>
        </div>
      )}

      {!isLoading&&list.length>0&&(
        <div>
          <div style={{fontSize:11,color:"#9CA3AF",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
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
                    <div style={{fontSize:12,color:"#9CA3AF",lineHeight:1.45,marginBottom:6,
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
                    {article.pubDate&&<span style={{fontSize:10,color:"#9CA3AF"}}>{timeAgo(article.pubDate)}</span>}
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
            <svg width="40" height="40" viewBox="0 0 36 36" fill="none"><circle cx="18" cy="14" r="5" stroke={activeCat==="custom"?"#8b5cf6":"#9CA3AF"} strokeWidth="1.5"/><line x1="18" y1="19" x2="18" y2="30" stroke={activeCat==="custom"?"#8b5cf6":"#9CA3AF"} strokeWidth="1.5"/><line x1="12" y1="26" x2="24" y2="26" stroke={activeCat==="custom"?"#8b5cf6":"#9CA3AF"} strokeWidth="1.5" opacity=".5"/></svg>
          </div>
          {activeCat==="custom"&&customFeeds.length===0 ? (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:6}}>{T("noCustomFeeds")}</div>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:16}}>{T("addFirstSource")}</div>
              <button onClick={()=>{setActiveCat(null);setShowSourceModal(true);}} style={{
                background:"rgba(139,92,246,0.15)",color:"#8b5cf6",
                border:"1px solid rgba(139,92,246,0.3)",borderRadius:10,
                padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>+ {T("addSource")}</button>
            </>
          ) : langFilter!=="all"&&rawList.length>0 ? (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:6}}>{langFilter==="TR"?"Türkçe":"İngilizce"} haber bulunamadı</div>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:16}}>Diğer dillerde {rawList.length} haber mevcut</div>
              <button onClick={()=>setLangFilter("all")} style={{
                background:`${catInfo?.color}20`,color:catInfo?.color,
                border:`1px solid ${catInfo?.color}40`,borderRadius:10,
                padding:"10px 24px",fontSize:12,cursor:"pointer",fontWeight:600,
              }}>Tümünü Göster</button>
            </>
          ) : (
            <>
              <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:6}}>Haber yüklenemedi</div>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:16}}>İnternet bağlantını kontrol et</div>
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
            <svg width="22" height="22" viewBox="0 0 36 36" fill="none"><rect x="4" y="7" width="28" height="22" rx="2" stroke="#ef4444" strokeWidth="1.5" fill="rgba(239,68,68,0.1)"/><line x1="9" y1="13" x2="27" y2="13" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/><line x1="9" y1="18" x2="27" y2="18" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/><line x1="9" y1="23" x2="20" y2="23" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg>
          </span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{T("news")}</h3>
          <span style={{fontSize:11,color:"#9CA3AF"}}>{localCats.length} {T("categories")}</span>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,color:"#9CA3AF"}}>{T("touchToExplore")}</p>
      </StickyHeader>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {localCats.map((cat,idx)=>(
          <div key={cat.id} className={`touch-card stagger-${Math.min(idx+1,6)}`} onClick={()=>openCat(cat.id)}
            style={{
              background:`linear-gradient(145deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.02) 100%)`,
              
              borderRadius:20,padding:"20px 16px",cursor:"pointer",
              border:`1px solid ${cat.color}45`,
              boxShadow:`0 0 28px ${cat.color}22, 0 0 56px ${cat.color}0a, inset 0 1px 0 rgba(255,255,255,0.05)`,
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
              <div style={{fontSize:10,color:"#9CA3AF",animation:"pulse 1s ease-in-out infinite"}}>yükleniyor...</div>
            )}
          </div>
        ))}

        {/* ── Kaynaklarım kartı ── */}
        <div className="touch-card" onClick={()=>customFeeds.length>0?openCat("custom"):setShowSourceModal(true)}
          style={{
            background:"linear-gradient(145deg,rgba(139,92,246,0.12) 0%,rgba(139,92,246,0.04) 100%)",
            borderRadius:20,padding:"20px 16px",cursor:"pointer",
            border:"1px solid rgba(139,92,246,0.35)",
            boxShadow:"0 0 28px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
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
            background:"#1C1C26",borderRadius:"24px 24px 0 0",
            padding:"20px 16px calc(20px + env(safe-area-inset-bottom,0px))",
            overflowY:"auto",
          }}>
            {/* Modal Header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:"#fff"}}>{T("addSource")}</h3>
              <button onClick={()=>setShowSourceModal(false)} style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#9CA3AF",width:32,height:32,borderRadius:10,cursor:"pointer",fontSize:16}}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",gap:6,marginBottom:16}}>
              {[["suggested",T("suggestedSources")],["manual",T("manualUrl")]].map(([k,v])=>(
                <button key={k} onClick={()=>setSourceTab(k)} style={{
                  flex:1,padding:"10px",borderRadius:12,border:"none",cursor:"pointer",
                  fontSize:12,fontWeight:sourceTab===k?700:400,
                  background:sourceTab===k?"rgba(139,92,246,0.15)":"rgba(255,255,255,0.05)",
                  color:sourceTab===k?"#8b5cf6":"#9CA3AF",
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
                      background:"rgba(255,255,255,0.04)",borderRadius:14,
                      border:`1px solid ${added?"rgba(139,92,246,0.3)":"rgba(255,255,255,0.06)"}`,
                    }}>
                      <div style={{
                        width:36,height:36,borderRadius:10,flexShrink:0,
                        background:`${feed.color}20`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,fontWeight:800,color:feed.color,
                      }}>{feed.name.slice(0,2)}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#fff"}}>{feed.name}</div>
                        <div style={{fontSize:10,color:"#9CA3AF",marginTop:1}}>{feed.desc}</div>
                        <div style={{fontSize:9,color:feed.color,marginTop:2}}>{feed.lang}</div>
                      </div>
                      <button onClick={()=>added?removeFeed(feed.url):addFeed(feed)} style={{
                        padding:"6px 14px",borderRadius:10,border:"none",cursor:"pointer",
                        fontSize:11,fontWeight:700,
                        background:added?"rgba(239,68,68,0.15)":"rgba(139,92,246,0.15)",
                        color:added?"#ef4444":"#8b5cf6",
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
                  padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:13,outline:"none",
                }}/>
                <input value={manualUrl} onChange={e=>setManualUrl(e.target.value)}
                  placeholder="https://example.com/rss.xml" style={{
                  padding:"12px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.1)",
                  background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:13,outline:"none",
                }}/>
                <button onClick={addManualFeed} disabled={!manualUrl.trim()} style={{
                  padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                  background:manualUrl.trim()?"#8b5cf6":"rgba(255,255,255,0.1)",
                  color:manualUrl.trim()?"#fff":"#9CA3AF",fontSize:13,fontWeight:700,
                }}>+ {T("addSource")}</button>
              </div>
            )}

            {/* Mevcut Kaynaklar */}
            {customFeeds.length>0&&(
              <div style={{marginTop:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",marginBottom:8}}>{T("mySources")} ({customFeeds.length})</div>
                {customFeeds.map(feed=>(
                  <div key={feed.url} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                    background:"rgba(255,255,255,0.04)",borderRadius:12,marginBottom:6,
                    border:"1px solid rgba(139,92,246,0.2)",
                  }}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:feed.color,flexShrink:0}}/>
                    <div style={{flex:1,fontSize:12,fontWeight:600,color:"#fff"}}>{feed.name}</div>
                    <div style={{fontSize:9,color:"#9CA3AF"}}>{feed.lang}</div>
                    <button onClick={()=>removeFeed(feed.url)} style={{
                      background:"rgba(239,68,68,0.12)",border:"none",color:"#ef4444",
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
function MusicRoom({ room, items, onBack, onAdd, onDel, data }) {
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
const WMO_TR={0:"Açık",1:"Çoğunlukla açık",2:"Kısmen bulutlu",3:"Bulutlu",45:"Sisli",61:"Hafif yağmurlu",63:"Orta yağmurlu",65:"Şiddetli yağmurlu",71:"Hafif karlı",80:"Hafif sağanak",95:"Gök gürültülü"};
function getStyleHint(t,T){if(t<8)return T("style1");if(t<14)return T("style2");if(t<18)return T("style3");if(t<23)return T("style4");if(t<28)return T("style5");return T("style6");}
function getWeatherLooks(t,T){if(t<14)return[{icon:"coat",name:T("lookLayered"),tags:[{l:T("tagWork"),c:"work"},{l:T("tagCool"),c:"cool"}],mood:T("moodConfidentPro")},{icon:"scarf",name:T("lookCasualLayer"),tags:[{l:T("tagCasual"),c:"casual"},{l:T("tagCool"),c:"cool"}],mood:T("moodComfy")},{icon:"smart",name:T("lookSmartCozy"),tags:[{l:T("tagElegant"),c:"elegant"}],mood:T("moodPeaceful")}];if(t<23)return[{icon:"coat",name:"Business Classic",tags:[{l:T("tagWork"),c:"work"},{l:T("tagElegant"),c:"elegant"}],mood:T("moodConfident")},{icon:"dress",name:"Smart Casual",tags:[{l:T("tagCasual"),c:"casual"}],mood:T("moodChic")},{icon:"smart",name:"Minimalist",tags:[{l:T("tagSimple"),c:"casual"}],mood:T("moodStrong")}];return[{icon:"dress",name:"Summer Chic",tags:[{l:T("tagCasual"),c:"casual"},{l:T("tagWarm"),c:"warm"}],mood:T("moodEnergetic")},{icon:"linen",name:"Linen Look",tags:[{l:T("tagElegant"),c:"elegant"},{l:T("tagWarm"),c:"warm"}],mood:T("moodNatural")},{icon:"smart",name:"Minimalist",tags:[{l:T("tagSimple"),c:"casual"}],mood:T("moodFree")}];}
function ClothingIcon({type,size=28,color="#a78bfa"}){const s=size;
  if(type==="coat"||type==="blazer")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/></svg>);
  if(type==="dress")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M12 4L20 4L22 12L26 28L6 28L10 12Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><line x1="12" y1="4" x2="20" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="scarf")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M9 4C9 4 6 5 4 8L2 13L8 15L8 12L10 12L10 28L22 28L22 12L24 12L24 15L30 13L28 8C26 5 23 4 23 4C23 4 21 7 16 7C11 7 9 4 9 4Z" stroke={color} strokeWidth="1.5" fill={color+"18"} strokeLinejoin="round"/><path d="M13 7 Q16 9 19 7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>);
  if(type==="bottom")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M6 4L26 4L24 28L18 28L16 18L14 28L8 28Z" stroke={color} strokeWidth="1.5" fill={color+"15"} strokeLinejoin="round"/><line x1="6" y1="4" x2="26" y2="4" stroke={color} strokeWidth="1.5"/></svg>);
  if(type==="linen")return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><line x1="12" y1="18" x2="20" y2="18" stroke={color} strokeWidth="1" opacity=".4"/></svg>);
  return(<svg width={s} height={s} viewBox="0 0 32 32" fill="none"><path d="M11 4C11 4 8 5 6 7L3 12L8 14L8 28L24 28L24 14L29 12L26 7C24 5 21 4 21 4C21 6 19 8 16 8C13 8 11 6 11 4Z" stroke={color} strokeWidth="1.5" fill={color+"15"}/><path d="M16 8L16 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity=".6"/></svg>);
}
const CLOTH_CATS=[{id:"top",label:"Üst Giyim",color:"#6366f1",svgType:"smart"},{id:"alt",label:"Alt Giyim",color:"#a78bfa",svgType:"bottom"},{id:"dis",label:"Dış Giyim",color:"#3b82f6",svgType:"coat"},{id:"elbise",label:"Elbise/Etek",color:"#ec4899",svgType:"dress"}];
const CLOTH_FREQ={favorite:{bg:"rgba(34,197,94,0.15)",border:"rgba(34,197,94,0.3)",text:"#86efac",label:"Favori"},frequent:{bg:"rgba(99,102,241,0.15)",border:"rgba(99,102,241,0.3)",text:"#a5b4fc",label:"Sık"},waiting:{bg:"rgba(239,68,68,0.15)",border:"rgba(239,68,68,0.3)",text:"#fca5a5",label:"Bekliyor"},new:{bg:"rgba(167,139,250,0.15)",border:"rgba(167,139,250,0.3)",text:"#c4b5fd",label:"Yeni"}};
const TAG_COL={work:{bg:"rgba(59,130,246,0.2)",text:"#93c5fd"},casual:{bg:"rgba(34,197,94,0.2)",text:"#86efac"},elegant:{bg:"rgba(168,85,247,0.2)",text:"#d8b4fe"},warm:{bg:"rgba(249,115,22,0.2)",text:"#fdba74"},cool:{bg:"rgba(99,102,241,0.15)",text:"#a5b4fc"}};
const PALETTE_COLS=[{hex:"#c8b8a2",name:"Bej"},{hex:"#9fa8a3",name:"Gri"},{hex:"#1e3a5f",name:"Lacivert"},{hex:"#3d3d3d",name:"Antrasit"},{hex:"#f5f0e8",name:"Krem"},{hex:"#8b7355",name:"Kahve"},{hex:"#6b4c3b",name:"Terracotta"},{hex:"#2c4a3e",name:"Koyu Yeşil"}];
const DEFAULT_WARDROBE2=[{id:"w1",name:"Lacivert Blazer",cat:"dis",wornCount:3,lastWorn:"12 gün önce",freq:60,freqStatus:"frequent",color:"#1e3a5f"},{id:"w2",name:"Bej Oversize Bluz",cat:"top",wornCount:1,lastWorn:"25 gün önce",freq:20,freqStatus:"waiting",color:"#c8b8a2"},{id:"w3",name:"Antrasit Slim Pantolon",cat:"alt",wornCount:5,lastWorn:"5 gün önce",freq:85,freqStatus:"favorite",color:"#3d3d3d"},{id:"w4",name:"Beyaz Basic Tişört",cat:"top",wornCount:7,lastWorn:"2 gün önce",freq:95,freqStatus:"frequent",color:"#f5f0e8"}];
const DEFAULT_RULES2=[{id:"r1",label:"İş ortamına uygun",on:true},{id:"r2",label:"Sürdürülebilir palet",on:true},{id:"r3",label:"Bu ay yeni alım yok",on:false},{id:"r4",label:"Tekrar giymeden ekleme yok",on:true}];
const catIconMap={top:"smart",alt:"bottom",dis:"coat",elbise:"dress"};

function BenimStilimRoom({data,update,onBack}){
  const T = (key) => i18n(key, data);
  const [weather,setWeather]=useState(null);
  const [wxLoad,setWxLoad]=useState(true);
  const [cityName,setCityName]=useState(T("gettingLoc"));
  const [activeLook,setActiveLook]=useState(0);
  const [wardFilter,setWardFilter]=useState("all");
  const [addModal,setAddModal]=useState(false);
  const [addForm,setAddForm]=useState({name:"",cat:"top",color:"#c8b8a2"});
  const stilData=data.stilData||{wardrobe:DEFAULT_WARDROBE2,rules:DEFAULT_RULES2,paletteActive:[]};
  const wardrobe=stilData.wardrobe||DEFAULT_WARDROBE2;
  const rules=stilData.rules||DEFAULT_RULES2;
  const paletteActive=stilData.paletteActive||[];
  const saveStil=(patch)=>update({...data,stilData:{...stilData,...patch}});
  useEffect(()=>{
    setWxLoad(true);
    const fetchWeather = (lat, lon, tz) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=${tz||"auto"}`)
        .then(r=>r.json()).then(d=>{const c=d.current;setWeather({temp:Math.round(c.temperature_2m),feel:Math.round(c.apparent_temperature),humid:Math.round(c.relative_humidity_2m),wind:Math.round(c.wind_speed_10m),desc:WMO_TR[c.weather_code]||"Bilinmiyor"});}).catch(()=>setWeather(null)).finally(()=>setWxLoad(false));
    };
    const getCityName = (lat, lon) => {
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&timezone=auto`)
        .then(r=>r.json()).then(d=>{ setCityName(d.timezone?.split("/").pop()?.replace(/_/g," ") || `${lat.toFixed(1)}°, ${lon.toFixed(1)}°`); }).catch(()=>{});
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          fetchWeather(lat, lon, "auto");
          getCityName(lat, lon);
        },
        () => { fetchWeather(41.0082, 28.9784, "Europe/Istanbul"); setCityName("İstanbul"); },
        { timeout: 8000 }
      );
    } else {
      fetchWeather(41.0082, 28.9784, "Europe/Istanbul"); setCityName("İstanbul");
    }
  },[]);
  const looks=getWeatherLooks(weather?.temp??18,T);
  const freqScore=wardrobe.length===0?0:Math.round(wardrobe.filter(w=>w.freq>50).length/wardrobe.length*100);
  const filtered=wardFilter==="all"?wardrobe:wardrobe.filter(w=>w.cat===wardFilter);
  const toggleRule=(id)=>saveStil({rules:rules.map(r=>r.id===id?{...r,on:!r.on}:r)});
  const togglePalette=(hex)=>saveStil({paletteActive:paletteActive.includes(hex)?paletteActive.filter(h=>h!==hex):[...paletteActive,hex]});
  const wearCloth=(id)=>saveStil({wardrobe:wardrobe.map(w=>{if(w.id!==id)return w;const wc=(w.wornCount||0)+1;const freq=Math.min(100,(w.freq||0)+15);const fs=freq>=70?"favorite":freq>=40?"frequent":wc<=1?"new":"waiting";return{...w,wornCount:wc,lastWorn:"Bugün",freq,freqStatus:fs};})});
  const delCloth=(id)=>saveStil({wardrobe:wardrobe.filter(w=>w.id!==id)});
  const addCloth=()=>{if(!addForm.name.trim())return;const ni={id:uid(),name:addForm.name,cat:addForm.cat,wornCount:0,lastWorn:T("neverWorn"),freq:0,freqStatus:"new",color:addForm.color};saveStil({wardrobe:[ni,...wardrobe]});setAddModal(false);setAddForm({name:"",cat:"top",color:"#c8b8a2"});};
  return(
    <div>
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={onBack}>◀</button>
          <div>
            <div style={{fontSize:18,fontWeight:900,background:"linear-gradient(135deg,#e0d5f5,#a78bfa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{T("myStyle")}</div>
            <div style={{fontSize:10,color:"#9CA3AF"}}>{T("lifestyleDesc")}</div>
          </div>
        </div>
      </StickyHeader>
      <div style={{background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(99,102,241,0.1))",border:"1px solid rgba(59,130,246,0.2)",borderRadius:16,padding:"14px 16px",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",letterSpacing:1,textTransform:"uppercase"}}>{T("todayWeather")}</div><div style={{fontSize:12,color:"#9CA3AF",marginTop:2}}>{cityName}</div></div>
          <div style={{textAlign:"right"}}>{wxLoad?<div style={{fontSize:12,color:"#9CA3AF",animation:"pulse 1.5s infinite"}}>Yükleniyor...</div>:weather?<><div style={{fontSize:26,fontWeight:800,color:"#e0d5f5"}}>{weather.temp}°C</div><div style={{fontSize:11,color:"#9CA3AF"}}>{weather.desc}</div></>:<div style={{fontSize:11,color:"#9CA3AF"}}>Veri alınamadı</div>}</div>
        </div>
        {weather&&<div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",display:"flex",gap:16}}><div style={{fontSize:10,color:"#9CA3AF"}}>{weather.wind} km/s {T("wind")}</div><div style={{fontSize:10,color:"#9CA3AF"}}>%{weather.humid} {T("humidity")}</div><div style={{fontSize:10,color:"#9CA3AF"}}>{weather.feel}°C {T("feelsLike")}</div></div>}
        <div style={{marginTop:10,background:"#2A2A35",borderRadius:10,padding:"8px 12px"}}><div style={{fontSize:10,color:"#9CA3AF",marginBottom:3}}>{T("styleAdvice")}</div><div style={{fontSize:13,color:"#c4b5fd",fontWeight:600}}>{wxLoad?T("calculating"):weather?getStyleHint(weather.temp,T):T("noWeather")}</div></div>
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#9CA3AF",textTransform:"uppercase",marginBottom:10}}>{T("todayLooks")}</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {looks.map((look,i)=>(
          <div key={i} onClick={()=>setActiveLook(i)} style={{background:activeLook===i?"rgba(167,139,250,0.1)":"#2A2A35",border:`1px solid ${activeLook===i?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.05)"}`,borderRadius:14,padding:"12px 8px",cursor:"pointer",flex:1,minWidth:0,transition:"all .2s"}}>
            <div style={{marginBottom:6,display:"flex",justifyContent:"center"}}><ClothingIcon type={look.icon} size={26} color={activeLook===i?"#a78bfa":"#9CA3AF"}/></div>
            <div style={{fontSize:11,fontWeight:700,marginBottom:4,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{look.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>{look.tags.map((t,ti)=><span key={ti} style={{fontSize:9,fontWeight:600,padding:"2px 5px",borderRadius:20,background:TAG_COL[t.c]?.bg,color:TAG_COL[t.c]?.text}}>{t.l}</span>)}</div>
            <div style={{fontSize:9,color:"#9CA3AF",marginTop:4,textAlign:"center"}}>{look.mood}</div>
          </div>
        ))}
      </div>
      <div style={{background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#9CA3AF",textTransform:"uppercase",marginBottom:12}}>{T("styleRules")}</div>
        <div style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.7,marginBottom:4}}><span>{T("wearScore")}</span><span style={{color:"#a78bfa",fontWeight:700}}>{freqScore}%</span></div>
          <div style={{height:6,borderRadius:3,background:"#2A2A35"}}><div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#6366f1,#a78bfa)",width:`${freqScore}%`,transition:"width .8s"}}/></div>
          <div style={{fontSize:10,color:"#9CA3AF",marginTop:4}}>{freqScore<50?T("wardrobeWaiting"):freqScore<80?T("wardrobeOptimal"):T("wardrobePerfect")}</div>
        </div>
        {rules.map(r=>(
          <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{fontSize:13,opacity:.85}}>{{r1:T("rule1"),r2:T("rule2"),r3:T("rule3"),r4:T("rule4")}[r.id]||r.label}</span>
            <div onClick={()=>toggleRule(r.id)} style={{width:38,height:22,borderRadius:11,cursor:"pointer",position:"relative",background:r.on?"rgba(167,139,250,0.7)":"rgba(255,255,255,0.1)",transition:"background .2s",flexShrink:0}}>
              <div style={{position:"absolute",width:16,height:16,borderRadius:"50%",background:"#fff",top:3,left:r.on?19:3,transition:"left .2s"}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:16,padding:"14px 16px",marginBottom:12}}>
        <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#9CA3AF",textTransform:"uppercase",marginBottom:12}}>{T("colorPalette")}</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>togglePalette(p.hex)} style={{width:36,height:36,borderRadius:10,background:p.hex,cursor:"pointer",flexShrink:0,transition:"transform .15s",outline:paletteActive.includes(p.hex)?"2.5px solid rgba(167,139,250,0.9)":"none",transform:paletteActive.includes(p.hex)?"scale(1.12)":"scale(1)"}}/>))}
          <div style={{width:36,height:36,borderRadius:10,border:"1.5px dashed rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"#9CA3AF",cursor:"pointer"}}>+</div>
        </div>
        <div style={{fontSize:10,color:"#9CA3AF",marginTop:8}}>{paletteActive.length===0?T("paletteTap"):T("paletteActive").replace("{0}",paletteActive.length)}</div>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:"#9CA3AF",textTransform:"uppercase"}}>{T("myCloset")}</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"all",l:T("all")},{id:"top",l:T("top")},{id:"alt",l:T("bottom")},{id:"dis",l:T("outer")},{id:"elbise",l:T("dress")}].map(f=>(
              <button key={f.id} onClick={()=>setWardFilter(f.id)} style={{background:wardFilter===f.id?"rgba(167,139,250,0.15)":"#2A2A35",border:`1px solid ${wardFilter===f.id?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.05)"}`,color:wardFilter===f.id?"#c4b5fd":"#9CA3AF",borderRadius:20,padding:"4px 10px",fontSize:10,cursor:"pointer",fontWeight:wardFilter===f.id?700:400}}>{f.l}</button>
            ))}
          </div>
        </div>
        {filtered.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:"#9CA3AF",fontSize:13}}>Bu kategoride kıyafet yok</div>}
        {filtered.map(item=>{
          const fc=CLOTH_FREQ[item.freqStatus]||CLOTH_FREQ.new;
          return(
            <div key={item.id} style={{background:"#1C1C26",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"10px 12px",display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{width:44,height:44,borderRadius:12,background:(item.color||"#a78bfa")+"25",border:`1px solid ${(item.color||"#a78bfa")}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <ClothingIcon type={catIconMap[item.cat]||"smart"} size={24} color={item.color||"#a78bfa"}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600}}>{item.name}</div>
                <div style={{fontSize:10,color:"#9CA3AF",marginTop:2}}>{T("timesWorn").replace("{0}",item.wornCount)} · {item.lastWorn}</div>
                <div style={{height:5,borderRadius:3,background:"#2A2A35",marginTop:5}}><div style={{height:"100%",borderRadius:3,width:`${item.freq}%`,background:item.freqStatus==="favorite"?"linear-gradient(90deg,#22c55e,#14b8a6)":item.freqStatus==="waiting"?"linear-gradient(90deg,#f59e0b,#ef4444)":"linear-gradient(90deg,#6366f1,#a78bfa)",transition:"width .6s"}}/></div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <div style={{background:fc.bg,border:`1px solid ${fc.border}`,color:fc.text,fontSize:10,padding:"2px 8px",borderRadius:20,whiteSpace:"nowrap"}}>{{favorite:T("freqFavorite"),frequent:T("freqFrequent"),waiting:T("freqWaiting"),new:T("freqNew")}[item.freqStatus]||fc.label}</div>
                <button onClick={()=>wearCloth(item.id)} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",color:"#a78bfa",fontSize:9,padding:"2px 8px",borderRadius:10,cursor:"pointer",whiteSpace:"nowrap"}}>{T("woreToday")}</button>
                <button onClick={()=>delCloth(item.id)} style={{background:"none",border:"none",color:"#444",fontSize:10,cursor:"pointer",padding:"2px 4px"}}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{height:20}}/>
      <button onClick={()=>setAddModal(true)} style={{position:"fixed",bottom:84,right:16,background:"linear-gradient(135deg,#6366f1,#a78bfa)",border:"none",borderRadius:18,padding:"12px 18px",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 20px rgba(99,102,241,0.5)",zIndex:100}}>
        <span style={{fontSize:18}}>+</span> Kıyafet Ekle
      </button>
      <Modal open={addModal} onClose={()=>setAddModal(false)} title={T("addClothing")}>
        <input style={inp} placeholder={T("clothingName")} value={addForm.name} onChange={e=>setAddForm({...addForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("categoryLabel")}</div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
          {CLOTH_CATS.map(c=>(<button key={c.id} onClick={()=>setAddForm({...addForm,cat:c.id})} style={{background:addForm.cat===c.id?`${c.color}25`:"#2A2A35",border:`1px solid ${addForm.cat===c.id?c.color+"60":"rgba(255,255,255,0.05)"}`,color:addForm.cat===c.id?c.color:"#777",borderRadius:10,padding:"6px 12px",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}><ClothingIcon type={c.svgType} size={14} color={addForm.cat===c.id?c.color:"#9CA3AF"}/>{c.label}</button>))}
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("clothColor")}</div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {PALETTE_COLS.map(p=>(<div key={p.hex} title={p.name} onClick={()=>setAddForm({...addForm,color:p.hex})} style={{width:30,height:30,borderRadius:8,background:p.hex,cursor:"pointer",outline:addForm.color===p.hex?"2.5px solid #a78bfa":"none",transform:addForm.color===p.hex?"scale(1.15)":"scale(1)",transition:"all .15s"}}/>))}
        </div>
        <button style={btnPrimary} onClick={addCloth}>{T("addToCloset")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ MEMORIES ROOM ═══════════ */
const DEFAULT_MEMORY_FOLDERS = [
  { id:"tatiller", name:"Tatiller", color:"#22c55e", icon:"T" },
  { id:"aile", name:"Aile", color:"#3b82f6", icon:"A" },
  { id:"arkadaslar", name:"Arkadaşlar", color:"#a855f7", icon:"Ar" },
];
const MOOD_LIST = [
  { id:"happy", label:"Mutlu", color:"#22c55e", symbol:"☺" },
  { id:"love", label:"Aşk", color:"#ec4899", symbol:"♥" },
  { id:"excited", label:"Heyecanlı", color:"#f59e0b", symbol:"★" },
  { id:"peaceful", label:"Huzurlu", color:"#06b6d4", symbol:"◉" },
  { id:"sad", label:"Üzgün", color:"#6366f1", symbol:"◎" },
  { id:"angry", label:"Kızgın", color:"#ef4444", symbol:"▲" },
  { id:"thoughtful", label:"Düşünceli", color:"#8b5cf6", symbol:"◆" },
  { id:"funny", label:"Komik", color:"#f97316", symbol:"✦" },
];

function resizeImage(file, maxSize=600) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w=img.width, h=img.height;
        if(w>maxSize||h>maxSize){
          if(w>h){h=Math.round(h*maxSize/w);w=maxSize;}
          else{w=Math.round(w*maxSize/h);h=maxSize;}
        }
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function MemoriesRoom({ data, update, onBack }) {
  const T = (key) => i18n(key, data);
  const memories = data?.memories || { folders: [...DEFAULT_MEMORY_FOLDERS], items: [] };
  const folders = memories.folders || [...DEFAULT_MEMORY_FOLDERS];
  const items = memories.items || [];

  const save = (newMem) => update({ ...data, memories: newMem });

  const [view, setView] = useState("folders"); // folders | list | detail
  const [activeFolder, setActiveFolder] = useState(null); // null = all
  const [activeItem, setActiveItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title:"", text:"", date:today(), mood:"", folder:"", tags:"", photos:[] });
  const [folderForm, setFolderForm] = useState({ name:"", color:"#22c55e", icon:"N" });
  const fileRef = useRef(null);

  const FOLDER_ICONS = ["T","A","Ar","Ok","İş","Mü","Ev","Gez","Dk","Pt","Sev","Sp"];

  const openFolder = (folderId) => { setActiveFolder(folderId); setView("list"); };
  const openAll = () => { setActiveFolder(null); setView("list"); };
  const openDetail = (item) => { setActiveItem(item); setView("detail"); };
  const goBack = () => {
    if(view==="detail"){ setView("list"); setActiveItem(null); }
    else if(view==="list"){ setView("folders"); setActiveFolder(null); }
    else onBack();
  };

  const filteredItems = (activeFolder
    ? items.filter(i=>i.folder===activeFolder)
    : items
  ).filter(i=> !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.text?.toLowerCase().includes(search.toLowerCase()))
   .sort((a,b)=>new Date(b.date||b.createdAt)-new Date(a.date||a.createdAt));

  const addPhoto = async (e) => {
    const files = Array.from(e.target.files||[]);
    if(!files.length) return;
    const resized = await Promise.all(files.slice(0,5).map(f=>resizeImage(f)));
    setForm(prev=>({...prev, photos:[...prev.photos,...resized].slice(0,8)}));
  };
  const removePhoto = (idx) => setForm(prev=>({...prev, photos:prev.photos.filter((_,i)=>i!==idx)}));

  const saveMemory = () => {
    if(!form.title.trim()) return;
    const entry = {
      id: editingId || uid(),
      title:form.title.trim(), text:form.text.trim(),
      date:form.date||today(), mood:form.mood, folder:form.folder,
      tags: form.tags ? form.tags.split(",").map(t=>t.trim()).filter(Boolean) : [],
      photos: form.photos,
      createdAt: editingId ? items.find(i=>i.id===editingId)?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newItems = editingId ? items.map(i=>i.id===editingId?entry:i) : [entry,...items];
    save({ ...memories, items:newItems });
    setShowAdd(false); setEditingId(null);
    setForm({ title:"", text:"", date:today(), mood:"", folder:activeFolder||"", tags:"", photos:[] });
  };

  const deleteMemory = (id) => {
    save({ ...memories, items:items.filter(i=>i.id!==id) });
    if(view==="detail") goBack();
  };

  const editMemory = (item) => {
    setEditingId(item.id);
    setForm({ title:item.title, text:item.text||"", date:item.date||"", mood:item.mood||"", folder:item.folder||"", tags:(item.tags||[]).join(", "), photos:item.photos||[] });
    setShowAdd(true);
  };

  const addFolder = () => {
    if(!folderForm.name.trim()) return;
    const f = { id:uid(), name:folderForm.name.trim(), color:folderForm.color, icon:folderForm.icon };
    save({ ...memories, folders:[...folders, f] });
    setShowFolderModal(false); setFolderForm({ name:"", color:"#22c55e", icon:"N" });
  };

  const deleteFolder = (folderId) => {
    save({ ...memories, folders:folders.filter(f=>f.id!==folderId), items:items.filter(i=>i.folder!==folderId) });
  };

  const folderInfo = (fId) => folders.find(f=>f.id===fId);
  const itemCountForFolder = (fId) => items.filter(i=>i.folder===fId).length;

  /* ── DETAIL VIEW ── */
  if(view==="detail" && activeItem) {
    const fi = folderInfo(activeItem.folder);
    return (
      <div className="room-enter">
        <StickyHeader>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button className="back-btn" onClick={goBack}>◀</button>
            <h3 style={{margin:0,fontSize:18,fontWeight:800,flex:1}}>{activeItem.title}</h3>
            <button onClick={()=>editMemory(activeItem)} style={{background:"rgba(59,130,246,0.15)",border:"none",color:"#3b82f6",width:34,height:34,borderRadius:10,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✎</button>
            <button onClick={()=>deleteMemory(activeItem.id)} style={{background:"rgba(239,68,68,0.1)",border:"none",color:"#ef4444",width:34,height:34,borderRadius:10,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
          </div>
        </StickyHeader>

        {/* Photos */}
        {activeItem.photos?.length>0&&(
          <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:6}}>
            {activeItem.photos.map((p,i)=>(
              <img key={i} src={p} alt="" style={{width:activeItem.photos.length===1?"100%":200,height:activeItem.photos.length===1?"auto":200,objectFit:"cover",borderRadius:16,flexShrink:0}}/>
            ))}
          </div>
        )}

        {/* Mood + date + folder */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          {activeItem.mood&&<span style={{fontSize:24}}>{activeItem.mood}</span>}
          <span style={{fontSize:12,color:"#9CA3AF"}}>{activeItem.date}</span>
          {fi&&<span style={{fontSize:11,background:`${fi.color}20`,color:fi.color,padding:"2px 10px",borderRadius:8}}>{fi.icon} {fi.name}</span>}
        </div>

        {/* Text */}
        {activeItem.text&&(
          <div style={{fontSize:15,lineHeight:1.7,color:"#F9FAFB",marginBottom:16,whiteSpace:"pre-wrap"}}>{activeItem.text}</div>
        )}

        {/* Tags */}
        {activeItem.tags?.length>0&&(
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {activeItem.tags.map(t=><span key={t} style={{background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"3px 10px",borderRadius:8,fontSize:11}}>#{t}</span>)}
          </div>
        )}
      </div>
    );
  }

  /* ── LIST VIEW ── */
  if(view==="list") {
    const fi = activeFolder ? folderInfo(activeFolder) : null;
    return (
      <div className="room-enter">
        <StickyHeader>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <button className="back-btn" onClick={goBack}>◀</button>
            {fi ? (
              <><span style={{fontSize:20}}>{fi.icon}</span>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:fi.color,flex:1}}>{fi.name}</h3></>
            ) : (
              <h3 style={{margin:0,fontSize:18,fontWeight:800,flex:1}}>{T("allMemories")}</h3>
            )}
            <span style={{fontSize:11,color:"#9CA3AF"}}>{filteredItems.length} {T("memoryCount")}</span>
          </div>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder={T("searchMemories")} style={{
            width:"100%",padding:"8px 12px",borderRadius:10,
            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",
            color:"#F9FAFB",fontSize:13,outline:"none",boxSizing:"border-box",
          }}/>
        </StickyHeader>

        {filteredItems.length===0?(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{marginBottom:12}}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.1)"/><circle cx="12" cy="13" r="4" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#22c55e" strokeWidth="1.5"/></svg>
            </div>
            <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:6}}>{T("noMemories")}</div>
            <div style={{fontSize:12,color:"#9CA3AF"}}>{T("addFirstMemory")}</div>
          </div>
        ):(
          filteredItems.map(item=>{
            const moodObj = MOOD_LIST.find(m=>m.symbol===item.mood);
            return (
              <div key={item.id} className="touch-card" onClick={()=>openDetail(item)} style={{
                ...cardStyle, display:"flex",gap:12,padding:0,overflow:"hidden",marginBottom:10,
                border:`1px solid ${moodObj?.color||"rgba(255,255,255,0.05)"}25`,
              }}>
                {/* Thumbnail */}
                {item.photos?.[0]?(
                  <div style={{width:80,height:80,flexShrink:0}}>
                    <img src={item.photos[0]} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  </div>
                ):(
                  <div style={{width:80,height:80,flexShrink:0,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>
                    {item.mood||<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="#9CA3AF" strokeWidth="1.5"/><line x1="8" y1="13" x2="16" y2="13" stroke="#9CA3AF" strokeWidth="1" opacity=".5"/><line x1="8" y1="17" x2="12" y2="17" stroke="#9CA3AF" strokeWidth="1" opacity=".5"/></svg>}
                  </div>
                )}
                <div style={{flex:1,padding:"10px 12px 10px 0",minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,marginBottom:3,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                  {item.text&&<div style={{fontSize:12,color:"#9CA3AF",marginBottom:4,
                    display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",lineHeight:1.4}}>{item.text}</div>}
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:10,color:"#9CA3AF"}}>{item.date}</span>
                    {item.photos?.length>1&&<span style={{fontSize:10,color:"#9CA3AF"}}>+{item.photos.length} foto</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}

        <FAB onClick={()=>{setEditingId(null);setForm({title:"",text:"",date:today(),mood:"",folder:activeFolder||"",tags:"",photos:[]});setShowAdd(true);}} color="#22c55e"/>

        {/* Add/Edit Memory Modal */}
        <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditingId(null);}} title={editingId?T("editMemory"):T("newMemory")}>
          <input style={inp} placeholder={T("memoryTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <textarea style={{...inp,minHeight:100,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}} placeholder={T("memoryText")} value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>

          {/* Date */}
          <input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>

          {/* Mood selector */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryMood")}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {MOOD_LIST.map(m=>(
                <button key={m.symbol} onClick={()=>setForm({...form,mood:form.mood===m.symbol?"":m.symbol})} style={{
                  padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,
                  background:form.mood===m.symbol?`${m.color}25`:"rgba(255,255,255,0.05)",
                  color:form.mood===m.symbol?m.color:"#9CA3AF",
                  border:form.mood===m.symbol?`1px solid ${m.color}40`:"1px solid transparent",
                }}>{m.symbol} {m.label}</button>
              ))}
            </div>
          </div>

          {/* Folder selector */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryFolder")}</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button onClick={()=>setForm({...form,folder:""})} style={{
                padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                background:!form.folder?"rgba(156,163,175,0.2)":"rgba(255,255,255,0.05)",
                color:!form.folder?"#F9FAFB":"#9CA3AF",
              }}>{T("noFolder")}</button>
              {folders.map(f=>(
                <button key={f.id} onClick={()=>setForm({...form,folder:f.id})} style={{
                  padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                  background:form.folder===f.id?`${f.color}25`:"rgba(255,255,255,0.05)",
                  color:form.folder===f.id?f.color:"#9CA3AF",
                }}>{f.icon} {f.name}</button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <input style={inp} placeholder="Etiketler (virgülle ayır)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>

          {/* Photos */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryPhotos")}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              {form.photos.map((p,i)=>(
                <div key={i} style={{position:"relative",width:72,height:72}}>
                  <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>
                  <button onClick={()=>removePhoto(i)} style={{
                    position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",
                    background:"#ef4444",color:"#fff",border:"none",fontSize:10,cursor:"pointer",
                    display:"flex",alignItems:"center",justifyContent:"center",
                  }}>✕</button>
                </div>
              ))}
              {form.photos.length<8&&(
                <button onClick={()=>fileRef.current?.click()} style={{
                  width:72,height:72,borderRadius:10,border:"2px dashed rgba(255,255,255,0.15)",
                  background:"rgba(255,255,255,0.03)",color:"#9CA3AF",cursor:"pointer",
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:10,
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/><circle cx="8.5" cy="10.5" r="2" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M3 16l4-4 3 3 4-5 7 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {T("addPhoto")}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhoto} style={{display:"none"}}/>
          </div>

          <button style={btnPrimary} onClick={saveMemory}>{T("save")}</button>
        </Modal>
      </div>
    );
  }

  /* ── FOLDERS VIEW (default) ── */
  return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" onClick={onBack}>◀</button>
          <span style={{fontSize:20}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="3" stroke="#22c55e" strokeWidth="1.5"/><circle cx="12" cy="13" r="4" stroke="#22c55e" strokeWidth="1.5"/><path d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" stroke="#22c55e" strokeWidth="1.5"/></svg>
          </span>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{T("memories")}</h3>
          <span style={{fontSize:11,color:"#9CA3AF"}}>{items.length} {T("memoryCount")}</span>
        </div>
      </StickyHeader>

      {/* All Memories button */}
      <div className="touch-card" onClick={openAll} style={{
        ...cardStyle,display:"flex",alignItems:"center",gap:14,marginBottom:16,
        background:"linear-gradient(135deg,rgba(34,197,94,0.1),rgba(34,197,94,0.03))",
        border:"1px solid rgba(34,197,94,0.2)",
      }}>
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(34,197,94,0.15)",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 7v12a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="#22c55e" strokeWidth="1.5" fill="rgba(34,197,94,0.15)"/></svg>
          </div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:700}}>{T("allMemories")}</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{items.length} {T("memoryCount")}</div>
        </div>
        <span style={{color:"#9CA3AF",fontSize:14}}>▶</span>
      </div>

      {/* Folder grid */}
      <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("folders")}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {folders.map(f=>(
          <div key={f.id} className="touch-card" onClick={()=>openFolder(f.id)} style={{
            background:`linear-gradient(145deg,${f.color}12,${f.color}05)`,
            borderRadius:18,padding:"18px 14px",cursor:"pointer",
            border:`1px solid ${f.color}30`,
            display:"flex",flexDirection:"column",alignItems:"center",gap:6,minHeight:100,justifyContent:"center",
          }}>
            <span style={{fontSize:28}}>{f.icon}</span>
            <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{f.name}</div>
            <div style={{fontSize:11,color:f.color}}>{itemCountForFolder(f.id)} {T("memoryCount")}</div>
          </div>
        ))}

        {/* Add folder card */}
        <div className="touch-card" onClick={()=>setShowFolderModal(true)} style={{
          background:"rgba(255,255,255,0.03)",borderRadius:18,padding:"18px 14px",
          cursor:"pointer",border:"2px dashed rgba(255,255,255,0.1)",
          display:"flex",flexDirection:"column",alignItems:"center",gap:6,minHeight:100,justifyContent:"center",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/></svg>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{T("newFolder")}</div>
        </div>
      </div>

      {/* Recent memories preview */}
      {items.length>0&&(
        <>
          <div style={{fontSize:12,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{T("timeline")}</div>
          {items.slice(0,4).map(item=>(
            <div key={item.id} className="touch-card" onClick={()=>{setActiveFolder(null);setView("list");setTimeout(()=>openDetail(item),50);}} style={{
              ...cardStyle,display:"flex",gap:10,padding:"10px 12px",marginBottom:6,
            }}>
              {item.photos?.[0]?(
                <img src={item.photos[0]} alt="" style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}}/>
              ):(
                <div style={{width:40,height:40,borderRadius:8,background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {item.mood ? <span style={{fontSize:16}}>{item.mood}</span> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M14 2v6h6" stroke="#9CA3AF" strokeWidth="1.5"/></svg>}
                </div>
              )}
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title}</div>
                <div style={{fontSize:11,color:"#9CA3AF"}}>{item.date}</div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* Add memory FAB */}
      <FAB onClick={()=>{setEditingId(null);setForm({title:"",text:"",date:today(),mood:"",folder:"",tags:"",photos:[]});setShowAdd(true);}} color="#22c55e"/>

      {/* New Folder Modal */}
      <Modal open={showFolderModal} onClose={()=>setShowFolderModal(false)} title={T("newFolder")}>
        <input style={inp} placeholder={T("folderName")} value={folderForm.name} onChange={e=>setFolderForm({...folderForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>Renk</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setFolderForm({...folderForm,color:c})} style={{
              width:32,height:32,borderRadius:10,background:c,border:folderForm.color===c?"3px solid #fff":"3px solid transparent",
              cursor:"pointer",
            }}/>
          ))}
        </div>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>İkon</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {FOLDER_ICONS.map(ic=>(
            <button key={ic} onClick={()=>setFolderForm({...folderForm,icon:ic})} style={{
              width:36,height:36,borderRadius:10,border:folderForm.icon===ic?"2px solid #22c55e":"2px solid rgba(255,255,255,0.1)",
              background:folderForm.icon===ic?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.05)",
              cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",
            }}>{ic}</button>
          ))}
        </div>
        <button style={btnPrimary} onClick={addFolder}>{T("add")}</button>
      </Modal>

      {/* Add Memory Modal (from folders view) */}
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditingId(null);}} title={editingId?T("editMemory"):T("newMemory")}>
        <input style={inp} placeholder={T("memoryTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:100,resize:"vertical",fontFamily:"inherit",lineHeight:1.6}} placeholder={T("memoryText")} value={form.text} onChange={e=>setForm({...form,text:e.target.value})}/>
        <input type="date" style={inp} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryMood")}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {MOOD_LIST.map(m=>(
              <button key={m.symbol} onClick={()=>setForm({...form,mood:form.mood===m.symbol?"":m.symbol})} style={{
                padding:"6px 12px",borderRadius:10,border:form.mood===m.symbol?`1px solid ${m.color}40`:"1px solid transparent",cursor:"pointer",fontSize:13,
                background:form.mood===m.symbol?`${m.color}25`:"rgba(255,255,255,0.05)",
                color:form.mood===m.symbol?m.color:"#9CA3AF",
              }}>{m.symbol} {m.label}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryFolder")}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {folders.map(f=>(
              <button key={f.id} onClick={()=>setForm({...form,folder:f.id})} style={{
                padding:"6px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,
                background:form.folder===f.id?`${f.color}25`:"rgba(255,255,255,0.05)",
                color:form.folder===f.id?f.color:"#9CA3AF",
              }}>{f.icon} {f.name}</button>
            ))}
          </div>
        </div>
        <input style={inp} placeholder="Etiketler (virgülle ayır)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>{T("memoryPhotos")}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
            {form.photos.map((p,i)=>(
              <div key={i} style={{position:"relative",width:72,height:72}}>
                <img src={p} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:10}}/>
                <button onClick={()=>removePhoto(i)} style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:"#ef4444",color:"#fff",border:"none",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
            ))}
            {form.photos.length<8&&(
              <button onClick={()=>fileRef.current?.click()} style={{width:72,height:72,borderRadius:10,border:"2px dashed rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.03)",color:"#9CA3AF",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,fontSize:10}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/><circle cx="8.5" cy="10.5" r="2" stroke="#9CA3AF" strokeWidth="1.5"/><path d="M3 16l4-4 3 3 4-5 7 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {T("addPhoto")}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhoto} style={{display:"none"}}/>
        </div>
        <button style={btnPrimary} onClick={saveMemory}>{T("save")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ TARZIM ═══════════ */
function Projects({ data, update, initialRoom, onRoomConsumed }) {
  const T = (key) => i18n(key, data);
  const [activeRoom,setActiveRoom]=useState(null);
  const [roomSubView,setRoomSubView]=useState(null);
  const [modal,setModal]=useState(false);
  const [roomModal,setRoomModal]=useState(false);
  const [itemModal,setItemModal]=useState(false);
  const [form,setForm]=useState({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  const [roomForm,setRoomForm]=useState({name:"",icon:"Pr",color:"#3b82f6"});
  const [itemForm,setItemForm]=useState({title:"",description:"",tags:""});
  const [exp,setExp]=useState(null);
  const [tf,setTf]=useState({title:""});

  // Dashboard'dan gelen oda yönlendirmesini yakala (format: "roomId" veya "roomId:subView")
  useEffect(() => {
    if (initialRoom) {
      const parts = initialRoom.split(":");
      setActiveRoom(parts[0]);
      setRoomSubView(parts[1] || null);
      onRoomConsumed?.();
    }
  }, [initialRoom]);

  // Oda değiştiğinde scroll sıfırla
  useEffect(() => {
    if (activeRoom) {
      const t = setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 80);
      return () => clearTimeout(t);
    }
  }, [activeRoom]);

  const rooms = migrateRooms(data.rooms);
  const roomItems = data.roomItems || {};

  const addRoom=()=>{
    if(!roomForm.name.trim())return;
    const nr={id:uid(),...roomForm,type:"collection"};
    update({...data,rooms:[...rooms,nr]});
    setRoomModal(false);setRoomForm({name:"",icon:"Pr",color:"#3b82f6"});
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
    update({...data,projects:[np,...(data.projects||[])]});
    setModal(false);setForm({name:"",status:"Planlama",description:"",deadline:"",tags:""});
  };
  const delProject=id=>update({...data,projects:(data.projects||[]).filter(p=>p.id!==id)});
  const upSt=(id,st)=>update({...data,projects:(data.projects||[]).map(p=>p.id===id?{...p,status:st}:p)});
  const addPT=pid=>{
    if(!tf.title.trim())return;
    update({...data,projects:(data.projects||[]).map(p=>p.id===pid?{...p,tasks:[...(p.tasks||[]),{id:uid(),title:tf.title,done:false}]}:p)});
    setTf({title:""});
  };
  const togPT=(pid,tid)=>{
    update({...data,projects:(data.projects||[]).map(p=>p.id===pid?{...p,tasks:(p.tasks||[]).map(t=>t.id===tid?{...t,done:!t.done}:t)}:p)});
  };
  const stCol=s=>s==="Tamamlandı"?"#22c55e":s==="Devam Ediyor"?"#3b82f6":s==="Test"?"#f59e0b":"#9CA3AF";
  const statusLabel=s=>({"Planlama":T("statPlanning"),"Devam Ediyor":T("statProgress"),"Test":T("statTest"),"Tamamlandı":T("statDone")}[s]||s);

  const roomIcons=["Pr","Hb","Mz","St","An","Oy","Kt","İş","Ev","Gz","Hd","Fk","Al","Fm","Yc"];

  /* Her oda için Unsplash fotoğrafı — koyu tema, konuyla uyumlu */
  const ROOM_IMAGES = {
    projects:    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=260&fit=crop&q=80",
    news:        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=260&fit=crop&q=80",
    music:       "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=260&fit=crop&q=80",
    clothes:     "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=260&fit=crop&q=80",
    memories:    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&h=260&fit=crop&q=80",
    healthcoach: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=260&fit=crop&q=80",
  };
  const getRoomImage = (room) => {
    if (room.photo) return room.photo;
    return ROOM_IMAGES[room.id] || null;
  };

  if(!activeRoom) return (
    <div>
      <StickyHeader>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("lifestyleTitle")}</h3>
        </div>
        <p style={{margin:"6px 0 0",fontSize:12,color:"#9CA3AF"}}>{T("lifestyleDesc")}</p>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12}}>
        {rooms.map((room,idx)=>{
          const count=room.type==="project"?(data.projects||[]).length:room.type==="health"?(data.sports||[]).length:(roomItems[room.id]||[]).length;
          const photo = getRoomImage(room);
          return (
            <div key={room.id} className={`touch-card stagger-${idx+1}`} onClick={()=>{setActiveRoom(room.id);setRoomSubView(null);}}
              style={{
                borderRadius:20,overflow:"hidden",cursor:"pointer",
                position:"relative",height:160,
                border:"0.5px solid rgba(255,255,255,0.12)",
                background:"#1C1C26",
              }}>
              {/* Fotoğraf arka plan */}
              {photo ? (
                <img src={photo} alt={room.name} loading="lazy"
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",display:"block"}}
                  onError={e=>{e.target.style.display="none";}}/>
              ) : (
                <div style={{position:"absolute",inset:0,background:`linear-gradient(135deg,${room.color}25 0%,#1C1C26 100%)`}}/>
              )}
              {/* Gradient overlay — alttan koyulaşma */}
              <div style={{
                position:"absolute",inset:0,
                background:"linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.75) 100%)",
              }}/>
              {/* İçerik — sol alt */}
              <div style={{
                position:"absolute",bottom:0,left:0,right:0,
                padding:"14px 16px",zIndex:1,
              }}>
                <div style={{fontSize:16,fontWeight:700,color:"#F9FAFB"}}>{roomLabel(room,data)}</div>
                <div style={{fontSize:12,color:room.color,fontWeight:600,marginTop:2}}>{count} {T("items")}</div>
              </div>
            </div>
          );
        })}
      </div>
      <FAB onClick={()=>setRoomModal(true)} color="#f97316"/>
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title={T("newRoom")}>
        <input style={inp} placeholder={T("roomName")} value={roomForm.name} onChange={e=>setRoomForm({...roomForm,name:e.target.value})} autoFocus/>
        <div style={{fontSize:12,color:"#9CA3AF",marginBottom:6}}>Renk seç:</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setRoomForm({...roomForm,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:roomForm.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={addRoom}>{T("create")}</button>
      </Modal>
    </div>
  );

  const room=rooms.find(r=>r.id===activeRoom);
  if(!room){setActiveRoom(null);return null;}

  if(room.type==="project"||activeRoom==="projects") return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={()=>setActiveRoom(null)}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:`${room.color}25`,border:`1px solid ${room.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:room.color,flexShrink:0}}>{roomLabel(room,data)[0]}</div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{roomLabel(room,data)}</h3>
        </div>
      </StickyHeader>
      {(data.projects||[]).length===0&&<p style={{textAlign:"center",color:"#9CA3AF",fontSize:14,padding:40}}>{T("noProjects")}</p>}
      {(data.projects||[]).map(p=>{
        const tasks=p.tasks||[];const d=tasks.filter(t=>t.done).length;
        const pct=tasks.length?Math.round(d/tasks.length*100):0;const open=exp===p.id;
        return (
          <div key={p.id} style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:8}}>
            <div onClick={()=>setExp(open?null:p.id)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:16,fontWeight:700}}>{p.name}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:4,display:"flex",gap:6,flexWrap:"wrap"}}>
                    {p.tags?.map(t=><span key={t} style={{background:"rgba(59,130,246,0.12)",color:"#3b82f6",padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
                    {p.deadline&&<span>◆ {p.deadline}</span>}
                  </div>
                </div>
                <span style={{fontSize:11,fontWeight:600,color:stCol(p.status),background:`${stCol(p.status)}20`,padding:"4px 10px",borderRadius:8}}>{statusLabel(p.status)}</span>
              </div>
              {tasks.length>0&&(<div style={{marginTop:10}}>
                <div style={{height:6,background:"#2A2A35",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",background:"#3b82f6",borderRadius:3,width:`${pct}%`,transition:"width .3s"}}/>
                </div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:4}}>{d}/{tasks.length} — %{pct}</div>
              </div>)}
            </div>
            {open&&(<div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              {p.description&&<p style={{fontSize:13,opacity:.6,margin:"0 0 10px"}}>{p.description}</p>}
              <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
                {PROJECT_STATUSES.map(s=>(<button key={s} onClick={()=>upSt(p.id,s)} style={{background:p.status===s?`${stCol(s)}20`:"#2A2A35",color:p.status===s?stCol(s):"#9CA3AF",border:`1px solid ${p.status===s?stCol(s)+"40":"rgba(255,255,255,0.05)"}`,padding:"7px 14px",borderRadius:8,fontSize:12,cursor:"pointer"}}>{statusLabel(s)}</button>))}
              </div>
              {tasks.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0"}}>
                <button onClick={()=>togPT(p.id,t.id)} style={checkBtnStyle(t.done)} aria-label={t.done?"Mark incomplete":"Mark complete"}>{t.done&&"✓"}</button>
                <span style={{fontSize:13,textDecoration:t.done?"line-through":"none",opacity:t.done?.4:1}}>{t.title}</span>
              </div>))}
              <div style={{display:"flex",gap:8,marginTop:10}}>
                <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("addSubtask")} value={tf.title} onChange={e=>setTf({title:e.target.value})} onKeyDown={e=>e.key==="Enter"&&addPT(p.id)}/>
                <button onClick={()=>addPT(p.id)} style={{background:"#3b82f6",color:"#fff",border:"none",borderRadius:10,padding:"0 18px",fontSize:18,cursor:"pointer"}}>+</button>
              </div>
              <button onClick={()=>delProject(p.id)} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px",width:"100%",marginTop:12,fontSize:13,cursor:"pointer"}}>{T("deleteProject")}</button>
            </div>)}
          </div>
        );
      })}
      <FAB onClick={()=>setModal(true)}/>
      <Modal open={modal} onClose={()=>setModal(false)} title={T("newProject")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("projectName")} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,name:t}))}/>
        </div>
        <div style={{height:10}}/>
        <input style={inp} placeholder={T("descField")} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
        <div style={{display:"flex",gap:8}}>
          <select style={{...inp,flex:1}} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{PROJECT_STATUSES.map(s=><option key={s} value={s}>{statusLabel(s)}</option>)}</select>
          <input style={{...inp,flex:1}} type="date" value={form.deadline} onChange={e=>setForm({...form,deadline:e.target.value})}/>
        </div>
        <input style={inp} placeholder={T("tagsField")} value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addProject}>{T("create")}</button>
      </Modal>
    </div>
  );

  const items=roomItems[activeRoom]||[];

  /* ── SPECIAL ROOM RENDERERS ── */
  if(activeRoom==="news" || room.type==="news") return <div className="room-enter"><NewsRoom room={room} onBack={()=>setActiveRoom(null)} data={data} update={update} /></div>;
  if(activeRoom==="music" || room.id==="music") return <div className="room-enter"><MusicRoom room={room} items={items} data={data} onBack={()=>setActiveRoom(null)} onAdd={(item)=>{const cur=roomItems[activeRoom]||[];update({...data,roomItems:{...roomItems,[activeRoom]:[item,...cur]}});}} onDel={(id)=>delItem(activeRoom,id)} /></div>;
  if(activeRoom==="clothes" || room.id==="clothes") return <div className="room-enter"><BenimStilimRoom data={data} update={update} onBack={()=>setActiveRoom(null)} /></div>;
  if(activeRoom==="memories" || room.id==="memories") return <div className="room-enter"><MemoriesRoom data={data} update={update} onBack={()=>setActiveRoom(null)} /></div>;
  if(activeRoom==="healthcoach" || room.type==="health") return (
    <div className="room-enter">
      <Sports data={data} update={update} initialView={roomSubView} onBack={()=>setActiveRoom(null)}/>
    </div>
  );

  return (
    <div className="room-enter">
      <StickyHeader>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button className="back-btn" aria-label="Go back" onClick={()=>setActiveRoom(null)}>◀</button>
          <div style={{width:28,height:28,borderRadius:8,background:`${room.color}25`,border:`1px solid ${room.color}50`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:room.color,flexShrink:0}}>{roomLabel(room,data)[0]}</div>
          <h3 style={{margin:0,fontSize:19,fontWeight:800,flex:1}}>{roomLabel(room,data)}</h3>
          <button onClick={()=>delRoom(activeRoom)} style={{background:"none",border:"none",color:"#ef4444",fontSize:11,cursor:"pointer"}}>{T("del")}</button>
        </div>
      </StickyHeader>
      {items.length===0&&(
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{margin:"0 auto 12px",display:"block",opacity:.3}}>
            <rect x="6" y="20" width="40" height="26" rx="3" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
            <path d="M6 26 L26 33 L46 26" stroke="#6B7280" strokeWidth="1.5"/>
            <path d="M18 20 L18 10 L34 10 L34 20" stroke="#6B7280" strokeWidth="1.5" fill="none"/>
            <path d="M20 15 L32 15" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" opacity=".5"/>
          </svg>
          <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:4}}>{T("roomEmpty")}</div>
          <div style={{fontSize:12,color:"#9CA3AF"}}>{T("addItemHint")}</div>
        </div>
      )}
      {items.map(item=>(
        <div key={item.id} style={{background:"#1C1C26",borderRadius:16,padding:14,marginBottom:8,borderLeft:`3px solid ${room.color}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600}}>{item.title}</div>
              {item.description&&<div style={{fontSize:12,color:"#9CA3AF",marginTop:4,lineHeight:1.4}}>{item.description}</div>}
              {item.tags?.length>0&&(<div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                {item.tags.map(t=><span key={t} style={{background:`${room.color}20`,color:room.color,padding:"1px 8px",borderRadius:6,fontSize:10}}>{t}</span>)}
              </div>)}
            </div>
            <button onClick={()=>delItem(activeRoom,item.id)} style={delBtnStyle} aria-label="Delete">✕</button>
          </div>
          <div style={{fontSize:10,opacity:.25,marginTop:6}}>{item.createdAt}</div>
        </div>
      ))}
      <FAB onClick={()=>setItemModal(true)} color={room.color}/>
      <Modal open={itemModal} onClose={()=>setItemModal(false)} title={`${room.icon} ${room.name} — Yeni Öğe`}>
        <input style={inp} placeholder={T("noteTitle")} value={itemForm.title} onChange={e=>setItemForm({...itemForm,title:e.target.value})} autoFocus/>
        <textarea style={{...inp,minHeight:80,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("descOpt")} value={itemForm.description} onChange={e=>setItemForm({...itemForm,description:e.target.value})}/>
        <input style={inp} placeholder={T("tagsField")} value={itemForm.tags} onChange={e=>setItemForm({...itemForm,tags:e.target.value})}/>
        <button style={btnPrimary} onClick={addItem}>{T("add")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ NOTES ═══════════ */
function Notes({ data, update }) {
  const T = (key) => i18n(key, data);
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
          <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("notes")}</h3>
          <span style={{fontSize:12,color:"#9CA3AF"}}>{data.notes.length} not</span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input
            style={{...inp,flex:1,marginBottom:0,background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)"}}
            placeholder={T("searchNotes")}
            value={search}
            onChange={e=>setSearch(e.target.value)}
          />
          <VoiceMic onResult={(t)=>setSearch(t)} color="#14b8a6" size={34}/>
        </div>
      </StickyHeader>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:10}}>
        {filtered.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"40px 20px"}}>
            <div style={{marginBottom:8}}><svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect x="8" y="4" width="24" height="32" rx="3" stroke="#9CA3AF" strokeWidth="1.5" fill="none"/><line x1="14" y1="12" x2="26" y2="12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/><line x1="14" y1="18" x2="26" y2="18" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" opacity=".6"/><line x1="14" y1="24" x2="22" y2="24" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/></svg></div>
            <div style={{fontSize:14,fontWeight:600,color:"#9CA3AF",marginBottom:4}}>{data.notes.length===0?T("noNotesYet"):T("noResult")}</div>
            {data.notes.length===0&&<div style={{fontSize:12,color:"#9CA3AF"}}>{T("addFirstNote")}</div>}
          </div>
        )}
        {filtered.map(n=>(
          <div key={n.id} onClick={()=>edit(n)} style={{...cardStyle,padding:14,cursor:"pointer",borderTop:`3px solid ${n.color||"#3b82f6"}`,minHeight:100,boxShadow:`0 0 20px ${n.color||"#3b82f6"}18`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start"}}>
              <h4 style={{margin:0,fontSize:14,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.title}</h4>
              <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{...delBtnStyle,fontSize:14,marginLeft:4}}>✕</button>
            </div>
            <p style={{fontSize:12,color:"#9CA3AF",margin:"8px 0 0",whiteSpace:"pre-wrap",maxHeight:70,overflow:"hidden",lineHeight:1.4}}>{n.content}</p>
            <div style={{fontSize:10,opacity:.25,marginTop:8}}>{n.updatedAt}</div>
          </div>
        ))}
      </div>
      <FAB onClick={()=>{setEditing(null);setForm({title:"",content:"",color:"#3b82f6"});setModal(true);}} color="#14b8a6"/>
      <Modal open={modal} onClose={()=>{setModal(false);setEditing(null);}} title={editing?T("editNote"):T("newNote")}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <input style={{...inp,flex:1,marginBottom:0}} placeholder={T("noteTitle")} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} autoFocus/>
          <VoiceMic onResult={(t)=>setForm(f=>({...f,title:t}))} color="#14b8a6"/>
        </div>
        <div style={{height:10}}/>
        <textarea style={{...inp,minHeight:140,resize:"vertical",fontFamily:"inherit",lineHeight:1.5}} placeholder={T("noteContent")} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setForm({...form,color:c})} style={{width:30,height:30,borderRadius:"50%",background:c,border:form.color===c?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
          ))}
        </div>
        <button style={btnPrimary} onClick={save2}>{editing?T("update"):T("save")}</button>
      </Modal>
    </div>
  );
}

/* ═══════════ TASKS HUB (Görevler + Takvim + Notlar) ═══════════ */
function TasksHub({ data, update, initialSubTab, onSubTabConsumed }) {
  const T = (key) => i18n(key, data);
  const [subTab, setSubTab] = useState("tasks");

  // Dashboard'dan gelen sub-tab yönlendirmesini yakala
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
      onSubTabConsumed?.();
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
      }, 80);
    }
  }, [initialSubTab]);
  return (
    <div>
      <div style={{
        display:"flex",gap:6,marginBottom:2,
        background:"rgba(13,13,18,0.92)",
        
        padding:"10px 4px 8px",
        borderRadius:14,
        position:"sticky",top:0,zIndex:60,
      }}>
        {[["tasks",T("tasks"),"✓"],["calendar",T("calendar"),"◫"],["notes",T("notes"),"☰"]].map(([k,v,icon])=>(
          <button key={k} className="nav-item" onClick={()=>setSubTab(k)} style={{
            flex:1,
            background:subTab===k?"rgba(59,130,246,0.15)":"#2A2A35",
            color:subTab===k?"#3b82f6":"#9CA3AF",
            border:subTab===k?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.05)",
            padding:"10px 4px",borderRadius:10,fontSize:12,fontWeight:subTab===k?700:500,
            cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,
          }}>
            <span style={{fontSize:16}}>{icon}</span>
            {v}
          </button>
        ))}
      </div>
      <div key={subTab} className="page-enter">
        {subTab==="tasks" && <Tasks data={data} update={update}/>}
        {subTab==="calendar" && <CalendarView data={data} update={update}/>}
        {subTab==="notes" && <Notes data={data} update={update}/>}
      </div>
    </div>
  );
}

/* ═══════════ SETTINGS ═══════════ */
function Settings({ data, update, onImport, user, onLogout }) {
  const fileRef = useRef(null);
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission());
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState("");

  const T = (key) => i18n(key, data);
  const curLang = data.settings?.language || "tr";
  const setLang = (lang) => update({...data, settings:{...data.settings, language:lang}});

  const enableNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
    if (granted) {
      update({ ...data, settings: { ...data.settings, notifications: true } });
    }
  };

  const handleExport = () => {
    exportData();
    setMsg(T("backupDownloaded"));
    setTimeout(() => setMsg(""), 2000);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const imported = await importData(file);
      onImport(imported);
      setMsg(T("dataImported"));
    } catch (err) {
      setMsg("Hata: " + err.message);
    }
    setImporting(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const clearAll = () => {
    if (confirm(T("deleteConfirm"))) {
      const empty = { tasks: [], events: [], sports: [], projects: [], notes: [], settings: data.settings };
      update(empty);
      setMsg(T("dataDeleted"));
      setTimeout(() => setMsg(""), 2000);
    }
  };

  const taskCount = data.tasks.length;
  const eventCount = data.events.length;
  const sportCount = data.sports.length;
  const projectCount = (data.projects||[]).length;
  const noteCount = data.notes.length;

  return (
    <div>
      <StickyHeader>
        <h3 style={{margin:0,fontSize:20,fontWeight:800}}>{T("settingsTitle")}</h3>
      </StickyHeader>

      {msg && <div style={{background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#3b82f6"}}>{msg}</div>}

      {/* Language selector */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>{T("language")}</h4>
        <div style={{display:"flex",gap:8}}>
          {[["tr","Türkçe"],["en","English"]].map(([code,label])=>(
            <button key={code} onClick={()=>setLang(code)} style={{
              flex:1,padding:"12px 8px",borderRadius:12,cursor:"pointer",
              fontSize:13,fontWeight:curLang===code?700:400,
              background:curLang===code?"rgba(59,130,246,0.15)":"#2A2A35",
              color:curLang===code?"#3b82f6":"#9CA3AF",
              border:curLang===code?"1px solid rgba(59,130,246,0.3)":"1px solid rgba(255,255,255,0.05)",
              transition:"all .2s",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* User info */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("account")}</h4>
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
                <div style={{fontSize:12,color:"#9CA3AF"}}>{user.email}</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:12,color:"#22c55e"}}>{T("cloudSync")}</span>
            </div>
            <p style={{fontSize:11,color:"#9CA3AF",margin:"0 0 12px"}}>{T("cloudSyncDesc")}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"rgba(239,68,68,0.15)",color:"#ef4444",border:"1px solid rgba(239,68,68,0.2)"}}>
              {T("logout")}
            </button>
          </div>
        ) : (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:12,color:"#f59e0b"}}>{T("guestMode")}</span>
            </div>
            <p style={{fontSize:11,color:"#9CA3AF",margin:"0 0 12px"}}>{T("localOnlyDesc")}</p>
            <button onClick={onLogout} style={{...btnPrimary,marginTop:0,background:"#3b82f6"}}>
              {T("loginTitle")} / {T("registerTitle")}
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("notifications")}</h4>
        {!isNotificationSupported() ? (
          <p style={{fontSize:13,color:"#9CA3AF"}}>Bu tarayıcı bildirimleri desteklemiyor</p>
        ) : notifStatus === "granted" ? (
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:13,color:"#22c55e"}}>{T("notifActive")}</span>
            </div>

            {/* Reminder time selector */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#9CA3AF",marginBottom:8}}>{T("reminderBefore")}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[5,10,15,30,60].map(m=>{
                  const active=(data.settings?.reminderMinutes||15)===m;
                  return <button key={m} onClick={()=>update({...data,settings:{...data.settings,reminderMinutes:m}})} style={{
                    padding:"8px 14px",borderRadius:10,cursor:"pointer",fontSize:12,fontWeight:active?700:400,
                    background:active?"rgba(34,197,94,0.15)":"#2A2A35",
                    color:active?"#22c55e":"#9CA3AF",
                    border:active?"1px solid rgba(34,197,94,0.3)":"1px solid rgba(255,255,255,0.05)",
                  }}>{m} {T("reminderMinLabel")}</button>;
                })}
              </div>
            </div>

            {/* Event reminders toggle */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#F9FAFB"}}>{T("eventReminders")}</div>
              </div>
              <button onClick={()=>update({...data,settings:{...data.settings,eventNotif:!(data.settings?.eventNotif!==false)}})} style={{
                width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                background:(data.settings?.eventNotif!==false)?"#22c55e":"#2A2A35",
                position:"relative",transition:"background .2s",
              }}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                  left:(data.settings?.eventNotif!==false)?23:3,transition:"left .2s"}}/>
              </button>
            </div>

            {/* Task reminders toggle */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#F9FAFB"}}>{T("taskReminders")}</div>
                <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{T("taskRemindDesc")}</div>
              </div>
              <button onClick={()=>update({...data,settings:{...data.settings,taskNotif:!(data.settings?.taskNotif!==false)}})} style={{
                width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                background:(data.settings?.taskNotif!==false)?"#22c55e":"#2A2A35",
                position:"relative",transition:"background .2s",
              }}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                  left:(data.settings?.taskNotif!==false)?23:3,transition:"left .2s"}}/>
              </button>
            </div>

            {/* Quiet hours */}
            <div style={{padding:"10px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#F9FAFB"}}>{T("quietHours")}</div>
                  <div style={{fontSize:11,color:"#9CA3AF",marginTop:2}}>{T("quietHoursDesc")}</div>
                </div>
                <button onClick={()=>update({...data,settings:{...data.settings,quietEnabled:!data.settings?.quietEnabled}})} style={{
                  width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",
                  background:data.settings?.quietEnabled?"#22c55e":"#2A2A35",
                  position:"relative",transition:"background .2s",
                }}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,
                    left:data.settings?.quietEnabled?23:3,transition:"left .2s"}}/>
                </button>
              </div>
              {data.settings?.quietEnabled&&(
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <input type="time" value={data.settings?.quietStart||"23:00"} onChange={e=>update({...data,settings:{...data.settings,quietStart:e.target.value}})}
                    style={{background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"6px 10px",color:"#F9FAFB",fontSize:13,flex:1}}/>
                  <span style={{color:"#9CA3AF",fontSize:12}}>—</span>
                  <input type="time" value={data.settings?.quietEnd||"08:00"} onChange={e=>update({...data,settings:{...data.settings,quietEnd:e.target.value}})}
                    style={{background:"#2A2A35",border:"1px solid rgba(255,255,255,0.05)",borderRadius:8,padding:"6px 10px",color:"#F9FAFB",fontSize:13,flex:1}}/>
                </div>
              )}
            </div>
          </div>
        ) : notifStatus === "denied" ? (
          <p style={{fontSize:13,color:"#ef4444"}}>{T("notifBlocked")}</p>
        ) : (
          <button onClick={enableNotif} style={{...btnPrimary,marginTop:0,background:"#22c55e"}}>{T("enableNotif")}</button>
        )}
      </div>

      {/* Data Stats */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("dataSummary")}</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[
            {l:T("task"),v:taskCount},{l:T("eventType"),v:eventCount},
            {l:T("sportRecord"),v:sportCount},{l:T("project"),v:projectCount},
            {l:T("note"),v:noteCount},{l:T("total"),v:taskCount+eventCount+sportCount+projectCount+noteCount},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{fontSize:13,opacity:.6}}>{s.l}</span>
              <span style={{fontSize:13,fontWeight:600}}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Import / Export */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>▸ {T("dataManagement")}</h4>
        <p style={{fontSize:12,color:"#9CA3AF",margin:"0 0 12px"}}>{T("dataDesc")}</p>
        <button onClick={handleExport} style={{...btnPrimary,marginTop:0,marginBottom:8,background:"#14b8a6"}}>
          ▸ {T("exportData")} (JSON)
        </button>
        <button onClick={()=>fileRef.current?.click()} disabled={importing} style={{...btnPrimary,marginTop:0,background:"#a855f7"}}>
          {importing ? "Aktarılıyor..." : "▸ Dosyadan Aktar (JSON)"}
        </button>
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:"none"}}/>
      </div>

      {/* AI Kalori Asistanı */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16,marginBottom:12}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700}}>AI Kalori Asistanı</h4>
        <p style={{fontSize:12,color:"#9CA3AF",margin:"0 0 12px"}}>Yemek fotoğrafı çekerek kalori hesaplatabilirsin. Kendi AI hesabını seç ve API anahtarını gir.</p>

        {/* Provider selection */}
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {[
            {id:"none",name:"Manuel Giriş",desc:"AI kullanma, kalorileri kendim girerim",icon:"✏️",color:"#9CA3AF"},
            {id:"gemini",name:"Google Gemini",desc:"Ücretsiz, günde 60 istek",icon:"✨",color:"#3b82f6"},
            {id:"claude",name:"Claude (Anthropic)",desc:"En akıllı analiz, ücretli",icon:"◈",color:"#a855f7"},
            {id:"openai",name:"OpenAI (ChatGPT)",desc:"Popüler, ücretli",icon:"◈",color:"#22c55e"},
          ].map(p=>{
            const selected = (data.settings?.aiProvider||"none")===p.id;
            return (
              <div key={p.id} onClick={()=>update({...data,settings:{...data.settings,aiProvider:p.id}})} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,cursor:"pointer",
                background:selected?`${p.color}15`:"rgba(255,255,255,0.02)",
                border:selected?`1px solid ${p.color}40`:"1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{fontSize:20}}>{p.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:selected?p.color:"#9CA3AF"}}>{p.name}</div>
                  <div style={{fontSize:10,color:"#9CA3AF"}}>{p.desc}</div>
                </div>
                {selected&&<span style={{color:p.color,fontSize:16}}>●</span>}
              </div>
            );
          })}
        </div>

        {/* API Key input */}
        {data.settings?.aiProvider && data.settings.aiProvider!=="none" && (<>
          <input style={inp} type="password" placeholder="API anahtarını yapıştır..."
            value={data.settings?.aiKey||""}
            onChange={e=>update({...data,settings:{...data.settings,aiKey:e.target.value}})}/>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
            {data.settings?.aiKey ? (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
              <span style={{fontSize:11,color:"#22c55e"}}>Anahtar kaydedildi</span></>
            ) : (
              <><span style={{width:8,height:8,borderRadius:"50%",background:"#f59e0b"}}/>
              <span style={{fontSize:11,color:"#f59e0b"}}>Anahtar gerekli</span></>
            )}
          </div>
          <div style={{fontSize:10,color:"#9CA3AF",marginBottom:10}}>● Anahtarın sadece senin telefonunda saklanır, sunucuya gönderilmez</div>

          {/* Guide button */}
          <button onClick={()=>setMsg(
            data.settings.aiProvider==="gemini" ?
              "GOOGLE GEMİNİ REHBERİ:\n\n1. aistudio.google.com/apikey adresine git\n2. Gmail ile giriş yap\n3. 'Create API Key' butonuna bas\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretsiz: Günde 60 istek, dakikada 15 istek\n● Gmail hesabın varsa 2 dakikada hazır!" :
            data.settings.aiProvider==="claude" ?
              "CLAUDE (ANTHROPİC) REHBERİ:\n\n1. console.anthropic.com adresine git\n2. Hesap oluştur (kredi kartı gerekli)\n3. API Keys → Create Key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretli: İlk $5 ücretsiz kredi\n● En detaylı analiz" :
              "OPENAİ (CHATGPT) REHBERİ:\n\n1. platform.openai.com adresine git\n2. Hesap oluştur veya giriş yap\n3. API Keys → Create new secret key\n4. Anahtarı kopyala ve yukarıya yapıştır\n\n● Ücretli: İlk $5 ücretsiz kredi\n● Popüler ve güvenilir"
          )} style={{
            width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(59,130,246,0.2)",
            background:"rgba(59,130,246,0.08)",color:"#3b82f6",fontSize:13,cursor:"pointer",fontWeight:600,
          }}>
            ▸ {data.settings.aiProvider==="gemini"?"Gemini":data.settings.aiProvider==="claude"?"Claude":"OpenAI"} API Anahtarı Nasıl Alınır?
          </button>
        </>)}
      </div>

      {/* Danger zone */}
      <div style={{background:"#1C1C26",borderRadius:14,padding:16}}>
        <h4 style={{margin:"0 0 12px",fontSize:15,fontWeight:700,color:"#ef4444"}}>⚠️ {T("dangerZone")}</h4>
        <button onClick={clearAll} style={{...btnPrimary,marginTop:0,background:"#ef4444"}}>
          {T("deleteAll")}
        </button>
      </div>
    </div>
  );
}

/* ═══════════ LOGIN SCREEN ═══════════ */
/* ── Nebula background shared by splash + login ── */
const NEBULA_STARS = Array.from({length:28},(_,i)=>({
  id:i,
  size: i%5===0?3:i%3===0?2:1.5,
  color: i%3===0?"#a78bfa":i%3===1?"#6366f1":"#c4b5fd",
  left: 4+((i*37)%92),
  top: 3+((i*53)%94),
  dur: 2.5+((i*17)%30)/10,
  delay: ((i*23)%30)/10,
  twinkle: i%4===0,
}));

const NEBULA_KEYFRAMES = `
  @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes starFloat {
    0%,100%{transform:translateY(0) scale(1);opacity:.7}
    50%{transform:translateY(-8px) scale(1.3);opacity:1}
  }
  @keyframes starTwinkle {
    0%,100%{opacity:.3;transform:scale(.8)}
    50%{opacity:1;transform:scale(1.4)}
  }
  @keyframes nebulaOrb1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-18px) scale(1.08)} }
  @keyframes nebulaOrb2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,22px) scale(1.05)} }
  @keyframes nebulaOrb3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(12px,16px) scale(1.06)} }
  @keyframes zimuGlow  { 0%,100%{filter:drop-shadow(0 0 18px rgba(167,139,250,.45))} 50%{filter:drop-shadow(0 0 36px rgba(167,139,250,.85))} }
  @keyframes lineExpand { from{width:0;opacity:0} to{width:100%;opacity:1} }
  @keyframes shimmer   { 0%,100%{opacity:.45} 50%{opacity:.9} }
  @keyframes tapBlink  { 0%,100%{opacity:.25} 50%{opacity:.55} }
  @keyframes glassIn   { from{opacity:0;transform:translateY(30px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
`;

function NebulaBackground({ children, style }) {
  return (
    <div style={{
      minHeight:"100dvh", background:"#08071a",
      display:"flex", alignItems:"center", justifyContent:"center",
      color:"#F9FAFB", fontFamily:"'SF Pro Display',-apple-system,sans-serif",
      position:"relative", overflow:"hidden", ...style,
    }}>
      {/* Orbs */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",width:420,height:420,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)",
          top:"-120px",left:"-80px",animation:"nebulaOrb1 14s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:340,height:340,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(167,139,250,0.14) 0%,transparent 70%)",
          bottom:"5%",right:"-60px",animation:"nebulaOrb2 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",
          background:"radial-gradient(circle,rgba(139,92,246,0.10) 0%,transparent 70%)",
          top:"40%",left:"50%",animation:"nebulaOrb3 22s ease-in-out infinite"}}/>
      </div>
      {/* Stars */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",zIndex:0}}>
        {NEBULA_STARS.map(s=>(
          <div key={s.id} style={{
            position:"absolute",
            width:s.size,height:s.size,borderRadius:"50%",
            background:s.color,
            boxShadow:`0 0 ${s.size*3}px ${s.color}`,
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

function LoginScreen({ onLogin }) {
  // Login ekranında data yok, localStorage'dan dil oku
  const loginLang = (() => { try { const d = JSON.parse(localStorage.getItem("zimu-data")||"{}"); return d?.settings?.language || "tr"; } catch { return "tr"; } })();
  const T = (key) => (TRANSLATIONS[loginLang] || TRANSLATIONS.tr)[key] || TRANSLATIONS.tr[key] || key;
  const [mode, setMode] = useState("login");
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
    if (!email.trim() || !password.trim()) { setError(T("emailRequired")); return; }
    setLoading(true); setError("");
    const fn = mode === "register" ? registerWithEmail : signInWithEmail;
    const { user, error } = await fn(email, password);
    if (error) setError(error);
    setLoading(false);
  };

  const handleSkip = () => { onLogin(null); };

  const glassInp = {
    width:"100%",
    background:"#2A2A35",
    backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",
    border:"1px solid rgba(167,139,250,0.18)",
    borderRadius:14,padding:"13px 16px",color:"#F9FAFB",fontSize:15,
    marginBottom:10,outline:"none",boxSizing:"border-box",
    transition:"border-color .2s",
  };

  return (
    <NebulaBackground>
      <style>{NEBULA_KEYFRAMES}</style>
      <div style={{
        width:"100%",maxWidth:380,margin:"0 auto",padding:"24px 20px",
        animation:"fadeInUp .7s ease both",
      }}>
        {/* Title */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{
            fontSize:62,fontWeight:900,letterSpacing:-3,lineHeight:1,
            background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 35%,#6366f1 65%,#818cf8 100%)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
            animation:"zimuGlow 4s ease-in-out infinite",
            display:"inline-block",
          }}>Zimu</div>

          {/* Decorative line */}
          <div style={{
            height:1,margin:"14px auto 16px",
            background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.6),transparent)",
            animation:"lineExpand 1s ease .3s both",
          }}/>

          <div style={{fontSize:15,fontStyle:"italic",opacity:.7,lineHeight:1.7,letterSpacing:.3}}>
            Kendi destanını yaz.
          </div>
          <div style={{fontSize:13,fontStyle:"italic",color:"#9CA3AF",marginTop:2,letterSpacing:.2}}>
            Write your own epic.
          </div>
        </div>

        {/* Glass card */}
        <div style={{
          background:"#1C1C26",
          backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
          border:"1px solid rgba(167,139,250,0.15)",
          borderRadius:24,padding:"26px 22px",
          boxShadow:"0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation:"glassIn .8s ease .2s both",
        }}>
          {error && (
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",
              borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#f87171",textAlign:"center"}}>
              {error}
            </div>
          )}

          {/* Google */}
          <button onClick={handleGoogle} disabled={loading} style={{
            width:"100%",padding:"14px",borderRadius:14,
            border:"1px solid rgba(167,139,250,0.25)",
            background:"rgba(99,102,241,0.08)",
            color:"#F9FAFB",fontSize:15,fontWeight:600,cursor:"pointer",
            display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:18,
            opacity:loading?.6:1,transition:"all .2s",
            backdropFilter:"blur(8px)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {T("googleLogin")}
          </button>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
            <div style={{flex:1,height:1,background:"#2A2A35"}}/>
            <span style={{fontSize:12,color:"#9CA3AF",letterSpacing:.5}}>{T("orDivider")}</span>
            <div style={{flex:1,height:1,background:"#2A2A35"}}/>
          </div>

          <input type="email" placeholder={T("emailPlaceholder")} value={email}
            onChange={e=>setEmail(e.target.value)}
            style={glassInp} />
          <input type="password" placeholder={T("passwordPlaceholder")} value={password}
            onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&handleEmail()}
            style={glassInp} />

          <button onClick={handleEmail} disabled={loading} style={{
            width:"100%",
            background:"linear-gradient(135deg,#6366f1,#a78bfa)",
            color:"#fff",border:"none",borderRadius:14,
            padding:"14px",cursor:"pointer",fontSize:15,fontWeight:700,marginTop:4,
            boxShadow:"0 4px 24px rgba(99,102,241,0.45)",
            opacity:loading?.6:1,transition:"all .2s",letterSpacing:.3,
          }}>
            {loading ? T("waitLogin") : mode === "register" ? T("registerTitle") : T("loginTitle")}
          </button>

          <div style={{textAlign:"center",marginTop:16}}>
            <button onClick={()=>{setMode(mode==="login"?"register":"login");setError("");}} style={{
              background:"none",border:"none",color:"#a78bfa",fontSize:13,cursor:"pointer",opacity:.8,
            }}>
              {mode === "login" ? T("noAccount") : T("hasAccount")}
            </button>
          </div>
        </div>

        {/* Skip */}
        <div style={{textAlign:"center",marginTop:20}}>
          <button onClick={handleSkip} style={{
            background:"none",border:"none",color:"#9CA3AF",fontSize:12,cursor:"pointer",
          }}>
            {T("skipLogin")}
          </button>
          <div style={{fontSize:10,opacity:.25,marginTop:4}}>{T("localOnly")}</div>
        </div>
      </div>
    </NebulaBackground>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [pendingRoom, setPendingRoom] = useState(null);
  const [pendingSubTab, setPendingSubTab] = useState(null);
  const [data, setData] = useState(null);

  // Navigate to a tab, optionally opening a specific room or sub-tab
  const goTo = useCallback((tabId, roomOrSubTab) => {
    if (tabId === "lifestyle") {
      setPendingRoom(roomOrSubTab || null);
      setPendingSubTab(null);
    } else if (tabId === "tasks" && roomOrSubTab) {
      setPendingSubTab(roomOrSubTab);
      setPendingRoom(null);
    } else {
      setPendingRoom(null);
      setPendingSubTab(null);
    }
    setTab(tabId);
    // Render sonrası scroll sıfırla
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
  }, []);
  const [loading, setLoading] = useState(true);
  const [splash, setSplash] = useState(true);
  const [user, setUser] = useState(undefined);
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const isMobile = useIsMobile();
  const touchStart = useRef(null);
  const touchEnd = useRef(null);
  const scrollRef = useRef(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        const skipped = localStorage.getItem('zimu-skip-login');
        if (skipped) {
          setUser(null);
        } else {
          setUser(undefined);
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load data when user is determined
  useEffect(() => {
    if (user === undefined) return;
    const userId = user?.uid || null;
    loadData(userId).then(d => { setData(d); setLoading(false); });
  }, [user]);

  // Splash screen — 2.5s, sonra zorla geç
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Firebase 6 saniyede cevap vermezse zorla login göster
  useEffect(() => {
    const fallback = setTimeout(() => {
      setLoading(false);
    }, 6000);
    return () => clearTimeout(fallback);
  }, []);

  // Schedule notifications (respects settings)
  useEffect(() => {
    if (!data) return;
    if (getNotificationPermission() !== "granted") return;
    const s = data.settings || {};

    // Check quiet hours
    if (s.quietEnabled) {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
      const start = s.quietStart || "23:00";
      const end = s.quietEnd || "08:00";
      const inQuiet = start < end
        ? (hhmm >= start && hhmm < end)
        : (hhmm >= start || hhmm < end);
      if (inQuiet) return; // skip all notifications during quiet hours
    }

    if (s.eventNotif !== false) {
      scheduleEventReminders(data.events, s.reminderMinutes || 15);
    }
    if (s.taskNotif !== false) {
      scheduleTaskReminders(data.tasks);
    }
  }, [data?.events, data?.tasks, data?.settings]);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // React render'ı bekle, bir daha sıfırla
    const t = setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 100);
    return () => clearTimeout(t);
  }, [tab]);

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
      setUser(null);
    }
  };

  const handleLogout = async () => {
    await logOut();
    localStorage.removeItem('zimu-skip-login');
    setUser(undefined);
    setData(null);
  };

  const T = (key) => i18n(key, data);
  const allTabs = [...TABS_KEYS.map(tb=>({...tb, label: T(tb.labelKey)})), { id: "settings", label: T("settings"), icon: "⚙" }];

  // Show login screen (after splash, when not authenticated)
  if (!splash && user === undefined && !loading) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (splash || loading || !data) return (
    <NebulaBackground style={{cursor:"pointer",userSelect:"none",flexDirection:"column"}}
      onClick={() => {
        setSplash(false);
        setLoading(false);
        if (!data) {
          loadData(null).then(d => setData(d)).catch(() => {
            import("./db.js").then(m => setData(m.getDefaultData ? m.getDefaultData() : {tasks:[],events:[],sports:[],projects:[],notes:[],foods:[],rooms:[],roomItems:{},settings:{},dailyThoughts:["","",""]}));
          });
        }
      }}>
      <style>{`
        ${NEBULA_KEYFRAMES}
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>

      {/* Center content */}
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        textAlign:"center",
        width:"100%",maxWidth:400,padding:"0 40px",minHeight:"100dvh",margin:"0 auto",
        animation:"fadeIn .6s ease both",
      }}>
        {/* Zimu title */}
        <div style={{
          fontSize:72,fontWeight:900,letterSpacing:-4,lineHeight:1,
          background:"linear-gradient(135deg,#e0d5f5 0%,#a78bfa 30%,#6366f1 60%,#818cf8 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          animation:"zimuGlow 4s ease-in-out infinite",
          display:"inline-block",marginBottom:16,
        }}>Zimu</div>

        {/* Decorative line */}
        <div style={{
          height:1,width:"60%",marginBottom:20,margin:"0 auto 20px",
          background:"linear-gradient(90deg,transparent,rgba(167,139,250,0.7),transparent)",
          animation:"lineExpand 1s ease .2s both",
        }}/>

        {/* Tagline */}
        <div style={{
          fontSize:17,fontStyle:"italic",
          color:"rgba(196,181,253,0.85)",
          letterSpacing:.4,lineHeight:1.6,
          animation:"fadeInUp .8s ease .4s both",
        }}>
          Kendi destanını yaz.
        </div>
        <div style={{
          fontSize:14,fontStyle:"italic",
          color:"rgba(167,139,250,0.45)",
          letterSpacing:.3,marginTop:4,
          animation:"fadeInUp .8s ease .55s both",
        }}>
          Write your own epic.
        </div>
      </div>

      {/* Bottom tap hint */}
      <div style={{
        position:"absolute",bottom:44,left:0,right:0,
        textAlign:"center",
        fontSize:13,color:"rgba(196,181,253,0.45)",
        letterSpacing:.5,
        animation:"tapBlink 2.5s ease-in-out infinite",
      }}>
        {T("tapToContinue")}
      </div>
    </NebulaBackground>
  );

  const content = () => {
    switch(tab) {
      case "dashboard": return <Dashboard data={data} setTab={setTab} goTo={goTo} update={update}/>;
      case "tasks": return <TasksHub data={data} update={update} initialSubTab={pendingSubTab} onSubTabConsumed={()=>setPendingSubTab(null)}/>;
      case "lifestyle": return <Projects data={data} update={update} initialRoom={pendingRoom} onRoomConsumed={()=>setPendingRoom(null)}/>;
      case "settings": return <Settings data={data} update={update} onImport={d=>{setData(d);showToast(T("dataImported"))}} user={user} onLogout={handleLogout}/>;
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
    <div lang={T("locale").split("-")[0]} style={{
      width:"100%",
      minHeight:isMobile?"100dvh":"100vh",
      background:"#0D0D12",color:"#F9FAFB",
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
      <main
        ref={isMobile?null:scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
        style={{
          padding:`16px ${isMobile?"20px":"clamp(20px, 5vw, 60px)"} ${CONTENT_PAD_BOTTOM}px`,
          minHeight: isMobile ? "100dvh" : "100vh",
          maxWidth: isMobile ? undefined : 800,
          margin: isMobile ? undefined : "0 auto",
          touchAction: "pan-y",
        }}
      >
        <div key={tab} className="page-enter">
          {content()}
        </div>
      </main>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button onClick={scrollToTop} aria-label="Scroll to top" style={{
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

      {/* Voice Command FAB */}
      {data && <VoiceCommand data={data} update={update} goTo={goTo} showToast={showToast}/>}

      {/* Bottom nav bar */}
      <nav aria-label="Main navigation" style={{
        position:"fixed",
        bottom:0,
        left:0,right:0,
        background:"rgba(13,13,18,0.95)",
        backdropFilter:"blur(24px) saturate(180%)",
        WebkitBackdropFilter:"blur(24px) saturate(180%)",
        borderTop:"1px solid rgba(255,255,255,0.05)",
        display:"flex",justifyContent:"center",alignItems:"center",
        height:NAV_HEIGHT,
        paddingTop:4,
        paddingBottom:isMobile?"env(safe-area-inset-bottom, 8px)":"6px",
        paddingLeft:4,paddingRight:4,
        zIndex:1000,
      }}>
        <div style={{display:"flex",justifyContent:"space-around",alignItems:"center",width:"100%",maxWidth:isMobile?undefined:600}}>
        {allTabs.map(t=>(
          <button key={t.id} className="nav-item" onClick={()=>setTab(t.id)} aria-current={tab===t.id?"page":undefined} aria-label={t.label} style={{
            background:tab===t.id?"rgba(59,130,246,0.15)":"none",
            boxShadow:tab===t.id?"0 0 20px rgba(59,130,246,0.25)":undefined,
            border:"none",cursor:"pointer",
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            gap:isMobile?4:3,
            padding:isMobile?"10px 6px":"8px 12px",
            minWidth:isMobile?52:50,
            borderRadius:14,
            color:tab===t.id?"#3b82f6":"#9CA3AF",
            flex:1,
          }}>
            <span style={{fontSize:isMobile?22:18,lineHeight:1}}>{t.icon}</span>
            <span style={{fontSize:isMobile?10:9,fontWeight:tab===t.id?700:500,letterSpacing:-.2}}>{t.label}</span>
          </button>
        ))}
        </div>
      </nav>
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

        /* ── PAGE TRANSITIONS ── */
        @keyframes pageFadeIn { 
          from { opacity:0 } 
          to { opacity:1 } 
        }
        @keyframes slideInRight { 
          from { opacity:0 } 
          to { opacity:1 } 
        }
        @keyframes slideOutRight { 
          from { opacity:1 } 
          to { opacity:0 } 
        }
        
        /* ── STAGGERED CARD ANIMATIONS ── */
        @keyframes cardStagger { 
          from { opacity:0; transform:translateY(18px) scale(0.97) } 
          to { opacity:1; transform:translateY(0) scale(1) } 
        }
        .stagger-1 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .05s both }
        .stagger-2 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .1s both }
        .stagger-3 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .15s both }
        .stagger-4 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .2s both }
        .stagger-5 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .25s both }
        .stagger-6 { animation: cardStagger .3s cubic-bezier(.22,1,.36,1) .3s both }

        /* ── PAGE WRAPPER ── */
        .page-enter { animation: pageFadeIn .28s cubic-bezier(.22,1,.36,1) both }
        .room-enter { animation: slideInRight .3s cubic-bezier(.22,1,.36,1) both }

        /* ── INTERACTIVE CARD ── */
        .touch-card {
          transition: transform .15s cubic-bezier(.22,1,.36,1), box-shadow .2s ease;
          cursor: pointer;
          -webkit-user-select: none;
          user-select: none;
        }
        .touch-card:active {
          transform: scale(0.97) !important;
        }

        /* ── BACK BUTTON ── */
        .back-btn {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: 1px solid rgba(255,255,255,0.1);
          color: #ccc;
          width: 36px; height: 36px;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background .15s, transform .1s;
        }
        .back-btn:active { transform: scale(0.9); background: rgba(255,255,255,0.15); }

        /* ── MODAL TRANSITIONS ── */
        @keyframes modalOverlayIn { from { opacity:0 } to { opacity:1 } }
        @keyframes modalSlideUp { from { transform:translateY(100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        @keyframes voiceWave { from { height:8px } to { height:32px } }

        /* ── BOTTOM NAV TRANSITION ── */
        .nav-item {
          transition: all .2s cubic-bezier(.22,1,.36,1);
        }
        .nav-item:active {
          transform: scale(0.88);
        }

        .task-check-done { animation: checkPop .3s ease; }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12);border-radius:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:invert(0.7); }
        html, body { margin:0; padding:0; overscroll-behavior:none; background:#0D0D12; overflow:auto; height:auto; }
        #root { height:auto; }
        select option { background:#1C1C26; color:#F9FAFB; }
        @media(display-mode:standalone){ 
          html, body { background:#0D0D12; overflow:auto; height:auto; }
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
