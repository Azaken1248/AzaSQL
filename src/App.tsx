import SQLPlusSimulator from "./components/SQLPlusSimulator";

const App: React.FC = () => {
  return (
    <main className="flex h-screen w-screen flex-col items-center bg-zinc-900 p-4 font-sans text-gray-200">
      <SQLPlusSimulator />
    </main>
  );
};

export default App;
