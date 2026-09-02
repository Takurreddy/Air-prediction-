/**
 * cities.js — Single source of truth for all 27 monitored Indian cities.
 *
 * Used by Dashboard, RoutePlanner, App.js, and prediction components.
 * Eliminates the 3 previously duplicated CITIES arrays.
 */

const CITIES = [
  // ── Tier-1 Metros ──
  { name: "Delhi",              state: "Delhi",             lat: 28.6139, lng: 77.2090, defaultAqi: 284 },
  { name: "Mumbai",             state: "Maharashtra",       lat: 19.0760, lng: 72.8777, defaultAqi: 82  },
  { name: "Bengaluru",          state: "Karnataka",         lat: 12.9716, lng: 77.5946, defaultAqi: 42  },
  { name: "Chennai",            state: "Tamil Nadu",        lat: 13.0827, lng: 80.2707, defaultAqi: 68  },
  { name: "Kolkata",            state: "West Bengal",       lat: 22.5726, lng: 88.3639, defaultAqi: 112 },
  { name: "Hyderabad",          state: "Telangana",         lat: 17.3850, lng: 78.4867, defaultAqi: 78  },

  // ── NCR & North ──
  { name: "Noida",              state: "Uttar Pradesh",     lat: 28.5355, lng: 77.3910, defaultAqi: 245 },
  { name: "Gurugram",           state: "Haryana",           lat: 28.4595, lng: 77.0266, defaultAqi: 235 },
  { name: "Ghaziabad",          state: "Uttar Pradesh",     lat: 28.6692, lng: 77.4538, defaultAqi: 260 },
  { name: "Faridabad",          state: "Haryana",           lat: 28.4089, lng: 77.3178, defaultAqi: 225 },
  { name: "Chandigarh",         state: "Chandigarh",        lat: 30.7333, lng: 76.7794, defaultAqi: 89  },
  { name: "Amritsar",           state: "Punjab",            lat: 31.6340, lng: 74.8723, defaultAqi: 120 },
  { name: "Ludhiana",           state: "Punjab",            lat: 30.9010, lng: 75.8573, defaultAqi: 130 },
  { name: "Srinagar",           state: "Jammu & Kashmir",   lat: 34.0837, lng: 74.7973, defaultAqi: 48  },
  { name: "Jammu",              state: "Jammu & Kashmir",   lat: 32.7266, lng: 74.8570, defaultAqi: 72  },
  { name: "Shimla",             state: "Himachal Pradesh",  lat: 31.1048, lng: 77.1734, defaultAqi: 35  },
  { name: "Dehradun",           state: "Uttarakhand",       lat: 30.3165, lng: 78.0322, defaultAqi: 72  },

  // ── Uttar Pradesh & Bihar ──
  { name: "Lucknow",            state: "Uttar Pradesh",     lat: 26.8467, lng: 80.9462, defaultAqi: 170 },
  { name: "Kanpur",             state: "Uttar Pradesh",     lat: 26.4499, lng: 80.3319, defaultAqi: 192 },
  { name: "Varanasi",           state: "Uttar Pradesh",     lat: 25.3176, lng: 82.9739, defaultAqi: 162 },
  { name: "Agra",               state: "Uttar Pradesh",     lat: 27.1767, lng: 78.0081, defaultAqi: 155 },
  { name: "Meerut",             state: "Uttar Pradesh",     lat: 28.9845, lng: 77.7064, defaultAqi: 185 },
  { name: "Patna",              state: "Bihar",             lat: 25.6093, lng: 85.1376, defaultAqi: 185 },
  { name: "Gaya",               state: "Bihar",             lat: 24.7914, lng: 85.0002, defaultAqi: 160 },

  // ── West & Central ──
  { name: "Ahmedabad",          state: "Gujarat",           lat: 23.0225, lng: 72.5714, defaultAqi: 95  },
  { name: "Surat",              state: "Gujarat",           lat: 21.1702, lng: 72.8311, defaultAqi: 88  },
  { name: "Vadodara",           state: "Gujarat",           lat: 22.3072, lng: 73.1812, defaultAqi: 92  },
  { name: "Rajkot",             state: "Gujarat",           lat: 22.3039, lng: 70.8022, defaultAqi: 86  },
  { name: "Jaipur",             state: "Rajasthan",         lat: 26.9124, lng: 75.7873, defaultAqi: 135 },
  { name: "Jodhpur",            state: "Rajasthan",         lat: 26.2389, lng: 73.0243, defaultAqi: 110 },
  { name: "Udaipur",            state: "Rajasthan",         lat: 24.5854, lng: 73.7125, defaultAqi: 85  },
  { name: "Pune",               state: "Maharashtra",       lat: 18.5204, lng: 73.8567, defaultAqi: 64  },
  { name: "Nagpur",             state: "Maharashtra",       lat: 21.1458, lng: 79.0882, defaultAqi: 104 },
  { name: "Nashik",             state: "Maharashtra",       lat: 19.9975, lng: 73.7898, defaultAqi: 70  },
  { name: "Aurangabad",         state: "Maharashtra",       lat: 19.8762, lng: 75.3433, defaultAqi: 78  },
  { name: "Bhopal",             state: "Madhya Pradesh",    lat: 23.2599, lng: 77.4126, defaultAqi: 108 },
  { name: "Indore",             state: "Madhya Pradesh",    lat: 22.7196, lng: 75.8577, defaultAqi: 98  },
  { name: "Gwalior",            state: "Madhya Pradesh",    lat: 26.2183, lng: 78.1828, defaultAqi: 145 },
  { name: "Jabalpur",           state: "Madhya Pradesh",    lat: 23.1815, lng: 79.9864, defaultAqi: 90  },
  { name: "Raipur",             state: "Chhattisgarh",      lat: 21.2514, lng: 81.6296, defaultAqi: 115 },

  // ── East & North-East ──
  { name: "Ranchi",             state: "Jharkhand",         lat: 23.3441, lng: 85.3096, defaultAqi: 110 },
  { name: "Jamshedpur",         state: "Jharkhand",         lat: 22.8046, lng: 86.2029, defaultAqi: 105 },
  { name: "Dhanbad",            state: "Jharkhand",         lat: 23.7957, lng: 86.4304, defaultAqi: 135 },
  { name: "Bhubaneswar",        state: "Odisha",            lat: 20.2961, lng: 85.8245, defaultAqi: 85  },
  { name: "Cuttack",            state: "Odisha",            lat: 20.4625, lng: 85.8828, defaultAqi: 80  },
  { name: "Siliguri",           state: "West Bengal",       lat: 26.7271, lng: 88.3953, defaultAqi: 82  },
  { name: "Asansol",            state: "West Bengal",       lat: 23.6739, lng: 86.9524, defaultAqi: 125 },
  { name: "Guwahati",           state: "Assam",             lat: 26.1445, lng: 91.7362, defaultAqi: 75  },
  { name: "Shillong",           state: "Meghalaya",         lat: 25.5788, lng: 91.8933, defaultAqi: 35  },
  { name: "Imphal",             state: "Manipur",           lat: 24.8170, lng: 93.9368, defaultAqi: 40  },
  { name: "Agartala",           state: "Tripura",           lat: 23.8315, lng: 91.2868, defaultAqi: 50  },

  // ── South ──
  { name: "Visakhapatnam",      state: "Andhra Pradesh",    lat: 17.6868, lng: 83.2185, defaultAqi: 56  },
  { name: "Vijayawada",         state: "Andhra Pradesh",    lat: 16.5062, lng: 80.6480, defaultAqi: 62  },
  { name: "Tirupati",           state: "Andhra Pradesh",    lat: 13.6288, lng: 79.4192, defaultAqi: 45  },
  { name: "Coimbatore",         state: "Tamil Nadu",        lat: 11.0168, lng: 76.9558, defaultAqi: 52  },
  { name: "Madurai",            state: "Tamil Nadu",        lat: 9.9252,  lng: 78.1198, defaultAqi: 58  },
  { name: "Salem",              state: "Tamil Nadu",        lat: 11.6643, lng: 78.1460, defaultAqi: 65  },
  { name: "Kochi",              state: "Kerala",            lat: 9.9312,  lng: 76.2673, defaultAqi: 45  },
  { name: "Thiruvananthapuram", state: "Kerala",            lat: 8.5241,  lng: 76.9366, defaultAqi: 38  },
  { name: "Kozhikode",          state: "Kerala",            lat: 11.2588, lng: 75.7804, defaultAqi: 42  },
  { name: "Mysuru",             state: "Karnataka",         lat: 12.2958, lng: 76.6394, defaultAqi: 40  },
  { name: "Mangaluru",          state: "Karnataka",         lat: 12.9141, lng: 74.8560, defaultAqi: 48  },
  { name: "Panaji",             state: "Goa",               lat: 15.4909, lng: 73.8278, defaultAqi: 35  },
  { name: "Puducherry",         state: "Puducherry",        lat: 11.9416, lng: 79.8083, defaultAqi: 52  },
];

export default CITIES;

/**
 * Find the nearest city to a given lat/lng pair.
 * @param {number} lat
 * @param {number} lng
 * @returns {string} City name
 */
export function getNearestCity(lat, lng) {
  let nearest = null;
  let minDist = Infinity;
  for (const c of CITIES) {
    const d = Math.hypot(c.lat - lat, c.lng - lng);
    if (d < minDist) {
      minDist = d;
      nearest = c.name;
    }
  }
  return nearest;
}
