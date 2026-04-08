import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {loginUser} from '@api/auth';
import type {AuthResponse, User} from '@api/types';

//TODO: UpdateUser
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
                    set({error: err.message, loading: false});
                    throw err;
                }
            },

            logout: () => {
                set({token: null, user: null, isAuthenticated: false});
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
                user: state.user,
                isAuthenticated: state.isAuthenticated
            }),
        }
    )
);