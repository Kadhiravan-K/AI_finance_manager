import React, { useState, useRef, useEffect } from 'react';
import { Trip, TripMessage, USER_SELF_ID } from '../types';

interface TripChatProps {
    trip: Trip;
    messages: TripMessage[];
    onSendMessage: (msg: TripMessage) => void;
}

const TripChat: React.FC<TripChatProps> = ({ trip, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const touchStartRef = useRef<number>(0);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendText = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            const msg: TripMessage = {
                id: self.crypto.randomUUID(),
                tripId: trip.id,
                senderId: USER_SELF_ID,
                senderName: 'You',
                text: newMessage.trim(),
                timestamp: new Date().toISOString(),
                type: 'text'
            };
            onSendMessage(msg);
            setNewMessage('');
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result as string;
                    const msg: TripMessage = {
                        id: self.crypto.randomUUID(),
                        tripId: trip.id,
                        senderId: USER_SELF_ID,
                        senderName: 'You',
                        audioData: base64Audio,
                        timestamp: new Date().toISOString(),
                        type: 'audio'
                    };
                    onSendMessage(msg);
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            timerRef.current = window.setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };
    
    // Helper for touch handling to prevent accidental short taps acting as record
    const handleTouchStart = () => {
        touchStartRef.current = Date.now();
        startRecording();
    }
    const handleTouchEnd = () => {
        if (Date.now() - touchStartRef.current < 300) {
            // Too short, maybe cancel or just allow it
        }
        stopRecording();
    }

    return (
        <div className="h-full flex flex-col relative">
            <div className="flex-grow overflow-y-auto space-y-4 p-4 pb-24">
                {messages.length === 0 && (
                    <div className="text-center text-secondary py-8">
                        <p className="text-4xl mb-2">📻</p>
                        <p>No messages yet.</p>
                        <p className="text-xs mt-1">Use the PTT button to send voice notes or type below.</p>
                    </div>
                )}
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === USER_SELF_ID ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl max-w-[80%] ${msg.senderId === USER_SELF_ID ? 'bg-sky-600 text-white' : 'bg-subtle border border-divider'}`}>
                            <div className="flex justify-between items-baseline mb-1 gap-2">
                                <span className={`text-xs font-bold ${msg.senderId === USER_SELF_ID ? 'text-sky-200' : 'text-primary'}`}>{msg.senderName}</span>
                                <span className={`text-[10px] ${msg.senderId === USER_SELF_ID ? 'text-sky-200' : 'text-secondary'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            {msg.type === 'text' ? (
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            ) : (
                                <audio controls src={msg.audioData} className="max-w-full h-8 mt-1" />
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-card-strong border-t border-divider backdrop-blur-md flex flex-col gap-3">
                {/* Walkie Talkie Button */}
                <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => { e.preventDefault(); handleTouchStart(); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd(); }}
                    className={`w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-3 ${isRecording ? 'bg-rose-500 animate-pulse ring-4 ring-rose-500/30' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                >
                    {isRecording ? (
                        <>
                            <span className="w-3 h-3 rounded-full bg-white animate-ping" />
                            <span>Recording... {recordingDuration}s</span>
                        </>
                    ) : (
                        <>
                            <span className="text-xl">🎙️</span>
                            <span>Hold to Talk</span>
                        </>
                    )}
                </button>
                
                {/* Text Input */}
                <form onSubmit={handleSendText} className="flex items-center gap-2">
                    <input
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow input-base rounded-full py-2 px-4"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="button-secondary p-2 rounded-full aspect-square disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TripChat;
