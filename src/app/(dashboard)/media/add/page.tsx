"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, ArrowLeft, Image as ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AddMediaFile() {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) simulateUpload();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) simulateUpload();
  };

  const simulateUpload = () => {
    setUploading(true);
    setTimeout(() => { setUploading(false); setUploaded(true); }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/media" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Library
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Media File</h1>
          <p className="text-slate-400 text-sm mt-1">Upload images, videos, or other files</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {uploaded ? (
          <div className="glass-panel rounded-2xl p-16 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <h2 className="text-xl font-semibold">File Uploaded Successfully!</h2>
            <p className="text-slate-400 text-sm">Your file has been added to the media library.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => setUploaded(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">Upload Another</button>
              <Link href="/media" className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg text-sm transition-colors">View Library</Link>
            </div>
          </div>
        ) : (
          <label
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`glass-panel rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center py-24 gap-4 ${dragging ? "border-primary bg-primary/10" : "border-white/15 hover:border-white/30"}`}
          >
            <input type="file" multiple className="hidden" onChange={handleFileInput}
              accept="image/*,video/*,application/pdf" />
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-slate-300 font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-white">Drop files here or click to upload</p>
                  <p className="text-sm text-slate-400 mt-1">Supports: JPG, PNG, GIF, MP4, PDF (max 10MB)</p>
                </div>
                <span className="px-5 py-2 bg-primary hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                  Select Files
                </span>
              </>
            )}
          </label>
        )}
      </motion.div>
    </div>
  );
}
