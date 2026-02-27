"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { countries, currencies } from "@/lib/lookups";
import type { Employee as EmployeeSummary } from "@/lib/employees";
import type { Employee as EmployeeProfile, Role } from "@/lib/users";
import {
  UserCircle,
  IdentificationBadge,
  CurrencyDollar,
} from "@phosphor-icons/react";

type Mode = "add" | "edit";

type Props = {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onSave: (employee: any) => void;
  nextCode: string;
  employee?: EmployeeSummary | null;
};

type TabKey = "basic" | "details" | "billing";

function getTodayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AddEmployeeModal({
  open,
  mode,
  onClose,
  onSave,
  nextCode,
  employee,
}: Props) {
  const isEdit = mode === "edit";

  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  // Basic
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(nextCode); // internal only
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "employee" | "teamLead">(
    "employee"
  );
  const [department, setDepartment] = useState("Default Department");
  const [location, setLocation] = useState("Default Location");
  const [shift, setShift] = useState<"day" | "evening" | "night">("day");

  // Details
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [country, setCountry] = useState("India");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [terminationDate, setTerminationDate] = useState("");

  // Billing
  const [workType, setWorkType] = useState<"standard" | "overtime">("standard");
  const [billingType, setBillingType] = useState<"hourly" | "monthly">(
    "hourly"
  );
  const [employeeRate, setEmployeeRate] = useState("");
  const [employeeCurrency, setEmployeeCurrency] = useState(
    "INR - Indian Rupee"
  );
  const [billingRateType, setBillingRateType] = useState<"fixed" | "hourly">(
    "fixed"
  );
  const [billingCurrency, setBillingCurrency] = useState(
    "INR - Indian Rupee"
  );
  const [billingStart, setBillingStart] = useState("");
  const [billingEnd, setBillingEnd] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    if (isEdit && employee) {
      setEmail(employee.email);
      setCode(employee.code);
      setFirstName(employee.firstName);
      setMiddleName(employee.middleName || "");
      setLastName(employee.lastName);
      setRole((employee.role as any) || "employee");
      setDepartment(employee.department);
      setLocation(employee.location);
      setShift((employee.shift as any) || "day");
      setAddress(employee.address || "");
      setCity(employee.city || "");
      setStateRegion(employee.stateRegion || "");
      setCountry(employee.country || "India");
      setZip(employee.zip || "");
      setPhone(employee.phone || "");
      setHireDate(employee.hireDate || "");
      setTerminationDate(employee.terminationDate || "");
      setWorkType((employee.workType as any) || "standard");
      setBillingType((employee.billingType as any) || "hourly");
      setEmployeeRate(employee.employeeRate || "");
      setEmployeeCurrency(employee.employeeCurrency || "INR - Indian Rupee");
      setBillingRateType((employee.billingRateType as any) || "fixed");
      setBillingCurrency(employee.billingCurrency || "INR - Indian Rupee");
      setBillingStart(employee.billingStart || "");
      setBillingEnd(employee.billingEnd || "");
      setActiveTab("basic");
      setError("");
    } else if (!isEdit) {
      setEmail("");
      setCode(nextCode);
      setFirstName("");
      setMiddleName("");
      setLastName("");
      setPassword("");
      setRole("employee");
      setDepartment("Default Department");
      setLocation("Default Location");
      setShift("day"); // default shift
      setAddress("");
      setCity("");
      setStateRegion("");
      setCountry("India");
      setZip("");
      setPhone("");
      setHireDate(getTodayISODate()); // default today
      setTerminationDate("");
      setWorkType("standard");
      setBillingType("hourly");
      setEmployeeRate("");
      setEmployeeCurrency("INR - Indian Rupee");
      setBillingRateType("fixed");
      setBillingCurrency("INR - Indian Rupee");
      setBillingStart("");
      setBillingEnd("");
      setActiveTab("basic");
      setError("");
    }
  }, [open, isEdit, employee, nextCode]);

  if (!open) return null;

  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");

  const validateBasic = () => {
    if (!email || !code || !department) {
      setError("Please fill all required Basic fields (*) before continuing.");
      return false;
    }
    if (!isEdit && (!firstName || !lastName)) {
      setError("Please complete all required Basic fields for a new employee.");
      return false;
    }
    return true;
  };

  const validateDetails = () => {
    // all optional now; no blocking validation
    return true;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateBasic()) return;
    if (!validateDetails()) return;

    const baseName = fullName || employee?.name || email;

    const fullEmployeeData: any = {
      firstName,
      middleName,
      lastName,
      email,
      role,
      department,
      location,
      shift,
      address,
      city,
      stateRegion,
      country,
      zip,
      phone,
      hireDate,
      terminationDate,
      workType,
      billingType,
      employeeRate,
      employeeCurrency,
      billingRateType,
      billingCurrency,
      billingStart,
      billingEnd,
      code,
    };

    onSave(fullEmployeeData);
    onClose();
  };

  const resetAndClose = () => {
    setError("");
    onClose();
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    {
      key: "basic",
      label: "Basic",
      icon: <UserCircle className="w-4 h-4" />,
    },
    {
      key: "details",
      label: "Details",
      icon: <IdentificationBadge className="w-4 h-4" />,
    },
    {
      key: "billing",
      label: "Billing",
      icon: <CurrencyDollar className="w-4 h-4" />,
    },
  ];

  const goNext = () => {
    if (activeTab === "basic") {
      if (!validateBasic()) return;
      setError("");
      setActiveTab("details");
    } else if (activeTab === "details") {
      if (!validateDetails()) return;
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
      <div className="relative w-full max-w-4xl rounded-2xl bg-card text-foreground shadow-2xl border border-border max-h-[90vh] overflow-visible flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit Employee" : "Add Employee"}
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
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-3 py-3 text-sm font-medium ${activeTab === tab.key
                ? "text-emerald-500"
                : "text-muted hover:text-foreground"
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {activeTab === "basic" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Employee Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    First Name
                    {!isEdit && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    required={!isEdit}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Middle Name
                  </label>
                  <input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Last Name
                    {!isEdit && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    required={!isEdit}
                  />
                </div>


                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Role<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(
                        e.target.value as "admin" | "employee" | "teamLead"
                      )
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  >
                    <option value="employee">Employee</option>
                    <option value="teamLead">Team Lead</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Department<span className="text-red-500">*</span>
                  </label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">
                    Shift
                  </label>
                  <select
                    value={shift}
                    onChange={(e) =>
                      setShift(e.target.value as "day" | "evening" | "night")
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  >
                    <option value="day">Day Shift</option>
                    <option value="evening">Evening Shift</option>
                    <option value="night">Night Shift</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  City
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  State
                </label>
                <input
                  value={stateRegion}
                  onChange={(e) => setStateRegion(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Country
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Zip Code
                </label>
                <input
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Phone Number
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Hire Date
                </label>
                <input
                  type="date"
                  value={hireDate}
                  onChange={(e) => setHireDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Termination Date
                </label>
                <input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Work Type
                </label>
                <select
                  value={workType}
                  onChange={(e) =>
                    setWorkType(e.target.value as "standard" | "overtime")
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="standard">Standard</option>
                  <option value="overtime">Overtime</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing Type
                </label>
                <select
                  value={billingType}
                  onChange={(e) =>
                    setBillingType(e.target.value as "hourly" | "monthly")
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="hourly">Hourly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Employee Rate
                </label>
                <input
                  type="number"
                  value={employeeRate}
                  onChange={(e) => setEmployeeRate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Employee Currency
                </label>
                <select
                  value={employeeCurrency}
                  onChange={(e) => setEmployeeCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing Rate
                </label>
                <select
                  value={billingRateType}
                  onChange={(e) =>
                    setBillingRateType(e.target.value as "fixed" | "hourly")
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  <option value="fixed">Fixed</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing Rate Currency
                </label>
                <select
                  value={billingCurrency}
                  onChange={(e) => setBillingCurrency(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                >
                  {currencies.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing Rate Start Date
                </label>
                <input
                  type="date"
                  value={billingStart}
                  onChange={(e) => setBillingStart(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Billing Rate End Date
                </label>
                <input
                  type="date"
                  value={billingEnd}
                  onChange={(e) => setBillingEnd(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40"
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

        {/* Footer (step controls) */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3">
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
                type="submit"
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
