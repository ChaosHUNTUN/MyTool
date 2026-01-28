import { EnemyState, BossPhase } from './constants';
import { EnemyBullet } from './bullet';
import Particle from './particle';
import assetManager from './assetManager';

export class Enemy {
  constructor(x, y, type, trajectory, enemyConfig) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.health = enemyConfig.health;
    this.maxHealth = enemyConfig.health;
    this.size = enemyConfig.size;
    this.color = enemyConfig.color;
    this.speed = enemyConfig.speed;
    this.score = enemyConfig.score;
    this.trajectory = trajectory || { 
      type: 'straight',
      direction: { x: 0, y: 1 },
      curveFactor: 0,
      startTime: Date.now()
    };
    this.pulse = 0;
    this.rotation = 0;
    this.rotationSpeed = 0.02;
    this.state = EnemyState.PATROLLING;
    this.spawnTime = Date.now();
    this.detectionRadius = this.getTypeDetectionRadius();
    this.isInCombat = false;
    this.targetPos = null;
    this.patrolPath = null;
    this.currentWaypoint = 0;
    this.lastAttackTime = 0;
    this.attackCooldown = this.getTypeAttackCooldown();
    this.isHit = false;
    this.hitTimer = 0;
    this.hitInvulnerable = 0;
    this.currentPhase = 1;
    this.phaseThresholds = [1, 0.7, 0.3];
    this.hoverOffset = 0;
    this.hoverSpeed = 0.003 + Math.random() * 0.002;
    this.corePulse = 0;
    this.turretAngle = 0;
    this.shieldRotation = 0;
    this.chargeLevel = 0;
    this.stretchFactor = 1;
  }
  
  getTypeDetectionRadius() {
    switch(this.type) {
      case 'small': return 180;
      case 'medium': return 250;
      case 'heavy': return 350;
      default: return 150;
    }
  }
  
  getTypeAttackCooldown() {
    switch(this.type) {
      case 'small': return 1200;
      case 'medium': return 1800;
      case 'heavy': return 2500;
      default: return 1500;
    }
  }
  
  updateHitState() {
    if (this.isHit) {
      this.hitTimer--;
      if (this.hitTimer <= 0) {
        this.isHit = false;
      }
    }
    if (this.hitInvulnerable > 0) {
      this.hitInvulnerable--;
    }
  }
  
  getDistanceToPlayer(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  detectPlayer(player) {
    const distance = this.getDistanceToPlayer(player);
    return distance <= this.detectionRadius;
  }
  
  updateState(player) {
    const healthPercentage = this.health / this.maxHealth;
    if (this.type === 'heavy') {
      for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
        if (healthPercentage <= this.phaseThresholds[i]) {
          this.currentPhase = i + 1;
          break;
        }
      }
    }
    const isPlayerDetected = this.detectPlayer(player);
    switch(this.state) {
      case EnemyState.PATROLLING:
        if (isPlayerDetected) {
          this.state = EnemyState.CHASING;
          this.isInCombat = true;
        }
        break;
      case EnemyState.CHASING:
        if (!isPlayerDetected) {
          this.state = EnemyState.PATROLLING;
          this.isInCombat = false;
        } else if (healthPercentage < 0.3 && (this.type === 'medium' || this.type === 'heavy')) {
          this.state = EnemyState.RETREATING;
        } else {
          const distance = this.getDistanceToPlayer(player);
          if (distance < 120) {
            this.state = EnemyState.ATTACKING;
          }
        }
        break;
      case EnemyState.ATTACKING:
        if (!isPlayerDetected) {
          this.state = EnemyState.PATROLLING;
          this.isInCombat = false;
        } else if (healthPercentage < 0.3 && (this.type === 'medium' || this.type === 'heavy')) {
          this.state = EnemyState.RETREATING;
        } else {
          const distance = this.getDistanceToPlayer(player);
          if (distance > 180) {
            this.state = EnemyState.CHASING;
          }
        }
        break;
      case EnemyState.RETREATING:
        const distance = this.getDistanceToPlayer(player);
        if (distance > this.detectionRadius * 1.5) {
          this.state = EnemyState.PATROLLING;
          this.isInCombat = false;
        }
        break;
    }
  }
  
  updateSmallBehavior(player, canvasWidth, canvasHeight) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.stretchFactor = 1 + (1 - Math.min(1, distance / 300)) * 0.3;
    
    switch(this.state) {
      case EnemyState.PATROLLING:
        this.y += this.speed;
        this.x += Math.sin(Date.now() * 0.003 + this.spawnTime) * 0.5;
        
        // 检查小型敌人是否移动到屏幕底部边缘
        const edgeMargin = this.size * 2;
        if (this.y >= canvasHeight - edgeMargin) {
          // 切换到撤退状态，让敌人继续飞出屏幕
          this.state = EnemyState.RETREATING;
        }
        break;
      case EnemyState.CHASING:
        if (distance > 0) {
          this.x += (dx / distance) * this.speed * 1.5;
          this.y += (dy / distance) * this.speed * 1.2;
        }
        break;
      case EnemyState.ATTACKING:
        break;
      case EnemyState.RETREATING:
        this.y += this.speed * 1.5;
        break;
    }
  }
  
  updateMediumBehavior(player, canvasWidth, canvasHeight) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    this.turretAngle = Math.atan2(dy, dx);
    
    switch(this.state) {
      case EnemyState.PATROLLING:
        if (!this.patrolPath) {
          this.patrolPath = [
            { x: this.x - 120, y: this.y },
            { x: this.x + 120, y: this.y },
            { x: this.x, y: this.y - 50 },
            { x: this.x, y: this.y + 50 }
          ];
        }
        const currentWaypoint = this.patrolPath[this.currentWaypoint];
        const pdx = currentWaypoint.x - this.x;
        const pdy = currentWaypoint.y - this.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < 10) {
          this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
        } else {
          this.x += (pdx / pdist) * this.speed * 0.6;
          this.y += (pdy / pdist) * this.speed * 0.6;
        }
        break;
      case EnemyState.CHASING:
        if (distance > 0) {
          this.x += (dx / distance) * this.speed * 0.8;
          this.y += (dy / distance) * this.speed * 0.6;
        }
        break;
      case EnemyState.ATTACKING:
        break;
      case EnemyState.RETREATING:
        if (this.x < canvasWidth / 2) {
          this.x -= this.speed;
        } else {
          this.x += this.speed;
        }
        this.y += this.speed * 1.2;
        break;
    }
  }
  
  updateHeavyBehavior(player, canvasWidth, canvasHeight) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    this.chargeLevel = Math.min(1, this.chargeLevel + 0.01);
    
    switch(this.state) {
      case EnemyState.PATROLLING:
        const elapsed = Date.now() - this.trajectory.startTime;
        const curveOffset = Math.sin(elapsed * 0.001) * this.trajectory.curveFactor;
        switch(this.trajectory.type) {
          case 'diagonal':
            this.x += this.trajectory.direction.x * this.speed * 0.5;
            this.y += this.trajectory.direction.y * this.speed * 0.5;
            break;
          case 'curve':
            this.x += this.trajectory.direction.x * this.speed * 0.5 + curveOffset * 0.3;
            this.y += this.trajectory.direction.y * this.speed * 0.5;
            break;
          default:
            this.x += Math.sin(elapsed * 0.0005) * this.speed * 0.3;
            this.y += this.trajectory.direction.y * this.speed * 0.5;
        }
        break;
      case EnemyState.CHASING:
        if (distance > 0) {
          this.x += (dx / distance) * this.speed * 0.4;
          this.y += (dy / distance) * this.speed * 0.3;
        }
        break;
      case EnemyState.ATTACKING:
        switch(this.currentPhase) {
          case 1:
            this.y += this.speed * 0.3;
            break;
          case 2:
            this.y += this.speed * 0.8;
            break;
          case 3:
            this.y += this.speed * 1.2;
            this.x += Math.sin(Date.now() * 0.002) * this.speed;
            break;
        }
        break;
      case EnemyState.RETREATING:
        this.y -= this.speed * 1.5;
        break;
    }
    
    this.shieldRotation += 0.02;
  }
  
  getTypeAttackType(difficulty) {
    switch(this.type) {
      case 'small':
        return difficulty === 'easy' ? 'normal' : 'homing';
      case 'medium':
        return difficulty === 'easy' ? 'normal' : (difficulty === 'hard' ? 'spread' : 'homing');
      case 'heavy':
        return difficulty === 'easy' ? 'normal' : (difficulty === 'hard' ? 'laser' : 'spread');
      default:
        return 'normal';
    }
  }
  
  fireNormalBullet(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bullet = new EnemyBullet(this.x, this.y, 'normal', 6);
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      bullet.vx = (dx / distance) * bullet.speed * 0.6;
      bullet.vy = (dy / distance) * bullet.speed;
    }
    enemyBulletsRef.current.push(bullet);
  }
  
  fireHomingBullet(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bullet = new EnemyBullet(this.x, this.y, 'homing', 7);
    bullet.isHoming = true;
    bullet.homingStrength = 0.02;
    bullet.homingTimer = 120;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      bullet.vx = (dx / distance) * bullet.speed * 0.4;
      bullet.vy = (dy / distance) * bullet.speed;
    }
    enemyBulletsRef.current.push(bullet);
  }
  
  fireSpreadBullet(player, difficulty, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bulletCount = difficulty === 'hard' ? 5 : 7;
    const spreadAngle = Math.PI / 3;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);
    for (let i = 0; i < bulletCount; i++) {
      const angleOffset = (i - Math.floor(bulletCount / 2)) * (spreadAngle / bulletCount);
      const angle = baseAngle + angleOffset;
      const bullet = new EnemyBullet(this.x, this.y, 'spread', 5);
      bullet.vx = Math.cos(angle) * bullet.speed;
      bullet.vy = Math.sin(angle) * bullet.speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  fireLaserBullet(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bullet = new EnemyBullet(this.x, this.y, 'laser', 6);
    bullet.isLaser = true;
    bullet.length = 40;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      bullet.vx = (dx / distance) * bullet.speed * 0.4;
      bullet.vy = (dy / distance) * bullet.speed;
    }
    enemyBulletsRef.current.push(bullet);
  }
  
  fireScatterBullet(enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const directions = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
    directions.forEach(dir => {
      const bullet = new EnemyBullet(this.x, this.y, 'scatter', 4);
      bullet.vx = Math.cos(dir) * bullet.speed;
      bullet.vy = Math.sin(dir) * bullet.speed;
      enemyBulletsRef.current.push(bullet);
    });
  }
  
  attack(player, difficulty, enemyBulletsRef) {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    this.lastAttackTime = now;
    const attackType = this.getTypeAttackType(difficulty);
    switch(attackType) {
      case 'normal':
        this.fireNormalBullet(player, enemyBulletsRef);
        break;
      case 'homing':
        this.fireHomingBullet(player, enemyBulletsRef);
        break;
      case 'spread':
        this.fireSpreadBullet(player, difficulty, enemyBulletsRef);
        break;
      case 'laser':
        this.fireLaserBullet(player, enemyBulletsRef);
        break;
    }
    if (this.type === 'medium') {
      this.fireScatterBullet(enemyBulletsRef);
    }
  }
  
  update(player, canvasWidth, canvasHeight, difficulty, enemyBulletsRef) {
    this.updateHitState();
    this.updateState(player);
    this.pulse = Math.sin(Date.now() * 0.01 + this.x * 0.01) * 0.2 + 0.8;
    this.rotation += this.rotationSpeed;
    this.corePulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
    this.hoverOffset = Math.sin(Date.now() * this.hoverSpeed) * 5;
    switch(this.type) {
      case 'small':
        this.updateSmallBehavior(player, canvasWidth, canvasHeight);
        break;
      case 'medium':
        this.updateMediumBehavior(player, canvasWidth, canvasHeight);
        break;
      case 'heavy':
        this.updateHeavyBehavior(player, canvasWidth, canvasHeight);
        break;
      default:
        this.y += this.speed;
    }
    if (this.state === EnemyState.ATTACKING) {
      this.attack(player, difficulty, enemyBulletsRef);
    }
    if (this.state === EnemyState.PATROLLING || this.state === EnemyState.CHASING || this.state === EnemyState.ATTACKING) {
      const edgeMargin = this.size * 2;
      this.x = Math.max(edgeMargin, Math.min(canvasWidth - edgeMargin, this.x));
      this.y = Math.max(edgeMargin, Math.min(canvasHeight - edgeMargin, this.y));
    }
    // 撤退状态的敌人不受边界限制，允许飞出屏幕
    // 这样小型敌人在到达底部后会继续飞出屏幕
  }
  
  draw(ctx) {
    ctx.save();
    
    // 绘制预渲染的发光效果
    const glowAsset = assetManager.getAsset(`enemy${this.type}Glow`);
    if (glowAsset) {
      const glowSize = this.size * 3;
      ctx.drawImage(glowAsset, this.x - glowSize / 2, this.y - glowSize / 2 + this.hoverOffset, glowSize, glowSize);
    }
    
    if (this.isHit) {
      ctx.globalAlpha = 0.4 + Math.random() * 0.3;
    }
    
    ctx.translate(this.x, this.y + this.hoverOffset);
    ctx.rotate(this.rotation);
    switch(this.type) {
      case 'small':
        this.drawSmallEnemy(ctx);
        break;
      case 'medium':
        this.drawMediumEnemy(ctx);
        break;
      case 'heavy':
        this.drawHeavyEnemy(ctx);
        break;
      default:
        this.drawDefaultEnemy(ctx);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawHealthBar(ctx);
    ctx.restore();
  }
  
  drawSmallEnemy(ctx) {
    ctx.save();
    ctx.scale(1 / this.stretchFactor, this.stretchFactor);
    
    ctx.fillStyle = '#aa1100';
    ctx.strokeStyle = '#ff4400';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.3 * this.pulse);
    ctx.lineTo(-this.size, this.size * 0.6);
    ctx.lineTo(-this.size * 0.3, this.size * 0.4);
    ctx.lineTo(this.size * 0.3, this.size * 0.4);
    ctx.lineTo(this.size, this.size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.moveTo(0, -this.size * 1.0 * this.pulse);
    ctx.lineTo(-this.size * 0.5, this.size * 0.3);
    ctx.lineTo(this.size * 0.5, this.size * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#880000';
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.1, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = `rgba(255, ${100 + this.corePulse * 100}, 0, 0.9)`;
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.1, this.size * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -this.size * 0.1, this.size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255, 50, 0, 0.4)';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Date.now() * 0.003;
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * this.size * 0.6,
        Math.sin(angle) * this.size * 0.6,
        this.size * 0.12,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  drawMediumEnemy(ctx) {
    ctx.fillStyle = '#886600';
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = i % 2 === 0 ? this.size : this.size * 0.75;
      ctx.lineTo(
        Math.cos(angle) * radius * this.pulse,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#aa8800';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = this.size * 0.55;
      ctx.lineTo(
        Math.cos(angle) * radius * this.pulse,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffdd00';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#ffcc00';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + this.turretAngle;
      const turretDist = this.size * 0.9;
      const tx = Math.cos(angle) * turretDist;
      const ty = Math.sin(angle) * turretDist;
      
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(this.turretAngle);
      
      ctx.fillStyle = '#cc6600';
      ctx.fillRect(-this.size * 0.2, -this.size * 0.2, this.size * 0.4, this.size * 0.4);
      ctx.strokeStyle = '#ffaa00';
      ctx.strokeRect(-this.size * 0.2, -this.size * 0.2, this.size * 0.4, this.size * 0.4);
      
      ctx.fillStyle = '#ff4400';
      ctx.beginPath();
      ctx.arc(0, -this.size * 0.15, this.size * 0.1, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.fillStyle = '#ff4400';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.25 * this.corePulse, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 1.1, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  drawHeavyEnemy(ctx) {
    ctx.fillStyle = '#004400';
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = this.size * this.pulse;
      ctx.lineTo(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#006600';
    ctx.strokeStyle = '#00cc00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = this.size * 0.7;
      ctx.lineTo(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#008800';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const radius = this.size * 0.4;
      ctx.lineTo(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#00ff00';
    ctx.stroke();
    
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + this.shieldRotation;
      ctx.fillStyle = this.currentPhase > 1 && i % 3 === 0 ? '#ff0000' : '#00ff00';
      ctx.beginPath();
      ctx.arc(
        Math.cos(angle) * this.size * 0.85,
        Math.sin(angle) * this.size * 0.85,
        this.size * 0.08,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    ctx.strokeStyle = `rgba(0, 255, 0, ${0.3 + this.chargeLevel * 0.4})`;
    ctx.lineWidth = 3;
    const healthRingSize = this.size * 1.2 + this.chargeLevel * 10;
    ctx.beginPath();
    ctx.arc(0, 0, healthRingSize, 0, Math.PI * 2 * (this.health / this.maxHealth));
    ctx.stroke();
    
    const healthPercentage = this.health / this.maxHealth;
    const coreColor = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
    const corePulse = healthPercentage > 0.5 ? this.corePulse : 1 - this.corePulse * 0.3;
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = corePulse * 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    if (this.currentPhase > 1) {
      ctx.fillStyle = `rgba(255, 0, 0, ${0.3 + Math.sin(Date.now() * 0.01) * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`PHASE ${this.currentPhase}`, 0, this.size + 25);
    }
  }
  
  drawDefaultEnemy(ctx) {
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.size * this.pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  
  drawHealthBar(ctx) {
    const healthBarWidth = this.size * 2.5;
    const healthBarHeight = 5;
    const healthBarX = this.x - healthBarWidth / 2;
    const healthBarY = this.y - this.size - 18;
    
    ctx.fillStyle = '#222222';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    const healthPercentage = this.health / this.maxHealth;
    ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
  }
  
  isOutOfBounds(canvasWidth, canvasHeight) {
    return this.x < -this.size * 2 || this.x > canvasWidth + this.size * 2 || 
           this.y < -this.size * 2 || this.y > canvasHeight + this.size * 2;
  }
}

export class Boss {
  constructor(x, y, difficulty = 'easy') {
    this.x = x;
    this.y = y;
    this.difficulty = difficulty;
    this.size = 80;
    this.baseHealth = this.getBaseHealth();
    this.health = this.baseHealth;
    this.maxHealth = this.baseHealth;
    this.speed = this.getBaseSpeed();
    this.color = '#6600cc';
    this.currentPhase = BossPhase.PHASE_1;
    this.phaseThresholds = [1, 0.7, 0.3];
    this.isActive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.lastAttackTime = 0;
    this.attackCooldown = 2000;
    this.spawnTime = Date.now();
    this.isSpawning = true;
    this.spawnDuration = 2500;
    this.isBoss = true;
    this.bossName = 'VOID OVERLORD';
    this.stage = 1;
    this.rotationAngle = 0;
    this.pulsePhase = 0;
    this.energyLevel = 0;
    this.parts = [];
    this.initParts();
    this.attackPattern = 0;
    this.attackTimer = 0;
  }
  
  getBaseHealth() {
    switch(this.difficulty) {
      case 'easy': return 200;
      case 'hard': return 350;
      case 'nightmare': return 500;
      default: return 200;
    }
  }
  
  getBaseSpeed() {
    switch(this.difficulty) {
      case 'easy': return 1.5;
      case 'hard': return 2.5;
      case 'nightmare': return 3.5;
      default: return 1.5;
    }
  }
  
  initParts() {
    for (let i = 0; i < 6; i++) {
      this.parts.push({
        angle: (i / 6) * Math.PI * 2,
        distance: this.size * 0.8,
        rotation: 0,
        size: this.size * 0.25
      });
    }
  }
  
  updatePhase() {
    const healthPercentage = this.health / this.maxHealth;
    for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
      if (healthPercentage <= this.phaseThresholds[i]) {
        this.currentPhase = i + 1;
        this.attackCooldown = Math.max(800, 2000 - i * 400);
        break;
      }
    }
  }
  
  updateInvulnerability() {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }
  
  updateSpawning() {
    if (this.isSpawning) {
      const elapsed = Date.now() - this.spawnTime;
      if (elapsed >= this.spawnDuration) {
        this.isSpawning = false;
      }
    }
  }
  
  fireSpiralBullets(enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bulletCount = 8 + this.currentPhase * 4;
    const angleStep = (Math.PI * 2) / bulletCount;
    const speed = 3 + this.currentPhase;
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep + this.rotationAngle;
      const bullet = new EnemyBullet(this.x, this.y, 'boss_spiral', speed);
      bullet.isBossBullet = true;
      bullet.vx = Math.cos(angle) * speed;
      bullet.vy = Math.sin(angle) * speed;
      bullet.isSpiral = true;
      bullet.spiralSpeed = 0.02;
      bullet.spiralTimer = 180;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  fireTargetedBurst(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const baseAngle = Math.atan2(dy, dx);
    const bulletCount = 5 + this.currentPhase * 2;
    const spreadAngle = Math.PI / 4;
    for (let i = 0; i < bulletCount; i++) {
      const angleOffset = (i - Math.floor(bulletCount / 2)) * (spreadAngle / bulletCount);
      const angle = baseAngle + angleOffset;
      const bullet = new EnemyBullet(this.x, this.y, 'boss_burst', 5);
      bullet.isBossBullet = true;
      bullet.vx = Math.cos(angle) * bullet.speed;
      bullet.vy = Math.sin(angle) * bullet.speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  fireCrossLaser(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const directions = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, 5*Math.PI/4, 3*Math.PI/2, 7*Math.PI/4];
    directions.forEach(dir => {
      const bullet = new EnemyBullet(this.x, this.y, 'boss_laser', 6);
      bullet.isBossBullet = true;
      bullet.isLaser = true;
      bullet.length = 60;
      bullet.vx = Math.cos(dir) * bullet.speed;
      bullet.vy = Math.sin(dir) * bullet.speed;
      enemyBulletsRef.current.push(bullet);
    });
  }
  
  spawnMinions(enemiesRef, config) {
    const enemyConfig = config.enemyTypes.small;
    for (let i = 0; i < 2 + this.currentPhase; i++) {
      const angle = (i / (2 + this.currentPhase)) * Math.PI * 2;
      const dist = 100;
      const x = this.x + Math.cos(angle) * dist;
      const y = this.y + Math.sin(angle) * dist;
      const newEnemy = new Enemy(x, y, 'small', null, enemyConfig);
      newEnemy.state = 'chasing';
      enemiesRef.current.push(newEnemy);
    }
  }
  
  fireLaserRain(enemyBulletsRef, canvasWidth) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bulletCount = 10 + this.currentPhase * 5;
    for (let i = 0; i < bulletCount; i++) {
      const x = Math.random() * canvasWidth;
      const bullet = new EnemyBullet(x, -30, 'boss_rain', 4 + this.currentPhase);
      bullet.isBossBullet = true;
      bullet.vx = 0;
      bullet.vy = bullet.speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  fireHomingBarrage(player, enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const bulletCount = 3 + this.currentPhase * 2;
    for (let i = 0; i < bulletCount; i++) {
      setTimeout(() => {
        const bullet = new EnemyBullet(this.x, this.y, 'boss_homing', 7);
        bullet.isBossBullet = true;
        bullet.isHoming = true;
        bullet.homingStrength = 0.03;
        bullet.homingTimer = 200;
        const angle = Math.random() * Math.PI * 2;
        bullet.vx = Math.cos(angle) * bullet.speed;
        bullet.vy = Math.sin(angle) * bullet.speed;
        enemyBulletsRef.current.push(bullet);
      }, i * 100);
    }
  }
  
  fireRingPulse(enemyBulletsRef) {
    if (!enemyBulletsRef || !enemyBulletsRef.current) return;
    const ringCount = 3;
    for (let r = 0; r < ringCount; r++) {
      setTimeout(() => {
        const bulletCount = 16;
        const angleStep = (Math.PI * 2) / bulletCount;
        const speed = 3 + r;
        for (let i = 0; i < bulletCount; i++) {
          const angle = i * angleStep;
          const bullet = new EnemyBullet(this.x, this.y, 'boss_pulse', speed);
          bullet.isBossBullet = true;
          bullet.isPulse = true;
          bullet.ringDelay = r * 20;
          bullet.vx = Math.cos(angle) * bullet.speed;
          bullet.vy = Math.sin(angle) * bullet.speed;
          enemyBulletsRef.current.push(bullet);
        }
      }, r * 200);
    }
  }
  
  attack(player, enemyBulletsRef, enemiesRef, config, canvasWidth) {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    this.lastAttackTime = now;
    this.attackPattern = (this.attackPattern + 1) % 4;
    switch(this.currentPhase) {
      case BossPhase.PHASE_1:
        if (this.attackPattern === 0) {
          this.fireSpiralBullets(enemyBulletsRef);
        } else {
          this.fireTargetedBurst(player, enemyBulletsRef);
        }
        break;
      case BossPhase.PHASE_2:
        if (this.attackPattern === 0) {
          this.fireCrossLaser(player, enemyBulletsRef);
        } else if (this.attackPattern === 1) {
          this.spawnMinions(enemiesRef, config);
        } else {
          this.fireTargetedBurst(player, enemyBulletsRef);
        }
        break;
      case BossPhase.PHASE_3:
        if (this.attackPattern === 0) {
          this.fireHomingBarrage(player, enemyBulletsRef);
        } else if (this.attackPattern === 1) {
          this.fireRingPulse(enemyBulletsRef);
        } else if (this.attackPattern === 2) {
          this.fireLaserRain(enemyBulletsRef, canvasWidth);
        } else {
          this.spawnMinions(enemiesRef, config);
          this.fireCrossLaser(player, enemyBulletsRef);
        }
        break;
    }
  }
  
  update(player, canvasWidth, canvasHeight, enemyBulletsRef, enemiesRef, config) {
    this.updatePhase();
    this.updateInvulnerability();
    this.updateSpawning();
    this.rotationAngle += 0.01;
    this.pulsePhase += 0.05;
    this.energyLevel = Math.min(1, this.energyLevel + 0.005);
    
    if (this.isSpawning) {
      this.y += this.speed * 0.4;
      return;
    }
    
    const wobble = Math.sin(Date.now() * 0.001) * 50;
    switch(this.currentPhase) {
      case BossPhase.PHASE_1:
        this.x += Math.sin(Date.now() * 0.001) * this.speed;
        break;
      case BossPhase.PHASE_2:
        this.x += Math.sin(Date.now() * 0.0015) * this.speed * 1.2 + wobble * 0.01;
        break;
      case BossPhase.PHASE_3:
        this.x += Math.sin(Date.now() * 0.002) * this.speed * 1.5;
        this.y += Math.cos(Date.now() * 0.001) * this.speed * 0.5;
        break;
    }
    
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    this.x += wobble * 0.01;
    
    this.parts.forEach((part, i) => {
      part.angle = (i / 6) * Math.PI * 2 + this.rotationAngle;
      part.rotation += 0.02;
    });
    
    this.attack(player, enemyBulletsRef, enemiesRef, config, canvasWidth);
    
    if (this.health <= 0) {
      this.isActive = false;
    }
  }
  
  takeDamage(damage) {
    if (this.isInvulnerable || this.isSpawning) {
      return false;
    }
    this.health -= damage;
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 20;
    this.energyLevel = Math.max(0, this.energyLevel - 0.1);
    return true;
  }
  
  draw(ctx, canvasWidth) {
    ctx.save();
    
    const spawnAlpha = this.isSpawning ? Math.min(1, (Date.now() - this.spawnTime) / this.spawnDuration) : 1;
    ctx.globalAlpha = spawnAlpha;
    
    if (this.isInvulnerable) {
      ctx.globalAlpha = ctx.globalAlpha * 0.6;
    }
    
    // 绘制预渲染的Boss发光效果
    const glowAsset = assetManager.getAsset('bossGlow');
    if (glowAsset) {
      const glowSize = this.size * 3;
      ctx.drawImage(glowAsset, this.x - glowSize / 2, this.y - glowSize / 2, glowSize, glowSize);
    }
    
    this.drawCore(ctx);
    this.drawParts(ctx);
    this.drawEnergyField(ctx);
    
    ctx.restore();
  }
  
  drawCore(ctx) {
    const pulse = Math.sin(this.pulsePhase) * 0.15 + 0.85;
    const coreColor = this.currentPhase === 3 ? 
      `hsl(${280 + this.energyLevel * 40}, 100%, ${50 + this.energyLevel * 30}%)` : 
      `hsl(${260 + this.currentPhase * 20}, 100%, 50%)`;
    
    ctx.fillStyle = '#220033';
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.rotationAngle * 0.5;
      const radius = this.size * pulse * (i % 2 === 0 ? 1 : 0.8);
      ctx.lineTo(
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#440055';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - this.rotationAngle * 0.3;
      const radius = this.size * 0.6 * pulse;
      ctx.lineTo(
        this.x + Math.cos(angle) * radius,
        this.y + Math.sin(angle) * radius
      );
    }
    ctx.closePath();
    ctx.fill();
    
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.size * 0.4
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, coreColor);
    gradient.addColorStop(1, 'rgba(100, 0, 150, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = coreColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`PHASE ${this.currentPhase}`, this.x, this.y + this.size + 30);
  }
  
  drawParts(ctx) {
    this.parts.forEach((part, i) => {
      const px = this.x + Math.cos(part.angle) * part.distance;
      const py = this.y + Math.sin(part.angle) * part.distance;
      
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(part.rotation);
      
      const partColor = this.currentPhase === 3 ? '#ff00aa' : this.currentPhase === 2 ? '#aa00ff' : '#6600cc';
      
      ctx.fillStyle = '#330044';
      ctx.strokeStyle = partColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        ctx.lineTo(
          Math.cos(angle) * part.size,
          Math.sin(angle) * part.size
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = partColor;
      ctx.beginPath();
      ctx.arc(0, 0, part.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, part.size * 0.15, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }
  
  drawEnergyField(ctx) {
    const energyAlpha = 0.1 + this.energyLevel * 0.15;
    ctx.strokeStyle = `rgba(150, 50, 255, ${energyAlpha})`;
    ctx.lineWidth = 2;
    
    for (let ring = 1; ring <= 3; ring++) {
      const ringRadius = this.size * (1 + ring * 0.3) + Math.sin(this.pulsePhase + ring) * 5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.fillStyle = `rgba(150, 50, 255, ${energyAlpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawHealthBar(ctx, canvasWidth) {
    const healthBarWidth = canvasWidth * 0.7;
    const healthBarHeight = 20;
    const healthBarX = (canvasWidth - healthBarWidth) / 2;
    const healthBarY = 25;
    
    // 绘制血条背景
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 绘制血条边框
    ctx.strokeStyle = '#6600cc';
    ctx.lineWidth = 3;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 绘制分段式血条
    const healthPercentage = this.health / this.maxHealth;
    const healthColor = this.currentPhase === 3 ? 
      `hsl(${280 + this.energyLevel * 40}, 100%, 50%)` : 
      healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
    
    // 分段式血条
    const segmentCount = 10;
    const segmentWidth = healthBarWidth / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const segmentHealth = Math.min(1, Math.max(0, (healthPercentage * segmentCount) - i));
      if (segmentHealth > 0) {
        ctx.fillStyle = healthColor;
        ctx.fillRect(
          healthBarX + i * segmentWidth,
          healthBarY,
          segmentWidth * segmentHealth,
          healthBarHeight
        );
      }
    }
    
    // 绘制Boss名称
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.bossName, canvasWidth / 2, healthBarY - 10);
    
    // 绘制生命值
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${Math.ceil(this.health)} / ${this.maxHealth}`, canvasWidth / 2, healthBarY + 15);
  }
}
