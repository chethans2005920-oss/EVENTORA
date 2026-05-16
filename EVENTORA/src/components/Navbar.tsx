import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWedding } from '../contexts/WeddingContext';
import { loginWithGoogle, logout } from '../lib/firebase';
import { Heart, LogOut, User as UserIcon, LayoutDashboard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const { weddings, currentWedding, setCurrentWedding } = useWedding();
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/80 backdrop-blur-xl border border-gold-500/10 rounded-full px-8 py-3 shadow-sm shadow-gold-500/5">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="bg-gold-950 p-2 rounded-lg transition-transform group-hover:scale-110">
            <Heart className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight gold-gradient-text uppercase">
            EVENTORA
          </span>
        </div>

        <div className="flex items-center gap-8">
          <div className="hidden lg:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-display font-bold text-gold-600">
            {user && weddings.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsPortfolioOpen(!isPortfolioOpen)}
                  className="flex items-center gap-2 hover:text-gold-950 transition-colors"
                >
                  My Portfolios <ChevronDown className={`w-3 h-3 transition-transform ${isPortfolioOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isPortfolioOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-4 w-64 bg-white border border-gold-100 shadow-2xl rounded-2xl p-2 z-50"
                    >
                      {weddings.map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setCurrentWedding(w);
                            setIsPortfolioOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${currentWedding?.id === w.id ? 'bg-saffron-50' : 'hover:bg-gold-50'}`}
                        >
                          <div>
                            <p className="text-sm font-bold text-gold-950">{w.name}</p>
                            <p className="text-[9px] uppercase tracking-tighter text-gold-400 font-bold">{w.location}</p>
                          </div>
                        </button>
                      ))}
                      <div className="border-t border-gold-100 mt-2 pt-2">
                         <button 
                           onClick={() => {
                             window.dispatchEvent(new CustomEvent('start-new-setup'));
                             setIsPortfolioOpen(false);
                           }}
                           className="w-full flex items-center gap-2 p-3 text-saffron-600 hover:bg-saffron-50 rounded-xl transition-all font-bold text-xs"
                         >
                           + New Portfolio
                         </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <a href="#about" className="hover:text-gold-950 transition-colors">Philosophy</a>
            <a href="#about" className="hover:text-gold-950 transition-colors">Experience</a>
            <button 
              onClick={() => alert("Our Heritage Tradition Gallery is currently being curated.")}
              className="hover:text-gold-950 transition-colors"
            >
              Traditions
            </button>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <div className="flex items-center gap-3 pl-8 border-l border-gold-500/10">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-gold-950">{user.displayName}</p>
                    <p className="text-[10px] text-gold-500 uppercase tracking-widest font-bold">Royal Client</p>
                  </div>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border-2 border-gold-200 shadow-sm" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gold-50 flex items-center justify-center border-2 border-gold-200">
                      <UserIcon className="w-4 h-4 text-gold-400" />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => logout()}
                  className="text-gold-400 hover:text-crimson-600 transition-all hover:scale-110 active:scale-95"
                  title="Secure Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="gold-button py-2.5 text-sm px-10 shadow-lg shadow-gold-500/10 hover:shadow-gold-500/20"
              >
                Access Portal
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
