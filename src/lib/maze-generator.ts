// Adapted from original code by Chirp Internet: www.chirpinternet.eu

import type { Triplet } from '../types';

export type Structure = {
	dimension: Triplet;
	position: Triplet;
};

export class MazeBuilder {
	width: number;
	height: number;
	cols: number;
	rows: number;
	maze: string[][][];

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;

		this.cols = 2 * this.width + 1;
		this.rows = 2 * this.height + 1;

		this.maze = this.initArray([]);

		/* place initial walls */

		this.maze.forEach((row, r) => {
			row.forEach((cell, c) => {
				switch (r) {
					case 0:
					case this.rows - 1:
						this.maze[r][c] = ['wall'];
						break;

					default:
						if (r % 2 == 1) {
							if (c == 0 || c == this.cols - 1) {
								this.maze[r][c] = ['wall'];
							}
						} else if (c % 2 == 0) {
							this.maze[r][c] = ['wall'];
						}
				}
			});

			if (r == 0) {
				/* place exit in top row */
				const doorPos = this.posToSpace(this.rand(1, this.width));
				this.maze[r][doorPos] = ['door', 'exit'];
			}

			if (r == this.rows - 1) {
				/* place entrance in bottom row */
				const doorPos = this.posToSpace(this.rand(1, this.width));
				this.maze[r][doorPos] = ['door', 'entrance'];
			}
		});

		/* start partitioning */

		this.partition(1, this.height - 1, 1, this.width - 1);
	}

	initArray(value?: string[]) {
		return new Array(this.rows).fill(0).map(() => new Array(this.cols).fill(value));
	}

	rand(min: number, max: number) {
		return min + Math.floor(Math.random() * (1 + max - min));
	}

	posToSpace(x: number) {
		return 2 * (x - 1) + 1;
	}

	posToWall(x: number) {
		return 2 * x;
	}

	inBounds(r: number, c: number) {
		if (typeof this.maze[r] == 'undefined' || typeof this.maze[r][c] == 'undefined') {
			return false; /* out of bounds */
		}
		return true;
	}

	shuffle(array: any[]) {
		/* sauce: https://stackoverflow.com/a/12646864 */
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	partition(r1: number, r2: number, c1: number, c2: number) {
		/* create partition walls
         ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method */

		let horiz, vert, x, y, start, end;

		if (r2 < r1 || c2 < c1) {
			return false;
		}

		if (r1 == r2) {
			horiz = r1;
		} else {
			x = r1 + 1;
			y = r2 - 1;
			start = Math.round(x + (y - x) / 4);
			end = Math.round(x + (3 * (y - x)) / 4);
			horiz = this.rand(start, end);
		}

		if (c1 == c2) {
			vert = c1;
		} else {
			x = c1 + 1;
			y = c2 - 1;
			start = Math.round(x + (y - x) / 3);
			end = Math.round(x + (2 * (y - x)) / 3);
			vert = this.rand(start, end);
		}

		for (let i = this.posToWall(r1) - 1; i <= this.posToWall(r2) + 1; i++) {
			for (let j = this.posToWall(c1) - 1; j <= this.posToWall(c2) + 1; j++) {
				if (i == this.posToWall(horiz) || j == this.posToWall(vert)) {
					this.maze[i][j] = ['wall'];
				}
			}
		}

		const gaps = this.shuffle([true, true, true, false]);

		/* create gaps in partition walls */

		if (gaps[0]) {
			const gapPosition = this.rand(c1, vert);
			this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
		}

		if (gaps[1]) {
			const gapPosition = this.rand(vert + 1, c2 + 1);
			this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = [];
		}

		if (gaps[2]) {
			const gapPosition = this.rand(r1, horiz);
			this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
		}

		if (gaps[3]) {
			const gapPosition = this.rand(horiz + 1, r2 + 1);
			this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = [];
		}

		/* recursively partition newly created chambers */

		this.partition(r1, horiz - 1, c1, vert - 1);
		this.partition(horiz + 1, r2, c1, vert - 1);
		this.partition(r1, horiz - 1, vert + 1, c2);
		this.partition(horiz + 1, r2, vert + 1, c2);
	}

	isGap(...cells: number[][]) {
		return cells.every((array) => {
			const [row, col] = array;
			if (this.maze[row][col].length > 0) {
				if (!this.maze[row][col].includes('door')) {
					return false;
				}
			}
			return true;
		});
	}

	countSteps(array: any[][], r: number, c: number, val: number, stop: string) {
		if (!this.inBounds(r, c)) {
			return false; /* out of bounds */
		}

		if (array[r][c] <= val) {
			return false; /* shorter route already mapped */
		}

		if (!this.isGap([r, c])) {
			return false; /* not traversable */
		}

		array[r][c] = val;

		if (this.maze[r][c].includes(stop)) {
			return true; /* reached destination */
		}

		this.countSteps(array, r - 1, c, val + 1, stop);
		this.countSteps(array, r, c + 1, val + 1, stop);
		this.countSteps(array, r + 1, c, val + 1, stop);
		this.countSteps(array, r, c - 1, val + 1, stop);
	}

	getKeyLocation() {
		const fromEntrance = this.initArray();
		const fromExit = this.initArray();

		let totalSteps = -1;

		for (let j = 1; j < this.cols - 1; j++) {
			if (this.maze[this.rows - 1][j].includes('entrance')) {
				this.countSteps(fromEntrance, this.rows - 1, j, 0, 'exit');
			}
			if (this.maze[0][j].includes('exit')) {
				this.countSteps(fromExit, 0, j, 0, 'entrance');
			}
		}

		let fc = -1,
			fr = -1;

		this.maze.forEach((row, r) => {
			row.forEach((cell, c) => {
				if (typeof fromEntrance[r][c] == 'undefined') {
					return;
				}
				const stepCount = fromEntrance[r][c] + fromExit[r][c];
				if (stepCount > totalSteps) {
					fr = r;
					fc = c;
					totalSteps = stepCount;
				}
			});
		});

		return [fr, fc];
	}

	placeKey() {
		const [fr, fc] = this.getKeyLocation();

		this.maze[fr][fc] = ['key'];
	}

	getElements() {
		const out: Structure[] = [];
		let entrance: Triplet = [0, 0, 0];
		let exit: Triplet = [0, 0, 0];

		const unit = 4;
		const offset = 10;

		// exit and entrance are reversed
		this.maze.forEach((row, rIdx) => {
			row.forEach((col, cIdx) => {
				if (col?.[0] === 'wall') {
					out.push({
						dimension: [unit, 5, unit],
						position: [(rIdx - offset) * unit, 0, (cIdx - offset) * unit]
					} as Structure);
				} else if (col.includes('exit')) {
					entrance = [(rIdx - offset) * unit, 0, (cIdx - offset) * unit];
				} else if (col.includes('entrance')) {
					exit = [(rIdx - offset) * unit, 0, (cIdx - offset) * unit];
				}
			});
		});

		return { maze: out, entrance, exit };
	}
}
