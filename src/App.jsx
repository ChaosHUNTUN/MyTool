import React, { useState } from 'react';
import logoImage from './img/个人logo原大图.png';
import bgImage from './img/bg.jpeg';
import { Menu, Card, Button, theme, Typography } from 'antd';
import CsvToJson from './components/Tools/CsvToJson';
import TextConverter from './components/Tools/TextConverter';
import JsonFormatter from './components/Tools/JsonFormatter';
import TimestampConverter from './components/Tools/TimestampConverter';
import UrlEncoderDecoder from './components/Tools/UrlEncoderDecoder';
import IpValidator from './components/Tools/IpValidator';
import MD5Generator from './components/Tools/MD5Generator';
import ColorGamutTest from './components/Tools/ColorGamutTest';
import PersonalLog from './components/Tools/PersonalLog';
import PlaneGame from './components/Tools/PlaneGame';
import WelcomePage from './components/WelcomePage';
import ParticleEffect from './components/ParticleEffect';
import './App.css';

const { Title, Text } = Typography;

// 工具配置列表
const tools = [
  { key: 'csv-json', label: '表格处理', component: <CsvToJson /> },
  { key: 'text-convert', label: '字符转换', component: <TextConverter /> },
  { key: 'json-formatter', label: '数据查询', component: <JsonFormatter /> },
  { key: 'timestamp-converter', label: '时间戳转换', component: <TimestampConverter /> },
  { key: 'url-encoder-decoder', label: 'URL编码解码', component: <UrlEncoderDecoder /> },
  { key: 'ip-validator', label: 'IP地址验证', component: <IpValidator /> },
  { key: 'md5-generator', label: 'MD5哈希生成', component: <MD5Generator /> },
  { key: 'color-gamut-test', label: '色域测试', component: <ColorGamutTest /> },
  { key: 'personal-log', label: '个人日志', component: <PersonalLog /> },
  { key: 'plane-game', label: '小飞机游戏', component: <PlaneGame /> },
];

function App() {
  // 当前选中的工具
  const [selectedTool, setSelectedTool] = useState('csv-json');
  
  // 获取当前主题配置
  const { token } = theme.useToken();

  // 日间/夜间模式状态管理
  const [isDarkMode, setIsDarkMode] = useState(false);
  // 当前时间状态
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  // 欢迎页面显示状态
  const [showWelcome, setShowWelcome] = useState(true);

  // 初始化定时器，每秒更新时间
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 切换日间/夜间模式
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 根据主题模式设置样式
  const appStyle = {
    minHeight: '100vh',
    background: `url(${bgImage}) center/cover no-repeat fixed`,
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    margin: 0,
    padding: 0,
    color: isDarkMode ? '#ffffff' : '#333333',
    boxSizing: 'border-box',
    position: 'relative',
  };

  const headerStyle = {
    padding: '0 24px',
    background: isDarkMode ? 'rgba(31, 31, 31, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  };

  const sidebarStyle = {
    width: 200,
    background: isDarkMode ? 'rgba(31, 31, 31, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  };

  const logoStyle = {
    padding: '16px',
    textAlign: 'center',
    borderBottom: `1px solid ${isDarkMode ? '#333333' : '#f0f0f0'}`,
  };

  const footerStyle = {
    padding: '16px',
    textAlign: 'center',
    color: isDarkMode ? '#999999' : '#999999',
    fontSize: '12px',
    background: isDarkMode ? 'rgba(31, 31, 31, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    borderTop: `1px solid ${isDarkMode ? '#333333' : '#f0f0f0'}`,
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  };

  const contentStyle = {
    flex: 1,
    padding: 24,
    overflow: 'auto',
    background: isDarkMode ? 'rgba(20, 20, 20, 0.85)' : 'rgba(240, 242, 245, 0.85)',
    boxSizing: 'border-box',
    backdropFilter: 'blur(8px)',
  };

  return (
    <div style={appStyle} className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      {/* 粒子效果组件 - 全局显示 */}
      <ParticleEffect isDarkMode={isDarkMode} />
      
      {/* 左侧导航 */}
      <div style={sidebarStyle}>
        {/* Logo区域 */}
        <div style={{
          ...logoStyle,
          padding: '16px',
          borderBottom: `1px solid ${isDarkMode ? '#333333' : '#f0f0f0'}`,
          background: isDarkMode ? 'rgba(31, 31, 31, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          borderRadius: '0 0 12px 12px',
          margin: '0 8px 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}>
            <img 
              src={logoImage} 
              alt="个人logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
              }}
            />
          </div>
          <Title level={4} style={{ 
            margin: '0 0 4px 0', 
            color: '#1890ff',
            fontSize: '18px',
            fontWeight: 600,
            background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🔧 工具箱
          </Title>
          <Text style={{ 
            fontSize: '12px',
            color: isDarkMode ? '#999999' : '#666666',
            fontWeight: 500
          }}>
            实用工具集合
          </Text>
        </div>
        
        {/* 菜单区域 */}
        <Menu
          mode="inline"
          selectedKeys={[showWelcome ? '' : selectedTool]}
          style={{
            flex: 1,
            borderRight: 0,
            background: 'transparent',
            padding: '8px 0',
            borderRadius: '12px',
          }}
          onSelect={({ key }) => {
            setSelectedTool(key);
            setShowWelcome(false);
          }}
          items={tools.map(tool => ({
            key: tool.key,
            label: tool.label,
            style: {
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '8px',
              margin: '4px 8px',
              padding: '12px 16px',
              transition: 'all 0.3s ease',
            },
          }))}
        />
      </div>
      
      {/* 右侧主内容 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        {/* 顶部标题栏 */}
        <div style={headerStyle}>
          <Title level={3} style={{ 
            margin: 0, 
            color: '#1890ff',
            fontWeight: 600,
            fontSize: '20px',
            background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {tools.find(t => t.key === selectedTool)?.label}
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* 时间显示组件 */}
            <div className="time-display" style={{ 
              fontSize: '14px', 
              color: isDarkMode ? '#cccccc' : '#666666',
              fontWeight: 500
            }}>
              {currentTime}
            </div>
            {/* 日间/夜间模式切换按钮 - 自定义开关 */}
            <div 
              className="theme-switch"
              onClick={toggleDarkMode}
              style={{
                position: 'relative',
                width: '80px',
                height: '32px',
                background: isDarkMode ? '#40a9ff' : '#d9d9d9',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  left: isDarkMode ? '52px' : '4px',
                  width: '24px',
                  height: '24px',
                  background: '#ffffff',
                  borderRadius: '50%',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </div>
              <div 
                style={{
                  position: 'absolute',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '10px',
                  fontWeight: 500,
                  color: '#ffffff',
                }}
              >
                {isDarkMode ? '日' : '夜'}
              </div>
            </div>
          </div>
        </div>
        
        {/* 主内容区域 */}
        <div style={contentStyle}>
          <Card
            style={{
              borderRadius: token.borderRadiusLG,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: isDarkMode ? '#1f1f1f' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#333333',
              border: `1px solid ${isDarkMode ? '#333333' : '#f0f0f0'}`,
              minHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 渲染当前选中的工具组件或欢迎页面 */}
            {showWelcome ? (
              <WelcomePage onEnter={() => setShowWelcome(false)} />
            ) : (
              tools.find(t => t.key === selectedTool)?.component
            )}
          </Card>
        </div>
        
        {/* 页脚 */}
        <div style={footerStyle}>
          <Text style={{ color: isDarkMode ? '#999999' : '#999999' }}>工具箱 ©{new Date().getFullYear()} | 支持扩展</Text>
        </div>
      </div>
    </div>
  );
}

export default App;