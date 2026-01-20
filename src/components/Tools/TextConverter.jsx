import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
const { TextArea } = Input;

// 字符格式转换工具组件
export default function TextConverter() {
  const [textInput, setTextInput] = useState('');
  const [textOutput, setTextOutput] = useState('');

  // 文本转换核心功能
  const convertText = (type) => {
    if (!textInput.trim()) {
      message.warning('请输入要转换的文本');
      return;
    }

    try {
      let result = '';
      switch (type) {
        case 'uppercase':
          result = textInput.toUpperCase();
          break;
        case 'lowercase':
          result = textInput.toLowerCase();
          break;
        case 'base64-encode':
          result = btoa(unescape(encodeURIComponent(textInput)));
          break;
        case 'base64-decode':
          result = decodeURIComponent(escape(atob(textInput)));
          break;
        default:
          result = textInput;
      }
      setTextOutput(result);
      message.success('转换成功');
    } catch (error) {
      message.error('转换失败：' + error.message);
    }
  };

  // 复制结果到剪贴板
  const copyToClipboard = () => {
    if (!textOutput) {
      message.warning('没有可复制的内容');
      return;
    }
    navigator.clipboard.writeText(textOutput).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h2 style={{ marginBottom: 24 }}>字符格式转换</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入文本：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="输入要转换的文本..."
              rows={12}
              style={{ flex: 1, minHeight: 240, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 80 }}>
              <Button type="primary" onClick={() => convertText('uppercase')}>
                转为大写
              </Button>
              <Button type="primary" onClick={() => convertText('lowercase')}>
                转为小写
              </Button>
              <Button type="primary" onClick={() => convertText('base64-encode')}>
                Base64编码
              </Button>
              <Button type="primary" onClick={() => convertText('base64-decode')}>
                Base64解码
              </Button>
            </div>
          </div>
        </div>
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>转换结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={textOutput}
              readOnly
              placeholder="转换结果将显示在这里..."
              rows={12}
              style={{ flex: 1, minHeight: 240, boxSizing: 'border-box' }}
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