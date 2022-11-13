enum TokenType {
  INTEGER = "INTEGER",
  PLUS = "PLUS",
  MINUS = "MINUS",
  MUL = "MUL",
  DIVIDE = "DIVIDE",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  EOF = "EOF",
}

class Token {
  type: TokenType
  value: number | string | undefined

  constructor(type: TokenType, value: number | string | undefined) {
    this.type = type
    this.value = value
  }

  toString() {
    return `Token(${this.type}, {${this.value}})`
  }
}

class Lexer {
  private text: string
  private pos: number
  private currentChar: string | undefined

  constructor(text: string) {
    this.text = text
    this.pos = 0
    this.currentChar = this.text[this.pos]
  }

  raiseError() {
    throw new Error("Invalid character")
  }

  advance() {
    this.pos += 1
    if (this.pos > this.text.length - 1) {
      this.currentChar = undefined
    } else {
      this.currentChar = this.text[this.pos]
    }
  }

  skipWhitespace() {
    while (this.currentChar && this.currentChar === " ") {
      this.advance()
    }
  }

  integer() {
    let result = ""
    while (this.currentChar && !isNaN(parseFloat(this.currentChar))) {
      result += this.currentChar
      this.advance()
    }
    return parseFloat(result)
  }

  nextToken() {
    while (this.currentChar !== undefined) {
      if (this.currentChar === " ") {
        this.skipWhitespace()
        continue
      }

      if (!isNaN(parseFloat(this.currentChar))) {
        return new Token(TokenType.INTEGER, this.integer())
      }

      if (this.currentChar === "(") {
        this.advance()
        return new Token(TokenType.LPAREN, "(")
      }

      if (this.currentChar === ")") {
        this.advance()
        return new Token(TokenType.RPAREN, ")")
      }

      if (this.currentChar === "+") {
        this.advance()
        return new Token(TokenType.PLUS, "+")
      }

      if (this.currentChar === "-") {
        this.advance()
        return new Token(TokenType.MINUS, "-")
      }

      if (this.currentChar === "*") {
        this.advance()
        return new Token(TokenType.MUL, "*")
      }

      if (this.currentChar === "/") {
        this.advance()
        return new Token(TokenType.DIVIDE, "/")
      }

      this.raiseError()
    }

    return new Token(TokenType.EOF, undefined)
  }
}

class AST {}

class UnaryOp extends AST {
  op: Token
  expr: AST

  constructor(op: Token, expr: AST) {
    super()
    this.op = op
    this.expr = expr
  }
}

class BinOp extends AST {
  left: AST
  token: Token
  op: Token
  right: AST

  constructor(left: AST, op: Token, right: AST) {
    super()
    this.left = left
    this.token = op
    this.op = op
    this.right = right
  }
}

class Num extends AST {
  token: Token
  value: number

  constructor(token: Token) {
    super()
    this.token = token
    this.value = token.value as number
  }
}

class Parser {
  private lexer: Lexer
  private currentToken: Token | null

  constructor(lexer: Lexer) {
    this.lexer = lexer
    this.currentToken = lexer.nextToken()
  }

  raiseError() {
    throw new Error("Invalid syntax")
  }

  eat(tokenType: TokenType) {
    if (this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.nextToken()
    } else {
      this.raiseError()
    }
  }

  factor() {
    let token = this.currentToken

    if (token.type === TokenType.PLUS) {
      this.eat(TokenType.PLUS)
      return new UnaryOp(token, this.factor())
    }
    if (token.type === TokenType.MINUS) {
      this.eat(TokenType.MINUS)
      return new UnaryOp(token, this.factor())
    }
    if (token.type === TokenType.INTEGER) {
      this.eat(TokenType.INTEGER)
      return new Num(token)
    }
    if (token.type === TokenType.LPAREN) {
      this.eat(TokenType.LPAREN)
      let result = this.expr()
      this.eat(TokenType.RPAREN)
      return result
    }
  }

  term() {
    let node = this.factor()

    while ([TokenType.MUL, TokenType.DIVIDE].includes(this.currentToken.type)) {
      let token = this.currentToken
      if (token.type === TokenType.MUL) {
        this.eat(TokenType.MUL)
      }
      if (token.type === TokenType.DIVIDE) {
        this.eat(TokenType.DIVIDE)
      }
      node = new BinOp(node, token, this.factor())
    }

    return node
  }

  expr() {
    let node = this.term()

    while ([TokenType.MINUS, TokenType.PLUS].includes(this.currentToken.type)) {
      let token = this.currentToken
      if (token.type === TokenType.MINUS) {
        this.eat(TokenType.MINUS)
      }
      if (token.type === TokenType.PLUS) {
        this.eat(TokenType.PLUS)
      }
      node = new BinOp(node, token, this.term())
    }

    return node
  }

  parse() {
    return this.expr()
  }
}

class Interpreter {
  parser: Parser

  constructor(parser: Parser) {
    this.parser = parser
  }

  visitUnaryOp(node: UnaryOp) {
    if (node.op.type === TokenType.PLUS) {
      return +this.visit(node.expr)
    }
    if (node.op.type === TokenType.MINUS) {
      return -this.visit(node.expr)
    }
  }

  visitBinOp(node: BinOp) {
    if (node.op.type === TokenType.PLUS) {
      return this.visit(node.left) + this.visit(node.right)
    }
    if (node.op.type === TokenType.MINUS) {
      return this.visit(node.left) - this.visit(node.right)
    }
    if (node.op.type === TokenType.MUL) {
      return this.visit(node.left) * this.visit(node.right)
    }
    if (node.op.type === TokenType.DIVIDE) {
      return this.visit(node.left) / this.visit(node.right)
    }
  }

  visitNum(node: Num) {
    return node.value
  }

  visit(node: AST) {
    if (node instanceof UnaryOp) {
      return this.visitUnaryOp(node)
    }
    if (node instanceof BinOp) {
      return this.visitBinOp(node)
    }
    if (node instanceof Num) {
      return this.visitNum(node)
    }
  }

  interpret() {
    let tree = this.parser.parse()
    return this.visit(tree)
  }
}

function main() {
  let input = process.argv.slice(2).join("")
  let lexer = new Lexer(input)
  let parser = new Parser(lexer)
  let interpreter = new Interpreter(parser)
  console.log(interpreter.interpret())
}

main()
