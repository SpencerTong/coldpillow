import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import type { SQLiteDatabase } from 'expo-sqlite';

import { audioFileFor } from '@/audio';
import { updateNightTranscript } from '@/db';

export type TranscribeResult =
  | { ok: true; transcript: string; ms: number }
  | { ok: false; reason: 'unsupported' | 'not-allowed' | 'no-audio' | 'empty' | 'error'; message: string };

// Transcribe a file on the device only. Resolves with the joined final text.
function recognizeFile(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = '';
    const subs = [
      ExpoSpeechRecognitionModule.addListener('result', (e) => {
        if (!e.isFinal) return;
        const chunk = e.results[0]?.transcript.trim() ?? '';
        if (!chunk) return;
        // Some iOS versions repeat the text so far in each final result; others send only the new part.
        text = chunk.startsWith(text) ? chunk : `${text} ${chunk}`.trim();
      }),
      ExpoSpeechRecognitionModule.addListener('error', (e) => {
        cleanup();
        if (e.error === 'no-speech') resolve('');
        else reject(new Error(`${e.error}: ${e.message}`));
      }),
      ExpoSpeechRecognitionModule.addListener('end', () => {
        cleanup();
        resolve(text);
      }),
    ];
    const cleanup = () => subs.forEach((s) => s.remove());

    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      requiresOnDeviceRecognition: true,
      addsPunctuation: true,
      continuous: true,
      interimResults: false,
      audioSource: { uri },
    });
  });
}

// Transcribe a voice night's recording and save it. Audio is deleted only after the
// transcript is written; on any failure the audio stays so it can be retried.
export async function transcribeNight(db: SQLiteDatabase, nightId: string): Promise<TranscribeResult> {
  if (!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
    return { ok: false, reason: 'unsupported', message: 'This phone cannot transcribe on-device.' };
  }
  const { granted } = await ExpoSpeechRecognitionModule.requestSpeechRecognizerPermissionsAsync();
  if (!granted) {
    return { ok: false, reason: 'not-allowed', message: 'Speech recognition is turned off in Settings.' };
  }
  const file = audioFileFor(nightId);
  if (!file.exists) {
    return { ok: false, reason: 'no-audio', message: 'The recording for this night is missing.' };
  }

  const started = Date.now();
  try {
    const transcript = await recognizeFile(file.uri);
    const ms = Date.now() - started;
    if (!transcript) {
      return { ok: false, reason: 'empty', message: 'No words were heard in the recording.' };
    }
    await updateNightTranscript(db, nightId, transcript);
    file.delete();
    return { ok: true, transcript, ms };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) };
  }
}
