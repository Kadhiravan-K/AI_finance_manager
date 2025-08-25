import React, { useState } from 'react';

const articles = [
    { title: "Budgeting 101: The 50/30/20 Rule", content: "The 50/30/20 rule is a simple budgeting guideline. It suggests allocating 50% of your after-tax income to Needs (housing, utilities, groceries), 30% to Wants (dining out, hobbies), and 20% to Savings & Debt Repayment. It's a great starting point for taking control of your money." },
    { title: "What is an Emergency Fund?", content: "An emergency fund is a stash of money set aside to cover unexpected financial emergencies, like a job loss or medical bill. A good rule of thumb is to save 3-6 months' worth of essential living expenses in a high-yield savings account." },
    { title: "Saving vs. Investing: What's the Difference?", content: "Saving is for short-term goals and emergencies; it's typically low-risk and low-return (like a savings account). Investing is for long-term goals like retirement; it involves taking on more risk for the potential of higher returns (like stocks or mutual funds)." },
    { title: "Understanding Your Credit Score", content: "A credit score is a number that represents your creditworthiness to lenders. It's based on factors like payment history, amounts owed, and length of credit history. A higher score makes it easier to get loans and credit cards with better interest rates." },
];

const AccordionItem: React.FC<{ title: string; children: React.ReactNode; isOpen: boolean; onClick: () => void; }> = ({ title, children, isOpen, onClick }) => (
    <div className="bg-subtle rounded-lg border border-divider">
        <button onClick={onClick} className="w-full flex justify-between items-center p-4 text-left">
            <h3 className="font-semibold text-primary">{title}</h3>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isOpen && <div className="p-4 pt-0 text-secondary text-sm animate-fadeInUp">{children}</div>}
    </div>
);

const LearnScreen = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    return (
        <div className="h-full flex flex-col">
            <div className="p-4 border-b border-divider flex-shrink-0">
                <h2 className="text-2xl font-bold text-primary text-center">Learn Finance 📚</h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6 space-y-3">
                {articles.map((article, index) => (
                    <AccordionItem key={index} title={article.title} isOpen={openIndex === index} onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                        <p>{article.content}</p>
                    </AccordionItem>
                ))}
            </div>
        </div>
    );
};

export default LearnScreen;