import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useCamera } from '../../hooks/useCamera';
import Icon from '../../components/shared/Icon';
import PhoneInput from '../../components/shared/PhoneInput';

const PURPOSES = ['Meeting', 'Courier', 'Service', 'Other'];

// Same 3-step flow as the mobile app: phone lookup → details + photo → submit.
export default function NewVisitorPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [flatId, setFlatId] = useState(null);
  const [flatSearch, setFlatSearch] = useState('');
  const [purpose, setPurpose] = useState('Meeting');
  const [flats, setFlats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [lastVisited, setLastVisited] = useState(null);
  const [existingPhoto, setExistingPhoto] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  const camera = useCamera({ facingMode: 'environment' });

  useEffect(() => {
    api.get('/api/flats').then(r => setFlats(r.data.data || [])).catch(() => {});
    return () => clearInterval(timerRef.current);
  }, []);

  async function lookupPhone(e) {
    e.preventDefault();
    if (!/^\+91[6-9]\d{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.get(`/api/visitors/lookup/${encodeURIComponent(phone)}`);
      if (res.data.found) {
        const v = res.data.data;
        setName(v.name);
        setIsReturning(true);
        setExistingPhoto(v.photo_url);
        setLastVisited(v.created_at);
      }
    } catch {}
    setLoading(false);
    setStep(2);
  }

  async function takePhoto() {
    setError('');
    try {
      const { base64 } = await camera.capture();
      setPhotoBase64(base64);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitVisitor() {
    if (!flatId) { setError('Please select a flat.'); return; }
    if (!photoBase64 && !existingPhoto) { setError('Please take a photo of the visitor.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/api/visitors', { flat_id: flatId, name, phone, purpose, photo: photoBase64 });
      const data = res.data.data;
      setResult(data);
      if (!data.isPreRegistered) {
        let secs = 120;
        setCountdown(secs);
        timerRef.current = setInterval(() => {
          secs -= 1;
          setCountdown(secs);
          if (secs <= 0) clearInterval(timerRef.current);
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to register visitor.');
    }
    setSubmitting(false);
  }

  const filteredFlats = flats.filter(f => f.flat_number.toLowerCase().includes(flatSearch.toLowerCase()));

  if (result) {
    return (
      <div style={styles.page}>
        {result.isPreRegistered ? (
          <div style={{ ...styles.banner, background: 'rgba(34,197,94,0.12)', borderLeftColor: 'var(--color-approved)', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Icon name="check" size={22} color="#15803D" />
            <span>Expected Visitor: Pre-Approved</span>
          </div>
        ) : (
          <div className="pulse" style={{ ...styles.banner, background: 'rgba(245,158,11,0.14)', borderLeftColor: 'var(--color-pending)', color: '#B45309' }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Notifying Resident...</div>
            {countdown > 0 && <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</div>}
            {countdown !== null && countdown <= 0 && <div style={{ marginTop: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="phone" size={18} color="#B45309" /> No response. Call the resident.</div>}
          </div>
        )}
        <button onClick={() => navigate(`/guard/visitor/${result.visitor.id}`)} style={styles.primaryBtn}>View Visitor Details</button>
        <button onClick={() => navigate('/guard')} style={styles.secondaryBtn}>Back to Home</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>{step === 1 ? 'Step 1: Phone Lookup' : 'Step 2: Visitor Details'}</h2>

      {step === 1 && (
        <form onSubmit={lookupPhone} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <PhoneInput value={phone} onChange={setPhone} autoFocus />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" disabled={loading} style={styles.primaryBtn}>{loading ? 'Looking up...' : 'Look Up'}</button>
        </form>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isReturning && (
            <div style={styles.returningBadge}>
              {existingPhoto && <img src={existingPhoto} alt="" style={styles.existingPhoto} />}
              <span>Returning visitor. Last visited {lastVisited ? new Date(lastVisited).toLocaleDateString('en-IN') : ''}</span>
            </div>
          )}

          <label style={styles.label}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Visitor name" />

          <label style={styles.label}>Flat Number</label>
          <input value={flatSearch} onChange={e => { setFlatSearch(e.target.value); setFlatId(null); }} placeholder="Search flat..." />
          {flatSearch && !flatId && (
            <div style={styles.dropdown}>
              {filteredFlats.slice(0, 8).map(f => (
                <div key={f.id} style={styles.dropdownItem} onClick={() => { setFlatId(f.id); setFlatSearch(f.flat_number); }}>
                  {f.flat_number}
                </div>
              ))}
            </div>
          )}

          <label style={styles.label}>Purpose</label>
          <div style={styles.chips}>
            {PURPOSES.map(p => (
              <button key={p} type="button" className="btn-inline" onClick={() => setPurpose(p)}
                style={{ ...styles.chip, ...(purpose === p ? styles.chipActive : {}) }}>
                {p}
              </button>
            ))}
          </div>

          <label style={styles.label}>Photo</label>
          {camera.active ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <video ref={camera.videoRef} autoPlay playsInline muted style={styles.video} />
              <button onClick={takePhoto} style={{ ...styles.primaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="camera" size={18} color="#fff" /> Capture</button>
              <button onClick={camera.stop} style={styles.secondaryBtn}>Cancel</button>
            </div>
          ) : photoBase64 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <img src={photoBase64} alt="Visitor" style={styles.preview} />
              <button onClick={() => { setPhotoBase64(null); camera.start(); }} style={styles.secondaryBtn}>Retake</button>
            </div>
          ) : (
            <button onClick={camera.start} style={{ ...styles.secondaryBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icon name="camera" size={18} /> Open Camera</button>
          )}
          {camera.error && <p style={styles.error}>{camera.error}</p>}
          {error && <p style={styles.error}>{error}</p>}

          <button onClick={submitVisitor} disabled={submitting} style={{ ...styles.primaryBtn, height: 64, marginTop: 8 }}>
            {submitting ? 'Submitting...' : 'Submit Visitor'}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: 16, display: 'flex', flexDirection: 'column', gap: 16 },
  title: { fontSize: 20, fontWeight: 700 },
  label: { fontSize: 13, color: 'var(--color-text-secondary)' },
  error: { color: 'var(--color-rejected)', fontSize: 14 },
  primaryBtn: { background: 'var(--color-primary)', color: '#fff', height: 52 },
  secondaryBtn: { background: 'var(--color-surface)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', height: 52 },
  dropdown: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' },
  dropdownItem: { padding: '12px 16px', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', fontFamily: 'var(--font-mono)' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: { padding: '8px 16px', borderRadius: 9999, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', fontSize: 14, width: 'auto' },
  chipActive: { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' },
  video: { width: '100%', borderRadius: 12, background: '#000' },
  preview: { width: 160, height: 160, objectFit: 'cover', borderRadius: 12 },
  returningBadge: { display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(79,142,247,0.1)', borderLeft: '4px solid var(--color-primary)', borderRadius: 8, padding: 12, color: 'var(--color-primary)', fontSize: 14 },
  existingPhoto: { width: 56, height: 56, borderRadius: 8, objectFit: 'cover' },
  banner: { borderRadius: 12, borderLeft: '4px solid', padding: 24, textAlign: 'center', fontSize: 18, fontWeight: 600 },
};
