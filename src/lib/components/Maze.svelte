<script lang="ts">
	import { T } from '@threlte/core';
	import { RigidBody, AutoColliders, Collider } from '@threlte/rapier';
	import type { RigidBody as RapierRigidBody } from '@dimforge/rapier3d-compat';
	import { isElement } from '$lib/utils';
	import { game } from '$lib/game';

	export let entrance: Triplet;
	export let exit: Triplet;
	export let maze: MazeBlock[];

	let rigidBody: RapierRigidBody;
</script>

<T.Group position={[-24, 1, -24]}>
	<RigidBody type="fixed" bind:rigidBody userData={{ name: 'maze' }} dominance={10}>
		<AutoColliders shape={'cuboid'}>
			{#each maze as element, ind}
				<T.Mesh scale={element.dimension} position={element.position} key={ind} castShadow>
					<T.BoxGeometry />
					<T.MeshStandardMaterial color={'lightseagreen'}  flatShading/>
				</T.Mesh>
			{/each}
		</AutoColliders>
	</RigidBody>

	<T.Group position={entrance}>
		<Collider
			sensor
			shape="cuboid"
			args={[0.1, 3, 3]}
			on:sensorenter={(data) => {
				if (isElement(data.targetRigidBody, 'avatar') && $game.status === 'idle') {
					$game.status = 'inMaze';
				}
			}}
		/>
	</T.Group>
	<T.Group position={exit}>
		<Collider
			sensor
			shape="cuboid"
			args={[0.1, 3, 3]}
			on:sensorenter={(data) => {
				if (isElement(data.targetRigidBody, 'avatar') && $game.status === 'inMaze') {
					$game.status = 'outMaze';
				}
			}}
		/>
	</T.Group>

	<slot />
</T.Group>
