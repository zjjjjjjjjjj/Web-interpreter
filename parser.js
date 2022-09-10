class Variable {
    constructor(value, type) {
        this.value = value;
        this.type = type;
    }
}

named_values = {};

// *****AST*****
class AST {
    constructor(terminal) {
        this.terminal = terminal;
    }

    error(err_msg) {
        this.terminal.writeln(err_msg);
    }

    evaluate() {
        return;
    }

    dump(prefix) {
        return;
    }
}

class ProgramAST extends AST {
    constructor(terminal) {
        super(terminal);
        this.body = [];
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        let result = null;
        for (let node of this.body) {
            result = node.evaluate();
        }
        return result;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'ProgramAST');
        for (let node of this.body) {
            node.dump(prefix + '  ');
        }
        return;
    }
}

class VarDeclAST extends AST {
    constructor(terminal, ident, type) {
        super(terminal);
        this.ident = ident;
        if (type == 'INTEGER' || type == 'REAL') {
            this.type = 'number';
        }
        else if (type == 'STRING' || type == 'CHAR') {
            this.type = 'string';
        }
        else if (type == 'BOOLEAN') {
            this.type = 'boolean';
        }
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        named_values[this.ident] = new Variable(null, this.type);
        return;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'VarDeclAST ' + this.ident + ' ' + this.type);
        return;
    }
}

class VarAssignAST extends AST {
    constructor(terminal, ident, expr) {
        super(terminal);
        this.ident = ident;
        this.expr = expr;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        let value = this.expr.evaluate();
        if (this.ident in named_values) {
            if (typeof(value) == named_values[this.ident].type)
                named_values[this.ident].value = value;
            else
                this.error('Type mismatch in assignment for Variable ' + this.ident);
        }
        else {
            this.error("Variable '" + this.ident + "' is not declared");
        }
        return;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'VarAssignAST: ' + this.ident);
        this.expr.dump(prefix + '  ');
        return;
    }
}

// class IfAST extends AST {
//     constructor(terminal, condition, body) {
//         super(terminal);
//         this.condition = condition;
//         this.body = body;
//     }

//     evaluate() {
//         if (this.condition.evaluate()) {
//             for (let node of this.body) {
//                 node.evaluate();
//             }
//         }
//         return;
//     }

//     dump(prefix) {
//         this.terminal.writeln(prefix + 'IfAST');
//         this.condition.dump(prefix + '  ');
//         for (let node of this.body) {
//             node.dump(prefix + '  ');
//         }
//         return;
//     }
// }

class VarExprAST extends AST {
    constructor(terminal, ident) {
        super(terminal);
        this.ident = ident;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        if (this.ident in named_values && named_values[this.ident].value != null) 
            return named_values[this.ident].value;
        this.error("Variable '" + this.ident + "' is not defined");
        return null;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'VarExprAST: ' + this.ident);
        return;
    }
}

class UnaryExprAST extends AST {
    constructor(terminal, op, expr) {
        super(terminal);
        this.op = op;
        this.expr = expr;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        let value = this.expr.evaluate();
        if (this.op == '+' || this.op == '-') {
            if (typeof(value) == 'number') {
                if (this.op == '+') {
                    return value;
                }
                else {
                    return -value;
                }
            }
            else
                this.error('Type mismatch in unary expression');
        }
        else if (this.op == 'NOT') {
            if (typeof(value) == 'boolean')
                return !value;
            else
                this.error('Type mismatch in unary expression');
        }
        return null;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'UnaryExprAST: ' + this.op);
        this.expr.dump(prefix + '  ');
        return;
    }
}

class BinaryExprAST extends AST {
    constructor (terminal, op, lhs, rhs) {
        super(terminal);
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        let lhs = this.lhs.evaluate();
        let rhs = this.rhs.evaluate();
        if (this.op == '+' || this.op == '-' || this.op == '*' || this.op == '/') {
            if (typeof(lhs) == 'number' && typeof(rhs) == 'number') {
                if (this.op == '+')
                    return lhs + rhs;
                else if (this.op == '-')
                    return lhs - rhs;
                else if (this.op == '*')
                    return lhs * rhs;
                else if (this.op == '/')
                    return lhs / rhs;
            }
            else
                this.error('Type mismatch in binary expression');
        }
        else if (this.op == 'AND' || this.op == 'OR') {
            if (typeof(lhs) == 'boolean' && typeof(rhs) == 'boolean') {
                if (this.op == 'AND')
                    return lhs && rhs;
                else if (this.op == 'OR')
                    return lhs || rhs;
            }
            else
                this.error('Type mismatch in binary expression');
        }
        else if (this.op == '=' || this.op == '<>' || this.op == '<' || this.op == '<=' || this.op == '>' || this.op == '>=') {
            if (typeof(lhs) == typeof(rhs)) {
                if (this.op == '=')
                    return lhs == rhs;
                else if (this.op == '<>')
                    return lhs != rhs;
                else if (this.op == '<')
                    return lhs < rhs;
                else if (this.op == '<=')
                    return lhs <= rhs;
                else if (this.op == '>')
                    return lhs > rhs;
                else if (this.op == '>=')
                    return lhs >= rhs;
            }
            else
                this.error('Type mismatch in binary expression');
        }
        return null;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'BinaryExprAST: ' + this.op);
        this.lhs.dump(prefix + '  ');
        this.rhs.dump(prefix + '  ');
        return;
    }
}

class NumberAST extends AST {
    constructor(terminal, value) {
        super(terminal);
        this.value = Number(value);
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        return this.value;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'NumberAST: ' + this.value.toString());
        return;
    }
}

class StringAST extends AST {
    constructor(terminal, value) {
        super(terminal);
        this.value = value;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        return this.value;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'StringAST: ' + this.value);
        return;
    }
}

class BoolAST extends AST {
    constructor(terminal, value) {
        super(terminal);
        if (value == 'TRUE')
            this.value = true;
        else
            this.value = false;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        return this.value;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'BoolAST: ' + this.value);
        return;
    }
}

class OutputAST extends AST {
    constructor(terminal, expr) {
        super(terminal);
        this.expr = expr;
    }

    error(err_msg) {
        super.error(err_msg);
    }

    evaluate() {
        let value = this.expr.evaluate();
        if (value != null)
            this.terminal.writeln(value.toString());
        return;
    }

    dump(prefix) {
        this.terminal.writeln(prefix + 'OutputAST');
        this.expr.dump(prefix + '  ');
        return;
    }
}

// *****AST*****

var current_line = 1;

class Parser {
    constructor(tokens, terminal) {
        this.tokens = tokens;
        this.terminal = terminal;
        this.current_line = 1;

        // for a single line
        this.current = 0;
    }

    error(err_msg, current_char) {
        this.terminal.writeln(err_msg + ' at line ' + this.current_line + ':' + (current_char + 1));
    }

    expect_type(type) {
        if (this.current < this.line.length) {
            let current_type = this.line[this.current]['type'];
            let current_value = this.line[this.current]['value'];

            if (current_type == type) {  
                this.current++;
                return current_value;
            }
            this.error("Expected token with type '" + type + "', Got token" + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
            return null;
        }
        this.error("Expected token with type '" + type + "', Got end of line", this.current);
        return null;
    }

    expect_value(value) {
        if (this.current < this.line.length) {
            let current_type = this.line[this.current]['type'];
            let current_value = this.line[this.current]['value'];

            if (current_value == value) {
                this.current++;
                return current_value;
            }
            this.error("Expected token with value: '" + value + "', Got token" + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
            return null;
        }
        this.error("Expected token with value: '" + value + "', Got end of line", this.current);
        return null;
    }
    
    parse() {
        let ast = new ProgramAST(this.terminal);
        for (let line of this.tokens) {
            this.line = line;
            this.current = 0;
            let node = this.parse_line();

            if (node == null) {
                return null;
            }
            ast.body.push(node);
            this.current_line++;
        }
        return ast;
    }

    parse_line() {
        let current_type = this.line[this.current]['type'];
    
        if (current_type == 'declare') {
            return this.var_decl();
        }
        else if (current_type == 'identifier') {
            return this.variable_assignment();
        }        
        else if (current_type == 'if') {
            return this.if_statement();
        }
        else if (current_type == 'output') {
            return this.output();
        }
        this.error('Unexpected token', this.current);
        return null;
    }

    check_type(type) {
        if (this.current < this.line.length) {
            let current_type = this.line[this.current]['type'];
            let current_value = this.line[this.current]['value'];

            if (current_type == type) {
                this.current++;
                return current_value;
            }
            return null;
        }
        return null;
    }

    check_value(value) {
        if (this.current < this.line.length) {
            let current_value = this.line[this.current]['value'];

            if (current_value == value) {
                this.current++;
                return current_value;
            }
            return null;
        }
        return null;
    }

    parse_expr() {
        /*
        expr -> equality
        equality -> compar ( ( '=' | '<>' ) compar )*
        relation -> term ( ( '<' | '>' | '<=' | '>=' ) term )*
        term -> factor ( ( '+' | '-' ) factor )*
        factor -> unary ( ( '*' | '/' ) unary )*
        unary -> ( not | '+' | '-' ) unary | primary
        primary -> number | string | identifier | '(' expr ')'
        */
        console.log(this.current);
        return this.parse_equality();
    }

    parse_equality() {
        let expr = this.parse_compar();
        
        while (true) {
            let ex_op = this.check_value('=') || this.check_value('<>');
            if (ex_op) {
                let rhs = this.parse_compar();
                expr = new BinaryExprAST(this.terminal, ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        } 
    }

    parse_compar() {
        let expr = this.parse_term();

        while (true) {
            let ex_op = this.check_value('<') || this.check_value('>') || this.check_value('<=') || this.check_value('>=');
            if (ex_op) {
                let rhs = this.parse_term();
                expr = new BinaryExprAST(this.terminal, ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        }
    }

    parse_term() {
        let expr = this.parse_factor();

        while (true) {
            let ex_op = this.check_value('+') || this.check_value('-');
            if (ex_op) {
                let rhs = this.parse_factor();
                expr = new BinaryExprAST(this.terminal, ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        }
    }

    parse_factor() {
        let expr = this.parse_unary();

        while (true) {
            let ex_op = this.check_value('*') || this.check_value('/');
            if (ex_op) {
                let rhs = this.parse_unary();
                expr = new BinaryExprAST(this.terminal, ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        }
    }

    parse_unary() {
        let ex_op = this.check_value('not') || this.check_value('+') || this.check_value('-');
        if (ex_op) {
            let rhs = this.parse_unary();
            return new UnaryExprAST(this.terminal, ex_op, rhs);
        }
        return this.parse_primary();
    }

    parse_primary() {
        // preform this.current++ in the if statements for correct error msg
        let current_type = this.line[this.current]['type'];
        let current_value = this.line[this.current]['value'];
        if (current_type == 'boolean') {
            this.current++;
            return new BoolAST(this.terminal, current_value);
        }
        else if (current_type == 'number') {
            this.current++;
            return new NumberAST(this.terminal, current_value);
        }
        else if (current_type == 'string') {
            this.current++;
            return new StringAST(this.terminal, current_value);
        }
        else if (current_type == 'identifier') {
            this.current++;
            return new VarExprAST(this.terminal, current_value);
        }
        else if (current_value == '(') {
            console.log('here');
            this.current++;
            let expr = this.parse_expr();
            // use expect_value to give an error if not found
            let ex_lpar = this.expect_value(')');
            if (expr && ex_lpar)
                return expr;
            return null;
        }
        this.error('Unexpected token' + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
        return null;
    }
        

    // *****built in functions*****
    output() {
        let ex_output = this.expect_type('output');
        let ex_expr = this.parse_expr();
        if (ex_output && ex_expr)
            return new OutputAST(this.terminal, ex_expr);
        return null;
    }
    // *****built in functions*****

    var_decl() {
        /*
        var_decl -> declare identifier ':' type
        */
        let ex_declare = this.expect_type('declare');
        let ex_ident = this.expect_type('identifier');
        let ex_op = this.expect_value(':');
        let ex_type = this.expect_type('type');
        if (ex_declare && ex_ident && ex_op && ex_type)
            return new VarDeclAST(this.terminal, ex_ident, ex_type);
        return null;
    }

    variable_assignment() {
        /*
        var_decl -> identifier '<-' expr
        */
        let ex_ident = this.expect_type('identifier');
        let ex_op = this.expect_value('<-');
        let ex_expr = this.parse_expr();
        if (ex_ident && ex_op && ex_expr)
            return new VarAssignAST(this.terminal, ex_ident, ex_expr);
        return null;
    }

}
