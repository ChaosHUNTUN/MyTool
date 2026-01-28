// 程序化图形加成包系统
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.baseSize = 18;
    this.size = this.baseSize;
    this.vx = 0;
    this.vy = 1.5;
    this.rotation = 0;
    this.pulse = 0;
    this.time = 0;
    this.color = this.getTypeColor();
    this.glowColor = this.getTypeGlowColor();
    this.hoverOffset = 0;
    this.hoverPhase = Math.random() * Math.PI * 2;
    this.spawnAnimation = 0;
    this.isSpawning = true;
    this.particles = [];
    this.magnetRange = 180;
    this.magnetStrength = 0;
  }

  getTypeColor() {
    switch(this.type) {
      case 'health': return '#4ecdc4';
      case 'attack': return '#ff6b6b';
      case 'invincible': return '#45b7d1';
      case 'upgrade': return '#ff9f43';
      default: return '#95e1d3';
    }
  }

  getTypeGlowColor() {
    switch(this.type) {
      case 'health': return '#00ff88';
      case 'attack': return '#ff4444';
      case 'invincible': return '#00aaff';
      case 'upgrade': return '#ffaa00';
      default: return '#88ffcc';
    }
  }

  update(canvasWidth, canvasHeight) {
    this.time += 0.05;
    this.rotation += 0.02;
    this.pulse = Math.sin(this.time * 3) * 0.15 + 0.85;
    this.hoverOffset = Math.sin(this.time * 2 + this.hoverPhase) * 3;
    this.size = this.baseSize * this.pulse;

    // 弹出动画
    if (this.isSpawning) {
      this.spawnAnimation += 0.1;
      if (this.spawnAnimation >= 1) {
        this.isSpawning = false;
        this.spawnAnimation = 1;
        // 播放弹出动画时生成粒子
        this.spawnParticles();
      }
      this.y += (1 - this.spawnAnimation) * 3;
    }

    // 正常移动
    if (!this.isSpawning) {
      this.x += this.vx;
      this.y += this.vy;

      // 边界反弹
      if (this.x - this.baseSize <= 0 || this.x + this.baseSize >= canvasWidth) {
        this.vx = -this.vx * 0.7;
        this.x = Math.max(this.baseSize, Math.min(canvasWidth - this.baseSize, this.x));
      }
      if (this.y - this.baseSize <= 0 || this.y + this.baseSize >= canvasHeight) {
        this.vy = -this.vy * 0.7;
        this.y = Math.max(this.baseSize, Math.min(canvasHeight - this.baseSize, this.y));
      }

      // 速度衰减
      this.vx *= 0.99;
      this.vy *= 0.99;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
      if (Math.abs(this.vy) < 0.1 && this.y > canvasHeight - 100) this.vy = 0;
    }

    // 更新粒子
    this.particles = this.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      p.size *= 0.97;
      return p.life > 0;
    });
  }

  applyMagnetism(player) {
    if (this.isSpawning) return;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.magnetRange && distance > 0) {
      const force = (1 - distance / this.magnetRange) * 0.8;
      this.magnetStrength = force;
      this.vx += (dx / distance) * force;
      this.vy += (dy / distance) * force;
    } else {
      this.magnetStrength = 0;
    }
  }

  spawnParticles() {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2 - 1,
        size: this.baseSize * 0.3,
        life: 1,
        color: this.glowColor
      });
    }
  }

  draw(ctx) {
    ctx.save();

    const scale = this.isSpawning ? this.easeOutBack(this.spawnAnimation) : 1;
    ctx.translate(this.x, this.y + this.hoverOffset);
    ctx.scale(scale, scale);

    // 绘制粒子
    this.drawParticles(ctx);

    // 绘制容器（六边形）
    this.drawContainer(ctx);

    // 绘制图标
    this.drawIcon(ctx);

    ctx.restore();
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  drawParticles(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x - this.x, p.y - this.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  drawContainer(ctx) {
    const time = this.time;
    const size = this.baseSize;
    const angle = this.rotation;

    // 3. 绘制外围扩散环
    const ringProgress = time % 1.0;
    const ringSize = size + ringProgress * 15;
    const ringAlpha = 1.0 - ringProgress;

    if (ringAlpha > 0) {
      ctx.strokeStyle = this.glowColor;
      ctx.globalAlpha = ringAlpha * 0.5;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. 绘制发光外边框（六边形）
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 15 + this.magnetStrength * 20;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const vertexAngle = angle + (i / 6) * Math.PI * 2;
      const px = Math.cos(vertexAngle) * size;
      const py = Math.sin(vertexAngle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // 1. 绘制背景六边形（半透明）
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.25;
    ctx.shadowBlur = 0;
    ctx.fill();

    // 六边形内部装饰线
    ctx.strokeStyle = this.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const vertexAngle = angle + (i / 6) * Math.PI * 2;
      const px = Math.cos(vertexAngle) * size * 0.6;
      const py = Math.sin(vertexAngle) * size * 0.6;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  drawIcon(ctx) {
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.glowColor;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    switch(this.type) {
      case 'attack':
        this.drawIconAttack(ctx);
        break;
      case 'health':
        this.drawIconHealth(ctx);
        break;
      case 'invincible':
        this.drawIconInvincible(ctx);
        break;
      case 'upgrade':
        this.drawIconUpgrade(ctx);
        break;
    }

    ctx.restore();
  }

  // 攻击提升 - 双重矢量箭头
  drawIconAttack(ctx) {
    const time = this.time;
    const offset = Math.sin(time * 10) * 2;
    const arrowSize = 4;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < 2; i++) {
      const yOffset = i * 8 - 4;

      ctx.beginPath();
      ctx.moveTo(-6, yOffset - offset);
      ctx.lineTo(0, yOffset - 8 - offset);
      ctx.lineTo(6, yOffset - offset);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-3, yOffset - 5 - offset);
      ctx.lineTo(0, yOffset - 8 - offset);
      ctx.lineTo(3, yOffset - 5 - offset);
      ctx.stroke();
    }

    // 中心高亮
    ctx.fillStyle = '#ffffaa';
    ctx.beginPath();
    ctx.arc(0, -6 - offset, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 回复生命 - 脉动十字
  drawIconHealth(ctx) {
    const time = this.time;
    const scale = 1 + Math.sin(time * 5) * 0.15;
    const w = 10 * scale;
    const h = 3 * scale;
    const w2 = 3 * scale;
    const h2 = 10 * scale;

    // 发光效果
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-w, -h2, w * 2, h2 * 2);
    ctx.fillRect(-w2, -h, w * 2, h * 2);

    // 中心装饰
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // 脉冲环
    const pulseRing = Math.sin(time * 3) * 0.5 + 0.5;
    ctx.strokeStyle = this.glowColor;
    ctx.globalAlpha = pulseRing;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 短暂无敌 - 原子环绕
  drawIconInvincible(ctx) {
    const time = this.time;

    // 核心实心圆
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // 交叉椭圆轨道
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;

    ctx.save();
    ctx.rotate(time * 5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 轨道上的小亮点
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const orbAngle = time * 3 + (i / 4) * Math.PI * 2;
      const orbX = Math.cos(orbAngle) * 10;
      const orbY = Math.sin(orbAngle) * 3;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 机体升级 - 嵌套多角星（旋转正方形）
  drawIconUpgrade(ctx) {
    const time = this.time;
    const rot = time * 3;
    const size = 7;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;

    // 外层正方形
    ctx.save();
    ctx.rotate(rot);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 内层正方形（反向旋转）
    ctx.save();
    ctx.rotate(rot + Math.PI / 4);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 - Math.PI / 4;
      const px = Math.cos(angle) * size * 0.5;
      const py = Math.sin(angle) * size * 0.5;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 中心发光点
    ctx.fillStyle = '#ffffaa';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // 装饰角标
    ctx.fillStyle = this.glowColor;
    ctx.beginPath();
    ctx.arc(0, -size - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  isOutOfBounds(canvasWidth, canvasHeight) {
    return false;
  }
}

export default PowerUp;
