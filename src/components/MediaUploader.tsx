"use client";

// src/components/MediaUploader.tsx
// Reusable drag-and-drop file upload component using Cloudinary /api/upload endpoint
// Features: drag & drop, file type validation, size limits, preview, progress bar

import { useState, useRef, useCallback } from "react";
import { Upload, X, Image as ImageIcon, Film, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export type UploadedMedia = {
  url: string;
  public_id: string;
  format: string;
  resource_type: "image" | "video";
  bytes: number;
  width?: number;
  height?: number;
};

type Props = {
  onUploadComplete: (media: UploadedMedia) => void;
  onRemove?: () => void;
  currentMedia?: string;       // existing URL to preview
  folder?: string;             // Cloudinary folder
  accept?: "image" | "video" | "both";
  label?: string;
};

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const ALLOWED_IMAGE = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/quicktime", "video/avi", "video/x-msvideo"];

export default function MediaUploader({
  onUploadComplete,
  onRemove,
  currentMedia,
  folder = "social_media",
  accept = "both",
  label = "Upload Media",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentMedia || null);
  const [previewType, setPreviewType] = useState<"image" | "video">("image");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes =
    accept === "image" ? ALLOWED_IMAGE :
    accept === "video" ? ALLOWED_VIDEO :
    [...ALLOWED_IMAGE, ...ALLOWED_VIDEO];

  const acceptAttr =
    accept === "image" ? "image/*" :
    accept === "video" ? "video/*" :
    "image/*,video/*";

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${accept === "both" ? "Images & Videos" : accept}`;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File too large. Max size: ${MAX_SIZE_MB}MB (your file: ${(file.size / 1024 / 1024).toFixed(1)}MB)`;
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(10);

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setPreviewType(ALLOWED_VIDEO.includes(file.type) ? "video" : "image");

    try {
      setProgress(30);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data: UploadedMedia = await res.json();
      setProgress(100);
      setPreview(data.url);
      setPreviewType(data.resource_type);
      onUploadComplete(data);
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [folder, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }, [uploadFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onRemove) onRemove();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>

      {/* Preview area */}
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          {previewType === "video" ? (
            <video src={preview} controls className="w-full max-h-48 object-cover" />
          ) : (
            <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
          )}

          {/* Uploading overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
              <div className="w-3/4 h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-xs font-semibold">Uploading {progress}%</span>
            </div>
          )}

          {/* Remove button */}
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Success indicator */}
          {!uploading && progress === 0 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" /> Uploaded
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/40"
          }`}
        >
          <div className="flex justify-center gap-3 mb-3 text-slate-400">
            <ImageIcon className="w-7 h-7" />
            {accept !== "image" && <Film className="w-7 h-7" />}
          </div>
          <p className="text-sm font-semibold text-slate-600">
            {isDragging ? "Drop it here!" : "Drag & drop or click to upload"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {accept === "image" ? "JPEG, PNG, GIF, WEBP" :
             accept === "video" ? "MP4, MOV, AVI" :
             "Images (JPEG, PNG, GIF, WEBP) or Videos (MP4, MOV, AVI)"}
            {" "} · Max {MAX_SIZE_MB}MB
          </p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttr}
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-xs font-medium bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
