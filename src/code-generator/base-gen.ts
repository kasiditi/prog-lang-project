import { ASTProgram } from '../parser/ast/program';

export abstract class BaseCodeGenerator {
    public constructor(protected program: ASTProgram) { }

    public abstract generateCode(): string;
}
