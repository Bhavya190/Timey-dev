"use client";

import { FormEvent, useEffect, useState } from "react";
import { countries } from "@/lib/lookups";
import type { Client } from "@/lib/clients";
import {
  FileText,
  MapPin,
  CreditCard,
  type LucideIcon,
} from "lucide-react"; // tab icons [web:34][web:40][web:13][web:11]

type Mode = "add" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onSave: (client: Client) => void;
  nextId: number;
  client?: Client | null;
};

type TabKey = "basic" | "details" | "billing";

type TabConfig = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

const tabs: TabConfig[] = [
  { key: "basic", label: "Basic", icon: FileText },
  { key: "details", label: "Details", icon: MapPin },
  { key: "billing", label: "Billing", icon: CreditCard },
];

export default function ClientModal({
  open,
  mode,
  onClose,
  onSave,
  nextId,
  client,
}: Props) {
  const isEdit = mode === "edit";

  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // Basic
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [defaultRate, setDefaultRate] = useState("");

  // Details
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [zip, setZip] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Billing
  const [fixedBidMode, setFixedBidMode] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEdit && client) {
      setName(client.name);
      setNickname(client.nickname ?? "");
      setEmail(client.email);
      setCountry(client.country || "India");
      setStatus(client.status);
      setAddress(client.address ?? "");
      setCity(client.city ?? "");
      setStateRegion(client.stateRegion ?? "");
      setZip(client.zip ?? "");
      setContactNumber(client.contactNumber ?? "");
      setDefaultRate(client.defaultRate ?? "");
      setFixedBidMode(client.fixedBidMode || false);
      setActiveTab("basic");
    } else {
      setName("");
      setNickname("");
      setEmail("");
      setDefaultRate("");
      setAddress("");
      setCountry("India");
      setCity("");
      setStateRegion("");
      setZip("");
      setContactNumber("");
      setFixedBidMode(false);
      setInvoiceFile(null);
      setStatus("Active");
      setError("");
      setActiveTab("basic");
    }
  }, [open, isEdit, client]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !country) {
      setError("Please fill all required fields (*) before saving.");
      setActiveTab("basic");
      return;
    }

    const newClient: Client = {
      id: isEdit && client ? client.id : nextId,
      name,
      nickname: nickname || undefined,
      email,
      country,
      address: address || undefined,
      city: city || undefined,
      stateRegion: stateRegion || undefined,
      zip: zip || undefined,
      contactNumber: contactNumber || undefined,
      defaultRate: defaultRate || undefined,
      fixedBidMode,
      status,
    };

    onSave(newClient);
    onClose();
  };

  const resetAndClose = () => {
    setError("");
    onClose();
  };

  const goNext = () => {
    if (activeTab === "basic") {
      if (!name || !email || !country) {
        setError("Please fill all required Basic fields (*) before continuing.");
        return;
      }
      setError("");
      setActiveTab("details");
    } else if (activeTab === "details") {
      setError("");
      setActiveTab("billing");
    }
  };

  const goBack = () => {
    if (activeTab === "details") setActiveTab("basic");
    else if (activeTab === "billing") setActiveTab("details");
  };

  const isFirstStep = activeTab === "basic";
  const isLastStep = activeTab === "billing";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-card text-foreground shadow-2xl border border-border max-h-[90vh] overflow-visible flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={resetAndClose}
            className="h-7 w-7 rounded-full border border-border text-muted hover:bg-muted"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${isActive
                  ? "text-emerald-500"
                  : "text-muted hover:text-foreground"
                  }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-background"
        >
          {activeTab === "basic" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Client Name<span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Client Nickname
                </label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Email Address<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Default Billing Rates
                </label>
                <input
                  type="number"
                  value={defaultRate}
                  onChange={(e) => setDefaultRate(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "Active" | "Inactive")
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  {countries.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  State
                </label>
                <input
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Zip Code
                </label>
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Contact Number
                </label>
                <input
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-4">
              <label className="inline-flex items-center gap-2 text-xs text-foreground">
                <input
                  type="checkbox"
                  checked={fixedBidMode}
                  onChange={(e) => setFixedBidMode(e.target.checked)}
                  className="h-4 w-4 rounded border-border bg-background"
                />
                Fixed Bid Billing Mode
              </label>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Invoice (pdf)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setInvoiceFile(e.target.files?.[0] ?? null)
                  }
                  className="block w-full text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground hover:file:bg-muted/80"
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-card">
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground hover:bg-muted"
              >
                Back
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                onClick={goNext}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Next
              </button>
            )}

            {isLastStep && (
              <button
                type="button"
                onClick={(e) => {
                  const form =
                    (e.currentTarget.parentElement
                      ?.parentElement?.previousElementSibling as HTMLFormElement) ||
                    null;
                  form?.requestSubmit();
                }}
                className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/40 hover:bg-emerald-400"
              >
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
