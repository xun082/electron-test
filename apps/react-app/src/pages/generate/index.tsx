import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Copy, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { STYLE_CONFIGS } from '@/config/style-configs';
import { generateMultipleStyles, type GeneratedResult } from '@/services/generate-api';

const GeneratePage: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (results.length > 0) {
      scrollToBottom();
    }
  }, [results]);

  const handleGenerate = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResults([]);
    setCopiedIndex(null);

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    try {
      await generateMultipleStyles({
        userInput: input.trim(),
        signal: abortControllerRef.current.signal,
        onUpdate: setResults,
      });
    } catch (error: any) {
      console.error('生成失败:', error);

      // 如果是用户取消，不显示错误
      if (error.name === 'AbortError') {
        return;
      }

      alert(`生成失败: ${error.message || '未知错误'}`);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = () => {
    if (input.trim()) {
      handleGenerate();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 pt-6 pb-32">
        {/* 加载状态 - 完全居中 */}
        {isLoading && results.length === 0 && (
          <div className="fixed inset-0 flex items-center justify-center pb-32">
            <Card className="shadow-xl border-0 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardContent className="p-12 sm:p-16">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 className="h-14 w-14 sm:h-16 sm:w-16 animate-spin text-primary" />
                    <div className="absolute inset-0 h-14 w-14 sm:h-16 sm:w-16 animate-ping text-primary/30">
                      <Sparkles className="h-full w-full" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-lg sm:text-xl font-semibold text-foreground">
                      正在生成 {STYLE_CONFIGS.length} 种语气转换...
                    </p>
                    <p className="text-base text-muted-foreground">AI 正在为您创作多种风格的表达</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="h-2 w-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 结果网格 - 简单直接的网格布局 */}
        {results.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
              {results.map((result, index) => (
                <Card
                  key={result.index}
                  className={cn(
                    'group relative overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full border-0',
                    'hover:-translate-y-1 hover:scale-[1.02]',
                    'animate-in fade-in slide-in-from-bottom-2 duration-500',
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* 渐变背景装饰 */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-linear-to-br opacity-5 group-hover:opacity-10 transition-opacity',
                      result.color,
                    )}
                  />
                  <div
                    className={cn(
                      'absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br opacity-0 group-hover:opacity-20 transition-opacity blur-2xl',
                      result.color,
                    )}
                  />

                  <CardContent className="relative p-5 sm:p-6 flex flex-col flex-1 z-10">
                    {/* 头部：图标、标签和复制按钮 */}
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                        <span className="text-2xl shrink-0 transition-transform group-hover:scale-110">
                          {result.icon}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-bold px-3.5 py-1.5 rounded-lg whitespace-nowrap shadow-sm',
                            'bg-linear-to-br text-white',
                            result.color,
                          )}
                        >
                          {result.style}
                        </span>
                        {!result.isComplete && (
                          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                        )}
                      </div>
                      <button
                        onClick={() => handleCopy(result.content, result.index)}
                        className={cn(
                          'p-2 rounded-lg transition-all shrink-0 ml-2',
                          'hover:bg-primary/10',
                          'hover:scale-110 active:scale-95',
                        )}
                        title="复制内容"
                        aria-label="复制内容"
                      >
                        {copiedIndex === result.index ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-200" />
                        ) : (
                          <Copy className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </button>
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 min-h-[120px] sm:min-h-[140px] overflow-hidden">
                      <p
                        className={cn(
                          'text-base leading-relaxed whitespace-pre-wrap wrap-break-word',
                          result.content ? 'text-foreground' : 'text-muted-foreground italic',
                        )}
                      >
                        {result.content || '⏳ 等待生成...'}
                      </p>
                    </div>

                    {/* 完成标记 */}
                    {result.isComplete && result.content && (
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          生成完成
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 重新生成按钮 */}
        {results.length > 0 && !isLoading && (
          <div className="mt-8 sm:mt-10 mb-4 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Button
              onClick={handleRegenerate}
              variant="outline"
              size="lg"
              className={cn(
                'px-8 py-5 rounded-2xl border-2 text-base',
                'hover:bg-primary/5 hover:border-primary/50 hover:text-primary',
                'transition-all hover:scale-105 hover:shadow-lg',
                'group',
              )}
            >
              <RefreshCw className="h-5 w-5 mr-2.5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-medium">重新生成所有结果</span>
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              💡 将使用相同的输入重新生成所有 {STYLE_CONFIGS.length} 种语气转换
            </p>
          </div>
        )}

        <div ref={resultsEndRef} />

        {/* 空状态 - 完全居中 */}
        {results.length === 0 && !isLoading && (
          <div className="fixed inset-0 flex items-center justify-center pb-32 pointer-events-none">
            <div className="text-center space-y-6 animate-in fade-in duration-1000">
              <div className="flex justify-center gap-5 text-6xl opacity-40">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
                  💬
                </span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
                  ✨
                </span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
                  🎯
                </span>
              </div>
              <div className="space-y-3">
                <p className="text-lg text-foreground/80 font-medium">
                  输入任何文本，AI 将为您生成多种语气转换
                </p>
                <p className="text-base text-muted-foreground">
                  支持职场、生活、方言、文学、网络等 {STYLE_CONFIGS.length} 种风格
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 固定在底部的输入区域 - ChatGPT 风格 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto max-w-3xl px-4 py-5">
          <div className="relative flex items-center gap-2 px-4 py-2 rounded-3xl border border-border/50 bg-background shadow-sm hover:border-primary-200 focus-within:border-primary-300 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="输入您要说的话..."
              className="flex-1 min-h-[24px] max-h-[200px] py-2 bg-transparent text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none text-[15px] leading-6"
              rows={1}
              style={{
                border: 'none',
                boxShadow: 'none',
              }}
            />
            {isLoading ? (
              <Button onClick={handleCancel} size="icon" variant="ghost" className="shrink-0">
                <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!input.trim() || isLoading}
                size="icon"
                variant="default"
                className="shrink-0 shadow-primary-500/30"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratePage;
