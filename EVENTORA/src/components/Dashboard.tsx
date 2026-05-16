import React, { useState, useEffect } from 'react';
import { useWedding } from '../contexts/WeddingContext';
import { Calendar, MapPin, Users, DollarSign, CheckCircle2, Clock, Sparkles, ArrowRight, X, Briefcase, PieChart as PieChartIcon, ChevronDown, Plus, LayoutDashboard, Bot, TrendingUp, Wallet, Trash2, Edit2, AlertCircle, Shield, Globe, ExternalLink, Link as LinkIcon, Info, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase';

import { LiveMode } from './LiveMode';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { currentWedding, weddings, setCurrentWedding } = useWedding();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isWeddingListOpen, setIsWeddingListOpen] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [finalizingVendor, setFinalizingVendor] = useState<any>(null);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [isAISuggesting, setIsAISuggesting] = useState(false);
  const [suggestionCategory, setSuggestionCategory] = useState('Photographer');
  const [granularPreferences, setGranularPreferences] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'nexus'>('list');
  const [isDomainNexusOpen, setIsDomainNexusOpen] = useState(false);
  const [domainInput, setDomainInput] = useState('');
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [isTreasuryOpen, setIsTreasuryOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
  const [bankingDetails, setBankingDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    swiftCode: ''
  });
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    deadline: '',
    assigneeId: '',
    dependencyId: ''
  });
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'finance' | 'vendor' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'vendor',
  });

  if (!currentWedding) return null;

  useEffect(() => {
    const tasksRef = collection(db, 'weddings', currentWedding.id, 'tasks');
    const q = query(tasksRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `weddings/${currentWedding.id}/tasks`);
    });

    const bookingsRef = collection(db, 'weddings', currentWedding.id, 'bookings');
    const bq = query(bookingsRef);
    const bUnsubscribe = onSnapshot(bq, (snapshot) => {
      const bList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBookings(bList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `weddings/${currentWedding.id}/bookings`);
    });

    const transfersRef = collection(db, 'weddings', currentWedding.id, 'transfers');
    const tq = query(transfersRef);
    const tUnsubscribe = onSnapshot(tq, (snapshot) => {
      const tList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransfers(tList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `weddings/${currentWedding.id}/transfers`);
    });

    return () => {
      unsubscribe();
      bUnsubscribe();
      tUnsubscribe();
    };
  }, [currentWedding.id]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success')) {
      const pendingBookingStr = localStorage.getItem('pending_booking');
      
      const finalizeBookingAfterPayment = async () => {
        if (pendingBookingStr) {
          try {
            const pending = JSON.parse(pendingBookingStr);
            const bookingsPath = `weddings/${pending.weddingId}/bookings`;
            const transfersPath = `weddings/${pending.weddingId}/transfers`;
            
            await addDoc(collection(db, bookingsPath), {
              vendorName: pending.vendor.name,
              vendorRole: pending.vendor.role,
              contact: pending.vendor.contact,
              cost: pending.vendor.depositAmount * 20, 
              bookingDate: new Date().toISOString(),
              confirmedBy: pending.userEmail,
              status: 'deposit_paid'
            });

            await addDoc(collection(db, transfersPath), {
              amount: pending.vendor.depositAmount,
              type: 'deposit',
              description: `Initial security deposit for ${pending.vendor.name}`,
              recipient: pending.vendor.name,
              date: new Date().toISOString(),
              status: 'completed'
            });

            localStorage.removeItem('pending_booking');
          } catch (e) {
            console.error("Failed to finalize booking after payment", e);
          }
        }

        setConfirmation({
          isOpen: true,
          title: 'Wealth Transfer Confirmed',
          message: 'The royal treasury has received the transfer. Your partnership is now secured and etched in the lexicon.',
          type: 'finance',
          onConfirm: () => {
            window.history.replaceState({}, document.title, window.location.pathname);
            setConfirmation(prev => ({ ...prev, isOpen: false }));
          }
        });
      };

      finalizeBookingAfterPayment();
    }
  }, []);

  const handleSaveBankingDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWedding) return;
    try {
      const weddingRef = doc(db, 'weddings', currentWedding.id);
      await updateDoc(weddingRef, {
        bankingProfile: bankingDetails
      });
      setIsBankingModalOpen(false);
      setConfirmation({
        isOpen: true,
        title: 'Banking Vault Updated',
        message: 'Your royal settlement credentials have been securely etched into our encrypted nexus.',
        type: 'finance',
        onConfirm: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `weddings/${currentWedding.id}`);
    }
  };

  const handleCancelBooking = async (bookingId: string, vendorName: string) => {
    setConfirmation({
      isOpen: true,
      title: 'Dissolve Partnership',
      message: `Are you certain you wish to cancel your partnership with ${vendorName}? This action will initiate our escrow reclamation protocol.`,
      type: 'danger',
      onConfirm: async () => {
        const path = `weddings/${currentWedding.id}/bookings/${bookingId}`;
        try {
          await updateDoc(doc(db, path), {
            status: 'cancelled',
            cancelledAt: new Date().toISOString()
          });

          const transfersPath = `weddings/${currentWedding.id}/transfers`;
          await addDoc(collection(db, transfersPath), {
            amount: 0,
            type: 'settlement',
            description: `Escrow Reclamation: ${vendorName}`,
            recipient: user?.email || 'User',
            date: new Date().toISOString(),
            status: 'pending'
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCancelWedding = async () => {
    if (!user || user.uid !== currentWedding.ownerIds[0]) {
      alert("Only the Sovereign Owner can dissolve this union.");
      return;
    }

    const refundAmount = currentWedding.budgetSpent * 0.9;

    setConfirmation({
      isOpen: true,
      title: 'Dissolve Royal Union',
      message: `Are you absolutely dynamic in your choice to dissolve this wedding portfolio? All strategic records will be archived and a refund request for ₹${refundAmount.toLocaleString()} (90% of escrowed corpus) will be initiated.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const weddingRef = doc(db, 'weddings', currentWedding.id);
          await updateDoc(weddingRef, {
            status: 'cancelled',
            dissolvedAt: serverTimestamp(),
            refundStatus: 'initiated',
            estimatedRefund: refundAmount
          });
          
          const transfersPath = `weddings/${currentWedding.id}/transfers`;
          await addDoc(collection(db, transfersPath), {
            amount: refundAmount,
            type: 'settlement',
            description: `Sovereign Escrow Liquidation (Refund)`,
            recipient: user?.email || 'User',
            date: new Date().toISOString(),
            status: 'pending'
          });

          setIsDetailOpen(false);
          setIsTreasuryOpen(false);
          window.location.reload(); 
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `weddings/${currentWedding.id}`);
        }
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleInitiatePayment = async (amount: number, itemName: string) => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          itemName,
          weddingName: currentWedding.name,
          currency: 'inr'
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.isDemo) {
        // Show demo notification if stripe is not configured
        setConfirmation({
          isOpen: true,
          title: 'Royal Treasury Portal',
          message: 'Stripe is currently in simulation mode. In production, this would bridge to your verified banking nexus.',
          type: 'finance',
          onConfirm: () => setConfirmation(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleOpenTaskModal = (task?: any) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        deadline: task.deadline || '',
        assigneeId: task.assigneeId || '',
        dependencyId: task.dependencyId || ''
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        deadline: '',
        assigneeId: '',
        dependencyId: ''
      });
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const path = `weddings/${currentWedding.id}/tasks`;
    
    // Dependency check
    if (taskFormData.status === 'completed' && taskFormData.dependencyId) {
      const dependency = tasks.find(t => t.id === taskFormData.dependencyId);
      if (dependency && dependency.status !== 'completed') {
        alert(`Prerequisite objective "${dependency.title}" must be perfected before this task can be completed.`);
        return;
      }
    }

    try {
      if (editingTask) {
        const taskRef = doc(db, path, editingTask.id);
        await updateDoc(taskRef, {
          ...taskFormData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, path), {
          ...taskFormData,
          weddingId: currentWedding.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsTaskModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const path = `weddings/${currentWedding.id}/tasks/${taskId}`;
    setConfirmation({
      isOpen: true,
      title: 'Dissolve Objective',
      message: 'Are you certain you wish to dissolve this task? This action cannot be undone within the royal record.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, path));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleFinalizeVendor = (vendor: any) => {
    setFinalizingVendor({
      ...vendor,
      contractId: `EVN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      depositAmount: currentWedding.budgetTotal * 0.05, // 5% deposit simulation
    });
  };

  const handleRateVendor = async (vendorName: string, rating: number) => {
    if (!currentWedding) return;
    try {
      const weddingRef = doc(db, 'weddings', currentWedding.id);
      await updateDoc(weddingRef, {
        [`vendorRatings.${vendorName}`]: rating
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `weddings/${currentWedding.id}`);
    }
  };

  const confirmVendorBooking = async () => {
    if (!finalizingVendor || !user) return;
    
    setIsFinalizing(true);
    try {
      // First, initiate the Stripe payment for the deposit
      const paymentResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalizingVendor.depositAmount,
          itemName: `Security Deposit for ${finalizingVendor.name}`,
          weddingName: currentWedding.name,
          currency: 'inr'
        })
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.url) {
        // Before redirecting, we would normally save a "pending" booking or use a webhook
        // For this prototype, we'll store the intent in local storage to resume after redirect
        localStorage.setItem('pending_booking', JSON.stringify({
          weddingId: currentWedding.id,
          vendor: finalizingVendor,
          userEmail: user.email
        }));
        
        window.location.href = paymentData.url;
        return;
      }

      // If Stripe not configured, proceed with simulated booking
      const response = await fetch('/api/finalize-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: finalizingVendor,
          userEmail: user.email,
          weddingName: currentWedding.name
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const bookingsPath = `weddings/${currentWedding.id}/bookings`;
      await addDoc(collection(db, bookingsPath), {
        vendorName: finalizingVendor.name,
        vendorRole: finalizingVendor.role,
        contact: finalizingVendor.contact,
        cost: finalizingVendor.depositAmount * 20, // Simulated total cost
        bookingDate: new Date().toISOString(),
        confirmedBy: user.email,
        status: 'deposit_paid'
      });

      setFinalizingVendor(null);
    } catch (error) {
      console.error('Finalization Failed:', error);
      alert('Strategic Communication Failed. Please retry.');
    } finally {
      setIsFinalizing(false);
    }
  };

  const getAISuggestions = async () => {
    if (!currentWedding) return;
    setIsAISuggesting(true);
    try {
      const response = await fetch('/api/ai/vendor-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: currentWedding.budgetTotal > 5000000 ? 'High' : 'Medium',
          style: 'Luxury Indian',
          location: currentWedding.location,
          guestCount: 200, // Hardcoded for now or get from RSVPs
          category: suggestionCategory,
          preferences: granularPreferences
        })
      });

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('AI Suggestion Error:', error);
    } finally {
      setIsAISuggesting(false);
    }
  };
  
  const handleVerifyDomain = async () => {
    if (!domainInput || !currentWedding) return;
    setIsVerifyingDomain(true);
    try {
      const response = await fetch('/api/verify-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domainInput })
      });
      
      const data = await response.json();
      if (data.success) {
        const weddingRef = doc(db, 'weddings', currentWedding.id);
        await updateDoc(weddingRef, {
          customDomain: {
            url: domainInput,
            status: data.verified ? 'active' : 'pending',
            dnsConfig: data.dnsConfig
          }
        });
      }
    } catch (error) {
       console.error("Domain verification failed", error);
    } finally {
      setIsVerifyingDomain(false);
    }
  };

  const handleLogTransaction = () => {
    setConfirmation({
      isOpen: true,
      title: 'Authorize Major Transaction',
      message: 'You are about to log a significant transaction from your royal corpus. This will permanently adjust your contingency reserves. Proceed?',
      type: 'finance',
      onConfirm: () => {
        console.log('Transaction Logged');
        setConfirmation(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const budgetProgress = (currentWedding.budgetSpent / currentWedding.budgetTotal) * 100;

  return (
    <div className="space-y-8 py-8 px-6 max-w-7xl mx-auto">
      {/* Wedding Selector & Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-gold-500/10"
      >
        <div className="relative">
          <div className="mb-4">
             <button 
               onClick={() => setIsWeddingListOpen(!isWeddingListOpen)}
               className="flex items-center gap-2 group p-2 -ml-2 rounded-xl hover:bg-gold-50 transition-all"
             >
                <div className="p-1.5 bg-saffron-50 rounded-lg text-saffron-600 group-hover:bg-saffron-100 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">My Portfolios</span>
                <ChevronDown className={`w-3 h-3 text-gold-400 transition-transform ${isWeddingListOpen ? 'rotate-180' : ''}`} />
             </button>
             
             <AnimatePresence>
               {isWeddingListOpen && (
                 <>
                   <div 
                     className="fixed inset-0 z-40" 
                     onClick={() => setIsWeddingListOpen(false)} 
                   />
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-10 left-0 w-64 bg-white border border-gold-100 shadow-2xl rounded-2xl p-2 z-50 overflow-hidden"
                   >
                     <div className="max-h-60 overflow-y-auto space-y-1">
                       {weddings.map(w => (
                         <button
                           key={w.id}
                           onClick={() => {
                             setCurrentWedding(w);
                             setIsWeddingListOpen(false);
                           }}
                           className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${currentWedding.id === w.id ? 'bg-saffron-50 border border-saffron-100' : 'hover:bg-gold-50'}`}
                         >
                           <div>
                             <p className={`text-sm font-bold ${currentWedding.id === w.id ? 'text-saffron-600' : 'text-gold-950'}`}>{w.name}</p>
                             <p className="text-[9px] uppercase tracking-tighter text-gold-400 font-bold">{w.location}</p>
                           </div>
                           {currentWedding.id === w.id && <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />}
                         </button>
                       ))}
                     </div>
                     <div className="border-t border-gold-100 mt-2 pt-2">
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('start-new-setup'))}
                          className="w-full flex items-center gap-2 p-3 text-saffron-600 hover:bg-saffron-50 rounded-xl transition-all font-bold text-xs"
                        >
                          <Plus className="w-4 h-4" />
                          New Wedding Portfolio
                        </button>
                     </div>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>
          </div>

          <h1 className="text-5xl md:text-6xl font-serif text-gold-950 mb-2">
            {currentWedding.name}
          </h1>
          <div className="flex flex-wrap gap-4 text-gold-600">
            <span className="flex items-center gap-1.5 text-sm uppercase tracking-widest font-medium">
              <Calendar className="w-4 h-4 text-saffron-600" />
              {new Date(currentWedding.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5 text-sm uppercase tracking-widest font-medium">
              <MapPin className="w-4 h-4 text-saffron-600" />
              {currentWedding.location}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsLiveModeOpen(true)}
            className="luxury-card py-2 px-6 flex items-center gap-3 bg-red-50 border-red-100 hover:bg-red-100 transition-all group"
          >
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-600 font-display font-bold text-sm uppercase">Enter Live Horizon</span>
          </button>
          <button 
            onClick={() => setIsDomainNexusOpen(true)}
            className="luxury-card py-2 px-6 flex items-center gap-3 bg-blue-50 border-blue-100 hover:bg-blue-100 transition-all group"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-blue-600 font-display font-bold text-sm uppercase">Domain Nexus</span>
          </button>
          <button 
            onClick={() => setIsTreasuryOpen(true)}
            className="luxury-card py-2 px-6 flex items-center gap-3 bg-gold-50 border-gold-100 hover:bg-gold-100 transition-all group"
          >
            <Wallet className="w-4 h-4 text-gold-600" />
            <span className="text-gold-600 font-display font-bold text-sm uppercase">Royal Treasury</span>
          </button>
          <div className="luxury-card py-2 px-6 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-widest text-gold-500 mb-1 font-bold">Status</span>
            <span className="text-saffron-600 font-display font-bold text-sm uppercase">{currentWedding.status}</span>
          </div>
        </div>
      </motion.div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<DollarSign className="w-5 h-5" />} 
          label="Total Budget" 
          value={`₹${currentWedding.budgetTotal.toLocaleString()}`} 
          subtext="Projected Allocation"
          delay={0.1}
        />
        <StatCard 
          icon={<DollarSign className="w-5 h-5 text-gold-500" />} 
          label="Budget Spent" 
          value={`₹${currentWedding.budgetSpent.toLocaleString()}`} 
          subtext={`${budgetProgress.toFixed(1)}% consumed`}
          delay={0.2}
        />
        <StatCard 
          icon={<Users className="w-5 h-5" />} 
          label="Guest Count" 
          value="182" 
          subtext="Confirmed RSVPs"
          delay={0.3}
        />
        <StatCard 
          icon={<CheckCircle2 className="w-5 h-5" />} 
          label="Tasks" 
          value="12 / 48" 
          subtext="Planning Velocity"
          delay={0.4}
        />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="luxury-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-saffron-600" />
                  <h2 className="text-2xl font-serif text-gold-950">Strategic Milestones</h2>
                </div>
                <div className="flex gap-4 items-center">
                  <div className="flex bg-gold-50 p-1 rounded-xl border border-gold-100">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gold-950' : 'text-gold-400 hover:text-gold-600'}`}
                    >
                      Registry
                    </button>
                    <button 
                      onClick={() => setViewMode('nexus')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black transition-all ${viewMode === 'nexus' ? 'bg-white shadow-sm text-gold-950' : 'text-gold-400 hover:text-gold-600'}`}
                    >
                      Nexus
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsDetailOpen(true)}
                    className="text-[10px] uppercase tracking-widest text-gold-400 hover:text-saffron-600 transition-colors font-bold flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-3 h-3" />
                    Full Strategic Plan
                  </button>
                  <button 
                    onClick={() => handleOpenTaskModal()}
                    className="bg-gold-950 text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-gold-800 transition-all shadow-lg shadow-gold-950/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Orchestrate Task
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-gold-100 rounded-[2rem] bg-gold-50/20">
                    <Clock className="w-10 h-10 text-gold-200 mx-auto mb-4" />
                    <p className="text-gold-400 text-sm font-serif italic">The scroll is currently clean. Initiate your first objective.</p>
                  </div>
                ) : viewMode === 'list' ? (
                  tasks.slice(0, 5).map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      allTasks={tasks}
                      onEdit={() => handleOpenTaskModal(task)} 
                      onDelete={() => handleDeleteTask(task.id)} 
                    />
                  ))
                ) : (
                  <StrategicNexus tasks={tasks} onEdit={handleOpenTaskModal} />
                )}
              </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="luxury-card h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-serif text-gold-950">Strategic Archive</h2>
                <span className="text-[10px] uppercase font-bold text-saffron-600">{bookings.length} Verified</span>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {bookings.length === 0 ? (
                  <div className="py-8 text-center bg-gold-50/20 rounded-2xl border border-dashed border-gold-100">
                    <p className="text-[10px] text-gold-400 italic">No historical records found for this union.</p>
                  </div>
                ) : (
                  bookings.map(b => (
                    <BookingDetail 
                      key={b.id}
                      label={b.vendorRole} 
                      value={b.vendorName} 
                      status={`₹${b.cost?.toLocaleString()}`} 
                      date={new Date(b.bookingDate).toLocaleDateString()}
                      isCancelled={b.status === 'cancelled'}
                      onCancel={() => handleCancelBooking(b.id, b.vendorName)}
                    />
                  ))
                )}
              </div>
            </section>
            
            <section className="luxury-card">
              <h2 className="text-xl font-serif text-gold-950 mb-6 font-bold">Guest RSVPs</h2>
              <div className="flex items-center justify-center h-40">
                <div className="relative w-32 h-32 rounded-full border-4 border-gold-100 flex items-center justify-center">
                   <div className="absolute inset-0 border-4 border-saffron-500 rounded-full clip-path-half animate-spin-slow"></div>
                   <div className="text-center">
                     <p className="text-2xl font-display font-bold text-gold-950">78%</p>
                     <p className="text-[10px] uppercase text-gold-500 font-bold">Response Rate</p>
                   </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar / Schedule */}
        <aside className="space-y-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-gold-500/10 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-saffron-500/5 blur-3xl rounded-full" />
             <div className="relative z-10 flex flex-col items-center text-center">
               <div className="w-20 h-20 rounded-full bg-saffron-500/10 border-4 border-white shadow-xl flex items-center justify-center mb-6 relative group-hover:scale-105 transition-transform">
                 <Bot className="w-10 h-10 text-saffron-600" />
                 <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                 </div>
               </div>
               <h3 className="text-xl font-serif text-gold-950 mb-1">Reception Desk</h3>
               <p className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-6">Mojo is Online • Waiting for you</p>
               
               <div className="w-full p-4 bg-gold-50/50 rounded-2xl italic text-[11px] text-gold-700 leading-relaxed border border-gold-100/50 mb-6">
                 "I am Mojo, your personal wedding receptionist. How may I assist your royal planning today?"
               </div>

               <button 
                 onClick={() => window.dispatchEvent(new CustomEvent('open-concierge'))}
                 className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gold-950 text-gold-950 rounded-2xl hover:bg-gold-50 transition-all font-display text-xs uppercase tracking-widest font-bold shadow-lg shadow-gold-950/10 active:scale-95 group/btn"
               >
                 <Sparkles className="w-4 h-4 text-saffron-500 group-hover/btn:scale-125 transition-transform" />
                 Guided Assistance
               </button>
             </div>
           </div>

           <div className="luxury-card border-none bg-red-50/30 ring-1 ring-red-500/10">
             <div className="flex items-center gap-3 mb-4">
               <Shield className="w-5 h-5 text-red-600" />
               <h3 className="text-xl font-serif text-red-950">Sovereign Protection</h3>
             </div>
             <p className="text-[11px] text-red-700/70 mb-6 italic leading-relaxed">
               Your royal union is protected by our **Sovereign Escrow Protocol**. Dissolving your portfolio will trigger an 90% liquidation refund to your registered vault.
             </p>
             {currentWedding.status !== 'cancelled' ? (
               <button 
                 onClick={handleCancelWedding}
                 className="w-full py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-3"
               >
                 <Trash2 className="w-4 h-4" />
                 Dissolve & Request Refund
               </button>
             ) : (
               <div className="py-4 text-center border-2 border-dashed border-red-200 rounded-2xl bg-red-50">
                  <p className="text-[10px] uppercase font-black text-red-600">Union Dissolved</p>
                  <p className="text-[9px] text-red-400">Refund in Progress</p>
               </div>
             )}
           </div>

           <div className="luxury-card">
             <h2 className="text-xl font-serif text-gold-950 mb-6">Mojo Timeline</h2>
             <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-gold-100">
               <TimelineItem time="09:00 AM" event="Ganesh Puja Commencement" icon={<Clock className="w-3 h-3" />} />
               <TimelineItem time="12:30 PM" event="Royal Baraat Procession" icon={<Clock className="w-3 h-3" />} />
               <TimelineItem time="04:30 PM" event="Varmala Ceremony" icon={<Clock className="w-3 h-3" />} active />
               <TimelineItem time="07:30 PM" event="Grand Wedding Reception" icon={<Clock className="w-3 h-3" />} />
             </div>
           </div>
        </aside>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-gold-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-gold-100"
            >
              <form onSubmit={handleSaveTask} className="p-8 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-serif text-gold-950">
                    {editingTask ? 'Refine Objective' : 'New Strategic Goal'}
                  </h3>
                  <button type="button" onClick={() => setIsTaskModalOpen(false)}>
                    <X className="w-5 h-5 text-gold-400" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Title</label>
                    <input 
                      required
                      value={taskFormData.title}
                      onChange={e => setTaskFormData({...taskFormData, title: e.target.value})}
                      placeholder="e.g., Palace Lighting Finalization"
                      className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Detail</label>
                    <textarea 
                      rows={3}
                      value={taskFormData.description}
                      onChange={e => setTaskFormData({...taskFormData, description: e.target.value})}
                      placeholder="Specify the nuances of this requirement..."
                      className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Priority</label>
                      <select 
                        value={taskFormData.priority}
                        onChange={e => setTaskFormData({...taskFormData, priority: e.target.value})}
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm appearance-none"
                      >
                        <option value="low">Standard</option>
                        <option value="medium">Crucial</option>
                        <option value="high">Urgent</option>
                        <option value="critical">Royal Priority</option>
                      </select>
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Deadline</label>
                        <input 
                          type="date"
                          value={taskFormData.deadline}
                          onChange={e => setTaskFormData({...taskFormData, deadline: e.target.value})}
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                        />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Status</label>
                      <select 
                        value={taskFormData.status}
                        onChange={e => setTaskFormData({...taskFormData, status: e.target.value})}
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm appearance-none"
                      >
                        <option value="todo">Pending Arrival</option>
                        <option value="in-progress">In Execution</option>
                        <option value="completed">Perfected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Prerequisite Objective</label>
                      <select 
                        value={taskFormData.dependencyId}
                        onChange={e => setTaskFormData({...taskFormData, dependencyId: e.target.value})}
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm appearance-none"
                      >
                        <option value="">None (Independent)</option>
                        {tasks
                          .filter(t => t.id !== editingTask?.id)
                          .map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))
                        }
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Assignee (Email)</label>
                      <input 
                        value={taskFormData.assigneeId}
                        onChange={e => setTaskFormData({...taskFormData, assigneeId: e.target.value})}
                        placeholder="Collaborator Email"
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="flex-1 py-3 px-6 rounded-xl border border-gold-200 text-gold-500 text-[10px] uppercase tracking-widest font-bold hover:bg-gold-50 transition-all"
                  >
                    Discard Changes
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-3 px-12 rounded-xl bg-gold-950 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-gold-800 transition-all shadow-xl shadow-gold-950/20"
                  >
                    Establish Objective
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirmation.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-gold-950/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border-2 border-gold-500/20"
            >
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
                confirmation.type === 'finance' ? 'bg-saffron-50 text-saffron-600' : 
                confirmation.type === 'danger' ? 'bg-red-50 text-red-600' :
                'bg-gold-50 text-gold-600'
              }`}>
                {confirmation.type === 'finance' ? <DollarSign className="w-8 h-8" /> : 
                 confirmation.type === 'danger' ? <Trash2 className="w-8 h-8" /> :
                 <Shield className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-serif text-gold-950 text-center mb-4">{confirmation.title}</h3>
              <p className="text-sm text-gold-600 text-center leading-relaxed mb-8">
                {confirmation.message}
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 px-6 rounded-xl border border-gold-200 text-gold-500 text-xs font-bold uppercase tracking-widest hover:bg-gold-50 transition-all"
                >
                  Discard
                </button>
                <button 
                  onClick={confirmation.onConfirm}
                  className={`flex-1 py-3 px-6 rounded-xl text-white text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-gold-950/20 ${
                    confirmation.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-gold-950 hover:bg-gold-800'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDetailOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-gold-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-full max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 md:p-12 border-b border-gold-500/10 flex justify-between items-center bg-gold-50/30">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-2 block">Comprehensive Registry</span>
                  <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-serif text-gold-950">{currentWedding.name} Master Plan</h2>
                    {currentWedding.status !== 'cancelled' && (
                      <button 
                        onClick={handleCancelWedding}
                        className="px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                      >
                        Dissolve Portfolio
                      </button>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsDetailOpen(false)}
                  className="p-3 rounded-full hover:bg-gold-100 transition-colors bg-white shadow-sm border border-gold-200"
                >
                  <X className="w-6 h-6 text-gold-400" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-12">
                
                {/* Budget Breakdown & Visualization */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <PieChartIcon className="w-5 h-5 text-saffron-600" />
                      <h3 className="text-xl font-serif text-gold-950">Financial Architecture & Insights</h3>
                    </div>
                    <button 
                      onClick={handleLogTransaction}
                      className="text-[10px] uppercase tracking-widest font-bold text-saffron-600 hover:text-saffron-700 underline underline-offset-4"
                    >
                      Log Significant Transaction
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Charts Column */}
                    <div className="space-y-8">
                      <div className="p-8 bg-gold-50/50 rounded-[2.5rem] border border-gold-100 flex items-center justify-center min-h-[300px]">
                        <div className="w-full h-[300px]">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Venue', value: currentWedding.budgetTotal * 0.4 },
                                    { name: 'Catering', value: currentWedding.budgetTotal * 0.25 },
                                    { name: 'Decor', value: currentWedding.budgetTotal * 0.15 },
                                    { name: 'Photo/Cinema', value: currentWedding.budgetTotal * 0.1 },
                                    { name: 'Attire', value: currentWedding.budgetTotal * 0.07 },
                                    { name: 'Misc', value: currentWedding.budgetTotal * 0.03 },
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {['#92400e', '#d97706', '#f59e0b', '#fbbf24', '#fde68a', '#fef3c7'].map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#fff', borderRadius: '1rem', border: '1px solid #fef3c7', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                  formatter={(value: number) => `₹${value.toLocaleString()}`}
                                />
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="luxury-card border-none bg-gold-50/30 p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-4 h-4 text-gold-500" />
                          <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Planned Monthly Spending Patterns</span>
                        </div>
                        <div className="w-full h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                              { month: 'Jan', amount: 450000 },
                              { month: 'Feb', amount: 820000 },
                              { month: 'Mar', amount: 1200000 },
                              { month: 'Apr', amount: 950000 },
                              { month: 'May', amount: 2100000 },
                            ]}>
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                              <Bar dataKey="amount" fill="#d97706" radius={[4, 4, 0, 0]} />
                              <Tooltip cursor={{ fill: '#FEFCE8' }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Details Column */}
                    <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                      <BudgetCategoryItem label="Venue & Royal Suites" amount={currentWedding.budgetTotal * 0.4} percentage={40} color="bg-gold-800" />
                      <BudgetCategoryItem label="Catering & Feast" amount={currentWedding.budgetTotal * 0.25} percentage={25} color="bg-gold-700" />
                      <BudgetCategoryItem label="Decor & Ambiance" amount={currentWedding.budgetTotal * 0.15} percentage={15} color="bg-saffron-600" />
                      <BudgetCategoryItem label="Photo & Cinema" amount={currentWedding.budgetTotal * 0.1} percentage={10} color="bg-saffron-500" />
                      <BudgetCategoryItem label="Royal Attire & Jewelry" amount={currentWedding.budgetTotal * 0.07} percentage={7} color="bg-saffron-400" />
                      <BudgetCategoryItem label="Miscellaneous & Logistics" amount={currentWedding.budgetTotal * 0.03} percentage={3} color="bg-gold-200" />
                      
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-gold-950 rounded-3xl text-white shadow-xl shadow-gold-950/20">
                          <p className="text-[10px] uppercase tracking-widest text-gold-300 font-bold mb-2">Total Corpus</p>
                          <p className="text-2xl font-serif">₹{currentWedding.budgetTotal.toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-white rounded-3xl border-2 border-saffron-100 flex flex-col justify-center">
                          <p className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-2">Utilized</p>
                          <p className="text-2xl font-serif text-gold-950">₹{currentWedding.budgetSpent.toLocaleString()}</p>
                        </div>
                        <div className="p-6 bg-saffron-50 rounded-3xl border border-saffron-100 flex flex-col justify-center">
                          <p className="text-[10px] uppercase tracking-widest text-saffron-700 font-bold mb-2">Remaining</p>
                          <p className="text-2xl font-serif text-saffron-900">₹{(currentWedding.budgetTotal - currentWedding.budgetSpent).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Vendor Network */}
                <section className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-saffron-600" />
                      <h3 className="text-xl font-serif text-gold-950">Elite Vendor Network</h3>
                    </div>
                    <div className="flex items-center gap-3">
                       <select 
                         value={suggestionCategory}
                         onChange={(e) => setSuggestionCategory(e.target.value)}
                         className="text-[10px] uppercase font-bold bg-white border border-gold-200 px-3 py-1.5 rounded-lg outline-none focus:border-saffron-500"
                       >
                         <option value="Photographer">Cine-Masters</option>
                         <option value="Caterer">Royal Feast</option>
                         <option value="Decorator">Floral Architects</option>
                         <option value="Makeup Artist">Glamour Artists</option>
                       </select>
                       <input 
                          type="text"
                          value={granularPreferences}
                          onChange={(e) => setGranularPreferences(e.target.value)}
                          placeholder={
                            suggestionCategory === 'Photographer' ? 'e.g. Cinematic, Traditional' :
                            suggestionCategory === 'Caterer' ? 'e.g. Jain food, Street style' :
                            'e.g. Specific themes or genres'
                          }
                          className="text-[10px] bg-white border border-gold-200 px-3 py-2 rounded-lg outline-none focus:border-saffron-500 w-48"
                        />
                       <button 
                        onClick={getAISuggestions}
                        disabled={isAISuggesting}
                        className="bg-gold-950 text-white px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-gold-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        {isAISuggesting ? 'Consulting Mojo...' : 'Mojo Recommends'}
                      </button>
                    </div>
                  </div>

                  {aiSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-saffron-50 rounded-[2rem] border border-saffron-100 mb-8"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-saffron-600" />
                        <h4 className="text-xs uppercase tracking-widest font-black text-saffron-900">Mojo's Curated Selection for {suggestionCategory}</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                        {aiSuggestions.map((s, idx) => (
                           <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-6 rounded-3xl border border-saffron-200 shadow-sm hover:shadow-md transition-all"
                           >
                              <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-serif text-gold-950 text-lg">{s.name}</h5>
                                    <div className="flex items-center gap-1 bg-gold-50 px-2 py-1 rounded-full">
                                      <Star className="w-3 h-3 text-saffron-500 fill-saffron-500" />
                                      <span className="text-[10px] font-bold text-gold-700">{s.rating || '4.8'}</span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gold-600 mb-4 leading-relaxed">{s.reason}</p>
                                  
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-[8px] uppercase font-black text-gold-400 tracking-widest mb-2">Signature Portfolio</p>
                                      <div className="flex flex-wrap gap-2">
                                        {s.portfolio?.map((item: string, i: number) => (
                                          <span key={i} className="text-[9px] bg-gold-50 text-gold-700 px-2 py-1 rounded-lg border border-gold-100 italic">
                                            {item}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-[8px] uppercase font-black text-gold-400 tracking-widest mb-2">Recent Testimonials</p>
                                      <div className="space-y-2">
                                        {s.reviews?.map((r: any, i: number) => (
                                          <div key={i} className="text-[10px] text-gold-500 border-l-2 border-saffron-200 pl-3 py-0.5">
                                            <span className="font-bold text-gold-800">{r.user}:</span> "{r.comment}"
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="md:w-48 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-gold-100 pt-4 md:pt-0 md:pl-6">
                                  <div className="text-right">
                                    <p className="text-[8px] uppercase font-black text-gold-400 tracking-widest mb-1">Estimated Investment</p>
                                    <p className="text-lg font-serif text-saffron-600 truncate">{s.estimatedCost}</p>
                                  </div>
                                  <button 
                                    className="gold-button w-full py-2.5 text-[10px]"
                                    onClick={() => {
                                      // In a real app, this would add to the vendor list
                                      alert(`Mojo has initiated contact with ${s.name} for your archive.`);
                                    }}
                                  >
                                    Retain Service
                                  </button>
                                </div>
                              </div>
                           </motion.div>
                        ))}
                      </div>
                      <button 
                        onClick={() => setAiSuggestions([])}
                        className="mt-4 text-[10px] uppercase font-bold text-saffron-400 hover:text-saffron-600"
                      >
                        Clear Recommendations
                      </button>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailedVendorItem 
                      name="The Leela Palace" 
                      role="Venue & Hospitality" 
                      status="Contract Active" 
                      contact="Ranbir Singh" 
                      rating={currentWedding.vendorRatings?.['The Leela Palace']}
                      onRate={handleRateVendor}
                    />
                    <DetailedVendorItem 
                      name="Heritage Feast" 
                      role="Royal Catering" 
                      status="Menu Finalized" 
                      contact="Chef Kapoor" 
                      onFinalize={() => handleFinalizeVendor({ name: "Heritage Feast", role: "Royal Catering", contact: "Chef Kapoor" })}
                      rating={currentWedding.vendorRatings?.['Heritage Feast']}
                      onRate={handleRateVendor}
                    />
                    <DetailedVendorItem 
                      name="Floral Heritage" 
                      role="Floral Architecture" 
                      status="Design Locked" 
                      contact="Anaya Verma" 
                      onFinalize={() => handleFinalizeVendor({ name: "Floral Heritage", role: "Floral Architecture", contact: "Anaya Verma" })}
                      rating={currentWedding.vendorRatings?.['Floral Heritage']}
                      onRate={handleRateVendor}
                    />
                    <DetailedVendorItem 
                      name="Vogue Frames" 
                      role="Cinematography" 
                      status="Pending Advance" 
                      contact="Vikram Roy" 
                      onFinalize={() => handleFinalizeVendor({ name: "Vogue Frames", role: "Cinematography", contact: "Vikram Roy" })}
                      rating={currentWedding.vendorRatings?.['Vogue Frames']}
                      onRate={handleRateVendor}
                    />
                  </div>
                </section>

                {/* Guest Management */}
                <section className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-saffron-600" />
                    <h3 className="text-xl font-serif text-gold-950">Guest Sentiment & Registry</h3>
                  </div>
                  <div className="luxury-card border-none bg-gold-50/50 p-8 rounded-[2rem]">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                      <div className="w-48 h-48 rounded-full border-8 border-gold-100 flex items-center justify-center relative">
                        <div className="absolute inset-0 border-8 border-saffron-500 rounded-full clip-path-half" />
                        <div className="text-center">
                          <p className="text-4xl font-display font-bold text-gold-950">142</p>
                          <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Confirmed</p>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">Invited</p>
                          <p className="text-2xl font-serif text-gold-950">182 Souls</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">Awaiting</p>
                          <p className="text-2xl font-serif text-gold-950">40 Souls</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">Special Req</p>
                          <p className="text-2xl font-serif text-gold-950">12 Dietaries</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-widest text-gold-400 font-bold mb-1">VIP Guests</p>
                          <p className="text-2xl font-serif text-gold-950">6 Royal Families</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="pt-8">
                  <button 
                    onClick={() => setIsDetailOpen(false)}
                    className="gold-button w-full py-4 text-lg"
                  >
                    Return to Blueprint
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Mode Overlay */}
      <AnimatePresence>
        {isLiveModeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LiveMode 
              weddingId={currentWedding.id} 
              isOwner={user?.uid ? currentWedding.ownerIds.includes(user.uid) : false} 
              onClose={() => setIsLiveModeOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain Nexus Modal */}
      <AnimatePresence>
        {isDomainNexusOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDomainNexusOpen(false)}
              className="absolute inset-0 bg-gold-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border-2 border-gold-100 p-10"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                         <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.3em] font-black text-blue-600">Digital Residency</span>
                   </div>
                   <h3 className="text-3xl font-serif text-gold-950">Domain Nexus</h3>
                </div>
                <button onClick={() => setIsDomainNexusOpen(false)} className="p-2 hover:bg-gold-50 rounded-full">
                  <X className="w-5 h-5 text-gold-300" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] uppercase font-black text-gold-400 tracking-widest block mb-1">Proposed Custom URL</label>
                   <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-300" />
                        <input 
                          value={domainInput}
                          onChange={(e) => setDomainInput(e.target.value)}
                          placeholder="e.g. www.ananyaandvikram.com"
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-blue-500 transition-all font-serif italic"
                        />
                      </div>
                      <button 
                        onClick={handleVerifyDomain}
                        disabled={isVerifyingDomain || !domainInput}
                        className="bg-gold-950 text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-gold-800 disabled:opacity-50 transition-all"
                      >
                        {isVerifyingDomain ? 'Probing...' : 'Initiate Sync'}
                      </button>
                   </div>
                </div>

                {currentWedding.customDomain && (
                   <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                   >
                     <div className="p-6 bg-white border border-gold-100 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <LinkIcon className="w-4 h-4 text-gold-400" />
                              <span className="text-sm font-bold text-gold-950">{currentWedding.customDomain.url}</span>
                           </div>
                           <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-1 rounded-full ${
                             currentWedding.customDomain.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gold-50 text-gold-400'
                           }`}>
                             {currentWedding.customDomain.status}
                           </span>
                        </div>
                        
                        <div className="pt-4 border-t border-gold-50">
                           <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-3">DNS Configuration Protocol</p>
                           <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 bg-gold-50/50 rounded-xl">
                                 <p className="text-[8px] uppercase font-bold text-gold-400 mb-1">Record Type</p>
                                 <p className="text-xs font-bold text-gold-950">{currentWedding.customDomain.dnsConfig.type}</p>
                              </div>
                              <div className="p-3 bg-gold-50/50 rounded-xl col-span-2">
                                 <p className="text-[8px] uppercase font-bold text-gold-400 mb-1">Destination Value</p>
                                 <p className="text-xs font-bold text-gold-950 break-all">{currentWedding.customDomain.dnsConfig.value}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                           <p className="text-[10px] text-blue-800 leading-relaxed">
                              Your digital royal residence is being established. Please point your domain's <span className="font-bold">{currentWedding.customDomain.dnsConfig.type}</span> record to the value above. Propagation may take up to 24 cycles.
                           </p>
                           <button 
                             onClick={() => alert("The Royal Setup Guide is being prepared for your specific union.")}
                             className="inline-flex items-center gap-1 text-[10px] font-black text-blue-700 uppercase mt-2 hover:text-blue-900 transition-colors"
                           >
                              Setup Guide <ExternalLink className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                   </motion.div>
                )}
              </div>

              <div className="mt-10 pt-8 border-t border-gold-50">
                <p className="text-xs text-gold-400 font-serif italic text-center">
                  Establish your unique corner of the digital universe, reserved exclusively for your royal union.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vendor Confirmation Modal */}
      <AnimatePresence>
        {finalizingVendor && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isFinalizing && setFinalizingVendor(null)}
              className="absolute inset-0 bg-gold-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border-2 border-gold-100 flex flex-col"
            >
              <div className="bg-gold-950 p-10 text-white relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-saffron-500/10 blur-3xl rounded-full" />
                 <div className="relative z-10">
                    <Shield className="w-12 h-12 text-saffron-400 mb-6" />
                    <span className="text-[10px] uppercase tracking-[0.3em] font-black text-saffron-400 mb-2 block">Strategic Finalization</span>
                    <h3 className="text-4xl font-serif leading-tight">Authorize Partnership with {finalizingVendor.name}</h3>
                 </div>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8 pb-8 border-b border-gold-50">
                    <div>
                       <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-1">Contract Identifier</p>
                       <p className="text-sm font-bold text-gold-950 font-mono tracking-tighter">{finalizingVendor.contractId}</p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-1">Assigned Role</p>
                       <p className="text-sm font-bold text-gold-950">{finalizingVendor.role}</p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-1">Point of Contact</p>
                       <p className="text-sm font-bold text-gold-950">{finalizingVendor.contact}</p>
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-1">Authorization Method</p>
                       <p className="text-sm font-bold text-saffron-600">Digital Seal & Email</p>
                    </div>
                 </div>

                 <div className="p-6 bg-gold-50 rounded-2xl border border-gold-100">
                    <div className="flex items-center justify-between mb-4">
                       <h4 className="text-sm font-serif font-bold text-gold-950">Financial Commitment</h4>
                       <span className="text-[10px] uppercase font-black text-saffron-600">Secure Transfer</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-gold-600">Immediate Deposit Requirement (5%)</span>
                       <span className="text-xl font-serif text-gold-950">₹{finalizingVendor.depositAmount.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 bg-saffron-50/50 rounded-2xl border border-saffron-100">
                    <AlertCircle className="w-5 h-5 text-saffron-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-saffron-800 leading-relaxed italic">
                       Confirming this partnership will dispatch legal summaries to your registry email (<span className="font-bold underline">{user?.email}</span>) and formally alert the vendor's logistics team.
                    </p>
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button 
                      disabled={isFinalizing}
                      onClick={() => setFinalizingVendor(null)}
                      className="flex-1 py-4 border-2 border-gold-950 rounded-2xl text-gold-950 text-xs font-bold uppercase tracking-widest hover:bg-gold-50 transition-all disabled:opacity-50"
                    >
                      Resync Details
                    </button>
                    <button 
                      disabled={isFinalizing}
                      onClick={confirmVendorBooking}
                      className="flex-2 py-4 bg-gold-950 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-gold-800 transition-all shadow-xl shadow-gold-950/20 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                      {isFinalizing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sealing Partnership...
                        </>
                      ) : (
                        'Confirm & Dispatch'
                      )}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Royal Treasury Modal */}
      <AnimatePresence>
        {isTreasuryOpen && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTreasuryOpen(false)}
              className="absolute inset-0 bg-gold-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl border-2 border-gold-100 flex flex-col"
            >
              <div className="bg-gold-950 p-10 text-white relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 blur-3xl rounded-full" />
                 <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Wallet className="w-8 h-8 text-gold-400 mb-2" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gold-400 block pb-2">Wealth Management</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <h3 className="text-4xl font-serif">Royal Treasury</h3>
                        {currentWedding.status !== 'cancelled' && (
                          <button 
                            onClick={handleCancelWedding}
                            className="px-3 py-1 bg-red-500/20 text-red-100 border border-red-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500/40 transition-all shadow-lg"
                          >
                            Cancel Entire Order
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={() => setIsBankingModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all"
                      >
                        {currentWedding.bankingProfile ? 'Modify Banking Nexus' : 'Configure Settlement Profile'}
                      </button>
                    </div>
                    <button onClick={() => setIsTreasuryOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                      <X className="w-6 h-6 text-gold-300" />
                    </button>
                 </div>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-gold-50 rounded-2xl border border-gold-100">
                      <p className="text-[10px] uppercase font-black text-gold-400 tracking-widest mb-1">Remaining Budget</p>
                      <p className="text-2xl font-serif text-gold-950">₹{(currentWedding.budgetTotal - currentWedding.budgetSpent).toLocaleString()}</p>
                    </div>
                    <div className="p-6 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] uppercase font-black text-green-600 tracking-widest mb-1">Escrow Secured</p>
                      <p className="text-2xl font-serif text-green-950">₹{currentWedding.budgetSpent.toLocaleString()}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[10px] uppercase font-black text-gold-400 tracking-widest">Wealth Ledger</h4>
                       <span className="text-[8px] uppercase font-bold text-gold-300">Live Archives</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                       {transfers.length > 0 ? transfers.map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 bg-gold-50/30 border border-gold-100/50 rounded-xl">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                   <TrendingUp className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                   <p className="text-[10px] font-bold text-gold-950">{tx.description}</p>
                                   <p className="text-[8px] text-gold-400">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <p className="text-xs font-bold text-green-600">+₹{tx.amount.toLocaleString()}</p>
                          </div>
                       )) : (
                          <p className="text-center py-6 text-[10px] text-gold-300 font-serif italic">The ledger is currently waiting for enrichment.</p>
                       )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h4 className="text-[10px] uppercase font-black text-gold-400 tracking-widest">Pending Settlements</h4>
                    <div className="space-y-3">
                       {bookings.length > 0 ? bookings.filter(b => b.status !== 'cancelled').map((booking: any) => (
                          <div key={booking.id} className="flex items-center justify-between p-4 bg-white border border-gold-100 rounded-xl hover:border-gold-300 transition-all">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center text-gold-600">
                                   <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-gold-950">{booking.vendorName}</p>
                                   <p className="text-[10px] text-gold-400">{booking.vendorRole}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <div className="text-right">
                                   <p className="text-sm font-bold text-gold-950">₹{booking.cost.toLocaleString()}</p>
                                   <button 
                                     onClick={() => handleInitiatePayment(booking.cost * 0.5, `Balance Payment for ${booking.vendorName}`)}
                                     disabled={isProcessingPayment}
                                     className="text-[9px] uppercase font-black text-gold-600 hover:text-gold-800 disabled:opacity-50"
                                   >
                                     {isProcessingPayment ? 'Processing...' : 'Settle Balance'}
                                   </button>
                                </div>
                                <button 
                                  onClick={() => handleCancelBooking(booking.id, booking.vendorName)}
                                  className="p-2 text-gold-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Cancel Partnership"
                                >
                                   <Trash2 className="w-4 h-4" />
                                </button>
                             </div>
                          </div>
                       )) : (
                          <div className="text-center py-12 px-6 bg-gold-50/50 rounded-2xl border border-dashed border-gold-200">
                             <Briefcase className="w-10 h-10 text-gold-200 mx-auto mb-4" />
                             <p className="text-xs text-gold-500 font-serif italic mb-4">No pending settlements recorded in the treasury lexicon.</p>
                             <button 
                               onClick={() => {
                                 setIsTreasuryOpen(false);
                                 alert("Opening the Divine Vendor Registry. Mojo will now guide you to our elite partners.");
                               }}
                               className="text-[9px] uppercase font-black text-saffron-600 border-b border-saffron-500/30 pb-1"
                             >
                               Discover Elite Vendors
                             </button>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="p-6 bg-gold-950 rounded-2xl text-white">
                    <div className="flex justify-between items-center mb-6">
                       <div>
                          <h4 className="text-lg font-serif">Quick Treasury Top-up</h4>
                          <p className="text-[10px] text-gold-400">Add funds to your Eventora Escrow Account</p>
                       </div>
                       <TrendingUp className="w-8 h-8 text-gold-500" />
                    </div>
                    <div className="flex gap-3">
                       {[50000, 100000, 500000].map((amt) => (
                          <button 
                            key={amt}
                            onClick={() => handleInitiatePayment(amt, 'Escrow Top-up')}
                            disabled={isProcessingPayment}
                            className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black tracking-widest transition-all active:scale-95"
                          >
                            ₹{(amt/1000).toFixed(0)}K
                          </button>
                       ))}
                    </div>
                 </div>

                 <div className="flex items-start gap-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-[10px] text-blue-800 leading-relaxed">
                       All transfers are secured by **Eventora Sovereign Encryption**. Funds are held in escrow and released only upon your digital authorization or verified milestone completion.
                    </p>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Banking Profile Modal */}
      <AnimatePresence>
        {isBankingModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBankingModalOpen(false)}
              className="absolute inset-0 bg-gold-950/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-gold-200"
            >
              <form onSubmit={handleSaveBankingDetails} className="p-10 space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-1 block">Secure Vault</span>
                    <h3 className="text-2xl font-serif text-gold-950">Banking Profile</h3>
                  </div>
                  <button type="button" onClick={() => setIsBankingModalOpen(false)}>
                    <X className="w-5 h-5 text-gold-400" />
                  </button>
                </div>

                <div className="space-y-4">
                   <div>
                     <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Account Holder Name</label>
                     <input 
                       required
                       value={bankingDetails.accountName}
                       onChange={e => setBankingDetails({...bankingDetails, accountName: e.target.value})}
                       className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Account Number</label>
                        <input 
                          required
                          type="password"
                          value={bankingDetails.accountNumber}
                          onChange={e => setBankingDetails({...bankingDetails, accountNumber: e.target.value})}
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Bank Name</label>
                        <input 
                          required
                          value={bankingDetails.bankName}
                          onChange={e => setBankingDetails({...bankingDetails, bankName: e.target.value})}
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">IFSC / Routing Code</label>
                        <input 
                          required
                          value={bankingDetails.ifscCode}
                          onChange={e => setBankingDetails({...bankingDetails, ifscCode: e.target.value})}
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">SWIFT Code (Optional)</label>
                        <input 
                          value={bankingDetails.swiftCode}
                          onChange={e => setBankingDetails({...bankingDetails, swiftCode: e.target.value})}
                          className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                        />
                      </div>
                   </div>
                </div>

                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                   <div className="flex gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-[10px] text-amber-800 leading-relaxed italic">
                        By providing these details, you authorize Eventora to use this encrypted vault for vendor settlements and escrow reconciliations.
                      </p>
                   </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-gold-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-800 transition-all shadow-xl shadow-gold-950/20"
                >
                   Seal Banking Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subtext, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="luxury-card border-none bg-white ring-1 ring-gold-500/10 shadow-sm hover:shadow-md"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-saffron-50 rounded-lg text-saffron-600">
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] text-gold-600 font-bold">{label}</span>
    </div>
    <p className="text-3xl font-serif text-gold-950 mb-1 tracking-tight">{value}</p>
    <p className="text-[10px] text-saffron-600 font-bold uppercase tracking-wider">{subtext}</p>
  </motion.div>
);

const TaskItem = ({ task, onEdit, onDelete, allTasks }: any) => {
  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-saffron-600 bg-saffron-50';
      case 'medium': return 'text-gold-600 bg-gold-50';
      default: return 'text-gold-400 bg-gold-50';
    }
  };

  const dependency = task.dependencyId ? allTasks?.find((t: any) => t.id === task.dependencyId) : null;
  const isLocked = dependency && dependency.status !== 'completed';

  return (
    <div className={`flex items-center justify-between group p-4 bg-white border border-gold-100 rounded-2xl hover:border-saffron-200/50 hover:shadow-lg hover:shadow-gold-500/5 transition-all ${isLocked ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-5">
        <button 
          onClick={isLocked ? undefined : onEdit}
          disabled={isLocked}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            task.status === 'completed' ? 'bg-saffron-600 border-saffron-600' : 
            isLocked ? 'border-gold-100 bg-gold-50 cursor-not-allowed' : 'border-gold-200 hover:border-saffron-500'
          }`}
        >
          {task.status === 'completed' ? <CheckCircle2 className="w-3 h-3 text-white" /> : 
           isLocked ? <Shield className="w-2.5 h-2.5 text-gold-300" /> : null}
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h4 className={`text-sm font-bold transition-all ${task.status === 'completed' ? 'text-gold-400 line-through' : 'text-gold-950'}`}>
              {task.title}
            </h4>
            <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority === 'critical' ? 'Royal Priority' : task.priority}
            </span>
            {isLocked && (
              <span className="text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1">
                <Shield className="w-2 h-2" />
                Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No Date Set'}
            </p>
            {dependency && (
              <p className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 ${dependency.status === 'completed' ? 'text-gold-400' : 'text-blue-500'}`}>
                <LinkIcon className="w-3 h-3" />
                Requires: {dependency.title}
              </p>
            )}
            {task.assigneeId && (
              <p className="text-[10px] uppercase tracking-widest text-saffron-600/60 font-bold flex items-center gap-1">
                <Users className="w-3 h-3" />
                {task.assigneeId}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
        <button 
          onClick={onEdit}
          className="p-2 text-gold-400 hover:text-saffron-600 hover:bg-saffron-50 rounded-lg transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-gold-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const VendorItem = ({ name, role, status }: any) => (
  <div className="flex items-center justify-between p-2">
    <div>
      <h4 className="text-sm font-medium text-gold-950">{name}</h4>
      <p className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">{role}</p>
    </div>
    <span className={`text-[10px] font-display font-bold uppercase tracking-widest px-3 py-1 rounded-full ${status === 'Confirmed' ? 'text-saffron-600 bg-saffron-50 border border-saffron-200' : 'text-gold-400 bg-gold-50'}`}>
      {status}
    </span>
  </div>
);

const BookingDetail = ({ label, value, status, date, onCancel, isCancelled }: any) => (
  <div className={`p-4 bg-gold-50/50 rounded-xl border border-gold-100/50 transition-all ${isCancelled ? 'opacity-50 grayscale' : 'hover:border-gold-300'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-[8px] uppercase tracking-widest text-gold-500 font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-[8px] font-display font-bold uppercase ${isCancelled ? 'text-red-500' : 'text-saffron-600'}`}>
          {isCancelled ? 'Cancelled' : status}
        </span>
        {!isCancelled && onCancel && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="p-1 hover:bg-red-50 text-gold-300 hover:text-red-500 rounded transition-all"
            title="Cancel Partnership"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
    <div className="flex justify-between items-end">
      <p className="text-sm font-bold text-gold-950">{value}</p>
      {date && <p className="text-[9px] text-gold-400 italic">{date}</p>}
    </div>
  </div>
);

const DetailedVendorItem = ({ name, role, status, contact, onFinalize, rating, onRate }: any) => (
  <div className="p-4 bg-white border border-gold-200 rounded-2xl shadow-sm flex items-center justify-between group hover:border-saffron-500/30 transition-all">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center text-gold-600">
        <Briefcase className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-gold-950">{name}</h4>
        <p className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">{role}</p>
        
        {/* Rating Section */}
        {(!onFinalize || status.includes('Active') || status.includes('Finalized')) && (
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => onRate?.(name, star)}
                className="focus:outline-none transition-transform active:scale-125"
              >
                <Star 
                  className={`w-3 h-3 ${star <= (rating || 0) ? 'text-saffron-500 fill-saffron-500' : 'text-gold-200'}`} 
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    <div className="flex flex-col items-end">
      <div className="text-right mb-2">
        <p className="text-[10px] font-bold text-saffron-600 uppercase mb-1">{status}</p>
        <p className="text-xs text-gold-500 italic">Contact: {contact}</p>
      </div>
      {onFinalize && (
        <button 
          onClick={onFinalize}
          className="text-[10px] uppercase tracking-widest font-black text-white bg-gold-950 px-3 py-1.5 rounded-lg hover:bg-saffron-600 transition-all active:scale-95 whitespace-nowrap"
        >
          Finalize Contract
        </button>
      )}
    </div>
  </div>
);

const StrategicNexus = ({ tasks, onEdit }: { tasks: any[], onEdit: (task: any) => void }) => {
  // Simple layout: group by dependency depth
  const getDepth = (task: any, currentTasks: any[], visited: Set<string> = new Set()): number => {
    if (!task.dependencyId || visited.has(task.id)) return 0;
    visited.add(task.id);
    const dependency = currentTasks.find(t => t.id === task.dependencyId);
    if (!dependency) return 0;
    return 1 + getDepth(dependency, currentTasks, visited);
  };

  const tasksWithDepth = tasks.map(t => ({
    ...t,
    depth: getDepth(t, tasks)
  }));

  const maxDepth = Math.max(0, ...tasksWithDepth.map(t => t.depth));
  const columns: any[][] = Array.from({ length: maxDepth + 1 }, () => []);
  tasksWithDepth.forEach(t => columns[t.depth].push(t));

  return (
    <div className="p-8 bg-gold-50/30 rounded-[2.5rem] border border-gold-100 relative overflow-x-auto min-h-[500px] scrollbar-hide">
      <div className="flex gap-24 min-w-max h-full items-start justify-center py-12 px-10">
        {columns.map((columnTasks, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-12 relative z-10 w-56">
            <div className="text-[9px] uppercase tracking-[0.4em] font-black text-gold-400 mb-4 border-b border-gold-200/50 pb-3 text-center">
              Strategic Phase {colIdx + 1}
            </div>
            {columnTasks.map(task => {
              const dependency = task.dependencyId ? tasks.find(t => t.id === task.dependencyId) : null;
              const isLocked = dependency && dependency.status !== 'completed';
              
              return (
                <div key={task.id} className="relative group/task">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => onEdit(task)}
                    className={`p-5 rounded-3xl border-2 transition-all cursor-pointer shadow-sm relative z-20 ${
                      task.status === 'completed' ? 'bg-saffron-600 border-saffron-400 text-white shadow-xl shadow-saffron-500/20' : 
                      isLocked ? 'bg-white border-gold-100 text-gold-300 opacity-70 grayscale' : 'bg-white border-gold-200 text-gold-950 hover:border-saffron-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`text-[8px] uppercase font-black px-2 py-1 rounded-full ${
                        task.status === 'completed' ? 'bg-white/20 text-white' : 'bg-gold-50 text-gold-500'
                      }`}>
                        {task.priority}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isLocked ? (
                          <Shield className="w-3.5 h-3.5 animate-pulse" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-saffron-400" />
                        )}
                      </div>
                    </div>

                    <h5 className="text-[11px] font-bold leading-snug uppercase tracking-tight mb-2">
                       {task.title}
                    </h5>

                    {dependency && (
                      <div className={`text-[8px] uppercase font-black tracking-widest flex items-center gap-1 mt-3 ${task.status === 'completed' ? 'text-white/60' : 'text-gold-400'}`}>
                        <LinkIcon className="w-2.5 h-2.5" />
                        Roots: {dependency.title.slice(0, 15)}...
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Visual Connection line to dependency (Horizontal) */}
                  {task.dependencyId && (
                    <div className="absolute top-1/2 -left-24 w-24 h-[2px] pointer-events-none group-hover/task:h-1 transition-all">
                       <div className={`w-full h-full ${dependency?.status === 'completed' ? 'bg-saffron-400 shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'bg-gold-200'}`} />
                       <div className={`absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${dependency?.status === 'completed' ? 'bg-saffron-500' : 'bg-gold-200'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {/* Legend & Instructions */}
      <div className="mt-12 flex flex-col items-center gap-6 border-t border-gold-100 pt-8">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-saffron-600 shadow-lg shadow-saffron-500/20" />
            <span className="text-[9px] uppercase font-black text-gold-400 tracking-[0.2em]">Mastered Goal</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-2xl bg-white border-2 border-saffron-400" />
            <span className="text-[9px] uppercase font-black text-gold-400 tracking-[0.2em]">Active Pursuit</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-2xl bg-gold-50 border-2 border-gold-100" />
            <span className="text-[9px] uppercase font-black text-gold-400 tracking-[0.2em]">Locked Horizon</span>
          </div>
        </div>
        <p className="text-[10px] text-gold-400 italic font-serif">Mojo's Nexus automatically calculates the critical path based on objective prerequisites.</p>
      </div>
    </div>
  );
};

const TimelineItem = ({ time, event, icon, active }: any) => (
  <div className="flex items-start gap-4 relative">
    <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white transition-all ${active ? 'bg-saffron-500 text-white scale-110 shadow-lg' : 'bg-gold-100 text-gold-500'}`}>
      {icon}
    </div>
    <div className="pt-1">
      <p className={`text-[10px] font-display font-bold uppercase tracking-widest ${active ? 'text-saffron-600' : 'text-gold-400'}`}>{time}</p>
      <h4 className={`text-sm font-medium ${active ? 'text-gold-950' : 'text-gold-700/60'}`}>{event}</h4>
    </div>
  </div>
);

const BudgetCategoryItem = ({ label, amount, percentage, color }: any) => (
  <div className="p-5 bg-white border border-gold-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-3">
      <div>
        <p className="text-sm font-serif text-gold-950 mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
           <span className="text-[9px] font-black uppercase text-gold-400 tracking-widest">Allocation</span>
           <span className="text-[11px] font-bold text-saffron-600">₹{amount.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-lg font-serif text-gold-900">{percentage}%</span>
      </div>
    </div>
    <div className="w-full h-1.5 bg-gold-50 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        whileInView={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className={`h-full ${color}`} 
      />
    </div>
  </div>
);
