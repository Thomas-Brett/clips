"use client";

import { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { UploadModal } from "./UploadModal";

export function UploadButton() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="py-2 px-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors duration-200 font-bold text-lg flex items-center justify-center"
            >
                <FaPlus className="mr-2" />
                Upload
            </button>
            <UploadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
} 