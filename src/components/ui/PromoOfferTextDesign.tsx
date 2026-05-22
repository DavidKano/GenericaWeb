import React, { useMemo } from 'react';
import type { PromoOffer } from '../../services/models';

interface Props {
  offer: PromoOffer;
  className?: string;
  style?: React.CSSProperties;
}

const FONTS = [
  "'Inter', sans-serif",
  "'Cinzel', serif",
  "'Playfair Display', serif",
  "'Outfit', sans-serif",
  "'Gochi Hand', cursive"
];

export const PromoOfferTextDesign: React.FC<Props> = ({ offer, className, style }) => {
  const seed = offer.designSeed || 0;
  
  const bgGradient = useMemo(() => {
    // Generate beautiful complementary HSL colors using the seed
    const hue1 = (seed * 137) % 360;
    const hue2 = (hue1 + 120 + (seed % 60)) % 360; // 120 deg apart for nice contrast
    const hue3 = (hue1 + 240 - (seed % 40)) % 360;
    
    // Saturation: 60-80%
    const sat1 = 60 + ((seed * 7) % 21);
    const sat2 = 60 + ((seed * 13) % 21);
    const sat3 = 60 + ((seed * 17) % 21);
    
    // Lightness: 75-85%
    const lgt1 = 75 + ((seed * 3) % 11);
    const lgt2 = 75 + ((seed * 11) % 11);
    const lgt3 = 75 + ((seed * 19) % 11);
    
    const color1 = `hsl(${hue1}, ${sat1}%, ${lgt1}%)`;
    const color2 = `hsl(${hue2}, ${sat2}%, ${lgt2}%)`;
    const color3 = `hsl(${hue3}, ${sat3}%, ${lgt3}%)`;
    
    // Smooth mesh gradient using three radial points plus a solid-looking linear-gradient base
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
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
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
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)', // Safari support
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '16px',
          padding: '32px 24px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
          color: '#1E293B',
          textAlign: 'center',
          zIndex: 2,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Badge Superior */}
        <span 
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#4F46E5', // Premium Indigo
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
    </div>
  );
};
