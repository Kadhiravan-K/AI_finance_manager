

import { supabase } from '../types';

export const db = {
    async fetchAll<T>(table: string, userId: string): Promise<T[]> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('user_id', userId);
        if (error) throw error;
        return data as T[];
    },

    async upsert<T extends { id: string }>(table: string, item: T, userId: string): Promise<T> {
        const payload = { ...item, user_id: userId };
        const { data, error } = await supabase
            .from(table)
            .upsert(payload)
            .select()
            .single();
        if (error) throw error;
        return data as T;
    },

    async delete(table: string, id: string, userId: string): Promise<void> {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
    },

    async bulkUpsert<T>(table: string, items: T[], userId: string): Promise<void> {
        const payload = items.map(item => ({ ...item, user_id: userId }));
        const { error } = await supabase
            .from(table)
            .upsert(payload);
        if (error) throw error;
    }
};

export const auth = {
    async signUp(email: string, pass: string) {
        // Fix: In v2, signUp is a direct method on auth.
        return await supabase.auth.signUp({ email, password: pass });
    },
    async signIn(email: string, pass: string) {
        // Fix: In v2, signInWithPassword is the correct method for email/password.
        return await supabase.auth.signInWithPassword({ email, password: pass });
    },
    async signOut() {
        // Fix: signOut is an async method on auth in v2.
        return await supabase.auth.signOut();
    },
    async getSession() {
        // Fix: getSession is an async method on auth in v2.
        const { data } = await supabase.auth.getSession();
        return data.session;
    }
};
