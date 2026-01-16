import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { TeacherContext } from '../../context/TeacherContext';
import Navbar from '@/components/landing/Navbar';
import PixelBlast from '@/components/ui/PixelBlast';

const getTheme = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

const TeacherAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginTeacher } = useContext(TeacherContext);
  
  React.useEffect(() => {
    console.log('TeacherAuth page loaded');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Teacher login attempt with email:', email);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/teacher/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Teacher login successful, response data:', data);
        toast.success("Login Successful!");
        loginTeacher(data.user, data.token);
        navigate('/teacher/dashboard');
      } else {
        console.log('Teacher login failed, error:', data.message);
        toast.error(data.message || "Login Failed");
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <PixelBlast
          variant="square"
          pixelSize={3}
          color={getTheme() === 'dark' ? 'var(--accent)' : 'var(--accent)'}
          patternScale={2}
          patternDensity={1}
          liquid={false}
          enableRipples={true}
          edgeFade={0.5}
          style={{ width: '100vw', height: '100vh' }}
        />
      </div>
      {/* <Navbar /> */}
      <div className="flex items-center justify-center min-h-screen p-4 pt-20">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-primary">Teacher Portal</CardTitle>
            <CardDescription className="text-center">
              Enter your Email and password to access the faculty dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="teacher@example.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                  Authorized personnel only.
              </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TeacherAuth;
