import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Header from './components/Header';
import HomePage from './pages/home';
import AssistantPage from './pages/assistant';
import GeneratePage from './pages/generate';
import SettingsPage from './pages/settings';

function App(): React.JSX.Element {
  useEffect(() => {
    // 初始化主题
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const initialTheme = savedTheme || systemTheme;

    console.log('🚀 App 初始化, 主题:', initialTheme);
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(initialTheme);
  }, []);

  return (
    <BrowserRouter>
      <div className="h-screen bg-background transition-colors duration-500 ease-out overflow-hidden flex flex-col">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/generate" element={<GeneratePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
