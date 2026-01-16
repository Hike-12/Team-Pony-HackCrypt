const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token and attach user info to request
 */
exports.authenticateToken = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Access token is required' 
            });
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Invalid or expired token' 
                });
            }

            // Attach user info to request
            req.user = decoded;
            next();
        });

    } catch (error) {
        console.error("Authentication Error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Server Error' 
        });
    }
};

/**
 * Middleware to verify user is a teacher
 */
exports.isTeacher = (req, res, next) => {
    if (req.user && req.user.role === 'TEACHER') {
        next();
    } else {
        res.status(403).json({ 
            success: false,
            message: 'Access denied. Teacher role required.' 
        });
    }
};
