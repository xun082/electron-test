import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;

      if (savedTheme) {
        console.log('✅ 使用已保存的主题:', savedTheme);

        return savedTheme;
      }

      // 默认检测系统主题
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      console.log('✅ 使用系统主题:', systemTheme);

      return systemTheme;
    }

    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    console.log('🎨 应用主题:', theme);
    console.log('📝 HTML classes before:', root.className);

    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    console.log('📝 HTML classes after:', root.className);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log('🔄 切换主题按钮被调用, 当前:', theme);
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      console.log('➡️ 新主题:', newTheme);

      return newTheme;
    });
  };

  return { theme, setTheme, toggleTheme };
}
