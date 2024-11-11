"use client";

import { FaRightFromBracket } from "react-icons/fa6";
import { logout } from "../lib/auth";
import { useRouter } from "next/navigation";

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push("/login");
    };

    return (
        <button onClick={handleLogout} className="text-light text-2xl hover:text-accent transition-colors duration-200">
            <FaRightFromBracket />
        </button>
    );
} 