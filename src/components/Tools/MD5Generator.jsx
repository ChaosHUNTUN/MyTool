import React, { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// MD5哈希生成工具组件
export default function MD5Generator() {
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState('');

  // 使用Web Crypto API生成MD5哈希
  const generateMD5 = async () => {
    if (!textInput.trim()) {
      message.warning('请输入要生成MD5的文本');
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(textInput.trim());
      
      // 使用Crypto API生成哈希
      const hashBuffer = await crypto.subtle.digest('MD5', data);
      
      // 将ArrayBuffer转换为十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
      
      setResult(hashHex);
      message.success('MD5哈希生成成功');
    } catch (error) {
      message.error('MD5生成失败：' + error.message);
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
      <h2 style={{ marginBottom: 24 }}>MD5哈希生成</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入文本：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="输入要生成MD5哈希的文本..."
              rows={10}
              style={{ flex: 1, minHeight: 200, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button type="primary" onClick={generateMD5}>
                生成MD5
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>MD5哈希结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={result}
              readOnly
              placeholder="MD5哈希结果将显示在这里..."
              rows={4}
              style={{ flex: 1, minHeight: 80, boxSizing: 'border-box' }}
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