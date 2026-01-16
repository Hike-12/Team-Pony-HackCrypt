import React, { useState, useEffect } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FaCheckCircle, FaClock, FaTimesCircle, FaFileAlt, FaCalendarAlt, FaSlash, FaTrashAlt } from 'react-icons/fa';

const LeaveHistory = () => {
    const [leaves, setLeaves] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        fetchLeaveHistory();
        fetchStats();
    }, []);

    const fetchLeaveHistory = async () => {
        try {
            const studentId = 'STUDENT_ID_HERE';
            const response = await fetch(`http://localhost:8000/api/student/leave/my-applications/${studentId}`);
            const data = await response.json();
            if (data.success) setLeaves(data.data);
        } catch (error) {
            toast.error('Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const studentId = 'STUDENT_ID_HERE';
            const response = await fetch(`http://localhost:8000/api/student/leave/stats/${studentId}`);
            const data = await response.json();
            if (data.success) setStats(data.data);
        } catch (error) { }
    };

    const handleCancelLeave = async (leaveId) => {
        if (!confirm('Are you sure you want to cancel this leave?')) return;
        try {
            const response = await fetch(`http://localhost:8000/api/student/leave/${leaveId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: 'STUDENT_ID_HERE' })
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

    const filteredLeaves = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

    const StatusBadge = ({ status }) => {
        const config = {
            PENDING: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: FaClock },
            APPROVED: { color: 'bg-green-50 text-green-700 border-green-200', icon: FaCheckCircle },
            REJECTED: { color: 'bg-red-50 text-red-700 border-red-200', icon: FaTimesCircle }
        };
        const { color, icon: Icon } = config[status] || config.PENDING;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${color}`}>
                <Icon /> {status}
            </span>
        );
    };

    return (
        <div className="flex min-h-screen font-sans bg-gray-50/50">
            <StudentSidebar />
            <main className="flex-1 ml-64 min-h-screen p-8">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Leave History</h1>
                        <p className="text-muted-foreground mt-1">View and manage your past leave applications.</p>
                    </div>

                    {/* Simple filter tabs */}
                    <div className="bg-white p-1 rounded-lg border shadow-sm inline-flex">
                        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-gray-50'
                                    }`}
                            >
                                {f.charAt(0) + f.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Stats Row */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                                <p className="text-3xl font-bold mt-2">{stats.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground text-green-600">Approved</p>
                                <p className="text-3xl font-bold mt-2 text-green-700">{stats.approved}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground text-yellow-600">Pending</p>
                                <p className="text-3xl font-bold mt-2 text-yellow-700">{stats.pending}</p>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <p className="text-sm font-medium text-muted-foreground text-red-600">Rejected</p>
                                <p className="text-3xl font-bold mt-2 text-red-700">{stats.rejected}</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* History Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50/80 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-4 pl-2">Details</div>
                        <div className="col-span-3">Dates</div>
                        <div className="col-span-2">Applied</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right pr-2">Action</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {filteredLeaves.length === 0 ? (
                            <div className="p-16 text-center text-gray-400">
                                <FaSlash className="mx-auto text-4xl mb-3 opacity-20" />
                                <p>No records found</p>
                            </div>
                        ) : (
                            filteredLeaves.map((leave) => (
                                <div key={leave._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50/50 transition-colors">
                                    <div className="col-span-4 pl-2">
                                        <p className="font-semibold text-gray-900">{leave.leave_type.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-500 truncate mt-1 max-w-[90%]" title={leave.reason}>{leave.reason}</p>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>{new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 ml-6">{leave.total_days} Day{leave.total_days > 1 ? 's' : ''}</span>
                                    </div>

                                    <div className="col-span-2 text-sm text-gray-500">
                                        {new Date(leave.created_at).toLocaleDateString()}
                                    </div>

                                    <div className="col-span-2">
                                        <StatusBadge status={leave.status} />
                                    </div>

                                    <div className="col-span-1 flex justify-end gap-2 pr-2">
                                        {leave.supporting_document_url && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600" onClick={() => window.open(leave.supporting_document_url, '_blank')} title="View Document">
                                                <FaFileAlt />
                                            </Button>
                                        )}
                                        {leave.status === 'PENDING' && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleCancelLeave(leave._id)} title="Cancel">
                                                <FaTrashAlt />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaveHistory;
