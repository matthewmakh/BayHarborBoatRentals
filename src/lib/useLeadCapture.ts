"use client";

import { useCallback, useRef } from "react";

export type LeadSource = "booking_form" | "contact_section" | "callback_widget";

export type LeadPayload = {
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  boatId?: string;
  source: LeadSource;
};

const MIN_NAME = 2;
const MIN_PHONE_DIGITS = 7;

function digitCount(s: string | undefined): number {
  return (s || "").replace(/\D/g, "").length;
}

export function isCaptureReady(payload: { fullName?: string; phone?: string }): boolean {
  return (payload.fullName?.trim().length ?? 0) >= MIN_NAME && digitCount(payload.phone) >= MIN_PHONE_DIGITS;
}

// Returns a function the form can call on blur/submit. Throttles to one POST per `throttleMs`.
export function useLeadCapture(throttleMs = 600) {
  const lastSentAtRef = useRef(0);
  const lastPayloadRef = useRef<string>("");
  const inFlightRef = useRef<Promise<void> | null>(null);

  return useCallback(
    async (payload: LeadPayload) => {
      if (!isCaptureReady(payload)) return;
      const fingerprint = JSON.stringify(payload);
      const now = Date.now();
      // Skip if identical payload was just sent
      if (fingerprint === lastPayloadRef.current && now - lastSentAtRef.current < 30_000) return;
      // Soft throttle for rapid blurs
      if (now - lastSentAtRef.current < throttleMs && inFlightRef.current) {
        await inFlightRef.current;
      }
      lastSentAtRef.current = now;
      lastPayloadRef.current = fingerprint;
      const p = fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fingerprint,
        credentials: "same-origin",
      })
        .then(() => undefined)
        .catch(() => undefined);
      inFlightRef.current = p;
      await p;
      inFlightRef.current = null;
    },
    [throttleMs]
  );
}
