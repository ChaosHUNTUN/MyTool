// 资产管理器 - 管理离屏 Canvas 贴图
class AssetManager {
  constructor() {
    this.assets = new Map();
    this.initAssets();
  }

  initAssets() {
    this.createBulletGlow();
    this.createEnemyBulletGlow();
    this.createPowerUpGlow();
    this.createExplosion();
    this.createEnemyGlow();
    this.createBossGlow();
    this.createStarGlow();
  }

  // 创建子弹发光贴图
  createBulletGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(0, 200, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('bulletGlow', canvas);
  }

  // 创建敌方子弹发光贴图
  createEnemyBulletGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, 'rgba(255, 100, 100, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 50, 50, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('enemyBulletGlow', canvas);
  }

  // 创建加成包发光贴图
  createPowerUpGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 80;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(40, 40, 0, 40, 40, 40);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.6, 'rgba(255, 200, 100, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(40, 40, 40, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('powerUpGlow', canvas);
  }

  // 创建爆炸效果贴图
  createExplosion() {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(30, 30, 0, 30, 30, 30);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 50, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(30, 30, 30, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('explosion', canvas);
  }
  
  // 创建敌人发光贴图
  createEnemyGlow() {
    const enemyGlows = {
      small: '#ff3300',
      medium: '#ffaa00',
      heavy: '#00ff00'
    };
    
    Object.entries(enemyGlows).forEach(([type, color]) => {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      
      const gradient = ctx.createRadialGradient(60, 60, 0, 60, 60, 60);
      gradient.addColorStop(0, color + '80');
      gradient.addColorStop(0.3, color + '40');
      gradient.addColorStop(0.6, color + '20');
      gradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(60, 60, 60, 0, Math.PI * 2);
      ctx.fill();
      
      this.assets.set(`enemy${type}Glow`, canvas);
    });
  }
  
  // 创建Boss发光贴图
  createBossGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(100, 100, 0, 100, 100, 100);
    gradient.addColorStop(0, 'rgba(102, 0, 204, 0.8)');
    gradient.addColorStop(0.3, 'rgba(128, 0, 255, 0.4)');
    gradient.addColorStop(0.6, 'rgba(153, 50, 204, 0.2)');
    gradient.addColorStop(1, 'rgba(102, 0, 204, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(100, 100, 100, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('bossGlow', canvas);
  }
  
  // 创建星星背景贴图
  createStarGlow() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(20, 20, 0, 20, 20, 20);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(20, 20, 20, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set('starGlow', canvas);
  }

  getAsset(name) {
    return this.assets.get(name);
  }

  // 动态创建不同颜色的子弹贴图
  getColoredBullet(color, size = 20) {
    const key = `bullet_${color}_${size}`;
    if (this.assets.has(key)) {
      return this.assets.get(key);
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(size, size, 0, size, size, size);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color + '80');
    gradient.addColorStop(1, color + '00');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size, size, size, 0, Math.PI * 2);
    ctx.fill();
    
    this.assets.set(key, canvas);
    return canvas;
  }
}

// 导出单例实例
const assetManager = new AssetManager();
export default assetManager;
