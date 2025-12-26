import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import ModalHeader from './ModalHeader';
import LoadingSpinner from './LoadingSpinner';
import { AppState } from '../types';
import { getAIChatResponse, generateSpeech } from '../services/geminiService';

const modalRoot = document.getElementById('modal-root')!;

// Fix: Manually implement base64 decoding to Uint8Array as required for raw PCM data.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Fix: Custom decoding function for raw Int16 PCM audio bytes returned by Gemini TTS.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AIChatModalProps {
  onClose: () => void;
  appState: AppState;
}

const AIChatModal: React.FC<AIChatModalProps> = ({ onClose, appState }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<{ role: 'user' | 'model', text: string }[]>([
      { role: 'model', text: "Hello! I'm your AI financial coach. How can I help you understand your finances better today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
        audioContextRef.current?.close();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message;
    const currentHistory = history.map(h => ({ role: h.role, text: h.text }));
    
    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await getAIChatResponse(appState, userMessage, currentHistory);
      setHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setHistory(prev => [...prev, { role: 'model', text: `Sorry, I ran into an error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (text: string, index: number) => {
      if (playingIndex !== null) return; // Prevent multiple plays
      setPlayingIndex(index);
      try {
          const base64Audio = await generateSpeech(text);
          // Fix: Gemini TTS returns raw PCM data at 24000Hz. Native AudioContext.decodeAudioData will fail.
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
          audioContextRef.current = audioCtx;
          
          // Fix: Use manual PCM decoding per guidelines for Gemini TTS modality.
          const audioBuffer = await decodeAudioData(
              decode(base64Audio),
              audioCtx,
              24000,
              1
          );
          
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioCtx.destination);
          source.onended = () => {
              setPlayingIndex(null);
              audioCtx.close();
              audioContextRef.current = null;
          };
          source.start();
      } catch (e) {
          console.error("TTS failed", e);
          setPlayingIndex(null);
      }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass-card rounded-xl shadow-2xl w-full max-w-lg p-0 max-h-[90vh] flex flex-col border border-divider animate-scaleIn" onClick={e => e.stopPropagation()}>
        <ModalHeader title="AI Financial Coach" onClose={onClose} icon="🧠" />
        
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {history.map((entry, index) => (
            <div key={index} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 rounded-xl max-w-[80%] ${entry.role === 'user' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
                <p className="text-sm text-primary whitespace-pre-wrap">{entry.text}</p>
                {entry.role === 'model' && (
                    <button 
                        onClick={() => handleSpeak(entry.text, index)} 
                        className={`mt-2 text-xs flex items-center gap-1 ${playingIndex === index ? 'text-emerald-400 animate-pulse' : 'text-secondary hover:text-primary'}`}
                        disabled={playingIndex !== null}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        {playingIndex === index ? 'Speaking...' : 'Read Aloud'}
                    </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-subtle">
                <LoadingSpinner />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t border-divider flex items-center gap-2">
            <textarea 
                ref={inputRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask a question..."
                className="w-full input-base rounded-2xl py-2 px-4 resize-none h-12"
                rows={1}
                disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !message.trim()} className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default AIChatModal;