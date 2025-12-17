import React, { useRef, useEffect, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  JUMP_FORCE, 
  DOUBLE_JUMP_FORCE,
  GROUND_HEIGHT, 
  GAME_SPEED, 
  PARALLAX_SPEED,
  SANTA_WIDTH, 
  SANTA_HEIGHT, 
  COLORS, 
  SUIT_VARIANTS,
  OBSTACLE_SPAWN_RATE,
  POINTS_PER_OBSTACLE,
  POINTS_PER_ITEM
} from '../constants';
import { GameStatus, Obstacle, ObstacleType, Particle, Entity, Position, Item } from '../types';

interface GameCanvasProps {
  gameStatus: GameStatus;
  setGameStatus: (status: GameStatus) => void;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameStatus, 
  setGameStatus, 
  score, 
  setScore 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Game State Refs
  const santaRef = useRef<Entity>({
    x: 100,
    y: CANVAS_HEIGHT - GROUND_HEIGHT - SANTA_HEIGHT,
    width: SANTA_WIDTH,
    height: SANTA_HEIGHT,
    dx: 0,
    dy: 0
  });
  
  const obstaclesRef = useRef<Obstacle[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const snowRef = useRef<Particle[]>([]);
  
  // Logic Refs
  const isGroundedRef = useRef<boolean>(true);
  const jumpCountRef = useRef<number>(0); // 0 = ground, 1 = first jump, 2 = double jump
  const santaColorRef = useRef<string>(COLORS.SANTA_RED);
  
  // Scenery (Trees) for Parallax
  const sceneryRef = useRef<Position[]>([]);

  // --- Watercolor Helper Functions ---

  const drawSoftCircle = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, blur = 10) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  const drawWatercolorRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, radius = 5) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = color;
    ctx.shadowBlur = 5;
    ctx.shadowColor = color;
    ctx.fill();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  };

  // --- Entity Drawers ---

  const drawSanta = (ctx: CanvasRenderingContext2D, santa: Entity, frame: number) => {
    const { x, y, width, height } = santa;
    const runOffset = isGroundedRef.current ? Math.sin(frame * 0.2) * 3 : 0;
    
    // Dynamic suit color
    const suitColor = santaColorRef.current;
    // Calculate a lighter highlight color based on the suit color or use a generic mix
    const suitColorLight = suitColor === COLORS.SANTA_RED ? COLORS.SANTA_RED_LIGHT : '#ffffff66'; 

    ctx.save();

    // 1. Legs (moving)
    const legPhase = Math.sin(frame * 0.3);
    const leftLegX = x + 15 + (isGroundedRef.current ? legPhase * 10 : -5);
    const rightLegX = x + 35 - (isGroundedRef.current ? legPhase * 10 : -5);
    const legY = y + height - 10 + runOffset;

    // Boots
    drawSoftCircle(ctx, leftLegX, legY, 8, COLORS.SANTA_BOOT, 2);
    drawSoftCircle(ctx, rightLegX, legY, 8, COLORS.SANTA_BOOT, 2);

    // 2. Body (Coat) - Soft Gradient
    const bodyGradient = ctx.createRadialGradient(x + width/2, y + height/2, 5, x + width/2, y + height/2, 30);
    // If custom color, just use simple gradient or try to blend
    bodyGradient.addColorStop(0, suitColor === COLORS.SANTA_RED ? COLORS.SANTA_RED_LIGHT : '#ffffff');
    bodyGradient.addColorStop(0.3, suitColor);
    bodyGradient.addColorStop(1, suitColor);
    
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height/2 + runOffset, width/2, height/2 - 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.shadowBlur = 10;
    ctx.shadowColor = suitColor;
    ctx.fill();

    // Belt
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height/2 + 5 + runOffset, width/2 + 2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#222';
    ctx.fill();
    // Buckle
    drawSoftCircle(ctx, x + width/2, y + height/2 + 5 + runOffset, 4, '#FFD700', 2);

    // 3. Head
    drawSoftCircle(ctx, x + width/2, y + 15 + runOffset, 12, COLORS.SANTA_SKIN, 2);

    // 4. Beard
    const beardY = y + 20 + runOffset;
    drawSoftCircle(ctx, x + width/2, beardY, 10, '#fff', 5);
    drawSoftCircle(ctx, x + width/2 - 8, beardY - 2, 8, '#fff', 5);
    drawSoftCircle(ctx, x + width/2 + 8, beardY - 2, 8, '#fff', 5);

    // 5. Hat
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 10 + runOffset);
    ctx.quadraticCurveTo(x + width/2, y - 10 + runOffset, x + width, y + 15 + runOffset);
    ctx.fillStyle = suitColor; // Hat matches suit
    ctx.fill();
    // Hat Band
    ctx.beginPath();
    ctx.roundRect(x + 5, y + 8 + runOffset, width - 10, 8, 4);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Pom pom
    drawSoftCircle(ctx, x + width, y + 15 + runOffset, 6, '#fff', 4);

    // Eyes
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(x + width/2 - 4, y + 14 + runOffset, 1.5, 0, Math.PI * 2);
    ctx.arc(x + width/2 + 4, y + 14 + runOffset, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawSnowman = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    const { x, y, width, height } = obs;
    drawSoftCircle(ctx, x + width/2, y + height - 12, 16, COLORS.OBSTACLE_SNOWMAN, 8);
    drawSoftCircle(ctx, x + width/2, y + height - 28, 12, COLORS.OBSTACLE_SNOWMAN, 6);
    drawSoftCircle(ctx, x + width/2, y + height - 42, 9, COLORS.OBSTACLE_SNOWMAN, 4);

    ctx.beginPath();
    ctx.moveTo(x + width/2, y + height - 42);
    ctx.lineTo(x + width/2 + 10, y + height - 40);
    ctx.lineTo(x + width/2, y + height - 38);
    ctx.fillStyle = 'orange';
    ctx.fill();
  };

  const drawGift = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    const { x, y, width, height } = obs;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.OBSTACLE_GIFT_BOX;
    
    const grad = ctx.createLinearGradient(x, y, x + width, y + height);
    grad.addColorStop(0, COLORS.OBSTACLE_GIFT_BOX);
    grad.addColorStop(1, '#a93226');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);
    ctx.shadowBlur = 0; 

    ctx.fillStyle = COLORS.OBSTACLE_GIFT_RIBBON;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x + width/2 - 4, y, 8, height);
    ctx.fillRect(x, y + height/2 - 4, width, 8);
    
    ctx.beginPath();
    ctx.arc(x + width/2, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  };

  const drawBird = (ctx: CanvasRenderingContext2D, obs: Obstacle, frame: number) => {
    const { x, y, width, height } = obs;
    const wingOffset = Math.sin(frame * 0.4) * 5;
    ctx.fillStyle = COLORS.OBSTACLE_BIRD;
    ctx.beginPath();
    ctx.ellipse(x + width/2, y + height/2, 15, 10, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#5dade2';
    ctx.beginPath();
    ctx.moveTo(x + width/2 - 5, y + height/2);
    ctx.lineTo(x + width/2 + 5, y + height/2);
    ctx.lineTo(x + width/2, y + height/2 - 10 + wingOffset);
    ctx.fill();
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.moveTo(x, y + height/2 + 2);
    ctx.lineTo(x - 5, y + height/2 + 5);
    ctx.lineTo(x, y + height/2 + 8);
    ctx.fill();
  };

  const drawCloud = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    const { x, y, width, height } = obs;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(x + 15, y + height/2, 15, 0, Math.PI * 2);
    ctx.arc(x + width - 15, y + height/2 + 5, 18, 0, Math.PI * 2);
    ctx.arc(x + width/2, y + height/2 - 10, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawFence = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    const { x, y, width, height } = obs;
    ctx.fillStyle = COLORS.OBSTACLE_FENCE;
    ctx.shadowColor = '#5d4037';
    ctx.shadowBlur = 5;
    
    // Posts
    const postWidth = 10;
    const gap = (width - postWidth * 3) / 2;
    
    for (let i = 0; i < 3; i++) {
        const px = x + i * (postWidth + gap);
        // Pointy top
        ctx.beginPath();
        ctx.moveTo(px, y + 10);
        ctx.lineTo(px + postWidth/2, y);
        ctx.lineTo(px + postWidth, y + 10);
        ctx.lineTo(px + postWidth, y + height);
        ctx.lineTo(px, y + height);
        ctx.fill();
    }
    // Cross beams
    ctx.fillRect(x, y + 15, width, 5);
    ctx.fillRect(x, y + 35, width, 5);
    ctx.shadowBlur = 0;
  };

  const drawIcicle = (ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    const { x, y, width, height } = obs;
    ctx.fillStyle = COLORS.OBSTACLE_ICICLE;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#b3e5fc';
    
    // Multiple spikes
    ctx.beginPath();
    ctx.moveTo(x, y); // Top Left
    ctx.lineTo(x + width/4, y + height); // Tip 1
    ctx.lineTo(x + width/2, y + height/3); // Mid up
    ctx.lineTo(x + width * 0.75, y + height * 0.8); // Tip 2
    ctx.lineTo(x + width, y); // Top Right
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawCandyCane = (ctx: CanvasRenderingContext2D, item: Item, frame: number) => {
    const { x, y, width, height } = item;
    const hover = Math.sin(frame * 0.1) * 5;

    ctx.save();
    ctx.translate(x + width/2, y + height/2 + hover);
    // Rotate slightly for effect
    ctx.rotate(Math.sin(frame * 0.05) * 0.2);

    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
    
    // Draw Hook Shape
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(0, -5);
    ctx.arc(-10, -5, 10, 0, Math.PI, true);
    ctx.stroke();

    // Stripes (Masked or drawn on top)
    ctx.strokeStyle = item.colorValue; // Use the color of the potential suit!
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    // Glow
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.restore();
  };

  // --- Game Logic Functions ---

  const initGame = useCallback(() => {
    santaRef.current = {
      x: 100,
      y: CANVAS_HEIGHT - GROUND_HEIGHT - SANTA_HEIGHT,
      width: SANTA_WIDTH,
      height: SANTA_HEIGHT,
      dx: 0,
      dy: 0
    };
    obstaclesRef.current = [];
    itemsRef.current = [];
    isGroundedRef.current = true;
    jumpCountRef.current = 0;
    frameCountRef.current = 0;
    santaColorRef.current = COLORS.SANTA_RED; // Reset color
    
    // Init Snow
    snowRef.current = Array.from({ length: 80 }).map(() => ({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * CANVAS_HEIGHT,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * 1.5 + 0.5,
      drift: Math.random() * 0.5 - 0.25
    }));

    sceneryRef.current = [];
    for(let i=0; i<6; i++) {
        sceneryRef.current.push({
            x: i * 150 + Math.random() * 50,
            y: CANVAS_HEIGHT - GROUND_HEIGHT + 10 
        });
    }
  }, []);

  const jump = useCallback(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    // Double Jump Logic
    // Allow jump if we are grounded OR if we have jumped once and are in the air
    if (isGroundedRef.current) {
        santaRef.current.dy = JUMP_FORCE;
        isGroundedRef.current = false;
        jumpCountRef.current = 1;
    } else if (jumpCountRef.current < 2) {
        santaRef.current.dy = DOUBLE_JUMP_FORCE;
        jumpCountRef.current = 2;
        
        // Add a little particle effect for double jump maybe? (Visual flair handled by render only for now)
    }
  }, [gameStatus]);

  const spawnEntity = () => {
    // 15% chance to spawn an Item *instead* of an obstacle, or alongside?
    // Let's spawn items independently to avoid emptiness.
    // Actually, for simplicity, let's just sometimes pick an Item type.
    
    const isItem = Math.random() < 0.15;

    if (isItem) {
        const randomColor = SUIT_VARIANTS[Math.floor(Math.random() * SUIT_VARIANTS.length)];
        const itemY = CANVAS_HEIGHT - GROUND_HEIGHT - 100 - (Math.random() * 50); // Floating
        itemsRef.current.push({
            x: CANVAS_WIDTH,
            y: itemY,
            width: 30,
            height: 30,
            dx: 0,
            dy: 0,
            type: 'CANDY_CANE',
            collected: false,
            colorValue: randomColor
        });
        return; // Skip obstacle spawn this frame if item spawns? Or spawn both?
        // Let's skip obstacle to be kind.
    }

    // Spawn Obstacle
    const isGround = Math.random() > 0.4;
    let type: ObstacleType;
    let width = 40;
    let height = 40;
    let y = 0;

    if (isGround) {
        const roll = Math.random();
        if (roll < 0.33) type = ObstacleType.SNOWMAN;
        else if (roll < 0.66) type = ObstacleType.GIFT;
        else type = ObstacleType.FENCE;

        width = type === ObstacleType.FENCE ? 50 : (type === ObstacleType.GIFT ? 40 : 35);
        height = type === ObstacleType.GIFT ? 40 : 55;
        y = CANVAS_HEIGHT - GROUND_HEIGHT - height + 5; 
    } else {
        const roll = Math.random();
        if (roll < 0.4) type = ObstacleType.BIRD;
        else if (roll < 0.7) type = ObstacleType.CLOUD;
        else type = ObstacleType.ICICLE;

        width = type === ObstacleType.CLOUD ? 70 : 40;
        height = type === ObstacleType.CLOUD ? 35 : (type === ObstacleType.ICICLE ? 50 : 30);
        
        if (type === ObstacleType.ICICLE) {
             // Icicles hang from "sky" but for gameplay they need to be jumpable or duckable. 
             // In this runner, let's make them floating obstacles you must jump OVER or duck UNDER?
             // Since we don't have duck, they are just high obstacles to jump over (carefully) 
             // or low air obstacles.
             // Let's place them just above head height so you shouldn't jump? 
             // Or low enough you must jump over.
             // Let's treat them like flying stalactites (floating ice).
             y = CANVAS_HEIGHT - GROUND_HEIGHT - SANTA_HEIGHT - 20; 
        } else {
             y = CANVAS_HEIGHT - GROUND_HEIGHT - SANTA_HEIGHT - (type === ObstacleType.CLOUD ? 50 : 30);
        }
    }

    obstaclesRef.current.push({
      x: CANVAS_WIDTH,
      y,
      width,
      height,
      dx: 0, 
      dy: 0,
      type,
      passed: false
    });
  };

  const checkCollision = (rect1: Entity, rect2: Entity) => {
    const p1 = 10; 
    return (
      rect1.x + p1 < rect2.x + rect2.width - p1 &&
      rect1.x + rect1.width - p1 > rect2.x + p1 &&
      rect1.y + p1 < rect2.y + rect2.height - p1 &&
      rect1.y + rect1.height - p1 > rect2.y + p1
    );
  };

  const update = useCallback(() => {
    if (gameStatus !== GameStatus.PLAYING) return;

    frameCountRef.current++;
    const santa = santaRef.current;

    // Physics
    santa.dy += GRAVITY;
    santa.y += santa.dy;

    const floorY = CANVAS_HEIGHT - GROUND_HEIGHT - SANTA_HEIGHT;
    if (santa.y >= floorY) {
      santa.y = floorY;
      santa.dy = 0;
      isGroundedRef.current = true;
      jumpCountRef.current = 0; // Reset jump count on landing
    }

    // Parallax
    sceneryRef.current.forEach(tree => {
        tree.x -= PARALLAX_SPEED;
        if (tree.x < -50) tree.x = CANVAS_WIDTH + Math.random() * 50;
    });

    // Spawning
    if (frameCountRef.current % OBSTACLE_SPAWN_RATE === 0) {
      spawnEntity();
    }

    // Update Obstacles
    for (let i = obstaclesRef.current.length - 1; i >= 0; i--) {
      const obs = obstaclesRef.current[i];
      obs.x -= GAME_SPEED;

      if (!obs.passed && obs.x + obs.width < santa.x) {
        obs.passed = true;
        setScore(prev => prev + POINTS_PER_OBSTACLE);
      }

      if (obs.x + obs.width < -50) {
        obstaclesRef.current.splice(i, 1);
      }

      if (checkCollision(santa, obs)) {
        setGameStatus(GameStatus.GAME_OVER);
      }
    }

    // Update Items
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
        const item = itemsRef.current[i];
        item.x -= GAME_SPEED;
        
        // Item oscillation
        item.y += Math.sin(frameCountRef.current * 0.1) * 0.5;

        // Collision
        if (checkCollision(santa, item)) {
            // Collect!
            setScore(prev => prev + POINTS_PER_ITEM);
            santaColorRef.current = item.colorValue; // Change suit color
            itemsRef.current.splice(i, 1);
            continue;
        }

        if (item.x + item.width < -50) {
            itemsRef.current.splice(i, 1);
        }
    }

    // Snow
    snowRef.current.forEach(flake => {
      flake.y += flake.speed;
      flake.x += flake.drift;
      if (flake.y > CANVAS_HEIGHT) {
        flake.y = -10;
        flake.x = Math.random() * CANVAS_WIDTH;
      }
    });

  }, [gameStatus, setScore, setGameStatus]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGrad.addColorStop(0, COLORS.SKY_TOP);
    skyGrad.addColorStop(1, COLORS.SKY_BOTTOM);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Moon
    drawSoftCircle(ctx, 100, 80, 40, 'rgba(255,255,255,0.1)', 30);
    drawSoftCircle(ctx, 100, 80, 20, 'rgba(255,255,255,0.2)', 15);

    // 3. Trees
    const drawTree = (pos: Position) => {
        const { x, y } = pos;
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - 3, y, 6, 20);
        const drawLayer = (yOffset: number, width: number, color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x, y - yOffset - 40);
          ctx.lineTo(x - width, y - yOffset);
          ctx.lineTo(x + width, y - yOffset);
          ctx.fill();
        };
        ctx.globalAlpha = 0.8;
        drawLayer(0, 25, COLORS.TREE_DARK);
        drawLayer(15, 20, COLORS.TREE_LIGHT);
        drawLayer(30, 15, COLORS.TREE_DARK);
        ctx.globalAlpha = 1.0;
    };
    sceneryRef.current.forEach(tree => drawTree(tree));

    // 4. Ground
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_HEIGHT - GROUND_HEIGHT);
    for (let i = 0; i <= CANVAS_WIDTH; i += 100) {
        ctx.bezierCurveTo(
            i + 50, CANVAS_HEIGHT - GROUND_HEIGHT - 10,
            i + 50, CANVAS_HEIGHT - GROUND_HEIGHT + 10,
            i + 100, CANVAS_HEIGHT - GROUND_HEIGHT
        );
    }
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.lineTo(0, CANVAS_HEIGHT);
    ctx.closePath();
    const groundGrad = ctx.createLinearGradient(0, CANVAS_HEIGHT - GROUND_HEIGHT, 0, CANVAS_HEIGHT);
    groundGrad.addColorStop(0, COLORS.GROUND_TOP);
    groundGrad.addColorStop(1, COLORS.GROUND_BOTTOM);
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // 5. Items
    itemsRef.current.forEach(item => {
        drawCandyCane(ctx, item, frameCountRef.current);
    });

    // 6. Obstacles
    obstaclesRef.current.forEach(obs => {
      switch (obs.type) {
        case ObstacleType.SNOWMAN: drawSnowman(ctx, obs); break;
        case ObstacleType.GIFT: drawGift(ctx, obs); break;
        case ObstacleType.BIRD: drawBird(ctx, obs, frameCountRef.current); break;
        case ObstacleType.CLOUD: drawCloud(ctx, obs); break;
        case ObstacleType.FENCE: drawFence(ctx, obs); break;
        case ObstacleType.ICICLE: drawIcicle(ctx, obs); break;
      }
    });

    // 7. Santa
    drawSanta(ctx, santaRef.current, frameCountRef.current);

    // 8. Snow
    snowRef.current.forEach(flake => {
      ctx.beginPath();
      const grad = ctx.createRadialGradient(flake.x, flake.y, 0, flake.x, flake.y, flake.radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = grad;
      ctx.arc(flake.x, flake.y, flake.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    });

  }, []);

  // Main Loop
  useEffect(() => {
    const loop = () => {
      update();
      draw();
      frameIdRef.current = requestAnimationFrame(loop);
    };
    frameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameIdRef.current);
  }, [update, draw]);

  // Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameStatus === GameStatus.START || gameStatus === GameStatus.GAME_OVER) {
          setScore(0);
          initGame();
          setGameStatus(GameStatus.PLAYING);
        } else if (gameStatus === GameStatus.PLAYING) {
          jump();
        }
      }
    };

    const handleTouch = (e: TouchEvent | MouseEvent) => {
      if(e.type === 'touchstart') {
          // e.preventDefault(); 
      }
      if (gameStatus === GameStatus.START || gameStatus === GameStatus.GAME_OVER) {
        setScore(0);
        initGame();
        setGameStatus(GameStatus.PLAYING);
      } else if (gameStatus === GameStatus.PLAYING) {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const canvas = canvasRef.current;
    if(canvas) {
        canvas.addEventListener('mousedown', handleTouch);
        canvas.addEventListener('touchstart', handleTouch);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if(canvas) {
        canvas.removeEventListener('mousedown', handleTouch);
        canvas.removeEventListener('touchstart', handleTouch);
      }
    };
  }, [gameStatus, initGame, jump, setGameStatus, setScore]);

  // Init
  useEffect(() => {
    initGame();
    setTimeout(() => { draw(); }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="block bg-slate-800 rounded-lg shadow-2xl cursor-pointer touch-none mx-auto max-w-full border-4 border-slate-700/30"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
};

export default GameCanvas;