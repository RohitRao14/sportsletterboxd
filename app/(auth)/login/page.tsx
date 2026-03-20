import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Sports <span className="text-blue-400">LB</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Your personal sports diary</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
