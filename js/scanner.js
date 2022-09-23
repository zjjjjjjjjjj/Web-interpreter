import { Error } from "./error.js";


const WHITESPACE = /\s/;
const NUMBERS = /[0-9]/;
const SINGLEOPERATORS = /[+\-*/()\[\]=<>:]/;
const DOUBLEOPERATORS = ['<-', '<=', '>=', '<>'];
const LETTERS = /[a-z]/i;
const BOOLEANS = ['TRUE', 'FALSE'];
const KEYWORDS = ['FUNCTION', 'ENDFUNCTION', 'PROCEDURE', 'ENDPROCEDURE', 'RETURNS', 'RETURN', 'CALL', 'DECLARE', 'ARRAY', 'OF',
                  'IF', 'THEN', 'ELSE', 'ENDIF', 'WHILE', 'ENDWHILE', 'FOR', 'TO', 'STEP', 'NEXT', 'MOD', 'AND', 'OR', 'NOT',
                  'OUTPUT'];
const TYPES = ['INTEGER', 'REAL', 'CHAR', 'STRING', 'BOOLEAN'];

class Scanner {
    constructor(input) {
        this.input = input;
        this.current_line = 1;
    }

    scan() {
        let all_tokens = [];
        let lines = this.input.split('\n');
        for (let line of lines) {
            let tokens = this.tokenize_line(line);
            all_tokens.push(...tokens);
            this.current_line++;
        }
        if (all_tokens.length != 0) 
            return all_tokens;
        return null;
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
                else if (BOOLEANS.includes(value)) {
                    tokens.push({type: 'boolean', value: value});
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
                    throw new Error('Unterminated string', this.current_line, current + 1);
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
                    throw new Error('Unterminated char', this.current_line, current + 1);
                }
                else if (value.length > 1) {
                    throw new Error('Char must be a single character', this.current_line, current + 1);
                }
                else {
                    current++;
                    tokens.push({type: 'char', value: value});
                }
            }
            else {
                throw new Error('Unexpected character', this.current_line, current + 1);
            }
        }
        return tokens;
    }
}

const all_keywords = KEYWORDS.concat(TYPES);

export {
    Scanner,
    all_keywords
}
