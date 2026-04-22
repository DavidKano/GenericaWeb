import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import type { PromoOffer } from '../../services/models';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { PromoOfferTextDesign } from './PromoOfferTextDesign';

export const PromoOfferModal: React.FC = () => {
  const { repo } = useData();
  const [offer, setOffer] = useState<PromoOffer | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkOffer = async () => {
      try {
        const offers = await repo.getPromoOffers();
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        // Filtrar ofertas que estén exactamente en el rango de validez y que NO sean inline
        const activeOffers = offers.filter(o => 
            o.isActive !== false && 
            o.displayMode !== 'inline' &&
            todayStr >= o.startDate && 
            todayStr <= o.endDate
        );

        if (activeOffers.length > 0) {
          // Cogemos la primera activa por simplicidad
          const firstOffer = activeOffers[0];
          
          // Verificamos si en la sesión actual ya la ha visto
          const hasSeen = sessionStorage.getItem(`seen_offer_${firstOffer.id}`);
          
          if (!hasSeen) {
            setOffer(firstOffer);
            setVisible(true);
          }
        }
      } catch (err) {
        console.error('Error cargando la oferta promocional:', err);
      }
    };
    checkOffer();
  }, [repo]);

  if (!visible || !offer) return null;

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem(`seen_offer_${offer.id}`, 'true');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        style={{
          position: 'relative',
          maxWidth: '500px',
          width: '100%',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          animation: 'slideUp 0.4s ease-out'
        }}
      >
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
          title="Cerrar oferta"
        >
          <X size={20} />
        </button>
        
        {/* Imagen Promocional o Texto Dinámico */}
        <div style={{ width: '100%', display: 'block', minHeight: '300px', background: '#f8fafc' }}>
          {offer.type === 'text' ? (
            <PromoOfferTextDesign offer={offer} style={{ borderRadius: '0', minHeight: '350px' }} />
          ) : (
            <img 
                src={offer.imageUrl} 
                alt="Promoción Especial" 
                style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} 
            />
          )}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
