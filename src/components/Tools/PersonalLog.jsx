import React, { useState, useEffect, useRef } from 'react';
import { Input, List, Button, Card, Typography, Empty, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PersonalLog = () => {
  // 日志列表状态
  const [logs, setLogs] = useState([]);
  // 输入内容状态
  const [inputValue, setInputValue] = useState('');
  // 开始输入时间
  const startTimeRef = useRef(null);
  // 本地存储键名
  const STORAGE_KEY = 'personal_logs';

  // 从本地存储加载日志
  useEffect(() => {
    const loadLogs = () => {
      try {
        const storedLogs = localStorage.getItem(STORAGE_KEY);
        if (storedLogs) {
          setLogs(JSON.parse(storedLogs));
        }
      } catch (error) {
        console.error('Failed to load logs from localStorage:', error);
      }
    };

    loadLogs();
  }, []);

  // 保存日志到本地存储
  const saveLogs = (updatedLogs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save logs to localStorage:', error);
    }
  };

  // 处理输入变化，记录开始输入时间
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 记录开始输入时间
    if (value && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
  };

  // 添加日志
  const addLog = () => {
    if (!inputValue.trim()) return;

    const log = {
      id: Date.now(),
      content: inputValue.trim(),
      timestamp: startTimeRef.current || new Date(),
      createdAt: new Date().toISOString()
    };

    const updatedLogs = [...logs, log];
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
    
    // 重置状态
    setInputValue('');
    startTimeRef.current = null;
  };

  // 删除日志
  const deleteLog = (id) => {
    const updatedLogs = logs.filter(log => log.id !== id);
    setLogs(updatedLogs);
    saveLogs(updatedLogs);
  };

  // 处理键盘事件，支持Enter键添加日志（Shift+Enter换行）
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addLog();
    }
  };

  // 格式化时间显示
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="personal-log">
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>📝 个人日志</Title>
        <Text type="secondary">记录日常事项，自动保存到本地</Text>
      </div>

      <Card 
        title="添加新日志" 
        style={{ marginBottom: '24px' }}
        extra={<SaveOutlined />}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <TextArea
            placeholder="输入要记录的事项，例如：a找我借了三百块钱"
            value={inputValue}
            onChange={handleInputChange}
            onPressEnter={handleKeyPress}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ resize: 'vertical' }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addLog}
            disabled={!inputValue.trim()}
            block
          >
            添加日志
          </Button>
        </Space>
      </Card>

      <Card title="日志列表">
        {logs.length === 0 ? (
          <Empty description="暂无日志记录" />
        ) : (
          <List
            dataSource={logs}
            renderItem={(log) => (
              <List.Item
                actions={[
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />} 
                    onClick={() => deleteLog(log.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={(
                    <Space>
                      <Text strong>{log.content}</Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {formatTime(log.timestamp)}
                      </Text>
                    </Space>
                  )}
                  description={(
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      记录于：{formatTime(log.createdAt)}
                    </Text>
                  )}
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无日志记录' }}
          />
        )}
      </Card>

      {/* 未来接口集成预留区域 */}
      <div style={{ marginTop: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          💡 系统预留了接口集成空间，可通过配置接入后端API实现云端同步功能
        </Text>
      </div>
    </div>
  );
};

export default PersonalLog;