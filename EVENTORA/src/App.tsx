import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WeddingProvider, useWedding } from './contexts/WeddingContext';
import { MojoProvider } from './contexts/MojoContext';
import { Navbar } from './components/Navbar';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { SetupWedding } from './components/SetupWedding';
import { Concierge } from './components/Concierge';
import { ArrowRight } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { weddings, loading: weddingLoading } = useWedding();
  const [showSetup, setShowSetup] = React.useState(false);

  React.useEffect(() => {
    const handleStartSetup = () => setShowSetup(true);
    const handleWeddingCreated = () => setShowSetup(false);
    window.addEventListener('start-new-setup', handleStartSetup);
    window.addEventListener('wedding-created', handleWeddingCreated);
    return () => {
      window.removeEventListener('start-new-setup', handleStartSetup);
      window.removeEventListener('wedding-created', handleWeddingCreated);
    };
  }, []);

  // Reset showSetup when a new wedding is added and selected
  React.useEffect(() => {
    if (weddings.length > 0) {
      setShowSetup(false);
    }
  }, [weddings.length]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-gold-200 border-t-saffron-500 animate-spin mb-4" />
        <p className="font-serif text-gold-600 animate-pulse tracking-widest text-xs uppercase">Initializing Eventora Experience</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <Landing />
      </div>
    );
  }

  // Logged in but no weddings yet OR explicitly showing setup
  if ((!weddingLoading && weddings.length === 0) || showSetup) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="pt-20">
          {showSetup && weddings.length > 0 && (
            <div className="max-w-7xl mx-auto px-6 mt-8">
              <button 
                onClick={() => setShowSetup(false)}
                className="flex items-center gap-2 text-gold-500 hover:text-saffron-600 transition-colors uppercase tracking-widest text-[10px] font-bold"
              >
                <div className="w-6 h-6 rounded-full border border-gold-200 flex items-center justify-center group-hover:border-saffron-500">
                   <ArrowRight className="w-3 h-3 rotate-180" />
                </div>
                Return to Dashboard
              </button>
            </div>
          )}
          <SetupWedding />
        </div>
      </div>
    );
  }

  // Main App State
  return (
    <div className="min-h-screen bg-white pb-20">
      <Navbar />
      <div className="pt-24 opacity-0 animate-[fadeIn_1s_ease-in_forwards]">
        <Dashboard />
      </div>
      <Concierge />
    </div>
  );
};

// Global fade animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

function App() {
  return (
    <AuthProvider>
      <WeddingProvider>
        <MojoProvider>
          <AppContent />
        </MojoProvider>
      </WeddingProvider>
    </AuthProvider>
  );
}

export default App;
