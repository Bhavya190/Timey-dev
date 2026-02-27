"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

type ActionMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

export default function ActionMenu({
  isOpen,
  onClose,
  children,
  triggerRef,
}: ActionMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0, width: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
        width: rect.width,
      });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      className="absolute z-[9999] w-40 rounded-lg border border-border bg-card text-xs shadow-xl py-1 overflow-hidden"
      style={{
        top: coords.top,
        right: coords.right,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
