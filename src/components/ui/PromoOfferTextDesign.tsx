import React, { useMemo } from 'react';
import type { PromoOffer } from '../../services/models';
import { X, Tag } from 'lucide-react';

interface Props {
  offer: PromoOffer;
  className?: string;
  style?: React.CSSProperties;
  onClose?: () => void;
}

const FONTS = [
  "'Inter', sans-serif",
  "'Cinzel', serif",
  "'Playfair Display', serif",
  "'Outfit', sans-serif",
  "'Gochi Hand', cursive"
];

export const PromoOfferTextDesign: React.FC<Props> = ({ offer, className, style, onClose }) => {
  const seed = offer.designSeed || 0;
  
  const bgGradient = useMemo(() => {
    // Generate beautiful harmonious HSL analogous colors (close in the color wheel) using the seed
    const hue1 = (seed * 137) % 360;
    // Generate analogous colors: hue2 is +30 to +45 deg, hue3 is -30 to -45 deg
    const hue2 = (hue1 + 30 + (seed % 16)) % 360;
    const hue3 = (hue1 - 30 - (seed % 16) + 360) % 360;
    
    // Saturation locked strictly to 60%, Lightness locked strictly to 85% for elegant pastels
    const color1 = `hsl(${hue1}, 60%, 85%)`;
    const color2 = `hsl(${hue2}, 60%, 85%)`;
    const color3 = `hsl(${hue3}, 60%, 85%)`;
    
    // Smooth aurora mesh gradient using radial gradients blending smoothly
    return `radial-gradient(at 0% 0%, ${color1} 0px, transparent 65%),
            radial-gradient(at 100% 0%, ${color2} 0px, transparent 65%),
            radial-gradient(at 50% 100%, ${color3} 0px, transparent 65%),
            linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }, [seed]);

  const fontFamily = useMemo(() => FONTS[(seed + 1) % FONTS.length], [seed]);

  return (
    <div 
      className={`promo-text-design ${className || ''}`}
      style={{
        background: bgGradient,
        ...style
      }}
    >
      {/* Noise Grain Texture Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAnIGhlaWdodD0nMTAwJz48ZmlsdGVyIGlkPSdub2lzZSc+PGZlVHVyYnVsZW5jZSB0eXBlPSdmcmFjdGFsTm9pc2UnIGJhc2VGcmVxdWVuY3k9JzAuNjUnIG51bU9jdGF2ZXM9JzMnIHN0aXRjaFRpbGVzPSdzdGl0Y2gnLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgZmlsdGVyPSd1cmwoI25vaXNlKScvPjwvc3ZnPg==")`,
          opacity: 0.05,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
          zIndex: 1
        }} 
      />

      {/* Glassmorphism Inner Card */}
      <div className="offer-card-content">
        {/* Minimal Transparent Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            className="promo-close-icon-btn"
            title="Cerrar oferta"
          >
            <X size={20} />
          </button>
        )}

        {/* Badge Superior */}
        <span className="offer-card-badge">
          <Tag size={12} style={{ color: '#64748B' }} />
          PROMOCIÓN ESPECIAL
        </span>

        {/* Título */}
        <h3 
          className="offer-card-title"
          style={{ fontFamily }}
        >
          {offer.textHeader}
        </h3>

        {/* Cuerpo */}
        {offer.textBody && (
          <p className="offer-card-body">
            {offer.textBody}
          </p>
        )}
        
        {/* Divisor y Condiciones Legales */}
        {offer.legalDisclaimer && (
          <div className="offer-card-legal-container">
            <p className="offer-card-legal-text">
              {offer.legalDisclaimer}
            </p>
          </div>
        )}
      </div>
      
      {/* Subtle Aurora floating blobs */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '-10%',
        width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%', right: '-10%',
        width: '45%', height: '45%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1,
        pointerEvents: 'none'
      }} />

      <style>{`
        .promo-text-design {
          border-radius: 16px;
          padding: 2.5rem 1.5rem;
          color: #1E293B;
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          min-height: 200px;
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .offer-card-content {
          width: 85%;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
          color: #1E293B;
          text-align: left;
          z-index: 2;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .offer-card-badge {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748B;
          margin-bottom: 12px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .offer-card-title {
          font-size: 24px;
          font-weight: 600;
          color: #1E293B;
          margin: 0 0 14px 0;
          line-height: 1.3;
          letter-spacing: -0.5px;
          text-align: left;
        }

        .offer-card-body {
          font-size: 15px;
          color: #475569;
          line-height: 1.6;
          margin: 0 0 4px 0;
          max-width: 100%;
          font-family: 'Inter', sans-serif;
          white-space: pre-line;
          text-align: left;
        }

        .offer-card-legal-container {
          width: 100%;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 14px;
          margin-top: 14px;
        }

        .offer-card-legal-text {
          margin: 0;
          font-size: 11px;
          color: #64748B;
          font-style: italic;
          font-family: 'Inter', sans-serif;
          line-height: 1.4;
          white-space: pre-line;
          text-align: left;
        }

        .promo-close-icon-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #475569 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 6px;
          z-index: 10;
          transition: all 0.2s ease-in-out;
        }

        .promo-close-icon-btn:hover {
          color: #0f172a !important;
          transform: scale(1.15);
        }

        .promo-close-icon-btn:active {
          transform: scale(0.9);
        }

        @media (max-width: 768px) {
          .promo-text-design {
            padding: 1.25rem 0.25rem;
          }

          .offer-card-content {
            width: 92%;
            padding: 12px;
          }

          .offer-card-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 10px 0;
          }

          .offer-card-body {
            font-size: 13.5px;
            line-height: 1.5;
          }

          .promo-close-icon-btn {
            top: 10px;
            right: 10px;
          }
        }
      `}</style>
    </div>
  );
};
