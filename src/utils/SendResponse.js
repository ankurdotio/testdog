import { request , response } from "express";

class SendResponse {
    success(res, statusCode, data, message) {
        return res.status(statusCode).json({
            status: 'success',
            message,
            data,
        });
    }

     error(res, error, statusCode, message) {
        console.error(error);
        return res.status(statusCode).json({
            status: 'error',
            message,
            error: process.env.NODE_ENV === 'development' ? error : undefined,
        });
    }
}

export default new SendResponse();
