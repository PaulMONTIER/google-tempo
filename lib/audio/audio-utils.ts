/**
 * Utilitaires pour la gestion audio dans Gemini Live
 * Conversions PCM, base64, et manipulation de buffers audio
 */

/**
 * Convertit des données Float32 en Int16 (format PCM)
 * @param float32Array Tableau de flottants (-1 à 1)
 * @returns Tableau Int16
 */
export function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

/**
 * Convertit des données Int16 en Float32
 * @param int16Array Tableau Int16 (PCM)
 * @returns Tableau Float32 normalisé (-1 à 1)
 */
export function int16ToFloat32(int16Array: Int16Array): Float32Array {
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    float32Array[i] = int16Array[i] / 32768.0;
  }
  return float32Array;
}

/**
 * Encode un Int16Array en base64
 * @param int16Array Données audio PCM
 * @returns Chaîne base64
 */
export function int16ToBase64(int16Array: Int16Array): string {
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

/**
 * Décode une chaîne base64 en Int16Array
 * @param base64 Chaîne base64
 * @returns Tableau Int16 (PCM)
 */
export function base64ToInt16(base64: string): Int16Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

/**
 * Décode une chaîne base64 en Float32Array pour Web Audio
 * @param base64 Chaîne base64 de données PCM
 * @returns Tableau Float32 normalisé
 */
export function base64ToFloat32(base64: string): Float32Array {
  const int16Array = base64ToInt16(base64);
  return int16ToFloat32(int16Array);
}

/**
 * Crée un AudioBuffer à partir de données Float32
 * @param audioContext Contexte audio Web
 * @param float32Data Données audio Float32
 * @param sampleRate Taux d'échantillonnage (défaut: 24000)
 * @returns AudioBuffer prêt à être joué
 */
export function createAudioBuffer(
  audioContext: AudioContext,
  float32Data: Float32Array,
  sampleRate: number = 24000
): AudioBuffer {
  const audioBuffer = audioContext.createBuffer(1, float32Data.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32Data);
  return audioBuffer;
}

/**
 * Joue un AudioBuffer et retourne une Promise
 * @param audioContext Contexte audio
 * @param audioBuffer Buffer à jouer
 * @returns Promise résolue à la fin de la lecture
 */
export function playBuffer(
  audioContext: AudioContext,
  audioBuffer: AudioBuffer
): Promise<void> {
  return new Promise((resolve) => {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => resolve();
    source.start();
  });
}

// Constantes pour les taux d'échantillonnage
export const SAMPLE_RATE_INPUT = 16000;  // Microphone -> Gemini
export const SAMPLE_RATE_OUTPUT = 24000; // Gemini -> Speakers


