"use client";

import Link from "next/link";
import { FaCircleNotch } from "react-icons/fa6";
import { motion } from "framer-motion";

interface ButtonProps {
    children: React.ReactNode;
    customClasses?: string;
    url?: string;
    transparent?: boolean;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    [key: string]: any;
}

export default function Button({ children, customClasses = "", url, transparent, loading, disabled = false, onClick, ...rest }: ButtonProps) {
    const baseClasses =
        "flex items-center text-xl justify-center py-3 px-4 rounded-md text-sm leading-none font-medium duration-150 text-white text-center select-none cursor-pointer";
    const transparentClasses = "bg-transparent border-white border hover:bg-zinc-500/40 active:bg-zinc-500/30";
    const accentClasses = "bg-accent hover:bg-accent-hover active:bg-accent-active";
    const disabledClasses = "opacity-50 pointer-events-none";

    const classList = `${baseClasses} ${transparent ? transparentClasses : accentClasses} ${disabled && disabledClasses} ${customClasses}`;

    return url ? (
        <Link href={url} className={classList} {...rest}>
            {loading ? <FaCircleNotch className="animate-spin" /> : children}
        </Link>
    ) : (
        <motion.button whileTap={{ scale: 0.95 }} onMouseDown={onClick} className={classList} {...rest} disabled={disabled}>
            {loading ? <FaCircleNotch className="animate-spin" /> : children}
        </motion.button>
    );
}
