import LoginForm from "./LoginForm";
import { StadiumBackground } from "@/components/StadiumBackground";

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <StadiumBackground />
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Box<span className="text-blue-400">Scord</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Your personal sports diary</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
