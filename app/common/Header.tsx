import Link from "next/link";
import { FaChessRook, FaUserPlus } from "react-icons/fa6";
import { getUser } from "../lib/auth";
import { LogoutButton } from "./LogoutButton";
import { UploadButton } from "./UploadButton";

export default async function Header() {
    const user = await getUser();

    return (
        <div className="flex flex-row items-center h-16 w-full bg-panel border-b border-border">
            <Link href="/" className="flex flex-row items-center gap-2">
                <FaChessRook className="text-accent text-4xl mx-4" />
                <h1 className="text-light text-3xl font-bold">Clips</h1>
            </Link>

            <div className="flex flex-row items-center gap-4 mr-4 ml-auto">
                {user && <UploadButton />}
                {!user ? (
                    <Link href="/login" className="text-light text-2xl hover:text-accent transition-colors duration-200">
                        <FaUserPlus />
                    </Link>
                ) : (
                    <LogoutButton />
                )}
            </div>
        </div>
    );
}
