import React, { useState, useEffect, useContext } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    FaTimes
} from 'react-icons/fa';

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
                    image_url: student?.image_url || null,
                    email: student?.email || 'N/A',
                    created_at: student?.created_at || new Date().toISOString()
                });
                setLoading(false);
                return;
            }

            const response = await fetch(`http://localhost:8000/api/student/auth/profile/${studentId}`);
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
                    image_url: student?.image_url || null,
                    email: student?.email || 'N/A',
                    created_at: student?.created_at || new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Fallback to context data
            setProfileData({
                full_name: student?.name || 'N/A',
                roll_no: student?.roll_no || 'N/A',
                phone: student?.phone || 'N/A',
                gender: student?.gender || 'N/A',
                class_name: student?.class_name || 'N/A',
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

    const ProfileField = ({ icon: Icon, label, value, iconColor = "text-primary" }) => (
        <div className="group flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all duration-300 hover:shadow-md">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 ${iconColor} transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
                <p className="text-base font-semibold text-foreground truncate">{value || 'N/A'}</p>
            </div>
        </div>
    );

    // QR Code Modal Component
    const QRModal = () => (
        <>
            {/* Backdrop */}
            <div 
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    showQRModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setShowQRModal(false)}
            />
            
            {/* Modal */}
            <div 
                className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
                    showQRModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            >
                <div
                    className={`relative bg-background border-2 border-primary rounded-2xl shadow-2xl transform transition-all duration-300 ${
                        showQRModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setShowQRModal(false)}
                        className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-110 z-10"
                    >
                        <FaTimes className="h-5 w-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Student ID Card
                            </div>
                            
                            {profileData?.id_qr_url ? (
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <img 
                                        src={profileData.id_qr_url} 
                                        alt="Student QR Code"
                                        className="relative w-80 h-80 object-contain p-4 rounded-xl bg-white"
                                    />
                                </div>
                            ) : (
                                <div className="w-80 h-80 flex items-center justify-center bg-muted rounded-xl">
                                    <div className="text-center">
                                        <FaQrcode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">QR Code not available</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-center mt-4">
                                <p className="text-lg font-semibold">{profileData?.full_name}</p>
                                <p className="text-sm text-muted-foreground">Roll No: {profileData?.roll_no}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    if (loading) {
        return (
            <div className="flex min-h-screen w-full">
                <StudentSidebar />
                <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                        <h1 className="text-lg font-semibold">My Profile</h1>
                    </header>
                    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <h1 className="text-lg font-semibold">My Profile</h1>
                </header>

                <div className="p-6 max-w-5xl mx-auto">
                    {/* Profile Header Card */}
                    <Card className="mb-6 overflow-hidden border-2 animate-in fade-in-50 duration-500">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                {/* Profile Picture */}
                                <div className="relative group">
                                    <div className="h-32 w-32 rounded-full border-4 border-primary/20 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg">
                                        {profileData?.image_url ? (
                                            <img 
                                                src={profileData.image_url} 
                                                alt={profileData.full_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <FaUser className="h-16 w-16 text-primary/60" />
                                        )}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-green-500 border-4 border-background flex items-center justify-center shadow-lg">
                                        <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                </div>

                                {/* Profile Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                        {profileData?.full_name}
                                    </h2>
                                    <p className="text-muted-foreground mb-4 flex items-center justify-center md:justify-start gap-2">
                                        <FaIdCard className="h-4 w-4" />
                                        Roll No: <span className="font-semibold text-foreground">{profileData?.roll_no}</span>
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                                            <FaChalkboardTeacher /> Student
                                        </span>
                                        {profileData?.gender && (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                <FaVenusMars /> {profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card className="mb-6 animate-in fade-in-50 duration-700">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary"></div>
                                Personal Information
                            </h3>
                            <Separator className="mb-4" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <ProfileField 
                                    icon={FaIdCard} 
                                    label="Roll Number" 
                                    value={profileData?.roll_no}
                                    iconColor="text-blue-600 dark:text-blue-400"
                                />
                                <ProfileField 
                                    icon={FaUser} 
                                    label="Full Name" 
                                    value={profileData?.full_name}
                                    iconColor="text-purple-600 dark:text-purple-400"
                                />
                                <ProfileField 
                                    icon={FaVenusMars} 
                                    label="Gender" 
                                    value={profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1) : 'N/A'}
                                    iconColor="text-pink-600 dark:text-pink-400"
                                />
                                <ProfileField 
                                    icon={FaPhone} 
                                    label="Phone Number" 
                                    value={profileData?.phone || 'Not provided'}
                                    iconColor="text-green-600 dark:text-green-400"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Academic Information */}
                    <Card className="mb-6 animate-in fade-in-50 duration-1000">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-primary"></div>
                                Academic Information
                            </h3>
                            <Separator className="mb-4" />
                            <div className="grid gap-4 md:grid-cols-2">
                                <ProfileField 
                                    icon={FaChalkboardTeacher} 
                                    label="Class" 
                                    value={profileData?.class_name || 'Not assigned'}
                                    iconColor="text-orange-600 dark:text-orange-400"
                                />
                                <ProfileField 
                                    icon={FaEnvelope} 
                                    label="Email" 
                                    value={profileData?.email || 'Not provided'}
                                    iconColor="text-red-600 dark:text-red-400"
                                />
                                <ProfileField 
                                    icon={FaCalendarAlt} 
                                    label="Enrolled Since" 
                                    value={formatDate(profileData?.created_at)}
                                    iconColor="text-teal-600 dark:text-teal-400"
                                />
                                {profileData?.image_url && (
                                    <ProfileField 
                                        icon={FaImage} 
                                        label="Profile Image" 
                                        value="Available"
                                        iconColor="text-indigo-600 dark:text-indigo-400"
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* QR Code Section */}
                    {profileData?.id_qr_url && (
                        <Card className="mb-6 animate-in fade-in-50 duration-1000">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary"></div>
                                    Student ID
                                </h3>
                                <Separator className="mb-4" />
                                <div className="flex items-center justify-between p-4 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all duration-300">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Digital ID Card</p>
                                        <p className="text-base font-semibold text-foreground">Click the icon to view your QR code</p>
                                    </div>
                                    <button
                                        onClick={() => setShowQRModal(true)}
                                        className="group relative h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ml-4"
                                    >
                                        <FaQrcode className="h-8 w-8 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Info Note */}
                    <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4 animate-in fade-in-50 duration-1000">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                    Profile Information
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    All profile fields are read-only. If you need to update any information, please contact your administrator or academic office.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Modal */}
                <QRModal />
            </main>
        </div>
    );
};

export default Profile;
