// Modal Component
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
}

const sizeMap = {
  sm:  "max-w-sm",
  md:  "max-w-md",
  lg:  "max-w-lg",
  xl:  "max-w-2xl",
};

export function Modal({ open, onClose, title, subtitle, children, size = "md", footer }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="dialog"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`w-full ${sizeMap[size]} bg-white rounded-2xl shadow-2xl border border-slate-200 pointer-events-auto flex flex-col max-h-[90vh]`}
            >
              {/* Header */}
              {(title || subtitle) && (
                <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                  <div>
                    {title && <h2 className="text-lg font-semibold text-slate-800">{title}</h2>}
                    {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors ml-4 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Body */}
              <div className="overflow-y-auto flex-1 p-6">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="p-6 border-t border-slate-100 shrink-0 flex items-center justify-end gap-3">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
