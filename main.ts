import {
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	Scene,
	SphereGeometry,
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

camera.position.z = 10;

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

	sphere.position.x = Math.sin(timestamp / 500);
	sphere.position.y = Math.cos(timestamp / 500);

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate(performance.now());
