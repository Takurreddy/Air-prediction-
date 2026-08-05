import os

i18n_content = """import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      nav: {
        airQuality: "Air\\nQuality", forecast: "Forecast", routePlanner: "Route\\nPlanner", myExposure: "My\\nExposure", profileAlerts: "Profile &\\nAlerts",
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
        airQuality: "वायु\\nगुणवत्ता", forecast: "पूर्वानुमान", routePlanner: "मार्ग\\nयोजनाकार", myExposure: "मेरा\\nएक्सपोज़र", profileAlerts: "प्रोफ़ाइल और\\nअलर्ट",
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
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
"""

with open("src/i18n.js", "w", encoding="utf-8") as f:
    f.write(i18n_content)
