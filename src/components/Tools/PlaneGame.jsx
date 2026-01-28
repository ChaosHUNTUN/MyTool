import React, { useRef, useEffect, useState } from 'react';
import { Card, Typography, Button, Space } from 'antd';

// 导入游戏相关模块
import Star from './PlaneGame/star';
import Particle from './PlaneGame/particle';
import PowerUp from './PlaneGame/powerUp';
import { Bullet, EnemyBullet } from './PlaneGame/bullet';
import Player from './PlaneGame/player';
import { Enemy, Boss } from './PlaneGame/enemy';
import { GAME_CONFIG } from './PlaneGame/constants';

const { Title, Text } = Typography;

const PlaneGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastBulletTimeRef = useRef(0);
  const lastEnemySpawnTimeRef = useRef(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  
  // 使用ref保存最新的状态，确保游戏循环中能获取到最新值
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const isLaserActiveRef = useRef(false);
  const laserEndTimeRef = useRef(0);
  const bonusEffectsRef = useRef({
    rapidFire: false,
    invulnerable: false,
    rapidFireEndTime: 0,
    invulnerableEndTime: 0
  });
  
  // 星空背景相关
  const starsRef = useRef([]);
  const particlesRef = useRef([]);
  
  // 游戏状态
  const [gameState, setGameState] = useState('start'); // start, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [difficulty, setDifficulty] = useState('easy'); // easy, hard, nightmare
  const [level, setLevel] = useState(1); // 升级等级：1-4
  const [isLaserActive, setIsLaserActive] = useState(false); // 激光是否激活
  const [laserEndTime, setLaserEndTime] = useState(0); // 激光结束时间
  
  // 加成效果状态
  const [powerUps, setPowerUps] = useState([]);
  const [bonusEffects, setBonusEffects] = useState({
    rapidFire: false,
    invulnerable: false,
    rapidFireEndTime: 0,
    invulnerableEndTime: 0
  });
  
  // 当状态更新时，同步到ref
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  useEffect(() => {
    livesRef.current = lives;
  }, [lives]);
  
  useEffect(() => {
    levelRef.current = level;
  }, [level]);
  
  useEffect(() => {
    isLaserActiveRef.current = isLaserActive;
  }, [isLaserActive]);
  
  useEffect(() => {
    laserEndTimeRef.current = laserEndTime;
  }, [laserEndTime]);
  
  useEffect(() => {
    bonusEffectsRef.current = bonusEffects;
  }, [bonusEffects]);
  
  // 游戏对象数组
  const playerRef = useRef(null);
  const bulletsRef = useRef([]);
  const enemyBulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const powerUpsRef = useRef([]);
  const bossRef = useRef(null);
  const bossSpawnedRef = useRef(false);
  const lastBossSpawnScoreRef = useRef(0);
  const bossSpawnThreshold = GAME_CONFIG.BOSS_SPAWN_THRESHOLD;
  
  // 根据难度获取游戏配置
  const getGameConfig = () => {
    // 基础配置
    const baseConfig = {
      bulletSpeed: 8,
      bulletCooldown: 200, // ms
      playerSpeed: 5,
      safeDistance: 100, // 敌方单位与玩家的安全距离
      enemyTypes: {
        // 使用更鲜艳、对比度更高的颜色
        small: { speed: 2, health: 1, score: 1, size: 15, color: '#ff0000' }, // 红色
        medium: { speed: 1.5, health: 3, score: 5, size: 25, color: '#ffff00' }, // 黄色
        heavy: { speed: 1, health: 10, score: 20, size: 40, color: '#00ff00' } // 绿色
      }
    };
    
    // 根据难度调整配置
    switch(difficulty) {
      case 'easy':
        return {
          ...baseConfig,
          enemySpawnInterval: 3000, // ms
        };
        
      case 'hard':
        return {
          ...baseConfig,
          enemySpawnInterval: 2000, // 更快生成
          enemyTypes: {
            small: { ...baseConfig.enemyTypes.small, health: 2 }, // 血量提升
            medium: { ...baseConfig.enemyTypes.medium, health: 4 },
            heavy: { ...baseConfig.enemyTypes.heavy, health: 12 }
          }
        };
        
      case 'nightmare':
        return {
          ...baseConfig,
          enemySpawnInterval: 1000, // 更快生成
          enemyTypes: {
            small: { ...baseConfig.enemyTypes.small, health: 3, speed: 3 }, // 血量和速度提升
            medium: { ...baseConfig.enemyTypes.medium, health: 5, speed: 2.5 },
            heavy: { ...baseConfig.enemyTypes.heavy, health: 15, speed: 2 }
          }
        };
        
      default:
        return baseConfig;
    }
  };
  
  // 碰撞检测
  const checkCollision = (obj1, obj2) => {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.size + obj2.size);
  };
  
  // 应用加成效果
  const applyPowerUp = (type) => {
    const now = Date.now();
    console.log('应用加成效果:', type);
    
    switch(type) {
      case 'health':
        // 血量回满
        setLives(3);
        console.log('生命值回满');
        break;
        
      case 'attack':
        // 攻击频率加倍，持续20秒
        setBonusEffects(prev => ({
          ...prev,
          rapidFire: true,
          rapidFireEndTime: now + 20000 // 20秒
        }));
        console.log('攻击频率加倍，持续20秒');
        break;
        
      case 'invincible':
        // 无敌状态，持续20秒
        setBonusEffects(prev => ({
          ...prev,
          invulnerable: true,
          invulnerableEndTime: now + 20000 // 20秒
        }));
        console.log('无敌状态，持续20秒');
        break;
        
      case 'upgrade':
        // 升级处理 - 使用ref获取最新等级值，避免闭包问题
        const currentLevel = levelRef.current;
        console.log('获取升级包！当前等级:', currentLevel, 'state等级:', level, 'levelRef等级:', levelRef.current);
        
        if (currentLevel < 4) {
          const newLevel = currentLevel + 1;
          setLevel(newLevel);
          console.log('升级成功！新等级:', newLevel);
          
          // 如果升级到4级，激活激光效果
          if (newLevel === 4) {
            setIsLaserActive(true);
            setLaserEndTime(now + 10000); // 激光持续10秒
            console.log('激活激光效果，持续10秒');
          }
        } else {
          // 4级时拾取升级包，刷新激光持续时间
          console.log('4级时拾取升级包，刷新激光持续时间！');
          setLaserEndTime(now + 10000); // 刷新激光持续时间
        }
        break;
        
      default:
        break;
    }
  };
  
  // 生成敌方单位列阵
  const spawnEnemy = (config) => {
    console.log('调用spawnEnemy函数');
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // 随机选择列阵类型
    const formationTypes = ['v', 'line', 'curve', 'diagonal'];
    const formation = formationTypes[Math.floor(Math.random() * formationTypes.length)];
    
    // 随机选择敌人类型
    const enemyTypes = ['small', 'medium', 'heavy'];
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // 随机选择生成位置（屏幕顶部）
    const startX = Math.random() * (canvasWidth - 200) + 100;
    const startY = -50; // 从屏幕顶部外开始
    
    // 根据列阵类型生成多个敌人
    let enemiesToSpawn = [];
    const spacing = 30; // 敌人之间的间距
    
    console.log('生成列阵:', formation, '敌人类型:', type, '难度:', difficulty);
    
    switch(formation) {
      case 'v':
        // V字形列阵
        const vSize = Math.floor(Math.random() * 3) + 3; // 3-5个敌人
        for (let i = 0; i < vSize; i++) {
          const offset = (i - Math.floor(vSize / 2)) * spacing;
          const x = startX + offset;
          const y = startY + Math.abs(offset);
          enemiesToSpawn.push({
            x, y, type,
            trajectory: {
              type: 'straight',
              direction: { x: 0, y: 1 },
              startTime: Date.now()
            }
          });
        }
        break;
        
      case 'line':
        // 直线列阵
        const lineSize = Math.floor(Math.random() * 4) + 2; // 2-5个敌人
        for (let i = 0; i < lineSize; i++) {
          enemiesToSpawn.push({
            x: startX + i * spacing,
            y: startY,
            type,
            trajectory: {
              type: 'straight',
              direction: { x: 0, y: 1 },
              startTime: Date.now()
            }
          });
        }
        break;
        
      case 'curve':
        // 曲线列阵
        const curveSize = Math.floor(Math.random() * 3) + 3; // 3-5个敌人
        for (let i = 0; i < curveSize; i++) {
          enemiesToSpawn.push({
            x: startX + i * spacing,
            y: startY,
            type,
            trajectory: {
              type: 'curve',
              direction: { x: 0, y: 1 },
              curveFactor: 2, // 曲线幅度
              startTime: Date.now()
            }
          });
        }
        break;
        
      case 'diagonal':
        // 对角线列阵
        const diagonalSize = Math.floor(Math.random() * 3) + 3; // 3-5个敌人
        const directionX = Math.random() > 0.5 ? 1 : -1; // 随机左右方向
        for (let i = 0; i < diagonalSize; i++) {
          enemiesToSpawn.push({
            x: startX + i * spacing * directionX,
            y: startY + i * spacing,
            type,
            trajectory: {
              type: 'diagonal',
              direction: { x: directionX * 0.3, y: 1 },
              startTime: Date.now()
            }
          });
        }
        break;
        
      default:
        // 默认单个敌人
        enemiesToSpawn.push({
          x: startX,
          y: startY,
          type,
          trajectory: {
            type: 'straight',
            direction: { x: 0, y: 1 },
            startTime: Date.now()
          }
        });
    }
    
    // 生成敌人
    console.log('生成敌人前数量:', enemiesRef.current.length);
    enemiesToSpawn.forEach(enemyData => {
      // 获取当前敌人类型的配置
      const enemyConfig = config.enemyTypes[enemyData.type];
      if (enemyConfig) {
        const newEnemy = new Enemy(
          enemyData.x,
          enemyData.y,
          enemyData.type,
          enemyData.trajectory,
          enemyConfig // 直接传递配置给构造函数
        );
        enemiesRef.current.push(newEnemy);
      }
    });
    console.log('生成敌人后数量:', enemiesRef.current.length);
  };
  
  // 游戏主循环
  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const now = Date.now();
    
    // 清空画布
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 更新和绘制星空背景
    starsRef.current.forEach(star => {
      star.update();
      star.draw(ctx);
    });
    
    // 获取当前难度配置
    const config = getGameConfig();
    
    // 根据等级获取子弹冷却时间
    let bulletCooldown = bonusEffects.rapidFire ? config.bulletCooldown / 2 : config.bulletCooldown;
    // 根据等级调整冷却时间
    switch(levelRef.current) {
      case 1: bulletCooldown = bulletCooldown;
        break;
      case 2: bulletCooldown = bulletCooldown * 0.8;
        break;
      case 3: bulletCooldown = bulletCooldown * 0.6;
        break;
      case 4: bulletCooldown = bulletCooldown * 0.3;
        break;
    }
    
    if (now - lastBulletTimeRef.current > bulletCooldown) {
      lastBulletTimeRef.current = now;
      const player = playerRef.current;
      const currentLevel = levelRef.current;
      
      // 检查是否有攻击加成
      const hasRapidFire = bonusEffectsRef.current.rapidFire;
      
      // 根据等级和攻击加成生成不同数量和属性的子弹
      switch(currentLevel) {
        case 1: // 1级：1个子弹，从中心发射
          if (hasRapidFire) {
            // 攻击加成：从中心发射多个散射子弹
            const angleStep = Math.PI / 4;
            for (let i = 0; i < 3; i++) {
              const angle = -Math.PI / 2 + (i - 1) * angleStep;
              const bullet = new Bullet(
                player.x, 
                player.y - player.size, 
                config.bulletSpeed * 1.5, // 增加子弹速度
                currentLevel
              );
              // 增加子弹大小和伤害
              bullet.size = 6;
              bullet.damage = 2;
              // 添加散射效果
              bullet.vx = Math.sin(angle) * 2;
              bulletsRef.current.push(bullet);
            }
          } else {
            // 普通攻击：1个子弹
            const bullet = new Bullet(
              player.x, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            );
            bullet.damage = 1;
            bulletsRef.current.push(bullet);
          }
          break;
          
        case 2: // 2级：2个子弹，从两侧发射
          if (hasRapidFire) {
            // 攻击加成：从两侧各发射多个散射子弹
            const angleStep = Math.PI / 4;
            const positions = [
              player.x - player.size * 0.8, // 左侧
              player.x + player.size * 0.8  // 右侧
            ];
            
            positions.forEach(posX => {
              for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (i - 0.5) * angleStep;
                const bullet = new Bullet(
                  posX, 
                  player.y - player.size, 
                  config.bulletSpeed * 1.5, // 增加子弹速度
                  currentLevel
                );
                // 增加子弹大小和伤害
                bullet.size = 6;
                bullet.damage = 2;
                // 添加散射效果
                bullet.vx = Math.sin(angle) * 2;
                bulletsRef.current.push(bullet);
              }
            });
          } else {
            // 普通攻击：2个子弹
            bulletsRef.current.push(new Bullet(
              player.x - player.size * 0.8, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
            bulletsRef.current.push(new Bullet(
              player.x + player.size * 0.8, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
          }
          break;
          
        case 3: // 3级：3个子弹，从两侧和中心发射
          if (hasRapidFire) {
            // 攻击加成：从两侧和中心各发射多个散射子弹
            const angleStep = Math.PI / 4;
            const positions = [
              player.x - player.size, // 左侧
              player.x,              // 中心
              player.x + player.size  // 右侧
            ];
            
            positions.forEach(posX => {
              for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (i - 0.5) * angleStep;
                const bullet = new Bullet(
                  posX, 
                  player.y - player.size, 
                  config.bulletSpeed * 1.5, // 增加子弹速度
                  currentLevel
                );
                // 增加子弹大小和伤害
                bullet.size = 7;
                bullet.damage = 3;
                // 添加散射效果
                bullet.vx = Math.sin(angle) * 2;
                bulletsRef.current.push(bullet);
              }
            });
          } else {
            // 普通攻击：3个子弹
            bulletsRef.current.push(new Bullet(
              player.x - player.size, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
            bulletsRef.current.push(new Bullet(
              player.x, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
            bulletsRef.current.push(new Bullet(
              player.x + player.size, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
          }
          break;
          
        case 4: // 4级：3个子弹 + 激光（激光在绘制阶段处理）
          if (hasRapidFire) {
            // 攻击加成：从两侧和中心各发射多个散射子弹
            const angleStep = Math.PI / 4;
            const positions = [
              player.x - player.size, // 左侧
              player.x,              // 中心
              player.x + player.size  // 右侧
            ];
            
            positions.forEach(posX => {
              for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (i - 0.5) * angleStep;
                const bullet = new Bullet(
                  posX, 
                  player.y - player.size, 
                  config.bulletSpeed * 2, // 增加子弹速度
                  currentLevel
                );
                // 增加子弹大小和伤害
                bullet.size = 8;
                bullet.damage = 4;
                // 添加散射效果
                bullet.vx = Math.sin(angle) * 2;
                bulletsRef.current.push(bullet);
              }
            });
          } else {
            // 普通攻击：3个子弹
            bulletsRef.current.push(new Bullet(
              player.x - player.size, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
            bulletsRef.current.push(new Bullet(
              player.x, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
            bulletsRef.current.push(new Bullet(
              player.x + player.size, 
              player.y - player.size, 
              config.bulletSpeed,
              currentLevel
            ));
          }
          break;
      }
    }
    
    // 检查是否需要生成Boss，每获得一千分刷新一个boss
    if (!bossRef.current && scoreRef.current - lastBossSpawnScoreRef.current >= 1000) {
      // 生成Boss
      const canvas = canvasRef.current;
      if (canvas) {
        // 让所有非boss类敌人迅速逃离战场
        enemiesRef.current.forEach(enemy => {
          // 将敌人状态设置为撤退
          enemy.state = 'RETREATING';
          // 增加敌人速度，让它们迅速逃离
          enemy.speed *= 2;
        });
        
        // 生成Boss
        bossRef.current = new Boss(canvas.width / 2, -100, difficulty);
        // 移除bossSpawnedRef的限制，允许多次生成boss
        lastBossSpawnScoreRef.current = scoreRef.current;
        
        console.log('生成新Boss！当前分数:', scoreRef.current, '上次Boss生成分数:', lastBossSpawnScoreRef.current);
      }
    }
    
    // 生成敌方单位（Boss战期间暂停普通敌人）
    if (!bossRef.current && now - lastEnemySpawnTimeRef.current > config.enemySpawnInterval) {
      lastEnemySpawnTimeRef.current = now;
      spawnEnemy(config); // 传递配置给spawnEnemy函数
    }
    
    // 更新玩家位置
    playerRef.current.update(mousePosRef.current, canvas.width, canvas.height);
    
    // 更新所有子弹位置
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.update();
      return !bullet.isOutOfBounds(canvas.height);
    });
    
    // 更新所有敌人位置并检查边界
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      enemy.update(playerRef.current, canvas.width, canvas.height, difficulty, enemyBulletsRef);
      // 检查敌人是否飞出屏幕
      return !enemy.isOutOfBounds(canvas.width, canvas.height);
    });
    
    // 更新Boss（如果存在）
    if (bossRef.current) {
      bossRef.current.update(playerRef.current, canvas.width, canvas.height, enemyBulletsRef, enemiesRef, config);
      
      // 检查Boss是否死亡
      if (!bossRef.current.isActive) {
        // Boss死亡奖励
        setLives(3); // 回满生命值
        if (levelRef.current < 4) {
          setLevel(4); // 升级到4级
        }
        setIsLaserActive(true);
        setLaserEndTime(Date.now() + 10000);
        
        // 掉落所有类型的PowerUp
        const powerUpTypes = ['health', 'attack', 'invincible', 'upgrade'];
        powerUpTypes.forEach(type => {
          const newPowerUp = new PowerUp(canvas.width / 2, canvas.height / 2, type);
          newPowerUp.vx = (Math.random() - 0.5) * 3;
          newPowerUp.vy = (Math.random() - 0.5) * 3;
          powerUpsRef.current.push(newPowerUp);
        });
        
        // 清除Boss
        bossRef.current = null;
        bossSpawnedRef.current = false;
      }
    }
    
    // 更新所有加成包位置
    powerUpsRef.current.forEach(powerUp => {
      powerUp.update(canvas.width, canvas.height);
    });
    
    // 更新所有敌方子弹
    enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
      bullet.update();
      return !bullet.isOutOfBounds(canvas.width, canvas.height);
    });
    
    // 检查玩家与敌人的碰撞
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      if (checkCollision(playerRef.current, enemy)) {
        console.log('玩家与敌人碰撞！', '敌人类型:', enemy.type, '当前生命值:', enemy.health, '敌人得分:', enemy.score, '难度:', difficulty);
        
        // 使用当前的加成效果状态
        const currentEffects = bonusEffectsRef.current;
        
        // 如果玩家处于无敌状态，只对敌人造成伤害
        if (!currentEffects.invulnerable) {
          if (difficulty === 'nightmare') {
            // 噩梦难度下，碰撞直接死亡
            console.log('噩梦难度！碰撞直接死亡！');
            setLives(0);
            setGameState('gameover');
          } else {
            // 普通难度，受到一点伤害
            setLives(prev => {
              const newLives = prev - 1;
              console.log('玩家受到伤害！当前生命值:', prev, '新生命值:', newLives);
              if (newLives <= 0) {
                setGameState('gameover');
              }
              return newLives;
            });
          }
        }
        
        // 敌人受到一点伤害
        enemy.health -= 1;
        console.log('敌人生命值减少后:', enemy.health);
        
        // 如果敌人死亡，增加分数
        if (enemy.health <= 0) {
          // 生成爆炸粒子效果
          for (let i = 0; i < 15; i++) {
            particlesRef.current.push(new Particle(enemy.x, enemy.y, 'explosion'));
          }
          
          // 使用回调函数确保获取最新状态
          setScore(prevScore => {
            const newScore = prevScore + enemy.score;
            console.log('玩家碰撞消灭敌人！', '加分数:', enemy.score, '当前总分:', prevScore, '新总分:', newScore);
            return newScore;
          });
          
          // 为中型和重型敌人添加掉落加成包的概率
          if (enemy.type === 'medium' || enemy.type === 'heavy') {
            // 35%概率掉落加成包
            if (Math.random() < 0.35) {
              let powerUpTypes = ['health', 'attack', 'invincible'];
              // 提升3级前的升级包掉落概率
              const isUpgrade = levelRef.current < 3 ? Math.random() < 0.4 : Math.random() < 0.25;
              if (isUpgrade) {
                powerUpTypes = ['upgrade'];
              }
              const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
              const newPowerUp = new PowerUp(enemy.x, enemy.y, powerUpType);
              // 为加成包添加初始速度和方向
              newPowerUp.vx = (Math.random() - 0.5) * 2; // 随机水平速度
              newPowerUp.vy = Math.random() * 2 + 1; // 随机垂直速度
              powerUpsRef.current.push(newPowerUp);
              console.log('生成加成包:', powerUpType, '当前等级:', levelRef.current, '升级包概率:', levelRef.current < 3 ? '40%' : '25%');
            }
          }
        }
        
        return false;
      }
      
      return true;
    });
    
    // 检查玩家与Boss的碰撞
    if (bossRef.current && checkCollision(playerRef.current, bossRef.current)) {
      const currentEffects = bonusEffectsRef.current;
      
      // 如果玩家处于无敌状态，忽略碰撞
      if (!currentEffects.invulnerable) {
        if (difficulty === 'nightmare') {
          // 噩梦难度下，碰撞直接死亡
          setLives(0);
          setGameState('gameover');
        } else {
          // 普通难度，受到一点伤害
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameover');
            }
            return newLives;
          });
        }
      }
    }
    
    // 检查子弹与敌人的碰撞
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      let isActive = true;
      
      // 检查子弹与普通敌人的碰撞
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (checkCollision(bullet, enemy)) {
          console.log('子弹击中敌人！', '敌人类型:', enemy.type, '当前生命值:', enemy.health, '敌人得分:', enemy.score);
          // 使用子弹的伤害属性，默认伤害为1
          const damage = bullet.damage || 1;
          enemy.health -= damage;
          console.log('子弹伤害:', damage, '敌人生命值减少后:', enemy.health);
          isActive = false;
          
          console.log('敌人生命值减少后:', enemy.health);
          
          if (enemy.health <= 0) {
            // 生成爆炸粒子效果
            for (let i = 0; i < 15; i++) {
              particlesRef.current.push(new Particle(enemy.x, enemy.y, 'explosion'));
            }
            
            // 修复计分功能，确保正确加分 - 使用回调函数确保获取最新状态
            setScore(prevScore => {
              const newScore = prevScore + enemy.score;
              console.log('敌人被消灭！', '加分数:', enemy.score, '当前总分:', prevScore, '新总分:', newScore);
              return newScore;
            });
            
            // 为中型和重型敌人添加掉落加成包的概率
            if (enemy.type === 'medium' || enemy.type === 'heavy') {
              // 35%概率掉落加成包
              if (Math.random() < 0.35) {
                let powerUpTypes = ['health', 'attack', 'invincible'];
                // 提升3级前的升级包掉落概率
                const isUpgrade = levelRef.current < 3 ? Math.random() < 0.4 : Math.random() < 0.25;
                if (isUpgrade) {
                  powerUpTypes = ['upgrade'];
                }
                const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
                const newPowerUp = new PowerUp(enemy.x, enemy.y, powerUpType);
                // 为加成包添加初始速度和方向
                newPowerUp.vx = (Math.random() - 0.5) * 2; // 随机水平速度
                newPowerUp.vy = Math.random() * 2 + 1; // 随机垂直速度
                powerUpsRef.current.push(newPowerUp);
                console.log('生成加成包:', powerUpType, '当前等级:', levelRef.current, '升级包概率:', levelRef.current < 3 ? '40%' : '25%');
              }
            }
            
            return false;
          }
        }
        return true;
      });
      
      // 检查子弹与Boss的碰撞
      if (bossRef.current && checkCollision(bullet, bossRef.current)) {
        isActive = false;
        
        // Boss受到伤害
        const hit = bossRef.current.takeDamage(1);
        if (hit) {
          // 生成爆炸粒子效果
          for (let i = 0; i < 20; i++) {
            particlesRef.current.push(new Particle(bossRef.current.x, bossRef.current.y, 'explosion'));
          }
        }
      }
      
      return isActive;
    });
    
    // 检查玩家与加成包的碰撞
    powerUpsRef.current = powerUpsRef.current.filter(powerUp => {
      if (checkCollision(playerRef.current, powerUp)) {
        // 应用加成效果
        applyPowerUp(powerUp.type);
        return false;
      }
      // 加成包不再出界，始终在地图内反弹
      return true;
    });
    
    // 检查敌方子弹与玩家的碰撞
    enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
      if (checkCollision(playerRef.current, bullet)) {
        // 使用当前的加成效果状态
        const currentEffects = bonusEffectsRef.current;
        
        // 如果玩家处于无敌状态，忽略此碰撞
        if (!currentEffects.invulnerable) {
          if (difficulty === 'nightmare') {
            // 噩梦难度下，被击中直接死亡
            setLives(0);
            setGameState('gameover');
          } else {
            // 普通难度，受到一点伤害
            setLives(prev => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameState('gameover');
              }
              return newLives;
            });
          }
        }
        return false;
      }
      return true;
    });
    
    // 绘制所有游戏对象
    playerRef.current.draw(ctx);
    
    // 绘制所有子弹
    bulletsRef.current.forEach(bullet => {
      bullet.draw(ctx);
    });
    
    // 绘制所有敌人
    enemiesRef.current.forEach(enemy => {
      enemy.draw(ctx);
    });
    
    // 绘制所有加成包
    powerUpsRef.current.forEach(powerUp => {
      powerUp.draw(ctx);
    });
    
    // 绘制所有敌方子弹
    enemyBulletsRef.current.forEach(bullet => {
      bullet.draw(ctx);
    });
    
    // 绘制Boss（如果存在）
    if (bossRef.current) {
      // 绘制Boss血条
      bossRef.current.drawHealthBar(ctx, canvas.width);
      // 绘制Boss
      bossRef.current.draw(ctx, canvas.width);
    }
    
    // 更新和绘制粒子系统
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.update();
      particle.draw(ctx);
      return particle.isAlive();
    });
    
    // 激光效果：绘制和碰撞检测
    if (isLaserActiveRef.current) {
      const player = playerRef.current;
      const laserWidth = player.size;
      const laserHeight = canvas.height;
      const time = Date.now();
      
      // 绘制激光 - 向上发射
      ctx.save();
      
      // 激光外发光效果
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 30;
      
      // 动态波动效果
      const waveAmplitude = Math.sin(time * 0.01) * 2;
      const waveFrequency = Math.sin(time * 0.02) * 0.5 + 1;
      
      // 绘制激光主体 - 渐变效果
      const gradient = ctx.createLinearGradient(
        player.x - laserWidth / 2, 0, 
        player.x + laserWidth / 2, 0
      );
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
      gradient.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(
        player.x - laserWidth / 2 - waveAmplitude,
        -player.size, // 从屏幕顶部开始
        laserWidth + waveAmplitude * 2,
        player.y // 延伸到玩家位置
      );
      
      // 激光中心高亮 - 动态效果
      const centerGradient = ctx.createLinearGradient(
        player.x - laserWidth / 4, 0, 
        player.x + laserWidth / 4, 0
      );
      centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      centerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
      
      ctx.fillStyle = centerGradient;
      ctx.fillRect(
        player.x - laserWidth / 4 - waveAmplitude * 0.5,
        -player.size, // 从屏幕顶部开始
        laserWidth / 2 + waveAmplitude,
        player.y // 延伸到玩家位置
      );
      
      // 添加激光粒子效果
      if (Math.random() > 0.8) {
        particlesRef.current.push(new Particle(
          player.x + (Math.random() - 0.5) * laserWidth,
          player.y - Math.random() * player.y,
          'laser'
        ));
      }
      
      ctx.restore();
      
      // 激光碰撞检测 - 向上发射
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        // 检查敌人是否与激光矩形相交 - 激光向上发射
        const laserRect = {
          x: player.x - laserWidth / 2,
          y: -player.size, // 从屏幕顶部开始
          width: laserWidth,
          height: player.y + player.size // 延伸到玩家位置下方一点
        };
        
        // 简化的矩形-圆形碰撞检测
        const closestX = Math.max(laserRect.x, Math.min(enemy.x, laserRect.x + laserRect.width));
        const closestY = Math.max(laserRect.y, Math.min(enemy.y, laserRect.y + laserRect.height));
        const dx = enemy.x - closestX;
        const dy = enemy.y - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared < enemy.size * enemy.size) {
          // 生成激光爆炸粒子效果
          for (let i = 0; i < 10; i++) {
            particlesRef.current.push(new Particle(enemy.x, enemy.y, 'laser'));
          }
          
          // 激光击中敌人，直接消灭
          setScore(prevScore => {
            const newScore = prevScore + enemy.score;
            console.log('激光消灭敌人！', '加分数:', enemy.score, '当前总分:', prevScore, '新总分:', newScore);
            return newScore;
          });
          return false;
        }
        return true;
      });
      
      // 检查激光与Boss的碰撞
      if (bossRef.current) {
        const laserRect = {
          x: player.x - laserWidth / 2,
          y: -player.size,
          width: laserWidth,
          height: player.y + player.size
        };
        
        const closestX = Math.max(laserRect.x, Math.min(bossRef.current.x, laserRect.x + laserRect.width));
        const closestY = Math.max(laserRect.y, Math.min(bossRef.current.y, laserRect.y + laserRect.height));
        const dx = bossRef.current.x - closestX;
        const dy = bossRef.current.y - closestY;
        const distanceSquared = dx * dx + dy * dy;
        
        if (distanceSquared < bossRef.current.size * bossRef.current.size) {
          // Boss受到激光伤害
          const hit = bossRef.current.takeDamage(0.5);
          if (hit) {
            // 生成激光爆炸粒子效果
            for (let i = 0; i < 15; i++) {
              particlesRef.current.push(new Particle(bossRef.current.x, bossRef.current.y, 'laser'));
            }
          }
        }
      }
    }
    
    // 性能优化：限制敌方子弹数量
    if (enemyBulletsRef.current.length > 30) {
      enemyBulletsRef.current = enemyBulletsRef.current.slice(-30);
    }
    
    // 检查加成效果持续时间 - 使用当前状态值，避免闭包问题
    setBonusEffects(prev => {
      const updatedEffects = { ...prev };
      let effectChanged = false;
      
      if (prev.rapidFire && now > prev.rapidFireEndTime) {
        updatedEffects.rapidFire = false;
        effectChanged = true;
        console.log('攻击加成结束');
      }
      
      if (prev.invulnerable && now > prev.invulnerableEndTime) {
        updatedEffects.invulnerable = false;
        effectChanged = true;
        console.log('无敌效果结束');
      }
      
      return effectChanged ? updatedEffects : prev;
    });
    
    // 检查激光效果是否结束
    if (isLaserActiveRef.current && now > laserEndTimeRef.current) {
      setIsLaserActive(false);
      setLevel(3); // 激光结束后降级回3级
      console.log('激光效果结束，降级回3级');
    }
    
    // 绘制UI - 使用ref获取最新状态
    ctx.save();
    
    // 设置UI文字样式
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    
    // 分数显示 - 带发光效果
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`分数: ${scoreRef.current}`, 20, 40);
    
    // 生命值显示 - 带颜色变化
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = livesRef.current > 1 ? '#ffffff' : '#ff0000';
    ctx.fillText(`生命值: ${'❤️'.repeat(livesRef.current)}`, 20, 75);
    
    // 等级显示 - 带颜色变化
    ctx.shadowColor = '#00ff00';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`等级: ${levelRef.current}`, 20, 110);
    
    // 敌人数量显示 - 带颜色变化
    ctx.shadowColor = '#ff8800';
    ctx.fillStyle = enemiesRef.current.length > 10 ? '#ff0000' : '#ffffff';
    ctx.fillText(`敌人数量: ${enemiesRef.current.length}`, 20, 145);
    
    // 重置阴影
    ctx.shadowBlur = 0;
    
    // 绘制加成效果状态 - 使用ref获取最新状态
    const currentBonusEffects = bonusEffectsRef.current;
    let effectY = 180;
    let effectHeight = 35;
    
    // 绘制效果背景框
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.fillRect(15, effectY - 10, 220, effectHeight * (currentBonusEffects.rapidFire ? 1 : 0) + effectHeight * (currentBonusEffects.invulnerable ? 1 : 0) + effectHeight * (isLaserActiveRef.current ? 1 : 0) + 10);
    ctx.strokeRect(15, effectY - 10, 220, effectHeight * (currentBonusEffects.rapidFire ? 1 : 0) + effectHeight * (currentBonusEffects.invulnerable ? 1 : 0) + effectHeight * (isLaserActiveRef.current ? 1 : 0) + 10);
    
    if (currentBonusEffects.rapidFire) {
      // 攻击加成效果
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('⚡ 攻击加成中', 25, effectY + 25);
      
      // 绘制持续时间进度条
      const rapidFireProgress = Math.max(0, (currentBonusEffects.rapidFireEndTime - now) / 20000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(25, effectY + 30, 200, 5);
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(25, effectY + 30, 200 * rapidFireProgress, 5);
      
      effectY += effectHeight;
    }
    
    if (currentBonusEffects.invulnerable) {
      // 无敌效果
      ctx.fillStyle = '#45b7d1';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('✨ 无敌状态中', 25, effectY + 25);
      
      // 绘制持续时间进度条
      const invulnerableProgress = Math.max(0, (currentBonusEffects.invulnerableEndTime - now) / 20000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(25, effectY + 30, 200, 5);
      ctx.fillStyle = '#45b7d1';
      ctx.fillRect(25, effectY + 30, 200 * invulnerableProgress, 5);
      
      effectY += effectHeight;
    }
    
    if (isLaserActiveRef.current) {
      // 激光模式效果
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('💥 激光模式激活', 25, effectY + 25);
      
      // 绘制持续时间进度条
      const laserProgress = Math.max(0, (laserEndTimeRef.current - now) / 10000);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(25, effectY + 30, 200, 5);
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(25, effectY + 30, 200 * laserProgress, 5);
      
      effectY += effectHeight;
    }
    
    ctx.restore();
    
    // 游戏状态检查
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };
  
  // 初始化游戏
  const initGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    console.log('初始化游戏');
    
    // 设置Canvas尺寸
    canvas.width = 800;
    canvas.height = 600;
    
    // 获取当前难度配置 - 移到前面，确保在使用前声明
    const gameConfig = getGameConfig();
    
    // 初始化星空背景
    starsRef.current = [];
    for (let i = 0; i < 200; i++) {
      starsRef.current.push(new Star(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        canvas.width,
        canvas.height
      ));
    }
    
    // 清空粒子系统
    particlesRef.current = [];
    
    // 初始化玩家
    playerRef.current = new Player(canvas.width / 2, canvas.height - 50, gameConfig.playerSpeed);
    
    // 重置游戏状态
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1); // 重置等级为1
    setIsLaserActive(false); // 关闭激光
    setLaserEndTime(0); // 重置激光结束时间
    
    // 重置加成效果
    setBonusEffects({
      rapidFire: false,
      invulnerable: false,
      rapidFireEndTime: 0,
      invulnerableEndTime: 0
    });
    
    // 立即更新ref值，确保游戏开始时使用正确的初始状态
    scoreRef.current = 0;
    livesRef.current = 3;
    levelRef.current = 1;
    isLaserActiveRef.current = false;
    laserEndTimeRef.current = 0;
    bonusEffectsRef.current = {
      rapidFire: false,
      invulnerable: false,
      rapidFireEndTime: 0,
      invulnerableEndTime: 0
    };
    // 重置Boss生成分数
    lastBossSpawnScoreRef.current = 0;
    
    // 清空游戏对象
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = []; // 初始化加成包数组
    
    // 初始化敌人生成时间，确保游戏开始后立即生成敌人
    lastEnemySpawnTimeRef.current = Date.now() - gameConfig.enemySpawnInterval;
    console.log('初始化敌人生成时间:', lastEnemySpawnTimeRef.current, '难度:', difficulty);
    
    // 立即生成一个敌人，确保游戏开始时就有敌人
    spawnEnemy(gameConfig); // 传递配置参数
    
    // 开始游戏循环
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };
  
  // 停止游戏
  const stopGame = () => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };
  
  // 处理鼠标移动
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };
  
  // 组件挂载时初始化
  useEffect(() => {
    return () => {
      stopGame();
    };
  }, []);
  
  // 游戏状态变化时处理
  useEffect(() => {
    if (gameState === 'playing') {
      initGame();
    } else {
      stopGame();
    }
  }, [gameState]);
  
  return (
    <div className="plane-game" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>🚀 小飞机游戏</Title>
        <Text type="secondary">鼠标控制飞机，自动发射子弹，消灭敌人获得分数</Text>
      </div>
      
      {/* 难度选择 */}
      <div style={{ marginBottom: '16px' }}>
        <Title level={5}>选择难度</Title>
        <Space size="middle">
          <Button 
            type={difficulty === 'easy' ? 'primary' : 'default'}
            onClick={() => setDifficulty('easy')}
          >
            简单
          </Button>
          <Button 
            type={difficulty === 'hard' ? 'primary' : 'default'}
            onClick={() => setDifficulty('hard')}
          >
            困难
          </Button>
          <Button 
            type={difficulty === 'nightmare' ? 'primary' : 'default'}
            danger
            onClick={() => setDifficulty('nightmare')}
          >
            噩梦
          </Button>
        </Space>
      </div>
      
      {/* 测试按钮，用于手动生成敌人 */}
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          onClick={() => {
            spawnEnemy(getGameConfig());
            console.log('手动生成敌人，当前数量:', enemiesRef.current.length);
          }}
        >
          手动生成敌人
        </Button>
      </div>
      
      <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            style={{
              border: '2px solid #1890ff',
              borderRadius: '8px',
              cursor: 'crosshair',
              backgroundColor: '#0a0a1a',
              width: '800px',
              height: '600px'
            }}
            width={800}
            height={600}
          />
          
          {/* 游戏开始/结束界面 */}
          {(gameState === 'start' || gameState === 'gameover') && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '8px',
              color: '#ffffff'
            }}>
              <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
                {gameState === 'start' ? '游戏开始' : '游戏结束'}
              </Title>
              
              {gameState === 'gameover' && (
                <div style={{ marginBottom: '24px' }}>
                  <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', display: 'block' }}>
                    最终分数: {score}
                  </Text>
                </div>
              )}
              
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => setGameState('playing')}
                >
                  {gameState === 'start' ? '开始游戏' : '重新开始'}
                </Button>
              </Space>
              
              <div style={{ marginTop: '32px', textAlign: 'left' }}>
                <Title level={5} style={{ color: '#ffffff', marginBottom: '12px' }}>
                  游戏规则：
                </Title>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '8px' }}>• 鼠标控制飞机移动</li>
                  <li style={{ marginBottom: '8px' }}>• 自动发射子弹，消灭敌人</li>
                  <li style={{ marginBottom: '8px' }}>• 小型敌人：1分，1滴血</li>
                  <li style={{ marginBottom: '8px' }}>• 中型敌人：5分，3滴血</li>
                  <li style={{ marginBottom: '8px' }}>• 重型敌人：20分，10滴血</li>
                  <li style={{ marginBottom: '8px' }}>• 被敌人命中3次游戏结束</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PlaneGame;