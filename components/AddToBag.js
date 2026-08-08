'use client';
import { useState } from 'react';
import { useUi } from './Ui';

export default function AddToBag({ product }) {
  const { bag, addToBag } = useUi();
  const [saved, setSaved] = useState(false);
  const inBag = bag.some((b) => b.id === product.id);
  const soldOut = product.stock <= 0;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'stretch', marginBottom: 34 }}>
      <div
        className="btn-dark"
        onClick={() =>
          !soldOut &&
          addToBag({
            id: product.id,
            slug: product.slug,
            name: product.name,
            origin: `${product.city}, ${product.country}`,
            price: product.price,
            photo_id: product.photo_id,
            image_public_id: product.image_public_id,
            tone: product.tone,
            object_no: product.object_no,
          })
        }
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding: '19px 24px',
          opacity: soldOut ? 0.4 : 1,
          cursor: soldOut ? 'default' : 'pointer',
        }}
      >
        {soldOut ? 'Sold out' : inBag ? 'Added to bag ✓' : 'Add to bag'}
      </div>
      <div
        onClick={() => setSaved(!saved)}
        style={{
          cursor: 'pointer',
          border: saved ? '1px solid #111111' : '1px solid #E8E8E5',
          padding: '19px 24px',
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: saved ? '#111111' : '#6B6B68',
        }}
      >
        {saved ? '♥ Saved' : '♡ Save'}
      </div>
    </div>
  );
}
