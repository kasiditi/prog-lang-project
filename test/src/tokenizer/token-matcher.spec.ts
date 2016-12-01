import { TokenType } from '../../../src/tokenizer/token-type';
import { MatchingRule } from '../../../src/tokenizer/matching-rule';
import { TokenMatcherImpl } from '../../../src/tokenizer/token-matcher';

describe('TokenMatcher', () => {
    const rules: MatchingRule[] = [
        { matcher: ',', tokenType: TokenType.Comma },
        { matcher: 'as', tokenType: TokenType.As },
        { matcher: 'true', tokenType: TokenType.BooleanValueTrue },
        { matcher: 'false', tokenType: TokenType.BooleanValueFalse },
        { matcher: 'end of if', tokenType: TokenType.EndOfIf },
        { matcher: 'if', tokenType: TokenType.If },
        { matcher: 'define function', tokenType: TokenType.FunctionDeclaration },
        { matcher: 'define variable', tokenType: TokenType.VariableDeclaration }
    ];

    const expectedBooleanTokens = [TokenType.BooleanValueTrue, TokenType.BooleanValueFalse];
    const expectedDeclarationTokens = [TokenType.FunctionDeclaration, TokenType.VariableDeclaration];
    const expectAnyValidTokens = rules.map(rule => rule.tokenType);

    it('should get basic token type correctly', () => {
        const extractBool = (code: string) => new TokenMatcherImpl(code, rules).extractTokenType(expectedBooleanTokens);
        expect(extractBool('false')).toBe(TokenType.BooleanValueFalse);
        expect(extractBool('true')).toBe(TokenType.BooleanValueTrue);
        expect(extractBool('   true    ')).toBe(TokenType.BooleanValueTrue);
        expect(extractBool('false true false')).toBe(TokenType.BooleanValueFalse);
        expect(() => extractBool('define')).toThrow();
        expect(() => extractBool('trfalse')).toThrow();
        expect(() => extractBool('falsetruefalse')).toThrow();
        expect(() => extractBool('')).toThrow();
        expect(() => extractBool('    ')).toThrow();
        expect(() => extractBool('true!')).toThrow();
    });

    it('should be able to tokenize continuously', () => {
        const uut = new TokenMatcherImpl(`
            define    function   as true
                if as false 55555_555
                    define     variable define
                    function abc def
                end of if
        `, rules);

        expect(uut.extractTokenType(expectedDeclarationTokens)).toBe(TokenType.FunctionDeclaration);
        expect(uut.extractTokenType([TokenType.If, TokenType.As])).toBe(TokenType.As);
        expect(uut.extractTokenType(expectedBooleanTokens)).toBe(TokenType.BooleanValueTrue);
        expect(uut.extractTokenType([TokenType.If, TokenType.EndOfFile])).toBe(TokenType.If);
        expect(uut.extractTokenType(expectAnyValidTokens)).toBe(TokenType.As);
        expect(uut.extractTokenType(expectAnyValidTokens)).toBe(TokenType.BooleanValueFalse);
        expect(uut.extractNextTokenAsString()).toBe('55555_555');
        expect(uut.extractTokenType(expectedDeclarationTokens)).toBe(TokenType.VariableDeclaration);
        expect(uut.extractTokenType(expectedDeclarationTokens)).toBe(TokenType.FunctionDeclaration);
        expect(uut.extractNextTokenAsString()).toBe('abc');
        expect(uut.extractNextTokenAsString()).toBe('def');
        expect(uut.extractTokenType([...expectAnyValidTokens, TokenType.EndOfFile])).toBe(TokenType.EndOfIf);
        expect(uut.extractTokenType([...expectAnyValidTokens, TokenType.EndOfFile])).toBe(TokenType.EndOfFile);
    });

    it('should be able to continue tokenizing after fail extraction(s)', () => {
        const uut = new TokenMatcherImpl('  DEFINE FUNCTION  AbdeforfojrG  AS IF AS FALSE', rules);

        expect(uut.extractTokenType(expectedDeclarationTokens)).toBe(TokenType.FunctionDeclaration);
        expect(() => uut.extractTokenType(expectedBooleanTokens)).toThrow();
        expect(uut.extractNextTokenAsString()).toBe('AbdeforfojrG');
        expect(() => uut.extractTokenType(expectedBooleanTokens)).toThrow();
        expect(uut.extractTokenType([TokenType.As, TokenType.If])).toBe(TokenType.As);
        expect(uut.extractTokenType([TokenType.As, TokenType.If])).toBe(TokenType.If);
        expect(() => uut.extractTokenType(expectedBooleanTokens)).toThrow();
        expect(() => uut.extractTokenType(expectedDeclarationTokens)).toThrow();
        expect(uut.extractTokenType([TokenType.As, TokenType.EndOfFile])).toBe(TokenType.As);
        expect(uut.extractTokenType([TokenType.If, TokenType.BooleanValueFalse])).toBe(TokenType.BooleanValueFalse);
        expect(() => uut.extractTokenType([...expectAnyValidTokens])).toThrow();
        expect(uut.extractTokenType([...expectAnyValidTokens, TokenType.EndOfFile])).toBe(TokenType.EndOfFile);

        const uut2 = new TokenMatcherImpl('define variable hello', rules);

        expect(uut2.extractTokenType(expectedDeclarationTokens)).toBe(TokenType.VariableDeclaration);
        expect(() => uut2.extractTokenType(expectedBooleanTokens)).toThrow();
        expect(uut2.extractNextTokenAsString()).toBe('hello');
        expect(() => uut2.extractNextTokenAsString()).toThrow();
        expect(() => uut2.extractTokenType(expectAnyValidTokens)).toThrow();
        expect(uut2.extractTokenType([TokenType.EndOfFile])).toBe(TokenType.EndOfFile);
    });

    it('should be able to extract string literal correctly', () => {
        const uut = new TokenMatcherImpl('"hello" \'world\'    `again`');
        expect(uut.extractStringLiteral()).toBe('hello');
        expect(uut.extractStringLiteral()).toBe('world');
        expect(uut.extractStringLiteral()).toBe('again');
        expect(uut.extractStringLiteral()).toBe(false);

        const uut2 = new TokenMatcherImpl('"abc" define variable');
        expect(uut2.extractStringLiteral()).toBe('abc');
        expect(uut2.extractTokenType([TokenType.VariableDeclaration])).toBe(TokenType.VariableDeclaration);
        expect(uut2.extractTokenType([TokenType.EndOfFile])).toBe(TokenType.EndOfFile);
    });
});
