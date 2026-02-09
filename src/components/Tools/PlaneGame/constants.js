export const EnemyState = {
  SPAWNING: 'spawning',
  PATROLLING: 'patrolling',
  CHASING: 'chasing',
  ATTACKING: 'attacking',
  RETREATING: 'retreating',
  DYING: 'dying'
};

export const BossPhase = {
  PHASE_1: 1,
  PHASE_2: 2,
  PHASE_3: 3
};

export const BulletType = {
  NORMAL: 'normal',
  HOMING: 'homing',
  LASER: 'laser',
  SPREAD: 'spread'
};

export const GAME_CONFIG = {
  BOSS_SPAWN_THRESHOLD: 1000,
  MAX_ENEMY_BULLETS: 30,
  STARS_COUNT: 200,
  BOSS_MAX_LIVES: {
    easy: 100,
    hard: 150,
    nightmare: 200
  },
  BOSS_BASE_SPEED: {
    easy: 2,
    hard: 3,
    nightmare: 4
  },
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600
};

const configCache = {};

export const getDifficultyConfig = (difficulty) => {
  if (configCache[difficulty]) {
    return configCache[difficulty];
  }
  
  const baseConfig = {
    bulletSpeed: 8,
    bulletCooldown: 200,
    playerSpeed: 5,
    safeDistance: 100,
    enemySpawnInterval: 3000,
    enemyTypes: {
      small: { speed: 2, health: 1, score: 1, size: 15, color: '#ff0000' },
      medium: { speed: 1.5, health: 3, score: 5, size: 25, color: '#ffff00' },
      heavy: { speed: 1, health: 10, score: 20, size: 40, color: '#00ff00' }
    }
  };
  
  let config;
  switch(difficulty) {
    case 'easy':
      config = {
        ...baseConfig,
        enemySpawnInterval: 3000
      };
      break;
      
    case 'hard':
      config = {
        ...baseConfig,
        enemySpawnInterval: 2000,
        enemyTypes: {
          small: { ...baseConfig.enemyTypes.small, health: 2 },
          medium: { ...baseConfig.enemyTypes.medium, health: 4 },
          heavy: { ...baseConfig.enemyTypes.heavy, health: 12 }
        }
      };
      break;
      
    case 'nightmare':
      config = {
        ...baseConfig,
        enemySpawnInterval: 1000,
        enemyTypes: {
          small: { ...baseConfig.enemyTypes.small, health: 3, speed: 3 },
          medium: { ...baseConfig.enemyTypes.medium, health: 5, speed: 2.5 },
          heavy: { ...baseConfig.enemyTypes.heavy, health: 15, speed: 2 }
        }
      };
      break;
      
    default:
      config = baseConfig;
  }
  
  configCache[difficulty] = config;
  return config;
};

export default GAME_CONFIG;
