/**
 * 通知状态管理 Store
 * 使用 Zustand 管理通知和提醒相关状态
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// 通知优先级
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// 通知项
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  duration?: number; // 自动消失时间（毫秒），undefined 表示不自动消失
  persistent?: boolean; // 是否持久化显示
  actions?: NotificationAction[]; // 操作按钮
  data?: Record<string, unknown>; // 附加数据
  read?: boolean; // 是否已读
}

// 通知操作
export interface NotificationAction {
  id: string;
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive';
}

// 系统提醒类型
export type ReminderType =
  | 'expiry_warning' // 近效期提醒
  | 'stock_low' // 库存不足
  | 'stock_out' // 缺货提醒
  | 'batch_expired' // 批次过期
  | 'system_maintenance' // 系统维护
  | 'data_backup' // 数据备份
  | 'user_action'; // 用户操作

// 系统提醒
export interface SystemReminder {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  relatedId?: string; // 关联的业务ID（如药品ID、批次ID）
  metadata?: Record<string, unknown>; // 元数据
  dismissed?: boolean; // 是否已忽略
  snoozedUntil?: number; // 暂停提醒直到指定时间
}

// 桌面通知选项
interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: unknown;
  requireInteraction?: boolean;
  silent?: boolean;
}

// 通知状态
export interface NotificationState {
  // 当前通知列表
  notifications: Notification[];
  // 系统提醒列表
  reminders: SystemReminder[];
  // 未读通知数量
  unreadCount: number;
  // 是否显示通知面板
  showPanel: boolean;
  // 通知设置
  settings: NotificationSettings;
  // 是否正在加载
  isLoading: boolean;
}

// 通知设置
export interface NotificationSettings {
  // 是否启用桌面通知
  enableDesktop: boolean;
  // 是否启用声音提醒
  enableSound: boolean;
  // 默认通知持续时间
  defaultDuration: number;
  // 是否启用各类提醒
  enableExpiryReminder: boolean;
  enableStockReminder: boolean;
  enableSystemReminder: boolean;
  // 提醒检查间隔（分钟）
  reminderInterval: number;
}

// 通知操作
export interface NotificationActions {
  // 添加通知
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>
  ) => void;
  // 移除通知
  removeNotification: (id: string) => void;
  // 清除所有通知
  clearNotifications: () => void;
  // 标记通知为已读
  markAsRead: (id: string) => void;
  // 标记所有通知为已读
  markAllAsRead: () => void;
  // 添加系统提醒
  addReminder: (reminder: Omit<SystemReminder, 'id' | 'timestamp'>) => void;
  // 移除系统提醒
  removeReminder: (id: string) => void;
  // 忽略提醒
  dismissReminder: (id: string) => void;
  // 暂停提醒
  snoozeReminder: (id: string, duration: number) => void;
  // 清除所有提醒
  clearReminders: () => void;
  // 显示/隐藏通知面板
  togglePanel: () => void;
  // 更新通知设置
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  // 请求桌面通知权限
  requestDesktopPermission: () => Promise<boolean>;
  // 发送桌面通知
  sendDesktopNotification: (
    title: string,
    message: string,
    options?: NotificationOptions
  ) => void;
}

// 通知 Store 类型
type NotificationStore = NotificationState & NotificationActions;

// 默认通知设置
const defaultSettings: NotificationSettings = {
  enableDesktop: false,
  enableSound: true,
  defaultDuration: 5000,
  enableExpiryReminder: true,
  enableStockReminder: true,
  enableSystemReminder: true,
  reminderInterval: 30, // 30分钟检查一次
};

export const useNotificationStore = create<NotificationStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    notifications: [],
    reminders: [],
    unreadCount: 0,
    showPanel: false,
    settings: defaultSettings,
    isLoading: false,

    // 添加通知
    addNotification: notificationData => {
      const notification: Notification = {
        ...notificationData,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
      };

      set(state => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      }));

      // 发送桌面通知
      const { settings } = get();
      if (settings.enableDesktop && notification.priority !== 'low') {
        get().sendDesktopNotification(notification.title, notification.message);
      }

      // 播放提示音
      if (settings.enableSound && notification.type === 'error') {
        playNotificationSound();
      }

      // 自动移除通知
      if (notification.duration && !notification.persistent) {
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, notification.duration);
      } else if (!notification.persistent && !notification.duration) {
        // 使用默认持续时间
        setTimeout(() => {
          get().removeNotification(notification.id);
        }, settings.defaultDuration);
      }
    },

    // 移除通知
    removeNotification: (id: string) => {
      set(state => {
        const notification = state.notifications.find(n => n.id === id);
        const wasUnread = notification && !notification.read;

        return {
          notifications: state.notifications.filter(n => n.id !== id),
          unreadCount: wasUnread
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount,
        };
      });
    },

    // 清除所有通知
    clearNotifications: () =>
      set({
        notifications: [],
        unreadCount: 0,
      }),

    // 标记通知为已读
    markAsRead: (id: string) => {
      set(state => {
        const notifications = state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        );
        const unreadCount = notifications.filter(n => !n.read).length;

        return { notifications, unreadCount };
      });
    },

    // 标记所有通知为已读
    markAllAsRead: () => {
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    },

    // 添加系统提醒
    addReminder: reminderData => {
      const reminder: SystemReminder = {
        ...reminderData,
        id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        dismissed: false,
      };

      set(state => ({
        reminders: [reminder, ...state.reminders],
      }));

      // 高优先级提醒转换为通知
      if (reminder.priority === 'high' || reminder.priority === 'urgent') {
        get().addNotification({
          type: reminder.priority === 'urgent' ? 'error' : 'warning',
          title: reminder.title,
          message: reminder.message,
          priority: reminder.priority,
          persistent: reminder.priority === 'urgent',
          data: { reminderId: reminder.id },
        });
      }
    },

    // 移除系统提醒
    removeReminder: (id: string) => {
      set(state => ({
        reminders: state.reminders.filter(r => r.id !== id),
      }));
    },

    // 忽略提醒
    dismissReminder: (id: string) => {
      set(state => ({
        reminders: state.reminders.map(r =>
          r.id === id ? { ...r, dismissed: true } : r
        ),
      }));
    },

    // 暂停提醒
    snoozeReminder: (id: string, duration: number) => {
      const snoozeUntil = Date.now() + duration;
      set(state => ({
        reminders: state.reminders.map(r =>
          r.id === id ? { ...r, snoozedUntil: snoozeUntil } : r
        ),
      }));
    },

    // 清除所有提醒
    clearReminders: () => set({ reminders: [] }),

    // 显示/隐藏通知面板
    togglePanel: () => set(state => ({ showPanel: !state.showPanel })),

    // 更新通知设置
    updateSettings: newSettings => {
      set(state => ({
        settings: { ...state.settings, ...newSettings },
      }));
    },

    // 请求桌面通知权限
    requestDesktopPermission: async () => {
      if (!('Notification' in window)) {
        console.warn('此浏览器不支持桌面通知');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        return false;
      }

      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';

      if (granted) {
        get().updateSettings({ enableDesktop: true });
      }

      return granted;
    },

    // 发送桌面通知
    sendDesktopNotification: (
      title: string,
      message: string,
      options?: NotificationOptions
    ) => {
      if (
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return;
      }

      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pharmacy-system',
        requireInteraction: false,
        ...options,
      });

      // 点击通知时聚焦窗口
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // 自动关闭通知
      setTimeout(() => {
        notification.close();
      }, get().settings.defaultDuration);
    },
  }))
);

// 播放通知提示音
const playNotificationSound = () => {
  try {
    // 创建简单的提示音
    const audioContext = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.warn('无法播放提示音:', error);
  }
};

// 通知工具函数
export const createSuccessNotification = (
  title: string,
  message: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'success',
  title,
  message,
  priority: 'medium',
  duration: 3000,
});

export const createErrorNotification = (
  title: string,
  message: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'error',
  title,
  message,
  priority: 'high',
  persistent: true,
});

export const createWarningNotification = (
  title: string,
  message: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'warning',
  title,
  message,
  priority: 'medium',
  duration: 5000,
});

export const createInfoNotification = (
  title: string,
  message: string
): Omit<Notification, 'id' | 'timestamp'> => ({
  type: 'info',
  title,
  message,
  priority: 'low',
  duration: 4000,
});

// 性能优化的通知状态选择器 hooks
export const useNotifications = () =>
  useNotificationStore(state => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    showPanel: state.showPanel,
  }));

export const useReminders = () =>
  useNotificationStore(state => ({
    reminders: state.reminders.filter(
      r => !r.dismissed && (!r.snoozedUntil || r.snoozedUntil <= Date.now())
    ),
    allReminders: state.reminders,
  }));

export const useNotificationActions = () =>
  useNotificationStore(state => ({
    addNotification: state.addNotification,
    removeNotification: state.removeNotification,
    clearNotifications: state.clearNotifications,
    markAsRead: state.markAsRead,
    markAllAsRead: state.markAllAsRead,
    togglePanel: state.togglePanel,
  }));

export const useReminderActions = () =>
  useNotificationStore(state => ({
    addReminder: state.addReminder,
    removeReminder: state.removeReminder,
    dismissReminder: state.dismissReminder,
    snoozeReminder: state.snoozeReminder,
    clearReminders: state.clearReminders,
  }));

// 单独的状态选择器，避免不必要的重渲染
export const useUnreadCount = () =>
  useNotificationStore(state => state.unreadCount);
export const useNotificationPanel = () =>
  useNotificationStore(state => state.showPanel);
export const useNotificationSettings = () =>
  useNotificationStore(state => state.settings);
