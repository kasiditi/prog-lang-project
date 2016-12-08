import { ASTStatement } from './statement';
import { ASTFunction } from './function';

export interface ASTProgram {
    instructions: (ASTStatement | ASTFunction)[];
}

