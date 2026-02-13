import * as THREE from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { TilesRenderer, GlobeControls } from '3d-tiles-renderer';
import {
  CesiumIonAuthPlugin,
  GLTFExtensionsPlugin,
  TilesFadePlugin,
  UpdateOnChangePlugin
} from '3d-tiles-renderer/plugins';
import './style.css';
import { parseAirports, parseRoutes } from './utils/parseOpenFlights';
import { createAirportMarker, createFlightArc } from './utils/flightsAeroport';
import { fetchLiveFlights } from './services/opensky';
import { AirplaneManager } from './utils/airplaneManager';

const ION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1YWNlZjFhMC04MTM0LTQxYWQtYjFhMC0zZGJlNmYxODJmYWMiLCJpZCI6MzkwMjcxLCJpYXQiOjE3NzA5Nzk2Mzh9.3dK3gBHOPbthNMljAA68u89jq5hNracaXeOUPMVjFHA';

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let tiles: TilesRenderer;
let controls: GlobeControls;

function init() {
  // Camera 
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100);
  
  const distance = 15000000;
  const centerLat = 40;
  const centerLon = 0;
  
  const phi = (0 - centerLat) * (Math.PI / 180);
  const theta = (centerLon + 185) * (Math.PI / 180);
  
  camera.position.set(
    distance * Math.sin(phi) * Math.cos(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.sin(theta)
  );
  camera.lookAt(0, 0, 0);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // DRACO Loader
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  dracoLoader.setDecoderConfig({ type: 'js' });

  // 3D Tiles
  tiles = new TilesRenderer();
  tiles.registerPlugin(new CesiumIonAuthPlugin({
    apiToken: ION_KEY,
    assetId: '2275207',
    autoRefreshToken: true
  }));
  tiles.registerPlugin(new GLTFExtensionsPlugin({ dracoLoader }));
  tiles.registerPlugin(new TilesFadePlugin());
  tiles.registerPlugin(new UpdateOnChangePlugin());
  tiles.setCamera(camera);
  tiles.setResolutionFromRenderer(camera, renderer);
  scene.add(tiles.group);

  // Rotate globe
  tiles.group.rotation.x = -Math.PI / 2;

  // Stars
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 50000000;
    const y = (Math.random() - 0.5) * 50000000;
    const z = (Math.random() - 0.5) * 50000000;
    starsVertices.push(x, y, z);
  }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Lights for airplane models
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const flightGroup = new THREE.Group();
  flightGroup.rotation.x = -Math.PI / 2;
  scene.add(flightGroup);

  // Load and display flight paths
  (async () => {
    const airports = await parseAirports();
    const routes = await parseRoutes(airports);
    console.log(`Loaded ${airports.size} airports, ${routes.length} routes`);

    console.log('Airports found:');
    airports.forEach(a => console.log(`${a.iata}: ${a.country} - lat:${a.lat}, lon:${a.lon}`));

    airports.forEach(airport => {
      const marker = createAirportMarker(airport.lat, airport.lon);
      flightGroup.add(marker);
    });

    routes.forEach(route => {
      const src = airports.get(route.source)!;
      const dst = airports.get(route.dest)!;
      const arc = createFlightArc(src.lat, src.lon, dst.lat, dst.lon);
      flightGroup.add(arc);
    });

    // Initialize airplane manager
    const airplaneManager = new AirplaneManager(flightGroup);

    async function updateLiveFlights() {
      const flights = await fetchLiveFlights();
      console.log(`${flights.length} live flights in Morocco-France region`);
      
      flights.forEach(flight => {
        console.log(`  ${flight.callsign || flight.icao24}: ${flight.latitude.toFixed(2)}°N, ${flight.longitude.toFixed(2)}°E @ ${Math.round(flight.altitude)}m`);
      });

      // Update airplane 3D models
      airplaneManager.updateAirplanes(flights);
    }

    // Initial fetch
    updateLiveFlights();
    
    setInterval(updateLiveFlights, 10000);
  })();

  // Controls
  controls = new GlobeControls(scene, camera, renderer.domElement, tiles);
  controls.enableDamping = true;

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  tiles.setResolutionFromRenderer(camera, renderer);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  tiles.update();
  renderer.render(scene, camera);
}

init();