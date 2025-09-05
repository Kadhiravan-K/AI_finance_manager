import { GlossaryEntry } from '../types';

export const DEFAULT_GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    id: 'glossary-ai-parse',
    term: 'AI Parse',
    emoji: '🤖',
    definition: 'An intelligent feature that automatically extracts transaction details from text.',
    usageLogic: 'Paste a bank SMS or notification into the "Quick Add" form. The AI reads it and fills in the amount, description, and category for you.',
    example: 'Pasting "INR 500 spent on Zomato" results in a ₹500 expense categorized under "Food & Groceries / Dining Out".',
    tags: ['ai', 'automation', 'transaction'],
  },
  {
    id: 'glossary-split-transaction',
    term: 'Split Transaction',
    emoji: '➗',
    definition: 'Divides a single expense among multiple people or categories.',
    usageLogic: 'In the transaction form, enable "Itemize & Split". You can split the total amount equally, by percentage, by shares, or manually assign amounts to different contacts.',
    example: 'A ₹1200 dinner bill can be split equally among 3 friends, with each person owing ₹400.',
    tags: ['expense', 'group', 'debt'],
  },
  {
    id: 'glossary-recurring-bill',
    term: 'Recurring Bills',
    emoji: '📅',
    definition: 'Automates the tracking of payments that occur on a regular schedule.',
    usageLogic: 'Set up a bill with its amount, category, and frequency (e.g., monthly, yearly). The app will show it as "Upcoming" when the due date approaches.',
    example: 'Create a recurring bill for your ₹15,000 rent payment due on the 1st of every month.',
    tags: ['automation', 'bills', 'scheduled'],
  },
  {
    id: 'glossary-trust-bin',
    term: 'Trust Bin',
    emoji: '🗑️',
    definition: 'A temporary holding area for deleted items before they are permanently removed.',
    usageLogic: 'When you delete an item (like a transaction or account), it goes to the Trust Bin. You can restore it from there for a limited time (default is 30 days).',
    example: 'If you accidentally delete a transaction, go to the Trust Bin via the "More" screen to restore it.',
    tags: ['data', 'safety', 'delete'],
  },
  {
    id: 'glossary-financial-health',
    term: 'Financial Health Score',
    emoji: '❤️‍🩹',
    definition: 'A score out of 100 that measures your overall financial well-being.',
    usageLogic: 'The score is calculated based on four pillars: your savings rate, debt-to-income ratio, budget adherence, and emergency fund status. Improve the score by saving more, reducing debt, and sticking to your budgets.',
    example: 'A score of 85 indicates excellent financial health, while a score of 40 suggests there are areas needing improvement.',
    tags: ['analysis', 'health', 'score'],
  },
];
