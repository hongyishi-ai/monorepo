/**
 * 仪表板页面组件
 * 系统主页面，显示库存概览和关键信息
 */

import { AlertCircle, AlertTriangle, Package, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  ExpiredMedicinesCount,
  ExpiryWarningsCount,
  LowStockCount,
  TotalMedicinesCount,
} from '@/components/reports';
import { toast, ToastContainer } from '@/components/ui/alert-toast';
import { StatsCard } from '@/components/ui/StatsCard';
// Card 族不再使用，避免未使用的导入导致 Lint 报错
import { useExpiryWarnings } from '@/hooks/use-expiry-warnings';
import { useInventoryStats } from '@/hooks/use-inventory';
import { useLowStock } from '@/hooks/use-low-stock';

export function DashboardPage() {
  const navigate = useNavigate();

  // 获取系统提醒数据
  const { stats: expiryStats } = useExpiryWarnings();
  const { stats: lowStockStats } = useLowStock();

  // 获取库存统计数据
  // 仅保留以确保其它卡片可能使用；若未使用则避免 ESLint 报错
  useInventoryStats();

  // 卡片点击处理函数
  const handleCardClick = (filter?: string) => {
    if (filter === 'expiring') {
      navigate('/reports?tab=expiry');
    } else if (filter === 'low-stock') {
      navigate('/reports?tab=lowstock');
    } else if (filter === 'expired') {
      navigate('/reports?tab=expiry');
    } else if (filter) {
      navigate(`/inventory?filter=${filter}`);
    } else {
      navigate('/inventory');
    }
  };

  // 显示系统提醒 - 只在页面首次加载时显示
  useEffect(() => {
    const hasShownToasts = sessionStorage.getItem('dashboard-toasts-shown');
    if (hasShownToasts) return;

    const timer = setTimeout(() => {
      // 近效期提醒
      if (expiryStats?.total > 0) {
        let message = `有 ${expiryStats.total} 种药品即将过期`;
        if (expiryStats.expired > 0) {
          message += `，其中 ${expiryStats.expired} 种已过期`;
          toast.error('近效期提醒', message);
        } else if (expiryStats.critical > 0) {
          message += `，其中 ${expiryStats.critical} 种紧急处理`;
          toast.warning('近效期提醒', message);
        } else {
          toast.warning('近效期提醒', message);
        }
      }

      // 库存不足提醒
      if (lowStockStats?.total > 0) {
        const message = `有 ${lowStockStats.total} 种药品库存不足`;
        toast.warning('库存不足提醒', message);
      }

      // 系统更新提醒
      toast.info(
        '系统更新',
        '系统已更新到最新版本 v1.2.0，新增了报表导出功能和库存分析工具'
      );

      // 标记已显示过提醒
      sessionStorage.setItem('dashboard-toasts-shown', 'true');
    }, 1000); // 延迟1秒显示，确保数据已加载

    return () => clearTimeout(timer);
  }, [
    expiryStats?.total,
    expiryStats?.expired,
    expiryStats?.critical,
    lowStockStats?.total,
  ]); // 添加必要的依赖

  return (
    <>
      <ToastContainer />
      {/* 首屏 Hero：简洁、信息分层、移动优先 */}
      <section className='mb-6 sm:mb-8'>
        <div className='rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 border border-blue-100/60 px-4 py-4 sm:px-6 sm:py-6 shadow-[0_1px_0_#0000000d,_0_1px_2px_#00000014]'>
          <div className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3'>
            <div>
              <h1 className='text-xl sm:text-2xl font-semibold tracking-tight text-slate-900'>
                欢迎回来
              </h1>
              <p className='mt-1 text-sm text-slate-600'>
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
            {/* 关键状态微摘要：紧凑对齐 */}
            <div className='grid grid-cols-2 sm:auto-cols-max sm:grid-flow-col gap-2'>
              <div className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2'>
                <span className='inline-flex h-2.5 w-2.5 rounded-full bg-amber-500'></span>
                <span className='text-xs text-slate-700'>
                  近效期: {Math.max(0, expiryStats?.total || 0)}
                </span>
              </div>
              <div className='inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2'>
                <span className='inline-flex h-2.5 w-2.5 rounded-full bg-red-500'></span>
                <span className='text-xs text-slate-700'>
                  低库存: {Math.max(0, lowStockStats?.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 统计卡片 */}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8'>
        <StatsCard
          title='总库存药品'
          value={<TotalMedicinesCount />}
          icon={<Package className='text-primary-600' />}
          subtitle='药品种类总数'
          onClick={() => handleCardClick()}
        />

        <StatsCard
          title='近效期药品'
          value={<ExpiryWarningsCount />}
          icon={<AlertTriangle className='text-warning' />}
          subtitle='需要关注的药品数量'
          onClick={() => handleCardClick('expiring')}
        />

        <StatsCard
          title='库存预警'
          value={<LowStockCount />}
          icon={<AlertCircle className='text-destructive' />}
          subtitle='需要及时补货的药品数量'
          onClick={() => handleCardClick('low-stock')}
        />

        <StatsCard
          title='近效期药品（按药品）'
          value={<ExpiryWarningsCount />}
          icon={<AlertTriangle className='text-warning' />}
          subtitle='即将过期的药品种类数'
          onClick={() => handleCardClick('expiring')}
        />

        <StatsCard
          title='已过期药品（按药品）'
          value={<ExpiredMedicinesCount />}
          icon={<XCircle className='text-muted-foreground' />}
          subtitle='需要处理的过期药品'
          onClick={() => handleCardClick('expired')}
        />
      </div>
    </>
  );
}

export default DashboardPage;
