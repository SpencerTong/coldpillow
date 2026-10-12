import { Directory, File, Paths } from 'expo-file-system';

// Recordings live at <documents>/audio/<nightId>.m4a until transcription succeeds (step 4).

function audioDir(): Directory {
  const dir = new Directory(Paths.document, 'audio');
  if (!dir.exists) dir.create();
  return dir;
}

export function audioFileFor(nightId: string): File {
  return new File(audioDir(), `${nightId}.m4a`);
}

// Move a finished recording from the recorder's temp location to its night's file.
export async function keepRecording(tempUri: string, nightId: string): Promise<File> {
  const dest = audioFileFor(nightId);
  await new File(tempUri).move(dest);
  return dest;
}

export function discardRecording(uri: string | null): void {
  if (!uri) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
