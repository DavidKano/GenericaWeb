import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { BookingService, User, Transaction, DesignConfig } from '../services/models';
import { PageHeader } from '../components/ui/PageHeader';
import { CreditCard, Coins, Check, Trash2, User as UserIcon, Briefcase, Calculator, RefreshCw, Euro } from 'lucide-react';

export const AdminTpvPage: React.FC = () => {
  const { repo } = useData();

  const [design, setDesign] = useState<DesignConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // TPV Form State
  const [amount, setAmount] = useState<number | string>('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'metalico' | 'mixto'>('tarjeta');
  
  // Mixed Payment Details
  const [mixedCashAmount, setMixedCashAmount] = useState<number | string>('');
  const [mixedCardAmount, setMixedCardAmount] = useState<number | string>('');

  // Cash Return Calculation Details
  const [cashGiven, setCashGiven] = useState<number | string>('');
  const [changeAmount, setChangeAmount] = useState<number>(0);

  // Notes
  const [notes, setNotes] = useState('');

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

  // Handle service select to autofill price
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    if (serviceId) {
      const selected = services.find(s => s.id === serviceId);
      if (selected && selected.price !== undefined) {
        setAmount(selected.price);
        // Reset mixed amounts
        setMixedCashAmount('');
        setMixedCardAmount('');
      }
    }
  };

  // Mixed payment sync
  useEffect(() => {
    const total = Number(amount) || 0;
    if (paymentMethod === 'mixto' && total > 0) {
      const cash = Number(mixedCashAmount) || 0;
      if (cash > total) {
        setMixedCashAmount(total);
        setMixedCardAmount(0);
      } else {
        setMixedCardAmount(Number((total - cash).toFixed(2)));
      }
    }
  }, [amount, mixedCashAmount, paymentMethod]);

  // Cash return calculation
  useEffect(() => {
    const totalToPay = paymentMethod === 'mixto' ? (Number(mixedCashAmount) || 0) : (Number(amount) || 0);
    const given = Number(cashGiven) || 0;
    if (paymentMethod !== 'tarjeta' && given >= totalToPay) {
      setChangeAmount(Number((given - totalToPay).toFixed(2)));
    } else {
      setChangeAmount(0);
    }
  }, [amount, cashGiven, paymentMethod, mixedCashAmount]);

  // Reset form
  const resetForm = () => {
    setAmount('');
    setSelectedServiceId('');
    setSelectedCustomerId('');
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
    const totalAmount = Number(amount) || 0;
    if (totalAmount <= 0) {
      alert('Por favor, indica un importe válido mayor que cero.');
      return;
    }

    setIsSaving(true);
    try {
      const now = Date.now();
      const baseTransaction = {
        serviceId: selectedServiceId || undefined,
        customerId: selectedCustomerId || undefined,
        notes: notes.trim() || undefined,
        date: now,
      };

      if (paymentMethod === 'mixto') {
        const cashPart = Number(mixedCashAmount) || 0;
        const cardPart = Number(mixedCardAmount) || 0;

        if (cashPart + cardPart !== totalAmount) {
          alert('La suma de las partes no coincide con el total.');
          setIsSaving(false);
          return;
        }

        // Save two separate transactions (cash portion and card portion)
        if (cashPart > 0) {
          const txCash: Transaction = {
            ...baseTransaction,
            id: `tx-cash-${now}-${Math.floor(Math.random() * 1000)}`,
            amount: cashPart,
            paymentMethod: 'metalico',
          };
          await repo.saveTransaction(txCash);
        }

        if (cardPart > 0) {
          const txCard: Transaction = {
            ...baseTransaction,
            id: `tx-card-${now}-${Math.floor(Math.random() * 1000)}`,
            amount: cardPart,
            paymentMethod: 'tarjeta',
          };
          await repo.saveTransaction(txCard);
        }
      } else {
        // Single payment method transaction
        const tx: Transaction = {
          ...baseTransaction,
          id: `tx-${now}-${Math.floor(Math.random() * 1000)}`,
          amount: totalAmount,
          paymentMethod: paymentMethod === 'tarjeta' ? 'tarjeta' : 'metalico',
        };
        await repo.saveTransaction(tx);
      }

      alert('¡Cobro registrado con éxito!');
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error registrando cobro:', error);
      alert('Ocurrió un error al registrar el cobro en la base de datos.');
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
        description="Gestiona y registra los cobros de servicios de forma rápida, simula vueltas de efectivo y gestiona pagos mixtos."
      />

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: primaryColor }} />
          <span style={{ color: '#64748B', fontWeight: 500 }}>Cargando datos del TPV...</span>
        </div>
      ) : (
        <div className="tpv-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', width: '100%' }}>
          
          {/* Form and Simulator column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <h2 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-color, #0F172A)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Euro size={20} style={{ color: primaryColor }} /> Nuevo Cobro
              </h2>

              <form onSubmit={handleCharge} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* 1. Selector de Servicio */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Servicio Asociado (Opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      <Briefcase size={18} />
                    </span>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => handleServiceChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: '#fff',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: selectedServiceId ? '#0F172A' : '#94A3B8'
                      }}
                    >
                      <option value="" style={{ color: '#94A3B8' }}>-- Ningún servicio (Cobro directo) --</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id} style={{ color: '#0F172A' }}>
                          {s.name} {s.price !== undefined ? `(${s.price}€)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Selector de Cliente */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Cliente Asociado (Opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      <UserIcon size={18} />
                    </span>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 38px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        background: '#fff',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        color: selectedCustomerId ? '#0F172A' : '#94A3B8'
                      }}
                    >
                      <option value="" style={{ color: '#94A3B8' }}>-- Cliente no identificado (Venta rápida) --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id} style={{ color: '#0F172A' }}>
                          {c.name} {c.phone ? `(${c.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Importe a cobrar */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Importe Total a Cobrar (€) *</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontWeight: 700, fontSize: '1.1rem' }}>
                      €
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        // Reset mixed amounts
                        setMixedCashAmount('');
                        setMixedCardAmount('');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 32px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        color: primaryColor,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* 4. Método de pago */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Método de Pago</label>
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
                        // Auto split 50/50 initially
                        const total = Number(amount) || 0;
                        setMixedCashAmount((total / 2).toFixed(2));
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

                {/* 5. Pago Mixto Desglose (si aplica) */}
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
                          max={amount || undefined}
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

                {/* 6. Simulador de Cambio (Efectivo o Mixto) */}
                {paymentMethod !== 'tarjeta' && (Number(amount) > 0) && (
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
                          : `Dinero Entregado en Efectivo (Total a pagar: ${Number(amount).toFixed(2)}€)`
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

                {/* 7. Notas adicionales */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Notas / Concepto (Opcional)</label>
                  <textarea
                    placeholder="Notas internas del cobro..."
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

                {/* Button Charge */}
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

          {/* Recent transactions column */}
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
        @media(min-width: 992px) {
          .tpv-grid {
            grid-template-columns: 480px 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
