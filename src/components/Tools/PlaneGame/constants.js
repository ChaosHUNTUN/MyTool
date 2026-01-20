// 敌人状态枚举
export const EnemyState = {
  SPAWNING: 'spawning',
  PATROLLING: 'patrolling',
  CHASING: 'chasing',
  ATTACKING: 'attacking',
  RETREATING: 'retreating',
  DYING: 'dying'
};

// Boss阶段枚举
export const BossPhase = {
  PHASE_1: 1,
  PHASE_2: 2,
  PHASE_3: 3
};

// 子弹类型枚举
export const BulletType = {
  NORMAL: 'normal',
  HOMING: 'homing',
  LASER: 'laser',
  SPREAD: 'spread'
};

// 游戏配置常量
export const GAME_CONFIG = {
  BOSS_SPAWN_THRESHOLD: 5000,
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
  }
};
