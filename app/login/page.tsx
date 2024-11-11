"use client";

import { FaChessRook, FaSpinner } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { login, getUser } from "../lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
            <div className="flex items-center justify-center min-h-screen w-screen bg-primary">
                <FaSpinner className="animate-spin text-accent text-4xl" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen w-screen bg-primary">
            <div className="bg-panel p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <FaChessRook className="text-accent text-6xl mb-4" />
                    <h1 className="text-white text-3xl font-bold">Log In to Clips</h1>
                </div>
                
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-1">
                        <label htmlFor="username" className="text-light block font-bold uppercase">USERNAME</label>
                        <input 
                            type="text" 
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full p-3 rounded-lg bg-med text-white text-lg border border-border focus:border-accent focus:outline-none transition-colors duration-200"
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label htmlFor="password" className="text-light block font-bold uppercase">PASSWORD</label>
                        <input 
                            type="password" 
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full p-3 rounded-lg bg-med text-white text-lg border border-border focus:border-accent focus:outline-none transition-colors duration-200"
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 font-semibold text-sm">{error}</p>
                    )}

                    <div className="space-y-3 mt-2">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors duration-200 font-bold text-lg flex items-center justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                        
                        <Link 
                            href="/register"
                            className={`block w-full py-3 px-4 bg-transparent border border-white text-white rounded-lg hover:bg-panel-hover transition-colors duration-200 font-bold text-lg text-center ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={e => isSubmitting && e.preventDefault()}
                        >
                            Register
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
