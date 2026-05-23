import React from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<Props> = ({ icon, title, style }) => {
  return (
    <div className="page-header" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '1.5rem', // 24px margin-bottom
      textAlign: 'left',
      justifyContent: 'flex-start',
      ...style
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
      <h2 className="page-header__title" style={{
        margin: 0,
        fontSize: '1.5rem',
        fontWeight: 600,
        color: 'var(--text-color, #0F172A)',
        lineHeight: 1.2,
        letterSpacing: '-0.02em'
      }}>
        {title}
      </h2>
    </div>
  );
};
