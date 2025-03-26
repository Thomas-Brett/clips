"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { User } from "@prisma/client";
import { getUser } from "../lib/auth";

interface UserContextType {
    user: Partial<User> | null;
    setUser: (user: Partial<User> | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}

export function UserProvider({ initialUser, children }: { initialUser: Partial<User> | null; children: React.ReactNode }) {
    const [user, setUser] = useState<Partial<User> | null>(initialUser);

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUser();
            setUser(user);
        };
        fetchUser();
    }, []);

    return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>;
}
