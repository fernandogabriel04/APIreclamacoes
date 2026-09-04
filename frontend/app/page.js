import Header from "./components/Header";
import Hero from "./components/Hero";
import ComoFunciona from "./components/ComoFunciona";
import Recorder from "./components/Recorder";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gelo">
      <Header />
      <Hero />
      <ComoFunciona />
      <Recorder />
      <Footer />
    </main>
  );
}
