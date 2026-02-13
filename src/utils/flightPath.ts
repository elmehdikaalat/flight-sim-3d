import * as THREE from 'three';
const EARTH_RADIUS = 6371000;

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

export function createFlightArc(
  lat1: number, 
  lon1: number,
  lat2: number, 
  lon2: number
): THREE.Line {
  const start = latLonToVector3(lat1, lon1, EARTH_RADIUS);
  const end = latLonToVector3(lat2, lon2, EARTH_RADIUS);
  
  const mid = start.clone().add(end).multiplyScalar(0.5);
  const altitude = start.distanceTo(end) * 0.1;
  mid.normalize().multiplyScalar(EARTH_RADIUS + altitude);
  
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const points = curve.getPoints(100);
  
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ 
    color: 0x00ff00,
    opacity: 0.6,
    transparent: true
  });
  
  const line = new THREE.Line(geometry, material);
  
  return line;
}