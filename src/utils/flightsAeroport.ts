import * as THREE from 'three';

const EARTH_RADIUS = 6378137;

export function latLonToECEF(lat: number, lon: number, alt: number = 0): THREE.Vector3 {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lonRad = THREE.MathUtils.degToRad(lon);
  
  const cosLat = Math.cos(latRad);
  const sinLat = Math.sin(latRad);
  const cosLon = Math.cos(lonRad);
  const sinLon = Math.sin(lonRad);
  
  const N = EARTH_RADIUS / Math.sqrt(1 - 0.00669437999014 * sinLat * sinLat);
  
  const x = (N + alt) * cosLat * cosLon;
  const y = (N + alt) * cosLat * sinLon;
  const z = (N * (1 - 0.00669437999014) + alt) * sinLat;
  
  return new THREE.Vector3(x, y, z);
}

export function createFlightArc(lat1: number, lon1: number, lat2: number, lon2: number): THREE.Line {
  const start = latLonToECEF(lat1, lon1, 0);
  const end = latLonToECEF(lat2, lon2, 0);
  
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const altitude = start.distanceTo(end) * 0.1;
  mid.normalize().multiplyScalar(EARTH_RADIUS + altitude);
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(100);
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0x00ff00, opacity: 0.6, transparent: true });
  
  return new THREE.Line(geometry, material);
}

export function createAirportMarker(lat: number, lon: number): THREE.Mesh {
  const pos = latLonToECEF(lat, lon, 0);
  const geometry = new THREE.SphereGeometry(150, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.copy(pos);
  return marker;
}