const LeaveApplication = require('../models/LeaveApplication');
const Student = require('../models/Student');
const cloudinary = require('../config/cloudinaryConfig');
const mongoose = require('mongoose');

// Create a new leave application
exports.createLeaveApplication = async (req, res) => {
    try {
        const { leave_type, start_date, end_date, reason } = req.body;
        const student_id = req.body.student_id; // TODO: Get from auth middleware

        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        if (endDate < startDate) {
            return res.status(400).json({
                success: false,
                message: 'End date must be greater than or equal to start date'
            });
        }

        // Calculate total days
        const timeDiff = endDate.getTime() - startDate.getTime();
        const total_days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

        // Check for overlapping leaves
        const overlappingLeave = await LeaveApplication.findOne({
            student_id,
            $or: [
                { start_date: { $lte: endDate }, end_date: { $gte: startDate } }
            ],
            status: { $ne: 'REJECTED' }
        });

        if (overlappingLeave) {
            return res.status(400).json({
                success: false,
                message: 'You already have a leave application for these dates'
            });
        }

        // Handle file upload
        let supporting_document_url = null;
        let supporting_document_public_id = null;

        if (req.file) {
            supporting_document_url = req.file.path;
            supporting_document_public_id = req.file.filename;
        }

        // Create leave application
        const leaveApplication = new LeaveApplication({
            student_id,
            leave_type,
            start_date: startDate,
            end_date: endDate,
            total_days,
            reason,
            supporting_document_url,
            supporting_document_public_id
        });

        await leaveApplication.save();

        res.status(201).json({
            success: true,
            message: 'Leave application submitted successfully',
            data: leaveApplication
        });
    } catch (error) {
        console.error('Error creating leave application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit leave application',
            error: error.message
        });
    }
};

// Get all leave applications for a student
exports.getMyLeaveApplications = async (req, res) => {
    try {
        const student_id = req.params.studentId; // TODO: Get from auth middleware
        const { status, limit = 50, skip = 0 } = req.query;

        const query = { student_id };
        if (status) {
            query.status = status;
        }

        const leaves = await LeaveApplication.find(query)
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await LeaveApplication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: leaves,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Error fetching leave applications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave applications',
            error: error.message
        });
    }
};

// Get leave statistics for a student
exports.getLeaveStats = async (req, res) => {
    try {
        const student_id = req.params.studentId; // TODO: Get from auth middleware

        const stats = await LeaveApplication.aggregate([
            { $match: { student_id: new mongoose.Types.ObjectId(student_id) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    total_days: { $sum: '$total_days' }
                }
            }
        ]);

        const formattedStats = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            total_days_approved: 0
        };

        stats.forEach(stat => {
            formattedStats.total += stat.count;
            if (stat._id === 'PENDING') {
                formattedStats.pending = stat.count;
            } else if (stat._id === 'APPROVED') {
                formattedStats.approved = stat.count;
                formattedStats.total_days_approved = stat.total_days;
            } else if (stat._id === 'REJECTED') {
                formattedStats.rejected = stat.count;
            }
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error fetching leave stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave statistics',
            error: error.message
        });
    }
};

// Delete/Cancel a leave application (only if pending)
exports.cancelLeaveApplication = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const student_id = req.body.student_id; // TODO: Get from auth middleware

        const leave = await LeaveApplication.findOne({
            _id: leaveId,
            student_id
        });

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leave applications can be cancelled'
            });
        }

        // Delete document from Cloudinary if exists
        if (leave.supporting_document_public_id) {
            await cloudinary.uploader.destroy(leave.supporting_document_public_id);
        }

        await LeaveApplication.findByIdAndDelete(leaveId);

        res.status(200).json({
            success: true,
            message: 'Leave application cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling leave application:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel leave application',
            error: error.message
        });
    }
};

// ==================== TEACHER FUNCTIONS ====================

// Get all pending leave applications for teacher review
exports.getPendingLeaves = async (req, res) => {
    try {
        const { limit = 50, skip = 0 } = req.query;

        const leaves = await LeaveApplication.find({ status: 'PENDING' })
            .populate('student_id', 'full_name roll_no class_id')
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await LeaveApplication.countDocuments({ status: 'PENDING' });

        res.status(200).json({
            success: true,
            data: leaves,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Error fetching pending leaves:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending leaves',
            error: error.message
        });
    }
};

// Get all leave applications with filters
exports.getAllLeaves = async (req, res) => {
    try {
        const { status, student_id, start_date, end_date, limit = 50, skip = 0 } = req.query;

        const query = {};
        if (status) query.status = status;
        if (student_id) query.student_id = student_id;
        if (start_date || end_date) {
            query.start_date = {};
            if (start_date) query.start_date.$gte = new Date(start_date);
            if (end_date) query.start_date.$lte = new Date(end_date);
        }

        const leaves = await LeaveApplication.find(query)
            .populate('student_id', 'full_name roll_no class_id')
            .populate('reviewed_by', 'full_name')
            .sort({ created_at: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(skip));

        const total = await LeaveApplication.countDocuments(query);

        res.status(200).json({
            success: true,
            data: leaves,
            pagination: {
                total,
                limit: parseInt(limit),
                skip: parseInt(skip)
            }
        });
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaves',
            error: error.message
        });
    }
};

// Approve a leave application
exports.approveLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { teacher_id, comments } = req.body; // TODO: Get teacher_id from auth middleware

        const leave = await LeaveApplication.findById(leaveId);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leaves can be approved'
            });
        }

        leave.status = 'APPROVED';
        leave.reviewed_by = teacher_id;
        leave.reviewed_at = new Date();
        if (comments) leave.review_comments = comments;

        await leave.save();

        res.status(200).json({
            success: true,
            message: 'Leave approved successfully',
            data: leave
        });
    } catch (error) {
        console.error('Error approving leave:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve leave',
            error: error.message
        });
    }
};

// Reject a leave application
exports.rejectLeave = async (req, res) => {
    try {
        const { leaveId } = req.params;
        const { teacher_id, reason } = req.body; // TODO: Get teacher_id from auth middleware

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Rejection reason is required'
            });
        }

        const leave = await LeaveApplication.findById(leaveId);

        if (!leave) {
            return res.status(404).json({
                success: false,
                message: 'Leave application not found'
            });
        }

        if (leave.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Only pending leaves can be rejected'
            });
        }

        leave.status = 'REJECTED';
        leave.reviewed_by = teacher_id;
        leave.reviewed_at = new Date();
        leave.review_comments = reason;

        await leave.save();

        res.status(200).json({
            success: true,
            message: 'Leave rejected successfully',
            data: leave
        });
    } catch (error) {
        console.error('Error rejecting leave:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject leave',
            error: error.message
        });
    }
};

// Get leave statistics for teacher dashboard
exports.getTeacherLeaveStats = async (req, res) => {
    try {
        const stats = await LeaveApplication.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        };

        stats.forEach(stat => {
            formattedStats.total += stat.count;
            if (stat._id === 'PENDING') {
                formattedStats.pending = stat.count;
            } else if (stat._id === 'APPROVED') {
                formattedStats.approved = stat.count;
            } else if (stat._id === 'REJECTED') {
                formattedStats.rejected = stat.count;
            }
        });

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Error fetching teacher leave stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave statistics',
            error: error.message
        });
    }
};