import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {type AuthResponse, type User, loginUser, fetchUserData} from '@api';

export interface AuthState {
    token: string | null;
    user: User | null;
    loading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<AuthResponse>;
    finalizeLogin: (token: string) => Promise<void>;
    logout: () => void;
    initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            loading: false,
            error: null,


            login: async (email, password) => {
                set({loading: true, error: null});
                try {
                    const authData = await loginUser(email, password);

                    if (!authData.requires_2fa && authData.access_token) {
                        const userData = await fetchUserData(authData.access_token);

                        set({
                            token: authData.access_token,
                            user: userData,
                            loading: false
                        });
                    } else {
                        set({loading: false});
                    }
                    return authData;
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Login failed';
                    set({error: message, loading: false, token: null, user: null});
                    throw err instanceof Error ? err : new Error(message);
                }
            },

            finalizeLogin: async (token) => {
                set({loading: true, error: null});
                try {
                    const userData = await fetchUserData(token);
                    set({
                        token: token,
                        user: userData,
                        loading: false
                    });
                } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Failed to finalize login';
                    set({error: message, loading: false, token: null, user: null});
                    throw err instanceof Error ? err : new Error(message);
                }
            },

            initialize: async () => {
                const token = get().token;
                if (!token || get().user) return;

                try {
                    const userData = await fetchUserData(token);
                    set({user: userData});
                } catch (err) {
                    set({token: null, user: null});
                }
            },

            logout: () => {
                set({token: null, user: null, error: null});
            }
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                token: state.token,
            }),
        }
    )
);