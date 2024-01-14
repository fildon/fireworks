import {
	MeshBasicMaterial,
	Mesh,
	PlaneGeometry,
	Vector3,
	type Object3DEventMap,
	Matrix4,
	Color,
} from "three";

import { Storable } from "./storage";

type Ember = {
	/**
	 * Metres per second
	 */
	velocity: Vector3;
	/**
	 * Reference to object handled by ThreeJS
	 */
	mesh: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
};

const createEmber = (initialPosition: Vector3): Ember => {
	const velocity = new Vector3()
		.randomDirection()
		.multiplyScalar(50 + 50 * Math.random())
		// A little extra initial vertical momentum
		.add(new Vector3(0, 50, 0));
	const mesh = new Mesh(
		new PlaneGeometry(1, 1),
		new MeshBasicMaterial({ color: 0xffffff })
	);
	mesh.position.x = initialPosition.x;
	mesh.position.y = initialPosition.y;
	return {
		velocity,
		mesh,
	};
};

export class ExplosiveShell implements Storable {
	/**
	 * Milliseconds between creation and expiry
	 */
	private static MAX_AGE = 10000;
	private embers: Array<Ember>;
	private lastUpdateTime: number;
	private created: number;
	constructor(origin: Vector3) {
		this.created = performance.now();
		this.lastUpdateTime = this.created;
		this.embers = Array.from<Vector3>({ length: 64 })
			.fill(origin)
			.map(createEmber);
	}
	getMeshes() {
		return this.embers.map(({ mesh }) => mesh);
	}
	update(time: number) {
		const delta = (time - this.lastUpdateTime) / 1000;
		this.lastUpdateTime = time;
		this.embers.forEach((ember) => {
			/**
			 * x is positive to the right
			 * y is positive up the screen
			 * z is positive towards the viewer
			 * Convention of 1 on any axis representing 1 metre of distance.
			 * (0, 0, 0) is centered in the camera view
			 */
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

		return { meshesToAdd: [], meshesToRemove: [] };
	}
	isExpired(time: number) {
		return time - this.created > ExplosiveShell.MAX_AGE;
	}
}
