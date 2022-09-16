// TODO: make an 'error' global function and simplify the code
import { 
    ProgramAST,
    VarDeclAST,
    VarAssignAST,
    IfAST,
    WhileAST,
    ForAST,
    VarExprAST,
    UnaryExprAST,
    BinaryExprAST,
    NumberAST,
    StringAST,
    BoolAST,
    OutputAST
} from "./ast.js";

import { Error } from "./error.js";

class Parser {
    constructor(tokens) {
        this.tokens = tokens;

        this.current = 0;
    }

    expect_type(type) {
        if (this.current < this.tokens.length) {
            let current_type = this.tokens[this.current]['type'];
            let current_value = this.tokens[this.current]['value'];

            if (current_type == type) {  
                this.current++;
                return current_value;
            }
            throw new Error("Expected token with type '" + type + "', Got token" + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
        }
        throw new Error("Expected token with type '" + type + "', Got end of line", this.current);
    }

    expect_value(value) {
        if (this.current < this.tokens.length) {
            let current_type = this.tokens[this.current]['type'];
            let current_value = this.tokens[this.current]['value'];

            if (current_value == value) {
                this.current++;
                return current_value;
            }
            throw new Error("Expected token with value: '" + value + "', Got token" + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
        }
        throw new Error("Expected token with value: '" + value + "', Got end of line", this.current);
    }
    
    parse() {
        let ast = new ProgramAST(this.terminal);
        while(this.current < this.tokens.length) {
            let node = this.parse_stmt();

            if (node == null) {
                return null;
            }
            ast.body.push(node);
        }
        return ast;
    }

    parse_stmt() {
        let current_type = this.tokens[this.current]['type'];
    
        if (current_type == 'declare') {
            return this.var_decl();
        }
        else if (current_type == 'identifier') {
            return this.variable_assignment();
        }        
        else if (current_type == 'if') {
            return this.if_statement();
        }
        else if (current_type == 'while') {
            return this.while_statement();
        }
        else if (current_type == 'for') {
            return this.for_statement();
        }
        else if (current_type == 'output') {
            return this.output();
        }
        throw new Error('Unexpected token', this.current);
    }

    check_type(type) {
        if (this.current < this.tokens.length) {
            let current_type = this.tokens[this.current]['type'];
            let current_value = this.tokens[this.current]['value'];

            if (current_type == type) {
                this.current++;
                return current_value;
            }
            return null;
        }
        return null;
    }

    check_value(value) {
        if (this.current < this.tokens.length) {
            let current_value = this.tokens[this.current]['value'];

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
        return this.parse_equality();
    }

    parse_equality() {
        let expr = this.parse_compar();
        
        while (true) {
            let ex_op = this.check_value('=') || this.check_value('<>') || this.check_value('OR');
            if (ex_op) {
                let rhs = this.parse_compar();
                expr = new BinaryExprAST(ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        } 
    }

    parse_compar() {
        let expr = this.parse_term();

        while (true) {
            let ex_op = this.check_value('<') || this.check_value('>') || this.check_value('<=') || this.check_value('>=') || this.check_value('AND');
            if (ex_op) {
                let rhs = this.parse_term();
                expr = new BinaryExprAST(ex_op, expr, rhs);
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
                expr = new BinaryExprAST(ex_op, expr, rhs);
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
                expr = new BinaryExprAST(ex_op, expr, rhs);
            }
            else {
                return expr;
            }
        }
    }

    parse_unary() {
        let ex_op = this.check_value('NOT') || this.check_value('+') || this.check_value('-');
        if (ex_op) {
            let rhs = this.parse_unary();
            return new UnaryExprAST(ex_op, rhs);
        }
        return this.parse_primary();
    }

    parse_primary() {
        // preform this.current++ in the if statements for correct error msg
        let current_type = this.tokens[this.current]['type'];
        let current_value = this.tokens[this.current]['value'];
        if (current_type == 'boolean') {
            this.current++;
            return new BoolAST(current_value);
        }
        else if (current_type == 'number') {
            this.current++;
            return new NumberAST(current_value);
        }
        else if (current_type == 'string') {
            this.current++;
            return new StringAST(current_value);
        }
        else if (current_type == 'identifier') {
            this.current++;
            return new VarExprAST(current_value);
        }
        else if (current_value == '(') {
            this.current++;
            let expr = this.parse_expr();
            // use expect_value to give an error if not found
            let ex_lpar = this.expect_value(')');
            if (expr && ex_lpar)
                return expr;
            return null;
        }
        throw new Error('Unexpected token' + '(type: ' + current_type + ', value:' + current_value + ')', this.current);
    }
        

    // *****built in functions*****
    output() {
        let ex_output = this.expect_type('output');
        let ex_expr = this.parse_expr();
        if (ex_output && ex_expr)
            return new OutputAST(ex_expr);
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
        if (ex_declare != null && ex_ident != null && ex_op != null && ex_type != null)
            return new VarDeclAST(ex_ident, ex_type);
        return null;
    }

    variable_assignment() {
        /*
        var_decl -> identifier '<-' expr
        */
        let ex_ident = this.expect_type('identifier');
        let ex_op = this.expect_value('<-');
        let ex_expr = this.parse_expr();
        if (ex_ident != null && ex_op != null && ex_expr != null)
            return new VarAssignAST(ex_ident, ex_expr);
        return null;
    }

    if_statement() {
        /*
        if_statement -> if expr then statement_list (else statement_list)? end
        */
        let ex_if = this.expect_type('if');
        let ex_cond = this.parse_expr();
        let ex_then = this.expect_type('then');
        let ex_body = [];
        // use check
        let ex_else = this.check_type('else');
        let ex_endif = this.check_type('endif');
        while(ex_else == null && ex_endif == null) {
            let node = this.parse_stmt();

            if (node == null)
                return null;

            ex_body.push(node);
            ex_else = this.check_type('else');
            ex_endif = this.check_type('endif');
        }
        if (ex_if != null && ex_cond != null && ex_then && ex_endif != null)
            return new IfAST(ex_expr, ex_body);

        let ex_else_body = [];
        while(ex_endif == null) {
            let node = this.parse_stmt();

            if (node == null)
                return null;

            ex_else_body.push(node);
            ex_endif = this.check_type('endif');
        }
        if (ex_if != null && ex_cond != null && ex_then != null && ex_body != null && ex_else != null && ex_else_body && ex_endif != null)
            return new IfAST(ex_cond, ex_body, ex_else_body);
        return null;
    }

    while_statement() {
        let ex_while = this.expect_type('while');
        let ex_expr = this.parse_expr();
        let ex_body = [];
        let ex_endwhile = this.check_type('endwhile');
        while(ex_endwhile == null) {
            let node = this.parse_stmt();

            if (node == null)
                return null

            ex_body.push(node);
            ex_endwhile = this.check_type('endwhile');
        }
        if (ex_while != null && ex_expr != null && ex_body != null && ex_endwhile != null)
            return new WhileAST(ex_expr, ex_body);
    }

    for_statement() {
        let ex_for = this.expect_type('for');
        let ex_ident = this.expect_type('identifier');
        let ex_op = this.expect_value('<-');
        let ex_start = this.parse_expr();
        let ex_to = this.expect_type('to');
        let ex_end = this.parse_expr();
        let ex_step = this.check_type('step');
        let ex_step_val = null;
        if (ex_step != null)
            ex_step_val = this.parse_expr();
        let ex_body = [];
        let ex_next = this.check_type('next');
        while(ex_next == null) {
            let node = this.parse_stmt();

            if (node == null)
                return null

            ex_body.push(node);
            ex_next = this.check_type('next');
        }
        let ex_ident2 = this.expect_type('identifier');
        if (ex_for != null && ex_ident != null && ex_op != null && ex_start != null && ex_to != null && ex_end != null && ex_step_val != null && ex_body != null && ex_next != null && ex_ident2 == ex_ident)
            return new ForAST(ex_ident, ex_start, ex_end, ex_body, ex_step_val);
        if (ex_for != null && ex_ident != null && ex_op != null && ex_start != null && ex_to != null && ex_end != null && ex_body != null && ex_next != null && ex_ident2 == ex_ident)
            return new ForAST(ex_ident, ex_start, ex_end, ex_body);
    }
}

export {
    Parser
}
