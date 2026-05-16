import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, Shield, Map, Clock, Star, ArrowRight, Moon, Sun, Heart, Volume2, VolumeX, Bot, X, Calendar, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loginWithGoogle } from '../lib/firebase';
import { useMojo } from '../contexts/MojoContext';
import { AboutUs } from './AboutUs';

export const Landing: React.FC = () => {
  const portfolioRef = useRef<HTMLDivElement>(null);
  const [showGreeting, setShowGreeting] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { isMuted, toggleMute } = useMojo();
  const greetingText = "Namaste! Welcome to Eventora. I am Mojo. I am here to help you architect your sacred union with royal perfection. Would you like to start planning your dream wedding today?";

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreeting(true);
      if (!isMuted) speakGreeting();
    }, 1500);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakGreeting = () => {
    if ('speechSynthesis' in window && !isMuted) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(greetingText);
      
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('google') || 
           v.name.toLowerCase().includes('samantha') || 
           v.name.toLowerCase().includes('victoria')) && 
          v.lang.startsWith('en')
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        
        utterance.rate = 0.7; // Even more measured and calm
        utterance.pitch = 1.45; // Even sweeter and gentler
        utterance.volume = 0.45; // Softer, more intimate tone
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }
    }
  };

  const scrollToPortfolio = () => {
    portfolioRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-ivory overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute top-0 left-0 w-full h-[80vh] z-0 overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2000" 
          alt="Royal Wedding Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ivory/20 via-ivory/80 to-ivory" />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory/90 via-ivory/40 to-transparent" />
      </div>

      {/* Subtle Pattern Background */}
      <div className="absolute inset-0 indian-pattern z-0 opacity-30" />
      
      {/* Decorative Ornaments */}
      <div className="absolute top-20 right-[5%] w-96 h-96 rounded-full bg-saffron-500/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-20 left-[5%] w-80 h-80 rounded-full bg-crimson-500/5 blur-[80px] pointer-events-none" />

      {/* AI Greeting Popup (Receptionist Style) */}
      <AnimatePresence>
        {showGreeting && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="fixed top-24 right-8 z-50 max-w-sm"
          >
            <div className="bg-white p-6 rounded-3xl shadow-2xl border border-saffron-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-saffron-500" />
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-saffron-100 flex items-center justify-center border border-saffron-200">
                  <Bot className="w-6 h-6 text-saffron-600" />
                </div>
                <div>
                  <h4 className="font-serif text-gold-950 font-bold">Mojo Reception</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-widest text-gold-500 font-bold">Live Greet</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGreeting(false)}
                  className="ml-auto text-gold-300 hover:text-gold-500"
                >
                  <ArrowRight className="w-4 h-4 rotate-45" />
                </button>
              </div>
              <p className="text-sm text-gold-800 leading-relaxed italic mb-4 font-serif">
                "{greetingText}"
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => loginWithGoogle()}
                  className="flex-1 bg-gold-950 text-white text-[10px] py-2 rounded-full uppercase tracking-widest font-bold hover:bg-gold-800 transition-colors"
                >
                  Yes, Start Now
                </button>
                <button 
                  onClick={toggleMute}
                  className="p-2 rounded-full border border-gold-200 text-gold-500 hover:bg-gold-50 transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={speakGreeting}
                  disabled={isMuted}
                  className="p-2 rounded-full border border-gold-200 text-gold-500 hover:bg-gold-50 transition-colors disabled:opacity-50"
                  title="Replay Voice"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div id="hero" className="relative pt-32 pb-24 px-6 z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
             initial={{ opacity: 0, x: -30 }}
             whileInView={{ opacity: 1, x: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 1 }}
             className="space-y-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-saffron-500/20 bg-saffron-500/5 text-saffron-600 text-[10px] font-display font-bold uppercase tracking-[0.3em] mandala-glow">
              <Sparkles className="w-3 h-3" />
              Celebrating Every Tradition & Religion
            </div>
            <h1 className="text-6xl md:text-7xl font-serif text-gold-950 leading-[1.1] tracking-tighter max-w-2xl">
              Every Love Story Deserves a <span className="italic font-light gold-gradient-text">Beautiful</span> Beginning.
            </h1>
            <p className="text-xl text-gold-700/80 font-serif max-w-xl leading-relaxed font-light">
              EVENTORA orchestrates the opulence of Indian heritage with the precision of elite AI, crafting royal experiences that transcend time.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button 
                onClick={() => loginWithGoogle()}
                className="gold-button px-10 py-4 text-sm group shadow-2xl shadow-gold-500/20"
              >
                Start Royal Planning
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={scrollToPortfolio}
                className="luxury-card py-4 px-10 text-[10px] uppercase tracking-[0.3em] font-display font-bold text-gold-600 hover:bg-gold-50 transition-all border border-gold-200"
              >
                Explore Gallery
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-12 border-t border-gold-500/10">
              <Feature icon={<Shield className="w-5 h-5 text-saffron-600" />} label="Inclusive" value="All Cultures & Faiths" />
              <Feature icon={<Star className="w-5 h-5 text-saffron-600" />} label="Service" value="24/7 AI Mojo" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-gold-500/20">
              <img 
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200" 
                alt="Luxury Indian Wedding" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gold-950/40 to-transparent" />
              <div className="absolute bottom-8 left-8">
                <p className="text-white text-xs uppercase tracking-widest font-bold mb-1 opacity-80">Heritage Collection</p>
                <h3 className="text-2xl font-serif text-white">The Royal Mandap</h3>
              </div>
            </div>
            
            {/* Floating Element */}
            <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
               className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-gold-500/10 max-w-[200px]"
            >
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-5 h-5 text-crimson-500" fill="currentColor" />
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-gold-500">New Insight</span>
              </div>
              <p className="text-[11px] text-gold-800 leading-relaxed italic">"Optimal floral patterns for Jaipur palace weddings in November."</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <section id="about">
        <AboutUs />
      </section>

      {/* Explore / Portfolio Section */}
      <section id="portfolio" ref={portfolioRef} className="relative py-32 px-6 z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-serif text-platinum-100">Masterpieces</h2>
              <p className="text-xl text-platinum-500 font-serif font-light max-w-xl italic">A curated selection of our most exquisite architectural celebrations across the globe.</p>
            </div>
            <div className="h-[1px] flex-1 bg-platinum-800/30 mx-12 hidden md:block" />
            <button 
              onClick={() => alert("The full heritage archive is being digitized. Please check back shortly.")}
              className="text-[10px] uppercase tracking-[0.3em] font-display font-bold text-gold-400 border-b border-gold-500/30 pb-2 hover:text-gold-300 hover:border-gold-300 transition-all"
            >
              View Archive
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PortfolioCard 
              image="https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=1000" 
              title="The Udaipur Gala" 
              location="Udaipur, Rajasthan"
              category="Royal Heritage"
              description="A majestic 3-day celebration at the City Palace, featuring a royal boat procession, 50,000 marigolds, and a curated menu of Mewari delicacies."
              guests="450 Guests"
              rituals="Sangeet, Mehendi, Royal Baraat"
              delay={0.1}
              onClick={() => setSelectedProject({
                image: "https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&q=80&w=1000",
                title: "The Udaipur Gala",
                location: "Udaipur, Rajasthan",
                category: "Royal Heritage",
                description: "A majestic 3-day celebration at the City Palace, featuring a royal boat procession, 50,000 marigolds, and a curated menu of Mewari delicacies.",
                guests: "450 Guests",
                rituals: ["Ganesh Vandana", "Royal Boat Entry", "Marigold Shower", "Sitar Ensemble"]
              })}
            />
            <PortfolioCard 
              image="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000" 
              title="Lotus Mandap" 
              location="Kerala, India"
              category="Tropical Elegance"
              description="An ethereal backwater union set against palm-fringed lagoons, with a floating lotus-themed mandap and traditional Kathakali performances."
              guests="200 Guests"
              rituals="Kumbha Vivah, Sadya Feast"
              delay={0.2}
              onClick={() => setSelectedProject({
                image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1000",
                title: "Lotus Mandap",
                location: "Kerala, India",
                category: "Tropical Elegance",
                description: "An ethereal backwater union set against palm-fringed lagoons, with a floating lotus-themed mandap and traditional Kathakali performances.",
                guests: "200 Guests",
                rituals: ["Backwater Boat Entry", "Traditional Sadya", "Mohiniyattam Performance", "Lotus Garland Ceremony"]
              })}
            />
            <PortfolioCard 
              image="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000" 
              title="Golden Temple Vibes" 
              location="Punjab, India"
              category="Spiritual Splendor"
              description="A deeply spiritual Anand Karaj ceremony in the heart of Amritsar, emphasizing community, devotion, and understated luxury."
              guests="800 Guests"
              rituals="Anand Karaj, Ladoos & Langar"
              delay={0.3}
              onClick={() => setSelectedProject({
                image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000",
                title: "Golden Temple Vibes",
                location: "Punjab, India",
                category: "Spiritual Splendor",
                description: "A deeply spiritual Anand Karaj ceremony in the heart of Amritsar, emphasizing community, devotion, and understated luxury.",
                guests: "800 Guests",
                rituals: ["Anand Karaj", "Seva Rituals", "Gurbani Kirtan", "Phulkari Decor"]
              })}
            />
          </div>
        </div>
      </section>

      {/* Legacy/Portfolio Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-gold-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
            >
              <div className="w-full md:w-1/2 h-64 md:h-auto relative">
                <img src={selectedProject.image} alt={selectedProject.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-gold-950/60 to-transparent md:hidden" />
              </div>
              <div className="flex-1 p-8 md:p-12 overflow-y-auto space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-saffron-600 font-bold mb-2 block">{selectedProject.category}</span>
                    <h2 className="text-4xl md:text-5xl font-serif text-gold-950">{selectedProject.title}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedProject(null)}
                    className="p-2 rounded-full hover:bg-gold-50 transition-colors"
                  >
                    <X className="w-6 h-6 text-gold-400" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-6 border-y border-gold-500/10 py-6">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-saffron-500" />
                    <span className="text-xs uppercase tracking-widest font-bold text-gold-700">{selectedProject.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-saffron-500" />
                    <span className="text-xs uppercase tracking-widest font-bold text-gold-700">{selectedProject.guests}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-gold-400">The Story</h4>
                  <p className="text-lg font-serif text-gold-900 leading-relaxed italic">{selectedProject.description}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-display font-bold uppercase tracking-[0.2em] text-gold-400">Sacred Rituals</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProject.rituals.map((ritual: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-saffron-50 border border-saffron-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-saffron-500" />
                        <span className="text-sm font-medium text-gold-900">{ritual}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => {
                      setSelectedProject(null);
                      loginWithGoogle();
                    }}
                    className="gold-button w-full"
                  >
                    Start Planning Similar Experience
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Details */}
      <footer className="relative py-20 px-6 z-20 border-t border-gold-500/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left space-y-4">
             <h3 className="text-3xl font-serif gold-gradient-text">EVENTORA</h3>
             <p className="text-xs text-gold-700 uppercase tracking-widest">Architecting Moments Since 2026</p>
          </div>
          <div className="flex gap-12 text-[10px] uppercase tracking-[0.3em] font-display font-medium text-gold-800">
             <a href="#portfolio" className="hover:text-saffron-600 transition-colors">Strategic Portfolio</a>
             <a href="#about" className="hover:text-saffron-600 transition-colors">Our Philosophy</a>
             <a href="#hero" className="hover:text-saffron-600 transition-colors">Begin Planning</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const Feature = ({ icon, label, value }: any) => (
  <div className="space-y-1 text-center md:text-left">
    <div className="flex flex-col md:flex-row items-center md:items-start gap-2 mb-2">
      <div className="p-2 rounded-full bg-saffron-500/5 border border-saffron-500/10 mb-2 md:mb-0">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gold-500 font-bold mb-1">{label}</span>
        <p className="text-sm font-serif text-gold-950 font-medium">{value}</p>
      </div>
    </div>
  </div>
);

const PortfolioCard = ({ image, title, location, category, delay, onClick }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.8 }}
    onClick={onClick}
    className="group cursor-pointer"
  >
    <div className="relative overflow-hidden rounded-[2rem] aspect-[3/4] mb-6 shadow-lg">
      <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-gold-950/60 via-transparent to-transparent opacity-60" />
      <div className="absolute bottom-8 left-8 right-8 space-y-2">
        <span className="text-[10px] uppercase tracking-widest text-saffron-400 font-bold">{category}</span>
        <h3 className="text-3xl font-serif text-white">{title}</h3>
      </div>
    </div>
    <div className="flex items-center gap-2 text-gold-700">
      <Map className="w-4 h-4 text-saffron-500" />
      <span className="text-xs uppercase tracking-widest font-medium">{location}</span>
    </div>
  </motion.div>
);
