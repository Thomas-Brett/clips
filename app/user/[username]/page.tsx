import Header from "@/app/components/Header";
import UserProfileClient from "./UserProfileClient";
import { getUserByUsername } from "@/app/lib/users";
import { getUserClips } from "@/app/lib/clips";
import { notFound } from "next/navigation";

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
};

export default async function UserProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const user = await getUserByUsername(username);

    if (!user) {
        notFound();
    }

    const clips = await getUserClips(username);

    const formattedJoinDate = new Date(user.createdAt).toLocaleDateString("en-US", DATE_FORMAT_OPTIONS);

    const userWithFormattedDate = {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
        formattedJoinDate,
    };

    return (
        <div className="flex h-screen w-screen flex-col">
            <Header />
            <UserProfileClient initialUser={userWithFormattedDate} initialClips={clips} />
        </div>
    );
}
