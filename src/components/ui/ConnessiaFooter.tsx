import React from 'react';
import { APP_VERSION } from '../../version';

interface ConnessiaFooterProps {
  isDark?: boolean;
  compact?: boolean;
}

export const ConnessiaFooter: React.FC<ConnessiaFooterProps> = ({ isDark, compact }) => {
  return (
    <footer style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: compact ? '6px' : '10px',
      padding: compact ? '1rem 0.5rem' : '2rem 1rem',
      fontSize: compact ? '0.8rem' : '0.85rem',
      color: isDark ? '#9ca3af' : '#64748b',
      width: '100%',
      marginTop: 'auto',
      boxSizing: 'border-box'
    }}>
      <span style={{ opacity: compact ? 0.6 : 0.7, fontWeight: 500 }}>powered by</span>
      
      <a 
        href="https://connessia.es/" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: compact ? '5px' : '7px', 
          textDecoration: 'none', 
          transition: 'transform 0.2s ease' 
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img 
          src="/connessia-symbol.png" 
          alt="" 
          style={{ 
            height: compact ? '18px' : '22px', 
            width: 'auto', 
            display: 'block',
            mixBlendMode: 'multiply',
            filter: isDark ? 'none' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))'
          }} 
        />
        <span style={{ 
          fontWeight: 900, 
          fontSize: compact ? '0.85rem' : '1rem', 
          letterSpacing: '0.02em', 
          color: isDark ? '#fff' : '#003366',
          fontFamily: "'Inter', sans-serif"
        }}>
          CONNESSIA
        </span>
      </a>
      
      <span style={{ 
        fontSize: compact ? '0.7rem' : '0.75rem', 
        opacity: compact ? 0.4 : 0.5, 
        color: isDark ? (compact ? '#9ca3af' : 'rgba(255,255,255,0.6)') : '#64748b',
        fontWeight: 600,
        marginLeft: compact ? '2px' : '4px'
      }}>
        {APP_VERSION}
      </span>
    </footer>
  );
};
