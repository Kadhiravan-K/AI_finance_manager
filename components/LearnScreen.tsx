
import React, { useState } from 'react';
import { getFinancialTopicExplanation, searchFinancialInfo } from '../services/geminiService';
import TopicModal from './TopicModal';
import LoadingSpinner from './LoadingSpinner';

const SUGGESTED_TOPICS = [
    { title: "Budgeting 101", icon: "🧾" },
    { title: "Emergency Funds", icon: "🆘" },
    { title: "Investing Basics", icon: "📈" },
    { title: "Credit Scores", icon: "💳" },
    { title: "Saving for Retirement", icon: "🏖️" },
    { title: "Understanding Taxes", icon: "📄" },
    { title: "Good vs. Bad Debt", icon: "💸" },
    { title: "Compound Interest", icon: "🌱" },
];

interface TopicContent {
    explanation: string;
    actionableTips: string[];
}

interface LearnScreenProps {
    onOpenChat: () => void;
    onOpenGlossary: () => void;
}

const LearnScreen: React.FC<LearnScreenProps> = ({ onOpenChat, onOpenGlossary }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [topicContent, setTopicContent] = useState<TopicContent | null>(null);
    const [webResult, setWebResult] = useState<{ text: string, sources: any[] } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'topic' | 'web'>('topic');

    const handleFetchTopic = async (topic: string) => {
        if (!topic.trim()) return;
        
        setSelectedTopic(topic);
        setIsLoading(true);
        setError(null);
        setTopicContent(null);

        try {
            const content = await getFinancialTopicExplanation(topic);
            setTopicContent(content);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load topic.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWebSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoading(true);
        setWebResult(null);
        try {
            const result = await searchFinancialInfo(searchQuery);
            setWebResult(result);
        } catch (e) {
            setError("Search failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'topic') {
            handleFetchTopic(searchQuery);
        } else {
            handleWebSearch();
        }
    };
    
    const handleCloseModal = () => {
        setSelectedTopic(null);
        setTopicContent(null);
        setError(null);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Learn Finance 📚</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                 <button onClick={onOpenChat} className="w-full text-left p-4 bg-violet-900/50 rounded-lg flex items-center gap-4 hover:bg-violet-900/80 transition-colors border border-violet-700 glow">
                    <span className="text-3xl flex-shrink-0">🧠</span>
                    <div>
                        <h3 className="font-bold text-primary">Chat with AI Coach</h3>
                        <p className="text-sm text-secondary">Ask personalized questions about your financial situation.</p>
                    </div>
                </button>
                <button onClick={onOpenGlossary} className="w-full text-left p-4 bg-subtle rounded-lg flex items-center gap-4 hover-bg-stronger transition-colors border border-divider">
                    <span className="text-3xl flex-shrink-0">📖</span>
                    <div>
                        <h3 className="font-bold text-primary">Financial Glossary</h3>
                        <p className="text-sm text-secondary">Look up common financial terms and concepts.</p>
                    </div>
                </button>

                <div className="bg-subtle p-2 rounded-xl">
                    <div className="flex mb-2 gap-2">
                        <button onClick={() => setMode('topic')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'topic' ? 'bg-emerald-500 text-white' : 'hover:bg-card-hover text-secondary'}`}>Explain Topic</button>
                        <button onClick={() => setMode('web')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'web' ? 'bg-sky-500 text-white' : 'hover:bg-card-hover text-secondary'}`}>Search Web</button>
                    </div>
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={mode === 'topic' ? "Explain 'Compound Interest'..." : "Search 'Current Mortgage Rates'..."}
                            className="input-base w-full rounded-lg py-3 px-5 pr-12 bg-bg-app"
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 transition-colors">
                            {isLoading ? <LoadingSpinner /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                        </button>
                    </form>
                </div>

                {webResult && mode === 'web' && (
                    <div className="p-4 bg-subtle rounded-xl border border-divider animate-fadeInUp">
                        <h3 className="font-bold text-primary mb-2">Search Result</h3>
                        <p className="text-sm text-secondary whitespace-pre-wrap">{webResult.text}</p>
                        {webResult.sources.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-divider">
                                <p className="text-xs text-tertiary mb-2">Sources:</p>
                                <ul className="space-y-1">
                                    {webResult.sources.map((s, i) => s.web?.uri ? (
                                        <li key={i}><a href={s.web.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline truncate block">{s.web.title || s.web.uri}</a></li>
                                    ) : null)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'topic' && (
                    <div>
                        <h3 className="font-semibold text-lg text-primary mb-3">Suggested Topics</h3>
                        <div className="management-grid">
                            {SUGGESTED_TOPICS.map(topic => (
                                <button 
                                    key={topic.title} 
                                    onClick={() => handleFetchTopic(topic.title)}
                                    className="management-tool-button p-4"
                                >
                                    <span className="icon text-3xl flex-shrink-0">{topic.icon}</span>
                                    <span className="text-xs font-semibold">{topic.title}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {selectedTopic && (
                <TopicModal 
                    topic={selectedTopic}
                    content={topicContent}
                    isLoading={isLoading}
                    error={error}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default LearnScreen;
