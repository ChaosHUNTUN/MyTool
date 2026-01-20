import React, { useState } from 'react';
import { Input, Button, Space, message, Tag } from 'antd';
const { TextArea } = Input;

// IP地址验证工具组件
export default function IpValidator() {
  const [ipInput, setIpInput] = useState('');
  const [result, setResult] = useState('');
  const [ipInfo, setIpInfo] = useState({
    valid: false,
    type: '',
    isPrivate: false,
    message: ''
  });

  // 验证IPv4地址
  const isValidIPv4 = (ip) => {
    const ipv4Regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  // 验证IPv6地址
  const isValidIPv6 = (ip) => {
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}$|^(?:[0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}$|^(?:[0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}$|^[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})$|^:((:[0-9a-fA-F]{1,4}){1,7}|:)$|^fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}$|^::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$|^[0-9a-fA-F]{1,4}:[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){0,4}|:)((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])$/;
    return ipv6Regex.test(ip);
  };

  // 检查是否为私有IP地址
  const isPrivateIP = (ip) => {
    // IPv4私有地址范围
    const privateIPv4Ranges = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
      /^192\.168\.\d{1,3}\.\d{1,3}$/,
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/ // 回环地址
    ];

    // IPv6私有地址范围
    const privateIPv6Ranges = [
      /^fc00:/i, // ULA地址
      /^fe80:/i, // 链路本地地址
      /^::1$/i // IPv6回环地址
    ];

    // 检查IPv4
    for (const range of privateIPv4Ranges) {
      if (range.test(ip)) {
        return true;
      }
    }

    // 检查IPv6
    for (const range of privateIPv6Ranges) {
      if (range.test(ip)) {
        return true;
      }
    }

    return false;
  };

  // 验证IP地址
  const validateIp = () => {
    if (!ipInput.trim()) {
      message.warning('请输入要验证的IP地址');
      return;
    }

    try {
      const ip = ipInput.trim();
      let valid = false;
      let type = '';
      let isPrivate = false;
      let msg = '';

      if (isValidIPv4(ip)) {
        valid = true;
        type = 'IPv4';
        isPrivate = isPrivateIP(ip);
        msg = `有效的${isPrivate ? '私有' : '公有'}IPv4地址`;
      } else if (isValidIPv6(ip)) {
        valid = true;
        type = 'IPv6';
        isPrivate = isPrivateIP(ip);
        msg = `有效的${isPrivate ? '私有' : '公有'}IPv6地址`;
      } else {
        valid = false;
        type = '未知';
        msg = '无效的IP地址格式';
      }

      setIpInfo({ valid, type, isPrivate, message: msg });
      setResult(`${ip}: ${msg}`);
      message.success('IP地址验证完成');
    } catch (error) {
      message.error('验证失败：' + error.message);
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
      <h2 style={{ marginBottom: 24 }}>IP地址验证</h2>
      <Space orientation="vertical" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }} size="large">
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>输入IP地址：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <TextArea
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="输入IPv4或IPv6地址，例如：192.168.1.1 或 2001:0db8:85a3:0000:0000:8a2e:0370:7334..."
              rows={6}
              style={{ flex: 1, minHeight: 120, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 80 }}>
              <Button type="primary" onClick={validateIp}>
                验证IP
              </Button>
            </div>
          </div>
        </div>
        
        <div style={{ boxSizing: 'border-box' }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>验证结果：</label>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', boxSizing: 'border-box' }}>
            <div style={{ flex: 1, minHeight: 120, display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}>
              <TextArea
                value={result}
                readOnly
                placeholder="验证结果将显示在这里..."
                rows={6}
                style={{ flex: 1, minHeight: 120, boxSizing: 'border-box' }}
              />
              {result && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>IP类型：</span>
                  {ipInfo.valid ? (
                    <Tag color={ipInfo.type === 'IPv4' ? 'blue' : 'green'}>
                      {ipInfo.type}
                    </Tag>
                  ) : (
                    <Tag color="red">无效</Tag>
                  )}
                  
                  {ipInfo.valid && (
                    <>
                      <span style={{ fontWeight: 500 }}>地址类型：</span>
                      <Tag color={ipInfo.isPrivate ? 'orange' : 'green'}>
                        {ipInfo.isPrivate ? '私有地址' : '公有地址'}
                      </Tag>
                    </>
                  )}
                </div>
              )}
            </div>
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