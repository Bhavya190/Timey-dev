// src/components/settings/SettingsTabs.tsx
"use client";

import { useState } from "react";
import ProfileForm from "./ProfileForm";
import NotificationForm from "./NotificationForm";
import SecurityForm from "./SecurityForm";

type TabKey = "profile" | "notification" | "security";

const tabs: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "notification", label: "Notification" },
  { key: "security", label: "Security" },
];

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-semibold">
          Settings
        </h1>
      </div>

      <div className="rounded-2xl border border-border bg-card/95 shadow-sm">
        {/* Tabs header */}
        <div className="flex border-b border-border px-4 pt-3">
          <div className="inline-flex rounded-full bg-background/60 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-colors ${
                  activeTab === tab.key
                    ? "bg-emerald-500 text-slate-950"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 md:p-6">
          {activeTab === "profile" && <ProfileForm />}
          {activeTab === "notification" && <NotificationForm />}
          {activeTab === "security" && <SecurityForm />}
        </div>
      </div>
    </div>
  );
}
