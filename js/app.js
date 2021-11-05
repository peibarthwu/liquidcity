import * as THREE from 'three';
import vertexShader from './shaders/vertexShader.glsl';
import fragmentShader from './shaders/fragmentShader.glsl';
import staticVertexShader from './shaders/staticVertexShader.glsl';
import basicFragmentShader from './shaders/basicFragment.glsl';
import rgbFragment from './shaders/rgbFragment.glsl';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GLTFLoader } from 'three/examples/js/loaders/GLTFLoader.js'

let scrollable = document.querySelector('.scrollable');

let current = 0;
let target = 0;
let ease = 0.075;
let perspective = 10;

let uMouse = new THREE.Vector2(0, 0);

// Linear inetepolation
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// init function triggered on page load to set the body height to enable scrolling and EffectCanvas initialised
function init() {
    document.body.style.height = `${scrollable.getBoundingClientRect().height}px`;
}

// translate the scrollable div using the lerp function for the smooth scrolling effect.
function smoothScroll() {
    target = window.scrollY;
    current = lerp(current, target, ease);
    scrollable.style.transform = `translate3d(0,${-current}px, 0)`;
}


class EffectCanvas {
    constructor() {
        this.container = document.querySelector('main');
        this.images = [...document.querySelectorAll('.mesh')];
        this.stem = document.getElementById('stem');

        this.meshItems = []; // Used to store all meshes we will be creating.
        this.setupCamera();
        //this.addObjects();
        this.createMeshItems();
        this.render();
    }

    // Getter function used to get screen dimensions used for the camera and mesh materials
    get viewport() {
        let width = window.innerWidth;
        let height = window.innerHeight;
        let aspectRatio = width / height;
        return {
            width,
            height,
            aspectRatio
        };
    }

    setupCamera() {

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
        document.addEventListener('mousemove', (e) => {
            // mousemove / touchmove
            uMouse.x = (e.clientX / window.innerWidth);
            uMouse.y = 1. - (e.clientY / window.innerHeight);
        });

        // Create new scene
        this.scene = new THREE.Scene();

        // Initialize perspective camera

        const fov = (180 * (2 * Math.atan(window.innerHeight / 2 / perspective))) / Math.PI; // see fov image for a picture breakdown of this fov setting.
        this.camera = new THREE.PerspectiveCamera(fov, this.viewport.aspectRatio, 1, 1000)
        this.camera.position.set(0, 0, perspective); // set the camera position on the z axis.
        this.scene.fog = new THREE.FogExp2(0xffffff, 1.);

        // renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.viewport.width, this.viewport.height); // uses the getter viewport function above to set size of canvas / renderer
        this.renderer.setPixelRatio(window.devicePixelRatio); // Import to ensure image textures do not appear blurred.
        this.container.appendChild(this.renderer.domElement); // append the canvas to the main element
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // CREDIT SHADER FROM https://github.com/akella/webgl-mouseover-effects/
        var myEffect = {
            uniforms: {
                "tDiffuse": { value: null },
                "resolution": { value: new THREE.Vector2(1., window.innerHeight / window.innerWidth) },
                "uMouse": { value: new THREE.Vector2(-10, -10) },
                "uVelo": { value: 0 },
            },
            vertexShader: `varying vec2 vUv;void main() {vUv = uv;gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );}`,
            fragmentShader: `uniform float time;
            uniform sampler2D tDiffuse;
            uniform vec2 resolution;
            varying vec2 vUv;
            uniform vec2 uMouse;
            float circle(vec2 uv, vec2 disc_center, float disc_radius, float border_size) {
              uv -= disc_center;
              uv*=resolution;
              float dist = sqrt(dot(uv, uv));
              return smoothstep(disc_radius+border_size, disc_radius-border_size, dist);
            }
            void main()  {
                vec2 newUV = vUv;
                float c = circle(vUv, uMouse, 0.0, 0.2);
                float r = texture2D(tDiffuse, newUV.xy += c * (0.1 * .5)).x;
                float g = texture2D(tDiffuse, newUV.xy += c * (0.1 * .525)).y;
                float b = texture2D(tDiffuse, newUV.xy += c * (0.1 * .55)).z;
                vec4 color = vec4(r, g, b, 1.);
                gl_FragColor = color;
            }`
        }

        this.customPass = new ShaderPass(myEffect);
        this.customPass.renderToScreen = true;
        this.composer.addPass(this.customPass);
    }

    // addObjects() {
    //     const loader = new GLTFLoader();
    //     console.log(gltf.scene);

    //     // Load a glTF resource
    //     loader.load(
    //         // resource URL
    //         MODEL,
    //         // called when the resource is loaded
    //         function (gltf) {
    //             this.scene.add(gltf.scene); 
    //             gltf.scene.position.set(0,0,4)  
    //             console.log(gltf.scene);
    //         },
    //         // called when loading has errors
    //         function (error) {
    //             console.log(error);
    //         }
    //     );
    // }

    onWindowResize() {
        init();
        this.camera.aspect = this.viewport.aspectRatio; // readjust the aspect ratio.
        this.camera.updateProjectionMatrix(); // Used to recalulate projectin dimensions.
        this.renderer.setSize(this.viewport.width, this.viewport.height);
    }

    createMeshItems() {
        // Loop thorugh all images and create new MeshItem instances. Push these instances to the meshItems array.
        this.images.forEach(image => {
            let meshItem = new MeshItem(image, this.scene);
            this.meshItems.push(meshItem);
        })
        let stem = new Stem(this.stem, this.scene)
        this.meshItems.push(stem)
    }

    // Animate smoothscroll and meshes. Repeatedly called using requestanimationdrame
    render() {
        smoothScroll();
        for (let i = 0; i < this.meshItems.length; i++) {
            this.meshItems[i].render();
        }

        //this.renderer.render(this.scene, this.camera)
        this.customPass.uniforms.uMouse.value = uMouse;
        this.composer.render();
        requestAnimationFrame(this.render.bind(this));
    }


}

class MeshItem {
    // Pass in the scene as we will be adding meshes to this scene.
    constructor(element, scene) {
        this.element = element;
        this.scene = scene;
        this.offset = new THREE.Vector2(0, 0); // Positions of mesh on screen. Will be updated below.
        this.sizes = new THREE.Vector2(0, 0); //Size of mesh on screen. Will be updated below.
        this.createMesh();
        this.zpos = 0;
    }

    getDimensions() {
        const { width, height, top, left } = this.element.getBoundingClientRect();
        this.sizes.set(width*(1-(1/perspective)*this.zpos), height*(1-(1/perspective)*this.zpos));
        this.offset.set(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2);
    }

    createMesh() {
        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100);
        this.imageTexture = new THREE.TextureLoader().load(this.element.src);
        this.rotation = -1;
        this.speed = 1;
        this.uniforms = {
            uTexture: {
                //texture data
                value: this.imageTexture
            },
            uOffset: {
                //distortion strength
                value: new THREE.Vector2(0.0, 0.0)
            },
            uAlpha: {
                //opacity
                value: 1.
            },
            uPosition: {
                //opacity
                value: new THREE.Vector3(0.0, 0.0, 0.0)
            }
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            // wireframe: true,
            side: THREE.DoubleSide
        })
        if (this.element.classList.contains("staticimg")) {
            this.zpos = -2
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.getDimensions(); // set offsetand sizes for placement on the scene
        }
        else { //this is for the dfnr
            this.zpos = -1;
            this.mesh = new THREE.Mesh(this.geometry, this.material);
            this.getDimensions(); // set offsetand sizes for placement on the scene
        }
        if (this.element.classList.contains("right")) {
            this.rotation = 1;
        }
        if (this.element.classList.contains("front")) {
           this.zpos = 8;
        }
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
        this.mesh.position.set(this.offset.x, this.offset.y, this.zpos);
        this.scene.add(this.mesh);
    }

    render() {
        // this function is repeatidly called for each instance in the aboce 
        this.getDimensions();
        this.mesh.rotation.y = this.rotation * (this.mesh.position.y * 0.00002);
        this.mesh.position.set(this.offset.x, this.offset.y, this.zpos)
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)
        this.uniforms.uOffset.value.set(this.offset.x * 0.0, -(target - current) * 0.0003)
        this.uniforms.uPosition.value.set(this.mesh.position)
    }

}

class Stem {
    // Pass in the scene as we will be adding meshes to this scene.
    constructor(element, scene) {
        this.element = element;
        this.scene = scene;
        this.offset = new THREE.Vector2(0, 0); // Positions of mesh on screen. Will be updated below.
        this.sizes = new THREE.Vector2(0, 0); //Size of mesh on screen. Will be updated below.
        this.createMesh();
    }

    getDimensions() {
        const { width, height, top, left } = this.element.getBoundingClientRect();
        this.sizes.set(width, height);
        this.offset.set(left - window.innerWidth / 2 + width / 2, -top + window.innerHeight / 2 - height / 2);
    }

    createMesh() {
        this.geometry = new THREE.PlaneBufferGeometry(1, 1, 100, 100);
        this.imageTexture = new THREE.TextureLoader().load(this.element.src);
        this.uniforms = {
            uTexture: {
                //texture data
                value: this.imageTexture
            },
            uOffset: {
                //distortion strength
                value: new THREE.Vector2(0.0, 0.0)
            },
            uAlpha: {
                //opacity
                value: 1.
            }
        };
        this.material = new THREE.ShaderMaterial({
            uniforms: this.uniforms,
            vertexShader: staticVertexShader,
            fragmentShader: basicFragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        })
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.getDimensions(); // set offsetand sizes for placement on the scene
        this.mesh.position.set(this.offset.x, this.offset.y, 3);
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1);
        this.scene.add(this.mesh);
    }

    render() {
        // this function is repeatidly called for each instance in the aboce 
        this.getDimensions();
        this.mesh.position.set(this.offset.x, this.offset.y, 3)
        this.mesh.scale.set(this.sizes.x, this.sizes.y, 1)
        this.uniforms.uOffset.value.set(this.offset.x * 0.0, -(target - current) * 0.0003)
    }
}

init()
new EffectCanvas()