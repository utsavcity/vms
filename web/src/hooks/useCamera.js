import { useRef, useState, useCallback, useEffect } from 'react';

const MAX_WIDTH = 800;
const QUALITY = 0.7;
const MAX_BYTES = 307200; // 300KB — same limit as before

// Browser camera replacing expo-camera + expo-image-manipulator.
// Rear camera by default; capture via canvas; returns compressed JPEG blob + base64.
export function useCamera({ facingMode = 'environment' } = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setActive(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      return true;
    } catch {
      setError('Camera permission denied or unavailable.');
      return false;
    }
  }, [facingMode]);

  // Capture current frame → compressed JPEG { blob, base64 }
  const capture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) throw new Error('Camera not ready');

    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    stop();

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', QUALITY));
    if (!blob) throw new Error('Capture failed');
    if (blob.size > MAX_BYTES) throw new Error('Photo exceeds 300KB after compression. Please retake.');

    const base64 = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });

    return { blob, base64 };
  }, [stop]);

  // Always release the camera on unmount
  useEffect(() => stop, [stop]);

  return { videoRef, active, error, start, stop, capture };
}
