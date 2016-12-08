import { LineMapper } from './line-mapper';
import { MATCHING_RULES } from './matching-rule';
import { TokenType } from './token-type';

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

class ExpectedTokenSet {
    private tokenStringSet = new Set<string>();

    public addExpectedToken(tokenString: string) {
        this.tokenStringSet.add(tokenString);
    }

    public clear() {
        this.tokenStringSet.clear();
    }

    public getExpectedTokenStringList(): string[] {
        const l: string[] = [];
        this.tokenStringSet.forEach(token => l.push(token));
        l.sort();
        return l;
    }
}

export class TokenMatcherImpl implements TokenMatcher {
    private rulesMap = new Map<TokenType, string>();
    private position = 0;
    private expectedErrorReportSet = new ExpectedTokenSet();
    private lineMapper: LineMapper;

    public constructor(private sourceCode: string, private matchingRules = MATCHING_RULES) {
        for (let rule of matchingRules) {
            this.rulesMap.set(rule.tokenType, rule.matcher);
        }
        this.lineMapper = new LineMapper(sourceCode);
    }

    private makeError(position: number, message: string): Error {
        const lineCol = this.lineMapper.getLineAndCol(position);
        return new Error(`L${lineCol.line}:C${lineCol.col}\n${message}`);
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
                curPos = this.getNextNonWhitespacePosition(curPos + 1);
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
                    this.expectedErrorReportSet.clear();
                    return {
                        token: token,
                        nextPosition: nextPos
                    };
                } else {
                    this.expectedErrorReportSet.addExpectedToken('(EOF)');
                }
            } else {
                const matcher = this.rulesMap.get(token);
                const matchResult = this.checkForMatch(matcher);

                if (matchResult.isMatch === true) {
                    this.expectedErrorReportSet.clear();
                    return {
                        token: token,
                        nextPosition: matchResult.newPosition
                    };
                } else {
                    this.expectedErrorReportSet.addExpectedToken(matcher);
                }
            }
        }

        const expectStr = this.expectedErrorReportSet.getExpectedTokenStringList().join(' | ');
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
        this.expectedErrorReportSet.clear();

        const startPos = this.getNextNonWhitespacePosition();
        if (this.isEndOfFile(startPos)) {
            throw this.makeError(startPos, `Unexpected EOF.`);
        }
        const endPos = this.getNextWhitespacePosition(startPos);

        const token = this.sourceCode.slice(startPos, endPos);
        for (let rule of this.matchingRules) {
            if (rule.matcher === token.toLowerCase()) {
                throw this.makeError(startPos, `Unexpected identifier "${token}".`);
            }
        }

        return {
            token,
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
        this.expectedErrorReportSet.clear();

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
