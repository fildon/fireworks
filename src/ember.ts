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

export class Ember implements Storable {
	/**
	 * Milliseconds between creation and expiry
	 */
	private static MAX_AGE = 3000;
	private mesh: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
	private velocity: Vector3;
	private wobbleOffset: number;
	private lastUpdateTime: number;
	private created: number;
	constructor({
		position,
		velocity,
	}: {
		position: Vector3;
		velocity: Vector3;
	}) {
		this.created = performance.now();
		this.lastUpdateTime = this.created;
		this.mesh = new Mesh(
			new PlaneGeometry(1, 1),
			new MeshBasicMaterial({ color: 0xffffff })
		);
		this.mesh.position.x = position.x;
		this.mesh.position.y = position.y;
		this.mesh.position.z = position.z;
		this.velocity = velocity;
		this.wobbleOffset = Math.random() * 10000;
	}
	getMeshes() {
		return [this.mesh];
	}
	update(time: number) {
		const delta = (time - this.lastUpdateTime) / 1000;
		this.lastUpdateTime = time;

		/**
		 * x is positive to the right
		 * y is positive up the screen
		 * z is positive towards the viewer
		 * Convention of 1 on any axis representing 1 metre of distance.
		 * (0, 0, 0) is centered in the camera view
		 */
		this.mesh.position.x +=
			this.velocity.x * delta +
			0.1 * Math.sin((this.wobbleOffset + time) / 500);
		this.mesh.position.y += this.velocity.y * delta;
		this.mesh.position.z += this.velocity.z * delta;
		// Embers decay in size
		const scaleFactor = 0.7 ** delta;
		this.mesh.geometry.applyMatrix4(
			new Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor)
		);

		const deceleration = 0.4 ** delta;
		this.velocity.x *= deceleration;
		this.velocity.z *= deceleration;
		this.velocity.y *= deceleration;

		// Gravity
		this.velocity.y -= 0.5;

		this.mesh.material.color.lerp(new Color(0xff2222), 0.01);
		return { storablesToAdd: [] };
	}
	isExpired(time: number) {
		return time - this.created > Ember.MAX_AGE;
	}
}
