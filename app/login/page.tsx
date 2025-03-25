"use client";

import { FaChessRook, FaSpinner } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { login, getUser } from "../lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../components/primitives/Button";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await getUser();
            if (user) {
                router.push("/");
                return;
            }
            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) return;

        setIsSubmitting(true);
        try {
            const result = await login(username, password);

            if (!result.success) {
                setError(result.error || "An unknown error occurred");
                setIsSubmitting(false);
            } else {
                router.push("/");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : "An unknown error occurred");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-primary flex min-h-screen w-screen items-center justify-center">
                <FaSpinner className="text-accent animate-spin text-4xl" />
            </div>
        );
    }

    return (
        <div className="bg-secondary flex min-h-screen w-screen items-center justify-center">
            <div className="bg-primary w-full max-w-md rounded-lg p-8 shadow-lg">
                <div className="mb-8 flex flex-col items-center">
                    <FaChessRook className="text-accent mb-4 text-6xl" />
                    <h1 className="text-3xl font-bold text-white">Log In to Clips</h1>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <label htmlFor="username" className="text-light block font-bold uppercase">
                            USERNAME
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-med border-border focus:border-accent w-full rounded-lg border p-3 text-lg text-white transition-colors duration-200 focus:outline-hidden"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="text-light block font-bold uppercase">
                            PASSWORD
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            className="bg-med border-border focus:border-accent w-full rounded-lg border p-3 text-lg text-white transition-colors duration-200 focus:outline-hidden"
                        />
                    </div>

                    {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

                    <div className="mt-2 space-y-3">
                        <Button type="submit" customClasses="w-full py-4 text-xl" loading={isSubmitting} disabled={isSubmitting}>
                            Login
                        </Button>

                        <Link
                            href="/register"
                            className={`hover:bg-panel-hover block w-full rounded-lg border border-white bg-transparent px-4 py-3 text-center text-lg font-bold text-white transition-colors duration-200 ${isSubmitting ? "cursor-not-allowed opacity-50" : ""}`}
                            onClick={(e) => isSubmitting && e.preventDefault()}
                        >
                            Register
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
