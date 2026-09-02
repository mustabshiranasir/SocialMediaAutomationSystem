"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X, ChevronLeft, ChevronRight, LayoutGrid, List, Check } from "lucide-react";
import Link from "next/link";

export default function MediaLibrary() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // View States
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);

  // Bulk Select States
  const [isBulkSelect, setIsBulkSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Auto-save State
  const [savingField, setSavingField] = useState<string | null>(null);
  const [savedField, setSavedField] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/media?folder=social_media");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = files.filter(f => {
    const defaultTitle = f.public_id.split('/').pop();
    const title = f.context?.title || defaultTitle;
    return title.toLowerCase().includes(search.toLowerCase());
  });

  const selectedFile = selectedFileIndex !== null ? filtered[selectedFileIndex] : null;

  const handleDelete = async (public_id: string, resource_type: string) => {
    if (!confirm("You are about to permanently delete this item from your site.\nThis action cannot be undone.\n 'Cancel' to stop, 'OK' to delete.")) return;
    try {
      await fetch("/api/media", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id, resource_type }),
      });
      setFiles(prev => prev.filter(f => f.public_id !== public_id));
      setSelectedFileIndex(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`You are about to permanently delete ${selectedIds.length} items.\nThis action cannot be undone.`)) return;
    try {
      for (const id of selectedIds) {
        const file = files.find(f => f.public_id === id);
        if (file) {
          await fetch("/api/media", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: id, resource_type: file.resource_type }),
          });
        }
      }
      setFiles(prev => prev.filter(f => !selectedIds.includes(f.public_id)));
      setSelectedIds([]);
      setIsBulkSelect(false);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBulkSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    alert("URL Copied to clipboard!");
  };

  const nextFile = () => {
    if (selectedFileIndex !== null && selectedFileIndex < filtered.length - 1) {
      setSelectedFileIndex(selectedFileIndex + 1);
    }
  };

  const prevFile = () => {
    if (selectedFileIndex !== null && selectedFileIndex > 0) {
      setSelectedFileIndex(selectedFileIndex - 1);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  const getThumbnailUrl = (url: string) => {
    return url.replace("/upload/", "/upload/w_200,h_200,c_fill,q_auto,f_auto/");
  };

  const getPreviewUrl = (url: string) => {
    return url.replace("/upload/", "/upload/w_1200,h_1200,c_limit,q_auto,f_auto/");
  };

  const handleFieldChange = (field: string, value: string) => {
    if (!selectedFile) return;

    // Optimistic UI Update
    const updatedFiles = [...files];
    const index = updatedFiles.findIndex(f => f.public_id === selectedFile.public_id);
    if (index !== -1) {
      updatedFiles[index] = {
        ...updatedFiles[index],
        context: { ...updatedFiles[index].context, [field]: value }
      };
      setFiles(updatedFiles);
    }

    setSavingField(field);
    setSavedField(null);

    // Debounce API call
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const currentFile = updatedFiles.find(f => f.public_id === selectedFile.public_id);
        await fetch("/api/media", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            public_id: selectedFile.public_id,
            resource_type: selectedFile.resource_type,
            context: currentFile?.context || {}
          }),
        });
        setSavingField(null);
        setSavedField(field);
        setTimeout(() => setSavedField(null), 2000);
      } catch (e) {
        console.error("Save failed", e);
        setSavingField(null);
      }
    }, 1000);
  };

  return (
    <div className="bg-[#f0f0f1] min-h-screen text-[#3c434a] p-4 md:p-6 font-sans">
      
      {/* WordPress Style Header */}
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-normal text-[#1d2327]">Media Library</h1>
        <Link href="/media/add"
          className="border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 text-[13px] rounded transition-colors">
          Add New
        </Link>
      </div>

      {/* WordPress Style Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 bg-white p-2 border border-slate-200">
        <div className="flex items-center gap-2 text-[13px]">
          {/* View Toggle */}
          <div className="flex items-center border border-slate-300 rounded overflow-hidden mr-2">
            <button onClick={() => setView("list")} className={`p-1.5 ${view === 'list' ? 'bg-[#2271b1] text-white' : 'bg-[#f6f7f7] text-slate-500 hover:text-[#2271b1]'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView("grid")} className={`p-1.5 border-l border-slate-300 ${view === 'grid' ? 'bg-[#2271b1] text-white' : 'bg-[#f6f7f7] text-slate-500 hover:text-[#2271b1]'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <select className="border border-slate-300 rounded px-2 py-1 text-[#2c3338] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none">
            <option>All media items</option>
            <option>Images</option>
            <option>Video</option>
          </select>
          
          <select className="border border-slate-300 rounded px-2 py-1 text-[#2c3338] bg-white focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none">
            <option>All dates</option>
          </select>
          
          {view === 'grid' && (
            isBulkSelect ? (
              <div className="flex gap-2 ml-2">
                <button 
                  onClick={() => { setIsBulkSelect(false); setSelectedIds([]); }}
                  className="border border-slate-300 text-[#2c3338] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 rounded">
                  Cancel Selection
                </button>
                {selectedIds.length > 0 && (
                  <button 
                    onClick={handleBulkDelete}
                    className="border border-[#d63638] text-[#d63638] bg-white hover:bg-red-50 px-3 py-1 rounded font-medium">
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setIsBulkSelect(true)}
                className="border border-slate-300 text-[#2c3338] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 rounded ml-2">
                Bulk select
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-2 text-[13px]">
          <span className="text-[#2c3338]">Search media</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="border border-slate-300 rounded px-2 py-1 w-48 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none" />
        </div>
      </div>

      {/* Media Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">
           <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4">
          {filtered.map((file, idx) => {
            const defaultTitle = file.public_id.split('/').pop() || "";
            const displayTitle = file.context?.title || defaultTitle;
            const isSelected = selectedIds.includes(file.public_id);

            return (
              <div 
                key={file.public_id} 
                onClick={() => {
                  if (isBulkSelect) toggleBulkSelect(file.public_id);
                  else setSelectedFileIndex(idx);
                }}
                className={`relative aspect-square border ${isSelected ? 'border-[#2271b1] shadow-[0_0_0_3px_#2271b1]' : 'border-slate-300 hover:shadow-[0_0_0_1px_#2271b1]'} bg-white cursor-pointer transition-shadow shadow-sm group overflow-hidden`}
              >
                {/* Image */}
                <div className="h-[calc(100%-28px)] w-full flex items-center justify-center bg-slate-100 overflow-hidden">
                  {file.resource_type === "video" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-white">
                      <span className="text-xs font-mono mb-1">{file.format.toUpperCase()}</span>
                    </div>
                  ) : (
                    <img loading="lazy" src={getThumbnailUrl(file.url)} alt={displayTitle} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Always visible label (like WordPress) */}
                <div className="absolute bottom-0 left-0 right-0 h-[28px] bg-[#e6e6e6] px-2 flex items-center text-[12px] text-[#2c3338] border-t border-slate-300 truncate">
                  {displayTitle}
                </div>

                {/* Bulk Select Checkbox overlay */}
                {isBulkSelect && (
                  <div className={`absolute top-2 right-2 w-6 h-6 border rounded-sm flex items-center justify-center ${isSelected ? 'border-[#2271b1] bg-[#2271b1] text-white' : 'border-slate-300 bg-white text-transparent hover:border-[#2271b1]'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Table) */
        <div className="bg-white border border-slate-200 shadow-sm overflow-x-auto text-[13px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[#2c3338] bg-slate-50">
                <th className="p-3 w-8">
                  <input 
                    type="checkbox" 
                    className="border-slate-300 rounded-sm" 
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={() => {
                      if (selectedIds.length === filtered.length) setSelectedIds([]);
                      else setSelectedIds(filtered.map(f => f.public_id));
                    }}
                  />
                </th>
                <th className="p-3 font-semibold text-[#1d2327]">File</th>
                <th className="p-3 font-semibold text-[#1d2327]">Author</th>
                <th className="p-3 font-semibold text-[#1d2327]">Uploaded to</th>
                <th className="p-3 font-semibold text-[#1d2327]">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((file, idx) => {
                const defaultTitle = file.public_id.split('/').pop() || "";
                const displayTitle = file.context?.title || defaultTitle;
                const isSelected = selectedIds.includes(file.public_id);
                return (
                  <tr key={file.public_id} className={`border-b border-slate-200 hover:bg-slate-50/50 group ${isSelected ? 'bg-[#f0f0f1]' : ''}`}>
                    <td className="p-3">
                      <input 
                        type="checkbox" 
                        className="border-slate-300 rounded-sm" 
                        checked={isSelected}
                        onChange={() => toggleBulkSelect(file.public_id)}
                      />
                    </td>
                    <td className="p-3 flex items-start gap-3">
                      <div 
                        className="w-16 h-16 shrink-0 border border-slate-200 cursor-pointer bg-slate-100 flex items-center justify-center overflow-hidden"
                        onClick={() => setSelectedFileIndex(idx)}
                      >
                        {file.resource_type === "video" ? (
                           <span className="text-[10px] font-mono font-bold text-slate-500">{file.format.toUpperCase()}</span>
                        ) : (
                          <img loading="lazy" src={getThumbnailUrl(file.url)} alt={displayTitle} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); setSelectedFileIndex(idx); }}
                          className="font-semibold text-[#2271b1] hover:underline"
                        >
                          {displayTitle || "(no title)"}
                        </a>
                        <p className="text-slate-500 text-[12px] mt-1 truncate max-w-[200px]">{defaultTitle}.{file.format}</p>
                        
                        {/* Hover Actions */}
                        <div className="flex gap-2 text-[12px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a href="#" className="text-[#2271b1] hover:underline" onClick={(e) => { e.preventDefault(); setSelectedFileIndex(idx); }}>Edit</a>
                          <span className="text-slate-300">|</span>
                          <button className="text-[#d63638] hover:underline" onClick={() => handleDelete(file.public_id, file.resource_type)}>Delete Permanently</button>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-[#2271b1] hover:underline cursor-pointer">admin</td>
                    <td className="p-3 text-slate-500">(Unattached)</td>
                    <td className="p-3 text-slate-600">
                      {new Date(file.created_at).toISOString().split('T')[0].replace(/-/g, '/')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* WordPress Style Attachment Details Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 lg:p-8">
          <div className="bg-[#f0f0f1] w-full max-w-6xl h-full max-h-[90vh] flex flex-col shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="h-12 bg-white border-b border-slate-300 flex items-center justify-between px-4 shrink-0">
              <h2 className="text-lg font-semibold text-[#1d2327]">Attachment details</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={prevFile} 
                  disabled={selectedFileIndex === 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 border border-transparent hover:border-slate-300 rounded"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextFile} 
                  disabled={selectedFileIndex === filtered.length - 1}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 border border-transparent hover:border-slate-300 rounded"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-300 mx-2"></div>
                <button onClick={() => setSelectedFileIndex(null)} className="p-1 text-slate-500 hover:text-slate-800 border border-transparent hover:border-slate-300 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#f0f0f1]">
              
              {/* Left Side - Image Preview */}
              <div className="w-full md:w-[65%] flex flex-col items-center justify-center p-6 border-r border-slate-300 bg-[#f0f0f1] relative">
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                  {selectedFile.resource_type === "video" ? (
                    <video src={selectedFile.url} controls className="max-w-full max-h-full object-contain shadow-sm border border-slate-300 bg-black" />
                  ) : (
                    <img src={getPreviewUrl(selectedFile.url)} alt="" className="max-w-full max-h-full object-contain shadow-sm border border-slate-300 bg-[url('https://s.w.org/images/core/transparent.png')]" />
                  )}
                </div>
                <button className="mt-4 border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 text-sm rounded transition-colors self-center">
                  Edit Image
                </button>
              </div>

              {/* Right Side - Details & Forms */}
              <div className="w-full md:w-[35%] overflow-y-auto bg-[#f0f0f1] p-4 text-[13px] text-[#3c434a]">
                
                {/* Meta Info */}
                <div className="mb-4 pb-4 border-b border-slate-300 text-[12px] space-y-1">
                  <p><span className="font-semibold">Uploaded on:</span> {formatDate(selectedFile.created_at)}</p>
                  <p><span className="font-semibold">Uploaded by:</span> admin</p>
                  <p><span className="font-semibold">File name:</span> {selectedFile.public_id.split('/').pop()}.{selectedFile.format}</p>
                  <p><span className="font-semibold">File type:</span> {selectedFile.resource_type}/{selectedFile.format}</p>
                  <p><span className="font-semibold">File size:</span> {formatBytes(selectedFile.bytes)}</p>
                  {selectedFile.width && <p><span className="font-semibold">Dimensions:</span> {selectedFile.width} by {selectedFile.height} pixels</p>}
                </div>

                {/* Form Fields with Auto-Save */}
                <div className="space-y-4">
                  
                  {/* Status Indicator */}
                  <div className="flex justify-end h-4">
                    {savingField && <span className="text-[#2271b1] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Saving...</span>}
                    {savedField && <span className="text-emerald-600">Saved.</span>}
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <label className="text-right pt-1 font-medium">Alternative Text</label>
                    <div>
                      <textarea 
                        value={selectedFile.context?.alt || ""}
                        onChange={(e) => handleFieldChange("alt", e.target.value)}
                        className="w-full border border-slate-300 rounded shadow-inner p-1 h-16 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white"
                      ></textarea>
                      <p className="text-[11px] text-slate-500 mt-1"><a href="#" className="text-[#2271b1] hover:underline">Learn how to describe the purpose of the image</a>. Leave empty if the image is purely decorative.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <label className="text-right font-medium">Title</label>
                    <input 
                      type="text" 
                      value={selectedFile.context?.title || selectedFile.public_id.split('/').pop()} 
                      onChange={(e) => handleFieldChange("title", e.target.value)}
                      className="w-full border border-slate-300 rounded shadow-inner p-1 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white" 
                    />
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <label className="text-right pt-1 font-medium">Image Caption</label>
                    <textarea 
                      value={selectedFile.context?.caption || ""}
                      onChange={(e) => handleFieldChange("caption", e.target.value)}
                      className="w-full border border-slate-300 rounded shadow-inner p-1 h-16 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <label className="text-right pt-1 font-medium">Description</label>
                    <textarea 
                      value={selectedFile.context?.description || ""}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      className="w-full border border-slate-300 rounded shadow-inner p-1 h-16 focus:border-[#2271b1] focus:ring-1 focus:ring-[#2271b1] outline-none bg-white"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start pt-2">
                    <label className="text-right pt-1 font-medium">File URL:</label>
                    <div>
                      <input type="text" readOnly value={selectedFile.url} className="w-full border border-slate-300 rounded p-1 bg-slate-100 text-slate-600 mb-2 cursor-text" />
                      <button 
                        onClick={() => handleCopyUrl(selectedFile.url)}
                        className="border border-[#2271b1] text-[#2271b1] bg-[#f6f7f7] hover:bg-[#f0f0f1] px-3 py-1 text-[13px] rounded transition-colors mb-4">
                        Copy URL to clipboard
                      </button>
                      
                      <div className="flex flex-col gap-1 text-[13px]">
                        <a href="#" className="text-[#2271b1] hover:underline">View media file</a>
                        <a href="#" className="text-[#2271b1] hover:underline">Edit more details</a>
                        <a href={selectedFile.url} download target="_blank" className="text-[#2271b1] hover:underline">Download file</a>
                        <button 
                          onClick={() => handleDelete(selectedFile.public_id, selectedFile.resource_type)}
                          className="text-[#d63638] hover:text-[#d63638] hover:underline text-left mt-1"
                        >
                          Delete permanently
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
