import { getApiConfig } from '@/utils/config';

interface GenerateCommandOptions {
  userInput: string;
  systemPrompt: string;
  signal?: AbortSignal;
  onStream: (content: string) => void;
}

/**
 * 生成用于 API 请求的 content
 * 格式与 generateStyleContents 保持一致
 */
function generateCommandContent(userInput: string, systemPrompt: string): string {
  return `${systemPrompt}\n\nUser: ${userInput}\n\nAssistant: <think>\n</think>`;
}

export async function generateCommand({
  userInput,
  systemPrompt,
  signal,
  onStream,
}: GenerateCommandOptions): Promise<string> {
  const content = generateCommandContent(userInput, systemPrompt);
  const config = getApiConfig();

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    body: JSON.stringify({
      contents: [content],
      max_tokens: 100,
      temperature: 0.95,
      top_k: 50,
      top_p: 0.9,
      pad_zero: true,
      alpha_presence: 1.0,
      alpha_frequency: 1.0,
      alpha_decay: 0.996,
      chunk_size: 128,
      stream: true,
      password: config.password,
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // 处理剩余的 buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');

          for (const line of lines) {
            const trimmedLine = line.trim();

            if (trimmedLine && trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6);

              if (data !== '[DONE]') {
                try {
                  const json = JSON.parse(data);
                  const deltaContent = json.choices?.[0]?.delta?.content || '';

                  if (deltaContent) {
                    fullContent += deltaContent;
                    onStream(fullContent);
                  }
                } catch {
                  // 忽略解析错误
                }
              }
            }
          }
        }

        break;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);

          if (data === '[DONE]') {
            continue;
          }

          try {
            const json = JSON.parse(data);
            const deltaContent = json.choices?.[0]?.delta?.content || '';

            if (deltaContent && deltaContent.trim()) {
              fullContent += deltaContent;
              onStream(fullContent);
            }
          } catch (error) {
            if (data && data !== '[DONE]') {
              console.warn('解析 JSON 失败:', error, data);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullContent.trim();
}

// 生成系统提示词 - 简洁自然的格式
export function getSystemPrompt(os: 'macOS' | 'Windows' | 'unknown'): string {
  if (os === 'macOS') {
    return `你是 macOS 命令生成助手。

核心规则：
直接输出可执行的命令，不要任何前缀、后缀、解释或说明。
不要输出"根据您的需求"、"命令如下"等提示语。
不要使用 markdown 代码块标记。
多个命令用 && 或 ; 连接。
使用 macOS 特有命令，如 open、pbcopy、pbpaste 等。

示例：
用户说"打开 Safari 浏览器"，你只输出：open -a Safari
用户说"创建文件"，你只输出：touch filename.txt
用户说"列出文件"，你只输出：ls -la`;
  } else if (os === 'Windows') {
    return `你是 Windows 命令生成助手。

核心规则：
直接输出可执行的命令，不要任何前缀、后缀、解释或说明。
不要输出"根据您的需求"、"命令如下"等提示语。
不要使用 markdown 代码块标记。
多个命令用 && 或 & 连接。
优先使用 PowerShell 命令，也可以使用 CMD 命令。
使用 Windows 特有命令，如 start、explorer 等。

示例：
用户说"打开命令提示符"，你只输出：start cmd
用户说"创建文件"，你只输出：type nul > filename.txt
用户说"列出文件"，你只输出：dir`;
  } else {
    return `你是跨平台命令生成助手。

核心规则：
直接输出可执行的命令，不要任何前缀、后缀、解释或说明。
不要输出"根据您的需求"、"命令如下"等提示语。
不要使用 markdown 代码块标记。
多个命令用 && 或 ; 连接。

示例：
用户说"创建文件"，你只输出：touch filename.txt
用户说"列出文件"，你只输出：ls -la`;
  }
}
