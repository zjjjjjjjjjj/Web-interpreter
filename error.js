class Error {
    constructor(msg, current_line = null, current_char = null) {
        this.msg = msg;
        this.current_line = current_line;
        this.current_char = current_char;
    }

    toString() {
        if (this.current_line != null && this.current_char != null) {
            return this.msg + ' at line ' + this.current_line + ':' + this.current_char;
        }
        return this.msg;
    }
}

export {
    Error
}
