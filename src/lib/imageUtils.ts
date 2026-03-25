"use client";

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed reading file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export function assertSmallImage(file: File, maxBytes: number) {
  if (!file.type.startsWith("image/")) throw new Error("Please select an image file.");
  if (file.size > maxBytes) throw new Error(`Image too large. Max ${(maxBytes / 1024 / 1024).toFixed(1)} MB`);
}

