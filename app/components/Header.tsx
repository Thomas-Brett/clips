"use client";

import Link from "next/link";
import { FaChessRook, FaRightToBracket, FaPlus } from "react-icons/fa6";
import SearchBar from "./SearchBar";
import Button from "./primitives/Button";
import { useUser } from "../context/userContext";
import { useModal } from "../context/modalContext";

export default function Header() {
    const { user } = useUser();
    const { setIsOpen } = useModal();

    return (
        <div className="bg-primary border-border flex h-16 w-full flex-row items-center justify-center border-b">
            <div className="flex w-[75%] flex-row items-center gap-4">
                <Link href="/" className="flex flex-row items-center gap-2">
                    <FaChessRook className="text-accent mx-4 text-4xl" />
                    <h1 className="text-light text-3xl font-bold">Clips</h1>
                </Link>
                <div className="flex flex-1 justify-center">
                    <SearchBar />
                </div>
                <div className="mr-4 flex flex-row items-center gap-4">
                    {user && (
                        <Button onClick={() => setIsOpen(true)} customClasses="text-xl">
                            <FaPlus className="mr-2" /> Upload
                        </Button>
                    )}
                    {user === null && (
                        <Link href="/login" className="text-light hover:text-accent text-xl transition-colors duration-200">
                            <FaRightToBracket />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
