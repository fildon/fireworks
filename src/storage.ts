import { type Mesh, type Scene } from "three";

export interface Storable {
	getMeshes: () => Array<Mesh>;
	/**
	 * @param time - milliseconds since process start
	 */
	update: (time: number) => { storablesToAdd: Array<Storable> };
	/**
	 * Indicates that this item and all associated meshes should be removed.
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

		this.items
			// Update each item
			.flatMap((item) => item.update(time).storablesToAdd)
			// Add new items
			.forEach((newItem) => this.add(newItem));
	}
}
