import React, { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// 时间戳转换工具组件
export default function TimestampConverter() {
  const [timestampInput, setTimestampInput] = useState('');
  const [datetimeInput, setDatetimeInput] = useState('');
  const [result, setResult] = useState('');

  // 时间戳转日期时间
  const timestampToDatetime = () => {
    if (!timestampInput.trim()) {
      message.warning('请输入时间戳');
      return;
    }

    try {
      const timestamp = parseInt(timestampInput.trim());
      if (isNaN(timestamp)) {
        message.error('请输入有效的数字时间戳');
        return;
      }
      
      // 处理秒级时间戳（10位）和毫秒级时间戳（13位）
      const finalTimestamp = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
      const date = new Date(finalTimestamp);
      
      // 格式化日期时间
      const formatted = date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      
      setResult(formatted);
      setDatetimeInput(formatted);
      message.success('转换成功');
    } catch (error) {
      message.error('转换失败：' + error.message);
    }
  };

  // 日期时间转时间戳
  const datetimeToTimestamp = () => {
    if (!datetimeInput.trim()) {
      message.warning('请输入日期时间');
      return;
    }

    try {
      const date = new Date(datetimeInput.trim());
      if (isNaN(date.getTime())) {
        message.error('请输入有效的日期时间格式');
        return;
      }
      
      const timestamp = Math.floor(date.getTime() / 1000); // 秒级时间戳
      const timestampMs = date.getTime(); // 毫秒级时间戳
      
      setResult(`${timestamp} (秒级) / ${timestampMs} (毫秒级)`);
      setTimestampInput(timestamp.toString());
      message.success('转换成功');
    } catch (error) {
      message.error('转换失败：' + error.message);
    }
  };

  // 复制结果到剪贴板
  const copyToClipboard = () => {
    if (!result) {
      message.warning('没有可复制的内容');
      return;
    }
    navigator.clipboard.writeText(result).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h2 style={{ marginBottom: 24 }}>时间戳转换</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入时间戳：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              placeholder="输入秒级或毫秒级时间戳..."
              rows={6}
              style={{ flex: 1, minHeight: 120, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button type="primary" onClick={timestampToDatetime}>
                转日期
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入日期时间：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={datetimeInput}
              onChange={(e) => setDatetimeInput(e.target.value)}
              placeholder="输入日期时间，例如：2023-12-26 14:30:00..."
              rows={6}
              style={{ flex: 1, minHeight: 120, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button type="primary" onClick={datetimeToTimestamp}>
                转时间戳
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>转换结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={result}
              readOnly
              placeholder="转换结果将显示在这里..."
              rows={6}
              style={{ flex: 1, minHeight: 120, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button onClick={copyToClipboard}>
                复制结果
              </Button>
            </div>
          </div>
        </div>
      </Space>
    </div>
  );
}