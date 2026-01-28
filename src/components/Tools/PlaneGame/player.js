import assetManager from './assetManager';

class Player {
  constructor(x, y, playerSpeed = 5) {
    this.x = x;
    this.y = y;
    this.size = 24;
    this.color = '#00d4ff';
    this.speed = playerSpeed;
    this.angle = 0;
    this.pulse = 0;
    this.trail = [];
    this.engineFlicker = 0;
    this.tilt = 0;
    this.targetTilt = 0;
    this.hoverOffset = 0;
    this.weaponCooldown = 0;
    this.shieldActive = false;
    this.shieldPulse = 0;
  }
  
  update(mousePos, canvasWidth, canvasHeight) {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 15) {
      this.trail.shift();
    }
    
    const prevX = this.x;
    this.x = mousePos.x;
    this.y = mousePos.y;
    
    this.targetTilt = (this.x - prevX) * 0.02;
    this.targetTilt = Math.max(-0.3, Math.min(0.3, this.targetTilt));
    this.tilt += (this.targetTilt - this.tilt) * 0.1;
    
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    this.y = Math.max(this.size, Math.min(canvasHeight - this.size, this.y));
    
    this.angle += 0.03;
    this.pulse = Math.sin(Date.now() * 0.008) * 0.15 + 0.85;
    this.engineFlicker = Math.random();
    this.hoverOffset = Math.sin(Date.now() * 0.003) * 3;
    this.shieldPulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    
    if (this.weaponCooldown > 0) this.weaponCooldown--;
  }
  
  draw(ctx) {
    ctx.save();
    
    ctx.translate(this.x, this.y + this.hoverOffset);
    ctx.rotate(this.tilt);
    
    this.drawEngineFlame(ctx);
    this.drawShipBody(ctx);
    this.drawWeaponSystems(ctx);
    this.drawShield(ctx);
    this.drawTrail(ctx);
    
    ctx.restore();
  }
  
  drawEngineFlame(ctx) {
    const flameIntensity = 1 + this.engineFlicker * 0.5 + Math.abs(this.tilt) * 2;
    
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    for (let layer = 0; layer < 4; layer++) {
      const layerOffset = layer * 8;
      const layerSize = this.size * (0.4 + layer * 0.15) * flameIntensity;
      const alpha = 0.3 - layer * 0.07;
      
      const colors = [
        'rgba(0, 100, 255, ' + alpha + ')',
        'rgba(0, 150, 255, ' + alpha + ')',
        'rgba(100, 200, 255, ' + alpha + ')',
        'rgba(255, 255, 255, ' + alpha + ')'
      ];
      
      ctx.fillStyle = colors[layer];
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.25, this.size * 0.5 + layerOffset);
      ctx.quadraticCurveTo(
        -this.size * 0.35, this.size * 1.5 + layerOffset,
        0, this.size * 2.5 + layerOffset * 1.5
      );
      ctx.quadraticCurveTo(
        this.size * 0.35, this.size * 1.5 + layerOffset,
        this.size * 0.25, this.size * 0.5 + layerOffset
      );
      ctx.closePath();
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawShipBody(ctx) {
    ctx.fillStyle = '#006688';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.4 * this.pulse);
    ctx.lineTo(-this.size * 0.9, this.size * 0.3);
    ctx.lineTo(-this.size * 0.5, this.size * 0.6);
    ctx.lineTo(this.size * 0.5, this.size * 0.6);
    ctx.lineTo(this.size * 0.9, this.size * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#0088aa';
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.2 * this.pulse);
    ctx.lineTo(-this.size * 0.6, this.size * 0.2);
    ctx.lineTo(this.size * 0.6, this.size * 0.2);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#00ccff';
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.0 * this.pulse);
    ctx.lineTo(-this.size * 0.3, this.size * 0.1);
    ctx.lineTo(this.size * 0.3, this.size * 0.1);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#003344';
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 3; i++) {
      const lineY = -this.size * 0.6 + i * this.size * 0.4;
      ctx.beginPath();
      ctx.moveTo(-this.size * 0.4, lineY);
      ctx.lineTo(this.size * 0.4, lineY);
      ctx.stroke();
    }
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.5, this.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = `rgba(0, 255, 136, ${0.5 + Math.sin(Date.now() * 0.01) * 0.3})`;
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.5, this.size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.5, this.size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawWeaponSystems(ctx) {
    const weaponX = this.size * 0.7;
    const weaponY = this.size * 0.3;
    
    ctx.fillStyle = this.weaponCooldown > 0 ? '#ffaa00' : '#ff4400';
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(weaponX - this.size * 0.15, weaponY - this.size * 0.1);
    ctx.lineTo(weaponX + this.size * 0.1, weaponY);
    ctx.lineTo(weaponX - this.size * 0.15, weaponY + this.size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(-weaponX - this.size * 0.15, weaponY - this.size * 0.1);
    ctx.lineTo(-weaponX + this.size * 0.1, weaponY);
    ctx.lineTo(-weaponX - this.size * 0.15, weaponY + this.size * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    if (this.weaponCooldown > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(weaponX, weaponY, this.size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-weaponX, weaponY, this.size * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  
  drawShield(ctx) {
    if (!this.shieldActive) return;
    
    ctx.strokeStyle = `rgba(0, 255, 136, ${this.shieldPulse * 0.5})`;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 1.8, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.fillStyle = `rgba(0, 255, 136, ${this.shieldPulse * 0.05})`;
    ctx.fill();
    
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2 + Date.now() * 0.002;
      const innerR = this.size * 1.5;
      const outerR = this.size * 1.8;
      
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      ctx.stroke();
    }
  }
  
  drawTrail(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.6;
      const size = this.size * (i / this.trail.length) * 0.4;
      
      ctx.fillStyle = `rgba(0, 150, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x - this.x, this.trail[i].y - this.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  fire() {
    this.weaponCooldown = 8;
    return [
      { x: this.x + this.size * 0.6, y: this.y - this.size * 0.3, vx: 0, vy: -15 },
      { x: this.x - this.size * 0.6, y: this.y - this.size * 0.3, vx: 0, vy: -15 }
    ];
  }
}

export default Player;
