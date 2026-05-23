import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<Props> = ({ icon, title, description, style }) => {
  return (
    <div className="page-header" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.375rem',
      marginBottom: '1.5rem', // 24px margin-bottom
      textAlign: 'left',
      width: '100%',
      boxSizing: 'border-box',
      ...style
    }}>
      <div className="page-header__title-row" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        justifyContent: 'flex-start'
      }}>
        <div className="page-header__icon" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-color, #008080)',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <h1 className="page-header__title" style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: 600,
          color: 'var(--text-color, #0F172A)',
          lineHeight: 1.2,
          letterSpacing: '-0.02em'
        }}>
          {title}
        </h1>
      </div>
      {description && (
        <p className="page-description" style={{
          margin: '0.25rem 0 0 0',
          fontSize: '0.875rem', // 14px
          color: '#64748B',
          lineHeight: '1.5',
          maxWidth: '800px',
          fontFamily: "'Inter', sans-serif"
        }}>
          {description}
        </p>
      )}
    </div>
  );
};
