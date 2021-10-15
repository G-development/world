import * as THREE from "./node_modules/three/build/three.module.js";

// Initial stuff
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 1.5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Stars background
const bgTexture = loader.load("images/galaxy_starfield.png");
bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
bgTexture.repeat.set(6, 5);
scene.background = bgTexture;

// Add lights
scene.add(new THREE.AmbientLight(0x333333));

var light = new THREE.DirectionalLight(0x999999, 1);
light.position.set(5, 3, 5);

// Add globe
var globe = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshPhongMaterial({
    map: loader.load("images/2_no_clouds_8k.jpg"),
    bumpMap: loader.load("images/elev_bump_16k.jpg"),
    bumpScale: 0.005,
    specularMap: loader.load("images/water_4k.png"),
    specular: new THREE.Color("white"),
  })
);

// Add clouds
var clouds = new THREE.Mesh(
  new THREE.SphereGeometry(0.503, 32, 32),
  new THREE.MeshPhongMaterial({
    map: loader.load("images/fair_clouds_4k.png"),
    transparent: true,
  })
);

// Add everything to scene
scene.add(light, globe, clouds);

// Manage zoom
document.addEventListener("mousewheel", (event) => {
  event.preventDefault();
  camera.position.z < 1 ? (camera.position.z = 1) : "";
  camera.position.z > 2.5 ? (camera.position.z = 2.25) : "";
  if (camera.position.z >= 1 && camera.position.z <= 2.5) {
    camera.position.z += event.deltaY / 500;
  }
});

// Render
render();
function render() {
  globe.rotation.y += 0.0005;
  clouds.rotation.y += 0.0005;
  requestAnimationFrame(render);
  renderer.render(scene, camera);
}
