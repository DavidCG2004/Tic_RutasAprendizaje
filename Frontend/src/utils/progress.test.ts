import { describe, it, expect } from 'vitest';
import { XP_PER_LEVEL, calculateLevel, levelProgress } from './progress';

describe('progress utility and XP balance', () => {
  it('XP_PER_LEVEL is calibrated to 100 XP', () => {
    expect(XP_PER_LEVEL).toBe(100);
  });

  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP and below 100 XP', () => {
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(99)).toBe(1);
    });

    it('returns level 2 for 100 XP up to 199 XP', () => {
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(150)).toBe(2);
      expect(calculateLevel(199)).toBe(2);
    });

    it('returns level 3 for 200 XP and scales linearly', () => {
      expect(calculateLevel(200)).toBe(3);
      expect(calculateLevel(250)).toBe(3);
      expect(calculateLevel(1000)).toBe(11);
    });

    it('handles negative or invalid values gracefully', () => {
      expect(calculateLevel(-50)).toBe(1);
      expect(calculateLevel(NaN)).toBe(1);
      expect(calculateLevel(undefined)).toBe(1);
    });
  });

  describe('levelProgress calculations', () => {
    it('calculates progress correctly for level 1 with 0 XP', () => {
      const result = levelProgress(0, 1);
      expect(result).toEqual({
        xpInLevel: 0,
        xpNeeded: 100,
        percent: 0,
        totalXp: 0,
      });
    });

    it('calculates progress correctly for level 1 with 50 XP (50%)', () => {
      const result = levelProgress(50, 1);
      expect(result).toEqual({
        xpInLevel: 50,
        xpNeeded: 50,
        percent: 50,
        totalXp: 50,
      });
    });

    it('calculates progress correctly for level 2 with 100 XP (0% in new level)', () => {
      const result = levelProgress(100, 2);
      expect(result).toEqual({
        xpInLevel: 0,
        xpNeeded: 100,
        percent: 0,
        totalXp: 100,
      });
    });

    it('infers level automatically via calculateLevel when level is omitted', () => {
      const result = levelProgress(100);
      expect(result).toEqual({
        xpInLevel: 0,
        xpNeeded: 100,
        percent: 0,
        totalXp: 100,
      });
    });

    it('calculates progress correctly for level 3 with 250 XP (50% in level 3)', () => {
      const result = levelProgress(250, 3);
      expect(result).toEqual({
        xpInLevel: 50,
        xpNeeded: 50,
        percent: 50,
        totalXp: 250,
      });
    });

    it('clamps percent between 0 and 100 and handles invalid inputs gracefully', () => {
      const negative = levelProgress(-20, 1);
      expect(negative.xpInLevel).toBe(0);
      expect(negative.percent).toBe(0);

      const fallback = levelProgress(undefined, undefined);
      expect(fallback.totalXp).toBe(0);
      expect(fallback.xpInLevel).toBe(0);
      expect(fallback.percent).toBe(0);
    });
  });
});
