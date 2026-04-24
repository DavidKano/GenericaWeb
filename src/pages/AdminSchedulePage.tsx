import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import type { DaySchedule, BlockedDay, TimeRange } from '../services/models';
import { Clock, CalendarOff, Plus, Trash2, Save, Loader2 } from 'lucide-react';
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
        const existingIndex = blockedDays.findIndex(b => b.date === dateKey);
        
        // Creamos el objeto dinámicamente para no enviar undefined
        const newBlock: any = {
          id: existingIndex >= 0 ? blockedDays[existingIndex].id : `blocked-${dateKey}-${Date.now().toString().slice(-4)}`,
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
      setBlockDate('');
      setBlockEndDate('');
      setBlockReason('');
      setIsFullDay(true);
      setBlockRanges([]);
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
    <div className="animate-fade-in" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      <section className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <Clock size={22} color="var(--primary-color)" /> Horario Estándar Semanal
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Define qué días abres y tus turnos u horas de apertura. Los cambios aplicarán a todas las citas futuras.
        </p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {sortedSchedules.map((sch) => {
            const originalIndex = schedules.findIndex(s => s.dayOfWeek === sch.dayOfWeek);
            return (
              <div key={sch.dayOfWeek} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', padding: isMobile ? '1rem 0.5rem' : '1rem', background: sch.isOpen ? 'var(--bg-color)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', opacity: sch.isOpen ? 1 : 0.6 }}>
                
                <div style={{ width: isMobile ? '90px' : '120px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" checked={sch.isOpen} onChange={() => toggleDayStatus(originalIndex)} style={{ cursor: 'pointer', transform: 'scale(1.1)' }} />
                  <strong style={{ color: 'var(--text-primary)', fontSize: isMobile ? '0.85rem' : '1rem' }}>{DAYS_OF_WEEK[sch.dayOfWeek].slice(0, isMobile ? 3 : undefined)}</strong>
                </div>

                {sch.isOpen ? (
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                    {sch.ranges.map((range, rIdx) => (
                      <div key={rIdx} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.25rem' : '0.5rem', background: '#fff', padding: isMobile ? '0.3rem 0.4rem' : '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <input type="time" value={range.start} onChange={e => handleUpdateScheduleRange(originalIndex, rIdx, 'start', e.target.value)} style={{ border:'none', outline:'none', background:'transparent', width: isMobile ? '80px' : '90px', fontSize: isMobile ? '0.85rem' : '1rem' }} />
                        <span style={{ opacity: 0.5 }}>-</span>
                        <input type="time" value={range.end} onChange={e => handleUpdateScheduleRange(originalIndex, rIdx, 'end', e.target.value)} style={{ border:'none', outline:'none', background:'transparent', width: isMobile ? '80px' : '90px', fontSize: isMobile ? '0.85rem' : '1rem' }} />
                        <button onClick={() => handleRemoveScheduleRange(originalIndex, rIdx)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'#ef4444', marginLeft: isMobile ? '0.2rem' : '0.5rem', padding:0 }}><Trash2 size={14}/></button>
                      </div>
                    ))}
                    <button onClick={() => handleAddScheduleRange(originalIndex)} className="btn-text" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <Plus size={16}/> Turno
                    </button>
                  </div>
                ) : (
                  <div style={{ flex: 1, color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                    Cerrado
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSaveSchedules} disabled={savingSchedules} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {savingSchedules ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            Guardar Horario Base
          </button>
        </div>
      </section>

      <section className="card glass-panel" style={{ padding: isMobile ? '1.5rem 1rem' : '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
          <CalendarOff size={22} color="#ef4444" /> Vacaciones y Excepciones
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Bloquea días completos por vacaciones, o anula ciertas horas de un día específico (ej. "Esta tarde cerrado por curso").
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Formulario de añadir */}
          <form onSubmit={handleSaveBlockedDay} style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Añadir Excepción</h3>
            
            <div className="form-group" style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', cursor: 'pointer' }}>
                <input type="radio" checked={isFullDay} onChange={() => setIsFullDay(true)} />
                Día completo cerrado
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'normal', cursor: 'pointer' }}>
                <input type="radio" checked={!isFullDay} onChange={() => setIsFullDay(false)} />
                Bloquear solo unas horas
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>{isFullDay ? 'Desde Fecha' : 'Fecha a bloquear'}</label>
                <input type="date" value={blockDate} onChange={e => setBlockDate(e.target.value)} required min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              
              {isFullDay && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hasta Fecha (Opcional)</label>
                  <input type="date" value={blockEndDate} onChange={e => setBlockEndDate(e.target.value)} min={blockDate || format(new Date(), 'yyyy-MM-dd')} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Motivo (opcional, solo para ti)</label>
              <input type="text" value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Ej: Vacaciones de verano" />
            </div>

            {!isFullDay && (
              <div style={{ padding: '1rem', background: '#fff', borderRadius: '6px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Añade y especifica las franjas horarias que NO estarán disponibles (ej. tarde libre).</p>
                {blockRanges.map((br, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                     <input type="time" required value={br.start} onChange={e => handleUpdateBlockRange(idx, 'start', e.target.value)} />
                     <span>-</span>
                     <input type="time" required value={br.end} onChange={e => handleUpdateBlockRange(idx, 'end', e.target.value)} />
                     <button type="button" onClick={() => handleRemoveBlockRange(idx)} style={{ color: '#ef4444', background: 'transparent', border:'none', cursor:'pointer' }}><Trash2 size={18}/></button>
                  </div>
                ))}
                <button type="button" onClick={handleAddBlockRange} className="btn-text" style={{ color: 'var(--primary-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                   <Plus size={16}/> Otra franja
                </button>
              </div>
            )}

            <button type="submit" disabled={savingBlock} className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
               {savingBlock ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Añadir Bloqueo
            </button>
          </form>

          {/* Lista de bloqueos actuales */}
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Próximas Excepciones ({sortedBlocked.length})</h3>
            {sortedBlocked.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No hay bloqueos configurados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedBlocked.map(b => (
                  <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderLeft: b.isFullDay !== false ? '4px solid #ef4444' : '4px solid #f59e0b', borderRadius: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem', display: 'block' }}>
                        {format(parseISO(b.date), 'EEEE, d MMMM yyyy', { locale: es })}
                      </strong>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {b.reason || 'Sin motivo'} • {b.isFullDay !== false ? 'Todo el día cerrado' : `Cierre parcial: ${b.blockedRanges?.map(r => `${r.start}-${r.end}`).join(' y ')}`}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteBlockedDay(b.id)} title="Eliminar bloqueo" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0.5rem', borderRadius: '6px', cursor: 'pointer' }}>
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>Solo se muestran las excepciones desde el día de hoy en adelante.</p>
          </div>

        </div>
      </section>
      
    </div>
  );
};
