import { ExpressionOperator } from '../parser/ast/expression-operator';
import {
    ASTExpression,
    ASTExpressionAtom,
    ASTExpressionAtomNumber,
    ASTExpressionAtomString,
    ASTExpressionWithOperator
} from '../parser/ast/expression';
import { ASTStatement } from '../parser/ast/statement';
import { ASTFunction } from '../parser/ast/function';
import { BaseCodeGenerator } from './base-gen';

const INDENT_STR = '\t';
const NEWLINE_STR = '\n';

export class ECMAScriptCodeGenerator extends BaseCodeGenerator {
    private currentIndentLevel = 0;

    private getIndenter() {
        let indenter = '';
        for (let i = 0; i < this.currentIndentLevel; i++) {
            indenter += INDENT_STR;
        }
        return indenter;
    }

    private indent() {
        this.currentIndentLevel++;
    }

    private unindent() {
        this.currentIndentLevel--;
    }

    private wrapLineOfCode(codeLine: String) {
        return this.getIndenter() + codeLine + NEWLINE_STR;
    }

    public generateCode(): string {
        let output = '';

        for (let instruction of this.program.instructions) {
            if (instruction.type === 'Function') {
                output += this.generateFunction(instruction);
            } else {
                output += this.generateStatement(instruction);
            }
        }

        return output;
    }

    private generateFunction(fn: ASTFunction): string {
        let output = '';
        const params = fn.parameters.map(param => param.name).join(', ');

        output += this.wrapLineOfCode(`function ${fn.functionName} (${params}) {`);
        this.indent();
        output += this.generateStatements(fn.statements);
        this.unindent();
        output += this.wrapLineOfCode(`}`);

        return output;
    }

    private generateStatements(statements: ASTStatement[]): string {
        let content = '';
        for (let i = 0; i < statements.length; i++) {
            content += this.generateStatement(statements[i]);
        }
        return content;
    }

    private generateStatement(statement: ASTStatement): string {
        switch (statement.type) {
            case 'VariableDeclaration':
                let declaration = `var ${statement.variableName}`;
                if (statement.initialValue !== undefined) {
                    declaration += ` = ${this.generateExpression(statement.initialValue)}`;
                }
                return this.wrapLineOfCode(`${declaration};`);
            case 'AssignmentSet': {
                return this.wrapLineOfCode(
                    `${statement.variableName} = ${this.generateExpression(statement.value)};`
                );
            }
            case 'AssignmentIncrease': {
                return this.wrapLineOfCode(
                    `${statement.variableName} += ${this.generateExpression(statement.value)};`
                );
            }
            case 'AssignmentDecrease': {
                return this.wrapLineOfCode(
                    `${statement.variableName} -= ${this.generateExpression(statement.value)};`
                );
            }
            case 'PrintStatement': {
                return this.wrapLineOfCode(`VM.print(${this.generateExpression(statement.value)});`);
            }
            case 'IfBlock': {
                let content = this.wrapLineOfCode(
                    `if (${this.generateExpression(statement.ifBlocks[0].condition)}) {`
                );
                this.indent();
                content += this.generateStatements(statement.ifBlocks[0].statements);
                this.unindent();

                for (let i = 1; i < statement.ifBlocks.length; i++) {
                    content += this.wrapLineOfCode(
                        `} else if (${this.generateExpression(statement.ifBlocks[i].condition)}) {`
                    );
                    this.indent();
                    content += this.generateStatements(statement.ifBlocks[i].statements);
                    this.unindent();
                }

                if (statement.elseBlockStatements !== undefined) {
                    content += this.wrapLineOfCode(
                        `} else {`
                    );
                    this.indent();
                    content += this.generateStatements(statement.elseBlockStatements);
                    this.unindent();
                }

                content += this.wrapLineOfCode('}');

                return content;
            }
            case 'WhileBlock': {
                let block = this.wrapLineOfCode(`while (${this.generateExpression(statement.condition)}) {`);
                this.indent();
                block += this.generateStatements(statement.statements);
                this.unindent();
                block += this.wrapLineOfCode(`}`);
                return block;
            }
            case 'ForBlock': {
                let i = statement.iteratorName;
                let from = this.generateExpression(statement.iteratorFrom);
                let to = this.generateExpression(statement.iteratorTo);

                let block = this.wrapLineOfCode(`for (var ${i} = ${from}; ${i} <= ${to}; ${i}++) {`);
                this.indent();
                block += this.generateStatements(statement.statements);
                this.unindent();
                block += this.wrapLineOfCode(`}`);
                return block;
            }
            case 'FunctionCall': {
                const args = statement.callArguments.map(arg => this.generateExpression(arg)).join(', ');

                let content = `${statement.functionName}(${args});`;
                if (statement.resultTarget !== undefined) {
                    content = `${statement.resultTarget} = ${content}`;
                }
                return this.wrapLineOfCode(content);
            }
            case 'FunctionReturn': {
                return this.wrapLineOfCode(`return ${this.generateExpression(statement.returnValue)};`);
            }
        }
    }

    private generateExpression(exp: ASTExpression): string {
        if (exp.type === 'ExpressionAtom') {
            const atom: ASTExpressionAtom = exp;
            switch (atom.atomType) {
                case 'Number': return atom.value;
                case 'String': return JSON.stringify(atom.value);
                case 'Boolean': return atom.value ? 'true' : 'false';
                case 'Variable': return atom.variableName;
            }
            throw new Error('Invalid expression.');
        } else if (exp.type === 'Expression') {
            const e: ASTExpressionWithOperator = exp;

            let r = this.generateExpression(e.rightValue);

            if (e.operator === ExpressionOperator.Not) {
                return `!${r}`;
            }

            let l = this.generateExpression(e.leftValue);
            switch (e.operator) {
                case ExpressionOperator.And: return `${l} && ${r}`;
                case ExpressionOperator.Or: return `${l} || ${r}`;
                case ExpressionOperator.Plus: return `${l} + ${r}`;
                case ExpressionOperator.Minus: return `${l} - ${r}`;
                case ExpressionOperator.Multiply: return `${l} * ${r}`;
                case ExpressionOperator.Divide: return `${l} / ${r}`;
                case ExpressionOperator.Modulo: return `${l} % ${r}`;
                case ExpressionOperator.EqualTo: return `${l} === ${r}`;
                case ExpressionOperator.NotEqualTo: return `${l} !== ${r}`;
                case ExpressionOperator.GreaterThan: return `${l} > ${r}`;
                case ExpressionOperator.GreaterThanOrEqualTo: return `${l} >= ${r}`;
                case ExpressionOperator.LessThan: return `${l} < ${r}`;
                case ExpressionOperator.LessThanOrEqualTo: return `${l} <= ${r}`;
            }
            throw new Error('Invalid expression.');
        } else {
            throw new Error('Invalid expression.');
        }
    }
}
