#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

class CodeReviewer {
  private apiKey: string;
  private baseUrl = 'https://api.siliconflow.cn/v1/chat/completions';

  constructor() {
    this.apiKey = process.env.SILICONFLOW_API_KEY || '';

    if (!this.apiKey) {
      throw new Error('SILICONFLOW_API_KEY environment variable is required');
    }
  }

  async reviewCode(prNumber: string, baseSha: string, headSha: string): Promise<string> {
    const changedFiles = this.getChangedFiles(baseSha, headSha);

    if (changedFiles.length === 0) {
      return `## 代码审查

### 总体评估
没有发现需要审查的代码变更

### 总结
PR 中没有包含需要审查的代码文件`;
    }

    const diff = this.getDiff(baseSha, headSha);
    const analysis = await this.analyzeCode(changedFiles, diff);

    return analysis;
  }

  private getChangedFiles(baseSha: string, headSha: string): string[] {
    try {
      let command: string;
      let output: string;

      try {
        command = `git diff --name-only origin/main...HEAD`;
        output = execSync(command, { encoding: 'utf-8' });
      } catch {
        command = `git diff --name-only ${baseSha} ${headSha}`;
        output = execSync(command, { encoding: 'utf-8' });
      }

      const allFiles = output.split('\n').filter((file) => file.trim());
      const filteredFiles = allFiles.filter((file) => file !== 'pnpm-lock.yaml');

      return filteredFiles;
    } catch (error) {
      console.error('获取变更文件失败:', error);
      return [];
    }
  }

  private getDiff(baseSha: string, headSha: string): string {
    try {
      let command: string;

      try {
        command = `git diff origin/main...HEAD`;
        return execSync(command, { encoding: 'utf-8' });
      } catch {
        command = `git diff ${baseSha} ${headSha}`;
        return execSync(command, { encoding: 'utf-8' });
      }
    } catch (error) {
      console.error('获取代码差异失败:', error);
      return '';
    }
  }

  private async analyzeCode(files: string[], diff: string): Promise<string> {
    const prompt = this.buildPrompt(files, diff);

    try {
      const response = await this.callDeepSeekAPI(prompt);
      return response;
    } catch (error) {
      console.error('代码审查失败:', error);
      return `## 代码审查

### 总体评估
代码审查过程中发生错误，请检查配置

### 需要关注的问题
- **系统错误**: 无法完成代码审查
- 建议: 请检查 API 配置

### 总结
审查失败，请重试`;
    }
  }

  private buildPrompt(files: string[], diff: string): string {
    return `作为一位资深的代码审查专家，请对以下代码变更进行专业审查。

## 审查重点

### 代码质量
- 命名规范和代码风格
- 代码复杂度和可读性
- 函数和类的设计
- 错误处理

### 安全性
- 敏感信息泄露风险
- 输入验证和输出编码
- 权限控制
- API 安全

### 性能
- 内存泄漏风险
- 性能瓶颈
- 异步操作优化
- 资源使用效率

### 架构设计
- 模块耦合度
- 设计模式
- 可扩展性
- 可测试性
- Monorepo 规范

### TypeScript/React/Electron 最佳实践
- 类型安全和类型定义
- React Hooks 规范
- 组件设计
- Electron IPC 安全
- 主渲染进程隔离

## 输出格式要求

请直接输出 Markdown 格式的代码审查报告，使用以下结构：

## 代码审查

### 总体评估
[简明扼要的整体评价]

### 需要关注的问题

#### 严重问题 🔴
[如果有严重问题，列出具体问题和建议]

#### 重要问题 🟡
[如果有重要问题，列出具体问题和建议]

#### 一般建议 💡
[如果有改进建议，列出具体建议]

### 代码亮点
[如果有值得表扬的地方，简要列出]

### 总结
[简短总结和行动建议]

## 变更文件
${files.map((f) => `- ${f}`).join('\n')}

## 代码差异
\`\`\`diff
${diff}
\`\`\`

注意：
1. 只输出代码审查内容，不要输出思考过程
2. 直接给出最终审查结果
3. 保持专业和简洁
4. 如果没有问题，简单说明即可`;
  }

  private async callDeepSeekAPI(prompt: string): Promise<string> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1',
          messages: [
            {
              role: 'system',
              content:
                '你是一位专业的代码审查专家。直接输出审查结果，不要输出思考过程、不要提及 AI 或自动化工具，保持专业和简洁。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
          };
        }>;
      };

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('API 响应格式错误');
      }

      return data.choices[0].message.content || '';
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`DeepSeek API 调用失败: ${error.message}`);
      }
      throw new Error('DeepSeek API 调用失败: 未知错误');
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('用法: tsx code-review.ts <PR_NUMBER> <BASE_SHA> <HEAD_SHA>');
    process.exit(1);
  }

  const [prNumber, baseSha, headSha] = args;

  try {
    const reviewer = new CodeReviewer();
    const markdown = await reviewer.reviewCode(prNumber, baseSha, headSha);

    const reportPath = join(process.cwd(), 'code-review-report.md');
    writeFileSync(reportPath, markdown);

    console.log('\n---REPORT_START---');
    console.log(markdown);
    console.log('---REPORT_END---');
  } catch (error) {
    console.error('❌ 代码审查失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

export { CodeReviewer };
