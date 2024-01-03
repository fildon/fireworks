import {
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	Raycaster,
	Scene,
	TetrahedronGeometry,
	Vector2,
	Vector3,
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
	velocity: Vector3;
	mesh: Mesh;
	created: number;
};
let embers: Array<Ember> = [];

const backdropPlane = new Mesh(
	new PlaneGeometry(1000, 1000),
	new MeshBasicMaterial({ visible: false })
);
scene.add(backdropPlane);

window.addEventListener("click", (event) => {
	/**
	 * Detect click target in simulation coordinates, by intersecting with an
	 * invisible backdrop plane.
	 */
	const raycaster = new Raycaster();
	raycaster.setFromCamera(
		new Vector2(
			(event.clientX / window.innerWidth) * 2 - 1,
			-(event.clientY / window.innerHeight) * 2 + 1
		),
		camera
	);
	const [{ point: intersection }] = raycaster.intersectObject(backdropPlane);
	Array.from({ length: 128 })
		.map(() => new Vector3().randomDirection().multiplyScalar(Math.random()))
		.forEach((velocity) => {
			const ember = new Mesh(
				new TetrahedronGeometry(),
				new MeshBasicMaterial({ color: 0xff2222 })
			);
			ember.position.x = intersection.x;
			ember.position.y = intersection.y;
			embers.push({
				velocity,
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
		ember.mesh.position.x += ember.velocity.x;
		ember.mesh.position.y += ember.velocity.y;
		ember.mesh.position.z += ember.velocity.z;
		// Embers decay in size
		ember.mesh.geometry.applyMatrix4(new Matrix4().makeScale(0.99, 0.99, 0.99));
		ember.velocity.x *= 0.99;
		ember.velocity.z *= 0.99;
		ember.velocity.y = ember.velocity.y * 0.99 - 0.005;
	});

	composer.render();
	requestAnimationFrame(animate);
};

// TODO colour transitions

animate(performance.now());
