/**
 * Turns an uploaded file into something the model can read.
 * PDFs and images go through as-is (the model reads layout, tables and
 * drawings natively). Word and Excel are converted to text in the browser,
 * so the server only ever handles PDF, image or plain text.
 */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export const ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.xlsx,.csv,.txt,.md,application/pdf,image/*';

export interface PreparedFile {
  name: string;
  mediaType: string;
  blob: Blob;
}

export class UnsupportedFileError extends Error {}

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export async function prepareFile(file: File): Promise<PreparedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

  if (file.type === 'application/pdf' || ext === 'pdf') {
    return { name: file.name, mediaType: 'application/pdf', blob: file };
  }
  if (IMAGE_TYPES.has(file.type)) {
    return { name: file.name, mediaType: file.type, blob: file };
  }
  if (ext === 'docx') {
    const mammoth = await import('mammoth');
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return asText(file.name, value);
  }
  if (ext === 'xlsx') {
    const { default: readXlsx } = await import('read-excel-file/browser');
    const sheets = await readXlsx(file);
    const text = sheets
      .map(({ sheet, data }) => {
        const rows = data.map((row) => row.map((cell) => formatCell(cell)).join('\t'));
        return `### Sheet: ${sheet}\n${rows.join('\n')}`;
      })
      .join('\n\n');
    return asText(file.name, text);
  }
  if (['csv', 'txt', 'md'].includes(ext) || file.type.startsWith('text/')) {
    return asText(file.name, await file.text());
  }
  throw new UnsupportedFileError(file.name);
}

function asText(name: string, text: string): PreparedFile {
  return { name, mediaType: 'text/plain', blob: new Blob([text], { type: 'text/plain;charset=utf-8' }) };
}

function formatCell(cell: unknown): string {
  if (cell === null || cell === undefined) return '';
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  return String(cell);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
