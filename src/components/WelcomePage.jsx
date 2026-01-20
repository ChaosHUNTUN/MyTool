import React from 'react';
import { Button, Typography } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import './WelcomePage.css';

const { Title, Paragraph, Text } = Typography;

const WelcomePage = ({ onEnter }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-animation">
          <div className="floating-icon">
            <ToolOutlined style={{ fontSize: '80px', color: '#1890ff' }} />
          </div>
          <Title level={1} className="welcome-title">
            🔧 欢迎使用工具箱
          </Title>
          <Paragraph className="welcome-subtitle">
            您身边的实用工具集合
          </Paragraph>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <Text strong>表格处理</Text>
            <Paragraph>CSV转JSON，数据格式化</Paragraph>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔤</div>
            <Text strong>字符转换</Text>
            <Paragraph>大小写转换，Base64编码</Paragraph>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <Text strong>时间戳转换</Text>
            <Paragraph>秒级/毫秒级时间转换</Paragraph>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <Text strong>加密工具</Text>
            <Paragraph>MD5哈希生成</Paragraph>
          </div>
        </div>
        
        <div className="welcome-action">
          <Button 
            type="primary" 
            size="large"
            onClick={onEnter}
            className="enter-button"
          >
            进入工具箱
          </Button>
        </div>
        
        <div className="welcome-footer">
          <Text type="secondary">
            💡 点击上方按钮开始使用，或从左侧菜单选择工具
          </Text>
        </div>
      </div>
      
      {/* 背景动态效果 */}
      <div className="background-animation">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="floating-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default WelcomePage;