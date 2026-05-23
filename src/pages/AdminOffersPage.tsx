import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { PromoOffer } from '../services/models';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image as ImageIcon, Calendar, Plus, Trash2, Save, Loader2, AlertCircle, Ticket, Megaphone } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';

export const AdminOffersPage: React.FC = () => {
  const { repo } = useData();
  const [offers, setOffers] = useState<PromoOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Nuevo formulario de oferta
  const [offerType, setOfferType] = useState<'image' | 'text'>('text');
  const [textHeader, setTextHeader] = useState('');
  const [textBody, setTextBody] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [noEndDate, setNoEndDate] = useState(false);
  const [base64Img, setBase64Img] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<'popup' | 'inline'>('popup');
  const [legalDisclaimer, setLegalDisclaimer] = useState('Promoción no acumulable con otras. Consulta condiciones.');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAndCleanOffers = async () => {
      try {
        const currentOffers = await repo.getPromoOffers();
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        
        const activeOffers: PromoOffer[] = [];
        
        // Auto-limpieza de ofertas caducadas
        for (const offer of currentOffers) {
          if (offer.endDate && offer.endDate < todayStr) {
            console.log(`Eliminando oferta caducada: ${offer.id}`);
            await repo.deletePromoOffer(offer.id);
          } else {
            activeOffers.push(offer);
          }
        }
        
        setOffers(activeOffers);
      } catch (err) {
        console.error('Error cargando ofertas:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndCleanOffers();
  }, [repo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setBase64Img(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (offerType === 'image' && !base64Img) {
      alert('Debes subir una imagen.');
      return;
    }
    if (offerType === 'text' && !textHeader) {
      alert('Debes escribir al menos una cabecera para la oferta de texto.');
      return;
    }

    if (!startDate || (!noEndDate && !endDate)) {
      alert('Debes rellenar las fechas.');
      return;
    }

    if (!noEndDate && endDate < startDate) {
      alert('La fecha de fin no puede ser anterior a la de inicio.');
      return;
    }

    setSaving(true);
    try {
      const id = `promo-${Date.now()}`;
      let imageUrl = '';
      if (offerType === 'image') {
        imageUrl = await repo.uploadImage(`promo_offers/${id}`, base64Img);
      }
      
      const newOffer: PromoOffer = {
        id,
        type: offerType,
        imageUrl,
        ...(offerType === 'text' ? {
          textHeader,
          textBody,
          designSeed: Math.floor(Math.random() * 1000)
        } : {}),
        startDate,
        ...(noEndDate ? {} : { endDate }),
        isActive: true,
        displayMode,
        legalDisclaimer
      };
      
      await repo.savePromoOffer(newOffer);
      setOffers([...offers, newOffer]);
      
      // Reset form
      setBase64Img('');
      setTextHeader('');
      setTextBody('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setEndDate('');
      setNoEndDate(false);
      setDisplayMode('popup');
      setLegalDisclaimer('Promoción no acumulable con otras. Consulta condiciones.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err: any) {
      console.error(err);
      alert(`Ocurrió un error guardando la oferta: ${err.message || 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta oferta inmediatamente?')) return;
    await repo.deletePromoOffer(id);
    setOffers(offers.filter(o => o.id !== id));
  };

  const handleToggleActive = async (offer: PromoOffer, isActive: boolean) => {
    try {
      const updatedOffer = { ...offer, isActive };
      await repo.savePromoOffer(updatedOffer);
      setOffers(offers.map(o => o.id === offer.id ? updatedOffer : o));
    } catch (err: any) {
      console.error(err);
      alert(`Error al actualizar estado: ${err.message}`);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="admin-offers-container animate-fade-in">
      <style>{`
        .admin-offers-container {
          padding: ${isMobile ? '0' : '1rem'};
          display: flex;
          flex-direction: column;
          gap: 2rem;
          box-sizing: border-box;
          width: 100%;
        }
        
        /* New Offer Form Card */
        .new-offer-card {
          background: #FFFFFF !important;
          border-radius: 12px !important;
          border: 1px solid #E2E8F0 !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
          padding: 24px !important;
          box-sizing: border-box;
        }

        /* Modern Segmented Control */
        .offers-segmented-container {
          display: flex !important;
          background: #F1F5F9 !important;
          padding: 4px !important;
          border-radius: 8px !important;
          gap: 2px !important;
          width: fit-content !important;
          margin-top: 0.5rem !important;
          box-sizing: border-box;
        }
        .offers-segmented-option {
          padding: 8px 16px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          font-size: 0.9rem !important;
          font-weight: 500 !important;
          color: #64748B !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          user-select: none !important;
          background: transparent !important;
        }
        .offers-segmented-option.active {
          background: #FFFFFF !important;
          color: #1E293B !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) !important;
          font-weight: 600 !important;
        }
        .offers-segmented-radio {
          position: absolute !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          margin: 0 !important;
          pointer-events: none !important;
        }

        /* Styled inputs inside form */
        .new-offer-card input[type="text"],
        .new-offer-card input[type="date"],
        .new-offer-card textarea {
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          padding: 0.625rem 0.875rem !important;
          font-size: 0.95rem !important;
          outline: none !important;
          transition: all 0.2s !important;
          background: #FFFFFF !important;
          font-family: inherit !important;
          box-sizing: border-box !important;
          width: 100% !important;
        }
        .new-offer-card input[type="text"]:focus,
        .new-offer-card input[type="date"]:focus,
        .new-offer-card textarea:focus {
          border-color: var(--primary-color, #3b82f6) !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .new-offer-card textarea {
          min-height: 80px !important;
          max-height: 160px !important;
          resize: vertical !important;
        }
        .new-offer-card label {
          font-weight: 600 !important;
          font-size: 0.875rem !important;
          color: #475569 !important;
          display: block !important;
          margin-bottom: 0.375rem !important;
        }

        /* Toggle switch component */
        .switch-container {
          display: inline-flex !important;
          align-items: center !important;
          gap: 0.5rem !important;
          cursor: pointer !important;
          user-select: none !important;
          margin-top: 0.5rem !important;
        }
        .switch-label-text {
          font-size: 0.85rem !important;
          font-weight: 500 !important;
          color: #475569 !important;
        }
        .toggle-switch {
          position: relative !important;
          width: 44px !important;
          height: 24px !important;
          background-color: #CBD5E1 !important;
          border-radius: 999px !important;
          transition: background-color 0.2s ease !important;
          flex-shrink: 0 !important;
        }
        .toggle-switch-checkbox {
          position: absolute !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
          margin: 0 !important;
          pointer-events: none !important;
        }
        .toggle-switch-handle {
          position: absolute !important;
          top: 2px !important;
          left: 2px !important;
          width: 20px !important;
          height: 20px !important;
          background-color: #FFFFFF !important;
          border-radius: 50% !important;
          transition: transform 0.2s ease !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important;
        }
        .toggle-switch-checkbox:checked + .toggle-switch {
          background-color: var(--primary-color, #3b82f6) !important;
        }
        .toggle-switch-checkbox:checked + .toggle-switch .toggle-switch-handle {
          transform: translateX(20px) !important;
        }

        /* Card toggle switch */
        .card-toggle-switch {
          position: relative !important;
          width: 38px !important;
          height: 20px !important;
          background-color: #CBD5E1 !important;
          border-radius: 999px !important;
          transition: background-color 0.2s ease !important;
          flex-shrink: 0 !important;
        }
        .toggle-switch-checkbox:checked + .card-toggle-switch {
          background-color: var(--primary-color, #3b82f6) !important;
        }
        .card-toggle-switch-handle {
          position: absolute !important;
          top: 2px !important;
          left: 2px !important;
          width: 16px !important;
          height: 16px !important;
          background-color: #FFFFFF !important;
          border-radius: 50% !important;
          transition: transform 0.2s ease !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15) !important;
        }
        .toggle-switch-checkbox:checked + .card-toggle-switch .card-toggle-switch-handle {
          transform: translateX(18px) !important;
        }

        /* Alerta informativa */
        .info-alert-block {
          background: #EFF6FF !important;
          border: none !important;
          color: #1E3A8A !important;
          border-radius: 8px !important;
          padding: 12px 16px !important;
          font-size: 0.875rem !important;
          display: flex !important;
          align-items: flex-start !important;
          gap: 0.75rem !important;
          margin-bottom: 1.5rem !important;
          box-sizing: border-box;
        }

        /* Botón publicar */
        .new-offer-card .btn-primary {
          border-radius: 8px !important;
          padding: 12px 24px !important;
          font-size: 0.95rem !important;
          font-weight: 600 !important;
          transition: all 0.2s ease !important;
        }

        /* Active offers list & cards */
        .offer-card {
          display: flex !important;
          gap: 1.25rem !important;
          background: #FFFFFF !important;
          border: 1px solid #E2E8F0 !important;
          border-radius: 12px !important;
          padding: 16px !important;
          align-items: center !important;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02) !important;
          transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          box-sizing: border-box;
          width: 100%;
        }
        .offer-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -2px rgba(0,0,0,0.03) !important;
        }
        
        .offer-square-container {
          width: 60px !important;
          height: 60px !important;
          border-radius: 8px !important;
          background: color-mix(in srgb, var(--primary-color, #3b82f6) 12%, transparent) !important;
          color: var(--primary-color, #3b82f6) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          overflow: hidden !important;
        }
        .offer-square-icon {
          color: var(--primary-color, #3b82f6) !important;
        }
        .offer-square-img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        /* Badge SaaS */
        .offer-badge {
          display: inline-block !important;
          padding: 4px 10px !important;
          background: #F1F5F9 !important;
          color: #475569 !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          border-radius: 999px !important;
          border: 1px solid #E2E8F0 !important;
        }

        /* Botón de eliminación fantasma */
        .btn-delete-offer {
          background: transparent !important;
          border: none !important;
          color: #94A3B8 !important;
          font-size: 0.85rem !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          padding: 6px 12px !important;
          border-radius: 6px !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.25rem !important;
          transition: all 0.2s ease !important;
        }
        .btn-delete-offer:hover {
          color: #EF4444 !important;
          background: #FEE2E2 !important;
        }
      `}</style>

      <PageHeader 
        icon={<Megaphone size={24} />} 
        title="Ofertas y Promociones" 
        description="Sube una imagen promocional que aparecerá frente a los clientes cuando entren a la web. Al pasar la 'Fecha de Fin', las ofertas desaparecerán por completo y se borrarán automáticamente del sistema."
      />

      <section className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Formulario Nueva Oferta */}
          <form onSubmit={handleSaveOffer} className="new-offer-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Plus size={18} /> Nueva Oferta
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Tipo de Oferta</label>
              <div className="offers-segmented-container">
                <label className={`offers-segmented-option ${offerType === 'image' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    value="image" 
                    checked={offerType === 'image'} 
                    onChange={() => setOfferType('image')} 
                    className="offers-segmented-radio" 
                  />
                  Subir Imagen
                </label>
                <label className={`offers-segmented-option ${offerType === 'text' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    value="text" 
                    checked={offerType === 'text'} 
                    onChange={() => setOfferType('text')} 
                    className="offers-segmented-radio" 
                  />
                  Diseño de Texto Automático
                </label>
              </div>
            </div>

            {offerType === 'image' ? (
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Imagen Promocional (Cartel / Banner)</label>
                <div 
                  style={{ 
                    border: '2px dashed #E2E8F0', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    textAlign: 'center',
                    background: base64Img ? 'transparent' : '#F8FAFC',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer'
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {base64Img ? (
                    <img src={base64Img} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', padding: '2rem 0' }}>
                      <ImageIcon size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>Haz clic aquí para seleccionar una imagen</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Cabecera / Título Principal</label>
                  <input 
                    type="text" 
                    value={textHeader} 
                    onChange={e => setTextHeader(e.target.value)} 
                    placeholder="Ej: 50% de Descuento" 
                  />
                </div>
                <div className="form-group">
                  <label>Cuerpo / Descripción (opcional)</label>
                  <textarea 
                    value={textBody} 
                    onChange={e => setTextBody(e.target.value)} 
                    placeholder="En tu primera visita al completarse tu reserva..." 
                    rows={3} 
                  />
                </div>
                <div className="form-group">
                  <label>Condiciones / Exención de responsabilidad (Legal)</label>
                  <input 
                    type="text" 
                    value={legalDisclaimer} 
                    onChange={e => setLegalDisclaimer(e.target.value)} 
                    placeholder="Ej: Promoción no acumulable..." 
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Desde Fecha</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={e => setStartDate(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Hasta Fecha (incluida)</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={e => setEndDate(e.target.value)} 
                  min={startDate}
                  required={!noEndDate}
                  disabled={noEndDate}
                  style={noEndDate ? { opacity: 0.5 } : {}}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      checked={noEndDate} 
                      onChange={e => setNoEndDate(e.target.checked)} 
                      className="toggle-switch-checkbox" 
                    />
                    <div className="toggle-switch">
                      <div className="toggle-switch-handle"></div>
                    </div>
                    <span className="switch-label-text">Promoción sin fecha de fin</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Modo de Visualización</label>
              <div className="offers-segmented-container">
                <label className={`offers-segmented-option ${displayMode === 'popup' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    value="popup" 
                    checked={displayMode === 'popup'} 
                    onChange={() => setDisplayMode('popup')} 
                    className="offers-segmented-radio" 
                  />
                  Ventana Emergente (Pop-up)
                </label>
                <label className={`offers-segmented-option ${displayMode === 'inline' ? 'active' : ''}`}>
                  <input 
                    type="radio" 
                    value="inline" 
                    checked={displayMode === 'inline'} 
                    onChange={() => setDisplayMode('inline')} 
                    className="offers-segmented-radio" 
                  />
                  Integrada bajo los servicios
                </label>
              </div>
            </div>
            
            <div className="info-alert-block">
              <AlertCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontWeight: 500 }}>La oferta se mostrará a los clientes 1 vez por sesión durante estas fechas.</p>
            </div>

            <button type="submit" disabled={saving || (offerType === 'image' && !base64Img) || (offerType === 'text' && !textHeader)} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
               {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Publicar Oferta
            </button>
          </form>

          {/* Lista de Ofertas Activas */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
              <Calendar size={18} /> Ofertas Activas ({offers.length})
            </h3>
            
            {offers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                No tienes ninguna promoción activa en este momento.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {offers.map(offer => (
                  <div key={offer.id} className="offer-card" style={{ opacity: offer.isActive === false ? 0.7 : 1 }}>
                    <div className="offer-square-container">
                       {offer.type === 'text' ? (
                         <Ticket size={24} className="offer-square-icon" />
                       ) : (
                         <img src={offer.imageUrl} alt="Promo" className="offer-square-img" />
                       )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          {offer.type === 'text' && offer.textHeader && (
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {offer.textHeader}
                            </h4>
                          )}
                          {offer.type === 'image' && (
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              Oferta de Imagen
                            </h4>
                          )}
                          <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Periodo de validez
                          </p>
                          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                            {format(new Date(offer.startDate), 'd MMM yyyy', { locale: es })} — {offer.endDate ? format(new Date(offer.endDate), 'd MMM yyyy', { locale: es }) : 'Indefinida'}
                          </strong>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748B' }}>
                            {offer.isActive !== false ? 'Activa' : 'Pausada'}
                          </span>
                          <label className="switch-container" style={{ marginTop: 0 }}>
                            <input 
                              type="checkbox" 
                              checked={offer.isActive !== false}
                              onChange={(e) => handleToggleActive(offer, e.target.checked)} 
                              className="toggle-switch-checkbox" 
                            />
                            <div className="card-toggle-switch">
                              <div className="card-toggle-switch-handle"></div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                        <span className="offer-badge">
                          {offer.displayMode === 'inline' ? 'Fija bajo servicios' : 'Ventana Pop-up'}
                        </span>
                        <button 
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="btn-delete-offer"
                        >
                          <Trash2 size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      </section>
    </div>
  );
};
