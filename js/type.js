function type_of(value) {
    if (typeof(value) == 'number') {
        if (String(num).indexOf('.') > -1)
            return 'integer';
        else
            return 'real';
    }
    else if (typeof(value) == 'string') {
        return 'string';
    }
    else if (typeof(value) == 'boolean') {
        return 'boolean';
    }
}

class Variable {
    constructor(type) {
        this.value = null;
        this.type = type;
    }
}


class Array {
    constructor(type, lower, upper) {
        this.values = [];
        this.type = type;
        this.lower = lower;
        this.upper = upper;
    }
}

export {
    Array,
    Variable
}
