import Header from "./common/Header";
import Main from "./Main";
export default async function Page() {
 
  return (
    <div className="flex flex-col h-screen w-screen">
      <Header />
      <Main />
    </div>
  )
}