// represents an error rosifying or derosifying
export class RosyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RosyError";
    }
}