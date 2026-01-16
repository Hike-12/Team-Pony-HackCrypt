import React, { useState, useEffect, useContext } from 'react';
import { TeacherSidebar } from '@/components/teacher/TeacherSidebar';
import { TeacherContext } from '@/context/TeacherContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    FaCheckCircle,
    FaClock,
    FaTimesCircle,
    FaFileAlt,
    FaCalendarAlt,
    FaUser,
    FaSearch,
    FaRobot,
    FaSpinner
} from 'react-icons/fa';

const LeaveManagement = () => {
    const { teacher } = useContext(TeacherContext);
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
    const [comments, setComments] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);

    useEffect(() => {
        fetchLeaves();
        fetchStats();
    }, [filter]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const endpoint = filter === 'PENDING'
                ? 'http://localhost:8000/api/teacher/leave/pending'
                : `http://localhost:8000/api/teacher/leave/all?status=${filter}`;

            const response = await fetch(endpoint);
            const data = await response.json();
            if (data.success) setLeaves(data.data);
        } catch (error) {
            toast.error('Failed to fetch leaves');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/teacher/leave/stats');
            const data = await response.json();
            if (data.success) setStats(data.data);
        } catch (error) { }
    };

    const handleApprove = (leave) => {
        setSelectedLeave(leave);
        setModalType('approve');
        setShowActionModal(true);
        setComments('');
    };

    const handleReject = (leave) => {
        setSelectedLeave(leave);
        setModalType('reject');
        setShowActionModal(true);
        setComments('');
    };

    const handleVerifyDocument = async (leave) => {
        setSelectedLeave(leave);
        setShowVerifyModal(true);
        setVerifying(true);
        setVerificationResult(null);

        try {
            const response = await fetch(`http://localhost:8000/api/teacher/leave/${leave._id}/verify-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (data.success) {
                setVerificationResult(data.data);
            } else {
                toast.error(data.message || 'Verification failed');
                setShowVerifyModal(false);
            }
        } catch (error) {
            toast.error('Failed to verify document');
            setShowVerifyModal(false);
        } finally {
            setVerifying(false);
        }
    };

    const submitDecision = async () => {
        if (!teacher || !teacher.teacher_id) {
            toast.error('Please login to perform this action');
            return;
        }

        if (modalType === 'reject' && !comments.trim()) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            const endpoint = `http://localhost:8000/api/teacher/leave/${selectedLeave._id}/${modalType}`;
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacher_id: teacher.teacher_id,
                    [modalType === 'approve' ? 'comments' : 'reason']: comments
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Leave ${modalType}d successfully`);
                setShowActionModal(false);
                setSelectedLeave(null);
                setComments('');
                fetchLeaves();
                fetchStats();
            } else {
                toast.error(data.message || `Failed to ${modalType} leave`);
            }
        } catch (error) {
            toast.error(`Failed to ${modalType} leave`);
        }
    };

    const filteredLeaves = leaves.filter(leave => {
        if (!searchTerm) return true;
        const student = leave.student_id;
        return (
            student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student?.roll_no?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const StatusBadge = ({ status }) => {
        const config = {
            PENDING: { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50', icon: FaClock },
            APPROVED: { color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50', icon: FaCheckCircle },
            REJECTED: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50', icon: FaTimesCircle }
        };
        const { color, icon: Icon } = config[status] || config.PENDING;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
                <Icon /> {status}
            </span>
        );
    };

    const getVerificationBadge = (likelihood) => {
        const config = {
            low: { icon: '🟢', label: 'Likely Human-Written', color: 'text-green-600 dark:text-green-400' },
            medium: { icon: '🟡', label: 'Possibly AI-Assisted', color: 'text-yellow-600 dark:text-yellow-400' },
            high: { icon: '🔴', label: 'Likely AI-Assisted', color: 'text-red-600 dark:text-red-400' }
        };
        return config[likelihood] || config.medium;
    };

    return (
        <div className="flex min-h-screen w-full bg-background">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64">
                {/* Header */}
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-8 backdrop-blur supports-backdrop-filter:bg-background/60 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
                        <p className="text-sm text-muted-foreground">Review and manage student leave applications</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-80 h-10 bg-background"
                            />
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-[1600px] mx-auto">
                    {/* Stats Row */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary" onClick={() => setFilter('ALL')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Total Requests</p>
                                            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                            <FaFileAlt className="text-primary text-xl" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-yellow-500" onClick={() => setFilter('PENDING')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Pending Review</p>
                                            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.pending}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                                            <FaClock className="text-yellow-600 dark:text-yellow-400 text-xl" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500" onClick={() => setFilter('APPROVED')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Approved</p>
                                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                                            <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500" onClick={() => setFilter('REJECTED')}>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">Rejected</p>
                                            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                                            <FaTimesCircle className="text-red-600 dark:text-red-400 text-xl" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-3 mb-6">
                        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${filter === f
                                    ? 'bg-primary text-primary-foreground shadow-md scale-105'
                                    : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border shadow-sm'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Leave Applications Grid */}
                    <div className="space-y-4">
                        {loading ? (
                            <Card className="p-16 text-center">
                                <FaClock className="mx-auto text-5xl mb-4 text-muted-foreground opacity-20 animate-spin" />
                                <p className="text-muted-foreground">Loading leave applications...</p>
                            </Card>
                        ) : filteredLeaves.length === 0 ? (
                            <Card className="p-16 text-center">
                                <FaFileAlt className="mx-auto text-5xl mb-4 text-muted-foreground opacity-20" />
                                <p className="text-muted-foreground text-lg">No leave applications found</p>
                            </Card>
                        ) : (
                            filteredLeaves.map((leave) => (
                                <Card key={leave._id} className="shadow-sm hover:shadow-md transition-all duration-200">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Student Info */}
                                            <div className="flex items-center gap-2.5 min-w-[160px]">
                                                <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                                                    {leave.student_id?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm text-foreground truncate">{leave.student_id?.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground">Roll: {leave.student_id?.roll_no || 'N/A'}</p>
                                                </div>
                                            </div>

                                            {/* Leave Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                                                        {leave.leave_type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">• {leave.total_days}d</span>
                                                    <StatusBadge status={leave.status} />
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">{leave.reason}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <FaCalendarAlt className="h-3 w-3" />
                                                    <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {leave.supporting_document_url && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                            onClick={() => window.open(leave.supporting_document_url, '_blank')}
                                                        >
                                                            <FaFileAlt className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                            onClick={() => handleVerifyDocument(leave)}
                                                            disabled={verifying && selectedLeave?._id === leave._id}
                                                        >
                                                            {verifying && selectedLeave?._id === leave._id ? (
                                                                <FaSpinner className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <FaRobot className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    </>
                                                )}
                                                {leave.status === 'PENDING' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => handleApprove(leave)}
                                                        >
                                                            <FaCheckCircle className="mr-1.5 h-3.5 w-3.5" /> Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-red-600 hover:bg-red-700 text-white"
                                                            onClick={() => handleReject(leave)}
                                                        >
                                                            <FaTimesCircle className="mr-1.5 h-3.5 w-3.5" /> Reject
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </main >

            {/* Action Modal (Approve/Reject) */}
            {
                showActionModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${modalType === 'approve' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {modalType === 'approve' ? <FaCheckCircle className="text-2xl" /> : <FaTimesCircle className="text-2xl" />}
                                    </div>
                                    <h2 className="text-2xl font-bold">
                                        {modalType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                                    </h2>
                                </div>

                                <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Student:</span>
                                        <span className="font-semibold text-foreground">{selectedLeave?.student_id?.full_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Leave Type:</span>
                                        <span className="font-semibold text-foreground">{selectedLeave?.leave_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Duration:</span>
                                        <span className="font-semibold text-foreground">{selectedLeave?.total_days} days</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">
                                        {modalType === 'approve' ? 'Comments (Optional)' : 'Rejection Reason (Required) *'}
                                    </Label>
                                    <Textarea
                                        placeholder={modalType === 'approve' ? 'Add any comments...' : 'Please provide a reason for rejection...'}
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        className="min-h-[120px] resize-none"
                                    />
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => {
                                            setShowActionModal(false);
                                            setSelectedLeave(null);
                                            setComments('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="lg"
                                        onClick={submitDecision}
                                        className={`shadow-lg ${modalType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {modalType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* AI Verification Modal */}
            {
                showVerifyModal && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                            <CardContent className="p-8 space-y-6">
                                <div className="flex items-center gap-3 border-b pb-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <FaRobot className="text-primary text-2xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">AI Document Verification</h2>
                                        <p className="text-sm text-muted-foreground">Analyzing document authenticity using Groq AI</p>
                                    </div>
                                </div>

                                {verifying ? (
                                    <div className="py-12 text-center space-y-4">
                                        <FaSpinner className="mx-auto text-5xl text-primary animate-spin" />
                                        <p className="text-lg font-medium">Analyzing document...</p>
                                        <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                                    </div>
                                ) : verificationResult ? (
                                    <div className="space-y-6">
                                        {/* Student Info */}
                                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Student:</span>
                                                <span className="font-semibold">{verificationResult.student_name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Roll Number:</span>
                                                <span className="font-semibold">{verificationResult.roll_no}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-muted-foreground">Leave Type:</span>
                                                <span className="font-semibold">{verificationResult.leave_type}</span>
                                            </div>
                                        </div>

                                        {/* Verification Result */}
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                            <div className={`p-6 rounded-xl border-2 ${verificationResult.analysis.ai_likelihood === 'low'
                                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                                : verificationResult.analysis.ai_likelihood === 'medium'
                                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                                }`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-4xl">
                                                            {getVerificationBadge(verificationResult.analysis.ai_likelihood).icon}
                                                        </span>
                                                        <div>
                                                            <p className={`text-xl font-bold ${getVerificationBadge(verificationResult.analysis.ai_likelihood).color}`}>
                                                                {getVerificationBadge(verificationResult.analysis.ai_likelihood).label}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">AI Likelihood: {verificationResult.analysis.ai_likelihood.toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-3xl font-bold">{verificationResult.analysis.confidence}%</p>
                                                        <p className="text-xs text-muted-foreground">Confidence</p>
                                                    </div>
                                                </div>

                                                {/* Reason Genuineness */}
                                                <div className="mt-4 pt-4 border-t">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold text-sm">Reason Appears Genuine:</p>
                                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${verificationResult.analysis.reason_genuine === 'yes'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : verificationResult.analysis.reason_genuine === 'no'
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                            }`}>
                                                            {verificationResult.analysis.reason_genuine === 'yes' ? '✓ Yes' :
                                                                verificationResult.analysis.reason_genuine === 'no' ? '✗ No' : '? Uncertain'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {verificationResult.analysis.notes && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <p className="font-semibold text-sm mb-1">Additional Notes:</p>
                                                        <p className="text-sm text-muted-foreground italic">{verificationResult.analysis.notes}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Extracted Text Preview */}
                                            <div className="p-4 bg-muted/30 rounded-lg">
                                                <p className="font-semibold text-sm mb-2">Document Text Preview:</p>
                                                <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                    {verificationResult.extracted_text}
                                                </p>
                                            </div>

                                            {/* Disclaimer */}
                                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                                    <strong>Disclaimer:</strong> This analysis is probabilistic and not definitive. Results should be used as a screening tool, not as conclusive evidence. Medical professionals often write briefly or unclearly, which may affect accuracy.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 justify-end pt-4">
                                            <Button
                                                variant="outline"
                                                size="lg"
                                                onClick={() => {
                                                    setShowVerifyModal(false);
                                                    setVerificationResult(null);
                                                }}
                                            >
                                                Close
                                            </Button>
                                            <Button
                                                size="lg"
                                                onClick={() => window.open(verificationResult.document_url, '_blank')}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <FaFileAlt className="mr-2" /> View Original Document
                                            </Button>
                                        </div>
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </div >
    );
};

export default LeaveManagement;
