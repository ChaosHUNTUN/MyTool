import { EnemyState, BossPhase } from './constants';
import { EnemyBullet } from './bullet';
import Particle from './particle';

// 敌方单位类
export class Enemy {
  constructor(x, y, type, trajectory, enemyConfig) {
    this.x = x;
    this.y = y;
    this.type = type;
    // 使用传入的敌人配置，不再依赖全局config
    this.health = enemyConfig.health;
    this.maxHealth = enemyConfig.health;
    this.size = enemyConfig.size;
    this.color = enemyConfig.color;
    this.speed = enemyConfig.speed;
    this.score = enemyConfig.score;
    // 新增轨迹属性
    this.trajectory = trajectory || { 
      type: 'straight', // straight, curve, diagonal
      direction: { x: 0, y: 1 }, // 默认为向下
      curveFactor: 0, // 曲线因子
      startTime: Date.now()
    };
    // 动画属性
    this.pulse = 0;
    this.rotation = 0;
    this.shadowBlur = 10;
    this.shadowColor = this.color;
    
    // 状态机属性
    this.state = EnemyState.PATROLLING;
    this.spawnTime = Date.now();
    
    // 环境感知属性
    this.detectionRadius = this.getTypeDetectionRadius();
    this.isInCombat = false;
    
    // 行为属性
    this.targetPos = null;
    this.patrolPath = null;
    this.currentWaypoint = 0;
    this.lastAttackTime = 0;
    this.attackCooldown = this.getTypeAttackCooldown();
    
    // 受击状态
    this.isHit = false;
    this.hitTimer = 0;
    this.hitInvulnerable = 0;
    
    // 阶段属性（Heavy敌人）
    this.currentPhase = 1;
    this.phaseThresholds = [1, 0.7, 0.3]; // 血量百分比
  }
  
  // 获取不同类型敌人的感知半径
  getTypeDetectionRadius() {
    switch(this.type) {
      case 'small': return 150;
      case 'medium': return 200;
      case 'heavy': return 250;
      default: return 150;
    }
  }
  
  // 获取不同类型敌人的攻击冷却时间
  getTypeAttackCooldown() {
    switch(this.type) {
      case 'small': return 1500;
      case 'medium': return 2000;
      case 'heavy': return 3000;
      default: return 1500;
    }
  }
  
  // 更新受击状态
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
  
  // 计算与玩家的距离
  getDistanceToPlayer(player) {
    const dx = this.x - player.x;
    const dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  // 检测玩家是否在感知范围内
  detectPlayer(player) {
    const distance = this.getDistanceToPlayer(player);
    return distance <= this.detectionRadius;
  }
  
  // 状态转换逻辑
  updateState(player) {
    // 根据血量判断是否撤退
    const healthPercentage = this.health / this.maxHealth;
    
    // 更新阶段（仅Heavy）
    if (this.type === 'heavy') {
      for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
        if (healthPercentage <= this.phaseThresholds[i]) {
          this.currentPhase = i + 1;
          break;
        }
      }
    }
    
    // 检测玩家
    const isPlayerDetected = this.detectPlayer(player);
    
    // 状态转换
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
          // 距离玩家足够近时开始攻击
          const distance = this.getDistanceToPlayer(player);
          if (distance < 100) {
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
          // 距离玩家太远时继续追击
          const distance = this.getDistanceToPlayer(player);
          if (distance > 150) {
            this.state = EnemyState.CHASING;
          }
        }
        break;
        
      case EnemyState.RETREATING:
        // 撤退到一定距离后恢复巡逻
        const distance = this.getDistanceToPlayer(player);
        if (distance > this.detectionRadius * 1.5) {
          this.state = EnemyState.PATROLLING;
          this.isInCombat = false;
        }
        break;
    }
  }
  
  // Small敌人行为
  updateSmallBehavior(player, canvasWidth, canvasHeight) {
    switch(this.state) {
      case EnemyState.PATROLLING:
        // 简单的上下移动巡逻
        this.y += this.speed;
        break;
        
      case EnemyState.CHASING:
        // 向玩家方向移动
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
        break;
        
      case EnemyState.ATTACKING:
        // 攻击状态：暂时停止移动
        break;
        
      case EnemyState.RETREATING:
        // 小敌人不撤退，继续攻击
        break;
    }
  }
  
  // Medium敌人行为
  updateMediumBehavior(player, canvasWidth, canvasHeight) {
    switch(this.state) {
      case EnemyState.PATROLLING:
        // 左右巡逻
        if (!this.patrolPath) {
          // 初始化巡逻路径
          this.patrolPath = [
            { x: this.x - 100, y: this.y },
            { x: this.x + 100, y: this.y }
          ];
        }
        
        // 移动到当前路径点
        const currentWaypoint = this.patrolPath[this.currentWaypoint];
        const dx = currentWaypoint.x - this.x;
        const dy = currentWaypoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) {
          // 到达路径点，切换到下一个
          this.currentWaypoint = (this.currentWaypoint + 1) % this.patrolPath.length;
        } else {
          // 向路径点移动
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
        break;
        
      case EnemyState.CHASING:
        // 向玩家方向移动
        const chaseDx = player.x - this.x;
        const chaseDy = player.y - this.y;
        const chaseDistance = Math.sqrt(chaseDx * chaseDx + chaseDy * chaseDy);
        
        if (chaseDistance > 0) {
          this.x += (chaseDx / chaseDistance) * this.speed;
          this.y += (chaseDy / chaseDistance) * this.speed;
        }
        break;
        
      case EnemyState.ATTACKING:
        // 攻击状态：暂时停止移动
        break;
        
      case EnemyState.RETREATING:
        // 向屏幕边缘撤退
        if (this.x < canvasWidth / 2) {
          this.x -= this.speed;
        } else {
          this.x += this.speed;
        }
        this.y += this.speed;
        break;
    }
  }
  
  // Heavy敌人行为
  updateHeavyBehavior(player, canvasWidth, canvasHeight) {
    switch(this.state) {
      case EnemyState.PATROLLING:
        // 贝塞尔曲线移动
        const elapsed = Date.now() - this.trajectory.startTime;
        const curveOffset = Math.sin(elapsed * 0.001) * this.trajectory.curveFactor;
        this.x += this.trajectory.direction.x * this.speed + curveOffset;
        this.y += this.trajectory.direction.y * this.speed;
        break;
        
      case EnemyState.CHASING:
        // 向玩家方向移动，带有预判
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
        break;
        
      case EnemyState.ATTACKING:
        // 根据阶段执行不同攻击行为
        switch(this.currentPhase) {
          case 1:
            // 慢速移动 + 准备攻击
            this.y += this.speed * 0.5;
            break;
          case 2:
            // 加速 + 准备召唤
            this.y += this.speed * 1.5;
            break;
          case 3:
            // 快速移动 + 准备强力攻击
            this.y += this.speed * 2;
            break;
        }
        break;
        
      case EnemyState.RETREATING:
        // 向屏幕上方撤退
        this.y -= this.speed;
        break;
    }
  }
  
  // 获取攻击类型
  getTypeAttackType(difficulty) {
    // 根据难度和敌人类型选择攻击类型
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
  
  // 发射普通子弹
  fireNormalBullet(enemyBulletsRef) {
    const bullet = new EnemyBullet(this.x, this.y, 'normal', 5);
    enemyBulletsRef.current.push(bullet);
  }
  
  // 发射追踪子弹
  fireHomingBullet(player, enemyBulletsRef) {
    const bullet = new EnemyBullet(this.x, this.y, 'homing', 6);
    // 计算追踪方向
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      bullet.vx = (dx / distance) * bullet.speed * 0.3;
      bullet.vy = (dy / distance) * bullet.speed;
    }
    
    enemyBulletsRef.current.push(bullet);
  }
  
  // 发射散射子弹
  fireSpreadBullet(difficulty, enemyBulletsRef) {
    // 发射3-5发子弹，呈扇形分布
    const bulletCount = difficulty === 'hard' ? 3 : 5;
    const angleStep = Math.PI / (bulletCount - 1);
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      const bullet = new EnemyBullet(this.x, this.y, 'spread', 5);
      
      bullet.vx = Math.cos(angle) * bullet.speed * 0.5;
      bullet.vy = Math.sin(angle) * bullet.speed;
      
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  // 发射激光子弹
  fireLaserBullet(enemyBulletsRef) {
    const bullet = new EnemyBullet(this.x, this.y, 'laser', 4);
    bullet.vx = 0;
    bullet.vy = bullet.speed;
    enemyBulletsRef.current.push(bullet);
  }
  
  // 攻击方法
  attack(player, difficulty, enemyBulletsRef) {
    const now = Date.now();
    
    // 检查攻击冷却
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    this.lastAttackTime = now;
    
    // 根据敌人类型和难度选择攻击模式
    const attackType = this.getTypeAttackType(difficulty);
    
    switch(attackType) {
      case 'normal':
        // 普通攻击：单发子弹
        this.fireNormalBullet(enemyBulletsRef);
        break;
        
      case 'homing':
        // 追踪攻击：发射追踪子弹
        this.fireHomingBullet(player, enemyBulletsRef);
        break;
        
      case 'spread':
        // 散射攻击：发射多方向子弹
        this.fireSpreadBullet(difficulty, enemyBulletsRef);
        break;
        
      case 'laser':
        // 激光攻击：发射激光束
        this.fireLaserBullet(enemyBulletsRef);
        break;
    }
  }
  
  update(player, canvasWidth, canvasHeight, difficulty, enemyBulletsRef) {
    // 更新受击状态
    this.updateHitState();
    
    // 更新状态
    this.updateState(player);
    
    // 根据敌人类型执行不同行为
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
        // 默认向下移动
        this.y += this.speed;
    }
    
    // 在攻击状态下尝试攻击
    if (this.state === EnemyState.ATTACKING) {
      this.attack(player, difficulty, enemyBulletsRef);
    }
    
    // 更新动画效果
    this.pulse = Math.sin(Date.now() * 0.01 + this.x * 0.01) * 0.2 + 0.8;
    this.rotation += 0.02;
    this.shadowBlur = Math.sin(Date.now() * 0.02) * 5 + 10;
    
    // 根据状态改变外发光颜色
    if (this.state === EnemyState.CHASING || this.state === EnemyState.ATTACKING) {
      this.shadowColor = '#ff0000';
    } else if (this.state === EnemyState.RETREATING) {
      this.shadowColor = '#888888';
    } else {
      this.shadowColor = this.color;
    }
  }
  
  draw(ctx) {
    ctx.save();
    
    // 外发光效果，根据状态改变颜色
    ctx.shadowColor = this.shadowColor || this.color;
    ctx.shadowBlur = this.shadowBlur;
    
    // 受击效果：闪烁
    if (this.isHit) {
      ctx.globalAlpha = 0.5;
    }
    
    // 绘制敌方单位
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    // 旋转和缩放效果
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    
    // 根据敌人类型绘制不同形状
    switch(this.type) {
      case 'small':
        // 小敌人：三角形
        ctx.beginPath();
        ctx.moveTo(0, -this.size * this.pulse);
        ctx.lineTo(-this.size, this.size);
        ctx.lineTo(this.size, this.size);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'medium':
        // 中敌人：六边形
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          ctx.lineTo(
            Math.cos(angle) * this.size * this.pulse,
            Math.sin(angle) * this.size
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'heavy':
        // 重敌人：八边形
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          ctx.lineTo(
            Math.cos(angle) * this.size * this.pulse,
            Math.sin(angle) * this.size
          );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // 重型敌人额外装饰
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          ctx.lineTo(
            Math.cos(angle) * this.size * 0.5,
            Math.sin(angle) * this.size * 0.5
          );
        }
        ctx.closePath();
        ctx.fill();
        
        // 绘制当前阶段指示
        if (this.currentPhase > 1) {
          ctx.fillStyle = '#ff0000';
          ctx.font = '10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`Phase ${this.currentPhase}`, 0, this.size + 15);
        }
        break;
        
      default:
        // 默认圆形
        ctx.beginPath();
        ctx.arc(0, 0, this.size * this.pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
    
    // 恢复坐标系
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // 绘制生命值条
    const healthBarWidth = this.size * 2;
    const healthBarHeight = 4;
    const healthBarX = this.x - healthBarWidth / 2;
    const healthBarY = this.y - this.size - 10;
    
    // 背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 生命值
    const healthPercentage = this.health / this.maxHealth;
    ctx.fillStyle = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    
    ctx.restore();
  }
  
  isOutOfBounds(canvasWidth, canvasHeight) {
    return this.x < -this.size || this.x > canvasWidth + this.size || 
           this.y < -this.size || this.y > canvasHeight + this.size;
  }
}

// Boss类
export class Boss {
  constructor(x, y, difficulty = 'easy') {
    this.x = x;
    this.y = y;
    this.difficulty = difficulty;
    this.size = 60;
    this.baseHealth = this.getBaseHealth();
    this.health = this.baseHealth;
    this.maxHealth = this.baseHealth;
    this.speed = this.getBaseSpeed();
    this.color = '#8a2be2';
    this.currentPhase = BossPhase.PHASE_1;
    this.phaseThresholds = [1, 0.7, 0.3];
    this.isActive = true;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.lastAttackTime = 0;
    this.attackCooldown = 2000;
    this.spawnTime = Date.now();
    this.isSpawning = true;
    this.spawnDuration = 2000;
    
    // Boss专属属性
    this.isBoss = true;
    this.bossName = 'Void Commander';
    this.stage = 1;
  }
  
  // 获取基础生命值
  getBaseHealth() {
    switch(this.difficulty) {
      case 'easy': return 100;
      case 'hard': return 150;
      case 'nightmare': return 200;
      default: return 100;
    }
  }
  
  // 获取基础速度
  getBaseSpeed() {
    switch(this.difficulty) {
      case 'easy': return 2;
      case 'hard': return 3;
      case 'nightmare': return 4;
      default: return 2;
    }
  }
  
  // 更新相位
  updatePhase() {
    const healthPercentage = this.health / this.maxHealth;
    
    for (let i = this.phaseThresholds.length - 1; i >= 0; i--) {
      if (healthPercentage <= this.phaseThresholds[i]) {
        this.currentPhase = i + 1;
        break;
      }
    }
  }
  
  // 发射螺旋弹幕
  fireSpiralBullets(enemyBulletsRef) {
    const bulletCount = 8;
    const angleStep = (Math.PI * 2) / bulletCount;
    const speed = 4;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = i * angleStep;
      const bullet = new EnemyBullet(this.x, this.y, 'normal', speed);
      bullet.isBossBullet = true;
      bullet.vx = Math.cos(angle) * speed;
      bullet.vy = Math.sin(angle) * speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  // 召唤小怪
  spawnMinions(enemiesRef, config) {
    // 召唤2个小型敌人
    const enemyConfig = config.enemyTypes.small;
    
    for (let i = 0; i < 2; i++) {
      const x = this.x + (i === 0 ? -100 : 100);
      const y = this.y + 50;
      const newEnemy = new Enemy(x, y, 'small', null, enemyConfig);
      enemiesRef.current.push(newEnemy);
    }
  }
  
  // 发射交叉激光
  fireCrossLaser(enemyBulletsRef) {
    const bulletCount = 4;
    const angles = [0, Math.PI/2, Math.PI, 3*Math.PI/2];
    const speed = 5;
    
    for (let i = 0; i < bulletCount; i++) {
      const angle = angles[i];
      const bullet = new EnemyBullet(this.x, this.y, 'laser', speed);
      bullet.isBossBullet = true;
      bullet.vx = Math.cos(angle) * speed;
      bullet.vy = Math.sin(angle) * speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  // 发射激光雨
  fireLaserRain(enemyBulletsRef, canvasWidth) {
    const bulletCount = 15;
    const speed = 6;
    
    for (let i = 0; i < bulletCount; i++) {
      const x = Math.random() * canvasWidth;
      const y = -50;
      const bullet = new EnemyBullet(x, y, 'laser', speed);
      bullet.isBossBullet = true;
      bullet.vx = 0;
      bullet.vy = speed;
      enemyBulletsRef.current.push(bullet);
    }
  }
  
  // 攻击方法
  attack(player, enemyBulletsRef, enemiesRef, config, canvasWidth) {
    const now = Date.now();
    
    if (now - this.lastAttackTime < this.attackCooldown) {
      return;
    }
    
    this.lastAttackTime = now;
    
    // 根据相位选择攻击模式
    switch(this.currentPhase) {
      case BossPhase.PHASE_1:
        this.fireSpiralBullets(enemyBulletsRef);
        break;
      case BossPhase.PHASE_2:
        this.spawnMinions(enemiesRef, config);
        this.fireCrossLaser(enemyBulletsRef);
        break;
      case BossPhase.PHASE_3:
        this.fireLaserRain(enemyBulletsRef, canvasWidth);
        break;
    }
  }
  
  // 更新无敌状态
  updateInvulnerability() {
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
      }
    }
  }
  
  // 更新生成状态
  updateSpawning() {
    if (this.isSpawning) {
      const elapsed = Date.now() - this.spawnTime;
      if (elapsed >= this.spawnDuration) {
        this.isSpawning = false;
      }
    }
  }
  
  // 更新位置和行为
  update(player, canvasWidth, canvasHeight, enemyBulletsRef, enemiesRef, config) {
    this.updatePhase();
    this.updateInvulnerability();
    this.updateSpawning();
    
    if (this.isSpawning) {
      // 生成动画：缓慢下降
      this.y += this.speed * 0.5;
      return;
    }
    
    // 移动行为
    switch(this.currentPhase) {
      case BossPhase.PHASE_1:
        // 横向巡逻
        this.x += Math.sin(Date.now() * 0.001) * this.speed;
        break;
      case BossPhase.PHASE_2:
        // 加速移动
        const dx = player.x - this.x;
        this.x += Math.sign(dx) * this.speed * 1.5;
        break;
      case BossPhase.PHASE_3:
        // 快速移动
        this.x += Math.sin(Date.now() * 0.002) * this.speed * 2;
        break;
    }
    
    // 边界限制
    this.x = Math.max(this.size, Math.min(canvasWidth - this.size, this.x));
    
    // 攻击
    this.attack(player, enemyBulletsRef, enemiesRef, config, canvasWidth);
    
    // 检查是否死亡
    if (this.health <= 0) {
      this.isActive = false;
    }
  }
  
  // 受到伤害
  takeDamage(damage) {
    if (this.isInvulnerable || this.isSpawning) {
      return false;
    }
    
    this.health -= damage;
    
    // 设置无敌帧
    this.isInvulnerable = true;
    this.invulnerabilityTimer = 15; // 约0.3秒
    
    return true;
  }
  
  // 绘制Boss
  draw(ctx, canvasWidth) {
    ctx.save();
    
    // 生成动画效果
    if (this.isSpawning) {
      const elapsed = Date.now() - this.spawnTime;
      const alpha = elapsed / this.spawnDuration;
      ctx.globalAlpha = alpha;
    }
    
    // 无敌闪烁效果
    if (this.isInvulnerable) {
      ctx.globalAlpha = Math.sin(Date.now() * 0.1) > 0 ? 0.5 : 1;
    }
    
    // 外发光效果
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 30;
    
    // 绘制Boss主体
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    
    // 绘制Boss形状：八边形
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.lineTo(
        this.x + Math.cos(angle) * this.size,
        this.y + Math.sin(angle) * this.size
      );
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制Boss核心
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制Boss细节
    ctx.fillStyle = '#ff00ff';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.arc(
        this.x + Math.cos(angle) * this.size * 0.7,
        this.y + Math.sin(angle) * this.size * 0.7,
        this.size * 0.1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    
    // 绘制当前阶段
    ctx.fillStyle = '#ff0000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Phase ${this.currentPhase}`, this.x, this.y + this.size + 25);
    
    ctx.restore();
  }
  
  // 绘制Boss血条
  drawHealthBar(ctx, canvasWidth) {
    const healthBarWidth = canvasWidth * 0.6;
    const healthBarHeight = 15;
    const healthBarX = (canvasWidth - healthBarWidth) / 2;
    const healthBarY = 30;
    
    // 背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // 生命值
    const healthPercentage = this.health / this.maxHealth;
    const healthColor = healthPercentage > 0.5 ? '#00ff00' : healthPercentage > 0.25 ? '#ffff00' : '#ff0000';
    
    ctx.fillStyle = healthColor;
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    
    // Boss名称
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.bossName, canvasWidth / 2, healthBarY - 10);
    
    // 生命值文本
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.health}/${this.maxHealth}`, canvasWidth / 2, healthBarY + 11);
  }
}
