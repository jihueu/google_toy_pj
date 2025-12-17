export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

// Physics
export const GRAVITY = 0.6;
export const JUMP_FORCE = -12;
export const DOUBLE_JUMP_FORCE = -10; // Slightly weaker second jump
export const GROUND_HEIGHT = 60; // Higher ground for wavy effect
export const GAME_SPEED = 5;
export const PARALLAX_SPEED = 2; // Slower background

// Entity Dimensions
export const SANTA_WIDTH = 50; 
export const SANTA_HEIGHT = 60;

// Colors - Watercolor Palette
export const COLORS = {
  SKY_TOP: '#2b5876',  
  SKY_BOTTOM: '#4e4376', 
  GROUND_TOP: '#ffffff',
  GROUND_BOTTOM: '#dbeeff',
  SANTA_RED: '#d32f2f', 
  SANTA_RED_LIGHT: '#ff6659', 
  SANTA_SKIN: '#ffccbc', 
  SANTA_WHITE: '#ffffff',
  SANTA_BOOT: '#37474f',
  
  OBSTACLE_SNOWMAN: '#f5f5f5',
  OBSTACLE_GIFT_BOX: '#c0392b',
  OBSTACLE_GIFT_RIBBON: '#f1c40f',
  OBSTACLE_BIRD: '#34495e',
  OBSTACLE_CLOUD: '#ffffff',
  OBSTACLE_FENCE: '#795548', // Wood brown
  OBSTACLE_ICICLE: '#e1f5fe', // Icy blue

  TREE_DARK: '#1e3c72',
  TREE_LIGHT: '#2a5298',
  TEXT: '#1a2a6c'
};

// Available suit colors for the power-up
export const SUIT_VARIANTS = [
  '#d32f2f', // Classic Red
  '#388e3c', // Elf Green
  '#1976d2', // Icy Blue
  '#fbc02d', // Golden
  '#7b1fa2', // Royal Purple
  '#c2185b'  // Pink
];

export const OBSTACLE_SPAWN_RATE = 110; 
export const POINTS_PER_OBSTACLE = 100;
export const POINTS_PER_ITEM = 200;