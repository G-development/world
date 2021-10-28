import * as d3 from "d3";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GeoJsonGeometry } from "three-geojson-geometry";
import $ from "jquery";

import * as utils from "./x-utils";
import vShader from "./shaders/vertex";
import fShader from "./shaders/fragment";

import "../static/LatLon/countries";

// Initial stuff
const scene = new THREE.Scene();
const loader = new THREE.TextureLoader();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);
document.getElementById("world").appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.z = 1.2;
controls.update();

// Stars background
const bgTexture = loader.load("images/galaxy_starfield.png");
bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
bgTexture.repeat.set(6, 5);
scene.background = bgTexture;

// Add lights
scene.add(new THREE.AmbientLight(0x333333));

var light = new THREE.DirectionalLight(0x999999, 1);
light.position.set(5, 3, 5);
var light2 = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);

// Add globe
var globe = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshPhongMaterial({
    // map: loader.load("images/2_no_clouds_8k.jpg"),
    // bumpMap: loader.load("images/elev_bump_16k.jpg"),
    // bumpScale: 0.005,
    // specularMap: loader.load("images/water_4k.png"),
    // specular: new THREE.Color("white"),
    // map: loader.load("images/map_outline.png"),
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

// Add glow
var worldGlow = new THREE.Mesh(
  new THREE.SphereGeometry(0.58, 32, 32),
  new THREE.ShaderMaterial({
    uniforms: {
      c: { type: "f", value: 0.5 },
      p: { type: "f", value: 3.0 },
    },
    vertexShader: vShader,
    fragmentShader: fShader,
    side: THREE.BackSide,
  })
);

// Add all countries from countries.js
// let temp = { x: 0, y: 0, z: 0 };
// // let temp = utils.calcPosFromLatLonRad(country["Italy"], 0.5);
// Object.keys(country).map(function (key, index) {
//   let mesh = new THREE.Mesh(
//     new THREE.SphereBufferGeometry(0.003, 1, 1),
//     new THREE.MeshBasicMaterial({ color: 0xff0000 })
//   );
//   let pos = utils.calcPosFromLatLonRad(country[key], 0.5);
//   mesh.position.set(pos.x, pos.y, pos.z);
//   scene.add(mesh);

//   // getCurve(temp, pos);
//   // temp = pos;
// });

// example of usage: getCurve(pos, pos2);
function getCurve(p1, p2) {
  let v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
  let v2 = new THREE.Vector3(p2.x, p2.y, p2.z);
  let points = [];

  for (let i = 0; i < 20; i++) {
    let p = new THREE.Vector3().lerpVectors(v1, v2, i / 20);
    p.normalize();
    p.multiplyScalar(0.5 + 0.1 * Math.sin((Math.PI * i) / 20));
    points.push(p);
  }

  let path = new THREE.CatmullRomCurve3(points);

  const geometry = new THREE.TubeGeometry(path, 20, 0.001, 8, false);
  const material = new THREE.MeshBasicMaterial({ color: 0xa8a8a8 });
  const line = new THREE.Mesh(geometry, material);
  scene.add(line);
}

// Create polygons starting from geojson
fetch("LatLon/globe_lo.geojson")
  .then((res) => res.json())
  .then((countries) => {
    const alt = 0.5;

    const lineObjs = [
      new THREE.LineSegments(
        new GeoJsonGeometry(d3.geoGraticule10(), alt),
        new THREE.LineBasicMaterial({
          color: "white",
          opacity: 0.04,
          transparent: true,
        }),
        new THREE.MeshPhongMaterial({
          col: new THREE.Color("red"),
        })
      ),
    ];

    const materials = [
      new THREE.LineBasicMaterial({ color: "black" }), // outer ring
      new THREE.LineBasicMaterial({ color: "red" }), // inner holes
    ];

    countries.features.forEach(({ properties, geometry }) => {
      lineObjs.push(
        new THREE.LineSegments(
          new GeoJsonGeometry(geometry, alt),
          materials
        )
      );
    })
    lineObjs.forEach((obj) => scene.add(obj));
  });

// Add everything to scene
scene.add(
  // light,
  light2,
  globe,
  // clouds,
  // worldGlow
);

// Render
render();
function render() {
  requestAnimationFrame(render);
  // globe.rotation.y += 0.0003;
  // clouds.rotation.y += 0.0004;
  controls.update();
  renderer.render(scene, camera);
}
