import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";

import vShader from "./shaders/vertex";
import fShader from "./shaders/fragment";

import { countryColorMap } from "./x-utils";

var container, scene, camera, renderer, controls, info;
var raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2(),
  mapCanvas,
  mapContext,
  lookupCanvas,
  lookupContext,
  lookupTexture,
  composer;

var mesh;

init();
animate();

function init() {
  /* INITIAL STUFFS */
  var loader = new THREE.TextureLoader();

  scene = new THREE.Scene();
  var SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    VIEW_ANGLE = 45,
    ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT,
    NEAR = 0.1,
    FAR = 20000;
  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
  scene.add(camera);
  camera.position.set(0, 250, 250);
  camera.lookAt(scene.position);

  // renderer = new THREE.WebGLRenderer({ antialias: false });
  // renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

  // renderer.sortObjects = false;
  // renderer.generateMipmaps = false;
  // renderer.setClearColor(0x000000);
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // document.getElementById("world").appendChild(renderer.domElement);
  } catch (noWebGL) {
    renderer = new THREE.CanvasRenderer();
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    scene.add(light); // materials are solid black without the light
  }
  renderer.setClearColor(0x000000);

  /* START */
  container = document.getElementById("world");
  container.appendChild(renderer.domElement);

  info = container.appendChild(document.createElement("div"));
  info.className = "info";

  controls = new OrbitControls(camera, renderer.domElement);

  // BACKGROUND
  const bgTexture = loader.load("images/galaxy_starfield.png");
  bgTexture.wrapS = bgTexture.wrapT = THREE.RepeatWrapping;
  bgTexture.repeat.set(6, 5);
  scene.background = bgTexture;

  // LIGHT
  var light = new THREE.PointLight(0xffffff);
  light.position.set(100, 250, 100);

  // Create the "lookup texture", which contains a colored pixel for each country
  //  -- the pixel at (x,1) is the color of the country labelled with gray RGB_Color(x,x,x,1).
  lookupCanvas = document.createElement("canvas");
  lookupCanvas.width = 256;
  lookupCanvas.height = 1;
  lookupContext = lookupCanvas.getContext("2d");
  lookupTexture = new THREE.Texture(lookupCanvas);
  lookupTexture.magFilter = THREE.NearestFilter;
  lookupTexture.minFilter = THREE.NearestFilter;
  lookupTexture.needsUpdate = true;

  // Countries index greyscale
  var mapTexture = loader.load("images/earth-index-shifted-gray.png");
  mapTexture.magFilter = THREE.NearestFilter;
  mapTexture.minFilter = THREE.NearestFilter;
  mapTexture.needsUpdate = true;

  // Outline of countries
  var outlineTexture = loader.load("images/earth-outline-shifted-gray.png");
  outlineTexture.needsUpdate = true;

  // Earth image
  var blendImage = loader.load("images/earth-day.jpg");
  // var blendImage = loader.load("images/2_no_clouds_8k.jpg");

  // Create shader material
  var planeMaterial = new THREE.ShaderMaterial({
    uniforms: {
      width: { type: "f", value: window.innerWidth },
      height: { type: "f", value: window.innerHeight },
      mapIndex: { type: "t", value: mapTexture }, // pass the countries indexed greyscale
      outline: { type: "t", value: outlineTexture }, // pass the outline of countries
      lookup: { type: "t", value: lookupTexture }, // pass the 256x1px canvas with greyscale
      blendImage: { type: "t", value: blendImage }, // earth image
    },
    vertexShader: vShader,
    fragmentShader: fShader,
  });

  var geometry = new THREE.SphereGeometry(100, 64, 32);
  mesh = new THREE.Mesh(geometry, planeMaterial);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  document.addEventListener("mousemove", mouseMove, false);
  document.addEventListener("click", mouseClick, false);

  mapCanvas = document.createElement("canvas");
  mapCanvas.width = 4096;
  mapCanvas.height = 2048;
  mapContext = mapCanvas.getContext("2d");
  var imageObj = new Image();
  imageObj.src = "images/earth-index-shifted-gray.png";
  imageObj.onload = function () {
    mapContext.drawImage(imageObj, 0, 0);
  };

  /* POST PROCESSING */
  renderer.autoClear = false;

  composer = new EffectComposer(renderer);

  var renderModel = new RenderPass(scene, camera);

  var effectFXAA = new ShaderPass(FXAAShader);
  var width = window.innerWidth || 2;
  var height = window.innerHeight || 2;
  effectFXAA.uniforms["resolution"].value.set(1 / width, 1 / height);

  var effectCopy = new ShaderPass(CopyShader);
  effectCopy.renderToScreen = true;

  composer.addPass(renderModel);
  composer.addPass(effectFXAA);
  composer.addPass(effectCopy);
}

function mouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function mouseClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  console.log("Clicked in: x:", mouse.x, " y:", mouse.y);
  var countryCode = -1;
  raycaster.setFromCamera(mouse, camera);
  // calculate objects intersecting the picking ray
  const intersectionList = raycaster.intersectObjects(scene.children);
  // console.log("intersectionList", intersectionList);
  if (intersectionList.length > 0) {
    var data = intersectionList[0];
    var d = data.point.clone().normalize();
    var u = Math.round(
      4096 * (1 - (0.5 + Math.atan2(d.z, d.x) / (2 * Math.PI)))
    );
    var v = Math.round(2048 * (0.5 - Math.asin(d.y) / Math.PI));
    var p = mapContext.getImageData(u, v, 1, 1).data;
    countryCode = p[0];

    for (var prop in countryColorMap) {
      if (countryColorMap.hasOwnProperty(prop)) {
        if (
          intersectionList.length > 0 &&
          countryColorMap[prop] === countryCode
        )
          document.querySelector(".info").innerText = prop + " " + countryCode;
        debugger;
        document.querySelector(".info").style.top = event.clientY + "px";
        document.querySelector(".info").style.left = event.clientX + "px";
        // console.log("Clicked:", prop, countryCode);
      }
    }

    lookupContext.clearRect(0, 0, 256, 1);

    for (var i = 0; i < 228; i++) {
      if (i == 0) lookupContext.fillStyle = "rgba(0, 0, 0, 1.0)";
      // water
      else if (i == countryCode)
        lookupContext.fillStyle = "rgba(50, 50, 0, 0.5)";
      // selected country
      else lookupContext.fillStyle = "rgba(0, 0, 0, 1.0)";

      lookupContext.fillRect(i, 0, 1, 1);
    }

    lookupTexture.needsUpdate = true;
  }
}

function animate() {
  requestAnimationFrame(animate);
  render();
  update();
}

function update() {
  controls.update();
  if (camera.position.length() < 300) camera.position.setLength(300);
  if (camera.position.length() > 1000) camera.position.setLength(1000);
}

function render() {
  renderer.clear();
  renderer.render(scene, camera);
  // composer.render(); // use this line for anti-aliasing
}
