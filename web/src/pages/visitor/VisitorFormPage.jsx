import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SelfieCapture from '../../components/visitor/SelfieCapture';
import Icon from '../../components/shared/Icon';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VisitorFormPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formCtx, setFormCtx] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('Visit');
  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    axios.get(`${API}/api/preregistrations/form/${token}`)
      .then(res => {
        const data = res.data.data;
        setFormCtx(data);
        setName(data.visitor_name);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error?.message || 'This invite link is invalid or has expired.');
        setLoading(false);
      });
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!photo) { setSubmitError('Please take a selfie or upload a photo.'); return; }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await axios.post(`${API}/api/preregistrations/form/${token}`, { name, purpose, photo });
      navigate('/visitor/confirmation', {
        state: {
          visitor_name: name,
          flat_number: formCtx.flat_number,
          expected_date: formCtx.expected_date,
        }
      });
    } catch (err) {
      setSubmitError(err.response?.data?.error?.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  }

  if (loading) return <FullPage><Spinner /></FullPage>;

  if (error) {
    return (
      <FullPage>
        <div style={styles.errorBox}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}><Icon name="lock" size={48} color="var(--color-rejected)" /></div>
          <h2 style={styles.errorTitle}>Link Invalid or Expired</h2>
          <p style={styles.errorText}>{error}</p>
          <p style={styles.errorText}>Please contact the resident to send a new invite link.</p>
        </div>
      </FullPage>
    );
  }

  return (
    <FullPage>
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={styles.buildingName}>{formCtx.building_name || 'Utsav City'}</h1>
          <p style={styles.subtitle}>Visitor Pre-Registration • Flat {formCtx.flat_number}</p>
          <p style={styles.dateTag}>Expected visit: {formCtx.expected_date}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={styles.label}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required />
          </div>

          <div>
            <label style={styles.label}>Phone Number</label>
            <input value={formCtx.visitor_phone} readOnly style={{ color: 'var(--color-text-secondary)', cursor: 'not-allowed' }} />
          </div>

          <div>
            <label style={styles.label}>Purpose of Visit</label>
            <input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Meeting, delivery, etc." required />
          </div>

          <div>
            <label style={styles.label}>Your Photo <span style={{ color: 'var(--color-rejected)' }}>*</span></label>
            <SelfieCapture onCapture={setPhoto} onError={setPhotoError} />
            {photoError && <p style={styles.fieldError}>{photoError}</p>}
          </div>

          {submitError && <p style={{ ...styles.fieldError, padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>{submitError}</p>}

          <button type="submit" disabled={submitting} style={{ background: 'var(--color-primary)', color: '#fff', height: 52, fontSize: 16, marginTop: 8 }}>
            {submitting ? 'Submitting...' : 'Submit Details'}
          </button>
        </form>
      </div>
    </FullPage>
  );
}

function FullPage({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--color-bg)' }}>
      {children}
    </div>
  );
}

function Spinner() {
  return <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>;
}

const styles = {
  buildingName: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)' },
  subtitle: { color: 'var(--color-text-secondary)', fontSize: 14, marginTop: 4 },
  dateTag: { color: 'var(--color-primary)', fontSize: 13, marginTop: 8, fontFamily: 'var(--font-mono)' },
  label: { display: 'block', color: 'var(--color-text-secondary)', fontSize: 13, marginBottom: 6 },
  fieldError: { color: 'var(--color-rejected)', fontSize: 13, marginTop: 6 },
  errorBox: { textAlign: 'center', maxWidth: 400, padding: 24 },
  errorTitle: { fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--color-text-primary)', marginBottom: 12 },
  errorText: { color: 'var(--color-text-secondary)', marginBottom: 8 },
};
