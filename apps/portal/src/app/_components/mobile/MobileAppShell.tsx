'use client';

import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import {
  mobileTabs,
  mobilePosterProjects,
  mobileQuickActions,
  type MobileTabId,
} from '@/lib/mobile';
import { MobileActionDeck } from './MobileActionDeck';
import { MobileBottomTabs } from './MobileBottomTabs';
import { MobileLibraryPanel } from './MobileLibraryPanel';
import { MobileRecordsPanel } from './MobileRecordsPanel';
import { MobileTopBar } from './MobileTopBar';
import { ProjectPosterDeck } from './ProjectPosterDeck';
import {
  RouteLoadingOverlay,
  type RouteLoadingDestination,
} from './RouteLoadingOverlay';

const loadingDelayMs = 900;
const tabIds = new Set<MobileTabId>(['action', 'tools', 'records', 'library']);

function shouldUseNativeNavigation(event: MouseEvent<HTMLAnchorElement>, href: string) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.altKey ||
    event.ctrlKey ||
    event.shiftKey ||
    href.startsWith('#')
  );
}

export function MobileAppShell() {
  const [activeTab, setActiveTab] = useState<MobileTabId>('action');
  const [loadingDestination, setLoadingDestination] =
    useState<RouteLoadingDestination | null>(null);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get('tab');

    if (requestedTab && tabIds.has(requestedTab as MobileTabId)) {
      setActiveTab(requestedTab as MobileTabId);
    }
  }, []);

  const handleNavigate = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, destination: RouteLoadingDestination) => {
      if (shouldUseNativeNavigation(event, destination.href)) {
        return;
      }

      event.preventDefault();
      setLoadingDestination(destination);

      window.setTimeout(() => {
        window.location.href = destination.href;
      }, loadingDelayMs);
    },
    [],
  );

  const handleTabSelect = useCallback((tabId: MobileTabId) => {
    const tab = mobileTabs.find((item) => item.id === tabId);

    setActiveTab(tabId);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (tab) {
      window.history.replaceState(null, '', tab.href);
    }
  }, []);

  const panel = (() => {
    if (activeTab === 'tools') {
      return <ProjectPosterDeck projects={mobilePosterProjects} onNavigate={handleNavigate} />;
    }

    if (activeTab === 'records') {
      return <MobileRecordsPanel onNavigate={handleNavigate} />;
    }

    if (activeTab === 'library') {
      return <MobileLibraryPanel onNavigate={handleNavigate} />;
    }

    return <MobileActionDeck actions={mobileQuickActions} onNavigate={handleNavigate} />;
  })();

  return (
    <div className="min-h-screen bg-[#f4ecdc] text-black dark:bg-black dark:text-white">
      <MobileTopBar />
      <main className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        {panel}
      </main>
      <MobileBottomTabs activeTab={activeTab} onSelect={handleTabSelect} />
      <RouteLoadingOverlay destination={loadingDestination} />
    </div>
  );
}
