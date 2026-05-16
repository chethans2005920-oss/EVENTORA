import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Bot, Users, MapPin, Shield, Star, DollarSign, Calendar, Clock, Globe } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <section id="about" className="relative py-32 px-6 bg-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full indian-pattern opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-saffron-500/5 blur-[120px] rounded-full" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gold-500/5 blur-[120px] rounded-full" />

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Photos Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-2">
                  <img 
                    src="https://images.unsplash.com/photo-1594132174021-3965b3997db8?auto=format&fit=crop&q=80&w=800" 
                    alt="Wedding Planner Team" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-3">
                  <img 
                    src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800" 
                    alt="Exquisite Decor" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="pt-12 space-y-4">
                <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2">
                  <img 
                    src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=800" 
                    alt="Royal Ceremony" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform -rotate-3">
                  <img 
                    src="https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&q=80&w=800" 
                    alt="The Magic of Planning" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Float badge */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gold-950 p-8 rounded-full border-8 border-white shadow-2xl z-10 text-center flex flex-col items-center justify-center animate-pulse">
               <Heart className="w-8 h-8 text-saffron-500 mb-2" fill="currentColor" />
               <p className="text-white text-[10px] uppercase tracking-[0.4em] font-black leading-tight">Mojo<br/>Certified</p>
            </div>
          </motion.div>

          {/* Details Side */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="space-y-10"
          >
            <div className="space-y-4">
               <span className="text-xs uppercase tracking-[0.3em] font-black text-saffron-600">The Eventora Vision</span>
               <h2 className="text-5xl font-serif text-gold-950 leading-tight">Architecting Heritage with <span className="italic">Intelligent Luxury</span></h2>
               <p className="text-lg text-gold-700/80 font-serif leading-relaxed italic">
                 "We don't just plan weddings; we orchestrate sacred unions that bridge the gap between ancient Indian traditions and futuristic technological precision."
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
              <div className="space-y-3">
                 <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center text-gold-950 border border-gold-100">
                    <Users className="w-5 h-5" />
                 </div>
                 <h4 className="text-sm font-serif font-bold text-gold-950 uppercase tracking-widest">Global Expertise</h4>
                 <p className="text-xs text-gold-600 leading-relaxed">Our elite team has roots across the world's most luxurious destinations, from the palaces of Rajasthan to the lagoons of Kerala.</p>
              </div>
              <div className="space-y-3">
                 <div className="w-10 h-10 rounded-xl bg-saffron-50 flex items-center justify-center text-saffron-600 border border-saffron-100">
                    <Bot className="w-5 h-5" />
                 </div>
                 <h4 className="text-sm font-serif font-bold text-gold-950 uppercase tracking-widest">AI Mojo Integration</h4>
                 <p className="text-xs text-gold-600 leading-relaxed">We leverage proprietary AI 'Mojo' to ensure every logistics detail is theoretically perfect before the first marigold is hung.</p>
              </div>
            </div>

            <div className="pt-10 border-t border-gold-500/10">
               <h3 className="text-2xl font-serif text-gold-950 mb-8">Our Signature Services</h3>
               <div className="space-y-6">
                  <ServiceItem 
                    icon={<DollarSign className="w-4 h-4 text-saffron-600" />}
                    title="Financial Architecture"
                    description="Comprehensive budget planning including tax optimization, vendor escrow management, and real-time payment tracking for destination logistics."
                  />
                  <ServiceItem 
                    icon={<Shield className="w-4 h-4 text-saffron-600" />}
                    title="Elite Vendor Nexus"
                    description="Whitelisted access to global Michelin-starred catering, celebrity designers, and exclusive venue rentals not available on the open market."
                  />
                  <ServiceItem 
                    icon={<Clock className="w-4 h-4 text-saffron-600" />}
                    title="Live Event Horizon"
                    description="Wait-time-free execution with second-by-second choreography of rituals, arrivals, and entertainment via our proprietary Live Dashboard."
                  />
                  <ServiceItem 
                    icon={<Star className="w-4 h-4 text-saffron-600" />}
                    title="Heritage Concierge"
                    description="Deep-dive ritual support for Hindu, Sikh, Muslim, and Catholic traditions, ensuring cultural authenticity with modern luxury standards."
                  />
                  <ServiceItem 
                    icon={<Globe className="w-4 h-4 text-saffron-600" />}
                    title="Global Guest Logistics"
                    description="White-glove arrival management, private aviation coordination, and dedicated concierge pods for every guest cluster."
                  />
                  <ServiceItem 
                    icon={<Shield className="w-4 h-4 text-saffron-600" />}
                    title="Privacy Guard"
                    description="Total NDAs for all staff, encrypted digital assets, and physical security parameters for high-profile sacred unions."
                  />
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ServiceItem = ({ icon, title, description }: any) => (
  <div className="flex gap-6 group hover:translate-x-2 transition-transform duration-300">
    <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-100 flex items-center justify-center shrink-0 group-hover:bg-saffron-50 group-hover:border-saffron-200 transition-colors">
      {icon}
    </div>
    <div className="space-y-1">
      <h5 className="text-sm font-bold text-gold-950 uppercase tracking-widest">{title}</h5>
      <p className="text-xs text-gold-500 leading-relaxed">{description}</p>
    </div>
  </div>
);
