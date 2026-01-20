// 粒子类 - 用于爆炸、碰撞等效果
class Particle {
  constructor(x, y, type = 'explosion') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = Math.random() * 3 + 1;
    this.vx = (Math.random() - 0.5) * 8;
    this.vy = (Math.random() - 0.5) * 8;
    this.alpha = 1;
    this.life = 100;
    this.maxLife = 100;
    this.color = this.getParticleColor();
  }
  
  getParticleColor() {
    switch(this.type) {
      case 'explosion':
        return ['#ff0000', '#ff8800', '#ffff00'][Math.floor(Math.random() * 3)];
      case 'laser':
        return '#00ffff';
      case 'bullet':
        return '#ffffff';
      case 'powerup':
        return '#ffd700';
      default:
        return '#ffffff';
    }
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.life--;
    this.alpha = this.life / this.maxLife;
    this.size *= 0.98;
  }
  
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  
  isAlive() {
    return this.life > 0;
  }
}

export default Particle;
