import React, { useEffect, useState, useRef } from 'react';
import { useData } from '../context/DataContext';
import type { PromoOffer } from '../services/models';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Image as ImageIcon, Calendar, Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';

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
  const [offerType, setOfferType] = useState<'image' | 'text'>('image');
  const [textHeader, setTextHeader] = useState('');
  const [textBody, setTextBody] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
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
          if (offer.endDate < todayStr) {
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

    if (!startDate || !endDate) {
      alert('Debes rellenar las fechas.');
      return;
    }

    if (endDate < startDate) {
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
        endDate,
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="animate-fade-in" style={{ padding: isMobile ? '0' : '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <section className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <ImageIcon size={22} color="var(--primary-color)" /> Gestor de Ofertas y Promociones
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Sube una imagen promocional que aparecerá frente a los clientes cuando entren a la web. 
          Al pasar la "Fecha de Fin", las ofertas desaparecerán por completo y se borrarán automáticamente del sistema.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          
          {/* Formulario Nueva Oferta */}
          <form onSubmit={handleSaveOffer} style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Nueva Oferta
            </h3>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Tipo de Oferta</label>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" value="image" checked={offerType === 'image'} onChange={() => setOfferType('image')} style={{ width: 'auto', margin: 0 }} />
                  Subir Imagen
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" value="text" checked={offerType === 'text'} onChange={() => setOfferType('text')} style={{ width: 'auto', margin: 0 }} />
                  Diseño de Texto Automático
                </label>
              </div>
            </div>

            {offerType === 'image' ? (
              <div className="form-group">
                <label>Imagen Promocional (Cartel / Banner)</label>
                <div 
                  style={{ 
                    border: '2px dashed var(--border-color)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  background: base64Img ? 'transparent' : 'rgba(0,0,0,0.02)',
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
                    <p style={{ fontSize: '0.85rem' }}>Haz clic aquí para seleccionar una imagen</p>
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
                    style={{ fontFamily: 'inherit', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', resize: 'vertical' }}
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

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem' }}>
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
                  required 
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Modo de Visualización</label>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginTop: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" value="popup" checked={displayMode === 'popup'} onChange={() => setDisplayMode('popup')} style={{ width: 'auto', margin: 0 }} />
                  Ventana Emergente (Pop-up)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="radio" value="inline" checked={displayMode === 'inline'} onChange={() => setDisplayMode('inline')} style={{ width: 'auto', margin: 0 }} />
                  Integrada bajo los servicios
                </label>
              </div>
            </div>
            
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0 }}>La oferta se mostrará a los clientes 1 vez por sesión durante estas fechas.</p>
            </div>

            <button type="submit" disabled={saving || (offerType === 'image' && !base64Img) || (offerType === 'text' && !textHeader)} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
               {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Publicar Oferta
            </button>
          </form>

          {/* Lista de Ofertas Activas */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} /> Ofertas Activas ({offers.length})
            </h3>
            
            {offers.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                No tienes ninguna promoción activa en este momento.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {offers.map(offer => (
                  <div key={offer.id} style={{ display: 'flex', gap: '1rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: '100px', minHeight: '100px', background: '#f8fafc', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {offer.type === 'text' ? (
                         <div style={{ width: '100%', height: '100%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                           D. TEXTO
                         </div>
                       ) : (
                         <img src={offer.imageUrl} alt="Promo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       )}
                    </div>
                    <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Periodo de validez
                      </p>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'block' }}>
                        {format(new Date(offer.startDate), 'd MMM yyyy', { locale: es })} — {format(new Date(offer.endDate), 'd MMM yyyy', { locale: es })}
                      </strong>
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>
                        {offer.displayMode === 'inline' ? 'Fija bajo servicios' : 'Ventana Pop-up'}
                      </span>
                      <div style={{ marginTop: '0.75rem' }}>
                        <button 
                          onClick={() => handleDeleteOffer(offer.id)}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Trash2 size={14} /> Eliminar ahora
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
