import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, AlertCircle, Play, ChevronRight, X, Users, Briefcase, Sparkles, MapPin } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'delayed';
  vendorId?: string;
  vendorStatus?: string;
  isPublic: boolean;
  delayReason?: string;
}

interface LiveModeProps {
  weddingId: string;
  isOwner: boolean;
  onClose: () => void;
}

export const LiveMode: React.FC<LiveModeProps> = ({ weddingId, isOwner, onClose }) => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [delayingEventId, setDelayingEventId] = useState<string | null>(null);
  const [delayReasonInput, setDelayReasonInput] = useState('');
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    status: 'scheduled' as LiveEvent['status'],
    isPublic: true,
    vendorStatus: '',
    delayReason: ''
  });

  useEffect(() => {
    const eventsRef = collection(db, 'weddings', weddingId, 'live_events');
    const q = query(eventsRef, orderBy('startTime', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LiveEvent[];
      setEvents(eventList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `weddings/${weddingId}/live_events`);
    });

    return () => unsubscribe();
  }, [weddingId]);

  const handleUpdateStatus = async (eventId: string, status: LiveEvent['status'], delayReason?: string) => {
    if (!isOwner) return;
    try {
      const eventRef = doc(db, 'weddings', weddingId, 'live_events', eventId);
      const updates: any = { status, updatedAt: serverTimestamp() };
      if (delayReason !== undefined) {
        updates.delayReason = delayReason;
      }
      await updateDoc(eventRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `weddings/${weddingId}/live_events/${eventId}`);
    }
  };

  const handleSignalDelay = (eventId: string) => {
    setDelayingEventId(eventId);
    setDelayReasonInput('');
    setIsDelayModalOpen(true);
  };

  const confirmDelay = async () => {
    if (!delayingEventId) return;
    await handleUpdateStatus(delayingEventId, 'delayed', delayReasonInput);
    setIsDelayModalOpen(false);
    setDelayingEventId(null);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    const path = `weddings/${weddingId}/live_events`;
    try {
      if (editingEvent) {
        const eventRef = doc(db, path, editingEvent.id);
        await updateDoc(eventRef, { ...formData, updatedAt: serverTimestamp() });
      } else {
        await addDoc(collection(db, path), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsEventModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const currentEvent = events.find(e => e.status === 'in-progress');
  const nextEvent = events.find(e => e.status === 'scheduled');

  return (
    <div className="fixed inset-0 z-[200] bg-ivory overflow-y-auto">
      {/* Top Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gold-100 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold-950 flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-gold-950">Live Horizon</h2>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                 <span className="text-[10px] uppercase font-black text-gold-400 tracking-[0.2em]">Ceremony Synchronized</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isOwner && (
              <button 
                onClick={() => {
                  setEditingEvent(null);
                  setFormData({
                    title: '',
                    description: '',
                    startTime: '',
                    status: 'scheduled',
                    isPublic: true,
                    vendorStatus: '',
                    delayReason: ''
                  });
                  setIsEventModalOpen(true);
                }}
                className="bg-gold-950 text-white px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gold-800 transition-all shadow-xl shadow-gold-950/20"
              >
                Inject Event
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gold-50 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gold-400" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left: Real-Time Status Cards */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Active Spotlight */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Play className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Now in Manifestation</span>
              </div>
              
              <AnimatePresence mode="wait">
                {currentEvent ? (
                  <motion.div 
                    key={currentEvent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gold-950 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/10 blur-[100px] rounded-full" />
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex-1">
                          <p className="text-saffron-400 font-display font-medium text-lg mb-2">{currentEvent.startTime}</p>
                          <h3 className="text-5xl font-serif mb-4 leading-tight">{currentEvent.title}</h3>
                          <p className="text-gold-200/80 text-lg max-w-xl leading-relaxed">
                            {currentEvent.description || "The sacred rituals are proceeding according to the divine alignment."}
                          </p>
                          
                          {currentEvent.status === 'delayed' && currentEvent.delayReason && (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="mt-6 p-4 bg-red-500/10 border-l-4 border-red-500 rounded-r-2xl"
                            >
                               <span className="text-[10px] uppercase font-black tracking-widest text-red-400 block mb-1">Momentary Pause In Manifestation</span>
                               <p className="text-white text-sm italic">"{currentEvent.delayReason}"</p>
                            </motion.div>
                          )}
                        </div>
                        <div className={`px-6 py-3 rounded-2xl border ${
                          currentEvent.status === 'delayed' 
                            ? 'bg-red-500/20 border-red-500/30' 
                            : 'bg-saffron-500/20 border-saffron-500/30'
                        }`}>
                           <span className={`text-xs uppercase font-black tracking-widest ${
                             currentEvent.status === 'delayed' ? 'text-red-400' : 'text-saffron-400'
                           }`}>
                             Status: {currentEvent.status === 'delayed' ? 'Delayed' : 'Active'}
                           </span>
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex gap-4 pt-8 border-t border-white/10">
                          <button 
                            onClick={() => handleUpdateStatus(currentEvent.id, 'completed')}
                            className="bg-white text-gold-950 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-saffron-50 transition-all flex items-center gap-3 shadow-xl"
                          >
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Seal Step
                          </button>
                          {currentEvent.status !== 'delayed' ? (
                            <button 
                              onClick={() => handleSignalDelay(currentEvent.id)}
                              className="bg-red-500/20 text-red-400 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs border border-red-500/30 hover:bg-red-500/30 transition-all flex items-center gap-3"
                            >
                              <AlertCircle className="w-5 h-5" />
                              Signal Delay
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateStatus(currentEvent.id, 'in-progress', '')}
                              className="bg-saffron-500 text-gold-950 px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-saffron-400 transition-all flex items-center gap-3 shadow-xl"
                            >
                              <Play className="w-5 h-5 fill-gold-950" />
                              Resume Flow
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-gold-50/50 rounded-[3rem] p-20 text-center border-4 border-dashed border-gold-100">
                    <Clock className="w-16 h-16 text-gold-200 mx-auto mb-6" />
                    <p className="text-gold-400 font-serif italic text-xl">The horizon is currently in transition. Prepare for the next phase.</p>
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Timeline Stream */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <Clock className="w-5 h-5 text-gold-400" />
                <h3 className="text-2xl font-serif text-gold-950">Ceremonial Stream</h3>
              </div>
              
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gold-100">
                {events.map((event, idx) => (
                  <motion.div 
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-start gap-8 relative group cursor-pointer ${event.status === 'completed' ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!isOwner) return;
                      setEditingEvent(event);
                      setFormData({
                        title: event.title,
                        description: event.description || '',
                        startTime: event.startTime,
                        status: event.status,
                        isPublic: event.isPublic,
                        vendorStatus: event.vendorStatus || '',
                        delayReason: event.delayReason || ''
                      });
                      setIsEventModalOpen(true);
                    }}
                  >
                    <div className={`z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-ivory transition-all ${
                      event.status === 'in-progress' ? 'bg-saffron-500 text-white shadow-lg scale-110' : 
                      event.status === 'completed' ? 'bg-green-500 text-white' :
                      event.status === 'delayed' ? 'bg-red-500 text-white' :
                      'bg-gold-100 text-gold-500'
                    }`}>
                      {event.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                       event.status === 'in-progress' ? <Play className="w-4 h-4 fill-white" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                    
                    <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gold-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className={`text-[10px] uppercase font-black tracking-widest ${
                            event.status === 'in-progress' ? 'text-saffron-600' : 
                            event.status === 'delayed' ? 'text-red-500' :
                            'text-gold-400'
                          }`}>
                            {event.startTime}
                          </p>
                          <h4 className="text-lg font-serif text-gold-950">{event.title}</h4>
                        </div>
                        <span className={`text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${
                          event.status === 'in-progress' ? 'bg-saffron-500 text-white' : 
                          event.status === 'completed' ? 'bg-green-50 text-green-600' : 
                          event.status === 'delayed' ? 'bg-red-50 text-red-600' :
                          'bg-gold-50 text-gold-500'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <p className="text-xs text-gold-600 leading-relaxed max-w-md">
                        {event.description}
                      </p>
                      
                      {event.status === 'delayed' && event.delayReason && (
                        <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100 italic">
                          <p className="text-[10px] text-red-600">Reason: {event.delayReason}</p>
                        </div>
                      )}

                      {event.vendorStatus && (
                         <div className="mt-4 pt-4 border-t border-gold-50 flex items-center gap-2">
                            <Briefcase className="w-3 h-3 text-gold-400" />
                            <span className="text-[10px] uppercase font-bold text-gold-500 italic">Vendor Pulse: {event.vendorStatus}</span>
                         </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Sidebar: Intel & Connectivity */}
          <aside className="space-y-8">
            {/* Vendor Monitoring */}
            <div className="luxury-card bg-white p-8">
               <div className="flex items-center gap-3 mb-6">
                 <Briefcase className="w-5 h-5 text-saffron-600" />
                 <h3 className="text-xl font-serif text-gold-950">Vendor Pulse</h3>
               </div>
               <div className="space-y-6">
                 <VendorStatusItem label="Royal Catering" status="Active • Main Course Prep" time="15m ago" />
                 <VendorStatusItem label="Vogue Frames" status="Active • Drone Deployment" time="5m ago" />
                 <VendorStatusItem label="Flora Arch" status="Standby • Varmala Ready" time="1h ago" />
                 <VendorStatusItem label="Palace Logistics" status="Active • Guest Transit" time="On-going" />
               </div>
            </div>

            {/* Guest Connectivity */}
            <div className="luxury-card bg-gold-950 text-white p-8 relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-saffron-500/10 blur-3xl rounded-full" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                   <Users className="w-5 h-5 text-saffron-400" />
                   <h3 className="text-xl font-serif">Guest Broadcast</h3>
                 </div>
                 <p className="text-xs text-gold-200/80 mb-6 leading-relaxed">
                   Currently broadcasting live updates to <span className="font-bold text-white">182 confirmed guests</span> via the royal portal.
                 </p>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
                    <p className="text-[10px] uppercase font-bold text-saffron-400 mb-1">Active Viewers</p>
                    <p className="text-2xl font-serif">42 Souls</p>
                 </div>
                 <button className="w-full flex items-center justify-center gap-2 py-3 bg-saffron-500 text-gold-950 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-saffron-400 transition-all">
                   Manage Channels <ChevronRight className="w-4 h-4" />
                 </button>
               </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Internal Event Modal */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventModalOpen(false)}
              className="absolute inset-0 bg-gold-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-gold-100 p-8"
            >
              <form onSubmit={handleSaveEvent} className="space-y-6">
                <h3 className="text-2xl font-serif text-gold-950">{editingEvent ? 'Modify Event Step' : 'New Timeline Insertion'}</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Title</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Time (e.g., 04:30 PM)</label>
                      <input 
                        required
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm appearance-none"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Description</label>
                    <textarea 
                      rows={2}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-saffron-500 transition-all text-sm"
                    />
                  </div>
                  {formData.status === 'delayed' && (
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-red-500 font-bold block mb-1.5 ml-1">Delay Reason</label>
                      <input 
                        value={formData.delayReason}
                        onChange={e => setFormData({...formData, delayReason: e.target.value})}
                        className="w-full bg-red-50/50 border border-red-100 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm"
                        placeholder="Provide reason for delay..."
                      />
                    </div>
                  )}
                  <div>
                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-gold-50/30 rounded-2xl border border-gold-100">
                        <input 
                          type="checkbox"
                          checked={formData.isPublic}
                          onChange={e => setFormData({...formData, isPublic: e.target.checked})}
                          className="w-4 h-4 rounded border-gold-300 text-saffron-600 focus:ring-saffron-500"
                        />
                        <span className="text-xs font-bold text-gold-950 uppercase tracking-widest">Publically Visible to Guests</span>
                     </label>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="flex-1 py-3 border border-gold-200 rounded-xl text-[10px] uppercase font-bold tracking-widest text-gold-500">Cancel</button>
                  <button type="submit" className="flex-2 py-3 bg-gold-950 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-gold-800 shadow-xl shadow-gold-950/20">Establish Event</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isDelayModalOpen && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDelayModalOpen(false)}
              className="absolute inset-0 bg-gold-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border-2 border-gold-100 p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-serif text-gold-950">Signal Momentary Pause</h3>
                  <p className="text-xs text-gold-400">Inform guests about the delay</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold block mb-1.5 ml-1">Delay Reason</label>
                  <textarea 
                    autoFocus
                    rows={3}
                    value={delayReasonInput}
                    onChange={e => setDelayReasonInput(e.target.value)}
                    className="w-full bg-gold-50/50 border border-gold-100 rounded-xl px-4 py-3 outline-none focus:border-red-500 transition-all text-sm"
                    placeholder="Briefly explain the cause (e.g., Ritual preparation taking longer, Waiting for royal entry...)"
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  onClick={() => setIsDelayModalOpen(false)}
                  className="flex-1 py-3 border border-gold-200 rounded-xl text-[10px] uppercase font-bold tracking-widest text-gold-500"
                >
                  Dismiss
                </button>
                <button 
                  onClick={confirmDelay}
                  className="flex-2 py-3 bg-red-600 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest hover:bg-red-700 shadow-xl shadow-red-950/20"
                >
                  Broadcast Pause
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const VendorStatusItem = ({ label, status, time }: any) => (
  <div className="flex items-center justify-between group">
     <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <div>
           <h4 className="text-sm font-bold text-gold-950 group-hover:text-saffron-600 transition-colors">{label}</h4>
           <p className="text-[10px] text-gold-400 italic">{status}</p>
        </div>
     </div>
     <span className="text-[10px] font-black text-gold-300 uppercase tracking-widest">{time}</span>
  </div>
);
