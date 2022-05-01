enum TokenType {
    INTEGER = 'INTEGER',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    MUL = 'MUL',
    DIVIDE = 'DIVIDE',
    EOF = 'EOF'
}

class Token {
    type: TokenType;
    value: number | string | undefined;

    constructor(type: TokenType, value: number | string | undefined) {
        this.type = type;
        this.value = value;
    }

    toString() {
        return `Token(${this.type}, {${this.value}})`;
    }
}

class Interpreter {
    private text: string;
    private pos: number;
    private currentToken: Token | null;
    private currentChar: string | undefined;

    constructor(text: string) {
        this.text = text;
        this.pos = 0;
        this.currentToken = null;
        this.currentChar = this.text[this.pos];
    }

    raiseError() {
        throw new Error('Error parsing input')
    }

    advance() {
        this.pos += 1;
        if (this.pos > this.text.length - 1) {
            this.currentChar = undefined;
        } else {
            this.currentChar = this.text[this.pos];
        }
    }

    skipWhitespace() {
        while (this.currentChar && this.currentChar === ' ') {
            this.advance();
        }
    }

    integer() {
        let result = '';
        while (this.currentChar && !isNaN(parseFloat(this.currentChar))) {
            result += this.currentChar;
            this.advance();
        }
        return parseFloat(result);
    }

    nextToken() {
        while (this.currentChar !== undefined) {
            if (this.currentChar === ' ') {
                this.skipWhitespace();
                continue;
            }
    
            if (!isNaN(parseFloat(this.currentChar))) {
                return new Token(TokenType.INTEGER, this.integer());
            }
    
            if (this.currentChar === '+') {
                this.advance();
                return new Token(TokenType.PLUS, '+');
            }
    
            if (this.currentChar === '-') {
                this.advance();
                return new Token(TokenType.MINUS, '-');
            }

            if (this.currentChar === '*') {
                this.advance();
                return new Token(TokenType.MUL, '*');
            }

            if (this.currentChar === '/') {
                this.advance();
                return new Token(TokenType.DIVIDE, '/');
            }

            this.raiseError();
        }

        return new Token(TokenType.EOF, undefined);
    }

    eat(tokenType: TokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.nextToken();
        } else {
            this.raiseError();
        }
    }

    factor() {
        let token = this.currentToken;
        this.eat(TokenType.INTEGER);
        return token.value;
    }

    term() {
        let result = this.factor();

        while ([TokenType.MUL, TokenType.DIVIDE].includes(this.currentToken.type)) {
            let token = this.currentToken;
            if (token.type === TokenType.MUL) {
                this.eat(TokenType.MUL);
                result = result as number * (this.factor() as number);
            }
            if (token.type === TokenType.DIVIDE) {
                this.eat(TokenType.DIVIDE);
                result = result as number / (this.factor() as number); 
            }
        }

        return result;
    }

    expr() {
        this.currentToken = this.nextToken();

        let result = this.term();

        while ([TokenType.MINUS, TokenType.PLUS].includes(this.currentToken.type)) {
            let token = this.currentToken;
            if (token.type === TokenType.MINUS) {
                this.eat(TokenType.MINUS);
                result = result as number - (this.term() as number);
            }
            if (token.type === TokenType.PLUS) {
                this.eat(TokenType.PLUS);
                result = result as number + (this.term() as number);
            }
        }

        return result;
    }
}

function main() {
    let input = process.argv.slice(2).join('');
    let interpreter = new Interpreter(input);
    console.log(interpreter.expr());
}

main();