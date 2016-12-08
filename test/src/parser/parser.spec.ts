import { VariableTypeInfo } from '../../../src/parser/ast/variable-type-info';
import { ASTFunction } from '../../../src/parser/ast/function';
import {
    ASTExpression,
    ASTExpressionAtom,
    ASTExpressionAtomBoolean,
    ASTExpressionAtomNumber,
    ASTExpressionAtomString,
    ASTExpressionAtomVariable,
    ASTExpressionWithTwoOperand
} from '../../../src/parser/ast/expression';
import {
    ASTAssignmentDecrease,
    ASTAssignmentIncrease,
    ASTAssignmentSet,
    ASTForBlock,
    ASTIfBlock,
    ASTPrintStatement,
    ASTStatement,
    ASTWhileBlock
} from '../../../src/parser/ast/statement';
import { Parser } from '../../../src/parser/parser';
import { VariableType } from '../../../src/parser/ast/variable-type';

describe('Parser', () => {
    let uut: Parser;

    describe('variable declaration', () => {
        it('should parse basic declaration correctly', () => {
            const sourceCode = `
                Define variable abc to be number
            `;
            const instructions = Parser.parseSourceCode(sourceCode).instructions;
            expect(instructions.length).toBe(1);
            const result = instructions[0];
            expect(result.type).toBe('VariableDeclaration');
            if (result.type === 'VariableDeclaration') {
                expect(result.variableName).toBe('abc');
                expect(result.variableTypeInfo!.variableType).toBe(VariableType.Number);
                expect(result.variableTypeInfo!.isMutable).toBe(false);
                expect(result.initialValue).toBe(undefined);
            }
        });

        it('should parse declaration with mutable flag correctly', () => {
            const sourceCode = `
                Define variable hello to be mutable boolean
            `;
            const instructions = Parser.parseSourceCode(sourceCode).instructions;
            expect(instructions.length).toBe(1);
            const result = instructions[0];
            expect(result.type).toBe('VariableDeclaration');
            if (result.type === 'VariableDeclaration') {
                expect(result.variableName).toBe('hello');
                expect(result.variableTypeInfo!.variableType).toBe(VariableType.Boolean);
                expect(result.variableTypeInfo!.isMutable).toBe(true);
                expect(result.initialValue).toBe(undefined);
            }
        });

        it('should parse declaration with initialization correctly', () => {
            const sourceCode = `
                Define variable hello to be mutable string equal to "abcde"
                Define variable world to be boolean initialized to false
                Define variable every to be initialized to 123
                Define variable name to be equal to hello
            `;
            const instructions = Parser.parseSourceCode(sourceCode).instructions;
            expect(instructions.length).toBe(4);

            const inst1 = instructions[0];
            expect(inst1.type).toBe('VariableDeclaration');
            if (inst1.type === 'VariableDeclaration') {
                expect(inst1.variableName).toBe('hello');
                expect(inst1.variableTypeInfo!.variableType).toBe(VariableType.String);
                expect(inst1.variableTypeInfo!.isMutable).toBe(true);
                expect(inst1.initialValue!.type).toBe('ExpressionAtom');
                expect((inst1.initialValue as ASTExpressionAtom).atomType).toBe('String');
                expect((inst1.initialValue as ASTExpressionAtomString).value).toBe('abcde');
            }

            const inst2 = instructions[1];
            expect(inst2.type).toBe('VariableDeclaration');
            if (inst2.type === 'VariableDeclaration') {
                expect(inst2.variableName).toBe('world');
                expect(inst2.variableTypeInfo!.variableType).toBe(VariableType.Boolean);
                expect(inst2.variableTypeInfo!.isMutable).toBe(false);
                expect(inst2.initialValue!.type).toBe('ExpressionAtom');
                expect((inst2.initialValue as ASTExpressionAtom).atomType).toBe('Boolean');
                expect((inst2.initialValue as ASTExpressionAtomBoolean).value).toBe(false);
            }

            const inst3 = instructions[2];
            expect(inst3.type).toBe('VariableDeclaration');
            if (inst3.type === 'VariableDeclaration') {
                expect(inst3.variableName).toBe('every');
                expect(inst3.variableTypeInfo).toBe(undefined);
                expect(inst3.initialValue!.type).toBe('ExpressionAtom');
                expect((inst3.initialValue as ASTExpressionAtom).atomType).toBe('Number');
                expect((inst3.initialValue as ASTExpressionAtomNumber).value).toBe('123');
            }

            const inst4 = instructions[3];
            expect(inst4.type).toBe('VariableDeclaration');
            if (inst4.type === 'VariableDeclaration') {
                expect(inst4.variableName).toBe('name');
                expect(inst4.variableTypeInfo).toBe(undefined);
                expect(inst4.initialValue!.type).toBe('ExpressionAtom');
                expect((inst4.initialValue as ASTExpressionAtom).atomType).toBe('Variable');
                expect((inst4.initialValue as ASTExpressionAtomVariable).variableName).toBe('hello');
            }
        });
    });

    describe('assignment', () => {
        let resultInsts: ASTStatement[];

        beforeAll(() => {
            resultInsts = Parser.parseSourceCode(`
                Set a to be "new string"
                Increase b by 2
                Decrease c by 3
            `).instructions as ASTStatement[];
        });

        it('should have correct number of expression', () => {
            expect(resultInsts.length).toBe(3);
        });

        it('should parse set assignment correctly', () => {
            const inst = resultInsts[0] as ASTAssignmentSet;
            expect(inst.type).toBe('AssignmentSet');
            expect(inst.variableName).toBe('a');
            expect(inst.value.type).toBe('ExpressionAtom');
            expect((inst.value as ASTExpressionAtomString).value).toBe('new string');
        });

        it('should parse increase assignment correctly', () => {
            const inst = resultInsts[1] as ASTAssignmentIncrease;
            expect(inst.type).toBe('AssignmentIncrease');
            expect(inst.variableName).toBe('b');
            expect(inst.value.type).toBe('ExpressionAtom');
            expect((inst.value as ASTExpressionAtomNumber).value).toBe('2');
        });

        it('should parse decrease assignment correctly', () => {
            const inst = resultInsts[2] as ASTAssignmentDecrease;
            expect(inst.type).toBe('AssignmentDecrease');
            expect(inst.variableName).toBe('c');
            expect(inst.value.type).toBe('ExpressionAtom');
            expect((inst.value as ASTExpressionAtomNumber).value).toBe('3');
        });
    });

    it('should parse print statement correctly', () => {
        const instructions = Parser.parseSourceCode(`
            print "hello"
            print 123
        `).instructions;
        expect(instructions.length).toBe(2);

        const inst1 = instructions[0] as ASTPrintStatement;
        expect(inst1.type === 'PrintStatement');
        expect(inst1.value.type).toBe('ExpressionAtom');
        expect((inst1.value as ASTExpressionAtom).atomType).toBe('String');
        expect((inst1.value as ASTExpressionAtomString).value).toBe('hello');

        const inst2 = instructions[1] as ASTPrintStatement;
        expect(inst2.type === 'PrintStatement');
        expect(inst2.value.type).toBe('ExpressionAtom');
        expect((inst2.value as ASTExpressionAtom).atomType).toBe('Number');
        expect((inst2.value as ASTExpressionAtomNumber).value).toBe('123');
    });

    it('should parse while-loop correctly', () => {
        const instructions = Parser.parseSourceCode(`
            while a less than 10 do
                increase a by 1
            end of while
        `).instructions;
        expect(instructions.length).toBe(1);

        const inst = instructions[0] as ASTWhileBlock;
        expect(inst.type === 'WhileBlock');

        const condition = inst.condition as ASTExpressionWithTwoOperand;
        expect(condition.type).toBe('Expression');
        expect(condition.leftValue.type).toBe('ExpressionAtom');
        expect((condition.leftValue as ASTExpressionAtomVariable).variableName).toBe('a');
        expect(condition.rightValue.type).toBe('ExpressionAtom');
        expect((condition.rightValue as ASTExpressionAtomNumber).value).toBe('10');

        expect(inst.statements.length).toBe(1);
        const statement = inst.statements[0] as ASTAssignmentIncrease;
        expect(statement.variableName).toBe('a');
        expect((statement.value as ASTExpressionAtomNumber).value).toBe('1');
    });

    it('should parse for-loop correctly', () => {
        const instructions = Parser.parseSourceCode(`
            for i from 1 to 10 do
                print i
            end of for
        `).instructions;
        expect(instructions.length).toBe(1);

        const inst = instructions[0] as ASTForBlock;
        expect(inst.type === 'ForBlock');

        expect(inst.iteratorName).toBe('i');
        expect(inst.iteratorFrom.type).toBe('ExpressionAtom');
        expect((inst.iteratorFrom as ASTExpressionAtomNumber).value).toBe('1');
        expect(inst.iteratorTo.type).toBe('ExpressionAtom');
        expect((inst.iteratorTo as ASTExpressionAtomNumber).value).toBe('10');

        expect(inst.statements.length).toBe(1);
        const statement = inst.statements[0] as ASTPrintStatement;
        expect(statement.type).toBe('PrintStatement');
        expect((statement.value as ASTExpressionAtomVariable).variableName).toBe('i');
    });

    describe('if-block', () => {
        const expectSingleNumberPrint = (statements: ASTStatement[], expectedNumber: string) => {
            expect(statements.length).toBe(1);
            const statement = statements[0];
            expect(statement.type).toBe('PrintStatement');
            if (statement.type === 'PrintStatement') {
                expect(statement.value.type).toBe('ExpressionAtom');
                expect((statement.value as ASTExpressionAtom).atomType).toBe('Number');
                expect((statement.value as ASTExpressionAtomNumber).value).toBe(expectedNumber);
            }
        };

        const expectVariableExpressionAtom = (expression: ASTExpression, expectedVariableName: string) => {
            expect(expression.type).toBe('ExpressionAtom');
            if (expression.type === 'ExpressionAtom') {
                expect((expression as ASTExpressionAtom).atomType).toBe('Variable');
                expect((expression as ASTExpressionAtomVariable).variableName).toBe(expectedVariableName);
            }
        };

        it('should parse basic block correctly', () => {
            const instructions = Parser.parseSourceCode(`
                if a do
                    print 1
                end of if
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTIfBlock;
            expect(inst.type).toBe('IfBlock');

            expect(inst.ifBlocks.length).toBe(1);
            expectVariableExpressionAtom(inst.ifBlocks[0].condition, 'a');
            expectSingleNumberPrint(inst.ifBlocks[0].statements, '1');

            expect(inst.elseBlockStatements).toBeUndefined();
        });

        it('should parse if-otherwise pattern correctly', () => {
            const instructions = Parser.parseSourceCode(`
                if a do
                    print 1
                otherwise do
                    print 2
                end of if
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTIfBlock;
            expect(inst.type).toBe('IfBlock');

            expect(inst.ifBlocks.length).toBe(1);
            expectVariableExpressionAtom(inst.ifBlocks[0].condition, 'a');
            expectSingleNumberPrint(inst.ifBlocks[0].statements, '1');

            expectSingleNumberPrint(inst.elseBlockStatements!, '2');
        });

        it('should parse if-but-if without otherwise correctly', () => {
            const instructions = Parser.parseSourceCode(`
                if a do
                    print 1
                but if b do
                    print 2
                but if c do
                    print 3
                end of if
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTIfBlock;
            expect(inst.type).toBe('IfBlock');

            expect(inst.ifBlocks.length).toBe(3);
            expectVariableExpressionAtom(inst.ifBlocks[0].condition, 'a');
            expectSingleNumberPrint(inst.ifBlocks[0].statements, '1');
            expectVariableExpressionAtom(inst.ifBlocks[1].condition, 'b');
            expectSingleNumberPrint(inst.ifBlocks[1].statements, '2');
            expectVariableExpressionAtom(inst.ifBlocks[2].condition, 'c');
            expectSingleNumberPrint(inst.ifBlocks[2].statements, '3');

            expect(inst.elseBlockStatements).toBeUndefined();
        });

        it('should parse if-but-if-otherwise correctly', () => {
            const instructions = Parser.parseSourceCode(`
                if a do
                    print 1
                but if b do
                    print 2
                but if c do
                    print 3
                but if d do
                    print 4
                otherwise do
                    print 5
                end of if
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTIfBlock;
            expect(inst.type).toBe('IfBlock');

            expect(inst.ifBlocks.length).toBe(4);
            expectVariableExpressionAtom(inst.ifBlocks[0].condition, 'a');
            expectSingleNumberPrint(inst.ifBlocks[0].statements, '1');
            expectVariableExpressionAtom(inst.ifBlocks[1].condition, 'b');
            expectSingleNumberPrint(inst.ifBlocks[1].statements, '2');
            expectVariableExpressionAtom(inst.ifBlocks[2].condition, 'c');
            expectSingleNumberPrint(inst.ifBlocks[2].statements, '3');
            expectVariableExpressionAtom(inst.ifBlocks[3].condition, 'd');
            expectSingleNumberPrint(inst.ifBlocks[3].statements, '4');

            expectSingleNumberPrint(inst.elseBlockStatements!, '5');
        });
    });

    describe('function block', () => {
        const expectSingleNumberPrint = (statements: ASTStatement[], expectedNumber: string) => {
            expect(statements.length).toBe(1);
            const statement = statements[0];
            expect(statement.type).toBe('PrintStatement');
            if (statement.type === 'PrintStatement') {
                expect(statement.value.type).toBe('ExpressionAtom');
                expect((statement.value as ASTExpressionAtom).atomType).toBe('Number');
                expect((statement.value as ASTExpressionAtomNumber).value).toBe(expectedNumber);
            }
        };

        it('should parse basic function block correctly', () => {
            const instructions = Parser.parseSourceCode(`
                define function printNumber do
                    print 5
                end of function
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTFunction;
            expect(inst.type).toBe('Function');

            expect(inst.functionName).toBe('printNumber');

            expect(inst.parameters.length).toBe(0);
            expect(inst.returnType).toBe(undefined);

            expectSingleNumberPrint(inst.statements, '5');
        });

        it('should not allow nested function declaration', () => {
            expect(() => Parser.parseSourceCode(`
                define function printNumber do
                    define function helperFunction do
                        print 5
                    end of function
                end of function
            `)).toThrow();
        });

        it('should parse function block with parameters correctly', () => {
            const instructions = Parser.parseSourceCode(`
                define function printSeven with param a as mutable number , b as string do
                    print 7
                end of function
            `).instructions;
            expect(instructions.length).toBe(1);
            const inst = instructions[0] as ASTFunction;
            expect(inst.type).toBe('Function');

            expect(inst.functionName).toBe('printSeven');

            expect(inst.parameters.length).toBe(2);
            expect(inst.parameters[0].name).toBe('a');
            expect(inst.parameters[0].typeInfo.variableType).toBe(VariableType.Number);
            expect(inst.parameters[0].typeInfo.isMutable).toBe(true);
            expect(inst.parameters[1].name).toBe('b');
            expect(inst.parameters[1].typeInfo.variableType).toBe(VariableType.String);
            expect(inst.parameters[1].typeInfo.isMutable).toBe(false);

            expect(inst.returnType).toBe(undefined);

            expectSingleNumberPrint(inst.statements, '7');
        });
    });
});
