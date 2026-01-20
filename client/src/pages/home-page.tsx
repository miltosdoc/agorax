import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { PollList } from "@/components/poll/poll-list";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-6 pb-16 sm:pb-6">
        <PollList />
      </main>
      <Footer />
    </div>
  );
}
