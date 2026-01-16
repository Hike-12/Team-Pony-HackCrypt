import React, { useState } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import StudentQRScanner from '@/components/student/StudentQRScanner';
import { motion } from 'framer-motion';
import { QrCode, Wifi, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const StudentQRAttendance = () => {
    return (
        <div className="flex min-h-screen w-full bg-background font-sans">
            <StudentSidebar />
            <main className="flex-1 transition-all duration-300 md:ml-64 ml-0 flex flex-col items-center justify-center p-6 md:p-12 mb-20 md:mb-0">
                <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Context & Instructions */}
                    <div className="space-y-6 md:py-8">
                        <div>
                            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
                                <QrCode className="w-5 h-5" />
                                <span>Attendance Portal</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                Scan QR Code
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg">
                                Use your device camera to scan the one-time code displayed on the classroom screen.
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Prerequisites</h3>

                            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card shadow-sm">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <Wifi className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Stable Connection</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Ensure you are connected to the official college Wi-Fi network.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg border bg-card shadow-sm">
                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-foreground">Browser Permissions</h4>
                                    <p className="text-sm text-muted-foreground mt-1">Allow camera access when prompted by your browser.</p>
                                </div>
                            </div>
                        </div>

                        <Alert variant="default" className="bg-muted/50 border-primary/20">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            <AlertTitle className="text-primary font-medium">Need Help?</AlertTitle>
                            <AlertDescription className="text-muted-foreground text-xs mt-1">
                                If scanning fails repeatedly, please contact your instructor immediately to mark manual attendance.
                            </AlertDescription>
                        </Alert>
                    </div>

                    {/* Right Column: Scanner Module */}
                    <div className="w-full">
                        <Card className="overflow-hidden border-2 border-muted shadow-xl">
                            <CardHeader className="bg-muted/20 border-b pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold">Live Scanner</CardTitle>
                                        <CardDescription className="text-xs">Active session</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                        <span className="text-xs font-medium text-muted-foreground">Ready</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[400px]">
                                <StudentQRScanner />
                            </CardContent>
                        </Card>
                        <p className="text-xs text-center text-muted-foreground mt-4">
                            The scanner will automatically detect and verify the QR code.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentQRAttendance;
