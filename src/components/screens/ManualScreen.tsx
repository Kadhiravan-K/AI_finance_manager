import React from 'react';

const ManualScreen: React.FC = () => {
  const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="glass-card rounded-xl p-4 mb-6 animate-fadeInUp">
      <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-3 border-b border-divider pb-2 mb-3">
        <span className="text-3xl">{icon}</span>
        {title}
      </h3>
      <div className="space-y-4 text-secondary text-sm">{children}</div>
    </div>
  );

  const SubSection: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="p-3 bg-subtle rounded-lg border-l-4 border-emerald-500/50">
        <h4 className="font-semibold text-primary flex items-center gap-2">{icon} {title}</h4>
        <div className="text-sm text-secondary space-y-2 mt-1">{children}</div>
    </div>
  )

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-primary">App Manual</h2>
      </div>
      
      <Section title="Getting Started" icon="🚀">
        <p>Welcome! This guide will help you get the most out of your personal finance hub.</p>
        <SubSection title="Initial Setup" icon="🏁">
            <p>During onboarding, set your primary currency and add your main accounts (like 'Cash' or 'Savings Account') with their current balances. This gives the app a starting point.</p>
        </SubSection>
        <SubSection title="The Dashboard" icon="📊">
            <p>Your main screen provides a quick summary of your finances, recent transactions, and AI-powered insights. You can customize which widgets appear here from <strong className="text-primary">Hub &rarr; Customize Dashboard</strong>.</p>
        </SubSection>
      </Section>

      <Section title="Managing Transactions" icon="💸">
        <SubSection title="Adding with AI (Automatic Tab)" icon="🤖">
            <p>This is the fastest way to add transactions. Tap the large `+` button, and in the 'Automatic' tab, paste a transaction message from your bank or type a simple phrase like "Dinner for 500". The AI will parse the details for you.</p>
        </SubSection>
         <SubSection title="Share to App" icon="📲">
            <p>From any other app (like your bank's app or SMS), use the native "Share" button and choose "Finance Hub". The text will be automatically sent to the AI parser!</p>
        </SubSection>
        <SubSection title="Adding Manually" icon="✍️">
            <p>For more detailed entries, use the 'Manual' tab. Here you can add itemized lists, add notes, and be very specific with categories.</p>
        </SubSection>
        <SubSection title="Editing & Deleting" icon="✏️">
            <p>On the Dashboard, tap a transaction to open the edit view. Deleted items go to the 'Trust Bin' for 30 days before permanent deletion.</p>
        </SubSection>
      </Section>
      
       <Section title="The Hub (More Screen)" icon="⚙️">
        <p>The Hub is your central access point for all tools and settings. Tap 'More' on the footer to access it.</p>
        <SubSection title="Layouts" icon="🎨">
            <p>You can switch between a compact Grid view and a more detailed List view using the toggle button in the header.</p>
        </SubSection>
        <SubSection title="Managing Tools" icon="🛠️">
            <p>Don't need a specific tool? Go to <strong className="text-primary">Hub &rarr; Management &rarr; Tools</strong> to hide it from the Hub screen, keeping your workspace clean.</p>
        </SubSection>
      </Section>

      <Section title="Financial Planning" icon="🎯">
        <SubSection title="Budgets" icon="📊">
            <p>Go to the Budgets screen (from the footer or Hub) to set monthly spending limits for categories. The progress bars will show you how you're doing at a glance. You can even ask the AI for budget suggestions based on your income.</p>
        </SubSection>
        <SubSection title="Goals" icon="🏆">
            <p>Saving up for something? Create a Goal to track your progress. You can contribute funds directly to a goal, which will automatically create a corresponding expense transaction.</p>
        </SubSection>
         <SubSection title="Scheduled Payments" icon="📅">
            <p>Automate your recurring bills and income. Set up a payment with its amount and frequency (e.g., monthly rent), and the app will notify you when it's due.</p>
        </SubSection>
      </Section>
      
      <Section title="Advanced Tools" icon="🔧">
          <SubSection title="Trip Management" icon="✈️">
              <p>Use the AI Planner in the "Create Trip" modal for quick itinerary suggestions. When adding an expense to a trip, you can specify who paid and how the cost should be split. The 'Who Owes Whom' summary automatically calculates settlements.</p>
          </SubSection>
          <SubSection title="Shop Hub" icon="🏪">
              <p>The billing tab acts as a full-featured Point-of-Sale (POS) system. The Analytics tab gives you key metrics like revenue and profit, and provides AI-powered insights to help you understand your business better.</p>
          </SubSection>
           <SubSection title="Shopping Lists" icon="🛒">
              <p>Create lists to track items you need to buy. You can set a quantity, rate, and priority for each item. Once purchased, you can create a single expense transaction from all your marked items.</p>
              <p className="font-semibold text-primary mt-2">Priority Colors:</p>
              <ul className="list-disc pl-5 text-sm">
                  <li><strong className="text-rose-400">🔴 High:</strong> Urgent items you need soon.</li>
                  <li><strong className="text-yellow-400">🟡 Medium:</strong> Important, but not immediate.</li>
                  <li><strong className="text-green-400">🟢 Low:</strong> Items to pick up when convenient.</li>
                  <li><strong>⚪ None:</strong> No specific priority.</li>
              </ul>
          </SubSection>
          <SubSection title="Refunds" icon="↩️">
              <p>Track money that is owed back to you. You can link a refund to an original expense to ensure you don't over-claim and mark it as 'Claimed' once you receive the money.</p>
          </SubSection>
          <SubSection title="Calculators" icon="🧮">
              <p>Access a suite of financial calculators: a basic one with AI query support, a currency converter, and planners for EMI, SIP (Systematic Investment Plan), SWP (Systematic Withdrawal Plan), and Goals.</p>
          </SubSection>
           <SubSection title="Debt Payoff Planner" icon="💳">
              <p>A brand new tool to help you manage and pay off your debts! Add your loans and credit cards, choose a strategy (Avalanche for highest interest or Snowball for smallest balance), and see a clear plan to become debt-free.</p>
          </SubSection>
      </Section>
      
      <Section title="Analysis & Insights" icon="💡">
        <SubSection title="Reports" icon="📈">
            <p>Visualize your income and expenses with detailed charts. You can filter by account, category, and date range, and even compare different periods. Now includes a Net Worth trend chart to see your progress over time!</p>
        </SubSection>
        <SubSection title="Financial Health" icon="❤️‍🩹">
            <p>Get a score out of 100 that measures your overall financial well-being, based on your savings rate, debt-to-income ratio, budget adherence, and emergency fund status. The AI Coach provides tips to improve it.</p>
        </SubSection>
        <SubSection title="AI Hub" icon="🧠">
            <p>A powerful AI command center. You can have a conversation with the AI about your finances, ask it to run "what-if" scenarios (e.g., "what if I save 500 more per month?"), or give it direct commands like "add 200 for coffee".</p>
        </SubSection>
      </Section>

      <Section title="Gamification" icon="🎮">
        <SubSection title="Achievements" icon="🏅">
            <p>Unlock badges for reaching financial milestones, like logging your first transaction, completing a goal, or maintaining a usage streak.</p>
        </SubSection>
        <SubSection title="Streaks & Challenges" icon="🔥">
            <p>Log a transaction every day to build your streak. Complete the daily challenge for an extra boost. You have a few 'Streak Freezes' that will automatically be used if you miss a day.</p>
        </SubSection>
      </Section>

      <Section title="Data & Settings" icon="🗄️">
         <SubSection title="Management Screens" icon="🗂️">
            <p>From the Hub, you can access dedicated screens to manage your Accounts, Categories, Contacts, Payees, and Senders, keeping your financial data organized.</p>
        </SubSection>
        <SubSection title="Data Management" icon="💾">
            <p>Use the <strong className="text-primary">Import/Export</strong> tool to download your data as a CSV or JSON file. For added security, you can create an encrypted, password-protected <strong className="text-primary">.pfh backup</strong> from App Settings.</p>
        </SubSection>
        <SubSection title="Trust Bin" icon="🗑️">
            <p>A safety net for deleted items. Anything you delete is held in the Trust Bin for a configurable period (default 30 days) before being permanently erased, giving you time to restore it if needed.</p>
        </SubSection>
      </Section>
    </div>
  );
};

export default ManualScreen;