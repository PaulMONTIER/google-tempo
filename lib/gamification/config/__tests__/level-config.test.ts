import { calculateLevel, xpForLevel } from '../level-config';

describe('Level Calculation', () => {
  test('Niveaux 1-10 : progression linéaire', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(100)).toBe(2);
    expect(calculateLevel(500)).toBe(6);
    expect(calculateLevel(900)).toBe(10);
  });
  
  test('Niveaux 11+ : progression exponentielle', () => {
    expect(calculateLevel(1000)).toBe(10);
    expect(calculateLevel(1050)).toBe(11);
    expect(calculateLevel(1200)).toBe(12);
    expect(calculateLevel(6000)).toBe(20); // Niveau 20 = 6000 XP selon la formule
  });
  
  test('Réciprocité xpForLevel / calculateLevel', () => {
    for (let level = 1; level <= 50; level++) {
      const xp = xpForLevel(level);
      const calculatedLevel = calculateLevel(xp);
      expect(calculatedLevel).toBe(level);
    }
  });
});

