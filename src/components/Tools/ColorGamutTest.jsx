import React, { useState } from 'react';
import { Button, Space, Tabs, Card } from 'antd';
const { TabPane } = Tabs;

// 显示器色域测试工具组件
export default function ColorGamutTest() {
  const [fullscreen, setFullscreen] = useState(false);

  // 切换全屏模式
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullscreen(false);
      }
    }
  };

  // 生成灰度色阶
  const generateGrayscaleSteps = () => {
    const steps = [];
    for (let i = 0; i <= 255; i += 17) {
      const value = i.toString(16).padStart(2, '0');
      steps.push(
        <div
          key={i}
          style={{
            flex: 1,
            height: 100,
            backgroundColor: `#${value}${value}${value}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: i < 128 ? '#ffffff' : '#000000',
            fontWeight: 500,
            fontSize: 12
          }}
        >
          {i}
        </div>
      );
    }
    return steps;
  };

  // 生成RGB纯色
  const rgbColors = [
    { name: '纯黑', color: '#000000' },
    { name: '纯白', color: '#ffffff' },
    { name: '纯红', color: '#ff0000' },
    { name: '纯绿', color: '#00ff00' },
    { name: '纯蓝', color: '#0000ff' },
    { name: '纯黄', color: '#ffff00' },
    { name: '纯青', color: '#00ffff' },
    { name: '纯紫', color: '#ff00ff' }
  ];

  // 生成彩色渐变
  const colorGradients = [
    { name: 'RGB渐变', style: { background: 'linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)' } },
    { name: 'CMYK渐变', style: { background: 'linear-gradient(90deg, #ff0000 0%, #ffff00 25%, #00ff00 50%, #00ffff 75%, #0000ff 100%)' } },
    { name: '灰度渐变', style: { background: 'linear-gradient(90deg, #000000 0%, #ffffff 100%)' } },
    { name: '红橙黄绿青蓝紫', style: { background: 'linear-gradient(90deg, #ff0000 0%, #ff7f00 14%, #ffff00 28%, #00ff00 42%, #00ffff 57%, #0000ff 71%, #8b00ff 100%)' } }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, boxSizing: 'border-box' }}>
        <h2>显示器色域测试</h2>
        <Button type="primary" onClick={toggleFullscreen}>
          {fullscreen ? '退出全屏' : '全屏测试'}
        </Button>
      </div>
      
      <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', boxSizing: 'border-box' }}>
        <Tabs defaultActiveKey="1" size="large">
          {/* 纯色测试 */}
          <TabPane tab="纯色测试" key="1">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: 20 }}>
              {rgbColors.map((color, index) => (
                <div
                  key={index}
                  style={{
                    height: 150,
                    backgroundColor: color.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color.name === '纯白' || color.name === '纯黄' || color.name === '纯青' ? '#000000' : '#ffffff',
                    fontWeight: 600,
                    fontSize: 18,
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {color.name}
                </div>
              ))}
            </div>
          </TabPane>

          {/* 渐变测试 */}
          <TabPane tab="渐变测试" key="2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20 }}>
              {colorGradients.map((gradient, index) => (
                <div key={index}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>{gradient.name}</div>
                  <div
                    style={{
                      ...gradient.style,
                      height: 100,
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              ))}
            </div>
          </TabPane>

          {/* 灰度色阶测试 */}
          <TabPane tab="灰度色阶" key="3">
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16, fontWeight: 500 }}>256级灰度色阶测试（从黑到白，共16个色阶）</div>
              <div style={{ display: 'flex', gap: 2, borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                {generateGrayscaleSteps()}
              </div>
              <div style={{ marginTop: 24, fontStyle: 'italic', color: '#666' }}>
                观察说明：正常显示器应能清晰区分所有灰度等级，没有明显的色带或色块现象。
              </div>
            </div>
          </TabPane>

          {/* 色彩还原测试 */}
          <TabPane tab="色彩还原" key="4">
            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 16, fontWeight: 500 }}>色彩还原测试图</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
                {[...Array(25)].map((_, index) => {
                  const hue = (index * 14.4) % 360;
                  const saturation = 70 + Math.sin(index) * 20;
                  const lightness = 50 + Math.cos(index) * 10;
                  return (
                    <div
                      key={index}
                      style={{
                        height: 100,
                        backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ marginTop: 24, fontStyle: 'italic', color: '#666' }}>
                观察说明：正常显示器应能显示丰富的色彩变化，色彩过渡自然，无明显偏色。
              </div>
            </div>
          </TabPane>

          {/* 对比度测试 */}
          <TabPane tab="对比度测试" key="5">
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ marginBottom: 16, fontWeight: 500 }}>黑白对比度测试</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div
                    style={{
                      height: 200,
                      backgroundColor: '#000000',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: 24,
                      fontWeight: 600
                    }}
                  >
                    黑
                  </div>
                  <div
                    style={{
                      height: 200,
                      backgroundColor: '#ffffff',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000000',
                      fontSize: 24,
                      fontWeight: 600
                    }}
                  >
                    白
                  </div>
                </div>
              </div>
              <div style={{ fontStyle: 'italic', color: '#666' }}>
                观察说明：正常显示器应能清晰显示黑色和白色的区别，黑色应足够黑，白色应足够白，无偏色现象。
              </div>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}