/**
 * useLocationTranslation — Custom hook for translating city names to the current locale.
 *
 * Supports search aliases for regional city names (Hindi, Tamil, Telugu, Kannada).
 * Usage:
 *   const { translateCity, searchCities } = useLocationTranslation();
 *   const localName = translateCity("Mumbai");  // "मुंबई" when locale is "hi"
 *   const results = searchCities("मुंबई");      // [{ name: "Mumbai", ... }]
 */
import { useTranslation } from "react-i18next";
import CITIES from "../config/cities";

const CITY_TRANSLATIONS = {
  hi: {
    Delhi: "दिल्ली", Mumbai: "मुंबई", Bengaluru: "बेंगलुरु", Chennai: "चेन्नई",
    Kolkata: "कोलकाता", Hyderabad: "हैदराबाद", Ahmedabad: "अहमदाबाद", Pune: "पुणे",
    Jaipur: "जयपुर", Lucknow: "लखनऊ", Surat: "सूरत", Visakhapatnam: "विशाखापत्तनम",
    Kanpur: "कानपुर", Nagpur: "नागपुर", Indore: "इंदौर", Bhopal: "भोपाल",
    Patna: "पटना", Varanasi: "वाराणसी", Agra: "आगरा", Chandigarh: "चंडीगढ़",
    Guwahati: "गुवाहाटी", Thiruvananthapuram: "तिरुवनंतपुरम", Kochi: "कोच्चि",
    Coimbatore: "कोयंबटूर", Dehradun: "देहरादून", Ranchi: "रांची", Bhubaneswar: "भुवनेश्वर",
    Noida: "नोएडा", Gurugram: "गुरुग्राम", Ghaziabad: "गाजियाबाद", Faridabad: "फरीदाबाद",
    Amritsar: "अमृतसर", Ludhiana: "लुधियाना", Srinagar: "श्रीनगर", Jammu: "जम्मू",
    Shimla: "शिमला", Meerut: "मेरठ", Jodhpur: "जोधपुर", Udaipur: "उदयपुर",
    Vadodara: "वडोदरा", Rajkot: "राजकोट", Nashik: "नासिक", Aurangabad: "औरंगाबाद",
    Gwalior: "ग्वालियर", Jabalpur: "जबलपुर", Raipur: "रायपुर", Gaya: "गया",
    Cuttack: "कटक", Siliguri: "सिलीगुड़ी", Asansol: "आसनसोल", Shillong: "शिलांग",
    Imphal: "इम्फाल", Agartala: "अगरतला", Vijayawada: "विजयवाड़ा", Tirupati: "तिरुपति",
    Madurai: "मदुरै", Salem: "सलेम", Kozhikode: "कोझिकोड", Mysuru: "मैसूर",
    Mangaluru: "मंगलुरु", Panaji: "पणजी", Puducherry: "पुडुचेरी",
    Haridwar: "हरिद्वार", Rishikesh: "ऋषिकेश", Patiala: "पटियाला",
    Prayagraj: "प्रयागराज", Gorakhpur: "गोरखपुर", Mathura: "मथुरा",
    Tiruchirappalli: "तिरुचिरापल्ली", Vellore: "वेल्लोर", Warangal: "वारंगल",
    Nellore: "नेल्लोर", Hubli: "हुबली", Thrissur: "त्रिशूर",
    Ongole: "ओंगोल", Kakinada: "काकीनाडा", Kanigiri: "कनिगिरी", Rajahmundry: "राजमुंदरी",
    Thane: "ठाणे", "Navi Mumbai": "नवी मुंबई", Kalyan: "कल्याण", "Vasai-Virar": "वसई-विरार",
    Kanchipuram: "कांचीपुरम", Chengalpattu: "चेंगलपट्टु", Tiruvallur: "तिरुवल्लूर", Tambaram: "ताम्बरम"
  },
  ta: {
    Chennai: "சென்னை", Coimbatore: "கோயம்புத்தூர்", Delhi: "டெல்லி",
    Mumbai: "மும்பை", Bengaluru: "பெங்களூர்", Kolkata: "கொல்கத்தா",
    Hyderabad: "ஐதராபாத்", Thiruvananthapuram: "திருவனந்தபுரம்",
    Kochi: "கொச்சி",
  },
  te: {
    Hyderabad: "హైదరాబాద్", Visakhapatnam: "విశాఖపట్నం", Chennai: "చెన్నై",
    Delhi: "ఢిల్లీ", Mumbai: "ముంబై", Bengaluru: "బెంగళూరు",
    Kolkata: "కోల్‌కతా",
  },
  kn: {
    Bengaluru: "ಬೆಂಗಳೂರು", Chennai: "ಚೆನ್ನೈ", Delhi: "ದೆಹಲಿ",
    Mumbai: "ಮುಂಬೈ", Hyderabad: "ಹೈದರಾಬಾದ್", Kolkata: "ಕೊಲ್ಕತ್ತಾ",
  },
};

// Build reverse lookup: regional name → English name
const REVERSE_ALIASES = {};
for (const [, translations] of Object.entries(CITY_TRANSLATIONS)) {
  for (const [eng, local] of Object.entries(translations)) {
    REVERSE_ALIASES[local.toLowerCase()] = eng;
  }
}

// Common English aliases
const ENGLISH_ALIASES = {
  bombay: "Mumbai", bangalore: "Bengaluru", madras: "Chennai",
  calcutta: "Kolkata", benares: "Varanasi", vizag: "Visakhapatnam",
  trivandrum: "Thiruvananthapuram", cochin: "Kochi", mysore: "Mysuru",
};

export default function useLocationTranslation() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.split("-")[0] || "en";

  /**
   * Translate an English city name to the current locale.
   * Falls back to the English name if no translation exists.
   */
  function translateCity(englishName) {
    const translations = CITY_TRANSLATIONS[lang];
    return translations?.[englishName] || englishName;
  }

  /**
   * Search cities by query string — supports regional names and common aliases.
   * Returns matching CITIES entries.
   */
  function searchCities(query) {
    if (!query || !query.trim()) return CITIES;

    const q = query.trim().toLowerCase();

    // Check reverse aliases (regional → English)
    const aliasMatch = REVERSE_ALIASES[q] || ENGLISH_ALIASES[q];
    if (aliasMatch) {
      return CITIES.filter(c => c.name === aliasMatch);
    }

    // Search in English names
    const englishMatches = CITIES.filter(c =>
      c.name.toLowerCase().includes(q)
    );
    if (englishMatches.length > 0) return englishMatches;

    // Search in translated names for current locale
    const translations = CITY_TRANSLATIONS[lang] || {};
    const translatedMatches = [];
    for (const [eng, local] of Object.entries(translations)) {
      if (local.toLowerCase().includes(q)) {
        const city = CITIES.find(c => c.name === eng);
        if (city) translatedMatches.push(city);
      }
    }

    return translatedMatches;
  }

  return { translateCity, searchCities };
}
