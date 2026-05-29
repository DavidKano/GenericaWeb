import React from 'react';
import { APP_VERSION } from '../../version';

interface ConnessiaFooterProps {
  isDark?: boolean;
  compact?: boolean;
}

export const ConnessiaFooter: React.FC<ConnessiaFooterProps> = ({ isDark, compact }) => {
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        marginTop: '1.2rem',
        paddingTop: '1rem',
        borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
        fontSize: '0.85rem',
        color: isDark ? '#9ca3af' : '#64748b',
        width: '100%'
      }}>
        <span style={{ opacity: 0.7, fontWeight: 500 }}>powered by</span>
        <a 
          href="https://connessia.es/" 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
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
              height: '22px', 
              width: 'auto', 
              display: 'block',
              mixBlendMode: 'multiply'
            }} 
          />
          <span style={{ 
            fontWeight: 900, 
            fontSize: '0.95rem', 
            letterSpacing: '0.02em', 
            color: isDark ? '#fff' : '#003366',
            fontFamily: "'Inter', sans-serif"
          }}>
            CONNESSIA
          </span>
        </a>
        <span style={{ 
          fontSize: '0.75rem', 
          opacity: 0.5, 
          color: isDark ? '#9ca3af' : '#64748b',
          fontWeight: 600,
          marginLeft: '4px'
        }}>
          {APP_VERSION}
        </span>
      </div>
    );
  }

  return (
    <footer style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2.5rem 1rem',
      gap: '0.4rem',
      width: '100%',
      marginTop: 'auto'
    }}>
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 600, 
        letterSpacing: '0.1em', 
        color: isDark ? 'rgba(255,255,255,0.4)' : '#64748b',
        textTransform: 'lowercase',
        opacity: 0.7
      }}>
        powered by
      </span>
      
      <a 
        href="https://connessia.es/" 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          transition: 'transform 0.2s ease',
          textDecoration: 'none'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <img 
          src="/connessia-symbol.png" 
          alt="" 
          style={{ 
            height: '35px', 
            width: 'auto', 
            display: 'block',
            mixBlendMode: 'multiply',
            filter: isDark ? 'none' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }} 
        />
        <span style={{ 
          fontWeight: 900, 
          fontSize: '1.5rem', 
          letterSpacing: '0.02em', 
          color: isDark ? '#fff' : '#003366',
          fontFamily: "'Inter', sans-serif"
        }}>
          CONNESSIA
        </span>
      </a>
      
      <span style={{ 
        fontSize: '0.75rem', 
        opacity: 0.5, 
        color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b',
        fontWeight: 600,
        marginTop: '2px'
      }}>
        {APP_VERSION}
      </span>
    </footer>
  );
};
