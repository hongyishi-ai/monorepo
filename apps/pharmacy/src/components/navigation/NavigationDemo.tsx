/**
 * 导航组件演示页面
 * 用于测试和展示不同的导航策略和响应式行为
 */

import React, { useState } from 'react';

import { EnhancedMobileNavigation } from './EnhancedMobileNavigation';
import { MobileBottomNavigation } from './MobileBottomNavigation';

import type { NavigationStrategy } from '@/hooks/useAdaptiveNavigation';

interface NavigationDemoProps {
  className?: string;
}

export const NavigationDemo: React.FC<NavigationDemoProps> = ({
  className = '',
}) => {
  const [currentStrategy, setCurrentStrategy] =
    useState<NavigationStrategy>('priority');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [useEnhanced, setUseEnhanced] = useState(true);

  const strategies: {
    value: NavigationStrategy;
    label: string;
    description: string;
  }[] = [
    {
      value: 'priority',
      label: '优先级策略',
      description: '按标签页优先级排序，核心功能优先显示',
    },
    {
      value: 'category',
      label: '分类策略',
      description: '按功能分类排序：核心 → 管理 → 管理员',
    },
    {
      value: 'role-based',
      label: '角色策略',
      description: '根据用户角色优化标签页顺序',
    },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* 演示控制面板 */}
      <div className='p-4 bg-white shadow-sm border-b'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          移动端导航演示
        </h1>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
          {/* 导航策略选择 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              导航策略
            </label>
            <select
              value={currentStrategy}
              onChange={e =>
                setCurrentStrategy(e.target.value as NavigationStrategy)
              }
              className='w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            >
              {strategies.map(strategy => (
                <option key={strategy.value} value={strategy.value}>
                  {strategy.label}
                </option>
              ))}
            </select>
            <p className='text-xs text-gray-500 mt-1'>
              {strategies.find(s => s.value === currentStrategy)?.description}
            </p>
          </div>

          {/* 组件版本选择 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              组件版本
            </label>
            <div className='space-y-2'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  checked={useEnhanced}
                  onChange={() => setUseEnhanced(true)}
                  className='mr-2'
                />
                <span className='text-sm'>增强版 (推荐)</span>
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  checked={!useEnhanced}
                  onChange={() => setUseEnhanced(false)}
                  className='mr-2'
                />
                <span className='text-sm'>基础版</span>
              </label>
            </div>
          </div>

          {/* 调试选项 */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              调试选项
            </label>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={showAnalytics}
                onChange={e => setShowAnalytics(e.target.checked)}
                className='mr-2'
              />
              <span className='text-sm'>显示分析信息</span>
            </label>
          </div>
        </div>

        {/* 当前策略说明 */}
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-3'>
          <h3 className='font-medium text-blue-900 mb-1'>当前策略说明</h3>
          <p className='text-sm text-blue-700'>
            {strategies.find(s => s.value === currentStrategy)?.description}
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className='p-4 pb-20'>
        <div className='max-w-md mx-auto bg-white rounded-lg shadow-sm border p-6'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            导航测试区域
          </h2>

          <div className='space-y-4'>
            <div className='p-4 bg-gray-50 rounded-lg'>
              <h3 className='font-medium text-gray-700 mb-2'>当前配置</h3>
              <ul className='text-sm text-gray-600 space-y-1'>
                <li>
                  • 策略:{' '}
                  {strategies.find(s => s.value === currentStrategy)?.label}
                </li>
                <li>• 版本: {useEnhanced ? '增强版' : '基础版'}</li>
                <li>• 分析: {showAnalytics ? '开启' : '关闭'}</li>
              </ul>
            </div>

            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <h3 className='font-medium text-yellow-800 mb-2'>测试说明</h3>
              <ul className='text-sm text-yellow-700 space-y-1'>
                <li>• 在移动设备或缩小浏览器窗口查看效果</li>
                <li>• 尝试不同的用户角色 (operator/manager/admin)</li>
                <li>• 观察标签页数量变化和&quot;更多&quot;菜单</li>
                <li>• 检查控制台的分析信息</li>
              </ul>
            </div>

            <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
              <h3 className='font-medium text-green-800 mb-2'>功能特性</h3>
              <ul className='text-sm text-green-700 space-y-1'>
                <li>• 🎯 智能优先级排序</li>
                <li>• 📱 响应式布局适配</li>
                <li>• 📋 &quot;更多&quot;菜单处理溢出</li>
                <li>• 🔐 基于权限的动态显示</li>
                <li>• ⚡ 性能优化和缓存</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 渲染对应的导航组件 */}
      {useEnhanced ? (
        <EnhancedMobileNavigation
          strategy={currentStrategy}
          showAnalytics={showAnalytics}
        />
      ) : (
        <MobileBottomNavigation />
      )}
    </div>
  );
};

export default NavigationDemo;
