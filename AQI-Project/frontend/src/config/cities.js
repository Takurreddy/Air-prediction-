/**
 * cities.js — Single source of truth for all 27 monitored Indian cities.
 *
 * Used by Dashboard, RoutePlanner, App.js, and prediction components.
 * Eliminates the 3 previously duplicated CITIES arrays.
 */

const CITIES = [
  // Tier-1 metros
  { name: "Delhi",           state: "Delhi",             lat: 28.6139, lng: 77.2090, defaultAqi: 284 },
  { name: "Mumbai",          state: "Maharashtra",       lat: 19.0760, lng: 72.8777, defaultAqi: 82  },
  { name: "Bengaluru",       state: "Karnataka",         lat: 12.9716, lng: 77.5946, defaultAqi: 42  },
  { name: "Chennai",         state: "Tamil Nadu",        lat: 13.0827, lng: 80.2707, defaultAqi: 68  },
  { name: "Kolkata",         state: "West Bengal",       lat: 22.5726, lng: 88.3639, defaultAqi: 112 },
  { name: "Hyderabad",       state: "Telangana",         lat: 17.3850, lng: 78.4867, defaultAqi: 78  },
  // Tier-2 metros
  { name: "Ahmedabad",       state: "Gujarat",           lat: 23.0225, lng: 72.5714, defaultAqi: 95  },
  { name: "Pune",            state: "Maharashtra",       lat: 18.5204, lng: 73.8567, defaultAqi: 64  },
  { name: "Jaipur",          state: "Rajasthan",         lat: 26.9124, lng: 75.7873, defaultAqi: 135 },
  { name: "Lucknow",         state: "Uttar Pradesh",     lat: 26.8467, lng: 80.9462, defaultAqi: 170 },
  { name: "Surat",           state: "Gujarat",           lat: 21.1702, lng: 72.8311, defaultAqi: 88  },
  { name: "Visakhapatnam",   state: "Andhra Pradesh",    lat: 17.6868, lng: 83.2185, defaultAqi: 56  },
  // State capitals & important cities (15 new additions)
  { name: "Kanpur",          state: "Uttar Pradesh",     lat: 26.4499, lng: 80.3319, defaultAqi: 192 },
  { name: "Nagpur",          state: "Maharashtra",       lat: 21.1458, lng: 79.0882, defaultAqi: 104 },
  { name: "Indore",          state: "Madhya Pradesh",    lat: 22.7196, lng: 75.8577, defaultAqi: 98  },
  { name: "Bhopal",          state: "Madhya Pradesh",    lat: 23.2599, lng: 77.4126, defaultAqi: 108 },
  { name: "Patna",           state: "Bihar",             lat: 25.6093, lng: 85.1376, defaultAqi: 185 },
  { name: "Varanasi",        state: "Uttar Pradesh",     lat: 25.3176, lng: 82.9739, defaultAqi: 162 },
  { name: "Agra",            state: "Uttar Pradesh",     lat: 27.1767, lng: 78.0081, defaultAqi: 155 },
  { name: "Chandigarh",      state: "Chandigarh",        lat: 30.7333, lng: 76.7794, defaultAqi: 89  },
  { name: "Guwahati",        state: "Assam",             lat: 26.1445, lng: 91.7362, defaultAqi: 75  },
  { name: "Thiruvananthapuram", state: "Kerala",          lat: 8.5241,  lng: 76.9366, defaultAqi: 38  },
  { name: "Kochi",           state: "Kerala",            lat: 9.9312,  lng: 76.2673, defaultAqi: 45  },
  { name: "Coimbatore",      state: "Tamil Nadu",        lat: 11.0168, lng: 76.9558, defaultAqi: 52  },
  { name: "Dehradun",        state: "Uttarakhand",       lat: 30.3165, lng: 78.0322, defaultAqi: 72  },
  { name: "Ranchi",          state: "Jharkhand",         lat: 23.3441, lng: 85.3096, defaultAqi: 110 },
  { name: "Bhubaneswar",     state: "Odisha",            lat: 20.2961, lng: 85.8245, defaultAqi: 85  },
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
