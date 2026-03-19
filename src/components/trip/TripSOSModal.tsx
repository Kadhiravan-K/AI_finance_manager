import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';

const modalRoot = document.getElementById('modal-root')!;

interface TripSOSModalProps {
    onClose: () => void;
}

const TripSOSModal: React.FC<TripSOSModalProps> = ({ onClose }) => {
    const [isSirenOn, setIsSirenOn] = useState(false);
    const [isFlashOn, setIsFlashOn] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    
    // Audio Context for Siren
    const audioCtxRef = useRef<AudioContext | null>(null);
    const oscRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const intervalRef = useRef<number | null>(null);
    const flashIntervalRef = useRef<number | null>(null);

    // Siren Logic
    useEffect(() => {
        if (isSirenOn) {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.value = 500;
            gain.gain.value = 1;
            
            osc.start();
            oscRef.current = osc;
            gainRef.current = gain;

            // Modulate frequency for siren effect
            let increasing = true;
            intervalRef.current = window.setInterval(() => {
                if (!oscRef.current) return;
                const freq = oscRef.current.frequency.value;
                if (increasing) {
                    if (freq < 1200) oscRef.current.frequency.setValueAtTime(freq + 50, ctx.currentTime);
                    else increasing = false;
                } else {
                    if (freq > 500) oscRef.current.frequency.setValueAtTime(freq - 50, ctx.currentTime);
                    else increasing = true;
                }
            }, 50);

        } else {
            if (oscRef.current) {
                oscRef.current.stop();
                oscRef.current.disconnect();
                oscRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
             if (oscRef.current) {
                oscRef.current.stop();
                oscRef.current.disconnect();
             }
             if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSirenOn]);

    // Flash Logic (Screen Strobe)
    useEffect(() => {
        if (isFlashOn) {
            const appContainer = document.querySelector('.app-container') as HTMLElement;
            flashIntervalRef.current = window.setInterval(() => {
                if (document.body.style.backgroundColor === 'white') {
                    document.body.style.backgroundColor = '#ff0000'; // Red
                } else {
                    document.body.style.backgroundColor = 'white';
                }
            }, 200);
        } else {
            if (flashIntervalRef.current) {
                clearInterval(flashIntervalRef.current);
                flashIntervalRef.current = null;
            }
            document.body.style.backgroundColor = ''; // Reset
        }
        return () => {
            if (flashIntervalRef.current) clearInterval(flashIntervalRef.current);
            document.body.style.backgroundColor = '';
        };
    }, [isFlashOn]);
    
    // Location Logic
    useEffect(() => {
        if ('geolocation' in navigator) {
            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy
                    });
                    setLocationError(null);
                },
                (err) => setLocationError(err.message),
                { enableHighAccuracy: true, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(id);
        } else {
            setLocationError("Geolocation not supported");
        }
    }, []);

    const modalContent = (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                     <h1 className="text-5xl font-black tracking-tighter text-rose-500 animate-pulse">SOS MODE</h1>
                     <p className="text-slate-400">Emergency Tools - Works Offline</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setIsSirenOn(!isSirenOn)} 
                        className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all transform active:scale-95 ${isSirenOn ? 'bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.6)]' : 'bg-slate-800'}`}
                    >
                        <span className="text-4xl">📢</span>
                        <span className="font-bold text-lg">{isSirenOn ? 'STOP SIREN' : 'LOUD SIREN'}</span>
                    </button>
                    <button 
                        onClick={() => setIsFlashOn(!isFlashOn)}
                        className={`p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all transform active:scale-95 ${isFlashOn ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.6)]' : 'bg-slate-800 text-white'}`}
                    >
                         <span className="text-4xl">🔦</span>
                         <span className="font-bold text-lg">{isFlashOn ? 'STOP FLASH' : 'STROBE'}</span>
                    </button>
                </div>

                <div className="p-6 bg-slate-800 rounded-2xl text-center space-y-3 border border-slate-700">
                    <h3 className="text-lg font-bold text-slate-300">Your Current Location</h3>
                    {location ? (
                        <div className="font-mono text-xl space-y-1">
                            <p className="text-emerald-400">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                            <p className="text-xs text-slate-500">Accuracy: ±{Math.round(location.accuracy)}m</p>
                        </div>
                    ) : (
                        <p className="text-slate-500 animate-pulse">{locationError ? `Error: ${locationError}` : 'Locating...'}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">Share these coordinates with emergency services.</p>
                </div>

                <button onClick={() => { setIsSirenOn(false); setIsFlashOn(false); onClose(); }} className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 font-bold text-lg transition-colors">
                    Exit Emergency Mode
                </button>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, modalRoot);
};

export default TripSOSModal;
