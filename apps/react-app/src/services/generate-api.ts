import { generateStyleContents } from '@/utils';
import { STYLE_CONFIGS } from '@/config/style-configs';
import { getApiConfig } from '@/utils/config';

export interface GeneratedResult {
  index: number;
  style: string;
  content: string;
  isComplete: boolean;
  color: string;
  icon: string;
}

interface GenerateOptions {
  userInput: string;
  signal?: AbortSignal;
  onUpdate: (results: GeneratedResult[]) => void;
}

export async function generateMultipleStyles({ userInput, signal, onUpdate }: GenerateOptions) {
  const contents = generateStyleContents(userInput);
  const config = getApiConfig();

  const response = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    body: JSON.stringify({
      contents,
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
  let buffer = '';

  if (!reader) {
    throw new Error('无法读取响应流');
  }

  // 初始化结果数组
  const initialResults: GeneratedResult[] = Array.from(
    { length: STYLE_CONFIGS.length },
    (_, i) => ({
      index: i,
      style: STYLE_CONFIGS[i].name,
      content: '',
      isComplete: false,
      color: STYLE_CONFIGS[i].color,
      icon: STYLE_CONFIGS[i].icon,
    }),
  );
  onUpdate(initialResults);

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

                  if (json.choices && Array.isArray(json.choices)) {
                    const newResults = [...initialResults];
                    json.choices.forEach((choice: any) => {
                      const index = choice.index;
                      const deltaContent = choice.delta?.content || '';

                      if (deltaContent && newResults[index]) {
                        newResults[index] = {
                          ...newResults[index],
                          content: newResults[index].content + deltaContent,
                        };
                      }
                    });
                    Object.assign(initialResults, newResults);
                    onUpdate(newResults);
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

      // 保留最后一个不完整的行在 buffer 中
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          continue;
        }

        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);

          if (data === '[DONE]') {
            // 标记所有结果为完成
            const completedResults = initialResults.map((result) => ({
              ...result,
              isComplete: true,
            }));
            Object.assign(initialResults, completedResults);
            onUpdate(completedResults);
            continue;
          }

          try {
            const json = JSON.parse(data);

            if (json.choices && Array.isArray(json.choices)) {
              const newResults = [...initialResults];

              json.choices.forEach((choice: any) => {
                const index = choice.index;
                const deltaContent = choice.delta?.content || '';

                // 只添加非空内容，避免重复
                if (deltaContent && deltaContent.trim() && newResults[index]) {
                  newResults[index] = {
                    ...newResults[index],
                    content: newResults[index].content + deltaContent,
                  };
                }
              });

              Object.assign(initialResults, newResults);
              onUpdate(newResults);
            }
          } catch (e) {
            // 忽略解析错误，继续处理下一行
            if (data && data !== '[DONE]') {
              console.warn('解析 JSON 失败:', e, data);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();

    // 确保所有结果标记为完成
    const completedResults = initialResults.map((result) => ({
      ...result,
      isComplete: true,
    }));
    onUpdate(completedResults);
  }
}
