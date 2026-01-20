// 玩家飞机类
class Player {
  constructor(x, y, playerSpeed = 5) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.color = '#ffd93d';
    this.speed = playerSpeed; // 玩家移动速度
    this.angle = 0; // 旋转角度
    this.pulse = 0; // 脉冲效果
    this.trail = []; // 飞机拖尾效果
  }
  
  update(mousePos, canvasWidth, canvasHeight) {
    // 保存当前位置作为拖尾
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 8) {
      this.trail.shift();
    }
    
    // 直接跟随鼠标位置，无延迟
    this.x = mousePos.x;
    this.y = mousePos.y;
    
    // 边界限制
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
    
    // 更新动画效果
    this.angle += 0.05;
    this.pulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.8;
  }
  
  draw(ctx) {
    ctx.save();
    
    // 绘制拖尾效果
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i + 1) / this.trail.length * 0.3;
      const size = this.size * (i + 1) / this.trail.length;
      ctx.fillStyle = `rgba(255, 217, 61, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(this.trail[i].x, this.trail[i].y - size);
      ctx.lineTo(this.trail[i].x - size, this.trail[i].y + size);
      ctx.lineTo(this.trail[i].x + size, this.trail[i].y + size);
      ctx.closePath();
      ctx.fill();
    }
    
    // 飞机外发光效果
    ctx.shadowColor = '#ffd93d';
    ctx.shadowBlur = 15;
    
    // 飞机主体
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // 绘制飞机形状
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.size * this.pulse);
    ctx.lineTo(this.x - this.size, this.y + this.size);
    ctx.lineTo(this.x + this.size, this.y + this.size);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 添加飞机细节
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加引擎效果
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.arc(this.x - this.size * 0.5, this.y + this.size * 0.5, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(this.x + this.size * 0.5, this.y + this.size * 0.5, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

export default Player;
