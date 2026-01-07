import {
  detectSemanticType,
  detectSemanticTypeWithContext,
  shouldShowProposal,
  getProposalOptions,
  extractSubject,
  extractSport,
  buildAgentMessage,
} from '@/lib/proposals/proposal-detector';

describe('Proposal Detector - Tests unitaires', () => {
  describe('detectSemanticType', () => {
    test('détecte un examen', () => {
      expect(detectSemanticType('Examen de maths demain')).toBe('exam');
      expect(detectSemanticType('Partiel de physique')).toBe('exam');
      expect(detectSemanticType('DS de français')).toBe('exam');
      expect(detectSemanticType('Contrôle d\'histoire')).toBe('exam');
    });

    test('détecte une compétition', () => {
      expect(detectSemanticType('Marathon de Paris')).toBe('competition');
      expect(detectSemanticType('Course de 10km')).toBe('competition');
      expect(detectSemanticType('Tournoi de tennis')).toBe('competition');
      expect(detectSemanticType('Match de foot samedi')).toBe('competition');
    });

    test('détecte une deadline', () => {
      expect(detectSemanticType('Présentation client vendredi')).toBe('deadline');
      expect(detectSemanticType('Deadline rapport')).toBe('deadline');
      expect(detectSemanticType('Livraison projet')).toBe('deadline');
    });

    test('détecte une session d\'étude', () => {
      expect(detectSemanticType('Révision chapitre 3')).toBe('study');
      expect(detectSemanticType('TD de programmation')).toBe('study');
      expect(detectSemanticType('Cours de math')).toBe('study');
    });

    test('détecte un entraînement', () => {
      expect(detectSemanticType('Entraînement running')).toBe('training');
      expect(detectSemanticType('Séance de musculation')).toBe('training');
      expect(detectSemanticType('Footing du matin')).toBe('training');
    });

    test('détecte une réunion', () => {
      expect(detectSemanticType('Réunion d\'équipe')).toBe('meeting');
      expect(detectSemanticType('Standup du matin')).toBe('meeting');
      expect(detectSemanticType('Call avec le manager')).toBe('meeting');
    });

    test('retourne simple par défaut', () => {
      expect(detectSemanticType('Dentiste à 14h')).toBe('simple');
      expect(detectSemanticType('Coiffeur')).toBe('simple');
      expect(detectSemanticType('Rappeler Marie')).toBe('simple');
    });
  });

  describe('detectSemanticTypeWithContext', () => {
    test('priorise le message utilisateur', () => {
      const result = detectSemanticTypeWithContext(
        'J\'ai un examen de maths',
        'Événement'
      );
      expect(result).toBe('exam');
    });

    test('fallback sur le titre si message simple', () => {
      const result = detectSemanticTypeWithContext(
        'Crée un événement',
        'Marathon de Paris'
      );
      expect(result).toBe('competition');
    });

    test('combine message et titre pour meilleure détection', () => {
      const result = detectSemanticTypeWithContext(
        'Ajoute ça',
        'Examen final'
      );
      expect(result).toBe('exam');
    });
  });

  describe('extractSubject', () => {
    test('extrait la matière d\'un message', () => {
      expect(extractSubject('Examen de maths')).toBe('Maths');
      expect(extractSubject('Révision physique')).toBe('Physique');
      expect(extractSubject('Cours de programmation')).toBe('Programmation');
      expect(extractSubject('Étude histoire')).toBe('Histoire');
    });

    test('retourne null si pas de matière détectée', () => {
      expect(extractSubject('Réunion à 14h')).toBeNull();
      expect(extractSubject('Dentiste')).toBeNull();
    });
  });

  describe('extractSport', () => {
    test('extrait le sport d\'un message', () => {
      expect(extractSport('Entraînement running')).toBe('Running');
      expect(extractSport('Course marathon')).toBe('Marathon');
      expect(extractSport('Séance natation')).toBe('Natation');
      expect(extractSport('Match de foot')).toBe('Foot');
      expect(extractSport('Tennis samedi')).toBe('Tennis');
    });

    test('retourne null si pas de sport détecté', () => {
      expect(extractSport('Examen de maths')).toBeNull();
      expect(extractSport('Réunion')).toBeNull();
    });
  });

  describe('shouldShowProposal', () => {
    test('retourne show=true pour un examen avec confirmation', () => {
      const result = shouldShowProposal(
        'Examen de maths vendredi',
        'J\'ai noté ton examen'
      );
      expect(result.show).toBe(true);
      expect(result.semanticType).toBe('exam');
      expect(result.subject).toBe('Maths');
    });

    test('retourne show=true pour une compétition avec confirmation', () => {
      const result = shouldShowProposal(
        'Marathon dimanche',
        'C\'est noté'
      );
      expect(result.show).toBe(true);
      expect(result.semanticType).toBe('competition');
      expect(result.sport).toBe('Marathon');
    });

    test('retourne show=false pour un événement simple', () => {
      const result = shouldShowProposal(
        'Dentiste à 15h',
        'J\'ai noté ton RDV'
      );
      expect(result.show).toBe(false);
      expect(result.semanticType).toBe('simple');
    });

    test('retourne show=false pour une réunion', () => {
      const result = shouldShowProposal(
        'Réunion d\'équipe',
        'C\'est ajouté à ton calendrier'
      );
      expect(result.show).toBe(false);
      expect(result.semanticType).toBe('meeting');
    });

    test('retourne show=false si pas de confirmation assistant', () => {
      const result = shouldShowProposal(
        'Examen de maths',
        'Quand voulez-vous le planifier ?'
      );
      expect(result.show).toBe(false);
    });
  });

  describe('getProposalOptions', () => {
    test('retourne les options pour un examen', () => {
      const options = getProposalOptions('exam');
      expect(options.length).toBeGreaterThan(0);
      // Vérifier que les IDs sont générés
      expect(options[0].id).toContain('exam-');
    });

    test('retourne les options pour une compétition', () => {
      const options = getProposalOptions('competition');
      expect(options.length).toBeGreaterThan(0);
    });

    test('retourne les options pour une deadline', () => {
      const options = getProposalOptions('deadline');
      expect(options.length).toBeGreaterThan(0);
    });

    test('retourne des options basiques pour simple', () => {
      const options = getProposalOptions('simple');
      // Simple peut avoir juste l'option "créer l'événement"
      expect(Array.isArray(options)).toBe(true);
    });

    test('retourne des options basiques pour meeting', () => {
      const options = getProposalOptions('meeting');
      // Meeting peut avoir juste l'option "créer l'événement"
      expect(Array.isArray(options)).toBe(true);
    });
  });

  describe('buildAgentMessage', () => {
    test('construit un message pour program (révision)', () => {
      const message = buildAgentMessage(
        { id: '1', action: 'program', label: 'Programme', icon: '📚' },
        { eventTitle: 'Examen maths', eventDate: '2024-12-25', subject: 'maths' }
      );
      expect(message).toContain('révision');
      expect(message).toContain('maths');
      expect(message).toContain('2024-12-25');
    });

    test('construit un message pour program (sport) avec programType', () => {
      const message = buildAgentMessage(
        { id: '1', action: 'program', label: 'Programme', icon: '🏃', params: { programType: 'beginner' } },
        { eventTitle: 'Marathon', eventDate: '2024-12-25', sport: 'running' }
      );
      expect(message).toContain('entraînement');
      expect(message).toContain('débutant');
    });

    test('construit un message pour resources', () => {
      const message = buildAgentMessage(
        { id: '2', action: 'resources', label: 'Ressources', icon: '📖' },
        { eventTitle: 'Étude physique', eventDate: '', subject: 'physique' }
      );
      expect(message).toContain('ressources');
      expect(message).toContain('physique');
    });

    test('construit un message pour block_time', () => {
      const message = buildAgentMessage(
        { id: '3', action: 'block_time', label: 'Bloquer', icon: '⏰', params: { blockDuration: 60, daysBeforeDeadline: 2 } },
        { eventTitle: 'Deadline projet', eventDate: '2024-12-25' }
      );
      expect(message).toContain('Bloque');
      expect(message).toContain('60 minutes');
    });

    test('retourne chaîne vide pour just_event', () => {
      const message = buildAgentMessage(
        { id: '4', action: 'just_event', label: 'Juste l\'événement', icon: '✓' },
        { eventTitle: 'Test', eventDate: '' }
      );
      expect(message).toBe('');
    });
  });
});
