import React from 'react';
import { Typography, Button, Space } from 'antd';

const { Title, Text } = Typography;

export const GameUI = ({ 
  gameState, 
  difficulty, 
  setDifficulty, 
  setGameState,
  spawnEnemy,
  getGameConfig,
  enemiesRef,
  score
}) => {
  const getDifficultyLabel = (diff) => {
    switch(diff) {
      case 'easy': return '简单';
      case 'hard': return '困难';
      case 'nightmare': return '噩梦';
      default: return diff;
    }
  };

  const getEnemyHealth = (type, diff) => {
    const config = getGameConfig();
    const health = config.enemyTypes[type]?.health || 1;
    return health;
  };

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>选择难度</Title>
        <Space size="large">
          <Button 
            type={difficulty === 'easy' ? 'primary' : 'default'}
            size="large"
            onClick={() => setDifficulty('easy')}
          >
            简单
          </Button>
          <Button 
            type={difficulty === 'hard' ? 'primary' : 'default'}
            size="large"
            onClick={() => setDifficulty('hard')}
          >
            困难
          </Button>
          <Button 
            type={difficulty === 'nightmare' ? 'primary' : 'default'}
            size="large"
            danger
            onClick={() => setDifficulty('nightmare')}
          >
            噩梦
          </Button>
        </Space>
      </div>
      
      <div style={{ marginBottom: '24px' }}>
        <Button 
          type="primary" 
          size="large"
          onClick={() => {
            spawnEnemy(getGameConfig());
          }}
        >
          手动生成敌人
        </Button>
      </div>
      
      {gameState === 'start' || gameState === 'gameover' ? (
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
          
          <div style={{ marginTop: '30px', textAlign: 'left', maxWidth: '90%', width: '100%' }}>
            <Title level={5} style={{ color: '#00d4ff', marginBottom: '20px', textShadow: '0 0 15px rgba(0, 212, 255, 0.5)', fontSize: '20px' }}>
              游戏规则
            </Title>
            <div style={{ 
              background: 'rgba(30, 30, 50, 0.9)', 
              borderRadius: '10px', 
              padding: '24px',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)'
            }}>
              <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <span style={{ color: '#00d4ff', marginRight: '12px', fontSize: '18px' }}>▶</span>
                <span style={{ color: '#ffffff', fontSize: '16px' }}>鼠标控制飞机移动，自动发射子弹</span>
              </div>
              <div style={{ marginBottom: '16px', lineHeight: '1.6' }}>
                <span style={{ color: '#00ff88', marginRight: '12px', fontSize: '18px' }}>▶</span>
                <span style={{ color: '#ffffff', fontSize: '16px' }}>每1000分刷新一个Boss，击败Boss获得所有升级</span>
              </div>
              <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                <span style={{ color: '#ffaa44', marginRight: '12px', fontSize: '18px' }}>▶</span>
                <span style={{ color: '#ffffff', fontSize: '16px' }}>敌人信息（简单/困难/噩梦）：</span>
              </div>
              <div style={{ paddingLeft: '32px', marginBottom: '20px', lineHeight: '1.8' }}>
                <div style={{ color: '#ff6b6b', marginBottom: '8px', fontSize: '15px' }}>
                  • 小型敌人：1分，{difficulty === 'easy' ? '1' : difficulty === 'hard' ? '2' : '3'}滴血
                </div>
                <div style={{ color: '#ffff00', marginBottom: '8px', fontSize: '15px' }}>
                  • 中型敌人：5分，{difficulty === 'easy' ? '3' : difficulty === 'hard' ? '4' : '5'}滴血
                </div>
                <div style={{ color: '#00ff88', fontSize: '15px' }}>
                  • 重型敌人：20分，{difficulty === 'easy' ? '10' : difficulty === 'hard' ? '12' : '15'}滴血
                </div>
              </div>
              <div style={{ 
                marginTop: '24px', 
                padding: '16px', 
                background: 'rgba(255, 68, 68, 0.25)', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 68, 68, 0.6)',
                boxShadow: '0 0 15px rgba(255, 68, 68, 0.2)'
              }}>
                <span style={{ color: '#ff4444', fontSize: '16px', lineHeight: '1.6' }}>
                  ⚠ 注意：被敌人或子弹命中{difficulty === 'nightmare' ? '直接死亡（噩梦难度）' : '3次游戏结束'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default GameUI;
