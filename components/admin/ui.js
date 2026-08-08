'use client';
import { useState } from 'react';

/* Shared back-office chrome. Kept in one place so every tab looks the same. */

export const label = {
  fontSize: 10,
  letterSpacing: '0.26em',
  textTransform: 'uppercase',
  color: '#6B6B68',
};
export const th = {
  ...label,
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #111111',
};
export const td = {
  padding: '12px 10px',
  borderBottom: '1px solid #F2F1ED',
  fontSize: 13,
  verticalAlign: 'middle',
};
export const inputStyle = {
  border: '1px solid #E8E8E5',
  padding: '10px 12px',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  background: '#FFFFFF',
  fontFamily: 'inherit',
};
export const btn = {
  cursor: 'pointer',
  background: '#111111',
  color: '#FFFDF4',
  border: 'none',
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  padding: '12px 22px',
  fontFamily: 'inherit',
};
export const btnGhost = {
  cursor: 'pointer',
  background: 'transparent',
  border: '1px solid #E8E8E5',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  padding: '11px 18px',
  color: '#4A4A47',
  fontFamily: 'inherit',
};
export const linkAction = {
  cursor: 'pointer',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #111111',
  paddingBottom: 2,
};

/**
 * Two-step delete. window.confirm blocks the automation harness (and is ugly),
 * so the confirmation happens in place: the word "Delete" becomes a question.
 */
export function InlineConfirm({ onConfirm, children = 'Delete', question = 'Delete for good?' }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!armed)
    return (
      <span
        onClick={() => setArmed(true)}
        style={{ ...linkAction, borderBottomColor: '#B3402A', color: '#B3402A' }}
      >
        {children}
      </span>
    );
  return (
    <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 11, color: '#B3402A' }}>{question}</span>
      <span
        onClick={async () => {
          setBusy(true);
          await onConfirm();
          setBusy(false);
          setArmed(false);
        }}
        style={{ ...linkAction, borderBottomColor: '#B3402A', color: '#B3402A', opacity: busy ? 0.5 : 1 }}
      >
        {busy ? 'Deleting…' : 'Yes, delete'}
      </span>
      <span onClick={() => setArmed(false)} style={{ ...linkAction, borderBottomColor: '#E8E8E5', color: '#6B6B68' }}>
        Keep
      </span>
    </span>
  );
}

/* A right-hand drawer, the same one products already use. */
export function Drawer({ title, onClose, children, width = 560 }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(17,17,17,0.3)', zIndex: 80 }} />
      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `min(${width}px,100vw)`,
          background: '#FFFFFF',
          zIndex: 90,
          overflowY: 'auto',
          padding: 36,
          animation: 'ndrawer .3s cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <h2 className="serif" style={{ fontWeight: 300, fontSize: 34, margin: 0 }}>
            {title}
          </h2>
          <div onClick={onClose} style={{ ...label, cursor: 'pointer' }}>
            Close
          </div>
        </div>
        {children}
      </aside>
    </>
  );
}

export function Field({ label: l, value, onChange, type = 'text', wide, rows }) {
  return (
    <div style={{ gridColumn: wide ? 'span 2' : undefined }}>
      <div style={{ ...label, fontSize: 9, marginBottom: 6 }}>{l}</div>
      {rows ? (
        <textarea
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          rows={rows}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          style={inputStyle}
          type={type}
          value={value ?? ''}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        />
      )}
    </div>
  );
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
