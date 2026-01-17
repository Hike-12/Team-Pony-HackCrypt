import React, { useState, useEffect, useContext } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { StudentContext } from '@/context/StudentContext';
import {
    FaUser,
    FaIdCard,
    FaPhone,
    FaVenusMars,
    FaChalkboardTeacher,
    FaCalendarAlt,
    FaEnvelope,
    FaImage,
    FaQrcode,
    FaTimes,
    FaUniversity,
    FaGraduationCap,
    FaMapMarkerAlt,
    FaDownload
} from 'react-icons/fa';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { student } = useContext(StudentContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQRModal, setShowQRModal] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [student]);

    const fetchProfile = async () => {
        try {
            const studentId = student?.student_id || student?.id;

            if (!studentId) {
                // Use data from context if no backend available
                setProfileData({
                    full_name: student?.name || 'N/A',
                    roll_no: student?.roll_no || 'N/A',
                    phone: student?.phone || 'N/A',
                    gender: student?.gender || 'N/A',
                    class_name: student?.class_name || 'N/A',
                    division: student?.division || 'A',
                    image_url: student?.image_url || null,
                    email: student?.email || 'N/A',
                    created_at: student?.created_at || new Date().toISOString(),
                    address: "Campus Hostel, Block B", // Placeholder
                    blood_group: "O+" // Placeholder
                });
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/student/auth/profile/${studentId}`);
            const data = await response.json();

            if (data.success) {
                setProfileData(data.data);
            } else {
                toast.error('Failed to load profile');
                // Fallback to context data
                setProfileData({
                    full_name: student?.name || 'N/A',
                    roll_no: student?.roll_no || 'N/A',
                    phone: student?.phone || 'N/A',
                    gender: student?.gender || 'N/A',
                    class_name: student?.class_name || 'N/A',
                    division: student?.division || 'A',
                    image_url: student?.image_url || null,
                    email: student?.email || 'N/A',
                    created_at: student?.created_at || new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfileData({
                full_name: student?.name || 'N/A',
                roll_no: student?.roll_no || 'N/A',
                phone: student?.phone || 'N/A',
                gender: student?.gender || 'N/A',
                class_name: student?.class_name || 'N/A',
                division: student?.division || 'A',
                image_url: student?.image_url || null,
                email: student?.email || 'N/A',
                created_at: student?.created_at || new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Compact Profile Field
    const ProfileField = ({ icon: Icon, label, value, className }) => (
        <div className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors", className)}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold truncate text-foreground">{value || 'N/A'}</p>
            </div>
        </div>
    );

    // QR Code Modal
    const QRModal = () => (
        <AnimatePresence>
            {showQRModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowQRModal(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        className="relative w-full max-w-sm bg-background border rounded-2xl shadow-2xl overflow-hidden z-10"
                    >
                        <div className="relative h-24 bg-primary flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                            <h3 className="text-primary-foreground font-bold text-lg relative z-10">Digital Identity</h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="absolute top-4 right-4 text-primary-foreground/80 hover:text-white transition-colors"
                            >
                                <FaTimes className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full border-4 border-background -mt-16 shadow-lg overflow-hidden bg-muted mb-4 z-10">
                                {profileData?.image_url ? (
                                    <img src={profileData.image_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <FaUser className="w-12 h-12 m-auto text-muted-foreground mt-4" />
                                )}
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold">{profileData?.full_name}</h2>
                                <p className="text-sm text-muted-foreground font-mono">{profileData?.roll_no}</p>
                            </div>

                            <div className="bg-white p-4 rounded-2xl shadow-inner border mb-6">
                                {profileData?.id_qr_url ? (
                                    <img src={profileData.id_qr_url} alt="Student QR" className="w-48 h-48 object-contain mix-blend-multiply" />
                                ) : (
                                    <div className="w-48 h-48 flex items-center justify-center text-muted-foreground">
                                        <FaQrcode className="w-12 h-12 opacity-20" />
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 w-full">
                                <Button
                                    className="flex-1 gap-2"
                                    onClick={async () => {
                                        if (profileData?.id_qr_url) {
                                            try {
                                                const response = await fetch(profileData.id_qr_url);
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${profileData.full_name.replace(/\s+/g, '_')}_ID_QR.png`;
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                                window.URL.revokeObjectURL(url);
                                                toast.success('QR Code downloaded successfully');
                                            } catch (error) {
                                                console.error('Download failed:', error);
                                                toast.error('Failed to download QR Code');
                                            }
                                        } else {
                                            toast.error('No QR Code available to download');
                                        }
                                    }}
                                >
                                    <FaDownload className="w-4 h-4" />
                                    Download QR
                                </Button>
                            </div>

                            <p className="text-xs text-muted-foreground text-center mt-4 max-w-[200px]">
                                Scan this QR code at university terminals for attendance and access.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (loading) {
        return (
            <div className="flex min-h-screen w-full bg-background">
                <StudentSidebar />
                <main className="flex-1 min-h-screen w-full md:ml-64 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full bg-muted/20 font-sans">
            <StudentSidebar />

            <main className="flex-1 w-full transition-all duration-300 md:ml-64 ml-0 flex flex-col min-h-screen">
                <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <FaUser className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-foreground">Student Profile</h1>
                            <p className="text-xs text-muted-foreground">Manage your personal and academic information</p>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-8">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Identity Card - Sticky on Desktop */}
                        <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-6 md:sticky md:top-24">
                            <Card className="overflow-hidden border shadow-md">
                                <div className="h-32 bg-primary/10 relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
                                </div>
                                <CardContent className="pt-0 pb-8 px-6 flex flex-col items-center -mt-16 text-center">
                                    <div className="relative mb-4 group">
                                        <div className="w-32 h-32 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted flex items-center justify-center">
                                            {profileData?.image_url ? (
                                                <img src={profileData.image_url} alt="Profile" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : (
                                                <FaUser className="w-12 h-12 text-muted-foreground opacity-50" />
                                            )}
                                        </div>
                                        <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-green-500 border-2 border-background ring-2 ring-green-500/20" title="Active Student" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-foreground mb-1">{profileData?.full_name}</h2>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5 mt-1 border-primary/20 bg-primary/5 text-primary">
                                            {profileData?.roll_no}
                                        </Badge>
                                    </div>

                                    <div className="w-full grid grid-cols-2 gap-2 mt-2 mb-6">
                                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Class</p>
                                            <p className="font-bold text-foreground">{profileData?.class_name}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/50 text-center">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Division</p>
                                            <p className="font-bold text-foreground">{profileData?.division || 'A'}</p>
                                        </div>
                                    </div>

                                    <Button
                                        className="w-full gap-2 shadow-sm"
                                        onClick={() => setShowQRModal(true)}
                                    >
                                        <FaQrcode className="w-4 h-4" />
                                        View Digital ID
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <FaCalendarAlt className="w-3.5 h-3.5 text-muted-foreground" />
                                        Important Dates
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b pb-3 border-dashed last:border-0 last:pb-0">
                                        <span className="text-muted-foreground">Admission Date</span>
                                        <span className="font-medium text-right">{formatDate(profileData?.created_at)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Academic Year</span>
                                        <span className="font-medium text-right">2025 - 2026</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT COLUMN: Detailed Info Grid */}
                        <div className="md:col-span-8 lg:col-span-8 flex flex-col gap-6">

                            {/* Personal Information */}
                            <Card className="border shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                                            <FaUser className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Personal Details</CardTitle>
                                            <CardDescription>Basic personal information and contact details.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ProfileField icon={FaUser} label="Full Name" value={profileData?.full_name} />
                                        <ProfileField icon={FaVenusMars} label="Gender" value={profileData?.gender} />
                                        <ProfileField icon={FaPhone} label="Contact Number" value={profileData?.phone} />
                                        <ProfileField icon={FaEnvelope} label="Email Address" value={profileData?.email} />
                                        <ProfileField icon={FaMapMarkerAlt} label="Address" value={profileData?.address} className="md:col-span-2" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Academic Information */}
                            <Card className="border shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                                            <FaGraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Academic Records</CardTitle>
                                            <CardDescription>Current academic status and class details.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ProfileField icon={FaIdCard} label="Roll Number" value={profileData?.roll_no} />
                                        <ProfileField icon={FaChalkboardTeacher} label="Class" value={`${profileData?.class_name}`} />
                                        <ProfileField icon={FaUniversity} label="Batch" value="2025" />
                                        <ProfileField icon={FaCalendarAlt} label="Semester" value="Semester 1" />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex gap-4 items-start">
                                <div className="mt-0.5 min-w-[20px] text-amber-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Info Update Policy</h4>
                                    <p className="text-xs text-amber-800 dark:text-amber-200/80 leading-relaxed">
                                        Students cannot directly modify profile information. Please verify your details carefully.
                                        To request corrections to your academic record or personal details, please contact the Student Administration Office or submit a ticket via the Helpdesk.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <QRModal />
            </main>
        </div>
    );
};

export default Profile;
