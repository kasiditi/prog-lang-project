import { BaseCodeGenerator } from './code-generator/base-gen';
import { ECMAScriptCodeGenerator } from './code-generator/ecmascript-gen';
import { Parser } from './parser/parser';

export { Parser } from './parser/parser';
export { ECMAScriptCodeGenerator } from './code-generator/ecmascript-gen';

type SupportedLanguage = 'js';

export function compile(sourceCode: string, language: SupportedLanguage) {
    const ast = Parser.parseSourceCode(sourceCode);

    let codeGenerator: BaseCodeGenerator;
    switch (language) {
        case 'js':
            codeGenerator = new ECMAScriptCodeGenerator(ast);
            break;
        default:
            throw new Error(`Language "${language}" is not supported.`);
    }

    return codeGenerator.generateCode();
}
