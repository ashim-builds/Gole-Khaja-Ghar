import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    navigate(`/login${query ? `?${query}` : ""}`, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          Redirecting to Sign In...
        </p>
      </div>
    </div>
  );
}

