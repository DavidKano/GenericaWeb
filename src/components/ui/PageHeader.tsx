import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<Props> = ({ icon, title, description, actions, style }) => {
  return (
    <div className="page-header" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      marginBottom: '16px',
      textAlign: 'left',
      width: '100%',
      boxSizing: 'border-box',
      padding: 0,
      margin: 0,
      ...style
    }}>
      <div className="page-header__top-row" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div className="page-header__title-row" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: 'flex-start',
          margin: 0,
          padding: 0
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
            padding: 0,
            fontSize: '1.5rem',
            fontWeight: 600,
            color: 'var(--text-color, #0F172A)',
            lineHeight: 1.2,
            letterSpacing: '-0.02em'
          }}>
            {title}
          </h1>
        </div>
        {actions && (
          <div className="page-header__actions" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexShrink: 0
          }}>
            {actions}
          </div>
        )}
      </div>
      {description && (
        <p className="page-description" style={{
          margin: 0,
          padding: 0,
          fontSize: '0.875rem',
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
