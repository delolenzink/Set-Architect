import React, { useState } from 'react';
import { Download, Smartphone, Monitor, X, Share, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../pwaManager';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      {/* Top Banner on Mobile/Desktop when installable */}
      {(isInstallable || isIOS) && (
        <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-violet-950/90 border-b border-cyan-800/40 px-4 py-2 text-xs flex items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-cyan-500/20 text-cyan-400">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>Install Set Architect by AfroSenses</strong> — Run standalone on desktop & mobile with zero latency.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isInstallable && (
              <button
                onClick={installApp}
                className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg transition shadow-sm shadow-cyan-500/20 flex items-center gap-1.5"
              >
                <Download className="w-3 h-3 stroke-[2.5]" />
                <span>Install App</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIosGuide(true)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold rounded-lg transition border border-cyan-800/50 flex items-center gap-1.5"
              >
                <Smartphone className="w-3 h-3" />
                <span>iOS Install Guide</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="p-1 text-slate-400 hover:text-slate-200 transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* iOS Install Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-lg font-mono">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To install <strong>Set Architect by AfroSenses</strong> on your iOS device for full-screen DJ performance:
            </p>

            <ol className="space-y-3 text-xs text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">1.</span>
                <span>
                  Tap the <Share className="w-4 h-4 text-cyan-400 inline mx-1" /> <strong>Share</strong> button in Safari's bottom toolbar.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">2.</span>
                <span>
                  Scroll down and tap <PlusSquare className="w-4 h-4 text-cyan-400 inline mx-1" /> <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="font-mono text-cyan-400 font-bold">3.</span>
                <span>Tap <strong>Add</strong> in the top right corner. The DJ App icon will appear on your Home Screen!</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
