"use client";

// src/app/(dashboard)/media-library/page.tsx
// Full Media Library page — browse, filter, and manage all Cloudinary uploads

import { useState, useEffect, useCallback } from "react";
import { Image as ImageIcon, Film, Trash2, Copy, Search, RefreshCw, Upload, CheckCircle, X } from "lucide-react";
import MediaUploader, { UploadedMedia } from "@/components/MediaUploader";
import { motion, AnimatePresence } from "framer-motion";

type MediaFile = {
  public_id: string;
  url: string;
  format: string;
  resource_type: "image" | "video";
  bytes: number;
  width?: number;
  height?: number;
  created_at: string;
  tags?: string[];
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaLibraryPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filtered, setFiltered] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "video">("all");
  const [search, setSearch] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const type = typeFilter !== "all" ? `&type=${typeFilter}` : "";
      const res = await fetch(`/api/media?folder=social_media${type}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error("Media fetch error:", e);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? files.filter(f => f.public_id.toLowerCase().includes(q) || f.format.toLowerCase().includes(q))
        : files
    );
  }, [search, files]);

  const handleUploadComplete = (media: UploadedMedia) => {
    setShowUploader(false);
    fetchMedia();
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete "${file.public_id}"?`)) return;
    setDeletingId(file.public_id);
    try {
      const res = await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: file.public_id, resource_type: file.resource_type }),
      });
      if (res.ok) {
        setFiles(prev => prev.filter(f => f.public_id !== file.public_id));
        if (selectedFile?.public_id === file.public_id) setSelectedFile(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Media Library</h1>
            <p className="text-sm text-slate-500 mt-0.5">{filtered.length} file{filtered.length !== 1 ? "s" : ""} stored in Cloudinary</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchMedia} className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowUploader(v => !v)}
              className="flex items-center gap-2 bg-[#635BFF] hover:bg-[#5249e6] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Upload Panel */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800">Upload New Media</h2>
                <button onClick={() => setShowUploader(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <MediaUploader
                onUploadComplete={handleUploadComplete}
                folder="social_media"
                accept="both"
                label="Drop an image or video file here"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-2">
            {(["all", "image", "video"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  typeFilter === t
                    ? "bg-[#635BFF] text-white border-[#635BFF] shadow"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t === "all" ? "All" : t === "image" ? "🖼 Images" : "🎬 Videos"}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-6">
          {/* Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Loading media library...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
                <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700 mb-1">No media found</h3>
                <p className="text-sm text-slate-400 mb-5">Upload your first image or video to get started.</p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="bg-[#635BFF] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#5249e6] transition"
                >
                  Upload Media
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map(file => (
                  <div
                    key={file.public_id}
                    onClick={() => setSelectedFile(file)}
                    className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-slate-100 aspect-square ${
                      selectedFile?.public_id === file.public_id
                        ? "border-indigo-500 shadow-lg shadow-indigo-100"
                        : "border-transparent hover:border-slate-300"
                    }`}
                  >
                    {file.resource_type === "video" ? (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <Film className="w-10 h-10 text-white/70" />
                        <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                          {file.format}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={file.url}
                        alt={file.public_id}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(file.url, file.public_id); }}
                        className="p-1.5 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/40 transition"
                        title="Copy URL"
                      >
                        {copiedId === file.public_id ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(file); }}
                        className="p-1.5 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-red-500/80 transition"
                        title="Delete"
                      >
                        {deletingId === file.public_id
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-72 shrink-0 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit sticky top-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">File Details</h3>
                  <button onClick={() => setSelectedFile(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {selectedFile.resource_type === "video" ? (
                  <video src={selectedFile.url} controls className="w-full rounded-xl mb-4 border border-slate-100" />
                ) : (
                  <img src={selectedFile.url} alt="" className="w-full rounded-xl mb-4 border border-slate-100 object-cover max-h-48" />
                )}

                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Type</span>
                    <span className="font-semibold uppercase">{selectedFile.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Size</span>
                    <span className="font-semibold">{formatBytes(selectedFile.bytes)}</span>
                  </div>
                  {selectedFile.width && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Dimensions</span>
                      <span className="font-semibold">{selectedFile.width} × {selectedFile.height}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Uploaded</span>
                    <span className="font-semibold">{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <button
                    onClick={() => handleCopy(selectedFile.url, selectedFile.public_id)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition"
                  >
                    {copiedId === selectedFile.public_id
                      ? <><CheckCircle className="w-4 h-4 text-emerald-500" /> Copied!</>
                      : <><Copy className="w-4 h-4" /> Copy URL</>}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedFile)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" /> Delete File
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
