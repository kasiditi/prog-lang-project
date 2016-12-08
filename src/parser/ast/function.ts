import { ASTExpression } from './expression';
import { ASTStatement } from './statement';
import { VariableTypeInfo } from './variable-type-info';
import { VariableType } from './variable-type';

export interface ASTFunctionParameter {
    name: string;
    typeInfo: VariableTypeInfo;
}

export interface ASTFunction {
    type: 'Function';
    functionName: string;
    parameters: ASTFunctionParameter[];
    returnType: VariableType | undefined;
    statements: ASTStatement[];
}
