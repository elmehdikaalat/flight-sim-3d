export interface FlightState {
  icao24: string;
  callsign: string | null;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
}

export async function fetchLiveFlights(): Promise<FlightState[]> {
  try {
    const url = 'https://opensky-network.org/api/states/all';
    const res = await fetch(url);
    
    if (!res.ok) {
      console.warn('OpenSky API returned', res.status, '- using mock data');
      return getMockFlights();
    }
    
    const data = await res.json();
    
    return data.states
      .filter((s: any) => {
        const lat = s[6];
        const lon = s[5];
        if (!lat || !lon) return false;
        
        const inMorocco = lat >= 21 && lat <= 36 && lon >= -17 && lon <= -1;
        
        const inFrance = lat >= 41 && lat <= 51 && lon >= -5 && lon <= 10;
        
        return inMorocco || inFrance;
      })
      .map((s: any) => ({
        icao24: s[0],
        callsign: s[1]?.trim() || null,
        latitude: s[6],
        longitude: s[5],
        altitude: s[7] || 0,
        velocity: s[9] || 0,
        heading: s[10] || 0
      }));
  } catch (error) {
    console.error('OpenSky API failed:', error);
    return getMockFlights();
  }
}

function getMockFlights(): FlightState[] {
  return [
    {
      icao24: 'mock001',
      callsign: 'AFR1234',
      latitude: 48.8566,  // Paris
      longitude: 2.3522,
      altitude: 10000,
      velocity: 250,
      heading: 180
    },
    {
      icao24: 'mock002',
      callsign: 'RAM456',
      latitude: 33.5731,  // Casablanca
      longitude: -7.5898,
      altitude: 8000,
      velocity: 220,
      heading: 45
    },
    {
      icao24: 'mock003',
      callsign: 'AFR789',
      latitude: 43.6047,  // Lyon
      longitude: 1.4442,
      altitude: 9500,
      velocity: 240,
      heading: 90
    }
  ];
}