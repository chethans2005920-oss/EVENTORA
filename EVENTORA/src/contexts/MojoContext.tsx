import React, { createContext, useContext, useState, useEffect } from 'react';

interface MojoContextType {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

const MojoContext = createContext<MojoContextType>({
  isMuted: false,
  setIsMuted: () => {},
  toggleMute: () => {},
});

export const MojoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('mojo_muted');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('mojo_muted', String(isMuted));
  }, [isMuted]);

  const toggleMute = () => {
    setIsMuted(prev => {
      if (!prev) window.speechSynthesis.cancel();
      return !prev;
    });
  };

  return (
    <MojoContext.Provider value={{ isMuted, setIsMuted, toggleMute }}>
      {children}
    </MojoContext.Provider>
  );
};

export const useMojo = () => useContext(MojoContext);
