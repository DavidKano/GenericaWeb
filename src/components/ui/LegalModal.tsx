import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
      <div className="animate-fade-in" style={{ background: 'var(--surface-color, #ffffff)', color: 'var(--text-primary, #111827)', width: '90%', maxWidth: '800px', maxHeight: '85vh', borderRadius: '12px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'var(--font-family, inherit)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ padding: '2rem', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-secondary, #4b5563)', fontFamily: 'var(--font-family, inherit)' }}>
          {content}
        </div>
        
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', background: '#f9fafb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button onClick={onClose} style={{ padding: '0.75rem 2rem', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Entendido
          </button>
        </div>
        
      </div>
    </div>
  );
};
