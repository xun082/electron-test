import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Terminal, Copy, CheckCircle2, Loader2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';
import { generateCommand, getSystemPrompt } from '@/services/assistant-api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  command?: string;
  executionResult?: {
    success: boolean;
    output?: string;
    error?: string;
  };
  timestamp: Date;
}

const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentOS, setCurrentOS] = useState<'macOS' | 'Windows' | 'unknown'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 检测操作系统
  useEffect(() => {
    const detectOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const platform = window.navigator.platform.toLowerCase();

      if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'macOS';
      } else if (platform.includes('win') || userAgent.includes('win')) {
        return 'Windows';
      }

      return 'unknown';
    };

    setCurrentOS(detectOS());
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    const userInput = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingContent('');
    setStreamingMessageId(null);

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();

    // 创建助手消息的初始状态
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setStreamingMessageId(assistantMessageId);

    try {
      const systemPrompt = getSystemPrompt(currentOS);

      const command = await generateCommand({
        userInput,
        systemPrompt,
        signal: abortControllerRef.current?.signal,
        onStream: (content) => {
          // 实时更新流式内容
          setStreamingContent(content);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: '正在生成命令...', command: content.trim() }
                : msg,
            ),
          );
        },
      });

      // 清理命令（移除可能的 markdown 标记）
      let cleanCommand = command.trim();
      // 移除 markdown 代码块标记
      cleanCommand = cleanCommand
        .replace(/```[a-z]*\n?/g, '')
        .replace(/```/g, '')
        .trim();

      // 流式响应完成，更新最终消息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: cleanCommand ? '' : '抱歉，未能生成有效的命令。',
                command: cleanCommand || undefined,
              }
            : msg,
        ),
      );
    } catch (error: any) {
      console.error('处理请求时出错:', error);

      // 如果是用户取消，不显示错误
      if (error.name === 'AbortError') {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));

        return;
      }

      const errorMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: `抱歉，处理您的请求时出现了错误：${error.message || '未知错误'}`,
        timestamp: new Date(),
      };
      setMessages((prev) =>
        prev.map((msg) => (msg.id === assistantMessageId ? errorMessage : msg)),
      );
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingMessageId(null);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setStreamingContent('');
      setStreamingMessageId(null);
    }
  };

  const handleExecute = async (command: string) => {
    if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
      try {
        // 通过 Electron IPC 执行命令
        const result = await (window as any).electron.ipcRenderer.invoke(
          'execute-command',
          command,
        );

        const executedMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
          command: command,
          executionResult: {
            success: result.success,
            output: result.output?.trim(),
            error: result.error,
          },
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, executedMessage]);
      } catch (error: any) {
        console.error('执行命令时出错:', error);

        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: '',
          command: command,
          executionResult: {
            success: false,
            error: error?.message || error || '未知错误',
          },
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } else {
      // 非 Electron 环境，显示提示
      alert(`在 Electron 环境中，此命令将被执行:\n${command}`);
    }
  };

  const handleCopy = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
        <div className="w-full max-w-5xl h-full flex flex-col">
          <Card className="flex-1 border-0 shadow-lg flex flex-col overflow-hidden">
            <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-6 p-6 rounded-full bg-linear-to-br from-primary-500/10 to-primary-600/10">
                      <Sparkles className="h-12 w-12 text-primary-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">
                      开始使用 AI 助手
                      {currentOS !== 'unknown' && (
                        <span className="ml-3 px-2.5 py-1 text-xs font-medium rounded-md bg-primary/10 text-primary">
                          {currentOS}
                        </span>
                      )}
                    </h3>
                    <p className="text-base text-muted-foreground max-w-md mb-6">
                      告诉我您想要做什么，我会为您生成可执行的{' '}
                      {currentOS !== 'unknown' ? currentOS : ''} 命令
                    </p>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground font-medium">试试这些：</div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {currentOS === 'macOS'
                          ? ['打开终端', '创建文件 test.txt', '列出所有文件', '打开访达'].map(
                              (example) => (
                                <button
                                  key={example}
                                  onClick={() => setInput(example)}
                                  className="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 transition-all hover:scale-105"
                                >
                                  {example}
                                </button>
                              ),
                            )
                          : currentOS === 'Windows'
                            ? [
                                '打开命令提示符',
                                '创建文件 test.txt',
                                '列出所有文件',
                                '打开资源管理器',
                              ].map((example) => (
                                <button
                                  key={example}
                                  onClick={() => setInput(example)}
                                  className="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 transition-all hover:scale-105"
                                >
                                  {example}
                                </button>
                              ))
                            : ['创建文件 test.txt', '列出所有文件', '显示当前路径', '清空屏幕'].map(
                                (example) => (
                                  <button
                                    key={example}
                                    onClick={() => setInput(example)}
                                    className="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-muted/80 transition-all hover:scale-105"
                                  >
                                    {example}
                                  </button>
                                ),
                              )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-start gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start',
                        )}
                      >
                        {message.role === 'assistant' && (
                          <div className="shrink-0 h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-500/20">
                            <Sparkles className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3 shadow-sm',
                            message.role === 'user'
                              ? 'max-w-[70%] bg-primary text-primary-foreground'
                              : 'flex-1 bg-muted text-foreground',
                          )}
                        >
                          {message.content && (
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          )}
                          {message.command && !message.executionResult && (
                            <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    命令
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleCopy(message.command!, message.id)}
                                  className="p-1.5 rounded-lg hover:bg-background transition-colors"
                                  title="复制命令"
                                >
                                  {copiedId === message.id ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </button>
                              </div>
                              <input
                                type="text"
                                defaultValue={message.command}
                                className="w-full bg-background rounded-lg p-3 border border-border/50 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                                spellCheck={false}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const input = e.currentTarget as HTMLInputElement;
                                    handleExecute(input.value);
                                  }
                                }}
                              />
                              <Button
                                size="default"
                                variant="default"
                                onClick={(e) => {
                                  const input = e.currentTarget
                                    .previousElementSibling as HTMLInputElement;
                                  handleExecute(input.value);
                                }}
                                className="w-full"
                              >
                                <Terminal className="h-4 w-4 mr-2" />
                                执行命令
                              </Button>
                            </div>
                          )}
                          {message.executionResult && (
                            <div className="space-y-3">
                              <div
                                className={cn(
                                  'flex items-center gap-2 p-3 rounded-lg',
                                  message.executionResult.success
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30'
                                    : 'bg-red-50 dark:bg-red-950/30',
                                )}
                              >
                                {message.executionResult.success ? (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Terminal className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    'text-sm font-medium',
                                    message.executionResult.success
                                      ? 'text-emerald-700 dark:text-emerald-300'
                                      : 'text-red-700 dark:text-red-300',
                                  )}
                                >
                                  {message.executionResult.success
                                    ? '命令执行成功'
                                    : '命令执行失败'}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                      命令
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleCopy(message.command!, message.id)}
                                    className="p-1.5 rounded-lg hover:bg-background transition-colors"
                                    title="复制命令"
                                  >
                                    {copiedId === message.id ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  defaultValue={message.command}
                                  className="w-full bg-background rounded-lg p-3 border border-border/50 text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                                  spellCheck={false}
                                  readOnly
                                />
                              </div>

                              {message.executionResult.success &&
                                message.executionResult.output && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Terminal className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                          输出
                                        </span>
                                      </div>
                                      <button
                                        onClick={() =>
                                          handleCopy(message.executionResult!.output!, message.id)
                                        }
                                        className="p-1.5 rounded-lg hover:bg-background transition-colors"
                                        title="复制输出"
                                      >
                                        {copiedId === message.id ? (
                                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                          <Copy className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </button>
                                    </div>
                                    <textarea
                                      defaultValue={message.executionResult.output}
                                      className="w-full min-h-[400px] max-h-[600px] bg-background rounded-lg p-3 border border-border/50 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 whitespace-pre overflow-x-auto"
                                      spellCheck={false}
                                      wrap="off"
                                    />
                                  </div>
                                )}

                              {!message.executionResult.success &&
                                message.executionResult.error && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Terminal className="h-4 w-4 text-red-600 dark:text-red-400" />
                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                        错误信息
                                      </span>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-900">
                                      <p className="text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap break-all">
                                        {message.executionResult.error}
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                        {message.role === 'user' && (
                          <div className="shrink-0 h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">你</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && streamingMessageId && (
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 h-9 w-9 rounded-full bg-linear-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm shadow-primary-500/20">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl px-4 py-3 flex-1 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              正在生成命令...
                            </span>
                          </div>
                          {streamingContent && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="bg-background rounded-lg p-3 border border-border/50">
                                <code className="text-sm font-mono text-foreground break-all">
                                  {streamingContent}
                                </code>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 输入区域 - ChatGPT 风格 */}
          <div className="mt-4 px-4">
            <div className="relative flex items-center gap-2 px-4 py-2 rounded-3xl border border-border/50 bg-background shadow-sm hover:border-primary-200 focus-within:border-primary-300 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentOS === 'macOS'
                    ? '输入您的需求，例如：打开终端、创建文件...'
                    : currentOS === 'Windows'
                      ? '输入您的需求，例如：打开命令提示符、创建文件...'
                      : '输入您的需求，例如：创建文件、列出文件...'
                }
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
                  onClick={handleSend}
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
    </div>
  );
};

export default AssistantPage;
