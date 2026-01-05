import React, { useState } from 'react';
import { Save, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiConfig, saveApiConfig, resetApiConfig } from '@/utils/config';

const SettingsPage: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(() => getApiConfig().apiUrl);
  const [password, setPassword] = useState(() => getApiConfig().password);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = () => {
    try {
      saveApiConfig({ apiUrl, password });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    resetApiConfig();

    const defaultConfig = getApiConfig();
    setApiUrl(defaultConfig.apiUrl);
    setPassword(defaultConfig.password);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container mx-auto max-w-4xl px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">设置</h1>
          <p className="text-muted-foreground">配置 RWKV API 连接信息</p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">API 地址</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://192.168.0.12:8000/v1/chat/completions"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
              <p className="text-xs text-muted-foreground">RWKV API 的完整地址，包含协议和端口</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">密码</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="rwkv7_7.2b_webgen"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 transition-all"
              />
              <p className="text-xs text-muted-foreground">API 访问密码</p>
            </div>

            {saveStatus !== 'idle' && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  saveStatus === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                }`}
              >
                {saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-medium">保存成功！</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">保存失败，请重试</span>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} variant="default" size="lg" className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="h-4 w-4 mr-2" />
                恢复默认
              </Button>
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-2">说明</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 修改后需要点击"保存设置"才会生效</li>
                <li>• 设置会保存在浏览器本地存储中</li>
                <li>• 点击"恢复默认"可以重置为初始配置</li>
                <li>• 确保 API 地址可访问且密码正确</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
