import { useCallback, useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X, AlertCircle, SwitchCamera, Image, RefreshCw } from 'lucide-react';

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB — Vercel serverless limit
const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/gif': [], 'image/webp': [] };

async function validateFileSignature(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arr = new Uint8Array(e.target.result);
        const jpeg = arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF;
        const png  = arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47;
        const gif  = arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46;
        const webp = arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46;
        resolve(jpeg || png || gif || webp);
      } catch {
        reject(new Error('Could not read file.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

function PhotoUploader({ onAnalyze, isLoading }) {
  const [tab, setTab]                   = useState('upload'); // 'upload' | 'camera'
  const [preview, setPreview]           = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [lightbox, setLightbox]         = useState(false);

  // Camera
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const [facingMode, setFacingMode]   = useState('environment');
  const [cameraOn, setCameraOn]       = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Start camera whenever camera tab is active and no preview
  useEffect(() => {
    if (tab === 'camera' && !preview) {
      startCamera();
    }
    return () => {
      if (tab === 'camera') stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, facingMode]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    stopCamera();
    setCameraError(null);
    setCameraOn(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch {
      setCameraError('Camera not available. Allow camera access or use Upload instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  function switchCamera() {
    setFacingMode(f => f === 'environment' ? 'user' : 'environment');
  }

  async function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(async blob => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopCamera();
      const url = URL.createObjectURL(file);
      setPreview(url);
      setSelectedFile(file);
      setValidationError(null);
    }, 'image/jpeg', 0.92);
  }

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setValidationError(null);
    if (rejectedFiles.length > 0) {
      const reason = rejectedFiles[0].errors[0];
      setValidationError(reason.code === 'file-too-large'
        ? 'File is too large. Maximum size is 4MB.'
        : 'Only JPEG, PNG, GIF, or WebP images are allowed.');
      return;
    }
    const file = acceptedFiles[0];
    if (!file) return;
    try {
      const valid = await validateFileSignature(file);
      if (!valid) { setValidationError('Invalid image file. Please upload a real image.'); return; }
    } catch {
      setValidationError('Could not read the file. Please try another image.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED_TYPES, maxSize: MAX_SIZE_BYTES, multiple: false, disabled: isLoading,
  });

  function handleClear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setSelectedFile(null);
    setValidationError(null);
    if (tab === 'camera') startCamera();
  }

  async function handleAnalyze() {
    if (!selectedFile || isLoading) return;
    try { await onAnalyze(selectedFile, preview); } catch {}
  }

  return (
    <div className="w-full max-w-xl mx-auto">

      {/* Tab bar — only when no preview */}
      {!preview && (
        <div className="flex rounded-xl overflow-hidden border border-white/10 mb-4">
          <button
            onClick={() => { setTab('upload'); stopCamera(); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'upload' ? 'bg-orange-500 text-black' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
          <button
            onClick={() => setTab('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors cursor-pointer ${
              tab === 'camera' ? 'bg-orange-500 text-black' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'
            }`}
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      )}

      {!preview ? (
        tab === 'upload' ? (
          /* ── Upload drop zone ── */
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-4 sm:p-10 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-orange-400 bg-orange-500/5'
                : 'border-orange-500/20 bg-white/[0.02] hover:border-orange-400/60 hover:bg-orange-500/5'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-full p-4" style={{ boxShadow: '0 0 20px rgba(249,115,22,0.15)' }}>
                <Upload className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-200 font-medium">
                  {isDragActive ? 'Drop your photo here' : 'Drag & drop a photo here'}
                </p>
                <p className="text-gray-500 text-sm mt-1">or click to browse — JPEG, PNG, WebP up to 4MB</p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Camera viewfinder ── */
          <div className="relative rounded-2xl overflow-hidden border border-orange-500/20 bg-black" style={{ minHeight: 280, boxShadow: '0 0 20px rgba(249,115,22,0.08)' }}>
            {cameraError ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-red-400">{cameraError}</p>
                <button onClick={() => setTab('upload')} className="text-xs text-orange-400 hover:text-orange-300 cursor-pointer underline">
                  Use Upload instead
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  className="w-full"
                  style={{ display: 'block', minHeight: 240, objectFit: 'cover' }}
                />

                {/* Viewfinder corners */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-7 h-7 border-t-2 border-l-2 border-orange-400/70 rounded-tl-sm" />
                  <div className="absolute top-4 right-4 w-7 h-7 border-t-2 border-r-2 border-orange-400/70 rounded-tr-sm" />
                  <div className="absolute bottom-[72px] left-4 w-7 h-7 border-b-2 border-l-2 border-orange-400/70 rounded-bl-sm" />
                  <div className="absolute bottom-[72px] right-4 w-7 h-7 border-b-2 border-r-2 border-orange-400/70 rounded-br-sm" />
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 sm:gap-8 py-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
                  <button
                    onClick={switchCamera}
                    className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-colors cursor-pointer"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-4 h-4 text-white" />
                  </button>

                  {/* Shutter button */}
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraOn}
                    className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full cursor-pointer disabled:opacity-40 active:scale-95 transition-transform flex-shrink-0"
                    style={{ background: 'white', boxShadow: '0 0 0 4px rgba(249,115,22,0.5), 0 0 24px rgba(249,115,22,0.4)' }}
                    title="Capture photo"
                  >
                    <span className="absolute inset-1.5 rounded-full" style={{ background: '#f97316' }} />
                  </button>

                  {/* Retake / balance */}
                  <button
                    onClick={startCamera}
                    className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-colors cursor-pointer"
                    title="Restart camera"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        )
      ) : (
        /* ── Preview ── */
        <div className="relative rounded-2xl overflow-hidden border border-orange-500/20" style={{ boxShadow: '0 0 20px rgba(249,115,22,0.08)' }}>
          <img
            src={preview}
            alt="Preview"
            className="w-full max-h-80 object-cover cursor-zoom-in"
            onClick={() => setLightbox(true)}
            title="Click to view full image"
          />
          <button
            onClick={handleClear}
            disabled={isLoading}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 border border-orange-500/30 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Remove photo"
          >
            <X className="w-4 h-4 text-orange-400" />
          </button>
          <div className="p-4 bg-[#0f0f0f] flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Image className="w-4 h-4" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{selectedFile?.name}</span>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/30 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              style={{ boxShadow: '0 0 16px rgba(249,115,22,0.4)' }}
            >
              {isLoading ? 'Analyzing...' : 'Analyze Photo'}
            </button>
          </div>
        </div>
      )}

      {validationError && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full p-2 transition-colors cursor-pointer"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <img
            src={preview}
            alt="Full preview"
            className="max-w-full max-h-full object-contain rounded-xl"
            style={{ boxShadow: '0 0 60px rgba(249,115,22,0.15)' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default PhotoUploader;
