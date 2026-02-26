// src/components/settings/SecurityForm.tsx
"use client";

import { FormEvent, useState, ChangeEvent } from "react";
import { SettingsApi, SecurityPayload } from "@/lib/settings";
import { updateAdminSecurityAction } from "@/app/actions";
import { useUser } from "@/components/UserProvider";

export default function SecurityForm() {
  const { user, refreshUser } = useUser();
  const [form, setForm] = useState<SecurityPayload>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateAdminSecurityAction(user.id, { password: form.newPassword });
      await refreshUser();

      setMessage("Security settings updated.");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err: any) {
      setError(err.message || "Failed to update security settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PasswordField
          label="Current password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleChange}
        />
        <PasswordField
          label="New password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleChange}
        />
        <PasswordField
          label="Confirm new password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium">
            Two‑factor authentication
          </p>
          <p className="text-xs text-muted">
            Add an extra layer of security to your account.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <span className="sr-only">Enable two-factor authentication</span>

          {/* peer checkbox */}
          <input
            type="checkbox"
            name="twoFactorEnabled"
            checked={form.twoFactorEnabled}
            onChange={handleChange}
            className="sr-only peer"
          />

          {/* track + knob (knob is the after: pseudo-element) */}
          <div
            className="
              w-9 h-5
              bg-muted
              rounded-full
              transition-colors
              peer-checked:bg-emerald-500
              relative
              after:content-['']
              after:absolute
              after:top-[2px]
              after:left-[2px]
              after:h-4
              after:w-4
              after:rounded-full
              after:bg-background
              after:shadow
              after:transition-all
              peer-checked:after:translate-x-4
            "
          />
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {message && (
          <p className="text-xs text-emerald-500">{message}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </form>
  );
}

type PasswordFieldProps = {
  label: string;
  name: keyof SecurityPayload;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function PasswordField({
  label,
  name,
  value,
  onChange,
}: PasswordFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">
        {label}
      </label>
      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      />
    </div>
  );
}
