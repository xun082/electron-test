// API 配置管理

interface ApiConfig {
  apiUrl: string;
  password: string;
}

const DEFAULT_CONFIG: ApiConfig = {
  apiUrl: 'http://192.168.0.12:8000/v1/chat/completions',
  password: 'rwkv7_7.2b_webgen',
};

const CONFIG_KEY = 'rwkv_api_config';

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return {
        apiUrl: config.apiUrl || DEFAULT_CONFIG.apiUrl,
        password: config.password || DEFAULT_CONFIG.password,
      };
    }
  } catch (error) {
    console.error('Failed to load API config:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveApiConfig(config: ApiConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save API config:', error);
  }
}

export function resetApiConfig(): void {
  try {
    localStorage.removeItem(CONFIG_KEY);
  } catch (error) {
    console.error('Failed to reset API config:', error);
  }
}
