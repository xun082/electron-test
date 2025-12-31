import React from 'react';
import { FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

const HomePage: React.FC = () => {
  const quickActions = [
    {
      icon: Sparkles,
      label: 'AI 助手',
      action: () => (window.location.href = '/assistant'),
      description: '智能命令生成助手',
    },
    {
      icon: FileText,
      label: '并发生成',
      action: () => (window.location.href = '/generate'),
      description: '多风格文本改写',
    },
  ];

  return (
    <div className="relative h-full bg-background overflow-hidden">
      {/* 背景装饰 - 更柔和 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s' }}
        />
        <div
          className="absolute top-1/2 -left-40 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '1.5s' }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-64 h-64 bg-primary-400/6 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '3s' }}
        />
      </div>

      <div className="relative h-full flex items-center justify-center px-6">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-6xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/8 border border-primary-500/15 text-primary-600 dark:text-primary-400 text-sm font-medium mb-4 backdrop-blur-sm transition-all duration-500 hover:bg-primary-500/12 hover:border-primary-500/25">
            <Sparkles className="h-4 w-4" />
            <span>AI 驱动的智能助手</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-linear-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent">
              欢迎使用
            </span>
            <br />
            <span className="text-foreground">RWKV智能助手</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            基于 RWKV 大语言模型的智能助手，为您提供命令生成、文本改写等强大功能
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;

              return (
                <Button
                  key={index}
                  variant="outline"
                  size="lg"
                  onClick={action.action}
                  className="group relative overflow-hidden border border-primary-500/15 bg-card/60 backdrop-blur-md shadow-md hover:shadow-xl hover:border-primary-500/30 transition-all duration-500 ease-out hover:scale-[1.02]"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-primary-500/8 via-primary-600/8 to-primary-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-out" />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/3 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200 ease-out" />
                  <Icon className="relative h-5 w-5 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:text-primary-600" />
                  <span className="relative font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
