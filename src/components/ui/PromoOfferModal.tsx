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
            (!o.endDate || todayStr <= o.endDate)
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
    <div className="promo-modal-overlay">
      <div className="promo-modal-card">
        {/* We only render the close button here if it is an image type. For text type, it is rendered inside PromoOfferTextDesign */}
        {offer.type === 'image' && (
          <button 
            onClick={handleClose}
            className="promo-close-btn-minimal"
            title="Cerrar oferta"
          >
            <X size={20} />
          </button>
        )}
        
        {/* Imagen Promocional o Texto Dinámico */}
        <div style={{ width: '100%', display: 'block', minHeight: '300px', background: '#f8fafc' }}>
          {offer.type === 'text' ? (
            <PromoOfferTextDesign offer={offer} onClose={handleClose} style={{ borderRadius: '0', minHeight: '350px' }} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <img 
                  src={offer.imageUrl} 
                  alt="Promoción Especial" 
                  style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain' }} 
              />
              {offer.legalDisclaimer && (
                <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderTop: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
                   <p style={{ margin: 0, fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic' }}>
                     {offer.legalDisclaimer}
                   </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .promo-modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justifyContent: center;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .promo-modal-card {
          position: relative;
          max-width: 500px;
          width: 100%;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          overflow: hidden;
          animation: slideUp 0.4s ease-out;
        }

        .promo-close-btn-minimal {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #475569;
          display: flex;
          align-items: center;
          justifyContent: center;
          cursor: pointer;
          z-index: 100;
          padding: 6px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .promo-close-btn-minimal:hover {
          color: #0f172a;
          transform: scale(1.15);
        }
        .promo-close-btn-minimal:active {
          transform: scale(0.9);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 640px) {
          .promo-modal-overlay {
            padding: 0.75rem;
          }
          .promo-modal-card {
            border-radius: 12px;
          }
          .promo-close-btn-minimal {
            top: 8px;
            right: 8px;
          }
        }
      `}</style>
    </div>
  );
};
