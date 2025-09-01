import React, { useState, useContext, useEffect, useMemo } from 'react';
import { AppDataContext } from '../contexts/SettingsContext';
import { Note } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface NotesScreenProps {
  onEditNote: (note?: Note) => void;
  onDeleteNote: (id: string) => void;
  onUpdateContent: (noteId: string, newContent: string) => void;
  onArchiveNote: (noteId: string, isArchived: boolean) => void;
  onPinNote: (noteId: string, isPinned: boolean) => void;
  onChangeNoteColor: (noteId: string, color: string) => void;
  onMoveTempNoteToTrustBin: (note: { content: string, timestamp: number }) => void;
  onCreateTransactionFromNote: (note: Note) => void;
}

const NOTE_COLORS: Record<string, { bg: string, border: string }> = {
  default: { bg: 'var(--color-bg-card)', border: 'var(--color-border-card)'},
  red: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.4)'},
  orange: { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.4)'},
  yellow: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.4)'},
  green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.4)'},
  blue: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.4)'},
  purple: { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.4)'},
  grey: { bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.4)'},
};


const NoteCard: React.FC<{
    note: Note;
    onEdit: () => void;
    onDelete: () => void;
    onUpdateContent: (newContent: string) => void;
    onArchive: (isArchived: boolean) => void;
    onPin: (isPinned: boolean) => void;
    onChangeColor: (color: string) => void;
    onCreateTransaction: () => void;
}> = ({ note, onEdit, onDelete, onUpdateContent, onArchive, onPin, onChangeColor, onCreateTransaction }) => {
    
    const handleCheckboxToggle = (lineIndex: number, checked: boolean) => {
        const lines = note.content.split('\n');
        const line = lines[lineIndex];
        const updatedLine = checked ? line.replace('[ ]', '[x]') : line.replace('[x]', '[ ]');
        lines[lineIndex] = updatedLine;
        onUpdateContent(lines.join('\n'));
    };
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const hasBillableItems = useMemo(() => /\[x\]/.test(note.content), [note.content]);

    const renderContent = () => {
        return note.content.split('\n').slice(0, 15).map((line, index) => { // show max 15 lines on card
            const isChecked = line.trim().startsWith('[x]');
            const isCheckbox = line.trim().startsWith('[ ]') || isChecked;

            if (isCheckbox) {
                return (
                    <div key={index} className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleCheckboxToggle(index, e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 bg-subtle border-divider focus:ring-emerald-500"
                        />
                        <span className={`flex-grow ${isChecked ? 'line-through text-secondary' : 'text-primary'}`}>
                            {line.replace(/\[[x ]\]\s*/, '')}
                        </span>
                    </div>
                );
            }
            return <p key={index} className="text-primary whitespace-pre-wrap truncate">{line}</p>;
        });
    };
    
    const color = NOTE_COLORS[note.color] || NOTE_COLORS.default;

    return (
        <div 
            onClick={onEdit}
            className="p-4 rounded-lg border cursor-pointer break-inside-avoid-column mb-4"
            style={{ backgroundColor: color.bg, borderColor: color.border }}
        >
            {note.image && <img src={`data:${note.image.mimeType};base64,${note.image.data}`} alt="note attachment" className="note-image-thumbnail" />}
            {note.title && <h3 className="font-bold text-primary mb-2">{note.title}</h3>}
            <div className="text-sm space-y-2">{renderContent()}</div>
            <div className="flex items-end justify-between mt-3 pt-2 border-t" style={{ borderColor: 'rgba(127,127,127,0.2)'}}>
                <div className="flex gap-1 flex-wrap">
                    {note.tags.map((tag, i) => <span key={i} className="text-xs bg-subtle px-2 py-0.5 rounded-full">{tag}</span>)}
                </div>
                <div className="flex items-center gap-1">
                    {hasBillableItems && (
                        <button onClick={(e) => { e.stopPropagation(); onCreateTransaction(); }} className="w-6 h-6 rounded-full flex items-center justify-center text-secondary hover:bg-subtle" title="Bill Checked Items">🛒</button>
                    )}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-6 h-6 rounded-full flex items-center justify-center text-secondary hover:bg-subtle">⋮</button>
                        {isMenuOpen && (
                            <div className="absolute bottom-full right-0 mb-1 w-40 bg-card border border-divider rounded-lg shadow-lg z-10 p-1">
                                <button onClick={() => { onPin(!note.isPinned); setIsMenuOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm hover-bg-stronger rounded">{note.isPinned ? 'Unpin' : 'Pin'}</button>
                                <button onClick={() => { onArchive(!note.isArchived); setIsMenuOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm hover-bg-stronger rounded">{note.isArchived ? 'Unarchive' : 'Archive'}</button>
                                <button onClick={() => { onDelete(); setIsMenuOpen(false); }} className="w-full text-left px-2 py-1.5 text-sm text-rose-400 hover-bg-stronger rounded">Delete</button>
                                <div className="border-t border-divider my-1"></div>
                                <div className="grid grid-cols-4 gap-1 p-1">
                                    {Object.keys(NOTE_COLORS).map(colorKey => (
                                        <button key={colorKey} onClick={() => { onChangeColor(colorKey); setIsMenuOpen(false); }} className="w-6 h-6 rounded-full" style={{ backgroundColor: NOTE_COLORS[colorKey].bg, border: `1px solid ${NOTE_COLORS[colorKey].border}` }}></button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


const NotesScreen: React.FC<NotesScreenProps> = ({ onEditNote, onDeleteNote, onUpdateContent, onArchiveNote, onPinNote, onChangeNoteColor, onMoveTempNoteToTrustBin, onCreateTransactionFromNote }) => {
    const dataContext = useContext(AppDataContext);
    const [activeTab, setActiveTab] = useState<'notes' | 'archived' | 'temp'>('notes');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const [tempNoteData, setTempNoteData] = useLocalStorage<{ content: string; timestamp: number } | null>('finance-tracker-temp-note', null);

    useEffect(() => {
        if (tempNoteData && Date.now() - tempNoteData.timestamp > 24 * 60 * 60 * 1000) {
            onMoveTempNoteToTrustBin(tempNoteData);
            setTempNoteData(null); 
        }
    }, [tempNoteData, onMoveTempNoteToTrustBin, setTempNoteData]);

    const handleTempNoteChange = (content: string) => {
        if (content.trim()) {
            setTempNoteData({ content, timestamp: Date.now() });
        } else {
            setTempNoteData(null);
        }
    };
    
    if (!dataContext) return null;
    const { notes } = dataContext;

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        (notes || []).forEach(note => note.tags.forEach(tag => tags.add(tag)));
        return Array.from(tags).sort();
    }, [notes]);
    
    const { pinned, other, archived } = useMemo(() => {
        let filteredNotes = notes || [];

        if (selectedTag) {
            filteredNotes = filteredNotes.filter(note => note.tags.includes(selectedTag));
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filteredNotes = filteredNotes.filter(note => 
                (note.title && note.title.toLowerCase().includes(lowerQuery)) ||
                note.content.toLowerCase().includes(lowerQuery)
            );
        }

        const pinned: Note[] = [];
        const other: Note[] = [];
        const archived: Note[] = [];

        filteredNotes.forEach(note => {
            if (note.isArchived) {
                archived.push(note);
            } else if (note.isPinned) {
                pinned.push(note);
            } else {
                other.push(note);
            }
        });
        return { pinned, other, archived };
    }, [notes, searchQuery, selectedTag]);
    
    const currentNotes = activeTab === 'notes' ? [...pinned, ...other] : archived;

    const TabButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
        <button onClick={onClick} className={`w-full py-3 px-4 text-sm font-semibold transition-colors focus:outline-none ${ active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-secondary hover:text-primary' }`}>
            {children}
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Notes 📝</h2>
            </div>
            <div className="flex border-b border-divider flex-shrink-0">
                <TabButton active={activeTab === 'notes'} onClick={() => setActiveTab('notes')}>Notes</TabButton>
                <TabButton active={activeTab === 'archived'} onClick={() => setActiveTab('archived')}>Archived</TabButton>
                <TabButton active={activeTab === 'temp'} onClick={() => setActiveTab('temp')}>Scratchpad</TabButton>
            </div>

            <div className="flex-grow overflow-y-auto relative">
                {activeTab === 'temp' ? (
                    <div className="p-4 h-full">
                        <textarea
                            value={tempNoteData?.content || ''}
                            onChange={(e) => handleTempNoteChange(e.target.value)}
                            placeholder="Type anything here... it's saved across sessions but moves to the Trust Bin after 24 hours."
                            className="w-full h-full bg-transparent text-primary resize-none focus:outline-none"
                        />
                    </div>
                ) : (
                    <>
                        <div className="p-4 sticky top-0 bg-slate-900/50 backdrop-blur-sm z-10">
                             <div className="relative">
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="input-base w-full rounded-full py-2 px-3 pl-10" />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-tertiary" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <div className="notes-tag-filter">
                                <button onClick={() => setSelectedTag(null)} className={`notes-tag-button ${!selectedTag ? 'active' : ''}`}>All</button>
                                {allTags.map(tag => (
                                    <button key={tag} onClick={() => setSelectedTag(tag)} className={`notes-tag-button ${selectedTag === tag ? 'active' : ''}`}>{tag}</button>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 pt-0">
                            {currentNotes.length === 0 && (
                                <p className="text-center text-secondary py-8">No notes here.</p>
                            )}
                            {pinned.length > 0 && activeTab === 'notes' && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-semibold text-secondary uppercase mb-2">Pinned</h3>
                                    <div className="notes-grid">
                                        {pinned.map(note => <NoteCard key={note.id} note={note} onEdit={() => onEditNote(note)} onDelete={() => onDeleteNote(note.id)} onUpdateContent={(c) => onUpdateContent(note.id, c)} onArchive={(a) => onArchiveNote(note.id, a)} onPin={(p) => onPinNote(note.id, p)} onChangeColor={(c) => onChangeNoteColor(note.id, c)} onCreateTransaction={() => onCreateTransactionFromNote(note)} />)}
                                    </div>
                                </div>
                            )}
                             <div className="notes-grid">
                                {(activeTab === 'notes' ? other : archived).map(note => <NoteCard key={note.id} note={note} onEdit={() => onEditNote(note)} onDelete={() => onDeleteNote(note.id)} onUpdateContent={(c) => onUpdateContent(note.id, c)} onArchive={(a) => onArchiveNote(note.id, a)} onPin={(p) => onPinNote(note.id, p)} onChangeColor={(c) => onChangeNoteColor(note.id, c)} onCreateTransaction={() => onCreateTransactionFromNote(note)} />)}
                             </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotesScreen;