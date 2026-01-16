import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { FaUser, FaLock } from "react-icons/fa";
import { StudentContext } from '../../context/StudentContext';
import Navbar from '@/components/landing/Navbar';
import PixelBlast from '@/components/ui/PixelBlast';

const getTheme = () =>
  typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
    ? 'dark'
    : 'light';

const StudentAuth = () => {
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginStudent } = useContext(StudentContext);
  
  React.useEffect(() => {
    console.log('StudentAuth page loaded');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Student login attempt with rollNo:', rollNo);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/student/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roll_no: rollNo, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Student login successful, response data:', data);
        toast.success("Login Successful!");
        loginStudent(data.user, data.token);
        navigate('/student/dashboard');
      } else {
        console.log('Student login failed, error:', data.message);
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
    <div className="relative min-h-screen w-full flex flex-col">
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
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Student Login</CardTitle>
            <CardDescription className="text-center">
              Enter your Roll Number and password to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rollNo">Roll Number</Label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-muted-foreground" />
                  <Input 
                    id="rollNo" 
                    type="text" 
                    placeholder="Ex: 21CS101" 
                    className="pl-10"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
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
                  Contact administration if you forgot your credentials.
              </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StudentAuth;
