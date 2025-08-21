import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-md mx-4">
        <div className="text-8xl font-bold text-white mb-4 animate-fade-in">404</div>
        <h1 className="text-2xl font-bold text-white mb-2 animate-fade-in">Page Not Found</h1>
        <p className="text-white/80 mb-6 animate-fade-in">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center animate-fade-in">
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="bg-white text-primary hover:bg-white/90"
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
