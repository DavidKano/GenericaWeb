import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { DaySchedule, BlockedDay, TimeRange } from '../services/models';
import { Clock, CalendarOff, Plus, Trash2, Save, Loader2, Edit2, X } from 'lucide-react';
import { INITIAL_SCHEDULES } from '../services/scheduleDefaults';
import { format, parseISO, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const DAYS_OF_WEEK = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const AdminSchedulePage: React.FC = () => {
  const { repo } = useData();
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [blockedDays, setBlockedDays] = useState<BlockedDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSchedules, setSavingSchedules] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Formulario nuevo Bloqueo
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockDate, setBlockDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isFullDay, setIsFullDay] = useState(true);
  const [blockRanges, setBlockRanges] = useState<TimeRange[]>([]);
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [sch, bDays] = await Promise.all([
        repo.getSchedules(),
        repo.getBlockedDays()
      ]);
      setSchedules(sch && sch.length > 0 ? sch : INITIAL_SCHEDULES);
      setBlockedDays(bDays || []);
      setLoading(false);
    };
    fetchData();
  }, [repo]);

  const handleSaveSchedules = async () => {
    setSavingSchedules(true);
    await repo.saveSchedules(schedules);
    alert('Horario base guardado correctamente.');
    setSavingSchedules(false);
  };

  const handleAddScheduleRange = (dayIndex: number) => {
    const newSch = [...schedules];
    newSch[dayIndex].ranges.push({ start: '09:00', end: '14:00' });
    setSchedules(newSch);
  };

  const handleUpdateScheduleRange = (dayIndex: number, rangeIndex: number, field: 'start'|'end', val: string) => {
    const newSch = [...schedules];
    newSch[dayIndex].ranges[rangeIndex][field] = val;
    setSchedules(newSch);
  };

  const handleRemoveScheduleRange = (dayIndex: number, rangeIndex: number) => {
    const newSch = [...schedules];
    newSch[dayIndex].ranges.splice(rangeIndex, 1);
    setSchedules(newSch);
  };

  const toggleDayStatus = (dayIndex: number) => {
    const newSch = [...schedules];
    newSch[dayIndex].isOpen = !newSch[dayIndex].isOpen;
    if (newSch[dayIndex].isOpen && newSch[dayIndex].ranges.length === 0) {
      newSch[dayIndex].ranges.push({ start: '09:00', end: '18:00' });
    }
    setSchedules(newSch);
  };

  const handleAddBlockRange = () => {
    setBlockRanges([...blockRanges, { start: '16:00', end: '20:00' }]);
  };

  const handleUpdateBlockRange = (index: number, field: 'start'|'end', val: string) => {
    const newRanges = [...blockRanges];
    newRanges[index][field] = val;
    setBlockRanges(newRanges);
  };

  const handleRemoveBlockRange = (index: number) => {
    const newRanges = [...blockRanges];
    newRanges.splice(index, 1);
    setBlockRanges(newRanges);
  };

  const handleEditBlockedDay = (b: BlockedDay) => {
    setEditingBlockId(b.id);
    setBlockDate(b.date);
    setBlockEndDate('');
    setBlockReason(b.reason || '');
    setIsFullDay(b.isFullDay !== false);
    setBlockRanges(b.blockedRanges || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBlockId(null);
    setBlockDate('');
    setBlockEndDate('');
    setBlockReason('');
    setIsFullDay(true);
    setBlockRanges([]);
  };

  const handleSaveBlockedDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate) return;
    
    // Validar lógicamente
    if (!isFullDay && blockRanges.length === 0) {
      alert('Debes añadir al menos una franja horaria para el bloqueo parcial.');
      return;
    }

    setSavingBlock(true);

    try {
      const datesToBlock: string[] = [];
      if (isFullDay && blockEndDate && blockEndDate >= blockDate) {
        let current = parseISO(blockDate);
        const end = parseISO(blockEndDate);
        while (current <= end) {
          datesToBlock.push(format(current, 'yyyy-MM-dd'));
          current = addDays(current, 1);
        }
      } else {
        datesToBlock.push(blockDate);
      }
      
      const savePromises = datesToBlock.map(async (dateKey) => {
        const isEditingCurrent = editingBlockId && datesToBlock.length === 1;
        const existingIndex = blockedDays.findIndex(b => b.date === dateKey);
        
        let targetId = `blocked-${dateKey}-${Date.now().toString().slice(-4)}`;
        if (isEditingCurrent) {
           targetId = editingBlockId;
        } else if (existingIndex >= 0) {
           targetId = blockedDays[existingIndex].id;
        }

        const newBlock: any = {
          id: targetId,
          date: dateKey,
          reason: blockReason || '',
          isFullDay: !!isFullDay
        };

        if (!isFullDay && blockRanges.length > 0) {
          newBlock.blockedRanges = blockRanges;
        }

        return repo.saveBlockedDay(newBlock as BlockedDay);
      });

      await Promise.all(savePromises);
      
      const bDays = await repo.getBlockedDays();
      setBlockedDays(bDays);
      
      // Reiniciar form
      handleCancelEdit();
    } catch (err: any) {
      console.error("Error saving blocked days:", err);
      alert(`Error al guardar: ${err.message || 'Error desconocido'}. Por favor, revisa tu conexión e inténtalo de nuevo.`);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlockedDay = async (id: string) => {
    await repo.deleteBlockedDay(id);
    setBlockedDays(prev => prev.filter(b => b.id !== id));
  };


  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><Loader2 className="animate-spin" size={32} /></div>;

  // Ordenar horario de Lunes(1) a Domingo(0) para mostrar
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
    const dayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
    return dayA - dayB;
  });

  // Próximos bloqueos (orden cronológico)
  const sortedBlocked = [...blockedDays].sort((a,b) => a.date.localeCompare(b.date)).filter(b => b.date >= format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="admin-schedule-container animate-fade-in">
      <style>{`
        .admin-schedule-container {
          width: 100%;
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          box-sizing: border-box;
        }
        @media (max-width: 768px) {
          .admin-schedule-container {
            padding: 1rem 16px;
          }
        }
        
        .schedule-card {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          padding: 2rem;
        }
        @media (max-width: 768px) {
          .schedule-card {
            padding: 1.5rem 1rem;
          }
        }

        /* Day row */
        .day-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 1.25rem 0;
          border-bottom: 1px solid #F1F5F9;
          transition: opacity 0.2s ease;
        }
        .day-row:last-child {
          border-bottom: none;
        }
        
        .day-info {
          width: 130px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .time-ranges-container {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .time-range-block {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #FFFFFF;
          padding: 0.5rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          transition: all 0.2s ease;
          min-width: 220px;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .time-range-block:focus-within {
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .time-input {
          border: none;
          outline: none;
          background: transparent;
          width: 80px;
          font-size: 0.95rem;
          color: #1E293B;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-delete-range {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #EF4444;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background 0.2s;
        }
        .btn-delete-range:hover {
          background: #FEE2E2;
        }

        .btn-add-range-link {
          font-size: 0.875rem;
          color: var(--primary-color, #3b82f6);
          background: transparent;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .btn-add-range-link:hover {
          color: color-mix(in srgb, var(--primary-color, #3b82f6) 80%, black);
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          .day-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1.25rem 0;
          }
          .day-info {
            width: 100%;
          }
          .time-ranges-container {
            width: 100%;
          }
          .time-range-block {
            width: 100%;
            justify-content: space-between;
          }
          .time-input {
            width: 45%;
            text-align: center;
          }
        }

        /* Form Group clean overrides */
        .clean-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .clean-form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }
        .clean-input {
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s;
          background: #FFFFFF;
        }
        .clean-input:focus {
          border-color: var(--primary-color, #3b82f6);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        /* Exceptions list-items with vertical border */
        .exception-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          border-bottom: 1px solid #F1F5F9;
          transition: background-color 0.2s;
          background: #FFFFFF;
          box-sizing: border-box;
        }
        .exception-item:last-child {
          border-bottom: none;
        }
        .exception-item:hover {
          background-color: #F8FAFC;
        }
        
        .action-btn-container {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        @media (max-width: 768px) {
          .action-btn-container {
            width: 100%;
          }
          .action-btn-container button {
            width: 100%;
          }
        }
        
        .hover-action {
          transition: all 0.2s ease;
          border-radius: 6px;
        }
        .hover-action:hover {
          background-color: #F1F5F9 !important;
        }
      `}</style>
      
      <section className="schedule-card">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          <Clock size={22} color="var(--primary-color)" /> Horario Estándar Semanal
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Define qué días abres y tus turnos u horas de apertura. Los cambios aplicarán a todas las citas futures.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {sortedSchedules.map((sch) => {
            const originalIndex = schedules.findIndex(s => s.dayOfWeek === sch.dayOfWeek);
            const rangesToRender = sch.ranges;
            return (
              <div key={sch.dayOfWeek} className="day-row" style={{ opacity: sch.isOpen ? 1 : 0.4 }}>
                <div className="day-info">
                  <input 
                    type="checkbox" 
                    id={`checkbox-${sch.dayOfWeek}`}
                    checked={sch.isOpen} 
                    onChange={() => toggleDayStatus(originalIndex)} 
                    style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--primary-color)' }} 
                  />
                  <label 
                    htmlFor={`checkbox-${sch.dayOfWeek}`}
                    style={{ 
                      color: sch.isOpen ? 'var(--text-primary)' : 'var(--text-secondary)', 
                      fontSize: '0.95rem', 
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    {DAYS_OF_WEEK[sch.dayOfWeek]}
                  </label>
                </div>

                <div className="time-ranges-container">
                  {sch.isOpen ? (
                    <>
                      {rangesToRender.map((range, rIdx) => (
                        <div key={rIdx} className="time-range-block">
                          <Clock size={15} style={{ color: '#94A3B8', flexShrink: 0 }} />
                          <input 
                            type="time" 
                            value={range.start} 
                            onChange={e => handleUpdateScheduleRange(originalIndex, rIdx, 'start', e.target.value)} 
                            className="time-input" 
                          />
                          <span style={{ color: '#94A3B8' }}>-</span>
                          <input 
                            type="time" 
                            value={range.end} 
                            onChange={e => handleUpdateScheduleRange(originalIndex, rIdx, 'end', e.target.value)} 
                            className="time-input" 
                          />
                          <button 
                            type="button"
                            onClick={() => handleRemoveScheduleRange(originalIndex, rIdx)} 
                            className="btn-delete-range"
                            title="Eliminar turno"
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                      ))}
                      <button 
                        type="button"
                        onClick={() => handleAddScheduleRange(originalIndex)} 
                        className="btn-add-range-link"
                      >
                        <Plus size={16}/> Turno
                      </button>
                    </>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '0.95rem', fontStyle: 'italic', fontWeight: 500 }}>
                      Cerrado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="action-btn-container" style={{ marginTop: '2rem' }}>
          <button 
            onClick={handleSaveSchedules} 
            disabled={savingSchedules} 
            className="btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            {savingSchedules ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            Guardar Horario Base
          </button>
        </div>
      </section>

      <section className="schedule-card">
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          <CalendarOff size={22} color="#ef4444" /> Vacaciones y Excepciones
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Bloquea días completos por vacaciones, o anula ciertas horas de un día específico (ej. "Esta tarde cerrado por curso").
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr', gap: '2.5rem', alignItems: 'start' }}>
          
          {/* Columna Izquierda: Añadir Excepción */}
          <form onSubmit={handleSaveBlockedDay} style={{ background: 'transparent', padding: '0', border: 'none' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600, color: 'var(--text-primary)' }}>
              <span>{editingBlockId ? 'Editar Excepción' : 'Añadir Excepción'}</span>
              {editingBlockId && (
                <button type="button" onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                  <X size={16} /> Cancelar
                </button>
              )}
            </h3>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', padding: '0.25rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                <input type="radio" checked={isFullDay} onChange={() => setIsFullDay(true)} style={{ accentColor: 'var(--primary-color)' }} />
                Día completo cerrado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                <input type="radio" checked={!isFullDay} onChange={() => setIsFullDay(false)} style={{ accentColor: 'var(--primary-color)' }} />
                Bloquear solo unas horas
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="clean-form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', marginBottom: '0.375rem', display: 'block' }}>{isFullDay ? 'Desde Fecha' : 'Fecha a bloquear'}</label>
                <input 
                  type="date" 
                  value={blockDate} 
                  onChange={e => setBlockDate(e.target.value)} 
                  required 
                  min={format(new Date(), 'yyyy-MM-dd')} 
                  className="clean-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              
              {isFullDay && !editingBlockId && (
                <div className="clean-form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', marginBottom: '0.375rem', display: 'block' }}>Hasta Fecha (Opcional)</label>
                  <input 
                    type="date" 
                    value={blockEndDate} 
                    onChange={e => setBlockEndDate(e.target.value)} 
                    min={blockDate || format(new Date(), 'yyyy-MM-dd')} 
                    className="clean-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              )}
            </div>

            <div className="clean-form-group">
              <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#475569', marginBottom: '0.375rem', display: 'block' }}>Motivo (opcional, solo para ti)</label>
              <input 
                type="text" 
                value={blockReason} 
                onChange={e => setBlockReason(e.target.value)} 
                placeholder="Ej: Vacaciones de verano" 
                className="clean-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {!isFullDay && (
              <div style={{ padding: '1.25rem 0', background: 'transparent', borderTop: '1px dashed #E2E8F0', borderBottom: '1px dashed #E2E8F0', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontWeight: 500 }}>
                  Añade y especifica las franjas horarias que NO estarán disponibles (ej. tarde libre).
                </p>
                {blockRanges.map((br, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                     <input 
                       type="time" 
                       required 
                       value={br.start} 
                       onChange={e => handleUpdateBlockRange(idx, 'start', e.target.value)} 
                       className="clean-input"
                       style={{ padding: '0.5rem', width: '120px' }}
                     />
                     <span style={{ color: '#94A3B8' }}>-</span>
                     <input 
                       type="time" 
                       required 
                       value={br.end} 
                       onChange={e => handleUpdateBlockRange(idx, 'end', e.target.value)} 
                       className="clean-input"
                       style={{ padding: '0.5rem', width: '120px' }}
                     />
                     <button 
                       type="button" 
                       onClick={() => handleRemoveBlockRange(idx)} 
                       className="btn-delete-range" 
                       style={{ padding: '0.5rem' }}
                     >
                       <Trash2 size={16}/>
                     </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={handleAddBlockRange} 
                  className="btn-add-range-link"
                  style={{ marginTop: '0.5rem' }}
                >
                   <Plus size={16}/> Otra franja
                </button>
              </div>
            )}

            <div className="action-btn-container" style={{ marginTop: '1.5rem' }}>
              <button 
                type="submit" 
                disabled={savingBlock} 
                className="btn-primary" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '0.5rem', 
                  padding: '12px 24px', 
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              >
                 {savingBlock ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                 {editingBlockId ? 'Guardar Cambios' : 'Añadir Bloqueo'}
              </button>
            </div>
          </form>

          {/* Columna Derecha: Próximas Excepciones */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Próximas Excepciones ({sortedBlocked.length})</h3>
            {sortedBlocked.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No hay bloqueos configurados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden' }}>
                {sortedBlocked.map(b => (
                  <div 
                    key={b.id} 
                    className="exception-item" 
                    style={{ borderLeft: b.isFullDay !== false ? '3px solid #ef4444' : '3px solid #f59e0b' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                      <CalendarOff size={18} style={{ color: b.isFullDay !== false ? '#EF4444' : '#F59E0B', minWidth: '18px' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.95rem', color: '#1E293B', fontWeight: 600 }}>
                          {format(parseISO(b.date), 'EEEE, d MMMM yyyy', { locale: es })}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                          {b.reason ? `${b.reason} • ` : ''}{b.isFullDay !== false ? 'Todo el día cerrado' : `Cierre parcial: ${b.blockedRanges?.map(r => `${r.start}-${r.end}`).join(' y ')}`}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '1rem' }}>
                      <button 
                        onClick={() => handleEditBlockedDay(b)} 
                        title="Editar bloqueo" 
                        style={{ background: 'transparent', color: '#3B82F6', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        className="hover-action"
                      >
                        <Edit2 size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteBlockedDay(b.id)} 
                        title="Eliminar bloqueo" 
                        style={{ background: 'transparent', color: '#EF4444', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        className="hover-action"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1.5rem' }}>Solo se muestran las excepciones desde el día de hoy en adelante.</p>
          </div>

        </div>
      </section>
      
    </div>
  );
};
