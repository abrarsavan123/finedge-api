'use strict';
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
class ValidationError  extends AppError { constructor(m) { super(m, 400); this.name = 'ValidationError';  } }
class NotFoundError    extends AppError { constructor(m) { super(m || 'Resource not found', 404); this.name = 'NotFoundError';    } }
class UnauthorizedError extends AppError { constructor(m) { super(m || 'Unauthorized', 401); this.name = 'UnauthorizedError'; } }
class ConflictError    extends AppError { constructor(m) { super(m, 409); this.name = 'ConflictError';    } }
class ForbiddenError   extends AppError { constructor(m) { super(m || 'Forbidden', 403); this.name = 'ForbiddenError';   } }
module.exports = { AppError, ValidationError, NotFoundError, UnauthorizedError, ConflictError, ForbiddenError };
