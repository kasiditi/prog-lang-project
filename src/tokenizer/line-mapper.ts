export class LineMapper {
    private lineStartPos = [0];

    private getNextNewlinePosition(curPos: number) {
        let pos = this.sourceCode.indexOf('\r', curPos);
        if (pos !== -1) {
            return pos;
        }
        pos = this.sourceCode.indexOf('\n', curPos);
        if (pos !== -1) {
            return pos;
        }
        pos = this.sourceCode.indexOf('\r\n', curPos);
        if (pos !== -1) {
            return pos;
        }
        return -1;
    }

    public constructor(private sourceCode: string) {
        let curPos = -1;
        while (true) {
            curPos = this.getNextNewlinePosition(curPos + 1);
            if (curPos === -1) {
                break;
            }
            this.lineStartPos.push(curPos);
        }
    }

    public getLineAndCol(pos: number): { line: number, col: number } {
        // TODO: Use binary search instead
        for (let i = 0; i < this.lineStartPos.length; i++) {
            if (pos < this.lineStartPos[i]) {
                return {
                    line: i,
                    col: pos - this.lineStartPos[i - 1]
                };
            }
        }
        return {
            line: this.lineStartPos.length,
            col: pos - this.lineStartPos[this.lineStartPos.length - 1]
        };
    }
}
