import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import jsQR from 'jsqr';
import api from '../../services/api';
import { useCamera } from '../../hooks/useCamera';
import Icon from '../../components/shared/Icon';

// Two exit modes, same as mobile: QR scan or manual name/phone search.
export default function MarkExitPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // null | 'qr' | 'search'
  const [search, setSearch] = useState('');
  const [activeVisitors, setActiveVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const camera = useCamera({ facingMode: 'environment' });
  const scanRef = useRef(false);

  useEffect(() => {
    if (mode === 'search') {
      api.get('/api/guards/active-visitors').then(r => setActiveVisitors(r.data.data || [])).catch(() => {});
    }
  }, [mode]);

  // QR scan loop — sample frames and decode with jsQR
  const scanLoop = useCallback(() => {
    if (!scanRef.current) return;
    const video = camera.videoRef.current;
    if (video && video.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code?.data) {
        scanRef.current = false;
        camera.stop();
        handleQRPayload(code.data);
        return;
      }
    }
    requestAnimationFrame(scanLoop);
  }, [camera]);

  async function startQR() {
    setMode('qr');
    setError('');
    const ok = await camera.start();
    if (ok) {
      scanRef.current = true;
      requestAnimationFrame(scanLoop);
    }
  }

  function cancelQR() {
    scanRef.current = false;
    camera.stop();
    setMode(null);
  }

  async function handleQRPayload(payload) {
    setLoading(true);
    try {
      let visitorId;
      try { visitorId = JSON.parse(payload).v; } catch { throw new Error('Invalid QR code'); }
      await api.put(`/api/visitors/${visitorId}/exit/qr`, { qr_payload: payload });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Invalid QR code.');
      setMode(null);
    }
    setLoading(false);
  }

  async function markExit(visitor) {
    if (!window.confirm(`Mark exit for ${visitor.name}?`)) return;
    setLoading(true);
    try {
      await api.put(`/api/visitors/${visitor.id}/exit`);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to mark exit.');
    }
    setLoading(false);
  }

  useEffect(() => () => { scanRef.current = false; }, []);

  const filtered = activeVisitors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) || v.phone.includes(search)
  );

  if (done) {
    return (
      <div style={styles.success}>
        <Icon name="check" size={64} color="var(--color-approved)" />
        <h2 style={{ fontSize: 24, color: '#15803D' }}>Exit Recorded</h2>
        <button onClick={() => navigate('/guard')} style={styles.primaryBtn}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Mark Exit</h2>
      {error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{error}</p>}

      {!mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={startQR} style={styles.modeBtn}><Icon name="camera" size={22} color="var(--color-primary)" /> Scan QR Code</button>
          <button onClick={() => setMode('search')} style={styles.modeBtn}><Icon name="search" size={22} color="var(--color-primary)" /> Search by Name / Phone</button>
        </div>
      )}

      {mode === 'qr' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <video ref={camera.videoRef} autoPlay playsInline muted style={styles.video} />
          <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 14 }}>Point the camera at the visitor's QR code</p>
          {camera.error && <p style={{ color: 'var(--color-rejected)', fontSize: 14 }}>{camera.error}</p>}
          <button onClick={cancelQR} style={styles.secondaryBtn}>Cancel</button>
        </div>
      )}

      {mode === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name or phone..." autoFocus />
          {loading && <p style={{ color: 'var(--color-text-secondary)' }}>Working...</p>}
          {filtered.map(v => (
            <div key={v.id} className="card" style={{ cursor: 'pointer' }} onClick={() => markExit(v)}>
              <div style={{ fontWeight: 600 }}>{v.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {v.flats?.flat_number} • {v.phone}
              </div>
            </div>
          ))}
          {!filtered.length && <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', marginTop: 16 }}>No active visitors found</p>}
          <button onClick={() => setMode(null)} style={styles.secondaryBtn}>Back</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  title: { fontSize: 20, fontWeight: 700 },
  modeBtn: { height: 60, fontSize: 16, fontWeight: 600, background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: 12, boxShadow: 'var(--shadow-card)', maxWidth: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  video: { width: '100%', borderRadius: 12, background: '#000' },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff', height: 52 },
  secondaryBtn: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' },
  success: { minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
};
