import React, { useMemo } from 'react';
import type { PromoOffer } from '../../services/models';
import { X } from 'lucide-react';

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
        borderRadius: '16px',
        padding: '2.5rem 1.5rem',
        color: '#1E293B',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
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
      <div 
        className="offer-card-content"
        style={{
          width: '85%',
          background: 'rgba(255, 255, 255, 0.35)', // 35% opacity as strictly requested
          backdropFilter: 'blur(24px)', // 24px blur as strictly requested
          WebkitBackdropFilter: 'blur(24px)', // Safari support
          border: '1px solid rgba(255, 255, 255, 0.6)', // White fine border as strictly requested
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', // Soft shadow
          color: '#1E293B',
          textAlign: 'center',
          zIndex: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Minimal Transparent Close Button */}
        {onClose && (
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'transparent',
              border: 'none',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '6px',
              zIndex: 10,
              transition: 'all 0.2s ease-in-out'
            }}
            className="promo-close-icon-btn"
            title="Cerrar oferta"
          >
            <X size={20} />
          </button>
        )}

        {/* Badge Superior */}
        <span 
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748B', // Neutral gray as strictly requested
            marginBottom: '10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          🏷️ Promoción Especial
        </span>

        {/* Título */}
        <h3 
          style={{ 
            fontFamily, 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#1E293B',
            margin: '0 0 14px 0',
            lineHeight: '1.3',
            letterSpacing: '-0.5px'
          }}
        >
          {offer.textHeader}
        </h3>

        {/* Cuerpo */}
        {offer.textBody && (
          <p 
            style={{ 
              fontSize: '15px', 
              color: '#475569',
              lineHeight: '1.6',
              margin: '0 0 4px 0',
              maxWidth: '100%',
              fontFamily: "'Inter', sans-serif",
              whiteSpace: 'pre-line'
            }}
          >
            {offer.textBody}
          </p>
        )}
        
        {/* Divisor y Condiciones Legales */}
        {offer.legalDisclaimer && (
          <div 
            style={{
              width: '100%',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              paddingTop: '14px',
              marginTop: '14px'
            }}
          >
            <p 
              style={{ 
                margin: 0,
                fontSize: '11px', 
                color: '#64748B', 
                fontStyle: 'italic',
                fontFamily: "'Inter', sans-serif",
                lineHeight: '1.4',
                whiteSpace: 'pre-line'
              }}
            >
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
        .promo-close-icon-btn {
          color: #475569 !important;
          transition: all 0.2s ease-in-out;
        }
        .promo-close-icon-btn:hover {
          color: #0f172a !important;
          transform: scale(1.15);
        }
        .promo-close-icon-btn:active {
          transform: scale(0.9);
        }
      `}</style>
    </div>
  );
};
