const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
        index: true
    },
    leave_type: {
        type: String,
        enum: ['MEDICAL', 'PERSONAL', 'EMERGENCY', 'FAMILY_EVENT', 'SPORTS', 'OTHER'],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    total_days: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true,
        maxlength: 500
    },
    supporting_document_url: {
        type: String,
        default: null
    },
    supporting_document_public_id: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
        index: true
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    reviewed_at: {
        type: Date,
        default: null
    },
    review_comments: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
leaveApplicationSchema.index({ student_id: 1, created_at: -1 });
leaveApplicationSchema.index({ student_id: 1, status: 1 });
leaveApplicationSchema.index({ start_date: 1, end_date: 1 });

// Virtual for checking if leave is active
leaveApplicationSchema.virtual('is_active').get(function () {
    const now = new Date();
    return this.start_date <= now && this.end_date >= now && this.status === 'APPROVED';
});

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
