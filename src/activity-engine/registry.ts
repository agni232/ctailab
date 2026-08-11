import type { ActivityResult, RegisteredActivity } from "@/activity-engine/types";
import { CipherActivity } from "@/activity-engine/cipher/CipherActivity";
import { cipherEngine } from "@/activity-engine/cipher/cipher.engine";

const registry = new Map<string, RegisteredActivity<unknown, unknown, unknown, ActivityResult>>();

export function registerActivity<TConfig, TState, TAnswer, TResult extends ActivityResult>(
  activity: RegisteredActivity<TConfig, TState, TAnswer, TResult>
): void {
  if (registry.has(activity.type)) {
    throw new Error(`Activity type already registered: ${activity.type}`);
  }

  registry.set(activity.type, activity as RegisteredActivity<unknown, unknown, unknown, ActivityResult>);
}

export function getActivityImplementation(activityType: string): RegisteredActivity | undefined {
  return registry.get(activityType);
}

export function requireActivityImplementation(activityType: string): RegisteredActivity {
  const activity = getActivityImplementation(activityType);

  if (!activity) {
    throw new Error(`No activity registered for type: ${activityType}`);
  }

  return activity;
}

export function listRegisteredActivityTypes(): string[] {
  return Array.from(registry.keys()).sort();
}

registerActivity({
  type: "cipher",
  version: 3,
  component: CipherActivity,
  engine: cipherEngine
});
