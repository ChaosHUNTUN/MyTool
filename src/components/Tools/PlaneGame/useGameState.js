import { useState, useEffect, useRef, useCallback } from 'react';
import { getDifficultyConfig } from './constants';

export const useGameState = (difficulty = 'easy') => {
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [laserEndTime, setLaserEndTime] = useState(0);
  const [bonusEffects, setBonusEffects] = useState({
    rapidFire: false,
    invulnerable: false,
    rapidFireEndTime: 0,
    invulnerableEndTime: 0
  });

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
  const gameStartTimeRef = useRef(Date.now());
  const lastBossSpawnScoreRef = useRef(0);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { levelRef.current = level; }, [level]);
  useEffect(() => { isLaserActiveRef.current = isLaserActive; }, [isLaserActive]);
  useEffect(() => { laserEndTimeRef.current = laserEndTime; }, [laserEndTime]);
  useEffect(() => { bonusEffectsRef.current = bonusEffects; }, [bonusEffects]);

  const applyPowerUp = useCallback((type) => {
    const now = Date.now();
    
    switch(type) {
      case 'health':
        setLives(3);
        break;
        
      case 'attack':
        setBonusEffects(prev => ({
          ...prev,
          rapidFire: true,
          rapidFireEndTime: now + 20000
        }));
        break;
        
      case 'invincible':
        setBonusEffects(prev => ({
          ...prev,
          invulnerable: true,
          invulnerableEndTime: now + 20000
        }));
        break;
        
      case 'upgrade':
        const currentLevel = levelRef.current;
        if (currentLevel < 4) {
          const newLevel = currentLevel + 1;
          setLevel(newLevel);
          
          if (newLevel === 4) {
            setIsLaserActive(true);
            setLaserEndTime(now + 10000);
          }
        } else {
          setLaserEndTime(now + 10000);
        }
        break;
        
      default:
        break;
    }
  }, [setLives, setLevel, setIsLaserActive, setLaserEndTime, setBonusEffects]);

  const updateBonusEffects = useCallback((now) => {
    setBonusEffects(prev => {
      const updatedEffects = { ...prev };
      let effectChanged = false;
      
      if (prev.rapidFire && now > prev.rapidFireEndTime) {
        updatedEffects.rapidFire = false;
        effectChanged = true;
      }
      
      if (prev.invulnerable && now > prev.invulnerableEndTime) {
        updatedEffects.invulnerable = false;
        effectChanged = true;
      }
      
      return effectChanged ? updatedEffects : prev;
    });
  }, [setBonusEffects]);

  const checkLaserExpiration = useCallback((now) => {
    if (isLaserActiveRef.current && now > laserEndTimeRef.current) {
      setIsLaserActive(false);
      setLevel(3);
    }
  }, [setIsLaserActive, setLevel]);

  const resetGame = useCallback(() => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setIsLaserActive(false);
    setLaserEndTime(0);
    setBonusEffects({
      rapidFire: false,
      invulnerable: false,
      rapidFireEndTime: 0,
      invulnerableEndTime: 0
    });
    
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
    lastBossSpawnScoreRef.current = 0;
    gameStartTimeRef.current = Date.now();
  }, [setGameState, setScore, setLives, setLevel, setIsLaserActive, setLaserEndTime, setBonusEffects]);

  const getGameTime = useCallback(() => {
    return Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
  }, []);

  const getConfig = useCallback(() => getDifficultyConfig(difficulty), [difficulty]);

  return {
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
  };
};

export default useGameState;
