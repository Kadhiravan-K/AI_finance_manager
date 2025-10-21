




import React, { useState, useContext, useMemo } from 'react';
import { AppDataContext } from '../../contexts/SettingsContext';
// Fix: Corrected import paths and added missing types
import { Note, ChecklistItem, ItemType, AppliedViewOptions, ViewOptions, ActiveModal, ActiveScreen, Priority } from '../../types';
import EmptyState from '../EmptyState';
import NoteDetailView from '../NoteDetailView';
import ChecklistDetailView from '../ChecklistDetailView';

interface NoteListViewProps {
    onSelectNote: (id: string) => void;
    onAddNote: (type: 'note' | 'checklist') => void;
    onDeleteNote: (id: string) => void;
    onPinNote: (note: Note) => void;
    openModal: (name: ActiveModal, props?: Record<string, any>) => void;
}

const NoteListView: React.FC<NoteListViewProps> = ({ onSelectNote, onAddNote, onDeleteNote, onPinNote, openModal }) => {
    const dataContext = useContext(AppDataContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewOptions, setViewOptions] = useState<AppliedViewOptions>({
        sort: { key: 'updatedAt', direction: 'desc' },
        filters: {}
    });

    if (!dataContext) return null;
    const { notes = [], trips = [] } = dataContext;

    const tripMap = useMemo(() => new Map(trips.map(t => [t.id, t.name])), [trips]);

    const sortedAndFilteredNotes = useMemo(() => {
        let result = [...notes].filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const { key, direction } = viewOptions.sort;

        result.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;

            let comparison = 0;
            switch(key) {
                case 'title': comparison = a.title.localeCompare(b.title); break;
                case 'createdAt': comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); break;
                case 'updatedAt':
                default: comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); break;
            }
            return direction === 'asc' ? -comparison : comparison;
        });
        return result;
    }, [notes, searchQuery, viewOptions]);

    const viewOptionsConfig: ViewOptions = {
        sortOptions: [ { key: 'updatedAt', label: 'Last Updated' }, { key: 'createdAt', label: 'Date Created'}, { key: 'title', label: 'Title (A-Z)' }, ],
        filterOptions: []
    };
    const isViewOptionsApplied = viewOptions.sort.key !== 'updatedAt' || viewOptions.sort.direction !== 'desc';
    
    const getSnippet = (note: Note) => {
        if (typeof note.content === 'string') {
            return note.content.substring(0, 100);
        }
        if (Array.isArray(note.content) && note.content.length > 0) {
            return note.content.slice(0, 3).map(item => `• ${item.name}`).join(', ');
        }
        return 'No content';
    }

    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-primary">Notes & Lists</h2>
                <button onClick={() => openModal('viewOptions', { options: viewOptionsConfig, currentValues: viewOptions, onApply: setViewOptions })} className="button-secondary text-sm p-2 flex items-center gap-2 relative rounded-full aspect-square">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 10h12M3 16h6" /></svg>
                    {isViewOptionsApplied && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[var(--color-bg-app)]"></div>}
                </button>
            </div>
            <div className="p-4 flex-shrink-0 border-b border-divider">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search notes..." className="input-base w-full p-2 rounded-full" />
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-3">
                {sortedAndFilteredNotes.length > 0 ? (
                sortedAndFilteredNotes.map((note) => (
                    <div key={note.id} onClick={() => onSelectNote(note.id)} className={`note-list-item ${note.isPinned ? 'pinned' : ''}`}>
                        <div className="note-list-item-content">
                            <p className="note-list-item-title">{note.title || 'Untitled'}</p>
                            <p className="note-list-item-snippet">{getSnippet(note)}</p>
                            {note.tripId && <span className="text-xs text-amber-400 bg-amber-900/50 px-2 py-0.5 rounded-full mt-2 inline-block">✈️ {tripMap.get(note.tripId)}</span>}
                        </div>
                        <div className="note-list-item-actions">
                            <button onClick={(e) => { e.stopPropagation(); onPinNote(note); }} className={`pin-button ${note.isPinned ? 'pinned' : ''}`} title={note.isPinned ? 'Unpin' : 'Pin'}>
                                {/* FIX: Replaced emoji with an SVG to resolve potential rendering/type issues. */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14 4v5c0 1.12.37 2.16 1 3H9c.63-.84 1-1.88 1-3V4h4m3 0H7c-1.1 0-2 .9-2 2v5c0 1.66 1.34 3 3 3h1v5l-2 2v1h8v-1l-2-2v-5h1c1.66 0 3-1.34 3-3V6c0-1.1-.9-2-2-2Z"/>
                                </svg>
                            </button>
                            {/* FIX: Replaced &times; HTML entity with an SVG to prevent JSX parsing issues. */}
                            <button onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }} className="p-2 text-rose-400/60 hover:text-rose-400 rounded-full" title="Delete">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                ))
                ) : (
                    <EmptyState 
                        icon="📝" 
                        title={searchQuery ? "No Results Found" : "No Notes Yet"}
                        message={searchQuery ? `No notes matched your search for "${searchQuery}".` : "Create your first note or checklist to keep track of important information."}
                        actionText={searchQuery ? undefined : "Create New"}
                        onAction={searchQuery ? undefined : () => openModal('addNoteType', { onAdd: onAddNote })}
                    />
                )}
            </div>
             <div className="p-4 border-t border-divider flex-shrink-0">
                <button onClick={() => openModal('addNoteType', { onAdd: onAddNote })} className="button-primary w-full py-2">+ Create New</button>
            </div>
        </div>
    );
}


interface NotesScreenProps {
  noteId: string | null;
  onCreateExpense: (list: Note) => void;
  openModal: (name: ActiveModal, props?: Record<string, any>) => void;
  onDeleteItem: (id: string, itemType: ItemType) => void;
  onNavigate: (screen: ActiveScreen, modal?: ActiveModal, props?: Record<string, any>) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = (props) => {
  const { noteId, onCreateExpense, openModal, onDeleteItem, onNavigate } = props;
  const dataContext = useContext(AppDataContext);
  
  if (!dataContext) return <div>Loading...</div>;

  const { notes, setNotes } = dataContext;
  
  const selectedNote = useMemo(() => (notes || []).find(note => note.id === noteId), [notes, noteId]);

  const handleBackToLists = () => onNavigate('notes');

  const handleAddNote = (type: 'note' | 'checklist', tripId?: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: self.crypto.randomUUID(),
      title: `Untitled ${type === 'note' ? 'Note' : 'Checklist'}`,
      content: type === 'note' ? '' : [],
      type: type,
      createdAt: now,
      updatedAt: now,
      tripId: tripId,
    };
    setNotes(prev => [...(prev || []), newNote]);
    onNavigate('notes', undefined, { noteId: newNote.id });
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes(prev => (prev || []).map(note => note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : note));
  };
  
  const handlePinNote = (noteToPin: Note) => {
    handleSaveNote({ ...noteToPin, isPinned: !noteToPin.isPinned });
  };

  const handleDeleteNote = (id: string) => {
      onDeleteItem(id, 'note');
      if (noteId === id) {
          onNavigate('notes');
      }
  }

  if (selectedNote) {
    if (selectedNote.type === 'checklist') {
        return <ChecklistDetailView list={selectedNote} onSave={handleSaveNote} onBack={handleBackToLists} onCreateExpense={onCreateExpense} openModal={openModal} />;
    }
    return <NoteDetailView note={selectedNote} onSave={handleSaveNote} onBack={handleBackToLists} openModal={openModal} />;
  }

  return <NoteListView onSelectNote={(id) => onNavigate('notes', undefined, { noteId: id })} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onPinNote={handlePinNote} openModal={openModal} />;
};
