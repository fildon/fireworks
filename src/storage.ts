import { type Mesh, type Scene } from "three";

export interface Storable {
	getMeshes: () => Array<Mesh>;
	/**
	 * Return value used for partial mesh changes
	 * @param time - milliseconds since process start
	 */
	update: (time: number) => {
		meshesToAdd: Array<Mesh>;
		meshesToRemove: Array<Mesh>;
	};
	/**
	 * Indicates that this item and all associated meshes should be fully removed.
	 */
	isExpired: (time: number) => boolean;
}

export class Storage {
	private items: Array<Storable>;
	constructor(private scene: Scene) {
		this.items = [];
	}
	add(storable: Storable) {
		this.items.push(storable);
		storable.getMeshes().forEach((mesh) => this.scene.add(mesh));
	}
	update(time: number) {
		// Remove expired items
		const expiredItems = this.items.filter((item) => item.isExpired(time));
		expiredItems
			.flatMap((expiredItem) => expiredItem.getMeshes())
			.forEach((mesh) => this.scene.remove(mesh));
		this.items = this.items.filter((item) => !expiredItems.includes(item));

		// Update remaining items
		this.items.forEach((storable) => {
			const { meshesToAdd, meshesToRemove } = storable.update(time);
			meshesToAdd.forEach((mesh) => this.scene.add(mesh));
			meshesToRemove.forEach((mesh) => this.scene.remove(mesh));
		});
	}
}
