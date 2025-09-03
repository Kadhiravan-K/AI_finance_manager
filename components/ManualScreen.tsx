import React from 'react';
import ModalHeader from './ModalHeader'; 
import { ActiveScreen } from '../types';

interface ManualScreenProps {
  setActiveScreen: (screen: ActiveScreen) => void;
}

const ManualScreen: React.FC<ManualScreenProps> = ({ setActiveScreen }) => {
  const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
      <h3 className="text-xl font-bold text-primary mb-3 border-b border-divider pb-2">{title}</h3>
      <div className="space-y-4 text-sm text-secondary leading-relaxed">
        {children}
      </div>
    </div>
  );

  const SubSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mt-4 p-3 bg-subtle rounded-lg">
      <h4 className="font-semibold text-primary mb-2">{title}</h4>
      {children}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <ModalHeader title="App Manual" icon="📖" onBack={() => setActiveScreen('more')} onClose={() => setActiveScreen('more')} />
      <div className="flex-grow overflow-y-auto p-6 pr-4">
        <Section title="👋 Welcome to the Finance Hub Manual">
          <p>This guide provides a detailed overview of every tool and feature available in your Personal Finance Hub. Use it to unlock the full potential of the app and manage your finances like a pro.</p>
        </Section>
        
        <Section title="📊 Dashboard">
          <p>The Dashboard is your main financial overview. It shows your income, expenses, and balance for the selected period. You can customize the widgets shown here from <strong className="text-primary">Hub &gt; Management &gt; Dashboard</strong>.</p>
        </Section>
        
        <Section title="💸 Adding Transactions">
           <SubSection title="🤖 Automatic (AI Parse)">
            <p>The fastest way to add transactions. Simply paste a message from your bank or a payment app (e.g., "INR 500 spent on Zomato") into the 'Quick Add' box. The AI will automatically extract the amount, description, and suggest a category.</p>
            <p><strong>Pro Tip:</strong> Use the 'Share' feature in your SMS app and select 'Finance Hub' to send the message directly to the parser!</p>
           </SubSection>
           <SubSection title="✍️ Manual Entry">
            <p>For more control, use the manual form. Here you can specify the account, date, time, category, and add notes. You can also itemize an expense and split it among friends.</p>
           </SubSection>
        </Section>
        
        <Section title="🛠️ Financial Tools">
          <SubSection title="🧠 AI Hub">
            <p>Your central command center for interacting with the AI. The AI Hub provides a chat-like interface where you can give commands, ask complex questions, and get insights about your finances. You can also upload files like images or documents for analysis and use voice commands for hands-free operation.</p>
          </SubSection>
          <SubSection title="💹 Investments">
            <p>Track your stocks, mutual funds, and other investments. Add your holdings to monitor their current value and see your portfolio grow.</p>
          </SubSection>
          <SubSection title="✈️ Trips">
            <p>Manage shared expenses for group trips. Create a trip, add participants, and log expenses. The app automatically calculates who owes whom, simplifying settlements.</p>
          </SubSection>
          <SubSection title="🏪 Shop Hub">
             <p>A mini-ERP for your small business or side hustle. Add products, track inventory, and record sales. The app automatically creates an income transaction for each sale.</p>
          </SubSection>
          <SubSection title="↩️ Refunds">
             <p>Keep track of money owed back to you. Log expected refunds from online shopping or friends, and mark them as 'Claimed' when the money arrives.</p>
          </SubSection>
          <SubSection title="📅 Scheduled">
             <p>Automate your recurring bills and income. Set up a payment schedule, and the app will notify you when a bill is due.</p>
          </SubSection>
          <SubSection title="🛒 Shopping Lists">
             <p>Create and manage shopping lists. Add items with their rates. After shopping, you can check off purchased items and create a single, itemized expense transaction directly from the list.</p>
          </SubSection>
          <SubSection title="🧮 Calculator">
             <p>A powerful calculator with multiple modes: Basic, Currency Conversion, EMI, SIP, SWP, and Goal planning. The Basic calculator also features an AI that can answer financial questions based on your data (e.g., "how much did I spend on food last week?").</p>
          </SubSection>
          <SubSection title="🗓️ Calendar">
             <p>A visual overview of your financial events. It automatically shows due dates for scheduled bills and expected refunds.</p>
          </SubSection>
          <SubSection title="↔️ Transfer">
             <p>Move money between your accounts. If transferring between different currencies, the app can automatically fetch the latest conversion rate.</p>
          </SubSection>
          <SubSection title="🏅 Achievements & 🔥 Challenges">
             <p>Gamify your finances! Unlock achievements for reaching milestones (like logging 10 transactions) and complete daily challenges to build a consistent financial habit and maintain your usage streak.</p>
          </SubSection>
           <SubSection title="📚 Learn">
             <p>Brush up on your financial knowledge. Explore suggested topics or use the AI Coach to ask personalized questions about your finances and get expert advice.</p>
          </SubSection>
        </Section>

        <Section title="⚙️ Management & Customization">
          <SubSection title="🎨 Dashboard & 🐾 Footer">
            <p>Customize your dashboard by showing, hiding, and reordering widgets. You can also change the four main navigation buttons in the footer to get quick access to the tools you use most.</p>
          </SubSection>
           <SubSection title="🏦 Accounts">
            <p>Manage all your financial accounts, including bank accounts, credit cards, cash, and investment portfolios.</p>
          </SubSection>
           <SubSection title="🏷️ Categories">
            <p>Organize your transactions by creating and managing categories and sub-categories for both income and expenses.</p>
          </SubSection>
          <SubSection title="🏢 Payees">
            <p>Save frequent payees (like your landlord or a favorite restaurant) with a default category. When you add a transaction with a matching identifier (UPI ID, etc.), the app will auto-fill the description and category.</p>
          </SubSection>
          <SubSection title="👥 Contacts">
            <p>Manage your contacts and organize them into groups. This is useful for splitting expenses and managing trips.</p>
          </SubSection>
          <SubSection title="🛡️ Senders">
            <p>Manage message senders (e.g., 'VK-HDFCBK'). Mark senders as 'Trusted' to bypass spam checks or 'Blocked' to ignore their messages completely.</p>
          </SubSection>
        </Section>
        
        <Section title="📲 App & Data">
          <SubSection title="🔗 Integrations">
            <p>Connect to external services. Currently supports connecting to Google Calendar to sync your bill due dates.</p>
          </SubSection>
          <SubSection title="⚙️ Settings">
            <p>Change your app's theme (Dark/Light) and default currency. You can also create an encrypted backup of all your app data here, or restore from a previous backup file.</p>
          </SubSection>
          <SubSection title="🗑️ Trust Bin">
            <p>A safety net for deleted items. Anything you delete is moved here for a set period before being permanently erased, giving you a chance to restore it.</p>
          </SubSection>
          <SubSection title="📄 Import/Export">
            <p>Export your data. 'Simple' export provides a transaction history in CSV format. 'Advanced' export allows you to select specific data modules (like accounts, categories, etc.) to export as a JSON file.</p>
          </SubSection>
        </Section>
        
        <Section title="ℹ️ About this App">
            <p>The Personal Finance Hub is designed to be a powerful, private, and offline-first financial tool. All your data is encrypted and stored only on your device. We use the Google Gemini API to provide smart features, but your core financial data never leaves your control. Thank you for using the app!</p>
        </Section>
      </div>
    </div>
  );
};

export default ManualScreen;
