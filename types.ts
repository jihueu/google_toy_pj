export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Entity extends Position, Size {
  dy: number;
  dx: number;
}

export enum ObstacleType {
  SNOWMAN = 'SNOWMAN',
  GIFT = 'GIFT',
  BIRD = 'BIRD',
  CLOUD = 'CLOUD',
  FENCE = 'FENCE',
  ICICLE = 'ICICLE'
}

export interface Obstacle extends Entity {
  type: ObstacleType;
  passed: boolean;
}

export interface Item extends Entity {
  type: 'CANDY_CANE';
  collected: boolean;
  colorValue: string; // The color this item gives
}

export interface Particle extends Position {
  radius: number;
  speed: number;
  drift: number;
}