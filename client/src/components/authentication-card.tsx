import { useState } from "react";
import { Shield, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface AuthenticationCardProps {
  onSuccess: (sessionId: string, username: string) => void;
  isAuthenticated: boolean;
}

export function AuthenticationCard({ onSuccess, isAuthenticated }: AuthenticationCardProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const authMutation = useMutation({
    mutationFn: api.authenticate,
    onSuccess: (data) => {
      if (data.success) {
        onSuccess(data.sessionId, username);
        toast({
          title: "Authentication Successful",
          description: "You are now connected to the University of Alberta proxy.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Authentication Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }
    authMutation.mutate({ username, password });
  };

  if (isAuthenticated) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-green-700">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Successfully authenticated with University of Alberta proxy</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">University Proxy Authentication</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 mb-2">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your CCID"
                className="focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div>
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-blue-700"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending ? "Authenticating..." : "Authenticate"}
              </Button>
            </div>
          </div>
        </form>
        
        <div className="flex items-start space-x-2 mt-3 text-sm text-gray-600">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Use your University of Alberta credentials to access full-text articles through the library proxy.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
