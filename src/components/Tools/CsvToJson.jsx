import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// CSV转JSON工具组件
export default function CsvToJson() {
  const [csvInput, setCsvInput] = useState('');
  const [jsonOutput, setJsonOutput] = useState('');

  // CSV转JSON核心功能
  const convertCsvToJson = () => {
    if (!csvInput.trim()) {
      message.warning('请输入CSV数据');
      return;
    }

    try {
      const lines = csvInput.trim().split('\n');
      const headers = lines[0].split(',').map(header => header.trim());
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(value => value.trim());
        if (values.length === headers.length) {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          result.push(obj);
        }
      }

      setJsonOutput(JSON.stringify(result, null, 2));
      message.success('转换成功');
    } catch (error) {
      message.error('转换失败：' + error.message);
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
      <h2 style={{ marginBottom: 24 }}>CSV转JSON</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入CSV数据：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="粘贴CSV数据..."
              rows={15}
              style={{ flex: 1, minHeight: 300, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button type="primary" onClick={convertCsvToJson}>
                转换
              </Button>
            </div>
          </div>
        </div>
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>JSON输出：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={jsonOutput}
              readOnly
              placeholder="转换结果将显示在这里..."
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