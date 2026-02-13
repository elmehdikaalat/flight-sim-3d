import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { latLonToECEF } from './flightsAeroport';

const AIRPLANE_MODEL_URL = '/data/models/Airplane.glb';

export class AirplaneManager {
  private airplanes: Map<string, THREE.Group> = new Map();
  private model: THREE.Group | null = null;
  private scene: THREE.Group;

  constructor(scene: THREE.Group) {
    this.scene = scene;
    this.loadModel();
  }

  private async loadModel() {
    const loader = new GLTFLoader();
    try {
      console.log('Loading airplane model from:', AIRPLANE_MODEL_URL);
      const gltf = await loader.loadAsync(AIRPLANE_MODEL_URL);
      this.model = gltf.scene;
      console.log('Airplane model loaded successfully');
    } catch (error) {
      console.error('Failed to load airplane model:', error);
    }
  }

  updateAirplanes(flights: Array<{
    icao24: string;
    latitude: number;
    longitude: number;
    altitude: number;
    heading: number;
  }>) {
    if (!this.model) return;

    const currentIcaos = new Set(flights.map(f => f.icao24));
    for (const [icao, plane] of this.airplanes.entries()) {
      if (!currentIcaos.has(icao)) {
        this.scene.remove(plane);
        this.airplanes.delete(icao);
      }
    }

    // Update or create planes
    flights.forEach(flight => {
      let airplane = this.airplanes.get(flight.icao24);
      
      if (!airplane) {
        airplane = this.model!.clone();
        airplane.scale.set(50, 50, 50);
        
        // Force white material for visibility
        airplane.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
          }
        });
        
        this.scene.add(airplane);
        this.airplanes.set(flight.icao24, airplane);
      }

      // Position
      const pos = latLonToECEF(flight.latitude, flight.longitude, flight.altitude);
      airplane.position.copy(pos);

      const up = pos.clone().normalize();
      const north = new THREE.Vector3(0, 1, 0);
      const east = new THREE.Vector3().crossVectors(north, up).normalize();
      const actualNorth = new THREE.Vector3().crossVectors(up, east).normalize();

      const headingRad = (flight.heading || 0) * (Math.PI / 180);
      const forward = new THREE.Vector3()
        .addScaledVector(actualNorth, Math.cos(headingRad))
        .addScaledVector(east, Math.sin(headingRad));

      airplane.up.copy(up);
      airplane.lookAt(airplane.position.clone().add(forward));
    });
  }
}