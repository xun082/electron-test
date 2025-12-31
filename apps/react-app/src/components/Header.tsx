import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, Moon, Sun, Wand2, Settings } from 'lucide-react';

import { cn } from '@/utils';
import { useTheme } from '@/hooks/useTheme';

const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/assistant', label: 'AI助手', icon: Sparkles },
    { path: '/generate', label: '并发生成', icon: Wand2 },
    { path: '/settings', label: '设置', icon: Settings },
  ];

  return (
    <header className="glass sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-xl transition-all duration-500">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="group flex items-center space-x-3 transition-all duration-500 ease-out hover:scale-[1.02]"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-primary-500 via-primary-600 to-primary-700 shadow-lg transition-all duration-500 ease-out group-hover:shadow-xl group-hover:from-primary-400 group-hover:to-primary-600 group-hover:scale-105">
            <span className="text-xl font-bold text-white drop-shadow-sm">R</span>
            <div className="absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
          </div>
          <span className="gradient-text text-xl font-bold tracking-tight">RWKV智能助手</span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center space-x-3">
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative flex items-center space-x-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-500 ease-out',
                    isActive
                      ? 'bg-linear-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/25'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm',
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg bg-white opacity-10"></div>
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-transform duration-300',
                      isActive && 'scale-110',
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              console.log('主题按钮被点击');
              toggleTheme();
            }}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-2.5 text-foreground shadow-sm transition-all duration-500 ease-out hover:border-primary-400/40 hover:shadow-md hover:scale-105"
            title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
            aria-label="切换主题"
            type="button"
          >
            <div className="absolute inset-0 bg-linear-to-br from-primary-500/10 to-primary-600/10 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"></div>
            <div className="relative">
              {theme === 'light' ? (
                <Moon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              ) : (
                <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" />
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
