import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import type { BookingService, User, Transaction, DesignConfig, CashClose } from '../services/models';
import { PageHeader } from '../components/ui/PageHeader';
import { CreditCard, Coins, Check, Trash2, User as UserIcon, Briefcase, Calculator, RefreshCw, Euro, Plus, X, BarChart3, Archive, History, Search, ArrowLeft, CalendarDays, FileText } from 'lucide-react';

interface TicketItem {
  id: string; // Unique ID inside the current ticket
  serviceId?: string; // Optional if it is a manual concept
  name: string;
  price: number;
}

export const AdminTpvPage: React.FC = () => {
  const { repo } = useData();
  const { user } = useAuth();
  const location = useLocation();

  const [design, setDesign] = useState<DesignConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [services, setServices] = useState<BookingService[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cashCloses, setCashCloses] = useState<CashClose[]>([]);

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

  // Export & Modals State
  
  const [showCloseBoxModal, setShowCloseBoxModal] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [selectedCloseDate, setSelectedCloseDate] = useState<Date | null>(null);
  const [hasPromptedPendingClose, setHasPromptedPendingClose] = useState(false);
  
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Sub-view mode
  const [activeView, setActiveView] = useState<'tpv' | 'cierres' | 'ventas'>('tpv');
  
  // History Filters
  const [closeSearchQuery, setCloseSearchQuery] = useState('');
  const [closeStartDate, setCloseStartDate] = useState('');
  const [closeEndDate, setCloseEndDate] = useState('');
  
  // Selected close details
  const [selectedCloseForDetail, setSelectedCloseForDetail] = useState<CashClose | null>(null);

  // Dashboard Analytics States
  const [reportType, setReportType] = useState<'servicio' | 'cliente' | 'periodo'>('servicio');
  const [filterStartDate, setFilterStartDate] = useState<string>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [filterEndDate, setFilterEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedFilterServices, setSelectedFilterServices] = useState<string[]>([]);
  const [selectedFilterCustomers, setSelectedFilterCustomers] = useState<string[]>([]);
  const [selectedFilterMethods, setSelectedFilterMethods] = useState<string[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  // Dropdowns states for multi-check boxes
  const [isServiceFilterOpen, setIsServiceFilterOpen] = useState(false);
  const [isCustomerFilterOpen, setIsCustomerFilterOpen] = useState(false);
  const [isMethodFilterOpen, setIsMethodFilterOpen] = useState(false);
  
  // Refs for click outside dropdown filters
  const serviceFilterRef = useRef<HTMLDivElement>(null);
  const customerFilterRef = useRef<HTMLDivElement>(null);
  const methodFilterRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dashboard filters
  useEffect(() => {
    const handleClickOutsideFilters = (e: MouseEvent) => {
      const target = e.target as Node;
      if (serviceFilterRef.current && !serviceFilterRef.current.contains(target)) {
        setIsServiceFilterOpen(false);
      }
      if (customerFilterRef.current && !customerFilterRef.current.contains(target)) {
        setIsCustomerFilterOpen(false);
      }
      if (methodFilterRef.current && !methodFilterRef.current.contains(target)) {
        setIsMethodFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideFilters);
    return () => document.removeEventListener('mousedown', handleClickOutsideFilters);
  }, []);

  // Filtered transactions for the Sales Dashboard
  const filteredDashboardTransactions = useMemo(() => {
    const start = new Date(filterStartDate + 'T00:00:00').getTime();
    const end = new Date(filterEndDate + 'T23:59:59').getTime();

    return transactions.filter(tx => {
      // 1. Date check
      if (tx.date < start || tx.date > end) return false;

      // 2. Service check
      if (selectedFilterServices.length > 0) {
        const svcId = tx.serviceId || 'manual';
        if (!selectedFilterServices.includes(svcId)) return false;
      }

      // 3. Customer check
      if (selectedFilterCustomers.length > 0) {
        const custId = tx.customerId || 'venta-rapida';
        if (!selectedFilterCustomers.includes(custId)) return false;
      }

      // 4. Payment method check
      if (selectedFilterMethods.length > 0) {
        if (!selectedFilterMethods.includes(tx.paymentMethod)) return false;
      }

      return true;
    });
  }, [transactions, filterStartDate, filterEndDate, selectedFilterServices, selectedFilterCustomers, selectedFilterMethods]);

  // KPI Metrics based on filtered transactions
  const dashboardMetrics = useMemo(() => {
    const total = filteredDashboardTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const count = filteredDashboardTransactions.length;
    const average = count > 0 ? total / count : 0;

    return {
      total: Number(total.toFixed(2)),
      count,
      average: Number(average.toFixed(2))
    };
  }, [filteredDashboardTransactions]);

  // Grouped data based on report type and auto interval calculations
  const dashboardGroupedData = useMemo(() => {
    const groups: Record<string, { label: string; amount: number; count: number }> = {};

    filteredDashboardTransactions.forEach(tx => {
      let key = '';
      let label = '';

      if (reportType === 'servicio') {
        key = tx.serviceId || 'manual';
        label = services.find(s => s.id === tx.serviceId)?.name || tx.notes || 'Ventas Manuales Directas';
      } else if (reportType === 'cliente') {
        key = tx.customerId || 'venta-rapida';
        label = key === 'venta-rapida' ? 'Venta Rápida (Sin Cliente)' : (customers.find(c => c.id === key)?.name || 'Cliente Desconocido');
      } else if (reportType === 'periodo') {
        const dateObj = new Date(tx.date);
        const start = new Date(filterStartDate + 'T00:00:00').getTime();
        const end = new Date(filterEndDate + 'T23:59:59').getTime();
        const diffDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

        if (diffDays <= 31) {
          // Group by Day (e.g. "26 May")
          key = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
          label = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        } else {
          // Group by Month (e.g. "May 2026")
          key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          label = dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }
      }

      if (!groups[key]) {
        groups[key] = { label, amount: 0, count: 0 };
      }
      groups[key].amount += tx.amount;
      groups[key].count += 1;
    });

    const sorted = Object.entries(groups).map(([id, item]) => ({
      id,
      label: item.label,
      amount: Number(item.amount.toFixed(2)),
      count: item.count
    }));

    if (reportType === 'periodo') {
      return sorted.sort((a, b) => a.id.localeCompare(b.id));
    }
    return sorted.sort((a, b) => b.amount - a.amount);
  }, [filteredDashboardTransactions, reportType, filterStartDate, filterEndDate, services, customers]);

  // Fetch initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [svcs, usrs, txs, cfg, closes] = await Promise.all([
        repo.getServices(),
        repo.getUsers(),
        repo.getTransactions(),
        repo.getDesignConfig(),
        repo.getCashCloses(),
      ]);
      setServices(svcs.filter(s => s.isActive));
      setCustomers(usrs.filter(u => u.role === 'CUSTOMER'));
      
      // Sort transactions by date descending
      const sortedTxs = [...txs].sort((a, b) => b.date - a.date);
      setTransactions(sortedTxs);
      
      // Sort cash closes by date descending
      const sortedCloses = [...closes].sort((a, b) => b.date - a.date);
      setCashCloses(sortedCloses);
      
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

  // Scan for past days with transactions but no cash close
  const pendingCloseDates = useMemo(() => {
    if (transactions.length === 0) return [];
    const now = new Date();
    const pending: Date[] = [];
    
    // Look back up to 7 days in the past
    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const start = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()).getTime();
      const end = start + 24 * 60 * 60 * 1000 - 1;
      
      const hasTxs = transactions.some(tx => tx.date >= start && tx.date <= end);
      if (!hasTxs) continue;
      
      const hasClose = cashCloses.some(c => c.date >= start && c.date <= end);
      if (!hasClose) {
        pending.push(checkDate);
      }
    }
    return pending;
  }, [transactions, cashCloses]);

  // Prompt user on load if there are pending cash closes
  useEffect(() => {
    if (pendingCloseDates.length > 0 && !hasPromptedPendingClose && !isLoading) {
      setHasPromptedPendingClose(true);
      const mostRecentPending = pendingCloseDates[0];
      const formattedDate = mostRecentPending.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      const confirmClose = window.confirm(
        `Atención: El cierre de caja del día (${formattedDate}) quedó pendiente.\n\n¿Deseas realizar el cierre de caja de ese día ahora?`
      );
      
      if (confirmClose) {
        setSelectedCloseDate(mostRecentPending);
        setShowCloseBoxModal(true);
      }
    }
  }, [pendingCloseDates, hasPromptedPendingClose, isLoading]);

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



  // Helper to calculate close data for any given date
  const getCloseDataForDate = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000 - 1;
    const dayTxs = transactions.filter(tx => tx.date >= start && tx.date <= end);
    const cash = dayTxs.filter(tx => tx.paymentMethod === 'metalico').reduce((s, tx) => s + tx.amount, 0);
    const card = dayTxs.filter(tx => tx.paymentMethod === 'tarjeta').reduce((s, tx) => s + tx.amount, 0);
    
    return {
      cash: Number(cash.toFixed(2)),
      card: Number(card.toFixed(2)),
      total: Number((cash + card).toFixed(2)),
      count: dayTxs.length,
      start,
      end
    };
  };

  // Perform daily cash close
  const handleCreateCashClose = async () => {
    const closeDate = selectedCloseDate || new Date();
    const { cash, card, total, start } = getCloseDataForDate(closeDate);

    setIsSaving(true);
    try {
      const closeObj: CashClose = {
        id: `close-${Date.now()}`,
        // Use noon of that day for historical closes to ensure it stays in that day
        date: selectedCloseDate ? (start + 12 * 60 * 60 * 1000) : Date.now(),
        totalCash: cash,
        totalCard: card,
        totalAmount: total,
        closedBy: user?.name || 'Administrador',
        notes: closeNotes.trim() || undefined
      };

      await repo.saveCashClose(closeObj);
      alert('¡Cierre de caja guardado con éxito!');
      setShowCloseBoxModal(false);
      setSelectedCloseDate(null);
      setCloseNotes('');
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Error guardando el cierre de caja.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations for current Cash Close preview (today or selected close date)
  const todayCloseData = useMemo(() => {
    return getCloseDataForDate(selectedCloseDate || new Date());
  }, [transactions, selectedCloseDate]);

  // Calculations for the interactive Analytics modal
  const metrics = useMemo(() => {
    const totalRevenue = transactions.reduce((s, t) => s + t.amount, 0);
    const count = transactions.length;
    const averageTicket = count > 0 ? (totalRevenue / count) : 0;
    
    // Payment method distribution
    const cashTotal = transactions.filter(tx => tx.paymentMethod === 'metalico').reduce((s, t) => s + t.amount, 0);
    const cardTotal = transactions.filter(tx => tx.paymentMethod === 'tarjeta').reduce((s, t) => s + t.amount, 0);
    const cashPercent = totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 50;
    const cardPercent = totalRevenue > 0 ? Math.round((cardTotal / totalRevenue) * 100) : 50;

    // Top services revenue and count
    const serviceMap: Record<string, { name: string, count: number, total: number }> = {};
    transactions.forEach(tx => {
      if (tx.serviceId) {
        const foundS = services.find(s => s.id === tx.serviceId);
        const name = foundS ? foundS.name : 'Servicio Desconocido';
        if (!serviceMap[tx.serviceId]) {
          serviceMap[tx.serviceId] = { name, count: 0, total: 0 };
        }
        serviceMap[tx.serviceId].count += 1;
        serviceMap[tx.serviceId].total += tx.amount;
      } else {
        if (!serviceMap['manual']) {
          serviceMap['manual'] = { name: 'Ventas Manuales Directas', count: 0, total: 0 };
        }
        serviceMap['manual'].count += 1;
        serviceMap['manual'].total += tx.amount;
      }
    });

    const topServices = Object.values(serviceMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Top customers lifetime spend
    const customerMap: Record<string, { name: string, total: number, count: number }> = {};
    transactions.forEach(tx => {
      const cId = tx.customerId || 'venta-rapida';
      const name = cId === 'venta-rapida' ? 'Venta Rápida (Sin Cliente)' : (customers.find(c => c.id === cId)?.name || 'Cliente no informado');
      
      if (!customerMap[cId]) {
        customerMap[cId] = { name, total: 0, count: 0 };
      }
      customerMap[cId].total += tx.amount;
      customerMap[cId].count += 1;
    });

    const topCustomers = Object.values(customerMap)
      .filter(c => c.name !== 'Venta Rápida (Sin Cliente)')
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      count,
      averageTicket: Number(averageTicket.toFixed(2)),
      cashPercent,
      cardPercent,
      cashTotal: Number(cashTotal.toFixed(2)),
      cardTotal: Number(cardTotal.toFixed(2)),
      topServices,
      topCustomers
    };
  }, [transactions, services, customers]);

  const primaryColor = design?.primaryColor || '#008080';

  return (
    <div className="admin-tpv-container animate-fade-in">
      <PageHeader 
        icon={<CreditCard size={28} />}
        title="TPV"
      />

      {/* PERSISTENT PENDING CLOSE REMINDER BANNER */}
      {pendingCloseDates.length > 0 && !isLoading && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 10px rgba(251, 191, 36, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#FCD34D',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#78350F'
            }}>
              <Archive size={16} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#78350F' }}>
                Cierres de caja del pasado pendientes
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#92400E' }}>
                Tienes {pendingCloseDates.length} cierre{pendingCloseDates.length > 1 ? 's' : ''} de caja pendiente{pendingCloseDates.length > 1 ? 's' : ''} de días anteriores (el más antiguo: {pendingCloseDates[pendingCloseDates.length - 1].toLocaleDateString('es-ES')}).
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {pendingCloseDates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCloseDate(date);
                  setShowCloseBoxModal(true);
                }}
                style={{
                  background: '#92400E',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#78350F'}
                onMouseOut={(e) => e.currentTarget.style.background = '#92400E'}
              >
                Cerrar {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <RefreshCw size={40} className="animate-spin" style={{ color: primaryColor }} />
          <span style={{ color: '#64748B', fontWeight: 500 }}>Cargando datos del TPV...</span>
        </div>
      ) : activeView === 'cierres' ? (
        <div className="admin-tpv-cierres-view fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', animation: 'fadeIn 0.3s ease' }}>
          {/* Top Bar with Go Back Button and Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setActiveView('tpv')}
                style={{ background: 'transparent', border: '1px solid #CBD5E1', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569', fontWeight: 600, transition: 'all 0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowLeft size={16} /> Volver al TPV
              </button>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} style={{ color: primaryColor }} /> Historial de Cierres de Caja
              </h3>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  placeholder="Buscar notas..." 
                  value={closeSearchQuery}
                  onChange={(e) => setCloseSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', width: '200px' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={16} style={{ color: '#64748B' }} />
                <input 
                  type="date" 
                  value={closeStartDate}
                  onChange={(e) => setCloseStartDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
                <span style={{ color: '#94A3B8' }}>-</span>
                <input 
                  type="date" 
                  value={closeEndDate}
                  onChange={(e) => setCloseEndDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem' }}
                />
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Fecha y Hora</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Realizado Por</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Tarjeta</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Efectivo</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total Recaudado</th>
                    <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cashCloses
                    .filter(c => {
                      let match = true;
                      if (closeSearchQuery) {
                        match = match && (c.notes || '').toLowerCase().includes(closeSearchQuery.toLowerCase());
                      }
                      if (closeStartDate) {
                        const start = new Date(closeStartDate + 'T00:00:00').getTime();
                        if (c.date < start) match = false;
                      }
                      if (closeEndDate) {
                        const end = new Date(closeEndDate + 'T23:59:59').getTime();
                        if (c.date > end) match = false;
                      }
                      return match;
                    })
                    .map(close => (
                      <tr key={close.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#0F172A', fontWeight: 500 }}>
                          {new Date(close.date).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserIcon size={14} style={{ color: '#94A3B8' }} /> {close.closedBy}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>{close.totalCard.toFixed(2)}€</td>
                        <td style={{ padding: '16px 20px', fontSize: '0.9rem', color: '#475569' }}>{close.totalCash.toFixed(2)}€</td>
                        <td style={{ padding: '16px 20px', fontSize: '0.95rem', color: primaryColor, fontWeight: 700 }}>{close.totalAmount.toFixed(2)}€</td>
                        <td style={{ padding: '16px 20px' }}>
                          <button 
                            onClick={() => setSelectedCloseForDetail(close)}
                            style={{ background: 'transparent', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '6px 10px', fontSize: '0.8rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <FileText size={14} /> Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cashCloses.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8', fontSize: '0.9rem' }}>
                          <Archive size={32} style={{ margin: '0 auto 12px auto', opacity: 0.5, display: 'block' }} />
                          No hay cierres de caja registrados
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeView === 'ventas' ? (
        <div className="admin-tpv-dashboard-view fade-in" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          height: '100%',
          minHeight: 0,
          boxSizing: 'border-box',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Style overlays for dropdown checkbox items */}
          <style>{`
            .dashboard-filter-btn {
              background: #fff;
              border: 1px solid #CBD5E1;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 0.875rem;
              color: #475569;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s;
              height: 38px;
              box-sizing: border-box;
              min-width: 150px;
              justify-content: space-between;
            }
            .dashboard-filter-btn:hover {
              background: #F8FAFC;
              border-color: #94A3B8;
            }
            .dashboard-filter-dropdown {
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              width: 240px;
              background: #ffffff;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
              padding: 8px;
              display: flex;
              flex-direction: column;
              gap: 6px;
              z-index: 100;
              max-height: 240px;
              overflow-y: auto;
              box-sizing: border-box;
            }
            .filter-checkbox-row {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 8px;
              border-radius: 6px;
              cursor: pointer;
              transition: background 0.2s;
              font-size: 0.85rem;
              color: #334155;
              user-select: none;
              text-align: left;
            }
            .filter-checkbox-row:hover {
              background: #F1F5F9;
            }
            .dashboard-kpi-card {
              background: #ffffff;
              border: 1px solid #E2E8F0;
              border-radius: 12px;
              padding: 16px 20px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
              display: flex;
              flex-direction: column;
              gap: 4px;
              box-sizing: border-box;
            }
            .chart-bar-hover:hover {
              filter: brightness(0.92);
              cursor: pointer;
            }
          `}</style>

          {/* Top Bar with Go Back Button and Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setActiveView('tpv')}
                style={{
                  background: 'transparent',
                  border: '1px solid #CBD5E1',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  color: '#475569',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  height: '38px',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowLeft size={16} /> Volver al TPV
              </button>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                <BarChart3 size={20} style={{ color: primaryColor }} /> Panel de Control de Ventas
              </h3>
            </div>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              
              {/* Dropdown 1: Report Type */}
              <select
                value={reportType}
                onChange={(e) => {
                  setIsDashboardLoading(true);
                  setReportType(e.target.value as any);
                  setTimeout(() => setIsDashboardLoading(false), 250);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#334155',
                  height: '38px',
                  boxSizing: 'border-box',
                  background: '#fff',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="servicio">Ventas por Servicio</option>
                <option value="cliente">Ventas por Cliente</option>
                <option value="periodo">Ventas por Período</option>
              </select>

              {/* Date Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', padding: '2px 8px', borderRadius: '8px', border: '1px solid #E2E8F0', height: '38px', boxSizing: 'border-box' }}>
                <CalendarDays size={14} style={{ color: '#64748B' }} />
                <input 
                  type="date" 
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: '#334155', fontWeight: 600, outline: 'none' }}
                />
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>-</span>
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  style={{ background: 'transparent', border: 'none', fontSize: '0.8rem', color: '#334155', fontWeight: 600, outline: 'none' }}
                />
              </div>

              {/* Dropdown Multi-check: Servicios */}
              <div ref={serviceFilterRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => setIsServiceFilterOpen(!isServiceFilterOpen)}
                  className="dashboard-filter-btn"
                >
                  <span>Servicios {selectedFilterServices.length > 0 ? `(${selectedFilterServices.length})` : '(Todos)'}</span>
                  <Plus size={14} style={{ opacity: 0.6 }} />
                </button>
                {isServiceFilterOpen && (
                  <div className="dashboard-filter-dropdown">
                    <div 
                      onClick={() => setSelectedFilterServices([])}
                      className="filter-checkbox-row" 
                      style={{ fontWeight: 700, borderBottom: '1px solid #F1F5F9', color: primaryColor }}
                    >
                      Limpiar selección
                    </div>
                    {services.map(s => {
                      const isChecked = selectedFilterServices.includes(s.id);
                      return (
                        <label key={s.id} className="filter-checkbox-row">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedFilterServices(prev => prev.filter(id => id !== s.id));
                              } else {
                                setSelectedFilterServices(prev => [...prev, s.id]);
                              }
                            }}
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })}
                    {/* Manual sales item */}
                    <label className="filter-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectedFilterServices.includes('manual')}
                        onChange={() => {
                          const isChecked = selectedFilterServices.includes('manual');
                          if (isChecked) {
                            setSelectedFilterServices(prev => prev.filter(id => id !== 'manual'));
                          } else {
                            setSelectedFilterServices(prev => [...prev, 'manual']);
                          }
                        }}
                      />
                      <span>Ventas Manuales Directas</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Dropdown Multi-check: Clientes */}
              <div ref={customerFilterRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => setIsCustomerFilterOpen(!isCustomerFilterOpen)}
                  className="dashboard-filter-btn"
                >
                  <span>Clientes {selectedFilterCustomers.length > 0 ? `(${selectedFilterCustomers.length})` : '(Todos)'}</span>
                  <Plus size={14} style={{ opacity: 0.6 }} />
                </button>
                {isCustomerFilterOpen && (
                  <div className="dashboard-filter-dropdown" style={{ width: '260px' }}>
                    <div 
                      onClick={() => setSelectedFilterCustomers([])}
                      className="filter-checkbox-row" 
                      style={{ fontWeight: 700, borderBottom: '1px solid #F1F5F9', color: primaryColor }}
                    >
                      Limpiar selección
                    </div>
                    {customers.map(c => {
                      const isChecked = selectedFilterCustomers.includes(c.id);
                      return (
                        <label key={c.id} className="filter-checkbox-row">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedFilterCustomers(prev => prev.filter(id => id !== c.id));
                              } else {
                                setSelectedFilterCustomers(prev => [...prev, c.id]);
                              }
                            }}
                          />
                          <span>{c.name}</span>
                        </label>
                      );
                    })}
                    {/* Walk-in customer item */}
                    <label className="filter-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectedFilterCustomers.includes('venta-rapida')}
                        onChange={() => {
                          const isChecked = selectedFilterCustomers.includes('venta-rapida');
                          if (isChecked) {
                            setSelectedFilterCustomers(prev => prev.filter(id => id !== 'venta-rapida'));
                          } else {
                            setSelectedFilterCustomers(prev => [...prev, 'venta-rapida']);
                          }
                        }}
                      />
                      <span>Venta Rápida (Sin Cliente)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Dropdown Multi-check: Forma de Pago */}
              <div ref={methodFilterRef} style={{ position: 'relative' }}>
                <button 
                  type="button" 
                  onClick={() => setIsMethodFilterOpen(!isMethodFilterOpen)}
                  className="dashboard-filter-btn"
                >
                  <span>Métodos {selectedFilterMethods.length > 0 ? `(${selectedFilterMethods.length})` : '(Todos)'}</span>
                  <Plus size={14} style={{ opacity: 0.6 }} />
                </button>
                {isMethodFilterOpen && (
                  <div className="dashboard-filter-dropdown">
                    <div 
                      onClick={() => setSelectedFilterMethods([])}
                      className="filter-checkbox-row" 
                      style={{ fontWeight: 700, borderBottom: '1px solid #F1F5F9', color: primaryColor }}
                    >
                      Limpiar selección
                    </div>
                    <label className="filter-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectedFilterMethods.includes('tarjeta')}
                        onChange={() => {
                          const isChecked = selectedFilterMethods.includes('tarjeta');
                          if (isChecked) {
                            setSelectedFilterMethods(prev => prev.filter(m => m !== 'tarjeta'));
                          } else {
                            setSelectedFilterMethods(prev => [...prev, 'tarjeta']);
                          }
                        }}
                      />
                      <span>Tarjeta</span>
                    </label>
                    <label className="filter-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectedFilterMethods.includes('metalico')}
                        onChange={() => {
                          const isChecked = selectedFilterMethods.includes('metalico');
                          if (isChecked) {
                            setSelectedFilterMethods(prev => prev.filter(m => m !== 'metalico'));
                          } else {
                            setSelectedFilterMethods(prev => [...prev, 'metalico']);
                          }
                        }}
                      />
                      <span>Efectivo</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Reset Filters button */}
              <button
                type="button"
                onClick={() => {
                  setIsDashboardLoading(true);
                  setSelectedFilterServices([]);
                  setSelectedFilterCustomers([]);
                  setSelectedFilterMethods([]);
                  const d = new Date();
                  setFilterStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
                  setFilterEndDate(new Date().toISOString().split('T')[0]);
                  setTimeout(() => setIsDashboardLoading(false), 200);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                Restablecer
              </button>

            </div>
          </div>

          {/* Zona 2: KPI Summaries Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flexShrink: 0 }}>
            <div className="dashboard-kpi-card">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Total Ventas</span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 900, color: primaryColor }}>{dashboardMetrics.total.toFixed(2)}€</strong>
            </div>
            <div className="dashboard-kpi-card">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Número de Operaciones</span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 900, color: '#1E293B' }}>{dashboardMetrics.count}</strong>
            </div>
            <div className="dashboard-kpi-card">
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Ticket Medio</span>
              <strong style={{ fontSize: '1.45rem', fontWeight: 900, color: '#334155' }}>{dashboardMetrics.average.toFixed(2)}€</strong>
            </div>
          </div>

          {/* Zona 3: Main Analytical Visual Area */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexGrow: 1,
            minHeight: 0,
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* View Mode Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
                {reportType === 'servicio' ? 'Desglose por Servicios' : reportType === 'cliente' ? 'Desglose por Clientes' : 'Desglose por Períodos de Tiempo'}
              </span>
            </div>

            {/* Inner Dashboard Viewport */}
            {isDashboardLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                <RefreshCw size={36} className="animate-spin" style={{ color: primaryColor }} />
                <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.85rem' }}>Procesando base de datos de caja...</span>
              </div>
            ) : dashboardGroupedData.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94A3B8', margin: 'auto' }}>
                <BarChart3 size={48} style={{ margin: '0 auto 12px auto', opacity: 0.25 }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>No hay movimientos que coincidan con los filtros aplicados.</p>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Prueba a ampliar el rango de fechas o restablecer los selectores.</span>
              </div>
            ) : (
              <div className="tpv-scrollable-transactions" style={{ width: '100%', flexGrow: 1, minHeight: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 10 }}>
                      <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        {reportType === 'servicio' ? 'Servicio / Concepto' : reportType === 'cliente' ? 'Cliente' : 'Período'}
                      </th>
                      <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Operaciones</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>% Total</th>
                      <th style={{ padding: '12px 14px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>Total Facturado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardGroupedData.map((item) => {
                      const percent = dashboardMetrics.total > 0 ? (item.amount / dashboardMetrics.total) * 100 : 0;
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }} className="tx-row">
                          <td style={{ padding: '14px', fontSize: '0.9rem', color: '#0F172A', fontWeight: 600 }}>{item.label}</td>
                          <td style={{ padding: '14px', fontSize: '0.9rem', color: '#475569', textAlign: 'center' }}>{item.count}</td>
                          <td style={{ padding: '14px', fontSize: '0.9rem', color: '#64748B', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <span>{percent.toFixed(1)}%</span>
                              <div style={{ width: '60px', height: '6px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', display: 'inline-flex' }}>
                                <div style={{ width: `${percent}%`, background: primaryColor, height: '100%' }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px', fontSize: '0.95rem', fontWeight: 700, color: primaryColor, textAlign: 'right' }}>{item.amount.toFixed(2)}€</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      ) : (
        <div className="tpv-grid">
          <style>{`
            .admin-tpv-container {
              height: calc(100vh - 130px);
              overflow: hidden;
              display: flex;
              flex-direction: column;
              gap: 12px;
              box-sizing: border-box;
              width: 100%;
              padding: 0;
            }
            .tpv-grid {
              display: flex;
              gap: 16px;
              height: 100%;
              min-height: 0;
              width: 100%;
              box-sizing: border-box;
            }
            .tpv-left-panel {
              width: 65%;
              display: flex;
              flex-direction: column;
              gap: 16px;
              height: 100%;
              min-height: 0;
              box-sizing: border-box;
            }
            .tpv-right-panel {
              width: 35%;
              display: flex;
              flex-direction: column;
              gap: 12px;
              height: 100%;
              min-height: 0;
              background: #ffffff;
              border: 1px solid #E2E8F0;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
              padding: 20px;
              box-sizing: border-box;
            }
            .tpv-scrollable-items {
              flex-grow: 1;
              overflow-y: auto;
              padding-right: 4px;
              min-height: 0;
            }
            .tpv-scrollable-items::-webkit-scrollbar {
              width: 6px;
            }
            .tpv-scrollable-items::-webkit-scrollbar-thumb {
              background: #CBD5E1;
              border-radius: 3px;
            }
            .tpv-scrollable-transactions {
              flex-grow: 1;
              overflow-y: auto;
              padding-right: 4px;
              min-height: 0;
            }
            .tpv-scrollable-transactions::-webkit-scrollbar {
              width: 6px;
            }
            .tpv-scrollable-transactions::-webkit-scrollbar-thumb {
              background: #CBD5E1;
              border-radius: 3px;
            }
            .dropdown-item-hover:hover {
              background-color: color-mix(in srgb, ${primaryColor} 6%, #F8FAFC) !important;
            }
            .tx-row:hover {
              background-color: #F8FAFC;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          {/* Left panel: Catalog, Venta manual, Recent Transactions & Cash close row */}
          <div className="tpv-left-panel">
            
            {/* Unificada Tarjeta de Añadir Elementos */}
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Añadir Servicio del Catálogo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Servicio del Catálogo</label>
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
                          padding: '8px 10px 8px 32px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          background: '#fff',
                          outline: 'none',
                          color: selectedServiceId ? '#0F172A' : '#94A3B8',
                          height: '38px'
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
                        padding: '0 14px',
                        borderRadius: '8px',
                        background: primaryColor,
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: '38px'
                      }}
                    >
                      <Plus size={16} style={{ marginRight: '4px' }} /> Añadir
                    </button>
                  </div>
                </div>

                {/* Venta Manual */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>Concepto / Venta Manual</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px auto', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Concepto (Ej: Champú, Recargo...)"
                      value={manualConcept}
                      onChange={(e) => setManualConcept(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        height: '38px',
                        boxSizing: 'border-box'
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
                          padding: '8px 20px 8px 10px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          textAlign: 'right',
                          outline: 'none',
                          boxSizing: 'border-box',
                          height: '38px'
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddManualConceptToTicket}
                      style={{
                        padding: '0 14px',
                        borderRadius: '8px',
                        background: '#334155',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        height: '38px'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2: Recent Transactions list */}
            <div className="tpv-card" style={{
              background: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flexGrow: 1,
              minHeight: 0,
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: '0', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-color, #0F172A)' }}>
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
                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94A3B8', margin: 'auto' }}>
                  <Calculator size={48} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>No se han registrado cobros todavía hoy.</p>
                </div>
              ) : (
                <div className="tpv-scrollable-transactions" style={{ width: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
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
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }} title={clientName}>
                                {clientName}
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', fontSize: '0.9rem', color: '#475569' }}>
                              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }} title={serviceName}>
                                {serviceName}
                              </div>
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
                                {tx.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efec.'}
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

            {/* Bloque Inferior - Gestión de Caja */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              marginTop: '8px',
              flexShrink: 0,
              width: '100%'
            }}>
              
              {/* Button: Cierre de Caja */}
              <button
                type="button"
                onClick={() => setShowCloseBoxModal(true)}
                style={{
                  flex: '1 1 160px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: `color-mix(in srgb, ${primaryColor} 8%, #fff)`,
                  color: primaryColor,
                  border: `1px solid color-mix(in srgb, ${primaryColor} 20%, #E2E8F0)`,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = `color-mix(in srgb, ${primaryColor} 12%, #fff)`}
                onMouseOut={(e) => e.currentTarget.style.background = `color-mix(in srgb, ${primaryColor} 8%, #fff)`}
              >
                <Archive size={14} /> Cierre de Caja Diario
              </button>

              {/* Button: Consultar Cierres de Caja */}
              <button
                type="button"
                onClick={() => setActiveView('cierres')}
                style={{
                  flex: '1 1 160px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <History size={14} /> Consultar Cierres
              </button>

              {/* Button: Métricas y Estadísticas */}
              <button
                type="button"
                onClick={() => setActiveView('ventas')}
                style={{
                  flex: '1 1 160px',
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#F8FAFC'}
                onMouseOut={(e) => e.currentTarget.style.background = '#FFFFFF'}
              >
                <BarChart3 size={14} /> Estadísticas y Métricas
              </button>

            </div>
          </div>

          {/* Column 3 / Right Checkout Panel: Ticket & Checkout unificado */}
          <div className="tpv-right-panel">
            {/* Ticket de Venta Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px', flexShrink: 0 }}>
              <h3 style={{ margin: '0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-color, #0F172A)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Euro size={16} style={{ color: primaryColor }} /> Ticket de Venta
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

            {/* Scrollable Items list */}
            <div className="tpv-scrollable-items" style={{ flexGrow: 1, minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {ticket.length === 0 ? (
                <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94A3B8', margin: 'auto' }}>
                  <Calculator size={36} style={{ margin: '0 auto 8px auto', opacity: 0.25 }} />
                  <p style={{ margin: 0, fontSize: '0.8rem' }}>El ticket está vacío.</p>
                </div>
              ) : (
                ticket.map((item) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                      {item.serviceId ? (
                        <Briefcase size={14} style={{ color: primaryColor, flexShrink: 0 }} />
                      ) : (
                        <Euro size={14} style={{ color: '#E2B93B', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ position: 'relative', width: '75px' }}>
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>€</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.price === 0 ? '' : item.price}
                          onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                          placeholder="0.00"
                          style={{
                            width: '100%',
                            padding: '4px 16px 4px 6px',
                            border: '1px solid #CBD5E1',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
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
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Display */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: `color-mix(in srgb, ${primaryColor} 5%, #F8FAFC)`,
              border: `1px solid color-mix(in srgb, ${primaryColor} 12%, #E2E8F0)`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Total a Cobrar</span>
              <strong style={{ fontSize: '1.4rem', fontWeight: 900, color: primaryColor }}>
                {totalAmount.toFixed(2)}€
              </strong>
            </div>

            {/* Formulario de Checkout */}
            <form onSubmit={handleCharge} style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, marginTop: '4px' }}>
              
              {/* Cliente del Cobro */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Cliente del Cobro</label>
                <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                      <UserIcon size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Buscar cliente..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                        if (selectedCustomerId && e.target.value === '') {
                          setSelectedCustomerId('');
                        }
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      style={{
                        width: '100%',
                        padding: '8px 30px 8px 30px',
                        border: '1px solid #CBD5E1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                        color: selectedCustomerId ? '#0F172A' : '#475569',
                        fontWeight: selectedCustomerId ? '600' : 'normal',
                        height: '36px'
                      }}
                    />
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
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: '#94A3B8',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '2px'
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {isDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 4px)',
                      left: '0',
                      right: '0',
                      background: '#ffffff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 -4px 6px -2px rgba(0, 0, 0, 0.05)',
                      maxHeight: '160px',
                      overflowY: 'auto',
                      zIndex: '50',
                      boxSizing: 'border-box'
                    }}>
                      {sortedAndFilteredCustomers.length === 0 ? (
                        <div style={{ padding: '8px 10px', fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
                          No se encontraron clientes
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
                                padding: '8px 10px',
                                fontSize: '0.85rem',
                                color: '#0F172A',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid #F8FAFC',
                                fontWeight: isSelected ? '700' : 'normal',
                                background: isSelected ? `color-mix(in srgb, ${primaryColor} 8%, #fff)` : 'transparent'
                              }}
                              className="dropdown-item-hover"
                            >
                              <span>{c.name}</span>
                              {c.phone && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>({c.phone})</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Forma de Pago */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Forma de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'tarjeta' ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                      background: paymentMethod === 'tarjeta' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: paymentMethod === 'tarjeta' ? primaryColor : '#475569',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      height: '36px'
                    }}
                  >
                    <CreditCard size={14} />
                    <span>Tarjeta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('metalico')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'metalico' ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                      background: paymentMethod === 'metalico' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: paymentMethod === 'metalico' ? primaryColor : '#475569',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      height: '36px'
                    }}
                  >
                    <Coins size={14} />
                    <span>Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('mixto');
                      setMixedCashAmount((totalAmount / 2).toFixed(2));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '8px 6px',
                      borderRadius: '8px',
                      border: paymentMethod === 'mixto' ? `2px solid ${primaryColor}` : '1px solid #CBD5E1',
                      background: paymentMethod === 'mixto' ? `color-mix(in srgb, ${primaryColor} 6%, #fff)` : '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      color: paymentMethod === 'mixto' ? primaryColor : '#475569',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      height: '36px'
                    }}
                  >
                    <Coins size={12} />
                    <span style={{ fontSize: '0.75rem' }}>+</span>
                    <CreditCard size={12} />
                    <span>Mixto</span>
                  </button>
                </div>
              </div>

              {/* Pago Mixto Desglose (Condicional) */}
              {paymentMethod === 'mixto' && (
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>Efectivo (€)</span>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={totalAmount || undefined}
                        value={mixedCashAmount}
                        onChange={(e) => setMixedCashAmount(e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          outline: 'none',
                          height: '30px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B' }}>Tarjeta (€)</span>
                      <input
                        type="number"
                        readOnly
                        value={mixedCardAmount}
                        style={{
                          padding: '6px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: '#F1F5F9',
                          color: '#64748B',
                          outline: 'none',
                          height: '30px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Calculadora de Vueltas (Condicional) */}
              {paymentMethod !== 'tarjeta' && (totalAmount > 0) && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  animation: 'fadeIn 0.2s ease'
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Entrega cliente (€)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Introduce importe..."
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        style={{
                          padding: '6px',
                          border: '1px solid #BBF7D0',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#14532D',
                          outline: 'none',
                          height: '30px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    {Number(cashGiven) > 0 && (
                      <div style={{ 
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: changeAmount > 0 ? '#BBF7D0' : '#F0FDF4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        height: '30px',
                        boxSizing: 'border-box'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#14532D' }}>VUELTA:</span>
                        <strong style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532D' }}>
                          {changeAmount.toFixed(2)}€
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notas (1 sola línea de altura inicial) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Notas (Opcional)</label>
                <textarea
                  placeholder="Notas globales..."
                  rows={1}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'none',
                    height: '36px'
                  }}
                />
              </div>

              {/* Botón Cobrar (Anclado siempre abajo del todo) */}
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: primaryColor,
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'opacity 0.2s',
                  marginTop: '6px'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    <Check size={18} /> Registrar Cobro
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CIERRE DE CAJA DIARIO & CONSULTAS ANTERIORES */}
      {/* ======================================================== */}
      {showCloseBoxModal && (
        <div className="modal-overlay" onClick={() => { setShowCloseBoxModal(false); setSelectedCloseDate(null); }} style={{
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
            maxWidth: '650px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Archive size={20} style={{ color: primaryColor }} /> {selectedCloseDate ? `Cierre de Caja - ${selectedCloseDate.toLocaleDateString('es-ES')}` : 'Cierre de Caja Diario'}
              </h2>
              <button 
                onClick={() => { setShowCloseBoxModal(false); setSelectedCloseDate(null); }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              
              {/* Left Form: Realizar cierre */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid #F1F5F9', paddingRight: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
                  {selectedCloseDate 
                    ? `Cerrar Caja del ${selectedCloseDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` 
                    : 'Cerrar Caja de Hoy'}
                </h4>
                
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Total Cobrado Tarjeta:</span>
                    <strong style={{ color: '#0F172A' }}>{todayCloseData.card.toFixed(2)}€</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748B' }}>Total Cobrado Efectivo:</span>
                    <strong style={{ color: '#0F172A' }}>{todayCloseData.cash.toFixed(2)}€</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderTop: '1px dashed #CBD5E1', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ color: '#475569', fontWeight: 700 }}>Total Recaudado:</span>
                    <strong style={{ color: primaryColor, fontSize: '1.05rem', fontWeight: 800 }}>{todayCloseData.total.toFixed(2)}€</strong>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', textAlign: 'right', marginTop: '2px' }}>
                    ({todayCloseData.count} movimientos)
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Notas de caja (Opcional)</label>
                  <textarea
                    placeholder="Escribe comentarios, descuadres o incidencias del día..."
                    rows={3}
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontFamily: 'inherit',
                      resize: 'none',
                      outline: 'none'
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateCashClose}
                  disabled={isSaving}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    background: primaryColor,
                    color: '#fff',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Check size={16} /> Guardar Cierre de Caja
                </button>
              </div>

              {/* Right List: Cierres anteriores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>Histórico de Cierres</h4>
                
                {cashCloses.length === 0 ? (
                  <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '0.8rem' }}>
                    No hay cierres de caja archivados en el histórico.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cashCloses.map(c => {
                      const dateStr = new Date(c.date).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      });
                      return (
                        <div key={c.id} style={{
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          fontSize: '0.8rem',
                          background: '#F8FAFC'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                            <span>{dateStr}</span>
                            <span style={{ color: primaryColor }}>{c.totalAmount.toFixed(2)}€</span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', color: '#64748B', fontSize: '0.75rem' }}>
                            <span>Efectivo: {c.totalCash.toFixed(2)}€ | Tarjeta: {c.totalCard.toFixed(2)}€</span>
                            <span>Cerrado por: <strong>{c.closedBy}</strong></span>
                            {c.notes && (
                              <span style={{ fontStyle: 'italic', background: '#F1F5F9', padding: '4px', borderRadius: '4px', marginTop: '2px', color: '#475569' }}>
                                "{c.notes}"
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: INTERACTIVE ANALYTICS & STATISTICS PANEL */}
      {/* ======================================================== */}
      {showAnalyticsModal && (
        <div className="modal-overlay" onClick={() => setShowAnalyticsModal(false)} style={{
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
            maxWidth: '600px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart3 size={20} style={{ color: primaryColor }} /> Estadísticas y Análisis de Negocio
              </h2>
              <button 
                onClick={() => setShowAnalyticsModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ingresos Totales</div>
                <strong style={{ fontSize: '1.2rem', fontWeight: 800, color: primaryColor }}>{metrics.totalRevenue.toFixed(2)}€</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Operaciones</div>
                <strong style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155' }}>{metrics.count}</strong>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Ticket Medio</div>
                <strong style={{ fontSize: '1.2rem', fontWeight: 800, color: '#334155' }}>{metrics.averageTicket.toFixed(2)}€</strong>
              </div>
            </div>

            {/* 1. Payment Ratio progress bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                <span>Tarjeta ({metrics.cardPercent}%)</span>
                <span>Efectivo ({metrics.cashPercent}%)</span>
              </div>
              <div style={{ height: '10px', width: '100%', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${metrics.cardPercent}%`, background: '#4F46E5', height: '100%' }} title={`Tarjeta: ${metrics.cardTotal}€`} />
                <div style={{ width: `${metrics.cashPercent}%`, background: '#16A34A', height: '100%' }} title={`Efectivo: ${metrics.cashTotal}€`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                <span>Tarjeta: {metrics.cardTotal.toFixed(2)}€</span>
                <span>Efectivo: {metrics.cashTotal.toFixed(2)}€</span>
              </div>
            </div>

            {/* 2. Top Services Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #E2E8F0', paddingTop: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Top 5 Servicios por Ingresos
              </h4>
              {metrics.topServices.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', padding: '10px 0' }}>No se han registrado cobros.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {metrics.topServices.map((s, i) => {
                    const pct = metrics.totalRevenue > 0 ? Math.round((s.total / metrics.totalRevenue) * 100) : 0;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#0F172A' }}>
                          <span style={{ fontWeight: 600 }}>{s.name} <span style={{ fontWeight: 'normal', color: '#64748B' }}>({s.count} veces)</span></span>
                          <strong>{s.total.toFixed(2)}€</strong>
                        </div>
                        <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: primaryColor, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Top Customers Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #E2E8F0', paddingTop: '14px' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                Top 5 Clientes (Fidelidad & Gasto)
              </h4>
              {metrics.topCustomers.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', padding: '10px 0' }}>No hay clientes registrados en las transacciones aún.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {metrics.topCustomers.map((c, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '6px',
                      fontSize: '0.8rem'
                    }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>
                        {i + 1}. {c.name} <span style={{ fontWeight: 'normal', color: '#64748B' }}>({c.count} visitas)</span>
                      </span>
                      <strong style={{ color: primaryColor }}>{c.total.toFixed(2)}€</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer close */}
            <button
              type="button"
              onClick={() => setShowAnalyticsModal(false)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                background: '#334155',
                color: '#fff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                textAlign: 'center',
                marginTop: '10px'
              }}
            >
              Cerrar Panel
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETALLES DE CIERRE HISTÓRICO                       */}
      {/* ======================================================== */}
      {selectedCloseForDetail && (
        <div className="modal-overlay" onClick={() => setSelectedCloseForDetail(null)} style={{
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
            maxWidth: '500px',
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
                <FileText size={20} style={{ color: primaryColor }} /> Detalles del Cierre
              </h2>
              <button 
                onClick={() => setSelectedCloseForDetail(null)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Fecha y Hora</div>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500, marginTop: '4px' }}>
                    {new Date(selectedCloseForDetail.date).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>Realizado por</div>
                  <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <UserIcon size={14} style={{ color: '#94A3B8' }} /> {selectedCloseForDetail.closedBy}
                  </div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Total Tarjeta:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedCloseForDetail.totalCard.toFixed(2)}€</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#64748B' }}>Total Efectivo:</span>
                  <strong style={{ color: '#0F172A' }}>{selectedCloseForDetail.totalCash.toFixed(2)}€</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', borderTop: '1px dashed #CBD5E1', paddingTop: '12px', marginTop: '4px' }}>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>Total Recaudado:</span>
                  <strong style={{ color: primaryColor, fontSize: '1.2rem', fontWeight: 800 }}>{selectedCloseForDetail.totalAmount.toFixed(2)}€</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Notas / Observaciones</label>
                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', minHeight: '60px', fontSize: '0.9rem', color: selectedCloseForDetail.notes ? '#0F172A' : '#94A3B8' }}>
                  {selectedCloseForDetail.notes || 'Sin observaciones para este cierre.'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedCloseForDetail(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                background: '#F1F5F9',
                color: '#475569',
                border: 'none',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
                marginTop: '8px'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#E2E8F0'}
              onMouseOut={(e) => e.currentTarget.style.background = '#F1F5F9'}
            >
              Cerrar Detalles
            </button>
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
      `}</style>
    </div>
  );
};
