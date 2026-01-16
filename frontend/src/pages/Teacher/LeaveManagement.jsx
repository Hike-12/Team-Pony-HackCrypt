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
    FaFilter,
    FaSearch
} from 'react-icons/fa';

const LeaveManagement = () => {
    const { teacher } = useContext(TeacherContext);
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'approve' or 'reject'
    const [comments, setComments] = useState('');

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
        setShowModal(true);
        setComments('');
    };

    const handleReject = (leave) => {
        setSelectedLeave(leave);
        setModalType('reject');
        setShowModal(true);
        setComments('');
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
                setShowModal(false);
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
            PENDING: { color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: FaClock },
            APPROVED: { color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', icon: FaCheckCircle },
            REJECTED: { color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: FaTimesCircle }
        };
        const { color, icon: Icon } = config[status] || config.PENDING;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
                <Icon /> {status}
            </span>
        );
    };

    return (
        <div className="flex min-h-screen w-full">
            <TeacherSidebar />
            <main className="flex-1 min-h-screen w-full ml-64 bg-background">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
                    <h1 className="text-lg font-semibold text-foreground">Leave Management</h1>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <Input
                                type="text"
                                placeholder="Search student..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-64 h-9"
                            />
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    {/* Stats Row */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <Card className="shadow-sm">
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Total Requests</p>
                                    <p className="text-2xl font-bold mt-1 text-foreground">{stats.total}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('PENDING')}>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('APPROVED')}>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Approved</p>
                                    <p className="text-2xl font-bold mt-1 text-green-600">{stats.approved}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter('REJECTED')}>
                                <CardContent className="p-4">
                                    <p className="text-xs font-medium text-muted-foreground">Rejected</p>
                                    <p className="text-2xl font-bold mt-1 text-red-600">{stats.rejected}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mb-4">
                        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground border'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Leave Applications Table */}
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <div className="col-span-3 pl-2">Student</div>
                            <div className="col-span-2">Leave Type</div>
                            <div className="col-span-3">Dates</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right pr-2">Actions</div>
                        </div>

                        <div className="divide-y divide-border">
                            {loading ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    <FaClock className="mx-auto text-4xl mb-3 opacity-20 animate-spin" />
                                    <p>Loading...</p>
                                </div>
                            ) : filteredLeaves.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground">
                                    <FaFileAlt className="mx-auto text-4xl mb-3 opacity-20" />
                                    <p>No leave applications found</p>
                                </div>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <div key={leave._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors">
                                        <div className="col-span-3 pl-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                                                    {leave.student_id?.full_name?.charAt(0) || 'S'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{leave.student_id?.full_name || 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground">{leave.student_id?.roll_no || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <span className="text-sm font-medium text-foreground">{leave.leave_type.replace('_', ' ')}</span>
                                            <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={leave.reason}>{leave.reason}</p>
                                        </div>

                                        <div className="col-span-3">
                                            <div className="flex items-center gap-2 text-sm text-foreground">
                                                <FaCalendarAlt className="text-muted-foreground" />
                                                <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-6">{leave.total_days} Day{leave.total_days > 1 ? 's' : ''}</span>
                                        </div>

                                        <div className="col-span-2">
                                            <StatusBadge status={leave.status} />
                                        </div>

                                        <div className="col-span-2 flex justify-end gap-2 pr-2">
                                            {leave.supporting_document_url && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary hover:bg-primary/10"
                                                    onClick={() => window.open(leave.supporting_document_url, '_blank')}
                                                >
                                                    <FaFileAlt className="mr-1" /> View Doc
                                                </Button>
                                            )}
                                            {leave.status === 'PENDING' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        onClick={() => handleApprove(leave)}
                                                    >
                                                        <FaCheckCircle className="mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => handleReject(leave)}
                                                    >
                                                        <FaTimesCircle className="mr-1" /> Reject
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal for Approve/Reject */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardContent className="p-6 space-y-4">
                            <h2 className="text-xl font-bold">
                                {modalType === 'approve' ? 'Approve Leave' : 'Reject Leave'}
                            </h2>

                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Student: <span className="font-semibold text-foreground">{selectedLeave?.student_id?.full_name}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Leave Type: <span className="font-semibold text-foreground">{selectedLeave?.leave_type}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Duration: <span className="font-semibold text-foreground">{selectedLeave?.total_days} days</span>
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>{modalType === 'approve' ? 'Comments (Optional)' : 'Rejection Reason (Required)'}</Label>
                                <Textarea
                                    placeholder={modalType === 'approve' ? 'Add any comments...' : 'Please provide a reason for rejection...'}
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    className="min-h-[100px]"
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedLeave(null);
                                        setComments('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={submitDecision}
                                    className={modalType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                >
                                    {modalType === 'approve' ? 'Approve' : 'Reject'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default LeaveManagement;
