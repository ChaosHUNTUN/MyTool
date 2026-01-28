class Particle {
  constructor(x, y, type = 'explosion') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = Math.random() * 4 + 2;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.alpha = 1;
    this.life = 100;
    this.maxLife = 100;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.color = this.getParticleColor();
    this.glowColor = this.getParticleGlowColor();
    this.shape = this.getParticleShape();
  }
  
  getParticleColor() {
    switch(this.type) {
      case 'explosion':
        const explosionColors = ['#ff4444', '#ff6644', '#ff8844', '#ffaa44', '#ffcc44', '#ffff44', '#ffffff'];
        return explosionColors[Math.floor(Math.random() * explosionColors.length)];
      case 'laser':
        return '#00ffff';
      case 'bullet':
        return '#88ffff';
      case 'powerup':
        return '#ffd700';
      case 'engine':
        return ['#0088ff', '#00aaff', '#00ccff', '#ffffff'][Math.floor(Math.random() * 4)];
      case 'boss_hit':
        return '#ff00ff';
      default:
        return '#ffffff';
    }
  }
  
  getParticleGlowColor() {
    switch(this.type) {
      case 'explosion': return '#ff4400';
      case 'laser': return '#00ffff';
      case 'bullet': return '#00aaff';
      case 'powerup': return '#ffaa00';
      case 'engine': return '#0088ff';
      case 'boss_hit': return '#ff00aa';
      default: return '#ffffff';
    }
  }
  
  getParticleShape() {
    switch(this.type) {
      case 'explosion': return Math.random() > 0.5 ? 'circle' : 'square';
      case 'laser': return 'line';
      case 'bullet': return 'circle';
      case 'powerup': return 'star';
      case 'engine': return 'circle';
      case 'boss_hit': return 'circle';
      default: return 'circle';
    }
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.life--;
    this.alpha = this.life / this.maxLife;
    this.size *= 0.97;
    this.rotation += this.rotationSpeed;
  }
  
  draw(ctx) {
    ctx.save();
    
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.glowColor;
    ctx.lineWidth = 1;
    
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    ctx.shadowColor = this.glowColor;
    ctx.shadowBlur = 10;
    
    switch(this.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'square':
        ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        ctx.strokeRect(-this.size, -this.size, this.size * 2, this.size * 2);
        break;
        
      case 'line':
        ctx.shadowBlur = 5;
        ctx.lineWidth = this.size;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 2);
        ctx.lineTo(0, this.size * 2);
        ctx.stroke();
        break;
        
      case 'star':
        this.drawStar(ctx, 0, 0, 5, this.size, this.size * 0.5);
        break;
    }
    
    ctx.restore();
  }
  
  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  
  isAlive() {
    return this.life > 0;
  }
}

export default Particle;
