import React, { useMemo } from 'react';
import type { PromoOffer } from '../../services/models';

interface Props {
  offer: PromoOffer;
  className?: string;
  style?: React.CSSProperties;
}

const GRADIENTS = [
  'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)',
  'linear-gradient(135deg, #36D1DC 0%, #5B86E5 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)',
  'linear-gradient(135deg, #c31432 0%, #240b36 100%)',
  'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)',
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
  'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)', // Light pink
  'linear-gradient(120deg, #f6d365 0%, #fda085 100%)' // Warm orange
];

const FONTS = [
  "'Inter', sans-serif",
  "'Cinzel', serif",
  "'Playfair Display', serif",
  "'Outfit', sans-serif",
  "'Gochi Hand', cursive"
];

export const PromoOfferTextDesign: React.FC<Props> = ({ offer, className, style }) => {
  const seed = offer.designSeed || 0;
  
  const bgGradient = useMemo(() => GRADIENTS[seed % GRADIENTS.length], [seed]);
  const fontFamily = useMemo(() => FONTS[(seed + 1) % FONTS.length], [seed]);

  return (
    <div 
      className={`promo-text-design ${className || ''}`}
      style={{
        background: bgGradient,
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        color: '#ffffff',
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
      <div style={{ position: 'relative', zIndex: 2 }}>
        <h3 style={{ 
          fontFamily, 
          fontSize: '2rem', 
          fontWeight: 700, 
          marginBottom: '1rem',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          letterSpacing: '-0.5px'
        }}>
          {offer.textHeader}
        </h3>
        {offer.textBody && (
          <p style={{ 
            fontSize: '1.05rem', 
            opacity: 0.95,
            lineHeight: '1.5',
            margin: 0,
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
            maxWidth: '100%',
            marginLeft: 'auto',
            marginRight: 'auto',
            fontFamily: "'Inter', sans-serif" // Keep base font for readability of body
          }}>
            {offer.textBody}
          </p>
        )}
        
        {offer.legalDisclaimer && (
          <p style={{ 
            fontSize: '0.65rem', 
            opacity: 0.7, 
            marginTop: '1.5rem', 
            fontStyle: 'italic',
            fontFamily: "'Inter', sans-serif"
          }}>
            {offer.legalDisclaimer}
          </p>
        )}
      </div>
      
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-20%', left: '-10%',
        width: '60%', height: '60%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%', right: '-10%',
        width: '50%', height: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />
    </div>
  );
};
