import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const SUPPORTED_LANGS = ["en", "hi", "te", "ta", "kn"];

function getInitialLanguage() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("airaware-language");
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  }

  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language?.split("-")[0];
    if (browserLang && SUPPORTED_LANGS.includes(browserLang)) return browserLang;
  }

  return "en";
}

const resources = {
  en: {
    translation: {
      nav: {
        airQuality: "Air\nQuality", forecast: "Forecast", routePlanner: "Route\nPlanner", myExposure: "My\nExposure", profileAlerts: "Profile &\nAlerts",
        brandName: "AirAware", brandSub: "India", live: "LIVE IND:", signOut: "Sign Out", guestExplorer: "Guest Explorer",
        dark: "Dark", light: "Light"
      },
      app: {
        demoAlert: "Delhi AQI is 284, above your alert threshold of 170. (Very Unhealthy)",
        useLive: "Use your live location?",
        shareGps: "Share your GPS location to see real-time AQI and personalized health alerts for exactly where you are.",
        allowLoc: "Allow Location"
      },
      dashboard: { 
        title: "Air Quality Dashboard",
        search: "Search Indian cities (e.g. Delhi, Mumbai, Bengaluru)...",
        cities: "Cities:",
        active: "Active",
        localTime: "Local time",
        interactiveDir: "Interactive Directory",
        exploreCoords: "Explore City Coordinates",
        lat: "Lat", lng: "Lng",
        mainStats: "Main Statistics",
        dominant: "Dominant",
        temp: "Temp",
        iqMap: "IQ AIR MAP",
        hybrid: "HYBRID VIEW",
        recenter: "RECENTER",
        zoom: "ZOOM"
      },
      forecast: {
        title: "Air Quality Forecast", subtitle: "Next 24 Hours", btnRun: "Run Forecast",
        cityName: "City name", selectStation: "Select station…", loadStation: "Load Station",
        peakIn: "Peak in", forecasting: "Forecasting…", in6h: "IN 6H", range: "Range", selectCityPrompt: "Select a city & station, then click Run Forecast to generate the 24-hour chart."
      },
      route: {
        title: "Route Planner & Exposure", plan: "Plan Route", source: "SOURCE", dest: "DESTINATION", depart: "DEPART AT",
        btnGet: "Get Route AQI Forecast", selectCity: "Select city…", eval: "Evaluating…", clear: "Clear",
        summary: "Route Summary", distance: "Distance", travelTime: "Travel Time", avgAqi: "Avg AQI Exposure", score: "Clean-air Score"
      },
      exposure: {
        title: "Personal Exposure History", timeline: "Your Exposure Timeline", clear: "Clear History", noHistory: "No exposure history recorded yet."
      },
      alerts: {
        healthProfile: "Health Profile", sensitivity: "Your Sensitivity Settings", notifPrefs: "Notification Preferences", delivery: "Delivery Channels",
        ageGroup: "Age Group", preExisting: "Pre-existing Conditions", alertMeWhen: "Alert me when AQI exceeds:", saveProfile: "Save Health Profile",
        stationAlerts: "Station Alerts", stationId: "Station ID (e.g. delhi-anand-vihar)", add: "Add", remove: "Remove",
        browserPush: "Browser push notifications", browserPushSub: "Enabled for this browser.", emailAlerts: "Enable Email Alerts",
        onlyBreach: "Only alert when AQI breaches my threshold", currentThresh: "Current threshold:", alertsFireFor: "Alerts fire for:", noCond: "No conditions selected",
        child: "Child (0-12)", adult: "Adult (20-60)", elderly: "Elderly", asthma: "Asthma / respiratory condition", heart: "Heart or cardiovascular condition", pregnant: "Pregnant",
        elderly65: "Elderly (65+)", youngChild: "Young child in household", cautious: "Cautious", extreme: "Only extreme", saved: "✓ Saved!"
      },
      landing: {
        knowAir: "Know the air before you breathe it.",
        fuses: "AirAware fuses sensor networks, weather data and machine learning to forecast pollution block-by-block — then reroutes you around it and warns you before exposure, not after.",
        reqDemo: "Request a demo", seeHow: "See how it works",
        forecast72: "72hr forecast horizon", err8: "±8% PM2.5 model error", res150: "150m grid resolution",
        sense: "Sense → Predict → Protect",
        threeStages: "Three stages, running continuously",
        eachStage: "Each stage feeds the next in a live loop — the model never stops learning from what actually happened versus what it forecast.",
        step1Title: "Ingest ground truth", step1Desc: "Low-cost sensor grids, government monitoring stations, satellite AOD readings and live traffic density are pulled in every few minutes and cross-calibrated against each other.",
        step2Title: "Forecast the next 72 hours", step2Desc: "A spatiotemporal model — trained on meteorology, emissions and historical pollution drift — projects PM2.5, PM10, NO₂ and ozone at 150m resolution across the city.",
        step3Title: "Alert and reroute", step3Desc: "Alerts are scored against each user's own sensitivity profile, and the routing engine scores every path option by cumulative exposure, not just distance or time.",
        alertsTuned: "Alerts tuned to your body, not the city average", alertsTunedDesc: "A citywide AQI number means little if you have asthma, are pregnant, or run outdoors at 6am. AirAware weighs forecasts against a personal sensitivity profile before it ever pings you.",
        routesOpt: "Routes optimized for what you breathe, not just how fast you get there", routesOptDesc: "The routing engine treats pollution exposure as a real cost function alongside time and distance — so you can choose the trade-off that fits you.",
        statsSensor: "sensor readings processed daily", statsGrid: "forecast grid resolution", statsRolling: "rolling prediction horizon", statsError: "mean absolute error, PM2.5",
        underHood: "Under the hood", pipeline: "A pipeline built for a moving target", airDoesnt: "Air quality doesn't sit still — the system is built as a continuous loop, not a one-off report.",
        getStarted: "Get started", givePeople: "Give people a reason to trust the air again.", bringAir: "Bring AirAware's forecasting and routing engine to your city, campus or app.",
        readTech: "Read the technical brief", product: "PRODUCT", project: "PROJECT", contact: "CONTACT",
        features: "Features", architecture: "Architecture", techBrief: "Technical brief", dataset: "Dataset & methodology", team: "Team", emailUs: "Email us",
        copyright1: "© 2026 AirAware. An AI-based air quality prediction & route optimization project.", copyright2: "Built for cleaner commutes.",
        li1: "Threshold tuned per condition — asthma, COPD, cardiovascular, pregnancy, general",
        li2: "Pollutant-specific triggers, not just a single blended index",
        li3: "Quiet hours and activity-aware timing, so alerts land before exposure, not during sleep",
        li4: "Every candidate route scored on cumulative pollutant exposure, door to door",
        li5: "Walking, cycling and driving modes weighted differently — exposure per minute varies by mode",
        li6: "Live re-routing when a forecast shifts mid-trip",
        a1title: "Ozone rising near your evening run route", a1body: "O₃ forecast to hit 118 AQI by 5:30pm along your usual loop. Suggested window: before 3pm.", a1time: "2 MIN AGO",
        a2title: "PM2.5 spike expected — asthma profile", a2body: "Construction-linked dust event forecast for your commute corridor, 8–10am tomorrow.", a2time: "14 MIN AGO",
        arch1lbl: "Sensor & satellite feed", arch1dsc: "Ground stations, low-cost IoT nodes, AOD satellite data, weather & traffic APIs.",
        arch2lbl: "Calibration layer", arch2dsc: "Cross-sensor bias correction and spatial interpolation across the city grid.",
        arch3lbl: "Spatiotemporal forecaster", arch3dsc: "Learns pollutant drift from meteorology, emissions and historical patterns.",
        arch4lbl: "Exposure engine", arch4dsc: "Converts forecasts into per-user risk scores and route exposure costs.",
        arch5lbl: "Alerts & routing", arch5dsc: "Personalized push alerts and pollution-aware navigation, in real time."
      }
    }
  },
  hi: {
    translation: {
      nav: {
        airQuality: "वायु\nगुणवत्ता", forecast: "पूर्वानुमान", routePlanner: "मार्ग\nयोजनाकार", myExposure: "मेरा\nएक्सपोज़र", profileAlerts: "प्रोफ़ाइल और\nअलर्ट",
        brandName: "एयर-अवेयर", brandSub: "भारत", live: "लाइव भारत:", signOut: "साइन आउट", guestExplorer: "अतिथि उपयोगकर्ता",
        dark: "डार्क", light: "लाइट"
      },
      app: {
        demoAlert: "दिल्ली AQI 284 है, जो आपकी 170 की अलर्ट सीमा से ऊपर है। (बहुत अस्वस्थ)",
        useLive: "अपने लाइव स्थान का उपयोग करें?",
        shareGps: "वास्तविक समय AQI और व्यक्तिगत स्वास्थ्य अलर्ट देखने के लिए अपना GPS स्थान साझा करें।",
        allowLoc: "स्थान की अनुमति दें"
      },
      dashboard: { 
        title: "वायु गुणवत्ता डैशबोर्ड",
        search: "भारतीय शहरों को खोजें (उदा. दिल्ली, मुंबई, बेंगलुरु)...",
        cities: "शहर:",
        active: "सक्रिय",
        localTime: "स्थानीय समय",
        interactiveDir: "इंटरएक्टिव निर्देशिका",
        exploreCoords: "शहर के निर्देशांक खोजें",
        lat: "अक्षांश", lng: "देशांतर",
        mainStats: "मुख्य आँकड़े",
        dominant: "प्रमुख",
        temp: "तापमान",
        iqMap: "आईक्यू एयर मैप",
        hybrid: "हाइब्रिड दृश्य",
        recenter: "री-सेंटर",
        zoom: "ज़ूम"
      },
      forecast: {
        title: "वायु गुणवत्ता पूर्वानुमान", subtitle: "अगले 24 घंटे", btnRun: "पूर्वानुमान चलाएं",
        cityName: "शहर का नाम", selectStation: "स्टेशन चुनें…", loadStation: "स्टेशन लोड करें",
        peakIn: "पीक", forecasting: "पूर्वानुमान हो रहा है…", in6h: "6 घंटे में", range: "रेंज", selectCityPrompt: "शहर और स्टेशन चुनें, फिर 24-घंटे का चार्ट जनरेट करने के लिए पूर्वानुमान चलाएं पर क्लिक करें।"
      },
      route: {
        title: "मार्ग योजनाकार और एक्सपोज़र", plan: "मार्ग की योजना बनाएं", source: "स्रोत", dest: "मंज़िल", depart: "प्रस्थान का समय",
        btnGet: "मार्ग एक्यूआई पूर्वानुमान प्राप्त करें", selectCity: "शहर चुनें…", eval: "मूल्यांकन कर रहा है…", clear: "मिटाएं",
        summary: "मार्ग का सारांश", distance: "दूरी", travelTime: "यात्रा का समय", avgAqi: "औसत AQI एक्सपोज़र", score: "स्वच्छ-हवा स्कोर"
      },
      exposure: {
        title: "व्यक्तिगत एक्सपोज़र इतिहास", timeline: "आपकी एक्सपोज़र टाइमलाइन", clear: "इतिहास मिटाएं", noHistory: "अभी तक कोई एक्सपोज़र इतिहास दर्ज नहीं किया गया है।"
      },
      alerts: {
        healthProfile: "स्वास्थ्य प्रोफ़ाइल", sensitivity: "आपकी संवेदनशीलता सेटिंग्स", notifPrefs: "अधिसूचना प्राथमिकताएं", delivery: "वितरण चैनल",
        ageGroup: "आयु वर्ग", preExisting: "पहले से मौजूद बीमारियां", alertMeWhen: "जब एक्यूआई इससे अधिक हो तो मुझे सचेत करें:", saveProfile: "स्वास्थ्य प्रोफ़ाइल सहेजें",
        stationAlerts: "स्टेशन अलर्ट", stationId: "स्टेशन आईडी (उदा. delhi-anand-vihar)", add: "जोड़ें", remove: "हटाएं",
        browserPush: "ब्राउज़र पुश सूचनाएं", browserPushSub: "इस ब्राउज़र के लिए सक्षम।", emailAlerts: "ईमेल अलर्ट सक्षम करें",
        onlyBreach: "केवल तभी अलर्ट करें जब एक्यूआई मेरी सीमा को पार कर जाए", currentThresh: "वर्तमान सीमा:", alertsFireFor: "अलर्ट इसके लिए हैं:", noCond: "कोई स्थिति नहीं चुनी गई",
        child: "बच्चा (0-12)", adult: "वयस्क (20-60)", elderly: "बुजुर्ग", asthma: "अस्थमा / श्वसन रोग", heart: "हृदय या कार्डियोवैस्कुलर रोग", pregnant: "गर्भवती",
        elderly65: "बुजुर्ग (65+)", youngChild: "घर में छोटा बच्चा", cautious: "सावधान", extreme: "केवल चरम", saved: "✓ सहेजा गया!"
      },
      landing: {
        knowAir: "सांस लेने से पहले हवा को जानें।",
        fuses: "एयरअवेयर सेंसर नेटवर्क, मौसम डेटा और मशीन लर्निंग को जोड़कर हर ब्लॉक का प्रदूषण पूर्वानुमान लगाता है - फिर आपको सुरक्षित मार्ग बताता है।",
        reqDemo: "डेमो का अनुरोध करें", seeHow: "देखें यह कैसे काम करता है",
        forecast72: "72 घंटे का पूर्वानुमान", err8: "±8% PM2.5 त्रुटि", res150: "150m ग्रिड रिज़ॉल्यूशन",
        sense: "समझें → भविष्यवाणी करें → सुरक्षित करें",
        threeStages: "तीन चरण, लगातार चल रहे हैं",
        eachStage: "प्रत्येक चरण एक लाइव लूप में अगले को फ़ीड करता है — मॉडल हमेशा सीखता रहता है कि वास्तव में क्या हुआ बनाम क्या अनुमान लगाया गया था।",
        step1Title: "ज़मीनी सच्चाई को समझें", step1Desc: "कम लागत वाले सेंसर ग्रिड, सरकारी निगरानी स्टेशन, उपग्रह AOD रीडिंग और लाइव ट्रैफ़िक घनत्व हर कुछ मिनटों में लिए जाते हैं और क्रॉस-कैलिब्रेट किए जाते हैं।",
        step2Title: "अगले 72 घंटों का पूर्वानुमान", step2Desc: "एक स्थानिक-अस्थायी मॉडल पूरे शहर में 150 मीटर के रिज़ॉल्यूशन पर PM2.5, PM10, NO₂ और ओजोन का अनुमान लगाता है।",
        step3Title: "अलर्ट और मार्ग परिवर्तन", step3Desc: "अलर्ट प्रत्येक उपयोगकर्ता की अपनी संवेदनशीलता प्रोफ़ाइल के अनुसार सेट किए जाते हैं, और रूटिंग इंजन हर पथ विकल्प को संचयी एक्सपोज़र के आधार पर स्कोर करता है।",
        alertsTuned: "आपके शरीर के अनुकूल अलर्ट, न कि शहर के औसत के अनुसार", alertsTunedDesc: "अगर आपको अस्थमा है तो शहर भर का AQI नंबर बहुत कम मायने रखता है। एयरअवेयर पूर्वानुमानों को आपको सचेत करने से पहले एक व्यक्तिगत संवेदनशीलता प्रोफ़ाइल के मुकाबले तौलता है।",
        routesOpt: "आप जो सांस लेते हैं उसके लिए अनुकूलित मार्ग, न कि केवल आप कितनी तेज़ी से वहाँ पहुँचते हैं", routesOptDesc: "रूटिंग इंजन प्रदूषण के जोखिम को समय और दूरी के साथ-साथ एक वास्तविक लागत फ़ंक्शन के रूप में मानता है — ताकि आप अपनी सुविधानुसार चुनाव कर सकें।",
        statsSensor: "प्रतिदिन संसाधित सेंसर रीडिंग", statsGrid: "पूर्वानुमान ग्रिड रिज़ॉल्यूशन", statsRolling: "रोलिंग पूर्वानुमान क्षितिज", statsError: "औसत पूर्ण त्रुटि, PM2.5",
        underHood: "परदे के पीछे (Under the hood)", pipeline: "बदलते लक्ष्य के लिए बनाई गई पाइपलाइन", airDoesnt: "हवा की गुणवत्ता स्थिर नहीं रहती - सिस्टम एक निरंतर लूप के रूप में बनाया गया है, न कि एक बार की रिपोर्ट के रूप में।",
        getStarted: "शुरू करें", givePeople: "लोगों को फिर से हवा पर भरोसा करने का कारण दें।", bringAir: "एयरअवेयर के पूर्वानुमान और रूटिंग इंजन को अपने शहर, परिसर या ऐप में लाएं।",
        readTech: "तकनीकी विवरण पढ़ें", product: "उत्पाद", project: "परियोजना", contact: "संपर्क",
        features: "विशेषताएं", architecture: "आर्किटेक्चर", techBrief: "तकनीकी विवरण", dataset: "डेटासेट और कार्यप्रणाली", team: "टीम", emailUs: "हमें ईमेल करें",
        copyright1: "© 2026 एयरअवेयर। एक एआई-आधारित वायु गुणवत्ता पूर्वानुमान और मार्ग अनुकूलन परियोजना।", copyright2: "स्वच्छ आवागमन के लिए बनाया गया।",
        li1: "स्थिति के अनुसार थ्रेशोल्ड ट्यून किया गया — अस्थमा, सीओपीडी, हृदय रोग, गर्भावस्था, सामान्य",
        li2: "प्रदूषक-विशिष्ट ट्रिगर, न कि केवल एक मिश्रित सूचकांक",
        li3: "शांत घंटे और गतिविधि-जागरूक समय, इसलिए एक्सपोज़र से पहले अलर्ट आते हैं, नींद के दौरान नहीं",
        li4: "प्रत्येक संभावित मार्ग संचयी प्रदूषक एक्सपोज़र पर स्कोर किया गया, डोर-टू-डोर",
        li5: "पैदल चलना, साइकिल चलाना और ड्राइविंग मोड अलग-अलग तरीके से भारित — मोड के अनुसार प्रति मिनट एक्सपोज़र बदलता है",
        li6: "मध्य-यात्रा में पूर्वानुमान बदलने पर लाइव री-रूटिंग",
        a1title: "आपके शाम के दौड़ने के मार्ग के पास ओजोन बढ़ रहा है", a1body: "आपके सामान्य लूप के साथ शाम 5:30 बजे तक O₃ 118 AQI तक पहुँचने का पूर्वानुमान है। सुझाया गया समय: दोपहर 3 बजे से पहले।", a1time: "2 मिनट पहले",
        a2title: "PM2.5 स्पाइक अपेक्षित — अस्थमा प्रोफ़ाइल", a2body: "निर्माण से जुड़ी धूल की घटना का आपके आने-जाने के मार्ग के लिए पूर्वानुमान, कल सुबह 8-10 बजे।", a2time: "14 मिनट पहले",
        arch1lbl: "सेंसर और उपग्रह फ़ीड", arch1dsc: "ग्राउंड स्टेशन, कम लागत वाले IoT नोड्स, AOD सैटेलाइट डेटा, मौसम और ट्रैफ़िक API।",
        arch2lbl: "अंशांकन (Calibration) परत", arch2dsc: "क्रॉस-सेंसर बायस सुधार और पूरे शहर के ग्रिड में स्थानिक प्रक्षेप।",
        arch3lbl: "स्थानिक-अस्थायी भविष्यवक्ता", arch3dsc: "मौसम विज्ञान, उत्सर्जन और ऐतिहासिक पैटर्न से प्रदूषक बहाव सीखता है।",
        arch4lbl: "एक्सपोज़र इंजन", arch4dsc: "पूर्वानुमानों को प्रति-उपयोगकर्ता जोखिम स्कोर और मार्ग एक्सपोज़र लागत में परिवर्तित करता है।",
        arch5lbl: "अलर्ट और रूटिंग", arch5dsc: "वास्तविक समय में व्यक्तिगत पुश अलर्ट और प्रदूषण-जागरूक नेविगेशन।"
      }
    }
  },
  te: {
    translation: {
      nav: {
        airQuality: "గాలి\nనాణ్యత", forecast: "సూచన", routePlanner: "రూట్\nప్లానర్", myExposure: "నా\nఎక్స్పోజర్", profileAlerts: "ప్రొఫైల్ &\nఅలర్ట్‌లు",
        brandName: "ఎయిర్-అవేర్", brandSub: "భారతదేశం", live: "లైవ్ IND:", signOut: "సైన్ అవుట్", guestExplorer: "అతిథి",
        dark: "చీకటి", light: "వెలుగు"
      },
      app: {
        demoAlert: "ఢిల్లీ AQI 284, మీ అలర్ట్ థ్రెషోల్డ్ 170 కంటే ఎక్కువ. (చాలా అనారోగ్యకరం)",
        useLive: "మీ లైవ్ లొకేషన్ ఉపయోగించాలా?",
        shareGps: "లైవ్ AQI మరియు హెల్త్ అలర్ట్‌లను చూడటానికి మీ GPS లొకేషన్‌ను షేర్ చేయండి.",
        allowLoc: "అనుమతించు"
      },
      dashboard: {
        title: "గాలి నాణ్యత డాష్‌బోర్డ్",
        search: "భారతీయ నగరాలను శోధించండి...",
        cities: "నగరాలు:",
        active: "యాక్టివ్",
        localTime: "స్థానిక సమయం",
        interactiveDir: "ఇంటరాక్టివ్ డైరెక్టరీ",
        exploreCoords: "నగర కోఆర్డినేట్‌లను అన్వేషించండి",
        lat: "Lat", lng: "Lng",
        mainStats: "ప్రధాన గణాంకాలు",
        dominant: "ప్రబలమైన",
        temp: "ఉష్ణోగ్రత",
        iqMap: "IQ AIR MAP",
        hybrid: "హైబ్రిడ్ వీక్షణ",
        recenter: "రీసెంటర్",
        zoom: "జూమ్"
      },
      forecast: {
        title: "గాలి నాణ్యత సూచన", subtitle: "తదుపరి 24 గంటలు", btnRun: "సూచన రన్ చేయండి",
        cityName: "నగరం పేరు", selectStation: "స్టేషన్ ఎంచుకోండి…", loadStation: "స్టేషన్ లోడ్ చేయండి",
        peakIn: "పీక్", hr: "గం", forecasting: "సూచిస్తోంది…", in6h: "6 గంటల్లో", range: "పరిధి", selectCityPrompt: "నగరం & స్టేషన్‌ను ఎంచుకోండి, ఆపై రన్ క్లిక్ చేయండి."
      },
      route: {
        title: "రూట్ ప్లానర్ & ఎక్స్పోజర్", plan: "రూట్ ప్లాన్ చేయండి", source: "మూలం", dest: "గమ్యం", depart: "బయలుదేరండి",
        btnGet: "రూట్ AQI పొందండి", selectCity: "నగరం ఎంచుకోండి…", eval: "మూల్యాంకనం చేస్తోంది…", clear: "క్లియర్",
        summary: "రూట్ సారాంశం", distance: "దూరం", travelTime: "ప్రయాణ సమయం", avgAqi: "సగటు AQI", score: "స్కోర్"
      },
      exposure: {
        title: "వ్యక్తిగత ఎక్స్పోజర్ చరిత్ర", timeline: "మీ ఎక్స్పోజర్ టైమ్‌లైన్", clear: "చరిత్ర క్లియర్ చేయండి", noHistory: "ఎక్స్పోజర్ చరిత్ర లేదు."
      },
      alerts: {
        healthProfile: "ఆరోగ్య ప్రొఫైల్", sensitivity: "మీ సెన్సిటివిటీ సెట్టింగ్‌లు", notifPrefs: "నోటిఫికేషన్ ప్రాధాన్యతలు", delivery: "డెలివరీ ఛానెల్‌లు",
        ageGroup: "వయోవర్గం", preExisting: "ఇప్పటికే ఉన్న పరిస్థితులు", alertMeWhen: "AQI మించినప్పుడు నన్ను హెచ్చరించండి:", saveProfile: "ప్రొఫైల్ సేవ్ చేయండి",
        stationAlerts: "స్టేషన్ అలర్ట్‌లు", stationId: "స్టేషన్ ID", add: "జోడించు", remove: "తొలగించు",
        browserPush: "బ్రౌజర్ నోటిఫికేషన్‌లు", browserPushSub: "ఈ బ్రౌజర్‌కు ప్రారంభించబడింది.", emailAlerts: "ఇమెయిల్ అలర్ట్‌లు",
        onlyBreach: "నా థ్రెషోల్డ్ దాటినప్పుడు మాత్రమే హెచ్చరించండి", currentThresh: "ప్రస్తుత థ్రెషోల్డ్:", alertsFireFor: "అలర్ట్‌లు ఫైర్:", noCond: "పరిస్థితులు లేవు",
        child: "పిల్లవాడు (0-12)", adult: "వయోజనులు (20-60)", elderly: "వృద్ధులు", asthma: "ఉబ్బసం", heart: "గుండె జబ్బులు", pregnant: "గర్భిణీ",
        elderly65: "వృద్ధులు (65+)", youngChild: "చిన్న బిడ్డ", cautious: "జాగ్రత్త", extreme: "తీవ్రమైన", saved: "✓ సేవ్ చేయబడింది!"
      },
      landing: {
        knowAir: "మీరు పీల్చుకునే గాలి గురించి తెలుసుకోండి.",
        fuses: "AirAware సెన్సార్ నెట్‌వర్క్‌లు, వాతావరణ డేటా మరియు మెషిన్ లెర్నింగ్‌ను ఫ్యూజ్ చేస్తుంది — ఆపై మిమ్మల్ని మళ్లిస్తుంది మరియు ఎక్స్పోజర్ ముందే హెచ్చరిస్తుంది.",
        reqDemo: "డెమో అభ్యర్థించండి", seeHow: "ఇది ఎలా పనిచేస్తుందో చూడండి",
        forecast72: "72 గంటల సూచన", err8: "±8% PM2.5 లోపం", res150: "150m రిజల్యూషన్",
        sense: "సెన్స్ → అంచనా → రక్షణ",
        threeStages: "మూడు దశలు, నిరంతరం నడుస్తూ",
        eachStage: "ప్రతి దశ తదుపరిదానికి మద్దతు ఇస్తుంది — మోడల్ నిజంగా ఏమి జరిగిందో నేర్చుకుంటూనే ఉంటుంది.",
        step1Title: "గ్రౌండ్ ట్రూత్ తీసుకోండి", step1Desc: "తక్కువ ఖర్చు సెన్సార్లు, ప్రభుత్వ స్టేషన్లు, శాటిలైట్ డేటా మరియు ట్రాఫిక్ డేటా ప్రతి కొన్ని నిమిషాలకు పొందబడుతుంది.",
        step2Title: "తదుపరి 72 గంటలను అంచనా వేయండి", step2Desc: "ఒక స్పేషియోటెంపోరల్ మోడల్ PM2.5, PM10, NO₂ మరియు ఓజోన్‌ను 150m రిజల్యూషన్‌లో అంచనా వేస్తుంది.",
        step3Title: "అలర్ట్ మరియు రీరూట్", step3Desc: "ప్రతి వినియోగదారు ప్రొఫైల్ ఆధారంగా అలర్ట్‌లు స్కోర్ చేయబడతాయి, మరియు రూటింగ్ ఇంజిన్ ఎక్స్పోజర్ ఆధారంగా మార్గాన్ని ఎంచుకుంటుంది.",
        alertsTuned: "మీ శరీరానికి ట్యూన్ చేయబడిన అలర్ట్‌లు, నగరం సగటు కాదు", alertsTunedDesc: "మీకు ఉబ్బసం ఉంటే, గర్భిణీ అయితే, లేదా ఉదయం 6 గంటలకు బయట పరుగెత్తితే నగరం సగటు ప్రభావం చూపదు.",
        routesOpt: "మీరు పీల్చుకునే దాని ఆధారంగా ఆప్టిమైజ్ చేయబడిన రూట్‌లు", routesOptDesc: "రూటింగ్ ఇంజిన్ కాలుష్య ఎక్స్పోజర్‌ను నిజమైన ఖర్చుగా పరిగణిస్తుంది.",
        statsSensor: "రోజూ ప్రాసెస్ చేయబడిన సెన్సార్ రీడింగులు", statsGrid: "సూచన గ్రిడ్ రిజల్యూషన్", statsRolling: "రోలింగ్ అంచనా హరైజన్", statsError: "సగటు లోపం, PM2.5",
        underHood: "లోపల", pipeline: "కదిలే లక్ష్యం కోసం నిర్మించిన పైప్‌లైన్", airDoesnt: "గాలి నాణ్యత స్థిరంగా ఉండదు — సిస్టం నిరంతర లూప్‌గా నిర్మించబడింది.",
        getStarted: "ప్రారంభించండి", givePeople: "గాలిపై మళ్ళీ నమ్మకం కలిగించండి.", bringAir: "మీ నగరానికి AirAware ని తీసుకురండి.",
        readTech: "సాంకేతిక వివరాలు చదవండి", product: "ఉత్పత్తి", project: "ప్రాజెక్ట్", contact: "సంప్రదించండి",
        features: "లక్షణాలు", architecture: "ఆర్కిటెక్చర్", techBrief: "సాంకేతిక బ్రీఫ్", dataset: "డేటాసెట్ & మెథడాలజీ", team: "జట్టు", emailUs: "ఇమెయిల్ చేయండి",
        copyright1: "© 2026 AirAware. AI-ఆధారిత గాలి నాణ్యత అంచనా & రూట్ ఆప్టిమైజేషన్ ప్రాజెక్ట్.", copyright2: "క్లీనర్ కమ్యూట్‌ల కోసం నిర్మించబడింది.",
        li1: "పరిస్థితి ప్రకారం ట్యూన్ చేయబడిన థ్రెషోల్డ్ — ఉబ్బసం, COPD, గుండె, గర్భం, సాధారణ",
        li2: "కాలుష్య-నిర్దిష్ట ట్రిగ్గర్లు, ఒకే బ్లెండెడ్ ఇండెక్స్ కాదు",
        li3: "నిశ్శబ్ద సమయాలు మరియు కార్యాచరణ-అవగాహన సమయం",
        li4: "ప్రతి మార్గానికి ఎక్స్పోజర్ స్కోర్, తలుపు నుండి తలుపు వరకు",
        li5: "నడక, సైక్లింగ్ మరియు డ్రైవింగ్ మోడ్‌లు భిన్నంగా వెయిట్ చేయబడతాయి",
        li6: "ప్రయాణ మధ్యలో సూచన మారినప్పుడు లైవ్ రీ-రూటింగ్",
        a1title: "మీ సాయంత్రం రన్ రూట్ వద్ద ఓజోన్ పెరుగుతోంది", a1body: "O₃ 5:30pm నాటికి 118 AQI కి చేరుతుందని అంచనా. సూచించిన విండో: 3pm ముందు.", a1time: "2 నిమిషాల క్రితం",
        a2title: "PM2.5 స్పైక్ ఊహించబడింది — ఉబ్బసం ప్రొఫైల్", a2body: "రేపు ఉదయం 8-10 గంటలకు మీ కమ్యూట్ కారిడార్‌లో దుమ్ము.", a2time: "14 నిమిషాల క్రితం",
        arch1lbl: "సెన్సార్ & శాటిలైట్ ఫీడ్", arch1dsc: "గ్రౌండ్ స్టేషన్లు, IoT నోడ్లు, AOD శాటిలైట్ డేటా, వాతావరణ & ట్రాఫిక్ APIలు.",
        arch2lbl: "కాలిబ్రేషన్ లేయర్", arch2dsc: "క్రాస్-సెన్సార్ బయాస్ కరెక్షన్ మరియు నగరం అంతటా స్పేషియల్ ఇంటర్పొలేషన్.",
        arch3lbl: "స్పేషియోటెంపోరల్ ఫోర్‌కాస్టర్", arch3dsc: "వాతావరణం, ఉద్గారాలు మరియు చారిత్రక నమూనాల నుండి కాలుష్య డ్రిఫ్ట్ నేర్చుకుంటుంది.",
        arch4lbl: "ఎక్స్పోజర్ ఇంజిన్", arch4dsc: "అంచనాలను ప్రతి-వినియోగదారు రిస్క్ స్కోర్లుగా మారుస్తుంది.",
        arch5lbl: "అలర్ట్‌లు & రూటింగ్", arch5dsc: "వ్యక్తిగత పుష్ అలర్ట్‌లు మరియు కాలుష్య-అవగాహన నావిగేషన్."
      }
    }
  },
  ta: {
    translation: {
      nav: {
        airQuality: "காற்று\nதரம்", forecast: "முன்னறிவிப்பு", routePlanner: "வழித்தட\nதிட்டமிடுபவர்", myExposure: "எனது\nவெளிப்பாடு", profileAlerts: "சுயவிவரம் &\nவிழிப்பூட்டல்கள்",
        brandName: "ஏர்-அவேர்", brandSub: "இந்தியா", live: "நேரலை IND:", signOut: "வெளியேறு", guestExplorer: "விருந்தினர்",
        dark: "இருண்ட", light: "வெளிச்சம்"
      },
      app: {
        demoAlert: "டெல்லி AQI 284, உங்களின் 170 எச்சரிக்கை வரம்பை விட அதிகம். (மிகவும் ஆரோக்கியமற்றது)",
        useLive: "உங்கள் நேரடி இருப்பிடத்தைப் பயன்படுத்தலாமா?",
        shareGps: "நேரடி AQI மற்றும் சுகாதார எச்சரிக்கைகளைப் பார்க்க GPSஐப் பகிரவும்.",
        allowLoc: "அனுமதி"
      },
      dashboard: {
        title: "காற்று தர டாஷ்போர்டு",
        search: "இந்திய நகரங்களைத் தேடுங்கள்...",
        cities: "நகரங்கள்:",
        active: "செயலில்",
        localTime: "உள்ளூர் நேரம்",
        interactiveDir: "ஊடாடும் அடைவு",
        exploreCoords: "நகர ஒருங்கிணைப்புகளை ஆராயுங்கள்",
        lat: "Lat", lng: "Lng",
        mainStats: "முக்கிய புள்ளிவிவரங்கள்",
        dominant: "ஆதிக்கம்",
        temp: "வெப்பநிலை",
        iqMap: "IQ AIR MAP",
        hybrid: "கலப்பின காட்சி",
        recenter: "மையப்படுத்து",
        zoom: "பெரிதாக்கு"
      },
      forecast: {
        title: "காற்று தர முன்னறிவிப்பு", subtitle: "அடுத்த 24 மணிநேரம்", btnRun: "முன்னறிவிப்பை இயக்கவும்",
        cityName: "நகரத்தின் பெயர்", selectStation: "நிலையத்தை தேர்ந்தெடுக்கவும்…", loadStation: "நிலையத்தை ஏற்றவும்",
        peakIn: "உச்சம்", hr: "மணி", forecasting: "கணிக்கப்படுகிறது…", in6h: "6 மணிநேரத்தில்", range: "வரம்பு", selectCityPrompt: "நகரம் & நிலையத்தைத் தேர்ந்தெடுத்து ரன் கிளிக் செய்யவும்."
      },
      route: {
        title: "வழித்தட திட்டமிடுபவர் & வெளிப்பாடு", plan: "வழியைத் திட்டமிடு", source: "மூலம்", dest: "இலக்கு", depart: "புறப்படு",
        btnGet: "வழித்தட AQI பெறவும்", selectCity: "நகரத்தை தேர்ந்தெடுக்கவும்…", eval: "மதிப்பிடப்படுகிறது…", clear: "அழி",
        summary: "வழி சுருக்கம்", distance: "தூரம்", travelTime: "பயண நேரம்", avgAqi: "சராசரி AQI", score: "மதிப்பெண்"
      },
      exposure: {
        title: "தனிப்பட்ட வெளிப்பாடு வரலாறு", timeline: "உங்கள் வெளிப்பாடு காலக்கெடு", clear: "வரலாற்றை அழி", noHistory: "வரலாறு இல்லை."
      },
      alerts: {
        healthProfile: "சுகாதார சுயவிவரம்", sensitivity: "உணர்திறன் அமைப்புகள்", notifPrefs: "அறிவிப்பு விருப்பங்கள்", delivery: "டெலிவரி சேனல்கள்",
        ageGroup: "வயதுக் குழு", preExisting: "முன்பே இருக்கும் நிலைமைகள்", alertMeWhen: "AQI மீறும் போது என்னை எச்சரி:", saveProfile: "சுயவிவரத்தை சேமி",
        stationAlerts: "நிலைய எச்சரிக்கைகள்", stationId: "நிலைய ID", add: "சேர்", remove: "அகற்று",
        browserPush: "உலாவியின் அறிவிப்புகள்", browserPushSub: "இந்த உலாவிக்கு இயக்கப்பட்டது.", emailAlerts: "மின்னஞ்சல் எச்சரிக்கைகள்",
        onlyBreach: "வரம்பை மீறும் போது மட்டும் எச்சரி", currentThresh: "தற்போதைய வரம்பு:", alertsFireFor: "விழிப்பூட்டல்கள்:", noCond: "நிபந்தனைகள் இல்லை",
        child: "குழந்தை (0-12)", adult: "பெரியவர் (20-60)", elderly: "முதியோர்", asthma: "ஆஸ்துமா", heart: "இதய நிலை", pregnant: "கர்ப்பிணி",
        elderly65: "முதியோர் (65+)", youngChild: "சிறிய குழந்தை", cautious: "கவனமான", extreme: "தீவிரமானது", saved: "✓ சேமிக்கப்பட்டது!"
      },
      landing: {
        knowAir: "சுவாசிக்கும் முன் காற்றை அறியுங்கள்.",
        fuses: "AirAware சென்சார் நெட்வொர்க்குகள், வானிலை தரவு மற்றும் இயந்திர கற்றலை இணைக்கிறது — பின்னர் உங்களை வழிமாற்றி, வெளிப்படும் முன் எச்சரிக்கிறது.",
        reqDemo: "டெமோவைக் கோருங்கள்", seeHow: "இது எப்படி வேலை செய்கிறது என்று பாருங்கள்",
        forecast72: "72 மணிநேர முன்னறிவிப்பு", err8: "±8% PM2.5 பிழை", res150: "150m தெளிவுத்திறன்",
        sense: "உணர்தல் → கணிப்பு → பாதுகாப்பு",
        threeStages: "மூன்று நிலைகள், தொடர்ந்து இயங்குகிறது",
        eachStage: "ஒவ்வொரு நிலையும் அடுத்ததை மேம்படுத்துகிறது — மாதிரி கணிப்புக்கு எதிராக என்ன நடந்தது என்பதிலிருந்து கற்றுக்கொள்கிறது.",
        step1Title: "தரைத் தரவைப் பெறுங்கள்", step1Desc: "குறைந்த செலவு சென்சார் கட்டங்கள், அரசு கண்காணிப்பு நிலையங்கள், செயற்கைக்கோள் AOD மற்றும் நேரடி போக்குவரத்து தரவு சில நிமிடங்களுக்கு ஒருமுறை பெறப்படுகிறது.",
        step2Title: "அடுத்த 72 மணிநேரத்தை கணிக்கவும்", step2Desc: "ஒரு இடஞ்சார்-நேர மாதிரி PM2.5, PM10, NO₂ மற்றும் ஓசோனை 150m தெளிவில் கணிக்கிறது.",
        step3Title: "எச்சரிக்கை மற்றும் மாற்றுப்பாதை", step3Desc: "ஒவ்வொரு பயனரின் உணர்திறன் சுயவிவரத்திற்கு எதிராக எச்சரிக்கைகள் மதிப்பிடப்படுகின்றன.",
        alertsTuned: "உங்கள் உடலுக்கு ஏற்ற எச்சரிக்கைகள், நகர சராசரி அல்ல", alertsTunedDesc: "நீங்கள் ஆஸ்துமா நோயாளியாக இருந்தால், கர்ப்பிணியாக இருந்தால், அல்லது காலை 6 மணிக்கு ஓடினால் நகர AQI எண் பொருளில்லை.",
        routesOpt: "நீங்கள் சுவாசிப்பதற்கு ஏற்ப வழிகள் மேம்படுத்தப்பட்டுள்ளன", routesOptDesc: "ரூட்டிங் இயந்திரம் மாசுபாட்டை நேரம் மற்றும் தூரத்துடன் நிஜமான செலவாகக் கருதுகிறது.",
        statsSensor: "தினசரி செயலாக்கப்படும் சென்சார் அளவீடுகள்", statsGrid: "முன்னறிவிப்பு கட்ட தெளிவுத்திறன்", statsRolling: "உருளும் கணிப்பு எல்லை", statsError: "சராசரி பிழை, PM2.5",
        underHood: "உள்ளே", pipeline: "நகரும் இலக்குக்காக கட்டப்பட்ட குழாய்", airDoesnt: "காற்றின் தரம் நிலையானதல்ல — அமைப்பு தொடர்ச்சியான வளையமாக கட்டப்பட்டுள்ளது.",
        getStarted: "தொடங்குங்கள்", givePeople: "காற்றை மீண்டும் நம்புவதற்கு மக்களுக்கு ஒரு காரணம் கொடுங்கள்.", bringAir: "உங்கள் நகரத்திற்கு AirAware ஐ கொண்டு வாருங்கள்.",
        readTech: "தொழில்நுட்ப சுருக்கத்தைப் படியுங்கள்", product: "தயாரிப்பு", project: "திட்டம்", contact: "தொடர்பு கொள்ள",
        features: "அம்சங்கள்", architecture: "கட்டமைப்பு", techBrief: "தொழில்நுட்ப சுருக்கம்", dataset: "தரவுத்தொகுப்பு & முறையியல்", team: "குழு", emailUs: "மின்னஞ்சல்",
        copyright1: "© 2026 AirAware. AI-அடிப்படையிலான காற்று தர கணிப்பு & வழித்தட மேம்படுத்தல் திட்டம்.", copyright2: "தூய்மையான பயணங்களுக்காக உருவாக்கப்பட்டது.",
        li1: "நிபந்தனைக்கு ஏற்ப வரம்பு — ஆஸ்துமா, COPD, இருதய, கர்ப்பம், பொது",
        li2: "மாசு-குறிப்பிட்ட தூண்டுதல்கள், ஒற்றை கலப்பு குறியீடு அல்ல",
        li3: "அமைதியான நேரங்கள் மற்றும் செயல்பாடு-விழிப்புணர்வு நேரம்",
        li4: "ஒவ்வொரு பாதைக்கும் ஒட்டுமொத்த மாசு வெளிப்பாடு மதிப்பெண்",
        li5: "நடைபயிற்சி, சைக்கிள் மற்றும் ஓட்டுநர் முறைகள் வேறுபட்ட எடையுடன்",
        li6: "பயணத்தின் நடுவில் கணிப்பு மாறும்போது நேரடி மாற்றுப்பாதை",
        a1title: "உங்கள் மாலை ஓட்டப்பாதையில் ஓசோன் உயர்கிறது", a1body: "O₃ மாலை 5:30 மணிக்கு 118 AQI ஐ எட்டும் என எதிர்பார்க்கப்படுகிறது.", a1time: "2 நிமிடங்களுக்கு முன்",
        a2title: "PM2.5 அதிகரிப்பு எதிர்பார்க்கப்படுகிறது — ஆஸ்துமா சுயவிவரம்", a2body: "நாளை காலை 8-10 மணிக்கு உங்கள் பயணப் பாதையில் தூசி.", a2time: "14 நிமிடங்களுக்கு முன்",
        arch1lbl: "சென்சார் & செயற்கைக்கோள் தரவு", arch1dsc: "தரை நிலையங்கள், IoT முனைகள், AOD செயற்கைக்கோள் தரவு, வானிலை & போக்குவரத்து APIகள்.",
        arch2lbl: "அளவுத்திருத்த அடுக்கு", arch2dsc: "சென்சார் சார்பு திருத்தம் மற்றும் நகரம் முழுவதும் இடஞ்சார் இடைக்கணிப்பு.",
        arch3lbl: "இடஞ்சார்-நேர முன்னறிவிப்பாளர்", arch3dsc: "வானிலை, உமிழ்வுகள் மற்றும் வரலாற்று வடிவங்களிலிருந்து மாசு நகர்வைக் கற்றுக்கொள்கிறது.",
        arch4lbl: "வெளிப்பாடு இயந்திரம்", arch4dsc: "கணிப்புகளை பயனர்-அடிப்படையிலான ஆபத்து மதிப்பெண்களாக மாற்றுகிறது.",
        arch5lbl: "எச்சரிக்கைகள் & வழித்தடம்", arch5dsc: "தனிப்பயனாக்கப்பட்ட புஷ் எச்சரிக்கைகள் மற்றும் மாசு-விழிப்புணர்வு வழிசெலுத்தல்."
      }
    }
  },
  kn: {
    translation: {
      nav: {
        airQuality: "ಗಾಳಿ\nಗುಣಮಟ್ಟ", forecast: "ಮುನ್ಸೂಚನೆ", routePlanner: "ಮಾರ್ಗ\nಯೋಜಕ", myExposure: "ನನ್ನ\nಎಕ್ಸ್ಪೋಸರ್", profileAlerts: "ಪ್ರೊಫೈಲ್ &\nಎಚ್ಚರಿಕೆಗಳು",
        brandName: "ಏರ್-ಅವೇರ್", brandSub: "ಭಾರತ", live: "ಲೈವ್ IND:", signOut: "ಸೈನ್ ಔಟ್", guestExplorer: "ಅತಿಥಿ",
        dark: "ಕತ್ತಲೆ", light: "ಬೆಳಕು"
      },
      app: {
        demoAlert: "ದೆಹಲಿ AQI 284, ನಿಮ್ಮ 170 ಎಚ್ಚರಿಕೆ ಮಿತಿಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ. (ಬಹಳ ಅನಾರೋಗ್ಯಕರ)",
        useLive: "ನಿಮ್ಮ ಲೈವ್ ಸ್ಥಳವನ್ನು ಬಳಸಬೇಕೆ?",
        shareGps: "ಲೈವ್ AQI ಮತ್ತು ಆರೋಗ್ಯ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೋಡಲು GPS ಹಂಚಿಕೊಳ್ಳಿ.",
        allowLoc: "ಅನುಮತಿಸಿ"
      },
      dashboard: {
        title: "ಗಾಳಿ ಗುಣಮಟ್ಟ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
        search: "ಭಾರತೀಯ ನಗರಗಳನ್ನು ಹುಡುಕಿ...",
        cities: "ನಗರಗಳು:",
        active: "ಸಕ್ರಿಯ",
        localTime: "ಸ್ಥಳೀಯ ಸಮಯ",
        interactiveDir: "ಸಂವಾದಾತ್ಮಕ ಡೈರೆಕ್ಟರಿ",
        exploreCoords: "ನಗರದ ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಅನ್ವೇಷಿಸಿ",
        lat: "Lat", lng: "Lng",
        mainStats: "ಮುಖ್ಯ ಅಂಕಿಅಂಶಗಳು",
        dominant: "ಪ್ರಬಲ",
        temp: "ತಾಪಮಾನ",
        iqMap: "IQ AIR MAP",
        hybrid: "ಹೈಬ್ರಿಡ್ ವೀಕ್ಷಣೆ",
        recenter: "ಮಧ್ಯಕ್ಕೆ ತನ್ನಿ",
        zoom: "ಜೂಮ್"
      },
      forecast: {
        title: "ಗಾಳಿ ಗುಣಮಟ್ಟ ಮುನ್ಸೂಚನೆ", subtitle: "ಮುಂದಿನ 24 ಗಂಟೆಗಳು", btnRun: "ಮುನ್ಸೂಚನೆ ಚಲಾಯಿಸಿ",
        cityName: "ನಗರದ ಹೆಸರು", selectStation: "ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ…", loadStation: "ನಿಲ್ದಾಣವನ್ನು ಲೋಡ್ ಮಾಡಿ",
        peakIn: "ಶಿಖರ", hr: "ಗಂ", forecasting: "ಮುನ್ಸೂಚಿಸಲಾಗುತ್ತಿದೆ…", in6h: "6 ಗಂಟೆಗಳಲ್ಲಿ", range: "ವ್ಯಾಪ್ತಿ", selectCityPrompt: "ನಗರ ಮತ್ತು ನಿಲ್ದಾಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ರನ್ ಕ್ಲಿಕ್ ಮಾಡಿ."
      },
      route: {
        title: "ಮಾರ್ಗ ಯೋಜಕ ಮತ್ತು ಎಕ್ಸ್ಪೋಸರ್", plan: "ಮಾರ್ಗವನ್ನು ಯೋಜಿಸಿ", source: "ಮೂಲ", dest: "ಗಮ್ಯಸ್ಥಾನ", depart: "ಹೊರಡಿ",
        btnGet: "ಮಾರ್ಗ AQI ಪಡೆಯಿರಿ", selectCity: "ನಗರವನ್ನು ಆಯ್ಕೆಮಾಡಿ…", eval: "ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗುತ್ತಿದೆ…", clear: "ತೆರವುಗೊಳಿಸಿ",
        summary: "ಮಾರ್ಗ ಸಾರಾಂಶ", distance: "ದೂರ", travelTime: "ಪ್ರಯಾಣದ ಸಮಯ", avgAqi: "ಸರಾಸರಿ AQI", score: "ಸ್ಕೋರ್"
      },
      exposure: {
        title: "ವೈಯಕ್ತಿಕ ಎಕ್ಸ್ಪೋಸರ್ ಇತಿಹಾಸ", timeline: "ನಿಮ್ಮ ಎಕ್ಸ್ಪೋಸರ್ ಟೈಮ್‌ಲೈನ್", clear: "ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಿ", noHistory: "ಎಕ್ಸ್ಪೋಸರ್ ಇತಿಹಾಸವಿಲ್ಲ."
      },
      alerts: {
        healthProfile: "ಆರೋಗ್ಯ ಪ್ರೊಫೈಲ್", sensitivity: "ನಿಮ್ಮ ಸೂಕ್ಷ್ಮತೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳು", notifPrefs: "ಅಧಿಸೂಚನೆ ಆದ್ಯತೆಗಳು", delivery: "ವಿತರಣಾ ಚಾನೆಲ್‌ಗಳು",
        ageGroup: "ವಯಸ್ಸಿನ ಗುಂಪು", preExisting: "ಮೊದಲೇ ಇರುವ ಪರಿಸ್ಥಿತಿಗಳು", alertMeWhen: "AQI ಮೀರಿದಾಗ ನನ್ನನ್ನು ಎಚ್ಚರಿಸಿ:", saveProfile: "ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ",
        stationAlerts: "ನಿಲ್ದಾಣದ ಎಚ್ಚರಿಕೆಗಳು", stationId: "ನಿಲ್ದಾಣದ ID", add: "ಸೇರಿಸಿ", remove: "ತೆಗೆದುಹಾಕಿ",
        browserPush: "ಬ್ರೌಸರ್ ಅಧಿಸೂಚನೆಗಳು", browserPushSub: "ಈ ಬ್ರೌಸರ್‌ಗಾಗಿ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ.", emailAlerts: "ಇಮೇಲ್ ಎಚ್ಚರಿಕೆಗಳು",
        onlyBreach: "ಮಿತಿಯನ್ನು ಮೀರಿದಾಗ ಮಾತ್ರ ಎಚ್ಚರಿಸಿ", currentThresh: "ಪ್ರಸ್ತುತ ಮಿತಿ:", alertsFireFor: "ಎಚ್ಚರಿಕೆಗಳು:", noCond: "ಷರತ್ತುಗಳಿಲ್ಲ",
        child: "ಮಗು (0-12)", adult: "ವಯಸ್ಕ (20-60)", elderly: "ವೃದ್ಧರು", asthma: "ಉಬ್ಬಸ", heart: "ಹೃದಯ ಸ್ಥಿತಿ", pregnant: "ಗರ್ಭಿಣಿ",
        elderly65: "ವೃದ್ಧರು (65+)", youngChild: "ಸಣ್ಣ ಮಗು", cautious: "ಎಚ್ಚರಿಕೆಯ", extreme: "ತೀವ್ರ", saved: "✓ ಉಳಿಸಲಾಗಿದೆ!"
      },
      landing: {
        knowAir: "ಉಸಿರಾಡುವ ಮೊದಲು ಗಾಳಿಯನ್ನು ತಿಳಿಯಿರಿ.",
        fuses: "AirAware ಸೆನ್ಸಾರ್ ನೆಟ್‌ವರ್ಕ್‌ಗಳು, ಹವಾಮಾನ ಡೇಟಾ ಮತ್ತು ಯಂತ್ರ ಕಲಿಕೆಯನ್ನು ಒಗ್ಗೂಡಿಸುತ್ತದೆ — ನಂತರ ನಿಮ್ಮನ್ನು ಮರುಹೊಂದಿಸಿ ಎಕ್ಸ್ಪೋಸರ್ ಮೊದಲೇ ಎಚ್ಚರಿಸುತ್ತದೆ.",
        reqDemo: "ಡೆಮೊ ವಿನಂತಿಸಿ", seeHow: "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ",
        forecast72: "72 ಗಂಟೆಗಳ ಮುನ್ಸೂಚನೆ", err8: "±8% PM2.5 ದೋಷ", res150: "150m ರೆಸಲ್ಯೂಶನ್",
        sense: "ಸೆನ್ಸ್ → ಭವಿಷ್ಯ → ರಕ್ಷಣೆ",
        threeStages: "ಮೂರು ಹಂತಗಳು, ನಿರಂತರವಾಗಿ ನಡೆಯುತ್ತಿದೆ",
        eachStage: "ಪ್ರತಿಯೊಂದು ಹಂತವು ಮುಂದಿನದನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ — ಮಾಡೆಲ್ ನಿಜವಾಗಿ ಏನಾಯಿತು ಎಂಬುದರಿಂದ ಕಲಿಯುವುದನ್ನು ನಿಲ್ಲಿಸುವುದಿಲ್ಲ.",
        step1Title: "ನೆಲದ ಡೇಟಾ ಪಡೆಯಿರಿ", step1Desc: "ಕಡಿಮೆ ವೆಚ್ಚದ ಸಂವೇದಕ ಗ್ರಿಡ್‌ಗಳು, ಸರ್ಕಾರಿ ಕಣ್ಗಾವಲು ಕೇಂದ್ರಗಳು, ಉಪಗ್ರಹ AOD ಮತ್ತು ಲೈವ್ ಟ್ರಾಫಿಕ್ ಡೇಟಾ ಕೆಲವೇ ನಿಮಿಷಗಳಲ್ಲಿ ಪಡೆಯಲಾಗುತ್ತದೆ.",
        step2Title: "ಮುಂದಿನ 72 ಗಂಟೆಗಳನ್ನು ಊಹಿಸಿ", step2Desc: "ಒಂದು ಪ್ರಾದೇಶಿಕ-ಸಮಯ ಮಾದರಿ PM2.5, PM10, NO₂ ಮತ್ತು ಓಝೋನ್ ಅನ್ನು 150m ರೆಸಲ್ಯೂಶನ್‌ನಲ್ಲಿ ಊಹಿಸುತ್ತದೆ.",
        step3Title: "ಎಚ್ಚರಿಕೆ ಮತ್ತು ಮರುಹೊಂದಿಸುವಿಕೆ", step3Desc: "ಪ್ರತಿ ಬಳಕೆದಾರರ ಸೂಕ್ಷ್ಮತೆ ಪ್ರೊಫೈಲ್ ವಿರುದ್ಧ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗುತ್ತದೆ.",
        alertsTuned: "ನಿಮ್ಮ ದೇಹಕ್ಕೆ ಸರಿಹೊಂದಿಸಲಾದ ಎಚ್ಚರಿಕೆಗಳು, ನಗರ ಸರಾಸರಿ ಅಲ್ಲ", alertsTunedDesc: "ನಿಮಗೆ ಉಬ್ಬಸವಿದ್ದರೆ, ಗರ್ಭಿಣಿಯಾಗಿದ್ದರೆ, ಅಥವಾ ಬೆಳಿಗ್ಗೆ 6 ಗಂಟೆಗೆ ಓಡಿದರೆ ನಗರ AQI ಅಂಕೆ ಅರ್ಥವಿಲ್ಲ.",
        routesOpt: "ನೀವು ಉಸಿರಾಡುವುದಕ್ಕಾಗಿ ಮಾರ್ಗಗಳನ್ನು ಆಪ್ಟಿಮೈಸ್ ಮಾಡಲಾಗಿದೆ", routesOptDesc: "ರೂಟಿಂಗ್ ಎಂಜಿನ್ ಮಾಲಿನ್ಯ ಎಕ್ಸ್ಪೋಸರ್ ಅನ್ನು ಸಮಯ ಮತ್ತು ದೂರದ ಜೊತೆ ನಿಜವಾದ ವೆಚ್ಚವಾಗಿ ಪರಿಗಣಿಸುತ್ತದೆ.",
        statsSensor: "ಪ್ರತಿದಿನ ಸಂಸ್ಕರಿಸಿದ ಸಂವೇದಕ ವಾಚನಗೋಷ್ಠಿಗಳು", statsGrid: "ಮುನ್ಸೂಚನೆ ಗ್ರಿಡ್ ರೆಸಲ್ಯೂಶನ್", statsRolling: "ರೋಲಿಂಗ್ ಮುನ್ಸೂಚನೆ ಎಲ್ಲೆ", statsError: "ಸರಾಸರಿ ದೋಷ, PM2.5",
        underHood: "ಒಳಗೆ", pipeline: "ಚಲಿಸುವ ಗುರಿಗಾಗಿ ನಿರ್ಮಿಸಿದ ಪೈಪ್‌ಲೈನ್", airDoesnt: "ಗಾಳಿಯ ಗುಣಮಟ್ಟ ಸ್ಥಿರವಾಗಿರುವುದಿಲ್ಲ — ವ್ಯವಸ್ಥೆಯನ್ನು ನಿರಂತರ ಲೂಪ್ ಆಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
        getStarted: "ಪ್ರಾರಂಭಿಸಿ", givePeople: "ಗಾಳಿಯನ್ನು ಮತ್ತೆ ನಂಬಲು ಜನರಿಗೆ ಕಾರಣ ಕೊಡಿ.", bringAir: "ನಿಮ್ಮ ನಗರಕ್ಕೆ AirAware ತನ್ನಿ.",
        readTech: "ತಾಂತ್ರಿಕ ಸಂಕ್ಷಿಪ್ತ ಓದಿ", product: "ಉತ್ಪನ್ನ", project: "ಯೋಜನೆ", contact: "ಸಂಪರ್ಕಿಸಿ",
        features: "ವೈಶಿಷ್ಟ್ಯಗಳು", architecture: "ವಾಸ್ತುಶಿಲ್ಪ", techBrief: "ತಾಂತ್ರಿಕ ಸಂಕ್ಷಿಪ್ತ", dataset: "ಡೇಟಾಸೆಟ್ & ವಿಧಾನಶಾಸ್ತ್ರ", team: "ತಂಡ", emailUs: "ಇಮೇಲ್",
        copyright1: "© 2026 AirAware. AI-ಆಧಾರಿತ ಗಾಳಿ ಗುಣಮಟ್ಟ ಮುನ್ಸೂಚನೆ & ಮಾರ್ಗ ಆಪ್ಟಿಮೈಸೇಶನ್ ಯೋಜನೆ.", copyright2: "ಸ್ವಚ್ಛ ಪ್ರಯಾಣಗಳಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.",
        li1: "ಸ್ಥಿತಿಗೆ ಅನುಗುಣವಾಗಿ ಮಿತಿ — ಉಬ್ಬಸ, COPD, ಹೃದಯ, ಗರ್ಭ, ಸಾಮಾನ್ಯ",
        li2: "ಮಾಲಿನ್ಯ-ನಿರ್ದಿಷ್ಟ ಪ್ರಚೋದಕಗಳು, ಒಂದೇ ಮಿಶ್ರ ಸೂಚ್ಯಂಕವಲ್ಲ",
        li3: "ಶಾಂತ ಸಮಯ ಮತ್ತು ಚಟುವಟಿಕೆ-ಜಾಗೃತ ಸಮಯ",
        li4: "ಪ್ರತಿ ಮಾರ್ಗಕ್ಕೂ ಒಟ್ಟಾರೆ ಮಾಲಿನ್ಯ ಎಕ್ಸ್ಪೋಸರ್ ಸ್ಕೋರ್",
        li5: "ನಡಿಗೆ, ಸೈಕ್ಲಿಂಗ್ ಮತ್ತು ಡ್ರೈವಿಂಗ್ ಮೋಡ್‌ಗಳು ವಿಭಿನ್ನವಾಗಿ ಅಳೆಯಲ್ಪಡುತ್ತವೆ",
        li6: "ಪ್ರಯಾಣದ ಮಧ್ಯೆ ಮುನ್ಸೂಚನೆ ಬದಲಾದಾಗ ಲೈವ್ ಮರುಹೊಂದಿಸುವಿಕೆ",
        a1title: "ನಿಮ್ಮ ಸಂಜೆಯ ಓಟದ ಮಾರ್ಗದಲ್ಲಿ ಓಝೋನ್ ಏರುತ್ತಿದೆ", a1body: "O₃ ಸಂಜೆ 5:30ರ ಹೊತ್ತಿಗೆ 118 AQI ಗೆ ತಲುಪುತ್ತದೆ ಎಂದು ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ.", a1time: "2 ನಿಮಿಷಗಳ ಹಿಂದೆ",
        a2title: "PM2.5 ಸ್ಪೈಕ್ ನಿರೀಕ್ಷಿಸಲಾಗಿದೆ — ಉಬ್ಬಸ ಪ್ರೊಫೈಲ್", a2body: "ನಾಳೆ ಬೆಳಿಗ್ಗೆ 8-10ರ ಸಮಯಕ್ಕೆ ನಿಮ್ಮ ಪ್ರಯಾಣ ಮಾರ್ಗದಲ್ಲಿ ಧೂಳು.", a2time: "14 ನಿಮಿಷಗಳ ಹಿಂದೆ",
        arch1lbl: "ಸಂವೇದಕ & ಉಪಗ್ರಹ ಫೀಡ್", arch1dsc: "ನೆಲದ ಕೇಂದ್ರಗಳು, IoT ನೋಡ್‌ಗಳು, AOD ಉಪಗ್ರಹ ಡೇಟಾ, ಹವಾಮಾನ & ಟ್ರಾಫಿಕ್ APIಗಳು.",
        arch2lbl: "ಮಾಪನಾಂಕ ನಿರ್ಣಯ ಪದರ", arch2dsc: "ಕ್ರಾಸ್-ಸೆನ್ಸಾರ್ ಪಕ್ಷಪಾತ ತಿದ್ದುಪಡಿ ಮತ್ತು ನಗರದಾದ್ಯಂತ ಪ್ರಾದೇಶಿಕ ಇಂಟರ್ಪೊಲೇಷನ್.",
        arch3lbl: "ಪ್ರಾದೇಶಿಕ-ಸಮಯ ಮುನ್ಸೂಚಕ", arch3dsc: "ಹವಾಮಾನ, ಹೊರಸೂಸುವಿಕೆ ಮತ್ತು ಐತಿಹಾಸಿಕ ಮಾದರಿಗಳಿಂದ ಮಾಲಿನ್ಯ ಡ್ರಿಫ್ಟ್ ಕಲಿಯುತ್ತದೆ.",
        arch4lbl: "ಎಕ್ಸ್ಪೋಸರ್ ಎಂಜಿನ್", arch4dsc: "ಮುನ್ಸೂಚನೆಗಳನ್ನು ಪ್ರತಿ-ಬಳಕೆದಾರ ಅಪಾಯದ ಸ್ಕೋರ್‌ಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ.",
        arch5lbl: "ಎಚ್ಚರಿಕೆಗಳು & ರೂಟಿಂಗ್", arch5dsc: "ವೈಯಕ್ತಿಕ ಪುಶ್ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಮಾಲಿನ್ಯ-ಜಾಗೃತ ನ್ಯಾವಿಗೇಶನ್."
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS,
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false }
  });

if (typeof window !== "undefined") {
  window.document.documentElement.lang = i18n.resolvedLanguage || i18n.language || "en";
  i18n.on("languageChanged", (lng) => {
    window.localStorage.setItem("airaware-language", lng);
    window.document.documentElement.lang = lng;
  });
}

export default i18n;
