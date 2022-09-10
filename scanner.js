const WHITESPACE = /\s/;
const NUMBERS = /[0-9]/;
const SINGLEOPERATORS = /[+\-*/()\[\]=<>:]/;
const DOUBLEOPERATORS = ['<-', '<=', '>=', '<>'];
const LETTERS = /[a-z]/i;
const KEYWORDS = ['FUNCTION', 'ENDFUNCTION', 'PROCEDURE', 'ENDPROCEDURE', 'RETURNS', 'RETURN', 'CALL', 'DECLARE',
                  'INTEGER', 'IF', 'THEN', 'ELSE', 'ENDIF', 'WHILE', 'ENDWHILE', 'FOR', 'TO', 'NEXT', 'MOD', 'AND', 'OR', 'NOT',
                  'OUTPUT'];
const TYPES = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'];

class Scanner {
    constructor(input, terminal) {
        this.input = input;
        this.terminal = terminal;
        this.current_line = 1;
    }

    error(err_msg, current_char) {
        this.terminal.writeln(err_msg + ' at line ' + this.current_line + ':' + (current_char + 1));
    }

    scan() {
        let all_tokens = [];
        let lines = this.input.split('\n');
        for (let line of lines) {
            let tokens = this.tokenize_line(line);
            if (tokens == null) {
                return null;
            }
            all_tokens.push(tokens);
            this.current_line++;
        }
        if (all_tokens.length != 0) {
            return all_tokens;
        }
    }

    tokenize_line(line) {
        let current = 0;
        let tokens = [];
        while (current < line.length) {
            let char = line[current];

            // if the line is a comment
            if (char == '/' && line[current + 1] == '/') {
                return [];
            }
            else if (WHITESPACE.test(char)) {
                current++;
                continue;
            }
            else if (SINGLEOPERATORS.test(char)) {
                if (DOUBLEOPERATORS.includes(char + line[current + 1])) {
                    tokens.push({type: 'operator', value: char + line[current + 1]});
                    current += 2;
                    continue;
                }

                tokens.push({type: 'operator', value: char});
                current++;
                continue;
            }
            else if (LETTERS.test(char) || char == '_') {
                let value = '';

                while ((LETTERS.test(char) || NUMBERS.test(char) || char == '_') && current < line.length) {
                    value += char;
                    char = line[++current];
                }

                if (TYPES.includes(value)) {
                    tokens.push({type: 'type', value: value});
                }
                else if (KEYWORDS.includes(value)) {
                    tokens.push({type: value.toLowerCase(), value: value});
                }
                else {
                    tokens.push({type: 'identifier', value: value});
                }
                continue;
            }
            // if the line is a number
            else if (NUMBERS.test(char)) {
                let value = '';

                while (NUMBERS.test(char) && current < line.length) {
                    value += char;
                    char = line[++current];
                }

                tokens.push({type: 'number', value: value});
                continue;
            }
            else if (char == '"') {
                let value = '';
                char = line[++current];

                while (char != '"' && current < line.length) {
                    value += char;
                    char = line[++current];
                }
                if (current == line.length) {
                    this.error('Non-terminated string', current);
                    return null;
                }
                else {
                    current++;
                    tokens.push({type: 'string', value: value});
                }
            }
            else if (char == "'") {
                let value = '';
                char = line[++current];

                while (char != "'" && current < line.length) {
                    value += char;
                    char = line[++current];
                }
                if (current == line.length) {
                    this.error('Non-terminated string', current);
                    return null;
                }
                else if (value.length > 1) {
                    this.error('Char must be a single character', current);
                    return null;
                }
                else {
                    current++;
                    tokens.push({type: 'char', value: value});
                }
            }
            else {
                this.error('Unexpected character', current);
                return null;
            }
        }
        if (tokens.length != 0)
            return tokens;
        return null;
    }
}
