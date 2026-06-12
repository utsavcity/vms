import React, { useRef, useState, useCallback } from 'react';
import { compressToBase64 } from '../../hooks/useImageCompress';
import Icon from '../shared/Icon';

export default function SelfieCapture({ onCapture, onError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch {
      onError?.('Camera permission denied. Please allow access or upload a photo instead.');
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(t => t.stop());
    setStreaming(false);
  }

  async function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stopCamera();

    setLoading(true);
    try {
      // Convert canvas to blob then compress
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9));
      const base64 = await compressToBase64(blob);
      setPreview(base64);
      onCapture(base64);
    } catch (err) {
      onError?.(err.message);
    }
    setLoading(false);
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressToBase64(file);
      setPreview(base64);
      onCapture(base64);
    } catch (err) {
      onError?.(err.message);
    }
    setLoading(false);
  }

  function retake() {
    setPreview(null);
    onCapture(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <img src={preview} alt="Selfie" style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-approved)' }} />
          <button type="button" onClick={retake} style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)', fontSize: 14, padding: '8px 16px' }}>
            Retake Photo
          </button>
        </div>
      ) : (
        <>
          {streaming ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: 320, borderRadius: 8, background: '#000' }} />
              <button type="button" onClick={captureFrame} disabled={loading} style={{ background: 'var(--color-primary)', color: '#fff', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? 'Processing...' : <><Icon name="camera" size={18} color="#fff" /> Take Photo</>}
              </button>
              <button type="button" onClick={stopCamera} style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-text-secondary)', width: '100%' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={startCamera} style={{ background: 'var(--color-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Icon name="camera" size={18} color="#fff" /> Open Camera
              </button>
              <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13 }}>or</div>
              <label style={{ cursor: 'pointer', background: 'var(--color-surface-elevated)', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 14 }}>
                Upload Photo
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
