import {
	Mesh,
	MeshBasicMaterial,
	Object3DEventMap,
	PlaneGeometry,
	Vector3,
} from "three";
import { Storable } from "./storage";
import { Ember } from "./ember";

export class Trailer implements Storable {
	private static MAX_AGE = 4000;
	private velocity: Vector3;
	private created: number;
	private lastUpdateTime: number;
	private lastEmberTime: number;

	private mesh: Mesh<PlaneGeometry, MeshBasicMaterial, Object3DEventMap>;
	constructor({ position }: { position: Vector3 }) {
		this.mesh = new Mesh(
			new PlaneGeometry(1, 1),
			new MeshBasicMaterial({ color: 0xff8800 })
		);
		this.mesh.position.x = position.x;
		this.mesh.position.y = position.y;
		this.velocity = new Vector3()
			.randomDirection()
			.multiplyScalar(100 + 100 * Math.random())
			// A little extra initial vertical momentum
			.add(new Vector3(0, 50, 0));
		this.created = performance.now();
		this.lastUpdateTime = this.created;
		this.lastEmberTime = this.created;
	}
	getMeshes() {
		return [this.mesh];
	}
	update(time: number) {
		const delta = (time - this.lastUpdateTime) / 1000;
		this.lastUpdateTime = time;

		this.mesh.position.x += this.velocity.x * delta;
		this.mesh.position.y += this.velocity.y * delta;
		this.mesh.position.z += this.velocity.z * delta;

		const deceleration = 0.8 ** delta;
		this.velocity.x *= deceleration;
		this.velocity.z *= deceleration;
		this.velocity.y *= deceleration;

		// Gravity
		this.velocity.y -= 0.5;

		if (time - this.lastEmberTime > 100) {
			this.lastEmberTime = time;
			return {
				storablesToAdd: [
					new Ember({ position: this.mesh.position, velocity: new Vector3() }),
				],
			};
		}
		return { storablesToAdd: [] };
	}
	isExpired(time: number) {
		return time - this.created > Trailer.MAX_AGE;
	}
}
