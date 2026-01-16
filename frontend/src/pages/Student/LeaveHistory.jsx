import React, { useState, useEffect, useContext } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentContext } from '@/context/StudentContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FaCheckCircle, FaClock, FaTimesCircle, FaFileAlt, FaCalendarAlt, FaSlash, FaTrashAlt } from 'react-icons/fa';

const LeaveHistory = () => {
    const { student } = useContext(StudentContext);
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchLeaveHistory();
        fetchStats();
    }, [student]);

    const fetchLeaveHistory = async () => {
        if (!student || !student.student_id) {
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/student/leave/my-applications/${student.student_id}`);
            const data = await response.json();
            if (data.success) setLeaves(data.data);
        } catch (error) {
            toast.error('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        if (!student || !student.student_id) return;
        try {
            const response = await fetch(`http://localhost:8000/api/student/leave/stats/${student.student_id}`);
            const data = await response.json();
            if (data.success) setStats(data.data);
        } catch (error) {}
    };

    const handleCancelLeave = async (leaveId) => {
        if (!confirm('Are you sure you want to cancel this leave?')) return;
        if (!student || !student.student_id) {
            toast.error('Please login to cancel leave');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/student/leave/${leaveId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: student.student_id })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Leave cancelled');
                fetchLeaveHistory();
                fetchStats();
            }
        } catch (error) {
            toast.error('Failed to cancel');
        }
    };

    const filteredLeaves = filter === 'ALL'
        ? leaves
        : leaves.filter(l => l.status === filter);

    const StatusBadge = ({ status }) => {
        const config = {
            PENDING: {
                color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                icon: FaClock
            },
            APPROVED: {
                color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
                icon: FaCheckCircle
            },
            REJECTED: {
                color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
                icon: FaTimesCircle
            }
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
            <StudentSidebar />
            <main className="flex-1 min-h-screen w-full transition-all duration-300 md:ml-64 ml-0 bg-background pb-20 md:pb-0">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <h1 className="text-lg font-semibold text-foreground">Leave History</h1>

                    <div className="flex gap-2">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                                    filter === f
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                            >
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="p-4">
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <Card><CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">Total Requests</p>
                                <p className="text-2xl font-bold mt-1">{stats.total}</p>
                            </CardContent></Card>

                            <Card><CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">Approved</p>
                                <p className="text-2xl font-bold mt-1 text-green-600">{stats.approved}</p>
                            </CardContent></Card>

                            <Card><CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.pending}</p>
                            </CardContent></Card>

                            <Card><CardContent className="p-4">
                                <p className="text-xs font-medium text-muted-foreground">Rejected</p>
                                <p className="text-2xl font-bold mt-1 text-red-600">{stats.rejected}</p>
                            </CardContent></Card>
                        </div>
                    )}

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                        <div className="overflow-x-auto min-w-[800px]">
                            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-xs font-medium uppercase">
                                <div className="col-span-4">Details</div>
                                <div className="col-span-3">Dates</div>
                                <div className="col-span-2">Applied</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-1 text-right">Action</div>
                            </div>

                            <div className="divide-y">
                                {filteredLeaves.length === 0 ? (
                                    <div className="p-16 text-center text-muted-foreground">
                                        <FaSlash className="mx-auto text-4xl mb-3 opacity-20" />
                                        No records found
                                    </div>
                                ) : (
                                    filteredLeaves.map((leave) => (
                                        <div key={leave._id} className="grid grid-cols-12 gap-4 p-4 items-center">
                                            <div className="col-span-4">
                                                <p className="font-semibold">{leave.leave_type.replace('_', ' ')}</p>
                                                <p className="text-xs text-muted-foreground truncate">{leave.reason}</p>
                                            </div>

                                            <div className="col-span-3 text-sm">
                                                <FaCalendarAlt className="inline mr-2" />
                                                {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                                            </div>

                                            <div className="col-span-2 text-sm">
                                                {new Date(leave.created_at).toLocaleDateString()}
                                            </div>

                                            <div className="col-span-2">
                                                <StatusBadge status={leave.status} />
                                            </div>

                                            <div className="col-span-1 flex justify-end gap-2">
                                                {leave.supporting_document_url && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(leave.supporting_document_url, '_blank')}
                                                    >
                                                        <FaFileAlt />
                                                    </Button>
                                                )}
                                                {leave.status === 'PENDING' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleCancelLeave(leave._id)}
                                                    >
                                                        <FaTrashAlt />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaveHistory;
