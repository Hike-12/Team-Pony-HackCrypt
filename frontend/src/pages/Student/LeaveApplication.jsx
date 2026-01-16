import React, { useState } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FaHeartbeat, FaUser, FaAmbulance, FaUsers, FaRunning, FaFileAlt, FaCloudUploadAlt, FaCalendarAlt } from 'react-icons/fa';

const LeaveApplication = () => {
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: '',
        document: null
    });
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const leaveTypes = [
        { value: 'MEDICAL', label: 'Medical Leave', icon: FaHeartbeat, requiresDoc: true },
        { value: 'PERSONAL', label: 'Personal Leave', icon: FaUser, requiresDoc: false },
        { value: 'EMERGENCY', label: 'Emergency', icon: FaAmbulance, requiresDoc: false },
        { value: 'FAMILY_EVENT', label: 'Family Event', icon: FaUsers, requiresDoc: false },
        { value: 'SPORTS', label: 'Sports', icon: FaRunning, requiresDoc: true },
        { value: 'OTHER', label: 'Other', icon: FaFileAlt, requiresDoc: false }
    ];

    const selectedLeaveType = leaveTypes.find(type => type.value === formData.leave_type);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only JPG, PNG, and PDF files are allowed');
                return;
            }
            setFormData({ ...formData, document: file });
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result);
                reader.readAsDataURL(file);
            } else {
                setPreview('pdf');
            }
        }
    };

    const calculateDays = () => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.leave_type) return toast.error('Please select a leave type');
        if (!formData.start_date || !formData.end_date) return toast.error('Please select dates');
        if (new Date(formData.end_date) < new Date(formData.start_date)) return toast.error('End date must be greater than start date');
        if (!formData.reason.trim()) return toast.error('Please provide a reason');
        if (selectedLeaveType?.requiresDoc && !formData.document) return toast.error('Supporting document required');

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) formDataToSend.append(key, formData[key]);
            });
            formDataToSend.append('student_id', 'STUDENT_ID_HERE');

            const response = await fetch('http://localhost:8000/api/student/leave/apply', {
                method: 'POST',
                body: formDataToSend
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Leave submitted successfully!');
                setFormData({ leave_type: '', start_date: '', end_date: '', reason: '', document: null });
                setPreview(null);
            } else {
                toast.error(data.message || 'Failed to submit');
            }
        } catch (error) {
            toast.error('Failed to submit leave application');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen font-sans bg-gray-50/50">
            <StudentSidebar />
            <main className="flex-1 ml-64 min-h-screen p-8">
                <header className="mb-8 border-b pb-4">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Apply for Leave</h1>
                    <p className="text-muted-foreground mt-2">Select a leave type and fill in the details below.</p>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Leave Type Grid */}
                        <section>
                            <Label className="text-lg font-semibold mb-4 block">Select Leave Type</Label>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {leaveTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, leave_type: type.value })}
                                        className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all duration-200 hover:shadow-md h-32 ${formData.leave_type === type.value
                                                ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary'
                                                : 'border-border bg-white text-muted-foreground hover:bg-gray-50'
                                            }`}
                                    >
                                        <type.icon className="text-3xl mb-3" />
                                        <span className="font-medium">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Date Selection */}
                        <section className="bg-white p-6 rounded-xl border space-y-4 shadow-sm">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <FaCalendarAlt className="text-primary" /> Duration
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="h-11 cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="h-11 cursor-pointer"
                                    />
                                </div>
                            </div>
                            {calculateDays() > 0 && (
                                <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 flex items-center justify-between">
                                    <span>Selected Duration</span>
                                    <span className="font-bold text-lg">{calculateDays()} Days</span>
                                </div>
                            )}
                        </section>

                        {/* Reason Textarea */}
                        <section className="bg-white p-6 rounded-xl border space-y-4 shadow-sm">
                            <h3 className="font-semibold text-lg">Reason for Leave</h3>
                            <Textarea
                                placeholder="Please define the reason for your leave application..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                className="min-h-[150px] resize-none text-base p-4"
                                maxLength={500}
                            />
                            <div className="text-xs text-muted-foreground text-right">{formData.reason.length}/500</div>
                        </section>
                    </div>

                    {/* Right Sidebar: Upload & Summary */}
                    <div className="space-y-6">
                        <Card className="border shadow-sm sticky top-8">
                            <CardContent className="p-6 space-y-6">
                                <h3 className="font-semibold text-lg border-b pb-2">Supporting Documents</h3>

                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 transition-colors text-center cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <FaCloudUploadAlt className="text-2xl" />
                                        </div>
                                        {preview ? (
                                            <div className="text-sm font-medium text-green-600 truncate max-w-[200px]">
                                                {formData.document?.name}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <p className="font-medium text-gray-700">Upload File</p>
                                                <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button
                                        onClick={handleSubmit}
                                        size="lg"
                                        className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                                        disabled={loading}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Application'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaveApplication;
