import { useRef, useCallback, useMemo } from 'react';
import { Enemy } from './enemy';
import { getDifficultyConfig } from './constants';

export const useGameLogic = (difficulty) => {
  const config = useMemo(() => getDifficultyConfig(difficulty), [difficulty]);
  
  const gridRef = useRef({
    cells: {},
    cellSize: 50,
    width: 0,
    height: 0
  });

  const getGridKey = useCallback((x, y) => {
    const grid = gridRef.current;
    const cellX = Math.floor(x / grid.cellSize);
    const cellY = Math.floor(y / grid.cellSize);
    return `${cellX},${cellY}`;
  }, []);

  const clearGrid = useCallback(() => {
    gridRef.current.cells = {};
  }, []);

  const addToGrid = useCallback((obj, type) => {
    if (!obj || !obj.x || !obj.y) return;
    
    const key = getGridKey(obj.x, obj.y);
    if (!gridRef.current.cells[key]) {
      gridRef.current.cells[key] = [];
    }
    gridRef.current.cells[key].push({ obj, type });
  }, [getGridKey]);

  const getNearbyObjects = useCallback((obj, types) => {
    const nearby = [];
    const grid = gridRef.current;
    const cellX = Math.floor(obj.x / grid.cellSize);
    const cellY = Math.floor(obj.y / grid.cellSize);
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        if (grid.cells[key]) {
          grid.cells[key].forEach(item => {
            if (types.includes(item.type)) {
              nearby.push(item.obj);
            }
          });
        }
      }
    }
    
    return nearby;
  }, []);

  const checkCollision = useCallback((obj1, obj2) => {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (obj1.size + obj2.size);
  }, []);

  const spawnEnemyFormation = useCallback((canvas, enemiesRef) => {
    if (!canvas) return;
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const formationTypes = ['v', 'line', 'curve', 'diagonal'];
    const formation = formationTypes[Math.floor(Math.random() * formationTypes.length)];
    const enemyTypes = ['small', 'medium', 'heavy'];
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const startX = Math.random() * (canvasWidth - 200) + 100;
    const startY = -50;
    const spacing = 30;
    
    let enemiesToSpawn = [];
    
    switch(formation) {
      case 'v':
        const vSize = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < vSize; i++) {
          const offset = (i - Math.floor(vSize / 2)) * spacing;
          const x = startX + offset;
          const y = startY + Math.abs(offset);
          enemiesToSpawn.push({ x, y, type, trajectory: { type: 'straight', direction: { x: 0, y: 1 }, startTime: Date.now() } });
        }
        break;
        
      case 'line':
        const lineSize = Math.floor(Math.random() * 4) + 2;
        for (let i = 0; i < lineSize; i++) {
          enemiesToSpawn.push({ x: startX + i * spacing, y: startY, type, trajectory: { type: 'straight', direction: { x: 0, y: 1 }, startTime: Date.now() } });
        }
        break;
        
      case 'curve':
        const curveSize = Math.floor(Math.random() * 3) + 3;
        for (let i = 0; i < curveSize; i++) {
          enemiesToSpawn.push({ x: startX + i * spacing, y: startY, type, trajectory: { type: 'curve', direction: { x: 0, y: 1 }, curveFactor: 2, startTime: Date.now() } });
        }
        break;
        
      case 'diagonal':
        const diagonalSize = Math.floor(Math.random() * 3) + 3;
        const directionX = Math.random() > 0.5 ? 1 : -1;
        for (let i = 0; i < diagonalSize; i++) {
          enemiesToSpawn.push({ x: startX + i * spacing * directionX, y: startY + i * spacing, type, trajectory: { type: 'diagonal', direction: { x: directionX * 0.3, y: 1 }, startTime: Date.now() } });
        }
        break;
        
      default:
        enemiesToSpawn.push({ x: startX, y: startY, type, trajectory: { type: 'straight', direction: { x: 0, y: 1 }, startTime: Date.now() } });
    }
    
    enemiesToSpawn.forEach(enemyData => {
      const enemyConfig = config.enemyTypes[enemyData.type];
      if (enemyConfig) {
        const newEnemy = new Enemy(enemyData.x, enemyData.y, enemyData.type, enemyData.trajectory, enemyConfig);
        enemiesRef.current.push(newEnemy);
      }
    });
  }, [config]);

  const initGrid = useCallback((canvas) => {
    if (!canvas) return;
    gridRef.current = {
      cells: {},
      cellSize: 50,
      width: canvas.width,
      height: canvas.height
    };
  }, []);

  const getConfig = useCallback(() => config, [config]);

  return {
    config,
    gridRef,
    getGridKey,
    clearGrid,
    addToGrid,
    getNearbyObjects,
    checkCollision,
    spawnEnemyFormation,
    initGrid,
    getConfig
  };
};

export default useGameLogic;
