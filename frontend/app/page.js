import Header from './components/Header';
import Recorder from './components/Recorder';
import Instrucoes from "./components/Instrucoes";

export default function HomePage() {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow">
        {/* Instruções */}
        <div className="w-full md:w-1/3 bg-gray-100 p-4">
          <Instrucoes />
        </div>

        {/* Recorder */}
        <div className="w-full h-full md:w-2/3 bg-gray-100 p-4 items-center justify-center">
          <Recorder />
        </div>
      </div>
    </div>
  );
}
