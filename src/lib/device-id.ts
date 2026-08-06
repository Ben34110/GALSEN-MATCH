"use client";

// This app has no login system — every other piece of state (favorites,
// onboarding profile, Fantasy lineup) is scoped to the browser via
// localStorage. Notification preferences and push subscriptions follow the
// same model: a random id generated once per device/browser and reused,
// rather than a real user id.
const DEVICE_ID_KEY = "galsen-match:device-id";

export function getOrCreateDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
