// src/components/settings/ProfileForm.tsx
"use client";

import { useEffect, FormEvent, useState, ChangeEvent } from "react";
import { SettingsApi, ProfilePayload } from "@/lib/settings";
import { updateAdminSettingsAction } from "@/app/actions";
import { PencilIcon } from "lucide-react";
import { useUser } from "@/components/UserProvider";

type FieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
};

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
}: FieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <input
        type={type}
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
      />
    </div>
  );
}

export default function ProfileForm() {
  const { user, refreshUser } = useUser();
  const [form, setForm] = useState<ProfilePayload>({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    mobile: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName,
        middleName: user.middleName || "",
        lastName: user.lastName,
        email: user.email,
        mobile: user.phone,
        avatarUrl: user.avatarUrl || "",
      });
      setPreviewUrl(user.avatarUrl || null);
    }
  }, [user]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max size is 5MB.");
      return;
    }
    setError(null);
    setIsProcessingImage(true);

    // Create a local URL for immediate preview (fixes the display bug)
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Read file as base64 for final submission
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarFile(file);
      // Update form state with base64 for submission
      setForm((prev) => ({ ...prev, avatarUrl: base64String }));
      setIsProcessingImage(false);
    };
    reader.onerror = () => {
      setError("Failed to process image.");
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  }

  // trigger hidden input
  function handleOpenFilePicker() {
    const input = document.getElementById(
      "avatar-input"
    ) as HTMLInputElement | null;
    input?.click();
  }

  // initials from first + last name
  const initials =
    (form.firstName?.[0] || "").toUpperCase() +
    (form.lastName?.[0] || "").toUpperCase();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      // Mapping mobile to phone for the database
      const payload = {
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        phone: form.mobile,
        avatarUrl: form.avatarUrl,
      };

      await updateAdminSettingsAction(user!.id, payload);
      await refreshUser();

      setMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span>{initials || "?"}</span>
            )}
          </div>

          {/* small edit button */}
          <button
            type="button"
            onClick={handleOpenFilePicker}
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white shadow flex items-center justify-center hover:bg-slate-50"
          >
            <PencilIcon className="h-3 w-3 text-slate-600" />
          </button>

          {/* hidden file input */}
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Profile picture</p>
          <p className="text-[11px] text-muted">
            Click the pencil icon to upload a profile photo.
          </p>
        </div>
      </div>

      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field
          label="First name"
          name="firstName"
          value={form.firstName ?? ""}
          onChange={handleChange}
          required
        />
        <Field
          label="Middle name"
          name="middleName"
          value={form.middleName ?? ""}
          onChange={handleChange}
        />
        <Field
          label="Last name"
          name="lastName"
          value={form.lastName ?? ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Contact fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Email"
          type="email"
          name="email"
          value={form.email ?? ""}
          onChange={handleChange}
          required
        />
        <Field
          label="Mobile number"
          name="mobile"
          value={form.mobile ?? ""}
          onChange={handleChange}
          required
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || isProcessingImage}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? "Saving..." : isProcessingImage ? "Processing image..." : "Save changes"}
        </button>
        {message && (
          <p className="text-xs text-emerald-500">{message}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </form>
  );
}
