// Google Drive integration via a service account.
//
// Set two env vars to enable it (server-side only, no per-user OAuth):
//   GOOGLE_SERVICE_ACCOUNT_JSON        (or GOOGLE_SERVICE_ACCOUNT_JSON_BASE64)
//   GOOGLE_DRIVE_FOLDER_ID             a Drive folder shared with the service
//                                      account's email (Editor access)
// Until then, `configured` is false and callers fall back gracefully.
import config from '../config.js';
import logger from './logger.js';

export const configured = config.googleDrive.configured;

let _drive = null;
async function drive() {
  if (_drive) return _drive;
  const { google } = await import('googleapis'); // lazy — only when used
  const creds = JSON.parse(config.googleDrive.serviceAccount);
  const auth = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  await auth.authorize();
  _drive = google.drive({ version: 'v3', auth });
  return _drive;
}

/** Upload (or replace) an .xlsx buffer into the configured Drive folder. */
export async function uploadXlsx(name, buffer) {
  if (!configured) throw new Error('Google Drive is not configured.');
  const { Readable } = await import('node:stream');
  const d = await drive();
  const folderId = config.googleDrive.folderId;
  const filename = name.endsWith('.xlsx') ? name : `${name}.xlsx`;

  // Replace an existing file of the same name in the folder (keep it tidy).
  const existing = await d.files.list({
    q: `name='${filename.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)', spaces: 'drive',
  });
  const media = { mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', body: Readable.from(buffer) };

  let file;
  if (existing.data.files?.length) {
    file = await d.files.update({ fileId: existing.data.files[0].id, media, fields: 'id,name,webViewLink' });
  } else {
    file = await d.files.create({ requestBody: { name: filename, parents: [folderId] }, media, fields: 'id,name,webViewLink' });
  }
  logger.info(`Drive upload: ${filename} → ${file.data.id}`);
  return { id: file.data.id, name: file.data.name, link: file.data.webViewLink };
}

/** Keyword search across files in the configured folder. */
export async function searchFiles(q) {
  if (!configured) throw new Error('Google Drive is not configured.');
  const d = await drive();
  const folderId = config.googleDrive.folderId;
  const safe = String(q || '').replace(/'/g, "\\'");
  const res = await d.files.list({
    q: `'${folderId}' in parents and trashed=false and (name contains '${safe}' or fullText contains '${safe}')`,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)', spaces: 'drive', pageSize: 25,
  });
  return res.data.files || [];
}

export default { configured, uploadXlsx, searchFiles };
