import { TokenType } from '../../../src/tokenizer/token-type';
import { MATCHING_RULES } from '../../../src/tokenizer/matching-rule';

describe('Matching Rule', () => {
    const matchers = MATCHING_RULES.map(rule => rule.matcher);
    const tokenTypes = MATCHING_RULES.map(rule => rule.tokenType);

    it('should have matchers all lowercase and trimmed already', () => {
        for (let matcher of matchers) {
            expect(matcher.toLowerCase().trim()).toEqual(matcher);
        }
    });

    it('should have only one-size spaces in between', () => {
        for (let matcher of matchers) {
            expect(/  /.test(matcher)).toBe(false);
        }
    });

    it('should have unique matcher', () => {
        const matcherChecker = new Set<string>();

        for (let matcher of matchers) {
            expect(matcherChecker.has(matcher)).toBe(false, `${matcher} is not unique.`);
            matcherChecker.add(matcher);
        }
    });

    it('should have unique tokenType', () => {
        const tokenTypeChecker = new Set<TokenType>();

        for (let tokenType of tokenTypes) {
            expect(tokenTypeChecker.has(tokenType)).toBe(false, `${TokenType[tokenType]} is not unique.`);
            tokenTypeChecker.add(tokenType);
        }
    });
});
