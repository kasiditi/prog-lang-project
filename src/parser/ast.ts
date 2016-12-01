import { ASTStatement } from './ast-statement';

export interface ASTProgram {
    instructions: (ASTStatement | ASTFunction)[];
}

export interface ASTFunction {
    type: 'Function';
}
