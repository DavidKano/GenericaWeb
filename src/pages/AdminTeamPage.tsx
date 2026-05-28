import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { TeamMember, CompanyData, DesignConfig, BusinessConfig } from '../services/models';
import { INITIAL_BUSINESS_CONFIG } from '../services/configDefaults';
import { PageHeader } from '../components/ui/PageHeader';
import { Users, Plus, Pencil, Trash2, X, User as UserIcon, Mail, Phone, ShieldCheck } from 'lucide-react';

export const AdminTeamPage: React.FC = () => {
  const { repo } = useData();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [design, setDesign] = useState<DesignConfig | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Modals & Forms State
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cfg, company, designCfg, members] = await Promise.all([
        repo.getConfig(),
        repo.getCompanyData(),
        repo.getDesignConfig(),
        repo.getTeamMembers(),
      ]);
      
      const activeConfig = cfg || INITIAL_BUSINESS_CONFIG;
      const expectedCapacity = members.length + 1; // 1 for the owner

      // Auto-correct capacity on page load if it differs from the expected capacity
      if (activeConfig.concurrentSlots !== expectedCapacity) {
        activeConfig.concurrentSlots = expectedCapacity;
        await repo.saveConfig(activeConfig);
      }

      setConfig(activeConfig);
      setCompanyData(company);
      setDesign(designCfg);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error cargando los datos del equipo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repo]);

  const primaryColor = design?.primaryColor || '#008080';

  // Owner Member representation
  const ownerMember = useMemo<TeamMember>(() => {
    return {
      id: 'owner',
      name: companyData?.personaContacto || user?.name || 'Propietario / Gestor',
      email: companyData?.contactEmail || user?.email || 'admin@negocio.com',
      phone: companyData?.telefono || user?.phone || '600000000',
    };
  }, [companyData, user]);

  // Combined Team List for display
  const allTeamList = useMemo(() => {
    return [ownerMember, ...teamMembers];
  }, [ownerMember, teamMembers]);

  // Synchronize Capacity (concurrentSlots) based on team size
  const syncCapacity = async (updatedMembers: TeamMember[]) => {
    try {
      const currentConfig = await repo.getConfig() || INITIAL_BUSINESS_CONFIG;
      const newCapacity = updatedMembers.length + 1; // +1 for the owner
      
      const updatedConfig: BusinessConfig = {
        ...currentConfig,
        concurrentSlots: newCapacity
      };
      
      await repo.saveConfig(updatedConfig);
      setConfig(updatedConfig);
    } catch (e) {
      console.error('Error al sincronizar la capacidad del equipo:', e);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberEmail('');
    setMemberPhone('');
    setShowModal(true);
  };

  const handleOpenEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberEmail(member.email);
    setMemberPhone(member.phone);
    setShowModal(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim() || !memberPhone.trim()) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setIsSaving(true);
    try {
      const memberToSave: TeamMember = {
        id: editingMember ? editingMember.id : 'tm-' + Date.now(),
        name: memberName.trim(),
        email: memberEmail.trim().toLowerCase(),
        phone: memberPhone.trim()
      };

      await repo.saveTeamMember(memberToSave);
      
      // Update local state
      let updatedMembers: TeamMember[];
      if (editingMember) {
        updatedMembers = teamMembers.map(m => m.id === memberToSave.id ? memberToSave : m);
      } else {
        updatedMembers = [...teamMembers, memberToSave];
      }
      setTeamMembers(updatedMembers);

      // Synchronize capacity globally
      await syncCapacity(updatedMembers);

      setShowModal(false);
      setEditingMember(null);
    } catch (err: any) {
      console.error('Error al guardar miembro del equipo:', err);
      alert('Error al guardar miembro del equipo: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (id === 'owner') return; // Protection
    
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${name} del equipo?\nLa capacidad de reservas simultáneas se reducirá en consecuencia.`)) {
      setIsLoading(true);
      try {
        await repo.deleteTeamMember(id);
        
        // Update local state
        const updatedMembers = teamMembers.filter(m => m.id !== id);
        setTeamMembers(updatedMembers);

        // Synchronize capacity globally
        await syncCapacity(updatedMembers);
      } catch (err: any) {
        console.error('Error al eliminar miembro del equipo:', err);
        alert('Error al eliminar miembro: ' + (err.message || 'Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <PageHeader 
        icon={<Users size={24} />} 
        title="Gestión de Equipo" 
        description="Gestiona los profesionales de tu centro. La capacidad de reservas simultáneas se calcula automáticamente según el tamaño del equipo." 
      />

      {isLoading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}>
          <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid ' + primaryColor, borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Cargando datos del equipo...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Capacity Alert Banner */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.15)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={18} style={{ color: '#3B82F6' }} /> Capacidad Sincronizada Automáticamente
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#1E40AF' }}>
                Actualmente tienes <strong>{allTeamList.length}</strong> miembro{allTeamList.length > 1 ? 's' : ''} registrado{allTeamList.length > 1 ? 's' : ''} (1 Gestor + {teamMembers.length} Equipo).
              </p>
            </div>
            <div style={{
              background: '#3B82F6',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)'
            }}>
              Capacidad: {config?.concurrentSlots || 1} reservas/hora
            </div>
          </div>

          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button 
              className="btn-primary" 
              onClick={handleOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '8px',
                background: primaryColor,
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 128, 128, 0.15)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Plus size={16} /> Añadir Miembro
            </button>
          </div>

          {/* Table Container */}
          <div className="card glass-panel" style={{ padding: '0px', overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--glass-border, rgba(0,0,0,0.06))' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Nombre Completo</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Teléfono</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Rol</th>
                  <th style={{ padding: '14px 20px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {allTeamList.map((member, index) => {
                  const isOwner = member.id === 'owner';
                  return (
                    <tr 
                      key={member.id} 
                      style={{ 
                        borderBottom: index === allTeamList.length - 1 ? 'none' : '1px solid #F1F5F9',
                        transition: 'background-color 0.2s',
                        background: isOwner ? 'rgba(0, 128, 128, 0.01)' : 'transparent'
                      }}
                      className="team-row"
                    >
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', fontWeight: isOwner ? 700 : 500, color: '#0F172A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            background: isOwner ? `color-mix(in srgb, ${primaryColor} 10%, #fff)` : '#F1F5F9',
                            color: isOwner ? primaryColor : '#475569',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 700
                          }}>
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                          {member.name}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={14} style={{ color: '#94A3B8' }} /> {member.email}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: '#475569' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} style={{ color: '#94A3B8' }} /> {member.phone}
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: isOwner ? `color-mix(in srgb, ${primaryColor} 12%, #fff)` : '#F1F5F9',
                          color: isOwner ? primaryColor : '#475569',
                        }}>
                          {isOwner ? 'Gestor / Propietario' : 'Miembro Equipo'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        {!isOwner ? (
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditModal(member)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#475569',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = primaryColor; }}
                              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
                              title="Editar miembro"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteMember(member.id, member.name)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '6px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#FEF2F2'}
                              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                              title="Eliminar miembro"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>Permanente</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AÑADIR / EDITAR MIEMBRO                           */}
      {/* ======================================================== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="modal-content animate-pop-in" onClick={e => e.stopPropagation()} style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserIcon size={20} style={{ color: primaryColor }} /> {editingMember ? 'Editar Miembro' : 'Añadir Miembro'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sofía Martín"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    background: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    height: '40px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Email *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                    <Mail size={14} />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="Ej. sofia@negocio.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 32px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      background: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      height: '40px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Teléfono *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                    <Phone size={14} />
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 655443322"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 32px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      background: '#fff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      height: '40px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#F1F5F9',
                    color: '#475569',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    background: primaryColor,
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: isSaving ? 0.7 : 1
                  }}
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .team-row:hover {
          background-color: rgba(0,0,0,0.015) !important;
        }
      `}</style>
    </div>
  );
};
