"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentUserAction, fetchEmployeeAction, syncSessionAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import type { User, Employee } from "@/types";

type UserContextType = {
    user: (Employee & { name: string }) | null;
    isLoading: boolean;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<(Employee & { name: string }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        try {
            const tabToken = sessionStorage.getItem("auth_token");
            const session = await getCurrentUserAction();

            // If we have a tab-specific token, ensure it's the one active in the cookie
            if (tabToken) {
                let decodedToken;
                try {
                    decodedToken = JSON.parse(atob(tabToken.split('.')[1]));
                } catch (e) {
                    console.error("Failed to decode tab token");
                }

                if (decodedToken && (!session || session.id !== decodedToken.id)) {
                    console.log("Session mismatch detected: syncing tab token to cookie...");
                    await syncSessionAction(tabToken);
                    // Re-fetch session after sync
                    const newSession = await getCurrentUserAction();
                    if (newSession) {
                        const emp = await fetchEmployeeAction(newSession.id);
                        if (emp) {
                            setUser({ ...emp, name: `${emp.firstName} ${emp.lastName}` });
                            return;
                        }
                    }
                }
            }

            if (session) {
                const emp = await fetchEmployeeAction(session.id);
                if (emp) {
                    const newUser = { ...emp, name: `${emp.firstName} ${emp.lastName}` };
                    console.log(`UserProvider: Session refreshed for ${newUser.name} (${newUser.role})`);
                    setUser(newUser);
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error("Failed to fetch user session:", error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        const { logoutAction } = await import("@/app/actions");
        await logoutAction();
        sessionStorage.removeItem("auth_token");
        setUser(null);
        router.replace("/");
    }, [router]);

    useEffect(() => {
        refreshUser();

        // Sync session on focus for multi-tab isolation
        const handleFocus = () => {
            console.log("Window focused: ensuring session isolation...");
            refreshUser();
        };

        window.addEventListener("focus", handleFocus);
        return () => window.removeEventListener("focus", handleFocus);
    }, [refreshUser]);

    return (
        <UserContext.Provider value={{ user, isLoading, refreshUser, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
