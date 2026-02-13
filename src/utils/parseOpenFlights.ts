export interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string;
  lat: number;
  lon: number;
}

export interface Route {
  source: string;
  dest: string;
}

export async function parseAirports(): Promise<Map<string, Airport>> {
  const response = await fetch('/data/airports.dat');
  const text = await response.text();
  const airports = new Map<string, Airport>();
  
  text.split('\n').forEach(line => {
    const parts = line.split(',');
    if (parts.length < 8) return;
    
    const iata = parts[4].replace(/"/g, '');
    const country = parts[3].replace(/"/g, '');
    
    if (country !== 'Morocco' && country !== 'France') return;
    if (!iata || iata === '\\N') return;
    
    airports.set(iata, {
      id: parts[0],
      name: parts[1].replace(/"/g, ''),
      city: parts[2].replace(/"/g, ''),
      country,
      iata,
      lat: parseFloat(parts[6]),
      lon: parseFloat(parts[7])
    });
  });
  
  return airports;
}

export async function parseRoutes(airports: Map<string, Airport>): Promise<Route[]> {
  const response = await fetch('/data/routes.dat');
  const text = await response.text();
  const routes: Route[] = [];
  
  text.split('\n').forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    
    const source = parts[2];
    const dest = parts[4];
    
    if (airports.has(source) && airports.has(dest)) {
      const srcCountry = airports.get(source)!.country;
      const dstCountry = airports.get(dest)!.country;
      
      if ((srcCountry === 'Morocco' && dstCountry === 'France') ||
          (srcCountry === 'France' && dstCountry === 'Morocco')) {
        routes.push({ source, dest });
      }
    }
  });
  
  return routes;
}