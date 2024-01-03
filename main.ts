import {
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	SphereGeometry,
	TetrahedronGeometry,
	WebGLRenderer,
} from "three";

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

const geometry = new SphereGeometry(1, 16, 8);
const material = new MeshBasicMaterial({ color: 0xff7700 });
const sphere = new Mesh(geometry, material);
scene.add(sphere);

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
};
let embers: Array<Ember> = [];

window.addEventListener("click", () => {
	Array.from({ length: 100 })
		.map(() => ({
			angle: Math.random() * 2 * Math.PI,
			radius: Math.random(),
		}))
		.forEach(({ angle, radius }) => {
			const ember = new Mesh(
				new TetrahedronGeometry(),
				new MeshBasicMaterial({ color: 0xff7700 })
			);
			embers.push({
				xVelocity: radius * Math.sin(angle),
				yVelocity: 0.5 + radius * Math.cos(angle),
				mesh: ember,
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

	sphere.rotation.x += 0.01;
	sphere.rotation.y += 0.01;

	sphere.position.x = 10 * Math.sin(timestamp / 500);
	sphere.position.y = 10 * Math.cos(timestamp / 500);

	// Remove embers which have fallen below -1000
	embers = embers.filter((ember) => ember.mesh.position.y > -1000);
	embers.forEach((ember) => {
		// TODO use the time delta for better interpolation
		ember.mesh.position.x += ember.xVelocity;
		ember.mesh.position.y += ember.yVelocity;
		ember.xVelocity *= 0.98;
		ember.yVelocity = ember.yVelocity * 0.98 - 0.01;
	});

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate(performance.now());
