import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { BookingService, User, Transaction, DesignConfig } from '../services/models';
import { PageHeader } from '../components/ui/PageHeader';
import { CreditCard, Coins, Check, Trash2, User as UserIcon, Briefcase, Calculator, RefreshCw, Euro, Plus, X } from 'lucide-react';

interface TicketItem {
  id: string; // Unique ID inside the current ticket
  serviceId?: string; // Optional if it is a manual concept
  name: string;
  price: number;
}

export const AdminTpvPage: React.FC = () => {
  const { repo } = useData();
  const location = useLocation();

  const [design, setDesign] = useState<DesignConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // TPV Ticket State
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'metalico' | 'mixto'>('tarjeta');
  
  // Searchable Customer Dropdown State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mixed Payment Details
  const [mixedCashAmount, setMixedCashAmount] = useState<number | string>('');
  const [mixedCardAmount, setMixedCardAmount] = useState<number | string>('');

  // Cash Return Calculation Details
  const [cashGiven, setCashGiven] = useState<number | string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Notes
  const [notes, setNotes] = useState('');

  // Dropdown / Form selectors to ADD items
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [manualConcept, setManualConcept] = useState('');
  const [manualPrice, setManualPrice] = useState<number | string>('');

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [svcs, usrs, txs, cfg] = await Promise.all([
        repo.getServices(),
        repo.getUsers(),
        repo.getTransactions(),
        repo.getDesignConfig(),
      ]);
      setServices(svcs.filter(s => s.isActive));
      setCustomers(usrs.filter(u => u.role === 'CUSTOMER'));
      
      // Sort transactions by date descending
      const sortedTxs = [...txs].sort((a, b) => b.date - a.date);
      setTransactions(sortedTxs);
      setDesign(cfg);
    } catch (error) {
      console.error('Error cargando datos del TPV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  // Handle URL Query Params (Redirection from appointment details modal)
  useEffect(() => {
    if (services.length > 0) {
      const query = new URLSearchParams(location.search);
      const paramCustomerId = query.get('customerId') || '';
      const paramServiceId = query.get('serviceId') || '';

      if (paramCustomerId) {
        setSelectedCustomerId(paramCustomerId);
      }
      
      if (paramServiceId) {
        const found = services.find(s => s.id === paramServiceId);
        if (found) {
          // Add service to ticket
          setTicket([{
            id: 'item-' + Date.now(),
            serviceId: found.id,
            name: found.name,
            price: found.price || 0
          }]);
        }
      }
    }
  }, [services, location.search]);

  // Sync Search Query text when selectedCustomerId changes or customers load
  useEffect(() => {
    if (selectedCustomerId && customers.length > 0) {
      const found = customers.find(c => c.id === selectedCustomerId);
      if (found) {
        setSearchQuery(found.name);
      } else {
        setSearchQuery('');
      }
    } else {
      setSearchQuery('');
    }
  }, [selectedCustomerId, customers]);

  // Handle Click Outside for searchable dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        // Restore previous selection name if closed without selecting
        if (selectedCustomerId) {
          const found = customers.find(c => c.id === selectedCustomerId);
          if (found) setSearchQuery(found.name);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCustomerId, customers]);

  // Filter and Sort Customers alphabetically
  const sortedAndFilteredCustomers = useMemo(() => {
    // 1. Sort alphabetically by name
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    
    // 2. Filter by search query
    if (!searchQuery.trim() || selectedCustomerId) {
      // If we already selected someone and the query matches their name exactly, show all when focused
      const selected = customers.find(c => c.id === selectedCustomerId);
      if (selected && selected.name === searchQuery) {
        return sorted;
      }
      if (!searchQuery.trim()) return sorted;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return sorted.filter(c => 
      c.name.toLowerCase().includes(query) || 
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }, [customers, searchQuery, selectedCustomerId]);

  // Total Amount Calculation
  const totalAmount = useMemo(() => {
    return Number(ticket.reduce((sum, item) => sum + (Number(item.price) || 0), 0).toFixed(2));
  }, [ticket]);

  // Add Service to Ticket
  const handleAddServiceToTicket = () => {
    if (!selectedServiceId) return;
    const found = services.find(s => s.id === selectedServiceId);
    if (found) {
      const newItem: TicketItem = {
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 100),
        serviceId: found.id,
        name: found.name,
        price: found.price || 0
      };
      setTicket(prev => [...prev, newItem]);
      setSelectedServiceId('');
    }
  };

  // Add Manual Concept to Ticket
  const handleAddManualConceptToTicket = () => {
    if (!manualConcept.trim()) {
      alert('Por favor, indica un nombre para el concepto manual.');
      return;
    }
    const price = Number(manualPrice) || 0;
    if (price <= 0) {
      alert('Por favor, indica un importe válido.');
      return;
    }

    const newItem: TicketItem = {
      id: 'item-manual-' + Date.now() + '-' + Math.floor(Math.random() * 100),
      name: manualConcept.trim(),
      price: price
    };

    setTicket(prev => [...prev, newItem]);
    setManualConcept('');
    setManualPrice('');
  };

  // Update Item Price in Ticket
  const handleUpdateItemPrice = (itemId: string, newPrice: number | string) => {
    const parsed = newPrice === '' ? 0 : Number(newPrice);
    setTicket(prev => prev.map(item => 
      item.id === itemId ? { ...item, price: parsed } : item
    ));
  };

  // Remove Item from Ticket
  const handleRemoveItemFromTicket = (itemId: string) => {
    setTicket(prev => prev.filter(item => item.id !== itemId));
  };

  // Mixed payment sync
  useEffect(() => {
    if (paymentMethod === 'mixto' && totalAmount > 0) {
      const cash = Number(mixedCashAmount) || 0;
      if (cash > totalAmount) {
        setMixedCashAmount(totalAmount);
        setMixedCardAmount(0);
      } else {
        setMixedCardAmount(Number((totalAmount - cash).toFixed(2)));
      }
    }
  }, [totalAmount, mixedCashAmount, paymentMethod]);

  // Cash return calculation
  useEffect(() => {
    const totalToPay = paymentMethod === 'mixto' ? (Number(mixedCashAmount) || 0) : totalAmount;
    const given = Number(cashGiven) || 0;
    if (paymentMethod !== 'tarjeta' && given >= totalToPay) {
      setChangeAmount(Number((given - totalToPay).toFixed(2)));
    } else {
      setChangeAmount(0);
    }
  }, [totalAmount, cashGiven, paymentMethod, mixedCashAmount]);

  // Reset form
  const resetForm = () => {
    setTicket([]);
    setSelectedCustomerId('');
    setSearchQuery('');
    setPaymentMethod('tarjeta');
    setMixedCashAmount('');
    setMixedCardAmount('');
    setCashGiven('');
    setChangeAmount(0);
    setNotes('');
  };

  // Submit charge
  const handleCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket.length === 0) {
      alert('El ticket está vacío. Por favor, añade algún servicio o concepto para cobrar.');
      return;
    }
    if (totalAmount <= 0) {
      alert('El importe total debe ser mayor que cero.');
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      
      if (paymentMethod === 'mixto') {
        const cashPart = Number(mixedCashAmount) || 0;
        const cardPart = Number(mixedCardAmount) || 0;

        if (Number((cashPart + cardPart).toFixed(2)) !== totalAmount) {
          alert('La suma de las partes no coincide con el total.');
          setIsSaving(false);
          return;
        }

        // Proportional distribution of cash and card amounts among ticket items
        let remainingCash = cashPart;
        let remainingCard = cardPart;

        for (const item of ticket) {
          const itemPrice = Number(item.price) || 0;
          if (itemPrice <= 0) continue;

          // Allocate cash portion up to item price
          const cashAllocated = Number(Math.min(itemPrice, remainingCash).toFixed(2));
          remainingCash = Number((remainingCash - cashAllocated).toFixed(2));

          // Allocate rest to card
          const cardAllocated = Number((itemPrice - cashAllocated).toFixed(2));
          remainingCard = Number((remainingCard - cardAllocated).toFixed(2));

          if (cashAllocated > 0) {
            await repo.saveTransaction({
              id: `tx-cash-${now}-${Math.floor(Math.random() * 10000)}`,
              date: now,
              amount: cashAllocated,
              paymentMethod: 'metalico',
              serviceId: item.serviceId || undefined,
              customerId: selectedCustomerId || undefined,
              notes: item.serviceId ? (notes ? notes.trim() : undefined) : `${item.name}${notes ? ` - ${notes.trim()}` : ''}`
            });
          }

          if (cardAllocated > 0) {
            await repo.saveTransaction({
              id: `tx-card-${now}-${Math.floor(Math.random() * 10000)}`,
              date: now,
              amount: cardAllocated,
              paymentMethod: 'tarjeta',
              serviceId: item.serviceId || undefined,
              customerId: selectedCustomerId || undefined,
              notes: item.serviceId ? (notes ? notes.trim() : undefined) : `${item.name}${notes ? ` - ${notes.trim()}` : ''}`
            });
          }
        }
      } else {
        // Single payment method - save one transaction per item to preserve clean service breakdown reports
        for (const item of ticket) {
          const itemPrice = Number(item.price) || 0;
          if (itemPrice <= 0) continue;

          await repo.saveTransaction({
            id: `tx-${now}-${Math.floor(Math.random() * 10000)}`,
            date: now,
            amount: itemPrice,
            paymentMethod: paymentMethod === 'tarjeta' ? 'tarjeta' : 'metalico',
            serviceId: item.serviceId || undefined,
            customerId: selectedCustomerId || undefined,
            notes: item.serviceId ? (notes ? notes.trim() : undefined) : `${item.name}${notes ? ` - ${notes.trim()}` : ''}`
          });
        }
      }

      alert('¡Cobro registrado con éxito en base de datos!');
      resetForm();
      // Clean query search params
      window.history.replaceState(null, '', window.location.pathname);
      await loadData();
    } catch (error) {
      console.error('Error registrando cobro:', error);
      alert('Ocurrió un error al registrar el cobro.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro de cobro?')) {
      try {
        await repo.deleteTransaction(id);
        await loadData();
      } catch (error) {
        console.error('Error eliminando cobro:', error);
        alert('Error al eliminar el cobro.');
      }
    }
  };

  const primaryColor = design?.primaryColor || '#008080';

  return (
    <div className="admin-tpv-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
      <PageHeader 
        icon={<Calculator size={28} />}
        title="TPV Virtual"
        description="Gestiona cobros múltiples, asocia clientes con búsqueda predictiva, edita importes en tiempo real y simula vueltas."
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: primaryColor }} />
          <span style={{ color: '#64748B', fontWeight: 500 }}>Cargando datos del TPV...</span>
        </div>
      ) : (
        <div className="tpv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%' }}>
          
          {/* Main Left Column: Ticket Management & Calculator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* 1. Ticket de Cobro Actual */}
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                <h3 style={{ margin: '0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-color, #0F172A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Euro size={18} style={{ color: primaryColor }} /> Ticket de Venta
                </h3>
                {ticket.length > 0 && (
                  <button 
                    onClick={resetForm}
                    style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {/* Items List */}
              {ticket.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94A3B8' }}>
                  <Calculator size={40} style={{ margin: '0 auto 8px auto', opacity: 0.25 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>El ticket está vacío. Añade servicios o cobros manuales a continuación.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
                  {ticket.map((item) => (
                    <div key={item.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: '#F8FAFC',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1 }}>
                        {item.serviceId ? (
                          <Briefcase size={16} style={{ color: primaryColor, flexShrink: 0 }} />
                        ) : (
                          <Euro size={16} style={{ color: '#E2B93B', flexShrink: 0 }} />
                        )}
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </span>
                      </div>

                      {/* Real time Price Editor */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ position: 'relative', width: '90px' }}>
                          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', fontWeight: 700, color: '#64748B' }}>€</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.price === 0 ? '' : item.price}
                            onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                            placeholder="0.00"
                            style={{
                              width: '100%',
                              padding: '6px 20px 6px 8px',
                              border: '1px solid #CBD5E1',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              textAlign: 'right',
                              boxSizing: 'border-box',
                              color: '#0F172A',
                              outline: 'none'
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItemFromTicket(item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'color 0.2s'
                          }}
                          onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                          onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total Display */}
              <div style={{
                marginTop: '8px',
                padding: '16px',
                borderRadius: '12px',
                background: `color-mix(in srgb, ${primaryColor} 5%, #F8FAFC)`,
                border: `1px solid color-mix(in srgb, ${primaryColor} 12%, #E2E8F0)`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total a Cobrar</span>
                <strong style={{ fontSize: '1.75rem', fontWeight: 900, color: primaryColor }}>
                  {totalAmount.toFixed(2)}€
                </strong>
              </div>
            </div>

            {/* 2. Añadir Conceptos / Servicios */}
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h4 style={{ margin: '0', fontSize: '0.95rem', fontWeight: 700, color: '#334155' }}>Añadir al Ticket</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                
                {/* A. Añadir Servicio Catálogo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Añadir Servicio del Catálogo</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex' }}>
                        <Briefcase size={16} />
                      </span>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 10px 10px 32px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          background: '#fff',
                          outline: 'none',
                          color: selectedServiceId ? '#0F172A' : '#94A3B8'
                        }}
                      >
                        <option value="">Selecciona servicio...</option>
                        {services.map(s => (
                          <option key={s.id} value={s.id} style={{ color: '#0F172A' }}>
                            {s.name} ({s.price}€)
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddServiceToTicket}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: primaryColor,
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Plus size={16} style={{ marginRight: '4px' }} /> Añadir
                    </button>
                  </div>
                </div>

                {/* B. Añadir Concepto Manual Personalizado */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px dashed #E2E8F0', paddingTop: '14px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Añadir Concepto / Venta Manual</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Concepto (Ej: Champú, Recargo...)"
                      value={manualConcept}
                      onChange={(e) => setManualConcept(e.target.value)}
                      style={{
                        padding: '10px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none'
                      }}
                    />
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', fontWeight: 700, color: '#94A3B8' }}>€</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 20px 10px 10px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          textAlign: 'right',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualConceptToTicket}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: '#334155',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. Datos de Cobro, Métodos y Simulaciones */}
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <form onSubmit={handleCharge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Searchable Autocomplete Customer Selector */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Cliente del Cobro</label>
                  
                  <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                        <UserIcon size={18} />
                      </span>
                      
                      <input
                        type="text"
                        placeholder="Buscar cliente por nombre o teléfono..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setIsDropdownOpen(true);
                          if (selectedCustomerId && e.target.value === '') {
                            setSelectedCustomerId(''); // Clear selection if text is fully deleted
                          }
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        style={{
                          width: '100%',
                          padding: '12px 35px 12px 38px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          background: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: selectedCustomerId ? '#0F172A' : '#475569',
                          fontWeight: selectedCustomerId ? '600' : 'normal'
                        }}
                      />

                      {/* Clear Button */}
                      {(searchQuery || selectedCustomerId) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId('');
                            setSearchQuery('');
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px'
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Dropdown Options */}
                    {isDropdownOpen && (
                      <div className="autocomplete-dropdown" style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: '0',
                        right: '0',
                        background: '#ffffff',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        zIndex: '50',
                        animation: 'fadeIn 0.2s ease',
                        boxSizing: 'border-box'
                      }}>
                        {/* Option: Venta Rápida (Clear) */}
                        <div 
                          onClick={() => {
                            setSelectedCustomerId('');
                            setSearchQuery('');
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            fontSize: '0.9rem',
                            color: '#64748B',
                            cursor: 'pointer',
                            borderBottom: '1px solid #F1F5F9',
                            fontWeight: !selectedCustomerId ? '700' : 'normal',
                            background: !selectedCustomerId ? '#F8FAFC' : 'transparent',
                            textAlign: 'left'
                          }}
                          className="dropdown-item-hover"
                        >
                          -- Cliente no identificado (Venta rápida) --
                        </div>

                        {sortedAndFilteredCustomers.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: '0.875rem', color: '#94A3B8', textAlign: 'center' }}>
                            No se encontraron clientes matching
                          </div>
                        ) : (
                          sortedAndFilteredCustomers.map(c => {
                            const isSelected = c.id === selectedCustomerId;
                            return (
                              <div
                                key={c.id}
                                onClick={() => {
                                  setSelectedCustomerId(c.id);
                                  setSearchQuery(c.name);
                                  setIsDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: '0.9rem',
                                  color: '#0F172A',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: '1px solid #F8FAFC',
                                  fontWeight: isSelected ? '700' : 'normal',
                                  background: isSelected ? `color-mix(in srgb, ${primaryColor} 8%, #fff)` : 'transparent',
                                  textAlign: 'left'
                                }}
                                className="dropdown-item-hover"
                              >
                                <span>{c.name}</span>
                                {c.phone && (
                                  <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: '6px' }}>
                                    ({c.phone})
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Métodos de Pago */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Forma de Pago</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tarjeta')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 10px',
                        borderRadius: '12px',
                        border: paymentMethod === 'tarjeta' ? `2px solid ${primaryColor}` : '2px solid #E2E8F0',
                        background: paymentMethod === 'tarjeta' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: paymentMethod === 'tarjeta' ? primaryColor : '#475569',
                        fontWeight: 600
                      }}
                    >
                      <CreditCard size={22} />
                      <span style={{ fontSize: '0.85rem' }}>Tarjeta</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('metalico')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 10px',
                        borderRadius: '12px',
                        border: paymentMethod === 'metalico' ? `2px solid ${primaryColor}` : '2px solid #E2E8F0',
                        background: paymentMethod === 'metalico' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: paymentMethod === 'metalico' ? primaryColor : '#475569',
                        fontWeight: 600
                      }}
                    >
                      <Coins size={22} />
                      <span style={{ fontSize: '0.85rem' }}>Efectivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPaymentMethod('mixto');
                        setMixedCashAmount((totalAmount / 2).toFixed(2));
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px 10px',
                        borderRadius: '12px',
                        border: paymentMethod === 'mixto' ? `2px solid ${primaryColor}` : '2px solid #E2E8F0',
                        background: paymentMethod === 'mixto' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        color: paymentMethod === 'mixto' ? primaryColor : '#475569',
                        fontWeight: 600
                      }}
                    >
                      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                        <Coins size={16} />
                        <span style={{ opacity: 0.5 }}>+</span>
                        <CreditCard size={16} />
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>Mixto</span>
                    </button>
                  </div>
                </div>

                {/* Pago Mixto Desglose */}
                {paymentMethod === 'mixto' && (
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>Desglose de Pago Mixto</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>En Efectivo (€)</label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={totalAmount || undefined}
                          value={mixedCashAmount}
                          onChange={(e) => setMixedCashAmount(e.target.value)}
                          style={{
                            padding: '10px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>En Tarjeta (€)</label>
                        <input
                          type="number"
                          readOnly
                          value={mixedCardAmount}
                          style={{
                            padding: '10px',
                            border: '1px solid #E2E8F0',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            background: '#F1F5F9',
                            color: '#64748B',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Calculadora de Vueltas */}
                {paymentMethod !== 'tarjeta' && (totalAmount > 0) && (
                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #DCFCE7',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'fadeIn 0.3s ease'
                  }}>
                    <h4 style={{ margin: '0', fontSize: '0.9rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calculator size={16} /> Calculadora de Cambio
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>
                        {paymentMethod === 'mixto' 
                          ? `Dinero Entregado en Efectivo (Total a pagar: ${Number(mixedCashAmount).toFixed(2)}€)` 
                          : `Dinero Entregado en Efectivo (Total a pagar: ${totalAmount.toFixed(2)}€)`
                        }
                      </label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#166534', fontWeight: 600 }}>€</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="Introduce lo que entrega el cliente..."
                          value={cashGiven}
                          onChange={(e) => setCashGiven(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px 10px 10px 24px',
                            border: '1px solid #BBF7D0',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#14532D',
                            background: '#fff',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {Number(cashGiven) > 0 && (
                      <div style={{ 
                        marginTop: '4px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: changeAmount > 0 ? '#BBF7D0' : '#F0FDF4',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s'
                      }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#14532D' }}>
                          {changeAmount > 0 ? 'VUELTA A ENTREGAR:' : 'Dinero insuficiente:'}
                        </span>
                        <strong style={{ fontSize: '1.3rem', fontWeight: 800, color: '#14532D' }}>
                          {changeAmount.toFixed(2)}€
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Notas */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Notas / Concepto Global (Opcional)</label>
                  <textarea
                    placeholder="Notas internas globales del cobro..."
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Botón Cobrar */}
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    background: primaryColor,
                    color: '#fff',
                    border: 'none',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" /> Registrando...
                    </>
                  ) : (
                    <>
                      <Check size={20} /> Registrar Cobro
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>

          {/* Right Column: Recent Transactions list */}
          <div className="tpv-card" style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: '0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-color, #0F172A)' }}>
                Últimos Cobros Realizados
              </h2>
              <button 
                onClick={loadData}
                style={{
                  background: 'none',
                  border: 'none',
                  color: primaryColor,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8' }}>
                <Calculator size={48} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.95rem' }}>No se han registrado cobros todavía hoy.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #F1F5F9' }}>
                      <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Fecha / Hora</th>
                      <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Cliente</th>
                      <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Concepto / Servicio</th>
                      <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Método</th>
                      <th style={{ padding: '12px 8px', fontSize: '0.8rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Importe</th>
                      <th style={{ padding: '12px 8px', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const clientName = customers.find(c => c.id === tx.customerId)?.name || 'Venta rápida (Sin cliente)';
                      const serviceName = services.find(s => s.id === tx.serviceId)?.name || tx.notes || 'Cobro manual';
                      const formattedDate = new Date(tx.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={tx.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="tx-row">
                          <td style={{ padding: '14px 8px', fontSize: '0.9rem', color: '#475569' }}>
                            {formattedDate}
                          </td>
                          <td style={{ padding: '14px 8px', fontSize: '0.9rem', fontWeight: 600, color: '#0F172A' }}>
                            {clientName}
                          </td>
                          <td style={{ padding: '14px 8px', fontSize: '0.9rem', color: '#475569' }}>
                            {serviceName}
                          </td>
                          <td style={{ padding: '14px 8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              borderRadius: '100px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: tx.paymentMethod === 'tarjeta' ? '#EEF2FF' : '#F0FDF4',
                              color: tx.paymentMethod === 'tarjeta' ? '#4F46E5' : '#16A34A'
                            }}>
                              {tx.paymentMethod === 'tarjeta' ? <CreditCard size={12} /> : <Coins size={12} />}
                              {tx.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', fontSize: '1rem', fontWeight: 700, color: '#0F172A', textAlign: 'right' }}>
                            {tx.amount.toFixed(2)}€
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Eliminar cobro"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tx-row:hover {
          background-color: #F8FAFC;
        }
        .dropdown-item-hover:hover {
          background-color: color-mix(in srgb, ${primaryColor} 6%, #F8FAFC) !important;
        }
        @media(min-width: 992px) {
          .tpv-grid {
            grid-template-columns: 500px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
