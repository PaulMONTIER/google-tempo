import { formatTime, formatHourLabel, formatDuration } from '../time-formatters';

describe('time-formatters', () => {
  describe('formatTime', () => {
    it('should format time in 24h format by default', () => {
      const date = new Date('2024-01-15T14:30:00');
      expect(formatTime(date)).toBe('14:30');
    });

    it('should format time in 12h format when format24h is false', () => {
      const date = new Date('2024-01-15T14:30:00');
      const result = formatTime(date, false);
      expect(result).toMatch(/2:30 PM/);
    });

    it('should handle midnight correctly', () => {
      const date = new Date('2024-01-15T00:00:00');
      expect(formatTime(date)).toBe('00:00');
    });
  });

  describe('formatHourLabel', () => {
    it('should format hour label in 24h format by default', () => {
      expect(formatHourLabel(14)).toBe('14:00');
      expect(formatHourLabel(9)).toBe('09:00');
    });

    it('should format hour label in 12h format when format24h is false', () => {
      expect(formatHourLabel(14, false)).toBe('2 PM');
      expect(formatHourLabel(0, false)).toBe('12 AM');
      expect(formatHourLabel(12, false)).toBe('12 PM');
    });
  });

  describe('formatDuration', () => {
    it('should format duration with hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30min');
      expect(formatDuration(150)).toBe('2h 30min');
    });

    it('should format duration with only hours', () => {
      expect(formatDuration(120)).toBe('2h');
      expect(formatDuration(60)).toBe('1h');
    });

    it('should format duration with only minutes', () => {
      expect(formatDuration(45)).toBe('45min');
      expect(formatDuration(30)).toBe('30min');
    });
  });
});


