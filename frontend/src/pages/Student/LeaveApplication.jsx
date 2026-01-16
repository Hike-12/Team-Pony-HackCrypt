import React, { useState } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    FaHeartbeat, FaUser, FaAmbulance, FaUsers,
    FaRunning, FaFileAlt, FaCloudUploadAlt, FaCalendarAlt, FaInfoCircle, FaCheck
} from 'react-icons/fa';

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
        { value: 'MEDICAL', label: 'Medical Leave', icon: FaHeartbeat, requiresDoc: true, description: 'Sick leave, checkups' },
        { value: 'PERSONAL', label: 'Personal Leave', icon: FaUser, requiresDoc: false, description: 'Personal matters' },
        { value: 'EMERGENCY', label: 'Emergency', icon: FaAmbulance, requiresDoc: false, description: 'Urgent situations' },
        { value: 'FAMILY_EVENT', label: 'Family Event', icon: FaUsers, requiresDoc: false, description: 'Weddings, functions' },
        { value: 'SPORTS', label: 'Sports', icon: FaRunning, requiresDoc: true, description: 'Competitions, events' },
        { value: 'OTHER', label: 'Other', icon: FaFileAlt, requiresDoc: false, description: 'Miscellaneous' }
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

        // Strict check for document requirement
        if (selectedLeaveType?.requiresDoc && !formData.document) {
            return toast.error(`Uploading a document is MANDATORY for ${selectedLeaveType.label}`);
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key]) formDataToSend.append(key, formData[key]);
            });
            // TODO: Get actual student ID from context
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
        <div className="flex min-h-screen w-full">
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">Apply Leave</h1>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <FaInfoCircle />
                        <span>Fill details carefully</span>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

                        {/* Left Column - Form Inputs */}
                        <div className="xl:col-span-8 space-y-6">

                            {/* 1. Leave Type Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-base font-medium text-foreground">Select Category</Label>
                                    {selectedLeaveType && (
                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                                            {selectedLeaveType.label} Selected
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {leaveTypes.map((type) => {
                                        const isSelected = formData.leave_type === type.value;
                                        return (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, leave_type: type.value })}
                                                className={`relative group flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 ease-out
                          ${isSelected
                                                        ? 'border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(var(--primary),0.2)] scale-[1.02]'
                                                        : 'border-border bg-card hover:border-primary/50 hover:bg-accent/50 hover:-translate-y-1'
                                                    }
                        `}
                                            >
                                                {/* Requirement Badge */}
                                                {type.requiresDoc && (
                                                    <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border 
                            ${isSelected ? 'bg-primary text-primary-foreground border-transparent' : 'bg-muted text-muted-foreground border-border'}
                          `}>
                                                        Doc Req
                                                    </span>
                                                )}

                                                {/* Icon */}
                                                <div className={`p-3 rounded-full mb-3 transition-colors duration-300
                          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground group-hover:bg-primary/20 group-hover:text-primary'}
                        `}>
                                                    <type.icon className="text-xl" />
                                                </div>

                                                <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                                    {type.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground mt-1 text-center font-medium opacity-80">
                                                    {type.description}
                                                </span>

                                                {/* Checkmark overlay for selected */}
                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                                                        <FaCheck className="text-xs" />
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 2. Date & Reason Section */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <Card className="border shadow-sm bg-card/50">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                                                <FaCalendarAlt />
                                            </div>
                                            <h3 className="font-semibold">Duration</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">From</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.start_date}
                                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                    className="h-12 bg-background border-input/50 focus:border-primary transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">To</Label>
                                                <Input
                                                    type="date"
                                                    value={formData.end_date}
                                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                    className="h-12 bg-background border-input/50 focus:border-primary transition-all"
                                                />
                                            </div>

                                            {calculateDays() > 0 && (
                                                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg flex justify-between items-center animate-in fade-in">
                                                    <span className="text-sm font-medium text-muted-foreground">Total Days</span>
                                                    <span className="text-lg font-bold text-primary">{calculateDays()} Days</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border shadow-sm bg-card/50">
                                    <CardContent className="p-6 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                                                <FaFileAlt />
                                            </div>
                                            <h3 className="font-semibold">Reason</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <Textarea
                                                placeholder="Explain why you need leave..."
                                                value={formData.reason}
                                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                                className="min-h-[180px] text-base resize-none bg-background border-input/50 focus:border-primary transition-all leading-relaxed"
                                                maxLength={500}
                                            />
                                            <div className="flex justify-end">
                                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                                    {formData.reason.length} / 500
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column - Upload & Submit */}
                        <div className="xl:col-span-4 space-y-6">
                            <Card className={`border shadow-sm sticky top-20 transition-all duration-300
                 ${selectedLeaveType?.requiresDoc && !formData.document
                                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                                    : 'border-border'}
              `}>
                                <CardContent className="p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Supporting Docs
                                            {selectedLeaveType?.requiresDoc && (
                                                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full border border-red-200">
                                                    REQUIRED
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {selectedLeaveType?.requiresDoc
                                                ? `Proof is mandatory for ${selectedLeaveType.label}.`
                                                : "Optional, but recommended for better approval chances."}
                                        </p>
                                    </div>

                                    {/* Modern Upload Zone */}
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={handleFileChange}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                        />

                                        <div className={`
                       border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300
                       ${preview ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'}
                     `}>
                                            {preview ? (
                                                <div className="space-y-3 z-10 relative">
                                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                                                        <FaCheck />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-primary truncate max-w-[200px]">
                                                            {formData.document?.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">Click to change</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className={`
                               w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-transform duration-500 group-hover:scale-110
                               ${selectedLeaveType?.requiresDoc ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'}
                            `}>
                                                        <FaCloudUploadAlt className="text-3xl" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-semibold">
                                                            {selectedLeaveType?.requiresDoc ? "Upload Required File" : "Drop file here"}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">PDF, PNG, JPG (Max 5MB)</p>
                                                    </div>
                                                    <Button size="sm" variant="outline" className="pointer-events-none">
                                                        Browse Files
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handleSubmit}
                                            size="lg"
                                            className="w-full h-14 text-base font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span className="flex items-center gap-2">
                                                    <FaHeartbeat className="animate-spin" /> Submitting...
                                                </span>
                                            ) : (
                                                "Submit Application"
                                            )}
                                        </Button>
                                        <p className="text-[10px] text-center text-muted-foreground mt-3">
                                            By submitting, you declare that the information provided is true.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaveApplication;
