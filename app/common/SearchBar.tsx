"use client";

import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { searchClips } from "@/app/lib/clips";
import { motion, AnimatePresence } from "framer-motion";
import { SearchResults } from "../types";
import Link from 'next/link';
import { followUser } from "@/app/lib/users";
import { getUser } from "../lib/auth";
import { isFollowingEndpoint } from "@/app/lib/users";

export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState("");
    const [results, setResults] = useState<SearchResults>({ clips: [], users: [] });
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [followStates, setFollowStates] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUser();
            setCurrentUser(user);
        };
        fetchUser();
    }, []);

    const handleFollow = async (userId: string) => {
        if (!currentUser?.id) {
            window.location.href = '/login';
            return;
        }
        
        try {
            const response = await followUser(currentUser.id, userId);
            if (response.success) {
                setFollowStates(prev => ({
                    ...prev,
                    [userId]: !prev[userId]
                }));
            }
        } catch (error) {
            console.error('Failed to follow user:', error);
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            setIsLoading(true);
            const timer = setTimeout(async () => {
                try {
                    const searchResults = await searchClips(searchQuery);
                    setResults(searchResults);
                    
                    if (searchResults.users.length > 0 && currentUser?.id) {
                        const followStatePromises = searchResults.users.map(user => 
                            isFollowingEndpoint(currentUser.id, user.id)
                        );
                        const followStateResults = await Promise.all(followStatePromises);
                        
                        const newFollowStates: {[key: string]: boolean} = {};
                        searchResults.users.forEach((user, index) => {
                            newFollowStates[user.id] = followStateResults[index];
                        });
                        setFollowStates(newFollowStates);
                    }
                } catch (error) {
                    console.error('Search failed:', error);
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
    }, [searchQuery, currentUser?.id]);

    useEffect(() => {
        if (searchQuery.trim()) {
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    }, [searchQuery]);

    return (
        <div className="relative w-[800px] max-w-md z-20">
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
                    className="w-full rounded-xl bg-med py-2 pl-11 pr-4 text-lg text-white placeholder-light/70 
                             border border-border focus:border-accent outline-none focus:bg-med transition-all duration-200"
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
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-10" 
                            onClick={() => setShowResults(false)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ 
                                duration: 0.2,
                                ease: "easeOut"
                            }}
                            className="absolute top-full left-0 w-full mt-2 bg-med border border-border 
                                     rounded-lg shadow-lg overflow-hidden z-20"
                        >
                            {isLoading ? (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 text-center text-light"
                                >
                                    <div className="animate-spin inline-block w-6 h-6 border-2 border-current 
                                                  border-t-transparent rounded-full" 
                                         aria-label="loading">
                                    </div>
                                </motion.div>
                            ) : results.clips.length > 0 || results.users.length > 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ staggerChildren: 0.05 }}
                                >
                                    {results.users.length > 0 && (
                                        <div className="border-b border-border">
                                            <div className="px-3 py-2 text-sm text-light/70">Users</div>
                                            {results.users.map((user, index) => (
                                                <motion.div
                                                    key={user.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-3 hover:bg-dark/50 cursor-pointer border-b border-border 
                                                             last:border-0 transition-colors duration-150"
                                                    onClick={() => setShowResults(false)}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <Link href={`/user/${user.username}`} className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-accent/20">
                                                                    {user.avatar && (
                                                                        <img 
                                                                            src={user.avatar} 
                                                                            alt={user.username}
                                                                            className="w-full h-full rounded-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-white font-medium">{user.username}</h3>
                                                                    <p className="text-light text-sm">{user.followers} followers</p>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                        {currentUser?.id !== user.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    handleFollow(user.id);
                                                                }}
                                                                className={`px-4 py-1 rounded-full ${
                                                                    currentUser ? 'bg-accent/10 hover:bg-accent/20 text-accent' : 'bg-med hover:bg-dark text-light'
                                                                } text-sm font-medium transition-colors`}
                                                            >
                                                                {!currentUser ? 'Sign in to follow' : (followStates[user.id] ? 'Following' : 'Follow')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {results.clips.length > 0 && (
                                        <div>
                                            <div className="px-3 py-2 text-sm text-light/70">Clips</div>
                                            {results.clips.map((result, index) => (
                                                <motion.div
                                                    key={result.upload_id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="p-3 hover:bg-dark/50 cursor-pointer border-b border-border 
                                                             last:border-0 transition-colors duration-150"
                                                    onClick={() => {
                                                        setShowResults(false);
                                                    }}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-white font-medium">{result.upload_name}</h3>
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
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 text-center text-light"
                                >
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