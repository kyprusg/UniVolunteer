export type EventCategory = 'EMERGENCY' | 'DONATION' | 'ECOLOGY' | 'SOCIAL';

export const CATEGORY_MULTIPLIERS: Record<string, number> = {
  EMERGENCY: 1.5,
  DONATION: 1.3,
  ECOLOGY: 1.1,
  SOCIAL: 1.0,
};

const applicationLocks = new Set<string>();

export class VolunteerScoringService {
  static calculateAccruedHours(
    baseHours: number,
    category: EventCategory,
    isLead: boolean
  ): number {
    if (baseHours < 0) {
      throw new Error('Base hours cannot be negative');
    }

    const multiplier = CATEGORY_MULTIPLIERS[category];
    if (multiplier === undefined) {
      throw new Error(`Unknown category: ${category}`);
    }

    let hours = baseHours * multiplier;

    if (isLead) {
      hours += 2.0;
    }

    return Math.round(hours * 10) / 10;
  }

  static canApply(
    currentCount: number,
    maxCapacity: number,
    isClosed: boolean
  ): boolean {
    if (isClosed) return false;
    if (currentCount >= maxCapacity) return false;
    return true;
  }

  static acquireLock(eventId: string, studentId: string): boolean {
    const lockKey = `${eventId}:${studentId}`;
    if (applicationLocks.has(lockKey)) {
      return false;
    }
    applicationLocks.add(lockKey);
    return true;
  }

  static releaseLock(eventId: string, studentId: string): void {
    const lockKey = `${eventId}:${studentId}`;
    applicationLocks.delete(lockKey);
  }

  static isLocked(eventId: string, studentId: string): boolean {
    const lockKey = `${eventId}:${studentId}`;
    return applicationLocks.has(lockKey);
  }

  static clearAllLocks(): void {
    applicationLocks.clear();
  }
}
