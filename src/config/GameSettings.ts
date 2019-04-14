class GameSettings {
	public roadWidth = 2200;
	public roadWidthClamp = 3;
	public segmentLength = 200;
	public rumbleLength = 3;
	public lanes = 3;
	public fieldOfView = 100;
	public cameraHeight = 1500;
	public cameraDepth = 1 / Math.tan( (this.fieldOfView / 2) * Math.PI / 180 );
	public drawDistance = 500;
	public fogDensity = 5;
	public maxSpeed = this.segmentLength * 8;
	public accel = this.maxSpeed / 50;
	public decel = -this.maxSpeed / 70;
	public breaking = -this.maxSpeed / 20;
	public offRoadDecel = -this.maxSpeed / 2;
	public offRoadLimit = this.maxSpeed / 4;
	public centrifugal = 0.15;
	public steerCompensation = 0.75;
}

export const gameSettings = new GameSettings();