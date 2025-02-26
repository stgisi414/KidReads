import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center mb-6">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Oops!</h1>
            <p className="text-xl text-gray-700 mt-2">Page Not Found</p>
          </div>

          <p className="mt-4 text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <Link href="/">
            <Button className="w-full" size="lg">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}