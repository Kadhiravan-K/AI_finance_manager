import React, { useState } from 'react';

const FAQ_DATA = [
    {
        q: "How do I add a transaction automatically?",
        a: "Tap the large '+' button in the footer. In the 'AI Parse' tab, either paste a transaction message (e.g., from a bank SMS) or type a simple phrase like 'Lunch for 500'. The AI will extract the details for you to confirm."
    },
    {
        q: "Can I edit or delete a transaction?",
        a: "Yes. On the Dashboard screen, simply tap on any transaction to open the editing modal. To delete, hover over a transaction on a desktop or long-press on mobile to reveal the edit/delete options."
    },
    {
        q: "What is the 'Trust Bin'?",
        a: "The Trust Bin is a safety feature. When you delete an item (like a transaction or account), it's moved to the Trust Bin for a set period (default 30 days) before being permanently erased. You can restore items from the Trust Bin via the Hub."
    },
    {
        q: "How does the Financial Health Score work?",
        a: "It's a score out of 100 based on four key areas: your savings rate (how much you save vs. earn), debt-to-income ratio, budget adherence (how well you stick to your budgets), and your emergency fund progress. Improve in these areas to boost your score."
    },
    {
        q: "Can I manage multiple currencies?",
        a: "Yes. You can set a default currency in App Settings. Each account can also have its own specific currency. The app will keep track of totals per currency."
    },
    {
        q: "How do I create a budget?",
        a: "Go to the 'Budgets' screen from the footer or the Hub. Here you can set monthly spending limits for any of your expense categories. The progress bars will show how much you've spent against your limit."
    },
    {
        q: "What is the 'Share to App' feature?",
        a: "From any app that supports sharing (like your bank's app, SMS, or Google Pay), you can tap the 'Share' button on a transaction and select 'Finance Hub'. The transaction text will be sent directly to the AI parser, making it incredibly fast to add transactions."
    },
    {
        q: "How do I back up my data?",
        a: "Go to Hub > App & Data > App Settings. You'll find options to create an encrypted, password-protected backup file. This is the safest way to save your data externally. You can also export specific data sets to CSV or JSON from the 'Import/Export' tool."
    },
    {
        q: "Is my financial data private?",
        a: "Absolutely. All your data is stored and encrypted locally on your device. We never see it. The only time data leaves your device is when you use an AI feature (the text you provide is sent for analysis) or send feedback."
    },
    {
        q: "How do I manage shared expenses for a trip?",
        a: "In the 'Trips' tool, create a new trip and add participants. When you add an expense to that trip, you can specify who paid and how the cost should be split among the participants. The app automatically calculates 'who owes whom' in the trip's dashboard."
    },
];


const FaqItem: React.FC<{ q: string; a: string; isOpen: boolean; onClick: () => void }> = ({ q, a, isOpen, onClick }) => {
    return (
        <div className="bg-subtle rounded-lg">
            <button onClick={onClick} className="w-full p-4 text-left flex justify-between items-center">
                <span className="font-semibold text-primary">{q}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7 7" /></svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-divider animate-fadeInUp">
                    <p className="text-secondary text-sm">{a}</p>
                </div>
            )}
        </div>
    );
};

const FaqScreen: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(0);

  const handleToggle = (id: number) => {
    setOpenId(prevId => (prevId === id ? null : id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-divider flex-shrink-0">
        <h2 className="text-2xl font-bold text-primary text-center">Frequently Asked Questions ❓</h2>
      </div>
      <div className="flex-grow overflow-y-auto p-6 space-y-3">
        {FAQ_DATA.map((faq, index) => (
          <FaqItem 
            key={index}
            q={faq.q}
            a={faq.a}
            isOpen={openId === index}
            onClick={() => handleToggle(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default FaqScreen;
