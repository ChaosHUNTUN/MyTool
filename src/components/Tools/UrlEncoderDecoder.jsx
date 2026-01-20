import React, { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// URL编码/解码工具组件
export default function UrlEncoderDecoder() {
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState('');

  // URL编码
  const encodeUrl = () => {
    if (!urlInput.trim()) {
      message.warning('请输入要编码的URL或文本');
      return;
    }

    try {
      const encoded = encodeURIComponent(urlInput.trim());
      setResult(encoded);
      message.success('URL编码成功');
    } catch (error) {
      message.error('编码失败：' + error.message);
    }
  };

  // URL解码
  const decodeUrl = () => {
    if (!urlInput.trim()) {
      message.warning('请输入要解码的URL或文本');
      return;
    }

    try {
      const decoded = decodeURIComponent(urlInput.trim());
      setResult(decoded);
      message.success('URL解码成功');
    } catch (error) {
      message.error('解码失败：' + error.message);
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
      <h2 style={{ marginBottom: 24 }}>URL编码/解码</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入URL或文本：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="输入要编码或解码的URL或文本..."
              rows={10}
              style={{ flex: 1, minHeight: 200, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 80 }}>
              <Button type="primary" onClick={encodeUrl}>
                URL编码
              </Button>
              <Button type="primary" onClick={decodeUrl}>
                URL解码
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>处理结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={result}
              readOnly
              placeholder="处理结果将显示在这里..."
              rows={10}
              style={{ flex: 1, minHeight: 200, boxSizing: 'border-box' }}
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