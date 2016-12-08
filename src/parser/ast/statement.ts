import { VariableTypeInfo } from './variable-type-info';
import { ASTExpression } from './expression';
import { VariableType } from './variable-type';

export interface ASTVariableDeclaration {
    type: 'VariableDeclaration';
    variableName: string;
    variableTypeInfo: VariableTypeInfo | undefined;
    initialValue: ASTExpression | undefined;
}

interface BaseASTAssignment {
    variableName: string;
    value: ASTExpression;
}

export interface ASTAssignmentSet extends BaseASTAssignment {
    type: 'AssignmentSet';
}

export interface ASTAssignmentIncrease extends BaseASTAssignment {
    type: 'AssignmentIncrease';
}

export interface ASTAssignmentDecrease extends BaseASTAssignment {
    type: 'AssignmentDecrease';
}

export type ASTAssignment =
    ASTAssignmentSet |
    ASTAssignmentIncrease |
    ASTAssignmentDecrease;

export interface ASTPrintStatement {
    type: 'PrintStatement';
    value: ASTExpression;
}

export interface ASTIfBlock {
    type: 'IfBlock';
    ifBlocks: {
        condition: ASTExpression;
        statements: ASTStatement[];
    }[];
    elseBlockStatements: ASTStatement[] | undefined;
}

export interface ASTWhileBlock {
    type: 'WhileBlock';
    condition: ASTExpression;
    statements: ASTStatement[];
}

export interface ASTForBlock {
    type: 'ForBlock';
    iteratorName: string;
    iteratorFrom: ASTExpression;
    iteratorTo: ASTExpression;
    statements: ASTStatement[];
}

export type ASTStatement =
    ASTVariableDeclaration |
    ASTAssignmentSet |
    ASTAssignmentIncrease |
    ASTAssignmentDecrease |
    ASTPrintStatement |
    ASTIfBlock |
    ASTWhileBlock |
    ASTForBlock;
