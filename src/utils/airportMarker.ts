import * as THREE from 'three';

const EARTH_RADIUS = 6371000;

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (lat) * (Math.PI / 180);
  const theta = (lon) * (Math.PI / 180);
  
  const x = radius * Math.cos(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi);
  const z = radius * Math.cos(phi) * Math.sin(theta);
  
  return new THREE.Vector3(x, y, z);
}

export function createAirportMarker(lat: number, lon: number): THREE.Mesh {
  const pos = latLonToVector3(lat, lon, EARTH_RADIUS + 10000);
  
  const geometry = new THREE.SphereGeometry(15000, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const marker = new THREE.Mesh(geometry, material);
  marker.position.copy(pos);
  
  return marker;
}