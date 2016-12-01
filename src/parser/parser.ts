import { TokenMatcher, TokenMatcherImpl } from '../tokenizer/token-matcher';
import { TokenType } from '../tokenizer/token-type';
import { ASTFunction, ASTProgram } from './ast';
import {
    ASTExpression,
    ASTExpressionAtom,
    ASTExpressionAtomBoolean,
    ASTExpressionAtomNumber,
    ASTExpressionAtomString,
    ASTExpressionAtomVariable,
    ASTExpressionWithOneOperand,
    ASTExpressionWithTwoOperand
} from './ast-expression';
import {
    ASTAssignment,
    ASTAssignmentDecrease,
    ASTAssignmentIncrease,
    ASTAssignmentSet,
    ASTForBlock,
    ASTIfBlock,
    ASTPrintStatement,
    ASTStatement,
    ASTVariableDeclaration,
    ASTWhileBlock
} from './ast-statement';
import { ExpressionOperator } from './expression-operator';
import { VariableType } from './variable-type';

const STATEMENT_FIRST_SET = [
    TokenType.VariableDeclaration,
    TokenType.Set,
    TokenType.Increase,
    TokenType.Decrease,
    TokenType.Multiply,
    TokenType.Divide,
    TokenType.Print,
    TokenType.If,
    TokenType.While,
    TokenType.For
];
const PROGRAM_FIRST_SET = [...STATEMENT_FIRST_SET, TokenType.FunctionDeclaration, TokenType.EndOfFile];

const VARIABLE_TYPE_FIRST_SET = [
    TokenType.VariableTypeNumber,
    TokenType.VariableTypeString,
    TokenType.VariableTypeBoolean
];

const BOOLEAN_VALUE_FIRST_SET = [
    TokenType.BooleanValueTrue,
    TokenType.BooleanValueFalse
];

const OPERATOR_WITH_TWO_OPERANDS_FIRST_SET = [
    TokenType.Plus,
    TokenType.And,
    TokenType.Divide,
    TokenType.EqualTo,
    TokenType.GreaterThan,
    TokenType.GreaterThanOrEqualTo,
    TokenType.LessThan,
    TokenType.LessThanOrEqualTo,
    TokenType.Minus,
    TokenType.Modulo,
    TokenType.Multiply,
    TokenType.NotEqualTo,
    TokenType.Or,
];

export class Parser {
    public static parseSourceCode(sourceCode: string) {
        const tokenMatcher = new TokenMatcherImpl(sourceCode);
        const parser = new Parser(tokenMatcher);
        return parser.parse();
    }

    public constructor(
        private tokenizer: TokenMatcher,
    ) { }

    private createErrorInvalidToken(token: TokenType, cause: string = '') {
        return new Error(`Invalid token ${TokenType[token]}. ${cause}`.trim());
    }

    public parse(): ASTProgram {
        let programAST: ASTProgram = { instructions: [] };

        while (true) {
            const token = this.tokenizer.extractTokenType(PROGRAM_FIRST_SET);

            if (token === TokenType.FunctionDeclaration) {
                programAST.instructions.push(this.createFunction());
            } else if (token === TokenType.EndOfFile) {
                break;
            } else {
                programAST.instructions.push(this.createStatement(token));
            }
        }

        return programAST;
    }

    public createFunction(): ASTFunction {
        throw this.createErrorInvalidToken(TokenType.FunctionDeclaration, 'Function is not supported yet.');
    }

    private createExpressionAtom(): ASTExpressionAtom {
        // Check for boolean
        const boolToken = this.tokenizer.peekNextTokenType(BOOLEAN_VALUE_FIRST_SET);
        if (boolToken !== false) {
            this.tokenizer.extractTokenType(BOOLEAN_VALUE_FIRST_SET);
            const atom: ASTExpressionAtomBoolean = {
                type: 'ExpressionAtom',
                atomType: 'Boolean',
                value: boolToken === TokenType.BooleanValueTrue
            };
            return atom;
        }

        const token = this.tokenizer.peekNextTokenAsString();
        if (token !== false) {
            // Check for number
            if (/^-?([0-9]*\.[0-9]+|[0-9]+)$/.test(token)) {
                this.tokenizer.extractNextTokenAsString();
                const atom: ASTExpressionAtomNumber = {
                    type: 'ExpressionAtom',
                    atomType: 'Number',
                    value: token
                };
                return atom;
            }
            // Check for variable name
            if (/^[a-zA-Z0-9-_]+$/.test(token)) {
                this.tokenizer.extractNextTokenAsString();
                const atom: ASTExpressionAtomVariable = {
                    type: 'ExpressionAtom',
                    atomType: 'Variable',
                    variableName: token
                };
                return atom;
            }
        }

        // Check for string
        const tokenStr = this.tokenizer.extractStringLiteral();
        if (tokenStr === false) {
            throw new Error('Invalid expression.');
        }
        const atom: ASTExpressionAtomString = {
            type: 'ExpressionAtom',
            atomType: 'String',
            value: tokenStr
        };
        return atom;
    }

    private createExpression(): ASTExpression {
        // One Operands
        const nextToken1 = this.tokenizer.peekNextTokenType([TokenType.Not]);
        if (nextToken1 !== false) {
            this.tokenizer.extractTokenType([TokenType.Not]);
            const notExpression: ASTExpressionWithOneOperand = {
                type: 'Expression',
                operand: ExpressionOperator.Not,
                rightValue: this.createExpression()
            };
            return notExpression;
        }

        const atom = this.createExpressionAtom();

        const nextToken2 = this.tokenizer.peekNextTokenType(OPERATOR_WITH_TWO_OPERANDS_FIRST_SET);
        if (nextToken2 !== false) {
            // Two Operands
            let operator: ExpressionOperator;
            switch (nextToken2) {
                case TokenType.Plus: operator = ExpressionOperator.Plus; break;
                case TokenType.And: operator = ExpressionOperator.And; break;
                case TokenType.Divide: operator = ExpressionOperator.Divide; break;
                case TokenType.EqualTo: operator = ExpressionOperator.EqualTo; break;
                case TokenType.GreaterThan: operator = ExpressionOperator.GreaterThan; break;
                case TokenType.GreaterThanOrEqualTo: operator = ExpressionOperator.GreaterThanOrEqualTo; break;
                case TokenType.LessThan: operator = ExpressionOperator.LessThan; break;
                case TokenType.LessThanOrEqualTo: operator = ExpressionOperator.LessThanOrEqualTo; break;
                case TokenType.Minus: operator = ExpressionOperator.Minus; break;
                case TokenType.Modulo: operator = ExpressionOperator.Modulo; break;
                case TokenType.Multiply: operator = ExpressionOperator.Multiply; break;
                case TokenType.NotEqualTo: operator = ExpressionOperator.NotEqualTo; break;
                case TokenType.Or: operator = ExpressionOperator.Or; break;
                default: throw this.createErrorInvalidToken(nextToken2);
            }

            this.tokenizer.extractTokenType(OPERATOR_WITH_TWO_OPERANDS_FIRST_SET);

            const expression: ASTExpressionWithTwoOperand = {
                type: 'Expression',
                leftValue: atom,
                operator: operator,
                rightValue: this.createExpression()
            };
            return expression;
        } else {
            // No Operand
            return atom;
        }
    }

    private createVariableDeclaration(): ASTVariableDeclaration {
        const variableName = this.tokenizer.extractNextTokenAsString();
        this.tokenizer.extractTokenType([TokenType.ToBe]);

        let isMutable = false;
        let variableType: VariableType | undefined = undefined;
        let initialValue: ASTExpression | undefined = undefined;

        let token = this.tokenizer.extractTokenType([
            TokenType.EqualTo,
            TokenType.InitializedTo,
            TokenType.Mutable,
            ...VARIABLE_TYPE_FIRST_SET,
        ]);

        if (token === TokenType.Mutable) {
            isMutable = true;
            const nextToken = this.tokenizer.extractTokenType(VARIABLE_TYPE_FIRST_SET);
            switch (nextToken) {
                case TokenType.VariableTypeNumber:
                    variableType = VariableType.Number;
                    break;
                case TokenType.VariableTypeString:
                    variableType = VariableType.String;
                    break;
                case TokenType.VariableTypeBoolean:
                    variableType = VariableType.Boolean;
                    break;
                default:
                    throw this.createErrorInvalidToken(nextToken);
            }
        } else if (token === TokenType.VariableTypeNumber) {
            variableType = VariableType.Number;
        } else if (token === TokenType.VariableTypeString) {
            variableType = VariableType.String;
        } else if (token === TokenType.VariableTypeBoolean) {
            variableType = VariableType.Boolean;
        }

        if (token === TokenType.Mutable ||
            token === TokenType.VariableTypeNumber ||
            token === TokenType.VariableTypeString ||
            token === TokenType.VariableTypeBoolean) {
            const initFirstSet = [TokenType.EqualTo, TokenType.InitializedTo];

            if (this.tokenizer.peekNextTokenType(initFirstSet) !== false) {
                token = this.tokenizer.extractTokenType(initFirstSet);
            }
        }

        if (token === TokenType.EqualTo || token === TokenType.InitializedTo) {
            initialValue = this.createExpression();
        }

        return {
            type: 'VariableDeclaration',
            variableName: variableName,
            variableType: variableType,
            isMutable: isMutable,
            value: initialValue
        };
    }

    private createAssignment(type: TokenType): ASTAssignment {
        const variableName = this.tokenizer.extractNextTokenAsString();
        if (type === TokenType.Set) {
            this.tokenizer.extractTokenType([TokenType.ToBe]);
        } else {
            this.tokenizer.extractTokenType([TokenType.By]);
        }
        const expression = this.createExpression();

        switch (type) {
            case TokenType.Set: {
                const assignment: ASTAssignmentSet = {
                    type: 'AssignmentSet',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
            case TokenType.Increase: {
                const assignment: ASTAssignmentIncrease = {
                    type: 'AssignmentIncrease',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
            case TokenType.Decrease: {
                const assignment: ASTAssignmentDecrease = {
                    type: 'AssignmentDecrease',
                    variableName: variableName,
                    value: expression
                };
                return assignment;
            }
        }

        throw this.createErrorInvalidToken(type);
    }

    private createPrintStatement(): ASTPrintStatement {
        return {
            type: 'PrintStatement',
            value: this.createExpression()
        };
    }

    private createWhileLoop(): ASTWhileBlock {
        const condition = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.Do]);
        const statements = this.createStatements();
        this.tokenizer.extractTokenType([TokenType.EndOfWhile]);

        return {
            type: 'WhileBlock',
            condition: condition,
            statements: statements
        };
    }

    private createForLoop(): ASTForBlock {
        const iteratorName = this.tokenizer.extractNextTokenAsString();

        this.tokenizer.extractTokenType([TokenType.From]);
        const from = this.createExpression();

        this.tokenizer.extractTokenType([TokenType.To]);
        const to = this.createExpression();

        this.tokenizer.extractTokenType([TokenType.Do]);
        const statements = this.createStatements();
        this.tokenizer.extractTokenType([TokenType.EndOfFor]);

        return {
            type: 'ForBlock',
            iteratorName: iteratorName,
            iteratorFrom: from,
            iteratorTo: to,
            statements: statements
        };
    }

    private createIfBlock(): ASTIfBlock {
        const firstCondition = this.createExpression();
        this.tokenizer.extractTokenType([TokenType.Do]);
        const firstStatements = this.createStatements();

        let ifBlocks = [{
            condition: firstCondition,
            statements: firstStatements
        }];

        let elseBlockStatement: ASTStatement[] | undefined = undefined;

        while (true) {
            const token = this.tokenizer.peekNextTokenType([TokenType.ButIf, TokenType.Otherwise]);
            if (token === TokenType.ButIf) {
                this.tokenizer.extractTokenType([TokenType.ButIf]);
                const condition = this.createExpression();
                this.tokenizer.extractTokenType([TokenType.Do]);
                const statements = this.createStatements();
                ifBlocks.push({ condition, statements });
            } else if (token === TokenType.Otherwise) {
                this.tokenizer.extractTokenType([TokenType.Otherwise]);
                this.tokenizer.extractTokenType([TokenType.Do]);
                elseBlockStatement = this.createStatements();
                break;
            } else {
                break;
            }
        }
        this.tokenizer.extractTokenType([TokenType.EndOfIf]);

        return {
            type: 'IfBlock',
            ifBlocks: ifBlocks,
            elseBlockStatements: elseBlockStatement
        };
    }

    public createStatements(): ASTStatement[] {
        // It should have at least one statement
        const statements = [this.createStatement()];

        while (true) {
            const statementType = this.tokenizer.peekNextTokenType(STATEMENT_FIRST_SET);
            if (statementType !== false) {
                statements.push(this.createStatement(this.tokenizer.extractTokenType(STATEMENT_FIRST_SET)));
            } else {
                break;
            }
        }

        return statements;
    }

    public createStatement(statementType?: TokenType): ASTStatement {
        if (statementType === undefined) {
            statementType = this.tokenizer.extractTokenType(STATEMENT_FIRST_SET);
        }

        switch (statementType) {
            case TokenType.VariableDeclaration:
                return this.createVariableDeclaration();
            case TokenType.Set:
            case TokenType.Increase:
            case TokenType.Decrease:
                return this.createAssignment(statementType);
            case TokenType.Print:
                return this.createPrintStatement();
            case TokenType.If:
                return this.createIfBlock();
            case TokenType.While:
                return this.createWhileLoop();
            case TokenType.For:
                return this.createForLoop();
        }

        throw this.createErrorInvalidToken(statementType);
    }
}
