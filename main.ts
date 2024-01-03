import {
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	TetrahedronGeometry,
	WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BloomPass } from "three/examples/jsm/postprocessing/BloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/**
 * Maximum age in milliseconds for an ember
 */
const MAX_AGE = 10000;

const scene = new Scene();
const camera = new PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	1,
	1000
);
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new BloomPass(5, 20, 2));
composer.addPass(new OutputPass());

camera.position.z = 100;

window.addEventListener(
	"resize",
	(() => {
		const tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2);
		const windowHeight = window.innerHeight;
		return () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.fov =
				(360 / Math.PI) *
				Math.atan(tanFOV * (window.innerHeight / windowHeight));

			camera.updateProjectionMatrix();
			camera.lookAt(scene.position);

			renderer.setSize(window.innerWidth, window.innerHeight);
		};
	})()
);

type Ember = {
	xVelocity: number;
	yVelocity: number;
	mesh: Mesh;
	created: number;
};
let embers: Array<Ember> = [];

window.addEventListener("click", () => {
	Array.from({ length: 128 })
		.map(() => ({
			angle: Math.random() * 2 * Math.PI,
			radius: Math.random(),
		}))
		.forEach(({ angle, radius }) => {
			const ember = new Mesh(
				new TetrahedronGeometry(),
				new MeshBasicMaterial({ color: 0xff2222 })
			);
			embers.push({
				xVelocity: radius * Math.sin(angle),
				yVelocity: 0.5 + radius * Math.cos(angle),
				mesh: ember,
				created: performance.now(),
			});
			scene.add(ember);
		});
});

/**
 * @param timestamp milliseconds since process started
 */
const animate = (timestamp: number) => {
	/**
	 * x is positive to the right
	 * y is positive up the screen
	 * z is positive towards the viewer
	 * Convention of 1 on any axis representing 1 metre of distance.
	 * (0, 0, 0) is centered in the camera view
	 */

	// Remove embers after they pass their max age
	const oldEmbers = embers.filter(
		(ember) => timestamp - ember.created > MAX_AGE
	);
	oldEmbers.forEach((oldEmber) => scene.remove(oldEmber.mesh));
	embers = embers.filter((ember) => !oldEmbers.includes(ember));

	embers.forEach((ember) => {
		// TODO use the time delta for better interpolation
		ember.mesh.position.x += ember.xVelocity;
		ember.mesh.position.y += ember.yVelocity;
		// Embers decay in size
		ember.mesh.geometry.applyMatrix4(new Matrix4().makeScale(0.99, 0.99, 0.99));
		ember.xVelocity *= 0.99;
		ember.yVelocity = ember.yVelocity * 0.99 - 0.005;
	});

	composer.render();
	requestAnimationFrame(animate);
};

// TODO colour transitions

animate(performance.now());
