import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// JSON格式化工具组件
export default function JsonFormatter() {
  const [jsonInput, setJsonInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');

  // JSON格式化功能
  const formatJson = () => {
    if (!jsonInput.trim()) {
      message.warning('请输入JSON数据');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonOutput(formatted);
      message.success('格式化成功');
    } catch (error) {
      message.error('格式化失败：' + error.message);
    }
  };

  // JSON压缩功能
  const minifyJson = () => {
    if (!jsonInput.trim()) {
      message.warning('请输入JSON数据');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonOutput(minified);
      message.success('压缩成功');
    } catch (error) {
      message.error('压缩失败：' + error.message);
    }
  };

  // 复制结果到剪贴板
  const copyToClipboard = () => {
    if (!jsonOutput) {
      message.warning('没有可复制的内容');
      return;
    }
    navigator.clipboard.writeText(jsonOutput).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h2 style={{ marginBottom: 24 }}>JSON格式化</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入JSON数据：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="粘贴JSON数据..."
              rows={15}
              style={{ flex: 1, minHeight: 300, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 80 }}>
              <Button type="primary" onClick={formatJson}>
                格式化
              </Button>
              <Button type="primary" onClick={minifyJson}>
                压缩
              </Button>
            </div>
          </div>
        </div>
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>处理结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={jsonOutput}
              readOnly
              placeholder="处理结果将显示在这里..."
              rows={15}
              style={{ flex: 1, minHeight: 300, boxSizing: 'border-box' }}
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