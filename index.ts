import {
	Mesh,
	MeshBasicMaterial,
	PerspectiveCamera,
	PlaneGeometry,
	Raycaster,
	Scene,
	Vector2,
	WebGLRenderer,
} from "three";

import { Storage } from "./src/storage";
import { ExplosiveShell } from "./src/explosiveShell";

const scene = new Scene();
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	1,
	1000
);
camera.position.z = 500;

const storage = new Storage(scene);

window.addEventListener<"resize">(
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

window.addEventListener<"click">(
	"click",
	(() => {
		const backdropPlane = new Mesh(
			new PlaneGeometry(10000, 10000),
			new MeshBasicMaterial({ visible: false })
		);
		scene.add(backdropPlane);
		return (event) => {
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
			const [firstIntersection] = raycaster.intersectObject(backdropPlane);
			raycaster.intersectObject(backdropPlane);
			if (!firstIntersection) {
				console.error("Click ray missed backdrop");
				return;
			}
			const { point: intersection } = firstIntersection;
			storage.add(new ExplosiveShell(intersection));
		};
	})()
);

/**
 * @param timestamp milliseconds since process started
 */
const animate = (timestamp: number) => {
	storage.update(timestamp);
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
};

animate(performance.now());
