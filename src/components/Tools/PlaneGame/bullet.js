// 玩家子弹类
export class Bullet {
  constructor(x, y, bulletSpeed = 8, level = 1) {
    this.x = x;
    this.y = y;
    this.size = 4;
    this.speed = bulletSpeed;
    this.level = level;
    this.trail = []; // 子弹拖尾效果
    this.maxTrailLength = 8; // 最大拖尾长度
    this.getBulletColor();
  }
  
  getBulletColor() {
    // 根据等级获取不同颜色
    switch(this.level) {
      case 1:
        this.color = '#ffffff';
        this.glowColor = '#ffffff';
        break;
      case 2:
        this.color = '#00ffff';
        this.glowColor = '#00ffff';
        break;
      case 3:
        this.color = '#ff00ff';
        this.glowColor = '#ff00ff';
        break;
      case 4:
        this.color = '#ffff00';
        this.glowColor = '#ffff00';
        break;
      default:
        this.color = '#ffffff';
        this.glowColor = '#ffffff';
    }
  }
  
  update() {
    // 保存当前位置作为拖尾
    this.trail.push({ x: this.x, y: this.y });
    // 限制拖尾长度
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
    
    this.y -= this.speed;
  }
  
  draw(ctx) {
    ctx.save();
    
    // 绘制拖尾效果，增强视觉效果
    for (let i = this.trail.length - 1; i >= 0; i--) {
      const trailPoint = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.6;
      const size = this.size * (i + 1) / this.trail.length * 2;
      
      // 拖尾外发光
      ctx.shadowColor = this.glowColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(${parseInt(this.color.slice(1, 3), 16)}, ${parseInt(this.color.slice(3, 5), 16)}, ${parseInt(this.color.slice(5, 7), 16)}, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(trailPoint.x, trailPoint.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 子弹外发光效果
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 15;
    
    // 绘制主子弹
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加子弹核心高亮
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasHeight) {
    return this.y < -this.size;
  }
}

// 敌方子弹类
export class EnemyBullet {
  constructor(x, y, type = 'normal', speed = 5) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = 4;
    this.speed = speed;
    this.vx = 0;
    this.vy = speed;
    this.isBossBullet = false;
    this.color = this.getTypeColor();
    this.angle = 0;
  }
  
  getTypeColor() {
    switch(this.type) {
      case 'normal': return '#ff4444';
      case 'homing': return '#ff8800';
      case 'laser': return '#8800ff';
      case 'spread': return '#44ff44';
      default: return '#ff4444';
    }
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.angle += 0.1;
  }
  
  draw(ctx) {
    ctx.save();
    
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    // 绘制不同类型的子弹
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    switch(this.type) {
      case 'normal':
        // 普通子弹：圆形
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'homing':
        // 追踪子弹：三角形
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(this.size, this.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'laser':
        // 激光子弹：长方形
        ctx.fillRect(-this.size / 2, -this.size * 2, this.size, this.size * 4);
        break;
        
      case 'spread':
        // 散射子弹：十字形
        ctx.fillRect(-this.size, -this.size / 2, this.size * 2, this.size);
        ctx.fillRect(-this.size / 2, -this.size, this.size, this.size * 2);
        break;
    }
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasWidth, canvasHeight) {
    return this.x < -this.size || this.x > canvasWidth + this.size || 
           this.y < -this.size || this.y > canvasHeight + this.size;
  }
}
