/**
 * Typed application error carrying an HTTP status code, so route handlers
 * can distinguish "expected" failures (validation, conflict, not found)
 * from genuine 500s and respond accordingly.
 */
export class AppError extends Error {
    status: number;

    constructor(message: string, status: number = 400) {
        super(message);
        this.name = 'AppError';
        this.status = status;
    }
}
