"use client";

import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { searchClips } from "@/app/lib/clips";
import { motion, AnimatePresence } from "framer-motion";
import { SearchResults } from "../types";
import Link from "next/link";
import { followUser } from "@/app/lib/users";
import { isFollowingEndpoint } from "@/app/lib/users";
import { useRouter } from "next/navigation";
import { useUser } from "../context/userContext";

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<SearchResults>({ clips: [], users: [] });
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [followStates, setFollowStates] = useState<{ [key: string]: boolean }>({});
    const router = useRouter();
    const { user } = useUser();

    const handleFollow = async (userId: string) => {
        if (!user?.id) {
            window.location.href = "/login";
            return;
        }

        try {
            const response = await followUser(user.id, userId);
            if (response.success) {
                setFollowStates((prev) => ({
                    ...prev,
                    [userId]: !prev[userId],
                }));
            }
        } catch (error) {
            console.error("Failed to follow user:", error);
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            setIsLoading(true);
            const timer = setTimeout(async () => {
                try {
                    const searchResults = await searchClips(searchQuery);
                    setResults(searchResults);

                    if (searchResults.users.length > 0 && user?.id) {
                        const followStatePromises = searchResults.users.map((user) => isFollowingEndpoint(user.id, user.id));
                        const followStateResults = await Promise.all(followStatePromises);

                        const newFollowStates: { [key: string]: boolean } = {};
                        searchResults.users.forEach((user, index) => {
                            newFollowStates[user.id] = followStateResults[index];
                        });
                        setFollowStates(newFollowStates);
                    }
                } catch (error) {
                    console.error("Search failed:", error);
                    setResults({ clips: [], users: [] });
                } finally {
                    setIsLoading(false);
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setIsLoading(false);
            setResults({ clips: [], users: [] });
            setFollowStates({});
        }
    }, [searchQuery, user?.id]);

    useEffect(() => {
        if (searchQuery.trim()) {
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    }, [searchQuery]);

    return (
        <div className="relative z-20 w-[800px] max-w-md">
            <div className="relative z-20">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <FaSearch className="text-light" />
                </div>
                <input
                    id="search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                        if (searchQuery.trim()) {
                            setShowResults(true);
                        }
                    }}
                    placeholder="Search..."
                    className="bg-secondary placeholder-light/70 border-border focus:border-accent focus:bg-secondary w-full rounded-xl border py-2 pr-4 pl-11 text-lg text-white outline-hidden transition-all duration-200"
                />
            </div>

            <AnimatePresence>
                {showResults && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-10 bg-black/20 backdrop-blur-xs"
                            onClick={() => setShowResults(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{
                                duration: 0.2,
                                ease: "easeOut",
                            }}
                            className="bg-secondary border-border absolute top-full left-0 z-20 mt-2 w-full overflow-hidden rounded-lg border shadow-lg"
                        >
                            {isLoading ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-light p-4 text-center">
                                    <div
                                        className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent"
                                        aria-label="loading"
                                    ></div>
                                </motion.div>
                            ) : results.clips.length > 0 || results.users.length > 0 ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.05 }}>
                                    {results.users.length > 0 && (
                                        <div className="border-border border-b">
                                            <div className="text-light/70 px-3 py-2 text-sm">Users</div>
                                            {results.users.map((user, index) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-dark/50 border-border cursor-pointer border-b p-3 transition-colors duration-150 last:border-0"
                                                    onClick={() => setShowResults(false)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <Link href={`/user/${user.username}`} className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-accent/20 h-8 w-8 rounded-full">
                                                                    {user.avatar && (
                                                                        <img
                                                                            src={user.avatar}
                                                                            alt={user.username}
                                                                            className="h-full w-full rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium text-white">{user.username}</h3>
                                                                    <p className="text-light text-sm">{user.followers} followers</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        {user?.id !== user.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleFollow(user.id);
                                                                }}
                                                                className={`rounded-full px-4 py-1 ${
                                                                    user?.id ? "bg-accent/10 hover:bg-accent/20 text-accent" : "bg-med hover:bg-dark text-light"
                                                                } text-sm font-medium transition-colors`}
                                                            >
                                                                {!user?.id ? "Sign in to follow" : followStates[user.id] ? "Following" : "Follow"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {results.clips.length > 0 && (
                                        <div>
                                            <div className="text-light/70 px-3 py-2 text-sm">Clips</div>
                                            {results.clips.map((result, index) => (
                                                <motion.div
                                                    key={result.upload_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="hover:bg-secondary-hover border-border cursor-pointer border-b p-3 transition-colors duration-150 last:border-0"
                                                    onClick={() => {
                                                        setShowResults(false);
                                                        router.push(`/clip/${result.upload_id}`);
                                                    }}
                                                    onMouseOver={() => {
                                                        router.prefetch(`/clip/${result.upload_id}`);
                                                    }}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="font-medium text-white">{result.upload_name}</h3>
                                                            <p className="text-light text-sm">{result.username}</p>
                                                        </div>
                                                        <span className="text-light text-sm">{result.length}</span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-light p-4 text-center">
                                    No results found
                                </motion.div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
