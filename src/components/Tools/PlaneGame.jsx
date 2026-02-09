import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import Star from './PlaneGame/star';
import Particle from './PlaneGame/particle';
import PowerUp from './PlaneGame/powerUp';
import { Bullet, EnemyBullet } from './PlaneGame/bullet';
import Player from './PlaneGame/player';
import { Enemy, Boss } from './PlaneGame/enemy';
import { GAME_CONFIG } from './PlaneGame/constants';
import assetManager from './PlaneGame/assetManager';
import useGameState from './PlaneGame/useGameState';
import useGameLogic from './PlaneGame/useGameLogic';
import GameUI from './PlaneGame/GameUI';

const { Title, Text } = Typography;

const PlaneGame = () => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const lastBulletTimeRef = useRef(0);
  const lastEnemySpawnTimeRef = useRef(0);
  const mousePosRef = useRef({ x: 0, y: 0 });
  
  const [difficulty, setDifficulty] = useState('easy');
  
  const {
    gameState,
    setGameState,
    score,
    setScore,
    lives,
    setLives,
    level,
    setLevel,
    isLaserActive,
    setIsLaserActive,
    laserEndTime,
    setLaserEndTime,
    bonusEffects,
    setBonusEffects,
    scoreRef,
    livesRef,
    levelRef,
    isLaserActiveRef,
    laserEndTimeRef,
    bonusEffectsRef,
    gameStartTimeRef,
    lastBossSpawnScoreRef,
    applyPowerUp,
    updateBonusEffects,
    checkLaserExpiration,
    resetGame,
    getGameTime,
    getConfig
  } = useGameState(difficulty);
  
  const {
    config,
    checkCollision,
    spawnEnemyFormation,
    initGrid,
    clearGrid,
    addToGrid,
    getNearbyObjects
  } = useGameLogic(difficulty);
  
  const playerRef = useRef(null);
  const bulletsRef = useRef([]);
  const enemyBulletsRef = useRef([]);
  const enemiesRef = useRef([]);
  const powerUpsRef = useRef([]);
  const bossRef = useRef(null);
  
  const hitStopRef = useRef({ active: false, startTime: 0, duration: 50 });
  const cameraShakeRef = useRef({ active: false, startTime: 0, duration: 200, intensity: 5 });
  const starsRef = useRef([]);
  const particlesRef = useRef([]);
  
  const getGameConfig = useCallback(() => getConfig(), [getConfig]);
  
  const stopGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  }, []);
  
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    mousePosRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);
  
  const spawnEnemy = useCallback(() => {
    spawnEnemyFormation(canvasRef.current, enemiesRef.current);
  }, [spawnEnemyFormation]);
  
  const createExplosion = useCallback((x, y, count = 15) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(x, y, 'explosion'));
    }
  }, []);
  
  const spawnPowerUp = useCallback((x, y, types) => {
    const powerUpTypes = types || ['health', 'attack', 'invincible', 'upgrade'];
    powerUpTypes.forEach(type => {
      const newPowerUp = new PowerUp(x, y, type);
      newPowerUp.vx = (Math.random() - 0.5) * 3;
      newPowerUp.vy = (Math.random() - 0.5) * 3;
      powerUpsRef.current.push(newPowerUp);
    });
  }, []);
  
  const handlePlayerCollision = useCallback((enemy) => {
    const currentEffects = bonusEffectsRef.current;
    
    if (!currentEffects.invulnerable) {
      if (difficulty === 'nightmare') {
        setLives(0);
        setGameState('gameover');
      } else {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameover');
          }
          return newLives;
        });
      }
    }
    
    enemy.health -= 1;
    
    if (enemy.health <= 0) {
      createExplosion(enemy.x, enemy.y);
      setScore(prevScore => prevScore + enemy.score);
      
      if (enemy.type === 'medium' || enemy.type === 'heavy') {
        if (Math.random() < 0.35) {
          let powerUpTypes = ['health', 'attack', 'invincible'];
          const isUpgrade = levelRef.current < 3 ? Math.random() < 0.4 : Math.random() < 0.25;
          if (isUpgrade) powerUpTypes = ['upgrade'];
          const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          const newPowerUp = new PowerUp(enemy.x, enemy.y, powerUpType);
          newPowerUp.vx = (Math.random() - 0.5) * 2;
          newPowerUp.vy = Math.random() * 2 + 1;
          powerUpsRef.current.push(newPowerUp);
        }
      }
    }
    
    return enemy.health <= 0;
  }, [difficulty, setLives, setGameState, setScore, createExplosion, levelRef]);
  
  const handleBulletCollision = useCallback((bullet, enemy) => {
    const damage = bullet.damage || 1;
    enemy.health -= damage;
    
    if (enemy.health <= 0) {
      createExplosion(enemy.x, enemy.y);
      setScore(prevScore => prevScore + enemy.score);
      
      if (enemy.type === 'medium' || enemy.type === 'heavy') {
        if (Math.random() < 0.35) {
          let powerUpTypes = ['health', 'attack', 'invincible'];
          const isUpgrade = levelRef.current < 3 ? Math.random() < 0.4 : Math.random() < 0.25;
          if (isUpgrade) powerUpTypes = ['upgrade'];
          const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
          const newPowerUp = new PowerUp(enemy.x, enemy.y, powerUpType);
          newPowerUp.vx = (Math.random() - 0.5) * 2;
          newPowerUp.vy = Math.random() * 2 + 1;
          powerUpsRef.current.push(newPowerUp);
        }
      }
      return true;
    }
    return false;
  }, [createExplosion, setScore, levelRef]);
  
  const handleBossCollision = useCallback((bullet) => {
    const hit = bossRef.current.takeDamage(1);
    if (hit) {
      hitStopRef.current = { active: true, startTime: Date.now(), duration: 30 };
      cameraShakeRef.current = { active: true, startTime: Date.now(), duration: 150, intensity: 3 };
      createExplosion(bossRef.current.x, bossRef.current.y, 20);
    }
  }, [createExplosion]);
  
  const drawLaserEffect = useCallback((ctx, player, now) => {
    const laserWidth = player.size;
    
    ctx.save();
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    
    const waveAmplitude = Math.sin(now * 0.01) * 2;
    
    const gradient = ctx.createLinearGradient(player.x - laserWidth / 2, 0, player.x + laserWidth / 2, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
    gradient.addColorStop(0.5, 'rgba(0, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.2)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(player.x - laserWidth / 2 - waveAmplitude, -player.size, laserWidth + waveAmplitude * 2, player.y);
    
    const centerGradient = ctx.createLinearGradient(player.x - laserWidth / 4, 0, player.x + laserWidth / 4, 0);
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    centerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
    centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
    
    ctx.fillStyle = centerGradient;
    ctx.fillRect(player.x - laserWidth / 4 - waveAmplitude * 0.5, -player.size, laserWidth / 2 + waveAmplitude, player.y);
    
    if (Math.random() > 0.8) {
      particlesRef.current.push(new Particle(player.x + (Math.random() - 0.5) * laserWidth, player.y - Math.random() * player.y, 'laser'));
    }
    
    ctx.restore();
  }, []);
  
  const drawStatusBar = useCallback((ctx, now) => {
    ctx.save();
    
    const gameTime = getGameTime();
    ctx.textAlign = 'left';
    
    const panelX = 15;
    const panelY = 15;
    const panelWidth = 250;
    const panelHeight = 180;
    
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 25;
    
    const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY);
    panelGradient.addColorStop(0, 'rgba(15, 15, 40, 0.97)');
    panelGradient.addColorStop(0.5, 'rgba(25, 25, 60, 0.9)');
    panelGradient.addColorStop(1, 'rgba(15, 15, 40, 0.97)');
    ctx.fillStyle = panelGradient;
    
    ctx.beginPath();
    const radius = 10;
    ctx.moveTo(panelX + radius, panelY);
    ctx.lineTo(panelX + panelWidth - radius, panelY);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY, panelX + panelWidth, panelY + radius);
    ctx.lineTo(panelX + panelWidth, panelY + panelHeight - radius);
    ctx.quadraticCurveTo(panelX + panelWidth, panelY + panelHeight, panelX + panelWidth - radius, panelY + panelHeight);
    ctx.lineTo(panelX + radius, panelY + panelHeight);
    ctx.quadraticCurveTo(panelX, panelY + panelHeight, panelX, panelY + panelHeight - radius);
    ctx.lineTo(panelX, panelY + radius);
    ctx.quadraticCurveTo(panelX, panelY, panelX + radius, panelY);
    ctx.fill();
    
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    for (let x = panelX + 20; x < panelX + panelWidth; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, panelY);
      ctx.lineTo(x, panelY + panelHeight);
      ctx.stroke();
    }
    for (let y = panelY + 20; y < panelY + panelHeight; y += 35) {
      ctx.beginPath();
      ctx.moveTo(panelX, y);
      ctx.lineTo(panelX + panelWidth, y);
      ctx.stroke();
    }
    
    const scanLineY = (panelY + (now * 0.1) % panelHeight);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX, scanLineY);
    ctx.lineTo(panelX + panelWidth, scanLineY);
    ctx.stroke();
    ctx.lineWidth = 2;
    
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 12;
    ctx.fillText('SYSTEM STATUS', panelX + 20, panelY + 30);
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 6;
    ctx.fillText(`SCORE: ${scoreRef.current.toLocaleString()}`, panelX + 20, panelY + 60);
    ctx.shadowBlur = 0;
    
    const scoreProgress = Math.min(1, scoreRef.current / 1000);
    const scoreBarGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
    scoreBarGradient.addColorStop(0, '#ffff00');
    scoreBarGradient.addColorStop(1, '#ffaa00');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(panelX + 20, panelY + 65, panelWidth - 40, 4);
    ctx.fillStyle = scoreBarGradient;
    ctx.fillRect(panelX + 20, panelY + 65, (panelWidth - 40) * scoreProgress, 4);
    
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = livesRef.current > 1 ? '#00ff88' : '#ff4444';
    ctx.shadowColor = livesRef.current > 1 ? '#00ff88' : '#ff4444';
    ctx.shadowBlur = 6;
    ctx.fillText(`LIVES: ${'❤️'.repeat(livesRef.current)}`, panelX + 20, panelY + 90);
    ctx.shadowBlur = 0;
    
    const livesProgress = livesRef.current / 3;
    const livesBarGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
    livesBarGradient.addColorStop(0, '#00ff88');
    livesBarGradient.addColorStop(1, '#00aa66');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(panelX + 20, panelY + 95, panelWidth - 40, 4);
    ctx.fillStyle = livesBarGradient;
    ctx.fillRect(panelX + 20, panelY + 95, (panelWidth - 40) * livesProgress, 4);
    
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 6;
    ctx.fillText(`LEVEL: ${levelRef.current}`, panelX + 20, panelY + 120);
    ctx.shadowBlur = 0;
    
    const levelProgress = Math.min(1, (levelRef.current - 1) / 3);
    const levelBarGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
    levelBarGradient.addColorStop(0, '#00d4ff');
    levelBarGradient.addColorStop(1, '#0088cc');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(panelX + 20, panelY + 125, panelWidth - 40, 4);
    ctx.fillStyle = levelBarGradient;
    ctx.fillRect(panelX + 20, panelY + 125, (panelWidth - 40) * levelProgress, 4);
    
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = enemiesRef.current.length > 10 ? '#ff4444' : '#ffaa44';
    ctx.shadowColor = enemiesRef.current.length > 10 ? '#ff4444' : '#ffaa44';
    ctx.shadowBlur = 6;
    ctx.fillText(`ENEMIES: ${enemiesRef.current.length}`, panelX + 20, panelY + 150);
    ctx.shadowBlur = 0;
    
    const enemyProgress = Math.min(1, enemiesRef.current.length / 20);
    const enemyBarGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
    enemyBarGradient.addColorStop(0, '#ffaa44');
    enemyBarGradient.addColorStop(1, '#ff4444');
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(panelX + 20, panelY + 155, panelWidth - 40, 4);
    ctx.fillStyle = enemyBarGradient;
    ctx.fillRect(panelX + 20, panelY + 155, (panelWidth - 40) * enemyProgress, 4);
    
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#9999ff';
    ctx.shadowColor = '#9999ff';
    ctx.shadowBlur = 6;
    ctx.fillText(`TIME: ${gameTime}s`, panelX + panelWidth - 90, panelY + 30);
    ctx.shadowBlur = 0;
    
    ctx.font = 'bold 12px monospace';
    const difficultyColors = { 'easy': '#00ff88', 'hard': '#ffaa44', 'nightmare': '#ff4444' };
    ctx.fillStyle = difficultyColors[difficulty] || '#ffffff';
    ctx.shadowColor = difficultyColors[difficulty] || '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText(`DIFFICULTY: ${difficulty.toUpperCase()}`, panelX + 20, panelY + 180);
    ctx.shadowBlur = 0;
    
    const currentBonusEffects = bonusEffectsRef.current;
    let effectY = panelY + panelHeight + 10;
    let effectHeight = 45;
    
    const effectCount = (currentBonusEffects.rapidFire ? 1 : 0) + (currentBonusEffects.invulnerable ? 1 : 0) + (isLaserActiveRef.current ? 1 : 0);
    
    if (effectCount > 0) {
      const effectPanelGradient = ctx.createLinearGradient(panelX, effectY, panelX + panelWidth, effectY);
      effectPanelGradient.addColorStop(0, 'rgba(30, 10, 40, 0.95)');
      effectPanelGradient.addColorStop(1, 'rgba(40, 15, 50, 0.85)');
      
      ctx.shadowColor = '#aa00ff';
      ctx.shadowBlur = 15;
      
      ctx.beginPath();
      ctx.moveTo(panelX + radius, effectY - 10);
      ctx.lineTo(panelX + panelWidth - radius, effectY - 10);
      ctx.quadraticCurveTo(panelX + panelWidth, effectY - 10, panelX + panelWidth, effectY - 10 + radius);
      ctx.lineTo(panelX + panelWidth, effectY - 10 + effectHeight * effectCount + 10 - radius);
      ctx.quadraticCurveTo(panelX + panelWidth, effectY - 10 + effectHeight * effectCount + 10, panelX + panelWidth - radius, effectY - 10 + effectHeight * effectCount + 10);
      ctx.lineTo(panelX + radius, effectY - 10 + effectHeight * effectCount + 10);
      ctx.quadraticCurveTo(panelX, effectY - 10 + effectHeight * effectCount + 10, panelX, effectY - 10 + effectHeight * effectCount + 10 - radius);
      ctx.lineTo(panelX, effectY - 10 + radius);
      ctx.quadraticCurveTo(panelX, effectY - 10, panelX + radius, effectY - 10);
      ctx.fillStyle = effectPanelGradient;
      ctx.fill();
      
      ctx.strokeStyle = '#aa00ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#aa00ff';
      ctx.fillText('ACTIVE EFFECTS', panelX + 20, effectY + 15);
      effectY += 10;
    }
    
    if (currentBonusEffects.rapidFire) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('⚡ RAPID FIRE', panelX + 20, effectY + 35);
      
      const rapidFireProgress = Math.max(0, (currentBonusEffects.rapidFireEndTime - now) / 20000);
      const progressGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
      progressGradient.addColorStop(0, '#ff6b6b');
      progressGradient.addColorStop(1, '#ff4444');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(panelX + 20, effectY + 40, panelWidth - 40, 6);
      ctx.fillStyle = progressGradient;
      ctx.fillRect(panelX + 20, effectY + 40, (panelWidth - 40) * rapidFireProgress, 6);
      
      const remainingTime = Math.max(0, Math.floor((currentBonusEffects.rapidFireEndTime - now) / 1000));
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${remainingTime}s`, panelX + panelWidth - 60, effectY + 35);
      
      effectY += effectHeight;
    }
    
    if (currentBonusEffects.invulnerable) {
      ctx.fillStyle = '#45b7d1';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('✨ INVULNERABLE', panelX + 20, effectY + 35);
      
      const invulnerableProgress = Math.max(0, (currentBonusEffects.invulnerableEndTime - now) / 20000);
      const progressGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
      progressGradient.addColorStop(0, '#45b7d1');
      progressGradient.addColorStop(1, '#00aaff');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(panelX + 20, effectY + 40, panelWidth - 40, 6);
      ctx.fillStyle = progressGradient;
      ctx.fillRect(panelX + 20, effectY + 40, (panelWidth - 40) * invulnerableProgress, 6);
      
      const remainingTime = Math.max(0, Math.floor((currentBonusEffects.invulnerableEndTime - now) / 1000));
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${remainingTime}s`, panelX + panelWidth - 60, effectY + 35);
      
      effectY += effectHeight;
    }
    
    if (isLaserActiveRef.current) {
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('💥 LASER MODE', panelX + 20, effectY + 35);
      
      const laserProgress = Math.max(0, (laserEndTimeRef.current - now) / 10000);
      const progressGradient = ctx.createLinearGradient(panelX + 20, 0, panelX + panelWidth - 20, 0);
      progressGradient.addColorStop(0, '#00ffff');
      progressGradient.addColorStop(1, '#00aaff');
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(panelX + 20, effectY + 40, panelWidth - 40, 6);
      ctx.fillStyle = progressGradient;
      ctx.fillRect(panelX + 20, effectY + 40, (panelWidth - 40) * laserProgress, 6);
      
      const remainingTime = Math.max(0, Math.floor((laserEndTimeRef.current - now) / 1000));
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${remainingTime}s`, panelX + panelWidth - 60, effectY + 35);
      
      effectY += effectHeight;
    }
    
    ctx.restore();
  }, [difficulty, getGameTime, scoreRef, livesRef, levelRef, enemiesRef, bonusEffectsRef, isLaserActiveRef, laserEndTimeRef]);
  
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const now = Date.now();
    
    if (hitStopRef.current.active) {
      const elapsed = now - hitStopRef.current.startTime;
      if (elapsed < hitStopRef.current.duration) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      } else {
        hitStopRef.current.active = false;
      }
    }
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (cameraShakeRef.current.active) {
      const elapsed = now - cameraShakeRef.current.startTime;
      if (elapsed < cameraShakeRef.current.duration) {
        const progress = 1 - (elapsed / cameraShakeRef.current.duration);
        const intensity = cameraShakeRef.current.intensity * progress;
        ctx.save();
        ctx.translate(Math.random() * intensity * 2 - intensity, Math.random() * intensity * 2 - intensity);
      }
    }
    
    clearGrid();
    enemiesRef.current.forEach(enemy => addToGrid(enemy, 'enemy'));
    bulletsRef.current.forEach(bullet => addToGrid(bullet, 'bullet'));
    enemyBulletsRef.current.forEach(bullet => addToGrid(bullet, 'enemyBullet'));
    powerUpsRef.current.forEach(powerUp => addToGrid(powerUp, 'powerUp'));
    
    starsRef.current.forEach(star => { star.update(); star.draw(ctx); });
    
    let bulletCooldown = bonusEffectsRef.current.rapidFire ? config.bulletCooldown / 2 : config.bulletCooldown;
    switch(levelRef.current) {
      case 2: bulletCooldown *= 0.8; break;
      case 3: bulletCooldown *= 0.6; break;
      case 4: bulletCooldown *= 0.3; break;
    }
    
    if (now - lastBulletTimeRef.current > bulletCooldown) {
      lastBulletTimeRef.current = now;
      const player = playerRef.current;
      const hasRapidFire = bonusEffectsRef.current.rapidFire;
      const positions = levelRef.current === 1 ? [player.x] : levelRef.current === 2 ? [player.x - player.size * 0.8, player.x + player.size * 0.8] : [player.x - player.size, player.x, player.x + player.size];
      
      positions.forEach(posX => {
        const count = hasRapidFire ? 3 : 1;
        for (let i = 0; i < count; i++) {
          const angle = levelRef.current === 1 ? -Math.PI / 2 + (i - 1) * Math.PI / 4 : -Math.PI / 2 + (i - 0.5) * Math.PI / 4;
          const bullet = new Bullet(posX, player.y - player.size, config.bulletSpeed * (hasRapidFire ? 1.5 : 1), levelRef.current);
          bullet.size = hasRapidFire ? 6 + levelRef.current : 4 + levelRef.current;
          bullet.damage = hasRapidFire ? 2 + levelRef.current : 1;
          if (hasRapidFire) bullet.vx = Math.cos(angle) * 2;
          bulletsRef.current.push(bullet);
        }
      });
    }
    
    if (!bossRef.current && scoreRef.current - lastBossSpawnScoreRef.current >= GAME_CONFIG.BOSS_SPAWN_THRESHOLD) {
      enemiesRef.current.forEach(enemy => { enemy.state = 'RETREATING'; enemy.speed *= 2; });
      bossRef.current = new Boss(canvas.width / 2, -100, difficulty);
      lastBossSpawnScoreRef.current = scoreRef.current;
    }
    
    if (!bossRef.current && now - lastEnemySpawnTimeRef.current > config.enemySpawnInterval) {
      lastEnemySpawnTimeRef.current = now;
      spawnEnemyFormation(canvas, enemiesRef);
    }
    
    playerRef.current.update(mousePosRef.current, canvas.width, canvas.height);
    bulletsRef.current = bulletsRef.current.filter(bullet => { bullet.update(); return !bullet.isOutOfBounds(canvas.height); });
    enemiesRef.current = enemiesRef.current.filter(enemy => { enemy.update(playerRef.current, canvas.width, canvas.height, difficulty, enemyBulletsRef); return !enemy.isOutOfBounds(canvas.width, canvas.height); });
    
    if (bossRef.current) {
      bossRef.current.update(playerRef.current, canvas.width, canvas.height, enemyBulletsRef, enemiesRef, config);
      if (!bossRef.current.isActive) {
        setLives(3);
        if (levelRef.current < 4) setLevel(4);
        setIsLaserActive(true);
        setLaserEndTime(Date.now() + 10000);
        spawnPowerUp(canvas.width / 2, canvas.height / 2, ['health', 'attack', 'invincible', 'upgrade']);
        bossRef.current = null;
      }
    }
    
    powerUpsRef.current.forEach(powerUp => powerUp.update(canvas.width, canvas.height));
    enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => { bullet.update(); return !bullet.isOutOfBounds(canvas.width, canvas.height); });
    
    const nearbyEnemies = getNearbyObjects(playerRef.current, ['enemy']);
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      if (nearbyEnemies.includes(enemy) && checkCollision(playerRef.current, enemy)) {
        return !handlePlayerCollision(enemy);
      }
      return true;
    });
    
    if (bossRef.current && checkCollision(playerRef.current, bossRef.current)) {
      const currentEffects = bonusEffectsRef.current;
      if (!currentEffects.invulnerable) {
        if (difficulty === 'nightmare') {
          setLives(0);
          setGameState('gameover');
        } else {
          setLives(prev => { const newLives = prev - 1; if (newLives <= 0) setGameState('gameover'); return newLives; });
        }
      }
    }
    
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      let isActive = true;
      const nearbyEnemies = getNearbyObjects(bullet, ['enemy']);
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        if (nearbyEnemies.includes(enemy) && checkCollision(bullet, enemy)) {
          isActive = false;
          return !handleBulletCollision(bullet, enemy);
        }
        return true;
      });
      if (bossRef.current && checkCollision(bullet, bossRef.current)) {
        isActive = false;
        handleBossCollision(bullet);
      }
      return isActive;
    });
    
    const nearbyPowerUps = getNearbyObjects(playerRef.current, ['powerUp']);
    powerUpsRef.current = powerUpsRef.current.filter(powerUp => {
      if (nearbyPowerUps.includes(powerUp) && checkCollision(playerRef.current, powerUp)) {
        applyPowerUp(powerUp.type);
        return false;
      }
      return true;
    });
    
    const nearbyEnemyBullets = getNearbyObjects(playerRef.current, ['enemyBullet']);
    enemyBulletsRef.current = enemyBulletsRef.current.filter(bullet => {
      if (nearbyEnemyBullets.includes(bullet) && checkCollision(playerRef.current, bullet)) {
        const currentEffects = bonusEffectsRef.current;
        if (!currentEffects.invulnerable) {
          if (difficulty === 'nightmare') {
            setLives(0);
            setGameState('gameover');
          } else {
            setLives(prev => { const newLives = prev - 1; if (newLives <= 0) setGameState('gameover'); return newLives; });
          }
        }
        return false;
      }
      return true;
    });
    
    playerRef.current.draw(ctx);
    bulletsRef.current.forEach(bullet => bullet.draw(ctx));
    enemiesRef.current.forEach(enemy => enemy.draw(ctx));
    powerUpsRef.current.forEach(powerUp => powerUp.draw(ctx));
    enemyBulletsRef.current.forEach(bullet => bullet.draw(ctx));
    
    if (bossRef.current) {
      bossRef.current.drawHealthBar(ctx, canvas.width);
      bossRef.current.draw(ctx, canvas.width);
    }
    
    particlesRef.current = particlesRef.current.filter(particle => { particle.update(); particle.draw(ctx); return particle.isAlive(); });
    
    if (isLaserActiveRef.current) {
      drawLaserEffect(ctx, playerRef.current, now);
      
      const laserWidth = playerRef.current.size;
      const laserRect = { x: playerRef.current.x - laserWidth / 2, y: -playerRef.current.size, width: laserWidth, height: playerRef.current.y + playerRef.current.size };
      
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        const closestX = Math.max(laserRect.x, Math.min(enemy.x, laserRect.x + laserRect.width));
        const closestY = Math.max(laserRect.y, Math.min(enemy.y, laserRect.y + laserRect.height));
        const dx = enemy.x - closestX;
        const dy = enemy.y - closestY;
        if (dx * dx + dy * dy < enemy.size * enemy.size) {
          for (let i = 0; i < 10; i++) particlesRef.current.push(new Particle(enemy.x, enemy.y, 'laser'));
          setScore(prevScore => prevScore + enemy.score);
          return false;
        }
        return true;
      });
      
      if (bossRef.current) {
        const closestX = Math.max(laserRect.x, Math.min(bossRef.current.x, laserRect.x + laserRect.width));
        const closestY = Math.max(laserRect.y, Math.min(bossRef.current.y, laserRect.y + laserRect.height));
        const dx = bossRef.current.x - closestX;
        const dy = bossRef.current.y - closestY;
        if (dx * dx + dy * dy < bossRef.current.size * bossRef.current.size) {
          const hit = bossRef.current.takeDamage(0.5);
          if (hit && Math.random() > 0.7) {
            hitStopRef.current = { active: true, startTime: Date.now(), duration: 15 };
            cameraShakeRef.current = { active: true, startTime: Date.now(), duration: 100, intensity: 2 };
            for (let i = 0; i < 15; i++) particlesRef.current.push(new Particle(bossRef.current.x, bossRef.current.y, 'laser'));
          }
        }
      }
    }
    
    if (enemyBulletsRef.current.length > GAME_CONFIG.MAX_ENEMY_BULLETS) {
      enemyBulletsRef.current = enemyBulletsRef.current.slice(-GAME_CONFIG.MAX_ENEMY_BULLETS);
    }
    
    updateBonusEffects(now);
    checkLaserExpiration(now);
    drawStatusBar(ctx, now);
    
    if (cameraShakeRef.current.active) {
      ctx.restore();
      const elapsed = now - cameraShakeRef.current.startTime;
      if (elapsed >= cameraShakeRef.current.duration) {
        cameraShakeRef.current.active = false;
      }
    }
    
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, [difficulty, config, levelRef, bonusEffectsRef, isLaserActiveRef, laserEndTimeRef, spawnEnemyFormation, clearGrid, addToGrid, getNearbyObjects, checkCollision, handlePlayerCollision, handleBulletCollision, handleBossCollision, drawLaserEffect, updateBonusEffects, checkLaserExpiration, drawStatusBar, setLives, setLevel, setIsLaserActive, setLaserEndTime, setScore, applyPowerUp, spawnPowerUp, gameState]);
  
  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
    
    initGrid(canvas);
    
    starsRef.current = [];
    for (let i = 0; i < GAME_CONFIG.STARS_COUNT; i++) {
      starsRef.current.push(new Star(Math.random() * canvas.width, Math.random() * canvas.height, canvas.width, canvas.height));
    }
    
    particlesRef.current = [];
    playerRef.current = new Player(canvas.width / 2, canvas.height - 50, config.playerSpeed);
    
    resetGame();
    
    bulletsRef.current = [];
    enemyBulletsRef.current = [];
    enemiesRef.current = [];
    powerUpsRef.current = [];
    bossRef.current = null;
    
    lastEnemySpawnTimeRef.current = Date.now() - config.enemySpawnInterval;
    spawnEnemyFormation(canvas, enemiesRef);
    
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [config, initGrid, resetGame, spawnEnemyFormation, gameLoop]);
  
  useEffect(() => {
    return () => stopGame();
  }, [stopGame]);
  
  useEffect(() => {
    if (gameState === 'playing') {
      initGame();
    } else {
      stopGame();
    }
  }, [gameState, initGame, stopGame]);
  
  return (
    <div className="plane-game" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>🚀 小飞机游戏</Title>
        <Text type="secondary">鼠标控制飞机，自动发射子弹，消灭敌人获得分数</Text>
      </div>
      
      <Card style={{ maxWidth: '90vw', maxHeight: '80vh', margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          height: '0', 
          paddingBottom: '75%',
          minHeight: '450px'
        }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              border: '2px solid #1890ff',
              borderRadius: '8px',
              cursor: 'crosshair',
              backgroundColor: '#0a0a1a',
              width: '100%',
              height: '100%',
              boxSizing: 'border-box'
            }}
            width={800}
            height={600}
          />
          
          <GameUI
            gameState={gameState}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            setGameState={setGameState}
            spawnEnemy={spawnEnemy}
            getGameConfig={getGameConfig}
            enemiesRef={enemiesRef}
            score={score}
          />
        </div>
      </Card>
    </div>
  );
};

export default PlaneGame;
