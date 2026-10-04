import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const sanitizeFilename = (name: string): string => {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '_');
  return cleaned || 'document';
};

/**
 * Downloads a PDF to local storage as "<title>.pdf" and opens the native
 * share/save sheet so the student can save it to Files/Drive/Downloads.
 * Expo's managed workflow has no direct write access to the public
 * Downloads folder, so share-to-save is the reliable cross-platform path.
 */
export async function downloadAndSharePdf(absoluteUrl: string, title: string): Promise<void> {
  const filename = `${sanitizeFilename(title)}.pdf`;
  const destination = new File(Paths.document, filename);

  let file: File;
  try {
    file = await File.downloadFileAsync(absoluteUrl, destination, { idempotent: true });
  } catch {
    throw new Error('This download link has expired. Please try again.');
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      dialogTitle: title,
    });
  }
}
