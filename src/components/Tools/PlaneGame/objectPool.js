// 对象池管理器
class ObjectPool {
  constructor() {
    this.pools = {
      bullet: [],
      enemyBullet: [],
      enemy: [],
      particle: []
    };
    this.maxPoolSize = 500;
  }

  // 获取对象
  get(type, ...args) {
    if (this.pools[type].length > 0) {
      const obj = this.pools[type].pop();
      this.resetObject(obj, type, ...args);
      return obj;
    }
    return this.createObject(type, ...args);
  }

  // 回收对象
  recycle(type, obj) {
    if (this.pools[type].length < this.maxPoolSize) {
      this.pools[type].push(obj);
    }
  }

  // 创建新对象
  createObject(type, ...args) {
    switch(type) {
      case 'bullet':
        return new Bullet(...args);
      case 'enemyBullet':
        return new EnemyBullet(...args);
      case 'enemy':
        return new Enemy(...args);
      case 'particle':
        return new Particle(...args);
      default:
        return null;
    }
  }

  // 重置对象状态
  resetObject(obj, type, ...args) {
    switch(type) {
      case 'bullet':
        if (args.length >= 4) {
          obj.x = args[0];
          obj.y = args[1];
          obj.speed = args[2];
          obj.level = args[3];
        }
        obj.trail = [];
        obj.damage = 1;
        break;
      case 'enemyBullet':
        if (args.length >= 4) {
          obj.x = args[0];
          obj.y = args[1];
          obj.type = args[2];
          obj.speed = args[3];
        }
        obj.trail = [];
        obj.vx = 0;
        obj.vy = obj.speed;
        obj.isHoming = false;
        obj.homingStrength = 0;
        obj.homingTimer = 0;
        break;
      case 'enemy':
        // 敌人对象重置较为复杂，可能需要重新创建
        return this.createObject(type, ...args);
      case 'particle':
        if (args.length >= 3) {
          obj.x = args[0];
          obj.y = args[1];
          obj.type = args[2];
        }
        obj.size = Math.random() * 4 + 2;
        obj.vx = (Math.random() - 0.5) * 10;
        obj.vy = (Math.random() - 0.5) * 10;
        obj.alpha = 1;
        obj.life = 100;
        break;
    }
  }

  // 清空对象池
  clear() {
    Object.keys(this.pools).forEach(type => {
      this.pools[type] = [];
    });
  }

  // 获取对象池状态
  getStatus() {
    const status = {};
    Object.keys(this.pools).forEach(type => {
      status[type] = this.pools[type].length;
    });
    return status;
  }
}

// 延迟导入，避免循环依赖
let Bullet, EnemyBullet, Enemy, Particle;

// 动态导入
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const { Bullet: BulletClass, EnemyBullet: EnemyBulletClass } = require('./bullet');
    const { Enemy: EnemyClass } = require('./enemy');
    const ParticleClass = require('./particle').default;
    
    Bullet = BulletClass;
    EnemyBullet = EnemyBulletClass;
    Enemy = EnemyClass;
    Particle = ParticleClass;
  }, 0);
}

// 导出单例实例
const objectPool = new ObjectPool();
export default objectPool;
