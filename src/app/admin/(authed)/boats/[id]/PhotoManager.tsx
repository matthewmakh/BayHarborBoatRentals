"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Photo = { id: string; url: string; alt: string };

const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif";
const MAX_BYTES = 15 * 1024 * 1024; // 15MB per file

type UploadJob = {
  id: string;
  filename: string;
  progress: number;
  error?: string;
};

export function PhotoManager({ boatId, initialPhotos }: { boatId: string; initialPhotos: Photo[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const list = Array.from(files);

    // Get a fresh signed upload params
    const signRes = await fetch("/api/admin/upload/sign", { method: "POST" });
    const sign = await signRes.json();
    if (!signRes.ok) {
      setError(sign.error || "Could not start upload");
      return;
    }

    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setError(`${file.name} isn't an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is over 15MB.`);
        continue;
      }
      uploadOne(file, sign);
    }
  }

  function uploadOne(
    file: File,
    sign: { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }
  ) {
    const jobId = crypto.randomUUID();
    setUploads((u) => [...u, { id: jobId, filename: file.name, progress: 0 }]);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sign.apiKey);
    fd.append("timestamp", String(sign.timestamp));
    fd.append("signature", sign.signature);
    fd.append("folder", sign.folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`);
    xhr.upload.addEventListener("progress", (ev) => {
      if (!ev.lengthComputable) return;
      const pct = Math.round((ev.loaded / ev.total) * 95); // leave 5% for our DB save
      setUploads((u) => u.map((j) => (j.id === jobId ? { ...j, progress: pct } : j)));
    });
    xhr.onload = async () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        setUploads((u) =>
          u.map((j) =>
            j.id === jobId ? { ...j, progress: 100, error: `Upload failed (${xhr.status})` } : j
          )
        );
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as { secure_url: string };
        const saveRes = await fetch(`/api/admin/boats/${boatId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data.secure_url, alt: file.name.replace(/\.[^.]+$/, "") }),
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) throw new Error(saveData.error || "Save failed");
        setPhotos((p) => [...p, { id: saveData.id, url: data.secure_url, alt: file.name }]);
        setUploads((u) => u.map((j) => (j.id === jobId ? { ...j, progress: 100 } : j)));
        // Drop completed jobs after a moment
        setTimeout(() => setUploads((u) => u.filter((j) => j.id !== jobId)), 1500);
        router.refresh();
      } catch (err) {
        setUploads((u) =>
          u.map((j) =>
            j.id === jobId ? { ...j, error: err instanceof Error ? err.message : "Save failed" } : j
          )
        );
      }
    };
    xhr.onerror = () => {
      setUploads((u) =>
        u.map((j) => (j.id === jobId ? { ...j, error: "Network error during upload" } : j))
      );
    };
    xhr.send(fd);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== id));
      router.refresh();
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= photos.length) return;
    const reordered = [...photos];
    const [item] = reordered.splice(idx, 1);
    reordered.splice(next, 0, item);
    setPhotos(reordered);
    await fetch(`/api/admin/boats/${boatId}/photos`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: reordered.map((p) => p.id) }),
    });
    router.refresh();
  }

  return (
    <div className="mt-4 grid gap-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragOver ? "border-navy-600 bg-navy-50" : "border-navy-200 bg-white hover:border-navy-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            // reset so the same file can be re-selected later
            e.target.value = "";
          }}
        />
        <div className="text-3xl">📸</div>
        <p className="mt-2 font-semibold text-navy-800">Tap or drop photos to upload</p>
        <p className="mt-1 text-sm text-navy-500">
          From your camera roll on mobile, or drag-and-drop on desktop. JPG, PNG, HEIC, WEBP up to 15MB each.
        </p>
      </div>

      {error && <p className="text-sm text-rose-700">{error}</p>}

      {/* Active uploads */}
      {uploads.length > 0 && (
        <div className="grid gap-2">
          {uploads.map((j) => (
            <div key={j.id} className="rounded-lg border border-navy-100 bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-navy-700">{j.filename}</span>
                <span className={j.error ? "text-rose-700" : "text-navy-500"}>
                  {j.error ? j.error : `${j.progress}%`}
                </span>
              </div>
              {!j.error && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                  <div
                    className="h-full bg-navy-600 transition-all"
                    style={{ width: `${j.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Existing photos grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((p, i) => (
          <div key={p.id} className="card overflow-hidden">
            <div className="aspect-[4/3] bg-navy-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt} className="h-full w-full object-cover" />
            </div>
            <div className="p-3 flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-navy-600">{p.alt || "—"}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0} className="rounded-md bg-navy-50 px-2 py-1 text-navy-700 disabled:opacity-40">↑</button>
                <button type="button" onClick={() => move(p.id, 1)} disabled={i === photos.length - 1} className="rounded-md bg-navy-50 px-2 py-1 text-navy-700 disabled:opacity-40">↓</button>
                <button type="button" onClick={() => remove(p.id)} className="rounded-md bg-rose-50 px-2 py-1 text-rose-700">×</button>
              </div>
            </div>
          </div>
        ))}
        {photos.length === 0 && uploads.length === 0 && (
          <p className="text-navy-500 text-sm">No photos yet. Upload some above.</p>
        )}
      </div>
    </div>
  );
}
