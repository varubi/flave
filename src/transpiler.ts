import { Tokenizer, Tokens, Token } from './tokens'
import { Configuration, ConfigurationInterface } from './configuration'
import { Names } from './dictonary'
import { Parse } from './parser';
export class Transpiler {
    private lastWrite: string = '\n';
    private indent: string = '';

    public config: Configuration;
    public nestLevel: Array<Token> = [];
    public transpiled: string = '';
    public exportslist: Array<string> = [];
    public classname: string = '';
    public views: Array<string> = [];
    public tokens: Tokens;

    constructor(input: string, config: ConfigurationInterface) {
        this.config = new Configuration({
            quote: '\'',
            stripcomments: true,
            output: '$O',
            trim: true,
            newlines: true,
            export: true,
            debug: false,
            format: true,
        });

        for (const key in config)
            this.config.value(key, config[key])

        this.tokens = Tokenizer(input);
        Parse.Source(this);
    }


    public nest() {
        if (this.tokens.current().Info.GroupEdge == 'OPEN')
            this.nestLevel.push(this.tokens.current())
        else if (this.nestLevel.length) {
            const last: Token = this.nestLevel.pop()!;
            if (last.Info.SubType != this.tokens.current().Info.SubType) {
                throw this.error('Expected ' + Names[last.Info.Name.replace(/L$/, 'R')].Symbol + ' instead of ' + this.tokens.current().Value)
            }
        } else {
            throw this.error('Did not expect ' + this.tokens.current().Value)

        }
    }
    public error(message: string) {
        return message.replace(/\n/, 'New Line') + ' at Line ' + this.tokens.line;
    }
    public writeSegment(string: string) {
        var write = string;
        if (this.lastWrite.slice(-1) == '\n' && write.substr(0, 1) == '\n')
            write = write.substr(1);
        else if (this.lastWrite.trim() == '' && write.indexOf(this.lastWrite) === 0)
            write = write.substr(this.lastWrite.length)
        if (write == '')
            return;
        this.lastWrite = string;
        this.transpiled += write;
    }
    public writeNewLine(indent?: boolean) {
        if (!this.config.value('format'))
            return;
        var nl = '\n' + (indent ? this.indent : '');
        this.writeSegment(nl)
    }
    public writeView(string: string | Array<string> | Array<Token>) {
        string = Tokens.getString(string);
        if (string.length > 1)
            throw 'some err';
        this.writeSegment(string[0].replace('\\', '\\\\').replace(new RegExp(this.config.value('quote'), 'g'), '\\' + this.config.value('quote')));

    }
    public writeViewJoin(inline: boolean) {
        if (!this.config.value('format')) {
            this.writeSegment('+');
            return;
        }
        this.writeSegment((inline ? ' ' : '\t') + '+ ');
    };
    public writeLiteral(lines: string | Array<string> | Array<Token>, inline: boolean = false) {
        lines = Tokens.getString(lines);
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].trim() == '')
                continue;
            if (!inline)
                this.writeNewLine(true)
            this.writeSegment(inline || !this.config.value('trim') ? lines[i] : lines[i].replace(/^\s+/, ''))
            if (i != lines.length - 1)
                this.writeNewLine()
            inline = false;
        }

    }
    public indent_add() {
        this.indent += '\t';
    }
    public indent_sub() {
        this.indent = this.indent.slice(0, -1)
    }
}