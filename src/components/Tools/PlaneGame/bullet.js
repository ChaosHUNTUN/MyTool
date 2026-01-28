import assetManager from './assetManager';

export class Bullet {
  constructor(x, y, bulletSpeed = 8, level = 1) {
    this.x = x;
    this.y = y;
    this.size = 5;
    this.speed = bulletSpeed;
    this.level = level;
    this.trail = [];
    this.maxTrailLength = 8;
    this.color = this.getTypeColor();
    this.glowColor = this.getTypeGlowColor();
    this.damage = 1;
  }
  
  getTypeColor() {
    switch(this.level) {
      case 1: return '#ffffff';
      case 2: return '#00ffff';
      case 3: return '#ff00ff';
      case 4: return '#ffff00';
      default: return '#ffffff';
    }
  }
  
  getTypeGlowColor() {
    switch(this.level) {
      case 1: return '#88ffff';
      case 2: return '#00ccff';
      case 3: return '#ff00cc';
      case 4: return '#ffcc00';
      default: return '#88ffff';
    }
  }
  
  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    this.y -= this.speed;
    
    if (this.vx !== undefined) {
      this.x += this.vx;
    }
  }
  
  draw(ctx) {
    ctx.save();
    
    // 绘制拖尾
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const trailPoint = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.3;
      const size = this.size * (i + 1) / this.trail.length * 0.6;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(trailPoint.x, trailPoint.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制发光效果
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    
    // 使用离屏 Canvas 贴图
    const glowAsset = assetManager.getAsset('bulletGlow');
    if (glowAsset) {
      const glowSize = this.size * 4;
      ctx.drawImage(glowAsset, this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
    }
    
    // 绘制子弹主体
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y, this.size * 1.2, this.size * 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制核心
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasHeight) {
    return this.y < -this.size * 2;
  }
}

export class EnemyBullet {
  constructor(x, y, type = 'normal', speed = 5) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 5;
    this.speed = speed;
    this.vx = 0;
    this.vy = speed;
    this.isBossBullet = false;
    this.color = this.getTypeColor();
    this.glowColor = this.getTypeGlowColor();
    this.angle = 0;
    this.trail = [];
    this.maxTrailLength = 6;
    this.isHoming = false;
    this.homingStrength = 0;
    this.homingTimer = 0;
    this.isLaser = false;
    this.length = 30;
    this.isSpiral = false;
    this.spiralSpeed = 0;
    this.spiralTimer = 0;
    this.isPulse = false;
    this.ringDelay = 0;
    this.pulsePhase = 0;
    this.damage = 1;
  }
  
  getTypeColor() {
    switch(this.type) {
      case 'normal': return '#ff4444';
      case 'homing': return '#ff8800';
      case 'laser': return '#8800ff';
      case 'spread': return '#44ff44';
      case 'scatter': return '#ff44ff';
      case 'boss_spiral': return '#aa00ff';
      case 'boss_burst': return '#ff00aa';
      case 'boss_laser': return '#00aaff';
      case 'boss_rain': return '#00ffaa';
      case 'boss_homing': return '#ff4444';
      case 'boss_pulse': return '#ffff00';
      default: return '#ff4444';
    }
  }
  
  getTypeGlowColor() {
    switch(this.type) {
      case 'normal': return '#ff0000';
      case 'homing': return '#ff4400';
      case 'laser': return '#aa00ff';
      case 'spread': return '#00ff00';
      case 'scatter': return '#ff00ff';
      case 'boss_spiral': return '#8800ff';
      case 'boss_burst': return '#ff0088';
      case 'boss_laser': return '#0088ff';
      case 'boss_rain': return '#00ff88';
      case 'boss_homing': return '#ff0000';
      case 'boss_pulse': return '#ffaa00';
      default: return '#ff0000';
    }
  }
  
  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    this.x += this.vx;
    this.y += this.vy;
    this.angle += 0.05;
  }
  
  updateHoming(player) {
    if (!this.isHoming || this.homingTimer <= 0) return;
    
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      const targetVx = (dx / distance) * this.speed;
      const targetVy = (dy / distance) * this.speed;
      
      this.vx += (targetVx - this.vx) * this.homingStrength;
      this.vy += (targetVy - this.vy) * this.homingStrength;
    }
  }
  
  draw(ctx) {
    ctx.save();
    
    // 绘制拖尾
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const trailPoint = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.3;
      const size = this.size * (i + 1) / this.trail.length * 0.6;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(trailPoint.x, trailPoint.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 绘制发光效果
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    
    // 使用离屏 Canvas 贴图
    const glowAsset = assetManager.getAsset('enemyBulletGlow');
    if (glowAsset) {
      const glowSize = this.size * 4;
      ctx.drawImage(glowAsset, this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
    }
    
    // 绘制子弹主体
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制核心
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasWidth, canvasHeight) {
    return this.x < -this.size * 3 || this.x > canvasWidth + this.size * 3 || 
           this.y < -this.size * 3 || this.y > canvasHeight + this.size * 3;
  }
}
