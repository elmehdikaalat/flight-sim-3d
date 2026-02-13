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
    const res = await fetch('http://localhost:3001/api/flights');
    const data = await res.json();
    
    if (!data || !data.states) {
      console.warn('No states in response');
      return getMockFlights();
    }
    
    return data.states
      .filter((s: any) => {
        const lat = s[6], lon = s[5];
        return lat && lon && (
          (lat >= 21 && lat <= 36 && lon >= -17 && lon <= -1) ||
          (lat >= 41 && lat <= 51 && lon >= -5 && lon <= 10)
        );
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
    console.error('Fetch error:', error);
    return getMockFlights();
  }
}

function getMockFlights(): FlightState[] | PromiseLike<FlightState[]> {
  throw new Error("Function not implemented.");
}
