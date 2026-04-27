'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    if (standalone) {
      setShowInstallBanner(false);
    } else if (isIOSDevice) {
      // Show iOS specific instructions after a small delay
      const timer = setTimeout(() => setShowInstallBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // We used the prompt, clear it
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  return (
    <AnimatePresence>
      {showInstallBanner && !isStandalone && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[100]"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-100 p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neutral-900 theme-bg rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download className="text-white w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-900">Next Flow Barber App</h4>
                  <p className="text-xs text-neutral-500">Tenha acesso rápido na tela inicial</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInstallBanner(false)}
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <p className="text-[11px] leading-relaxed text-neutral-600 font-medium">
                  Para instalar no seu iPhone: clique no ícone de <span className="font-bold text-neutral-900">Compartilhar</span> (quadrado com seta) e depois em <span className="font-bold text-neutral-900">Adicionar à Tela Inicial</span>.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    deferredPrompt 
                      ? 'bg-neutral-900 theme-bg text-white hover:scale-[1.02] active:scale-[0.98]' 
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {deferredPrompt ? 'Instalar Aplicativo' : 'Verificando...'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
