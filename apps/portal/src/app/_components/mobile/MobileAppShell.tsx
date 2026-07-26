"use client";

import { useCallback, useEffect, useState } from "react";
import {
  mobileTabs,
  mobilePosterProjects,
  mobileQuickActions,
  type MobileTabId,
} from "@/lib/mobile";
import { MobileActionDeck } from "./MobileActionDeck";
import { MobileBottomTabs } from "./MobileBottomTabs";
import { MobileLibraryPanel } from "./MobileLibraryPanel";
import { MobileRecordsPanel } from "./MobileRecordsPanel";
import { MobileTopBar } from "./MobileTopBar";
import { ProjectPosterDeck } from "./ProjectPosterDeck";

const tabIds = new Set<MobileTabId>(["action", "tools", "records", "library"]);

export function MobileAppShell() {
  const [activeTab, setActiveTab] = useState<MobileTabId>("action");

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");

    if (requestedTab && tabIds.has(requestedTab as MobileTabId)) {
      setActiveTab(requestedTab as MobileTabId);
    }
  }, []);

  const handleTabSelect = useCallback(
    (tabId: MobileTabId) => {
      if (tabId === activeTab) {
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: reduceMotion ? "auto" : "smooth",
        });
        return;
      }

      const tab = mobileTabs.find((item) => item.id === tabId);

      setActiveTab(tabId);
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });

      if (tab) {
        window.history.replaceState(null, "", tab.href);
      }
    },
    [activeTab],
  );

  const panel = (() => {
    if (activeTab === "tools") {
      return <ProjectPosterDeck projects={mobilePosterProjects} />;
    }

    if (activeTab === "records") {
      return <MobileRecordsPanel />;
    }

    if (activeTab === "library") {
      return <MobileLibraryPanel />;
    }

    return <MobileActionDeck actions={mobileQuickActions} />;
  })();

  return (
    <div className="min-h-screen bg-[#f4ecdc] text-black dark:bg-black dark:text-white">
      <MobileTopBar />
      <main className="min-h-screen pb-[calc(env(safe-area-inset-bottom)+5rem)]">
        <div
          className="hys-home-panel-motion"
          data-home-panel={activeTab}
          key={activeTab}
        >
          {panel}
        </div>
      </main>
      <MobileBottomTabs activeTab={activeTab} onSelect={handleTabSelect} />
    </div>
  );
}
