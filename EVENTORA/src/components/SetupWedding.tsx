import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Calendar, MapPin, DollarSign, ArrowRight, Star, Shield, CheckCircle2 } from 'lucide-react';

export const SetupWedding: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentWedding } = useWedding();
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    budget: '5000000',
  });
  const [bankingData, setBankingData] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    swiftCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const budgetTiers = [
    { label: 'Regal', value: '2500000', description: 'Splendid & Grand' },
    { label: 'Imperial', value: '7500000', description: 'Elite & Majestic' },
    { label: 'Maharaja', value: '25000000', description: 'Supreme Sovereignty' },
  ];

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const validateBanking = () => {
    const newErrors: Record<string, string> = {};
    
    if (!bankingData.accountName || bankingData.accountName.length < 2) {
      newErrors.accountName = 'Account name must be at least 2 characters';
    }
    
    if (!bankingData.accountNumber || !/^\d{9,18}$/.test(bankingData.accountNumber)) {
      newErrors.accountNumber = 'Account number must be between 9 and 18 digits';
    }
    
    if (!bankingData.bankName || bankingData.bankName.length < 2) {
      newErrors.bankName = 'Bank name must be at least 2 characters';
    }
    
    if (!bankingData.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankingData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g., ABCD0123456)';
    }

    if (bankingData.swiftCode && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(bankingData.swiftCode)) {
      newErrors.swiftCode = 'Invalid SWIFT code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }

    if (!validateBanking()) return;

    setLoading(true);
    const path = 'weddings';
    try {
      const weddingPayload = {
        name: formData.name,
        date: formData.date,
        location: formData.location,
        budgetTotal: parseFloat(formData.budget),
        budgetSpent: 0,
        status: 'planning',
        ownerIds: [user.uid],
        plannerIds: [],
        bankingProfile: bankingData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, path), weddingPayload);
      
      const newWedding = {
        id: docRef.id,
        name: formData.name,
        date: formData.date,
        location: formData.location,
        budgetTotal: parseFloat(formData.budget),
        budgetSpent: 0,
        status: 'planning' as const,
        ownerIds: [user.uid],
        plannerIds: [],
        bankingProfile: bankingData,
      };

      setIsSuccess(true);
      
      // Delay transition to show success state
      setTimeout(() => {
        setCurrentWedding(newWedding);
        window.dispatchEvent(new CustomEvent('wedding-created'));
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 luxury-card max-w-md w-full bg-ivory"
          >
            <div className="w-20 h-20 rounded-full bg-saffron-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-saffron-600" />
            </div>
            <h2 className="text-3xl font-serif text-gold-950 mb-3">Portfolio Secured</h2>
            <p className="text-gold-600 text-sm mb-6 leading-relaxed">
              Your royal portfolio for <span className="font-bold text-gold-950">{formData.name}</span> has been synchronized with our elite concierge network.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-saffron-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] uppercase font-black text-saffron-600 tracking-widest ml-2">Arriving at your Blueprint</span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl w-full luxury-card p-12 shadow-2xl border-gold-100"
          >
        <div className="text-center mb-10">
          <Sparkles className="w-10 h-10 text-saffron-500 mx-auto mb-4" />
          <h2 className="text-4xl font-serif text-gold-950 mb-2 tracking-tight">Royal Wedding Genesis</h2>
          <p className="text-gold-600 font-serif">
            {currentStep === 1 
              ? 'Commence the curation of your extraordinary legacy with our elite intelligence network.' 
              : 'Secure your royal treasury for elite vendor settlements and digital escrow.'}
          </p>
          
          <div className="flex justify-center items-center gap-4 mt-8">
            <div className={`flex items-center gap-2 ${currentStep === 1 ? 'text-saffron-600' : 'text-gold-400'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${currentStep === 1 ? 'border-saffron-600 bg-saffron-50' : 'border-gold-200'}`}>1</div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Genesis</span>
            </div>
            <div className="w-8 h-px bg-gold-200" />
            <div className={`flex items-center gap-2 ${currentStep === 2 ? 'text-saffron-600' : 'text-gold-400'}`}>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-black ${currentStep === 2 ? 'border-saffron-600 bg-saffron-50' : 'border-gold-200'}`}>2</div>
              <span className="text-[10px] uppercase tracking-widest font-bold">Treasury</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {currentStep === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Celebration Name</label>
                <div className="relative">
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. The Royal Jaipur Gala"
                    className="w-full bg-gold-50 border border-gold-200 focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Event Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-saffron-600" />
                  <input 
                    required
                    type="date"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gold-50 border border-gold-200 focus:border-saffron-500/50 outline-none rounded-xl py-3 pl-12 pr-4 text-gold-950 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Destination Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-saffron-600" />
                  <input 
                    required
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Udaipur, Rajasthan"
                    className="w-full bg-gold-50 border border-gold-200 focus:border-saffron-500/50 outline-none rounded-xl py-3 pl-12 pr-4 text-gold-950 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-12 md:col-span-2">
                <div className="text-center">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gold-500 font-bold mb-4 block">Luxury Budget Sculptor</label>
                  <div className="inline-flex flex-col items-center">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-serif text-gold-950 font-black">₹{(parseInt(formData.budget) / 100000).toFixed(0)}</span>
                      <span className="text-xl font-serif text-saffron-600 font-bold uppercase tracking-widest">Lakh</span>
                    </div>
                    <p className="text-[10px] text-gold-400 mt-2 font-serif italic">Total Corpus Allocated</p>
                  </div>
                </div>

                <div className="relative pt-10 pb-4 px-4 bg-gold-50/30 rounded-[2.5rem] border border-gold-100">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gold-100 rounded-full" />
                  
                  <div className="flex justify-between relative h-12">
                     {[
                       { label: 'Royal', value: 1000000 },
                       { label: 'Heritage', value: 5000000 },
                       { label: 'Imperial', value: 10000000 },
                       { label: 'Maharaja', value: 25000000 },
                       { label: 'Sovereign', value: 50000000 }
                     ].map((marker) => (
                       <div key={marker.label} className="flex flex-col items-center">
                          <div className={`w-1 h-3 rounded-full mb-2 ${parseInt(formData.budget) >= marker.value ? 'bg-saffron-500' : 'bg-gold-200'}`} />
                          <span className={`text-[8px] uppercase tracking-tighter font-bold transition-colors ${parseInt(formData.budget) >= marker.value ? 'text-saffron-600' : 'text-gold-300'}`}>
                            {marker.label}
                          </span>
                       </div>
                     ))}
                  </div>

                  <input 
                    type="range"
                    min="500000"
                    max="50000000"
                    step="100000"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                    className="absolute top-[-1px] left-0 w-full h-1.5 appearance-none bg-transparent cursor-pointer accent-saffron-600 hover:accent-saffron-500 transition-all z-20"
                  />
                  
                  <div 
                    className="absolute top-[-1px] left-0 h-1 bg-saffron-500 rounded-full transition-all pointer-events-none"
                    style={{ width: `${((parseInt(formData.budget) - 500000) / (50000000 - 500000)) * 100}%` }}
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500 font-black text-center mb-4">Strategic Resource Allocation</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Royal Venue', icon: <MapPin className="w-3 h-3" />, percentage: 0.20, color: 'bg-gold-50 text-gold-600' },
                      { label: 'Exquisite Catering', icon: <DollarSign className="w-3 h-3" />, percentage: 0.30, color: 'bg-saffron-50 text-saffron-600' },
                      { label: 'Elite Decor', icon: <Sparkles className="w-3 h-3" />, percentage: 0.15, color: 'bg-amber-50 text-amber-600' },
                      { label: 'Vogue Framing', icon: <Star className="w-3 h-3" />, percentage: 0.10, color: 'bg-gold-50 text-gold-600' },
                      { label: 'Concierge Logic', icon: <Shield className="w-3 h-3" />, percentage: 0.15, color: 'bg-saffron-50 text-saffron-600' },
                      { label: 'Royal Attire', icon: <CheckCircle2 className="w-3 h-3" />, percentage: 0.10, color: 'bg-amber-50 text-amber-600' },
                    ].map((cat) => (
                      <motion.div 
                        key={cat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-white rounded-xl border border-gold-100 flex flex-col gap-2 hover:border-saffron-500/30 transition-all shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                           <div className={`p-1.5 rounded-lg ${cat.color}`}>
                             {cat.icon}
                           </div>
                           <span className="text-[8px] font-black text-gold-300">{(cat.percentage * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-bold text-gold-400 truncate">{cat.label}</p>
                          <p className="text-xs font-serif font-bold text-gold-950">₹{(parseInt(formData.budget) * cat.percentage / 100000).toFixed(1)} Lakh</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Account Holder Name</label>
                  <input 
                    required
                    value={bankingData.accountName}
                    onChange={e => setBankingData({...bankingData, accountName: e.target.value})}
                    placeholder="e.g. Maharani Ananya Singh"
                    className={`w-full bg-gold-50 border ${errors.accountName ? 'border-red-400' : 'border-gold-200'} focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all`}
                  />
                  {errors.accountName && <p className="text-[10px] text-red-500 ml-1">{errors.accountName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Bank Name</label>
                    <input 
                      required
                      value={bankingData.bankName}
                      onChange={e => setBankingData({...bankingData, bankName: e.target.value})}
                      placeholder="e.g. Royal Bank of India"
                      className={`w-full bg-gold-50 border ${errors.bankName ? 'border-red-400' : 'border-gold-200'} focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all`}
                    />
                    {errors.bankName && <p className="text-[10px] text-red-500 ml-1">{errors.bankName}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">Account Number</label>
                    <input 
                      required
                      type="password"
                      value={bankingData.accountNumber}
                      onChange={e => setBankingData({...bankingData, accountNumber: e.target.value})}
                      placeholder="••••••••••••"
                      className={`w-full bg-gold-50 border ${errors.accountNumber ? 'border-red-400' : 'border-gold-200'} focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all`}
                    />
                    {errors.accountNumber && <p className="text-[10px] text-red-500 ml-1">{errors.accountNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">IFSC Code</label>
                    <input 
                      required
                      value={bankingData.ifscCode}
                      onChange={e => setBankingData({...bankingData, ifscCode: e.target.value.toUpperCase()})}
                      placeholder="e.g. SBIN0001234"
                      className={`w-full bg-gold-50 border ${errors.ifscCode ? 'border-red-400' : 'border-gold-200'} focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all uppercase`}
                    />
                    {errors.ifscCode && <p className="text-[10px] text-red-500 ml-1">{errors.ifscCode}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-gold-500 font-bold ml-1">SWIFT Code (Optional)</label>
                    <input 
                      value={bankingData.swiftCode}
                      onChange={e => setBankingData({...bankingData, swiftCode: e.target.value.toUpperCase()})}
                      placeholder="e.g. RBININBB"
                      className={`w-full bg-gold-50 border ${errors.swiftCode ? 'border-red-400' : 'border-gold-200'} focus:border-saffron-500/50 outline-none rounded-xl py-3 px-4 text-gold-950 transition-all uppercase`}
                    />
                    {errors.swiftCode && <p className="text-[10px] text-red-500 ml-1">{errors.swiftCode}</p>}
                  </div>
                </div>
              </div>

              <div className="bg-gold-50/50 p-6 rounded-[2rem] border border-gold-100 flex items-start gap-4">
                <Shield className="w-5 h-5 text-saffron-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-gold-600 leading-relaxed italic">
                  Your wealth credentials will be secured in our **Sovereign Encryption Vault**. These details are essential for authorized vendor settlements and escrow protocols.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            {currentStep === 2 && (
              <button 
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-4 border-2 border-gold-950 text-gold-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold-50 transition-all"
              >
                Back to Genesis
              </button>
            )}
            <button 
              type="submit"
              disabled={loading}
              className={`${currentStep === 1 ? 'w-full' : 'flex-[2]'} gold-button flex items-center justify-center gap-3 disabled:opacity-50`}
            >
              {loading ? 'Commencing Rituals...' : (
                <>
                  {currentStep === 1 ? 'Configure Treasury' : 'Seal Portfolio & Secure Treasury'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
