import { Category, TransactionType } from '../types';

export const generateCategories = (): Category[] => {
    const categories: { name: string, type: TransactionType, parent: string | null, icon: string, children?: any[] }[] = [
        // Income
        { name: 'Salary', type: TransactionType.INCOME, parent: null, icon: '💼', children: [
            { name: 'Job', icon: '👨‍💻' }, { name: 'Part-time', icon: '🕒' }, { name: 'Freelance', icon: '🧑‍🔧' }, { name: 'Overtime Pay', icon: '🧾' }, { name: 'Performance Bonus', icon: '🎯' }
        ]},
        { name: 'Business', type: TransactionType.INCOME, parent: null, icon: '🏢', children: [
            { name: 'Product Sales', icon: '📦' }, { name: 'Service Income', icon: '🛠️' }, { name: 'Royalties', icon: '🎧' }, { name: 'Consulting Fees', icon: '🧮' }, { name: 'Affiliate Earnings', icon: '🧾' }
        ]},
        { name: 'Investments', type: TransactionType.INCOME, parent: null, icon: '📈', children: [
            { name: 'Dividends', icon: '💸' }, { name: 'Interest', icon: '🏦' }, { name: 'Capital Gains', icon: '📊' }, { name: 'Crypto Profits', icon: '🪙' }, { name: 'REIT Income', icon: '🏠' }
        ]},
        { name: 'Rental Income', type: TransactionType.INCOME, parent: null, icon: '🏠', children: [
            { name: 'Residential Rent', icon: '🏡' }, { name: 'Commercial Rent', icon: '🏬' }, { name: 'Airbnb/Short-Term', icon: '🛏️' }, { name: 'Storage Rental', icon: '🧺' }
        ]},
        { name: 'Gifts & Donations', type: TransactionType.INCOME, parent: null, icon: '🎁', children: [
            { name: 'Cash Gifts', icon: '💰' }, { name: 'Crowdfunding', icon: '🤝' }, { name: 'Inheritance', icon: '🧾' }, { name: 'Wedding Gifts', icon: '🎉' }, { name: 'Graduation Gifts', icon: '🎓' }
        ]},
        { name: 'Refunds & Rebates', type: TransactionType.INCOME, parent: null, icon: '🔁', children: [
            { name: 'Tax Refund', icon: '🧾' }, { name: 'Purchase Rebate', icon: '💳' }, { name: 'Cashback', icon: '💵' }, { name: 'Return Refund', icon: '🛍️' }, { name: 'Service Refund', icon: '🧼' }
        ]},
        { name: 'Other Income', type: TransactionType.INCOME, parent: null, icon: '🎲', children: [
            { name: 'Lottery', icon: '🎟️' }, { name: 'Prize Money', icon: '🏆' }, { name: 'Miscellaneous', icon: '❓' }, { name: 'Survey Rewards', icon: '🧠' }, { name: 'App Referral Bonus', icon: '📱' }
        ]},
        // Expenses
        { name: 'Housing', type: TransactionType.EXPENSE, parent: null, icon: '🏠', children: [
            { name: 'Rent', icon: '🏘️' }, { name: 'Mortgage', icon: '🏦' }, { name: 'Property Tax', icon: '🧾' }, { name: 'Repairs', icon: '🔧' }, { name: 'Home Improvement', icon: '🪜' }
        ]},
        { name: 'Utilities', type: TransactionType.EXPENSE, parent: null, icon: '🔌', children: [
            { name: 'Electricity', icon: '💡' }, { name: 'Water', icon: '🚰' }, { name: 'Gas', icon: '🔥' }, { name: 'Internet', icon: '🌐' }, { name: 'Phone', icon: '📞' }, { name: 'Cable TV', icon: '📡' }
        ]},
        { name: 'Food & Groceries', type: TransactionType.EXPENSE, parent: null, icon: '🍽️', children: [
            { name: 'Supermarket', icon: '🛒' }, { name: 'Dining Out', icon: '🍴' }, { name: 'Snacks', icon: '🍫' }, { name: 'Beverages', icon: '🧃' }, { name: 'Meal Delivery', icon: '🧑‍🍳' }
        ]},
        { name: 'Transportation', type: TransactionType.EXPENSE, parent: null, icon: '🚗', children: [
            { name: 'Fuel', icon: '⛽' }, { name: 'Public Transport', icon: '🚌' }, { name: 'Vehicle Maintenance', icon: '🔧' }, { name: 'Car Insurance', icon: '🚘' }, { name: 'Parking Fees', icon: '🅿️' }, { name: 'Ride-Hailing (Uber/Ola)', icon: '🚕' }
        ]},
        { name: 'Health & Insurance', type: TransactionType.EXPENSE, parent: null, icon: '🩺', children: [
            { name: 'Medical Bills', icon: '🧾' }, { name: 'Health Insurance', icon: '🛡️' }, { name: 'Gym', icon: '🏋️' }, { name: 'Medicines', icon: '💊' }, { name: 'Lab Tests', icon: '🧪' }, { name: 'Dental Care', icon: '🦷' }
        ]},
        { name: 'Education', type: TransactionType.EXPENSE, parent: null, icon: '📚', children: [
            { name: 'Tuition', icon: '🎓' }, { name: 'Books', icon: '📖' }, { name: 'Online Courses', icon: '💻' }, { name: 'Coaching Classes', icon: '🧠' }, { name: 'Exam Fees', icon: '📝' }
        ]},
        { name: 'Entertainment', type: TransactionType.EXPENSE, parent: null, icon: '🎉', children: [
            { name: 'Movies', icon: '🎬' }, { name: 'Subscriptions', icon: '📺' }, { name: 'Events', icon: '🎟️' }, { name: 'Gaming', icon: '🎮' }, { name: 'Music & Podcasts', icon: '🎧' }
        ]},
        { name: 'Shopping', type: TransactionType.EXPENSE, parent: null, icon: '🛍️', children: [
            { name: 'Clothing', icon: '👕' }, { name: 'Electronics', icon: '📱' }, { name: 'Home Goods', icon: '🪑' }, { name: 'Travel Gear', icon: '🧳' }, { name: 'Accessories', icon: '🕶️' }
        ]},
        { name: 'Finance', type: TransactionType.EXPENSE, parent: null, icon: '💳', children: [
            { name: 'Loan Payments', icon: '🏦' }, { name: 'Credit Card Bills', icon: '💳' }, { name: 'Bank Fees', icon: '🧾' }, { name: 'Interest Charges', icon: '📉' }, { name: 'Late Payment Penalties', icon: '🧾' }
        ]},
        { name: 'Savings & Investment', type: TransactionType.EXPENSE, parent: null, icon: '💼', children: [
            { name: 'Emergency Fund', icon: '🆘' }, { name: 'SIPs', icon: '📈' }, { name: 'Stock Purchases', icon: '📊' }, { name: 'Crypto Investments', icon: '🪙' }, { name: 'Real Estate Investment', icon: '🏠' }
        ]},
        { name: 'Personal Care', type: TransactionType.EXPENSE, parent: null, icon: '🧖', children: [
            { name: 'Salon', icon: '💇' }, { name: 'Skincare', icon: '🧴' }, { name: 'Hygiene Products', icon: '🧼' }, { name: 'Spa & Nails', icon: '💅' }, { name: 'Wellness Therapy', icon: '🧘' }
        ]},
        { name: 'Family & Kids', type: TransactionType.EXPENSE, parent: null, icon: '👨‍👩‍👧', children: [
            { name: 'School Fees', icon: '🏫' }, { name: 'Toys', icon: '🧸' }, { name: 'Childcare', icon: '🧑‍🍼' }, { name: 'Kids Clothing', icon: '🧥' }, { name: 'Lunch & Snacks', icon: '🍱' }
        ]},
        { name: 'Donations', type: TransactionType.EXPENSE, parent: null, icon: '🙏', children: [
            { name: 'Charity', icon: '❤️' }, { name: 'Religious Offerings', icon: '🕉️' }, { name: 'Clothing Donation', icon: '🧥' }, { name: 'Book Donation', icon: '📚' }
        ]},
        { name: 'Miscellaneous', type: TransactionType.EXPENSE, parent: null, icon: '🌀', children: [
            { name: 'Pet Care', icon: '🐶' }, { name: 'Gifts', icon: '🎁' }, { name: 'Unexpected Expenses', icon: '⚠️' }, { name: 'Travel Insurance', icon: '🧳' }, { name: 'Subscription Renewals', icon: '🧾' }
        ]},
    ];
    // System categories
    const systemCats: { name: string, type: TransactionType, parent: string | null, icon: string, children?: any[] }[] = [
        { name: 'Opening Balance', type: TransactionType.INCOME, parent: null, icon: '🏦' },
        { name: 'Transfers', type: TransactionType.INCOME, parent: null, icon: '↔️' },
        { name: 'Debt Repayment', type: TransactionType.INCOME, parent: null, icon: '🤝' },
        { name: 'Transfers', type: TransactionType.EXPENSE, parent: null, icon: '↔️' },
        { name: 'Goal Contributions', type: TransactionType.EXPENSE, parent: null, icon: '🎯' },
        { name: 'Money Lent', type: TransactionType.EXPENSE, parent: null, icon: '💸' },
        { name: 'Shop Sales', type: TransactionType.INCOME, parent: null, icon: '🏪' },
    ];
    
    const allCategories: Category[] = [];

    [...categories, ...systemCats].forEach(cat => {
        const parentId = self.crypto.randomUUID();
        allCategories.push({ id: parentId, name: cat.name, type: cat.type, parentId: null, icon: cat.icon });
        if (cat.children) {
            cat.children.forEach(child => {
                allCategories.push({ id: self.crypto.randomUUID(), name: child.name, type: cat.type, parentId: parentId, icon: child.icon });
            });
        }
    });

    return allCategories;
};

export const DEFAULT_CATEGORIES = generateCategories();