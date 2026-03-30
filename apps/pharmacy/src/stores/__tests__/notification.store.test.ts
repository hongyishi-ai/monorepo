import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createErrorNotification,
  createInfoNotification,
  createSuccessNotification,
  createWarningNotification,
  useNotificationStore,
} from '../notification.store';

// Mock Notification API
const mockNotification = vi.fn();
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
  writable: true,
});

Object.defineProperty(Notification, 'permission', {
  value: 'default',
  writable: true,
});

Object.defineProperty(Notification, 'requestPermission', {
  value: vi.fn().mockResolvedValue('granted'),
  writable: true,
});

// Mock AudioContext
const mockAudioContext = {
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    start: vi.fn(),
    stop: vi.fn(),
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
};

Object.defineProperty(window, 'AudioContext', {
  value: vi.fn(() => mockAudioContext),
  writable: true,
});

describe('notification store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useNotificationStore.setState({
      notifications: [],
      reminders: [],
      unreadCount: 0,
      showPanel: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('notifications', () => {
    it('should add notification correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'success',
          title: '操作成功',
          message: '数据已保存',
          priority: 'medium',
        });
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].title).toBe('操作成功');
      expect(state.notifications[0].type).toBe('success');
      expect(state.unreadCount).toBe(1);
    });

    it('should remove notification correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'info',
          title: '信息',
          message: '测试消息',
          priority: 'low',
        });
      });

      const notificationId =
        useNotificationStore.getState().notifications[0].id;

      act(() => {
        store.removeNotification(notificationId);
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });

    it('should clear all notifications', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'success',
          title: '成功1',
          message: '消息1',
          priority: 'medium',
        });
        store.addNotification({
          type: 'error',
          title: '错误1',
          message: '消息2',
          priority: 'high',
        });
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(2);

      act(() => {
        store.clearNotifications();
      });

      const state = useNotificationStore.getState();
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });

    it('should mark notification as read', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'info',
          title: '信息',
          message: '测试消息',
          priority: 'low',
        });
      });

      const notificationId =
        useNotificationStore.getState().notifications[0].id;
      expect(useNotificationStore.getState().unreadCount).toBe(1);

      act(() => {
        store.markAsRead(notificationId);
      });

      const state = useNotificationStore.getState();
      expect(state.notifications[0].read).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should mark all notifications as read', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'success',
          title: '成功1',
          message: '消息1',
          priority: 'medium',
        });
        store.addNotification({
          type: 'info',
          title: '信息1',
          message: '消息2',
          priority: 'low',
        });
      });

      expect(useNotificationStore.getState().unreadCount).toBe(2);

      act(() => {
        store.markAllAsRead();
      });

      const state = useNotificationStore.getState();
      expect(state.notifications.every(n => n.read)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should auto-remove notification after duration', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'success',
          title: '成功',
          message: '自动消失',
          priority: 'medium',
          duration: 1000,
        });
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(0);
    });

    it('should not auto-remove persistent notification', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addNotification({
          type: 'error',
          title: '错误',
          message: '持久消息',
          priority: 'high',
          persistent: true,
          duration: 1000,
        });
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(useNotificationStore.getState().notifications).toHaveLength(1);
    });
  });

  describe('reminders', () => {
    it('should add reminder correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'expiry_warning',
          title: '近效期提醒',
          message: '药品即将过期',
          priority: 'medium',
          relatedId: 'medicine-1',
        });
      });

      const state = useNotificationStore.getState();
      expect(state.reminders).toHaveLength(1);
      expect(state.reminders[0].type).toBe('expiry_warning');
      expect(state.reminders[0].relatedId).toBe('medicine-1');
    });

    it('should remove reminder correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'stock_low',
          title: '库存不足',
          message: '库存低于安全值',
          priority: 'high',
        });
      });

      const reminderId = useNotificationStore.getState().reminders[0].id;

      act(() => {
        store.removeReminder(reminderId);
      });

      expect(useNotificationStore.getState().reminders).toHaveLength(0);
    });

    it('should dismiss reminder correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'stock_out',
          title: '缺货提醒',
          message: '药品已缺货',
          priority: 'urgent',
        });
      });

      const reminderId = useNotificationStore.getState().reminders[0].id;

      act(() => {
        store.dismissReminder(reminderId);
      });

      const state = useNotificationStore.getState();
      expect(state.reminders[0].dismissed).toBe(true);
    });

    it('should snooze reminder correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'system_maintenance',
          title: '系统维护',
          message: '系统将进行维护',
          priority: 'medium',
        });
      });

      const reminderId = useNotificationStore.getState().reminders[0].id;
      const snoozeDuration = 30 * 60 * 1000; // 30分钟

      act(() => {
        store.snoozeReminder(reminderId, snoozeDuration);
      });

      const state = useNotificationStore.getState();
      expect(state.reminders[0].snoozedUntil).toBeDefined();
      expect(state.reminders[0].snoozedUntil).toBeGreaterThan(Date.now());
    });

    it('should create notification for high priority reminder', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'batch_expired',
          title: '批次过期',
          message: '批次已过期',
          priority: 'urgent',
        });
      });

      const state = useNotificationStore.getState();
      expect(state.reminders).toHaveLength(1);
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0].type).toBe('error');
      expect(state.notifications[0].persistent).toBe(true);
    });

    it('should clear all reminders', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.addReminder({
          type: 'expiry_warning',
          title: '提醒1',
          message: '消息1',
          priority: 'medium',
        });
        store.addReminder({
          type: 'stock_low',
          title: '提醒2',
          message: '消息2',
          priority: 'high',
        });
      });

      expect(useNotificationStore.getState().reminders).toHaveLength(2);

      act(() => {
        store.clearReminders();
      });

      expect(useNotificationStore.getState().reminders).toHaveLength(0);
    });
  });

  describe('settings', () => {
    it('should update settings correctly', () => {
      const store = useNotificationStore.getState();

      act(() => {
        store.updateSettings({
          enableDesktop: true,
          enableSound: false,
          defaultDuration: 3000,
        });
      });

      const state = useNotificationStore.getState();
      expect(state.settings.enableDesktop).toBe(true);
      expect(state.settings.enableSound).toBe(false);
      expect(state.settings.defaultDuration).toBe(3000);
    });

    it('should toggle panel correctly', () => {
      const store = useNotificationStore.getState();

      expect(useNotificationStore.getState().showPanel).toBe(false);

      act(() => {
        store.togglePanel();
      });

      expect(useNotificationStore.getState().showPanel).toBe(true);

      act(() => {
        store.togglePanel();
      });

      expect(useNotificationStore.getState().showPanel).toBe(false);
    });

    it('should request desktop permission', async () => {
      const store = useNotificationStore.getState();

      let result;
      await act(async () => {
        result = await store.requestDesktopPermission();
      });

      expect(result).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });
  });

  describe('notification helpers', () => {
    it('should create success notification correctly', () => {
      const notification = createSuccessNotification('成功', '操作完成');

      expect(notification.type).toBe('success');
      expect(notification.title).toBe('成功');
      expect(notification.message).toBe('操作完成');
      expect(notification.priority).toBe('medium');
      expect(notification.duration).toBe(3000);
    });

    it('should create error notification correctly', () => {
      const notification = createErrorNotification('错误', '操作失败');

      expect(notification.type).toBe('error');
      expect(notification.title).toBe('错误');
      expect(notification.message).toBe('操作失败');
      expect(notification.priority).toBe('high');
      expect(notification.persistent).toBe(true);
    });

    it('should create warning notification correctly', () => {
      const notification = createWarningNotification('警告', '注意事项');

      expect(notification.type).toBe('warning');
      expect(notification.title).toBe('警告');
      expect(notification.message).toBe('注意事项');
      expect(notification.priority).toBe('medium');
      expect(notification.duration).toBe(5000);
    });

    it('should create info notification correctly', () => {
      const notification = createInfoNotification('信息', '提示内容');

      expect(notification.type).toBe('info');
      expect(notification.title).toBe('信息');
      expect(notification.message).toBe('提示内容');
      expect(notification.priority).toBe('low');
      expect(notification.duration).toBe(4000);
    });
  });
});
