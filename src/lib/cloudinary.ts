"use client";

export async function uploadToCloudinaryUnsigned({
  file,
}: {
  file: File;
}): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured (missing env vars).");
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed (${res.status}). ${text}`);
  }

  const data: unknown = await res.json();
  if (
    data &&
    typeof data === "object" &&
    "secure_url" in data &&
    typeof (data as { secure_url?: unknown }).secure_url === "string"
  ) {
    return (data as { secure_url: string }).secure_url;
  }

  if (
    data &&
    typeof data === "object" &&
    "url" in data &&
    typeof (data as { url?: unknown }).url === "string"
  ) {
    return (data as { url: string }).url;
  }

  throw new Error("Cloudinary upload succeeded but no URL returned.");
}

