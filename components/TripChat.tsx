import React, { useState, useRef, useEffect } from 'react';

// Mock messages
const initialMessages = [
    { id: 1, user: 'Jane', text: 'Hey everyone! So excited for this trip! 🤩' },
    { id: 2, user: 'You', text: 'Me too! Did we decide on where to go for dinner on the first night?' },
    { id: 3, user: 'John', text: 'I heard "The Beach Shack" is great for seafood. 🦞' },
];

const TripChat: React.FC = () => {
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            setMessages(prev => [...prev, { id: Date.now(), user: 'You', text: newMessage.trim() }]);
            setNewMessage('');
        }
    };

    return (
        <div className="p-4 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.user === 'You' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-xl max-w-[80%] ${msg.user === 'You' ? 'bg-sky-800/70' : 'bg-subtle'}`}>
                            {msg.user !== 'You' && <p className="text-xs font-bold text-secondary mb-1">{msg.user}</p>}
                            <p className="text-sm text-primary whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>
            <form onSubmit={handleSend} className="flex-shrink-0 pt-4 flex items-center gap-2">
                <textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder="Type your message..."
                    className="w-full input-base rounded-2xl py-2 px-4 resize-none"
                    rows={1}
                />
                <button type="submit" className="button-primary p-3 aspect-square rounded-full flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                </button>
            </form>
        </div>
    );
};

export default TripChat;
