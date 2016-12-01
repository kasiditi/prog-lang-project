import { TokenType } from './token-type';
import { MATCHING_RULES } from './matching-rule';

interface PositiveMatchCheckingResult {
    isMatch: true;
    newPosition: number;
}

interface NegativeMatchCheckingResult {
    isMatch: false;
}

type MatchCheckingResult = PositiveMatchCheckingResult | NegativeMatchCheckingResult;

export interface TokenMatcher {
    peekNextTokenType(expectedTokens: TokenType[]): TokenType | false;
    extractTokenType(expectedTokens: TokenType[]): TokenType;
    peekNextTokenAsString(): string | false;
    extractNextTokenAsString(): string;
    extractStringLiteral(): string | false;
}

export class TokenMatcherImpl implements TokenMatcher {
    private rulesMap = new Map<TokenType, string>();
    private position = 0;

    public constructor(private sourceCode: string, matchingRules = MATCHING_RULES) {
        for (let rule of matchingRules) {
            this.rulesMap.set(rule.tokenType, rule.matcher);
        }
    }

    private makeError(position: number, message: string): Error {
        return new Error(`Position: ${position}.\n${message}`);
    }

    private isEndOfFile(curPos = this.position) {
        return curPos >= this.sourceCode.length;
    }

    private getNextNonWhitespacePosition(curPos = this.position) {
        while (!this.isEndOfFile(curPos) && /\s/.test(this.sourceCode.charAt(curPos)) === true) {
            curPos++;
        }
        return curPos;
    }

    private getNextWhitespacePosition(curPos = this.position) {
        while (!this.isEndOfFile(curPos) && /\s/.test(this.sourceCode.charAt(curPos)) === false) {
            curPos++;
        }
        return curPos;
    }

    private checkForMatch(expectedMatcher: string): MatchCheckingResult {
        let curPos = this.getNextNonWhitespacePosition(this.position);

        for (let i = 0; i < expectedMatcher.length; i++) {
            if (expectedMatcher.charAt(i) === ' ') {
                curPos = this.getNextNonWhitespacePosition(curPos);
            } else {
                if (this.isEndOfFile(curPos) ||
                    this.sourceCode.charAt(curPos).toLowerCase() !== expectedMatcher.charAt(i)) {
                    return { isMatch: false };
                } else {
                    curPos++;
                }
            }
        }

        const newCurPos = this.getNextNonWhitespacePosition(curPos);
        if (newCurPos === curPos && !this.isEndOfFile(newCurPos)) {
            return { isMatch: false };
        }

        return { isMatch: true, newPosition: newCurPos };
    }

    private getNextTokenType(expectedTokens: TokenType[]): { token: TokenType; nextPosition: number; } {
        for (let token of expectedTokens) {
            if (token === TokenType.EndOfFile) {
                const nextPos = this.getNextNonWhitespacePosition();
                if (this.isEndOfFile(nextPos)) {
                    return {
                        token: token,
                        nextPosition: nextPos
                    };
                }
            } else {
                const matcher = this.rulesMap.get(token);
                const matchResult = this.checkForMatch(matcher);

                if (matchResult.isMatch === true) {
                    return {
                        token: token,
                        nextPosition: matchResult.newPosition
                    };
                }
            }
        }

        const expectStr = expectedTokens.map(token => {
            if (token === TokenType.EndOfFile) {
                return 'EOF';
            } else {
                return this.rulesMap.get(token);
            }
        }).join(' | ');
        throw this.makeError(this.position, `Expected: ${expectStr}.`);
    }

    public peekNextTokenType(expectedTokens: TokenType[]): TokenType | false {
        try {
            return this.getNextTokenType(expectedTokens).token;
        } catch (ex) {
            return false;
        }
    }

    public extractTokenType(expectedTokens: TokenType[]): TokenType {
        const result = this.getNextTokenType(expectedTokens);
        this.position = result.nextPosition;
        return result.token;
    }

    private getNextTokenAsString(): { token: string; nextPosition: number; } {
        const startPos = this.getNextNonWhitespacePosition();
        if (this.isEndOfFile(startPos)) {
            throw this.makeError(startPos, `Expected a token.`);
        }
        const endPos = this.getNextWhitespacePosition(startPos);

        return {
            token: this.sourceCode.slice(startPos, endPos),
            nextPosition: endPos
        };
    }

    public extractNextTokenAsString(): string {
        const result = this.getNextTokenAsString();
        this.position = result.nextPosition;
        return result.token;
    }

    public peekNextTokenAsString(): string | false {
        try {
            return this.getNextTokenAsString().token;
        } catch (ex) {
            return false;
        }
    }

    public extractStringLiteral(): string | false {
        const startPos = this.getNextNonWhitespacePosition();
        if (this.isEndOfFile(startPos)) {
            return false;
        }
        const stringQuoteCharacter = this.sourceCode.charAt(startPos);
        if (stringQuoteCharacter !== '\'' &&
            stringQuoteCharacter !== '"' &&
            stringQuoteCharacter !== '`') {
            return false;
        }

        let curPos = startPos;
        while (true) {
            curPos++;
            if (this.isEndOfFile(curPos)) {
                return false;
            }
            const curChar = this.sourceCode.charAt(curPos);
            if (curChar === stringQuoteCharacter) {
                this.position = curPos + 1;
                return this.sourceCode.slice(startPos + 1, curPos);
            }
        }
    }
}
