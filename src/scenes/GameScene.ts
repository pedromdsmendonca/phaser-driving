import { BaseScene } from './BaseScene';
import { Input } from 'phaser';
import { Colors } from '../Components/Colors';
import { TrackSegment } from '../Components/TrackSegment';
import { gameSettings } from '../config/GameSettings';
import { SegmentPoint } from '../Components/SegmentPoint';
import { Util } from '../Components/Util';
import { Player } from '../Components/Player';

export class GameScene extends BaseScene {
	public segments: TrackSegment[];
	public trackLength: number;

	public position: number;
	public speed: number;
	public player: Player;

	public speedText: Phaser.GameObjects.BitmapText;
	public roadGraphics: Phaser.GameObjects.Graphics;

	public cursors: Input.Keyboard.CursorKeys;

	constructor(key: string, options: any) {
		super('GameScene');
	}

	// public preload(): void {
	// 	// empty
	// }

	// public init(): void {
	// 	// empty
	// }

	public create(): void {
		this.segments = [];
		this.trackLength = 0;
		this.position = 0;
		this.speed = 0;

		this.cursors = this.input.keyboard.createCursorKeys();

		this.roadGraphics = this.add.graphics();
		this.player = new Player(this, 0, this.scale.gameSize.height - 5, gameSettings.cameraHeight * gameSettings.cameraDepth);
		this.speedText = this.add.bitmapText(5, 5, 'retro', 'speed: 0\nposition: 0', 16);

		this.resetRoad();
	}

	public update(time: number, delta: number): void {
		// empty
		this.roadGraphics.clear();

		this.handleInput(delta / 100);
		this.speed = Phaser.Math.Clamp(this.speed, 0, gameSettings.maxSpeed);
		this.player.x = Phaser.Math.Clamp(this.player.x, -2, 2);

		// TODO: offroad


		// track position
		this.position = Util.increase(this.position, (delta * 0.01) * this.speed, this.trackLength);

		this.drawRoad();

		this.speedText.setText(`speed: ${this.speed.toFixed()}\nposition: ${this.position.toFixed(2)}`);
	}

	// private

	private project(sp: SegmentPoint, cameraX: number, cameraY: number, cameraZ: number, cameraDepth: number, width: number, height: number, roadWidth: number) {
		sp.camera.x = (sp.world.x || 0) - cameraX;
		sp.camera.y = (sp.world.y || 0) - cameraY;
		sp.camera.z = (sp.world.z || 0) - cameraZ;
		sp.screen.scale = cameraDepth / sp.camera.z;
		sp.screen.x = Math.round((width / 2) + (sp.screen.scale * sp.camera.x * width / 2));
		sp.screen.y = Math.round((height / 2) - (sp.screen.scale * sp.camera.y * height / 2));
		sp.screen.w = Math.round((sp.screen.scale * roadWidth * width / 2));
	}

	private drawPolygon(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number, color: number) {
		g.save()
			.fillStyle(color)
			.beginPath()
			.moveTo(x1, y1)
			.lineTo(x2, y2)
			.lineTo(x3, y3)
			.lineTo(x4, y4)
			.closePath()
			.fillPath()
			.restore();
	}

	private drawSegment(width: number, lanes: number, x1: number, y1: number, w1: number, x2: number, y2: number, w2: number, fog: number, colors: any) {
		const r1 = Util.rumbleWidth(w1, lanes);
		const r2 = Util.rumbleWidth(w2, lanes);
		const l1 = Util.laneMarkerWidth(w1, lanes);
		const l2 = Util.laneMarkerWidth(w1, lanes);

		this.roadGraphics.fillStyle(colors.GRASS);
		const h = y1 - y2;
		this.roadGraphics.fillRect(0, y2, width, h);

		this.drawPolygon(this.roadGraphics, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, colors.RUMBLE);
		this.drawPolygon(this.roadGraphics, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, colors.RUMBLE);
		this.drawPolygon(this.roadGraphics, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, colors.ROAD);

		const lanew1 = w1 * 2 / lanes;
		const lanew2 = w2 * 2 / lanes;
		let lanex1 = x1 - w1 + lanew1;
		let lanex2 = x2 - w2 + lanew2;

		if (colors.LANE) {
			for (let lane = 1; lane < lanes; lanex1 += lanew1, lanex2 += lanew2, lane++) {
				this.drawPolygon(this.roadGraphics, lanex1 - l1 / 2, y1, lanex1 + l1 / 2, y1, lanex2 + l2 / 2, y2, lanex2 - l2 / 2, y2, colors.LANE);
			}
		}

		// Render.fog(ctx, 0, y1, width, y2 - y1, fog);
	}

	private drawRoad(): void {
		const gameWidth = this.scale.gameSize.width;
		const gameHeight = this.scale.gameSize.height;

		const baseSegment = this.findSegment(this.position);

		let maxY = gameHeight;

		for (let n = 0; n < gameSettings.drawDistance; n++) {
			const segmentIndex = (baseSegment.index + n) % this.segments.length;
			const segment = this.segments[segmentIndex];

			segment.looped = segment.index < baseSegment.index;
			segment.fog = 0; // TODO: Util.exponentialFog(n/drawDistance, fogDensity);

			this.project(segment.p1, this.player.x * gameSettings.roadWidth, gameSettings.cameraHeight,
					this.position - (segment.looped ? this.trackLength : 0), gameSettings.cameraDepth,
					gameWidth, gameHeight, gameSettings.roadWidth);

			this.project(segment.p2, this.player.x * gameSettings.roadWidth, gameSettings.cameraHeight,
					this.position - (segment.looped ? this.trackLength : 0), gameSettings.cameraDepth,
					gameWidth, gameHeight, gameSettings.roadWidth);

			if (segment.p1.camera.z <= gameSettings.cameraDepth || segment.p2.screen.y >= maxY) {
				continue;
			}

			this.drawSegment(gameWidth, gameSettings.lanes,
				segment.p1.screen.x,
				segment.p1.screen.y,
				segment.p1.screen.w,
				segment.p2.screen.x,
				segment.p2.screen.y,
				segment.p2.screen.w,
				segment.fog,
				segment.colors,
			);

			maxY = segment.p2.screen.y;
		}
	}

	private findSegment(z: number): TrackSegment {
		const index = Math.floor(z / gameSettings.segmentLength) % this.segments.length;
		return this.segments[index];
	}

	private resetRoad(): void {
		const length = 500;

		this.segments = [];
		for (let n = 0; n < length; n++) {
			this.segments.push(new TrackSegment(n));
		}

		this.trackLength = this.segments.length * gameSettings.segmentLength;
	}

	private handleInput(delta: number) {
		if (this.cursors.up.isDown) {
			this.speed = Util.accelerate(this.speed, gameSettings.accel, delta);
		} else if (this.cursors.down.isDown) {
			this.speed = Util.accelerate(this.speed, gameSettings.breaking, delta);
		} else {
			this.speed = Util.accelerate(this.speed, gameSettings.decel, delta);
		}

		const speedMultiplier = this.speed / gameSettings.maxSpeed;
		const dx = this.speed <= 0 ? 0 : delta * speedMultiplier * 0.5;

		if (this.cursors.left.isDown) {
			this.player.x -= dx;
		}

		if (this.cursors.right.isDown) {
			this.player.x += dx;
		}
	}
}
