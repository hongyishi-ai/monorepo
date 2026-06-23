'use client';

import { mobileTabs, type MobileTabIcon, type MobileTabId } from '@/lib/mobile';

type MobileBottomTabsProps = {
  activeTab: MobileTabId;
  onSelect: (tab: MobileTabId) => void;
};

function TabIcon({ icon }: { icon: MobileTabIcon }) {
  const commonProps = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  };

  if (icon === 'bolt') {
    return (
      <svg {...commonProps}>
        <path d="M13 2L4 14H11L10 22L20 9H13L13 2Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (icon === 'record') {
    return (
      <svg {...commonProps}>
        <path d="M7 4H17L20 7V20H4V4H7Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M8 10H16M8 14H16M8 18H13" stroke="currentColor" strokeWidth="2.1" strokeLinecap="square" />
      </svg>
    );
  }

  if (icon === 'book') {
    return (
      <svg {...commonProps}>
        <path d="M5 4H11C12.1 4 13 4.9 13 6V20C13 19.1 12.1 18 11 18H5V4Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
        <path d="M19 4H13C11.9 4 11 4.9 11 6V20C11 19.1 11.9 18 13 18H19V4Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileBottomTabs({ activeTab, onSelect }: MobileBottomTabsProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-black bg-[#f4ecdc]/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 backdrop-blur dark:border-white/20 dark:bg-black/90" aria-label="红医师移动端导航">
      <div className="grid grid-cols-4 gap-1">
        {mobileTabs.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab.id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 font-mono text-[0.7rem] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-constructivism-red focus:ring-offset-2 focus:ring-offset-[#f4ecdc] dark:focus:ring-offset-black ${
                isActive
                  ? 'text-constructivism-red'
                  : 'text-neutral-600 dark:text-neutral-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <TabIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
