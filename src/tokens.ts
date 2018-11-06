import { Names, Symbols, Delimiters } from './dictonary';
export function Tokenizer(input: string) {
    const tokens: Array<Token> = [];
    var charidx = 0
    input = input
        .replace(/[\r\n]+/gm, "\n")
        .replace(/(\n[\s\n]*\n)/gm, '\n');

    while (getToken()) { }
    return new Tokens(tokens);

    function getToken(): boolean {
        if (charidx < input.length) {
            var chunk = '';
            var tokens = Delimiters[input[charidx]];
            if (!tokens) {
                do {
                    chunk += input[charidx];
                    charidx++;
                    if (charidx >= input.length)
                        break;
                } while (!Delimiters[input[charidx]])
            } else {
                do {
                    chunk += input[charidx];
                    charidx++;
                    if (charidx >= input.length)
                        break;
                    tokens = tokens.filter((t: string) => t.substr(0, chunk.length + 1) == (chunk + input[charidx]));
                } while (tokens.length)
            }
            push(chunk);
            return true;
        }
        return false;
    }

    function push(chunk: string) {
        if (chunk === '')
            return;
        tokens.push({
            Value: chunk,
            Info: Symbols[chunk] || { Type: 'LITERAL', Name: 'LITERAL' }
        })
    }
}
export class Tokens {
    private tokens: Array<Token>;
    public index: number = -1;
    public line: number = 1;
    constructor(tokens: Array<Token>) {
        this.tokens = tokens;
    }
    public static getString(ary: any): Array<string> {
        var str: string = '';
        if (typeof ary == 'string')
            str = ary;
        else if (ary.length && typeof ary[0] == 'string')
            str = ary.join('\n')
        else if (ary.length && ary[0].hasOwnProperty('Value'))
            str = ary.reduce((a: string, c: Token) => a += c.Value, <string>'')
        return str.split('\n');
    }
    public depleted(): boolean {
        return this.index + 1 >= this.tokens.length;
    }

    public next(): boolean {
        if (this.index + 1 < this.tokens.length) {
            this.index++;
            if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
                this.line++;
            return true;
        }
        return false;
    }
    public prev(): boolean {
        if (this.index > 0) {
            this.index--;
            if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
                this.line--;
            return true;
        }
        return false;
    }
    public current(): Token {
        return this.tokens[this.index];
    }
    public skip(continueOn?: any, breakOn?: any, escape?: any): Array<Token> {
        const skipped = [];
        if (!(continueOn || breakOn))
            continueOn = {
                Type: 'WHITESPACE'
            }
        continueOn = continueOn || {};
        breakOn = breakOn || {};
        var nonwhitespace = '';
        for (var i = this.index; i >= 0; i--) {
            if (this.tokens[i].Info.Type != 'WHITESPACE') {
                nonwhitespace = this.tokens[i].Value;
                break;
            }
        }
        while (this.next()) {
            var cur = this.current();
            if (!cur)
                break;
            if (escape && cur.Info.Name == 'ESCAPE') {
                if (!this.next() || this.current().Info.Name == 'WHITESPACE_NEWLINE')
                    this.prev();
                cur = this.current();
            } else if (shouldBreak(cur.Info))
                break;
            skipped.push(cur);
            if (cur.Info.Type != 'WHITESPACE') {
                nonwhitespace = cur.Value;
            }
        }

        function shouldBreak(current: any) {
            for (var key in current) {
                if (breakOn[key] && breakOn[key].indexOf(current[key]) > -1) {
                    if (current.Name == 'REGEX' && breakOn.Name.indexOf('REGEX_OPEN') > -1 && '(,=:[!&|?{};'.indexOf(nonwhitespace.slice(-1)) < 0)
                        return false;
                    return true;
                }
                else if (continueOn[key] && continueOn[key].indexOf(current[key]) > -1)
                    return false;
            }
            return !(Object.keys(breakOn).length);
        }
        return skipped;
    }
}

export interface Token {
    Value: string,
    Info: SymbolDefinition
}
interface SymbolDefinition {
    Name: string,
    Type: string,
    Symbol?: string,
    SubType?: string,
    GroupEdge?: string,
    Delimiter?: boolean
}