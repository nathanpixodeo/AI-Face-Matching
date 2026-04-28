import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { ValidationError } from './errors';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/bmp']);

export function getTeamUploadDir(teamId: string): string {
  return path.join(env.UPLOAD_DIR, teamId);
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export function validateImageFile(filename: string, mimetype: string): void {
  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError(`Invalid file extension: ${ext}. Allowed: ${[...ALLOWED_EXTENSIONS].join(', ')}`);
  }
  if (!ALLOWED_MIMES.has(mimetype)) {
    throw new ValidationError(`Invalid MIME type: ${mimetype}`);
  }
}

export function generateFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}${ext}`;
}

export async function saveFile(
  teamId: string,
  buffer: Buffer,
  originalName: string,
): Promise<{ filePath: string; filename: string }> {
  const dir = getTeamUploadDir(teamId);
  await ensureDir(dir);

  const filename = generateFilename(originalName);
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buffer);

  return { filePath, filename };
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch {
    // File may already be deleted
  }
}
