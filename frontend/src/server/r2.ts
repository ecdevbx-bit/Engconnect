import "server-only";

import { AwsClient } from "aws4fetch";

import { env } from "./env";

// Cloudflare R2 object storage (S3-compatible API, SigV4 via aws4fetch).
// Buckets stay PRIVATE; reads go through short-lived presigned URLs.
// Used for: pronunciation recordings (pronunciation/<user>/<attempt>.wav).
// Optional — when R2_* env vars are missing, uploads are skipped.

let client: AwsClient | null = null;

function r2() {
  const cfg = env.r2();
  if (!cfg) return null;
  if (!client) {
    client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      service: "s3",
      region: "auto",
    });
  }
  return { client, cfg };
}

function objectUrl(accountId: string, bucket: string, key: string): string {
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${path}`;
}

export function r2Configured(): boolean {
  return env.r2() !== null;
}

export async function putObject(key: string, body: Uint8Array<ArrayBuffer>, contentType: string): Promise<boolean> {
  const c = r2();
  if (!c) return false;
  const res = await c.client.fetch(objectUrl(c.cfg.accountId, c.cfg.bucket, key), {
    method: "PUT",
    body,
    headers: { "Content-Type": contentType, "Content-Length": String(body.byteLength) },
  });
  if (!res.ok) {
    console.error(`[r2] put ${key} failed: ${res.status} ${(await res.text()).slice(0, 200)}`);
    return false;
  }
  return true;
}

export async function deleteObject(key: string): Promise<void> {
  const c = r2();
  if (!c) return;
  await c.client.fetch(objectUrl(c.cfg.accountId, c.cfg.bucket, key), { method: "DELETE" });
}

// Presigned GET, valid for `seconds` (default 10 min).
export async function presignGet(key: string, seconds = 600): Promise<string | null> {
  const c = r2();
  if (!c) return null;
  const url = new URL(objectUrl(c.cfg.accountId, c.cfg.bucket, key));
  url.searchParams.set("X-Amz-Expires", String(seconds));
  const signed = await c.client.sign(url.toString(), { method: "GET", aws: { signQuery: true } });
  return signed.url;
}

// Cheap connectivity check for the admin System page.
export async function r2Health(): Promise<{ configured: boolean; ok: boolean; detail: string }> {
  const c = r2();
  if (!c) return { configured: false, ok: false, detail: "R2_* env vars not set" };
  try {
    const url = `https://${c.cfg.accountId}.r2.cloudflarestorage.com/${c.cfg.bucket}?list-type=2&max-keys=1`;
    const res = await c.client.fetch(url, { method: "GET" });
    return { configured: true, ok: res.ok, detail: res.ok ? `bucket "${c.cfg.bucket}" reachable` : `HTTP ${res.status}` };
  } catch (err) {
    return { configured: true, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}
