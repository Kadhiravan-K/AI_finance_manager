import React, { useState, useContext } from 'react';
import { AppDataContext } from '../contexts/SettingsContext';
import { GlossaryEntry } from '../types';

interface GlossaryScreenProps {
  onAdd: () => void;
  onEdit: (entry: GlossaryEntry) => void;
}

const GlossaryScreen: React.FC<GlossaryScreenProps> = ({ onAdd, onEdit }) => {
  const dataContext = useContext(AppDataContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!dataContext) return null;

  const { glossaryEntries, deleteItem } = dataContext;

  const filteredEntries = glossaryEntries.filter(entry => 
    entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(prevId => (prevId === id ? null : id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Glossary 📖</h2>
      </div>
      <div className="p-4 flex-shrink-0">
        <input 
          type="text" 
          placeholder="Search terms..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full input-base p-2 rounded-full"
        />
      </div>
      <div className="flex-grow overflow-y-auto p-6 pt-0 space-y-3">
        {filteredEntries.map(entry => {
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id} className="bg-subtle rounded-lg group">
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(entry.id)}
              >
                <span className="flex items-center gap-3 font-medium text-primary">
                  <span className="text-2xl">{entry.emoji}</span>
                  {entry.term}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
              {isExpanded && (
                <div className="p-4 border-t border-divider space-y-3 animate-fadeInUp">
                  <div>
                    <h4 className="text-sm font-semibold text-secondary">Definition</h4>
                    <p className="text-sm text-primary">{entry.definition}</p>
                  </div>
                   <div>
                    <h4 className="text-sm font-semibold text-secondary">Usage</h4>
                    <p className="text-sm text-primary">{entry.usageLogic}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-secondary">Example</h4>
                    <p className="text-sm text-primary italic">"{entry.example}"</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => onEdit(entry)} className="button-secondary text-xs px-3 py-1">Edit</button>
                    <button onClick={() => deleteItem(entry.id, 'glossaryEntry')} className="button-secondary text-xs px-3 py-1 text-rose-400 hover:bg-rose-500/20">Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
       <div className="flex-shrink-0 p-6 border-t border-divider bg-subtle">
        <button onClick={onAdd} className="button-primary w-full py-2 font-semibold">
          + Add New Term
        </button>
      </div>
    </div>
  );
};

export default GlossaryScreen;
