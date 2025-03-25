import Header from "./components/Header";
import Main from "./Main";
import { UserProvider } from "./context/userContext";
import { ModalProvider } from "./context/modalContext";
import { getUser } from "./lib/auth";
import UploadModal from "./UploadModal";

export default async function Page() {
    const user = await getUser();

    return (
        <div className="flex h-screen w-screen flex-col">
            <UserProvider initialUser={user}>
                <ModalProvider>
                    <Header />
                    <Main />
                    <UploadModal />
                </ModalProvider>
            </UserProvider>
        </div>
    );
}
