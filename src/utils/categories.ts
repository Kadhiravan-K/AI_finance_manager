import { Category } from '../types';

export const defaultCategories: Category[] = [
  { id: '1', name: 'Food & Dining', icon: 'Utensils', color: '#FF5733', type: 'expense' },
  { id: '2', name: 'Transportation', icon: 'Car', color: '#33FF57', type: 'expense' },
  { id: '3', name: 'Housing', icon: 'Home', color: '#3357FF', type: 'expense' },
  { id: '4', name: 'Salary', icon: 'Briefcase', color: '#FFD700', type: 'income' },
];

export const getCategoryById = (id: string, categories: Category[]) => {
  return categories.find(c => c.id === id) || defaultCategories[0];
};

export const getCategoryIcon = (id: string, categories: Category[]) => {
  const category = getCategoryById(id, categories);
  return category.icon;
};

export const getCategoryColor = (id: string, categories: Category[]) => {
  const category = getCategoryById(id, categories);
  return category.color;
};
