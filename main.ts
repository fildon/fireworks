import {
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	type Object3DEventMap,
	PerspectiveCamera,
	PlaneGeometry,
	Raycaster,
	Scene,
	Vector2,
	Vector3,
	WebGLRenderer,
	Color,
} from "three";

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

camera.position.z = 500;

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
	/**
	 * Metres per second
	 */
	velocity: Vector3;
	/**
	 * Reference to object handled by ThreeJS
	 */
	mesh: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
	/**
	 * Millisecond timestamp
	 */
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
	Array.from({ length: 256 })
		.map(() =>
			new Vector3().randomDirection().multiplyScalar(50 + 50 * Math.random())
		)
		.forEach((velocity) => {
			const ember = new Mesh(
				new PlaneGeometry(),
				new MeshBasicMaterial({ color: 0xffffff })
			);
			ember.position.x = intersection.x;
			ember.position.y = intersection.y;
			embers.push({
				// A little extra initial vertical momentum
				velocity: velocity.add(new Vector3(0, 50, 0)),
				mesh: ember,
				created: performance.now(),
			});
			scene.add(ember);
		});
});

let lastTimestamp = performance.now();
/**
 * @param timestamp milliseconds since process started
 */
const animate = (timestamp: number) => {
	const delta = (timestamp - lastTimestamp) / 1000;
	lastTimestamp = timestamp;
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
		ember.mesh.position.x += ember.velocity.x * delta;
		ember.mesh.position.y += ember.velocity.y * delta;
		ember.mesh.position.z += ember.velocity.z * delta;
		// Embers decay in size
		const scaleFactor = 0.7 ** delta;
		ember.mesh.geometry.applyMatrix4(
			new Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor)
		);

		const deceleration = 0.4 ** delta;
		ember.velocity.x *= deceleration;
		ember.velocity.z *= deceleration;
		ember.velocity.y *= deceleration;

		// Gravity
		ember.velocity.y -= 0.5;

		ember.mesh.material.color.lerp(new Color(0xff2222), 0.01);
	});

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate(performance.now());
