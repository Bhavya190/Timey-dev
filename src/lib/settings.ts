// src/lib/settings.ts
export type ProfilePayload = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
};

export type NotificationPayload = {
  email: boolean;
  weeklyReport: boolean;
  securityAlerts: boolean;
};

export type SecurityPayload = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
};

async function jsonFetch<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
}

export const SettingsApi = {
  updateProfile(payload: ProfilePayload) {
    return jsonFetch<ProfilePayload>("/api/settings/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  updateNotifications(payload: NotificationPayload) {
    return jsonFetch<NotificationPayload>("/api/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  updateSecurity(payload: SecurityPayload) {
    return jsonFetch<{ success: boolean }>("/api/settings/security", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
};
