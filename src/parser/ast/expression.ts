import { ExpressionOperator } from './expression-operator';

export interface BaseASTExpressionAtom {
    type: 'ExpressionAtom';
}

export interface ASTExpressionAtomNumber extends BaseASTExpressionAtom {
    atomType: 'Number';
    value: string;
}

export interface ASTExpressionAtomString extends BaseASTExpressionAtom {
    atomType: 'String';
    value: string;
}

export interface ASTExpressionAtomBoolean extends BaseASTExpressionAtom {
    atomType: 'Boolean';
    value: boolean;
}

export interface ASTExpressionAtomVariable extends BaseASTExpressionAtom {
    atomType: 'Variable';
    variableName: string;
}

export type ASTExpressionAtom =
    ASTExpressionAtomNumber |
    ASTExpressionAtomString |
    ASTExpressionAtomBoolean |
    ASTExpressionAtomVariable;

export interface BaseASTExpression {
    type: 'Expression';
}

type OperatorWithOneOperand = ExpressionOperator.Not;

export interface ASTExpressionWithOneOperand extends BaseASTExpression {
    operator: OperatorWithOneOperand;
    rightValue: ASTExpressionAtom | ASTExpression;
}

type OperatorWithTwoOperands =
    ExpressionOperator.Plus |
    ExpressionOperator.And |
    ExpressionOperator.Divide |
    ExpressionOperator.EqualTo |
    ExpressionOperator.GreaterThan |
    ExpressionOperator.GreaterThanOrEqualTo |
    ExpressionOperator.LessThan |
    ExpressionOperator.LessThanOrEqualTo |
    ExpressionOperator.Minus |
    ExpressionOperator.Modulo |
    ExpressionOperator.Multiply |
    ExpressionOperator.NotEqualTo |
    ExpressionOperator.Or;

export interface ASTExpressionWithTwoOperand extends BaseASTExpression {
    leftValue: ASTExpressionAtom;
    operator: OperatorWithTwoOperands;
    rightValue: ASTExpressionAtom | ASTExpression;
}

export type ASTExpressionWithOperator = ASTExpressionWithOneOperand | ASTExpressionWithTwoOperand;
export type ASTExpression = ASTExpressionAtom | ASTExpressionWithOperator;
