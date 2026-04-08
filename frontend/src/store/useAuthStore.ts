import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {loginUser} from '@api/auth';
import type {AuthResponse, User} from '@api/types';

interface AuthState {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,

            login: async (email, password) => {
                set({loading: true, error: null});
                try {
                    const data = await loginUser(email, password);
                    if (!data.requires_2fa) {
                        set({
                            token: data.access_token,
                            user: data.user || null,
                            isAuthenticated: true,
                            loading: false
                        });
                    } else {
                        set({loading: false});
                    }
                    return data;
                } catch (err: any) {
                    const message = err instanceof Error ? err.message : 'Login failed';
                    set({error: message, loading: false});
                    throw err;
                }
            },

            logout: () => {
                set({token: null, user: null, isAuthenticated: false});
                localStorage.removeItem('auth-storage');
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state: AuthState) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);