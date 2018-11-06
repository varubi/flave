import ReservedKeywords from './reserved.json';
import { Names } from './dictonary';
import { Constants } from './enums';
import { Transpiler } from './transpiler'
import { Tokens, Token } from './tokens'
export class Parse {
    public static Source(transpiler: Transpiler) {
        transpiler.config.layer();
        while (transpiler.tokens.skip()) {
            if (transpiler.tokens.current().Info.Name == 'FLAVE_CLASS')
                Parse.Class(transpiler);
            else if (transpiler.tokens.current().Info.Name == 'FLAVE_IMPORT')
                Parse.Import(transpiler);
            else if (transpiler.tokens.current().Info.Type == 'DEFINER')
                Parse.Definition(transpiler);
            else if (transpiler.tokens.current().Info.Type == 'COMMENT')
                Parse.Comment(transpiler);
            else if (transpiler.tokens.depleted())
                break;
            else
                throw transpiler.error('Expected Comments or Definition, not \'' + transpiler.tokens.current().Value + '\'');
            transpiler.classname = '';
        }

        if (transpiler.config.value('export')) {
            transpiler.writeNewLine();
            transpiler.writeSegment('if(typeof module!==\'undefined\'&&typeof module.exports!==\'undefined\'){');
            for (var i = 0; i < transpiler.exportslist.length; i++)
                transpiler.writeSegment('module.exports.' + transpiler.exportslist[i] + '=' + transpiler.exportslist[i] + ';');
            transpiler.writeSegment('}');
        }
        transpiler.config.unlayer();
    }
    public static Import(transpiler: Transpiler) {
        const line = [transpiler.tokens.current()].concat(transpiler.tokens.skip({}, { Name: 'WHITESPACE_NEWLINE' }));
        transpiler.writeLiteral(line);
        return line;
    }
    public static Class(transpiler: Transpiler) {
        transpiler.tokens.skip();
        if (!TestName(transpiler.tokens.current().Value))
            throw transpiler.error('Invalid Class Name \'' + transpiler.tokens.current().Value + '\'');

        transpiler.classname = transpiler.tokens.current().Value;
        if (transpiler.exportslist.length)
            transpiler.writeSegment('\n');
        transpiler.exportslist.push(transpiler.classname);
        transpiler.writeLiteral('var ' + transpiler.classname + ' = ' + transpiler.classname + ' || {};\n', true);
        transpiler.tokens.skip();

        if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L')
            throw transpiler.error('Opening Bracket Expected {');

        transpiler.config.layer();
        while (transpiler.tokens.skip()) {
            if (transpiler.tokens.current().Info.Type == 'DEFINER') {
                Parse.Definition(transpiler);
                transpiler.config.relayer();
            } else if (transpiler.tokens.current().Info.Type == 'COMMENT')
                Parse.Comment(transpiler);
            else if (transpiler.tokens.depleted() || transpiler.tokens.current().Info.Name == 'GROUP_BLOCK_R')
                return transpiler.config.unlayer();
            else {
                throw transpiler.error('Expected Comments or function or view, not \'' + transpiler.tokens.current().Value + '\'');
            }
        }
        transpiler.config.unlayer();

    }
    public static Definition(transpiler: Transpiler) {
        const definer = transpiler.tokens.current().Value;
        transpiler.tokens.skip();
        const definername = transpiler.tokens.current().Value;
        if (!TestName(definername))
            throw transpiler.error('Invalid View Name \'' + definername + '\'');
        if (transpiler.classname)
            transpiler.writeSegment('\n' + transpiler.classname + '.' + definername + ' = function(data){');
        else {
            transpiler.writeSegment('\nfunction ' + definername + '(data){');
            transpiler.exportslist.push(definername);
        }
        transpiler.tokens.skip();
        if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L')
            throw transpiler.error('Opening Bracket Expected {');
        transpiler.indent_add();
        if (definer.toLowerCase() == 'function') {
            transpiler.writeNewLine(true);
            Parse.JavaScript(transpiler);
        } else {
            transpiler.writeLiteral('\nvar ' + transpiler.config.value('output') + ' = \'\';\n');
            Parse.View(transpiler);
            transpiler.writeLiteral('\n return ' + transpiler.config.value('output') + ';\n');
        }
        transpiler.indent_sub();
        transpiler.writeLiteral('};\n');

    }
    public static Comment(transpiler: Transpiler) {
        const inline = transpiler.tokens.current().Info.Name == 'COMMENT_LINE';
        const obj = {
            Name: inline ? 'WHITESPACE_NEWLINE' : 'COMMENT_BLOCK_R'
        };
        const comment = transpiler.tokens.skip({}, obj);
        if (!transpiler.config.value('stripcomments')) {
            transpiler.writeLiteral(Names['COMMENT_BLOCK_L'].Symbol, true);
            transpiler.writeLiteral(comment, inline);
            transpiler.writeLiteral(Names['COMMENT_BLOCK_R'].Symbol, true);
            if (inline) transpiler.writeNewLine();
        }
        return comment;
    }
    public static View(transpiler: Transpiler) {
        var openstream = false;
        var emptystream = true;
        var inline = true;
        var openstring = false;
        var singleline = transpiler.tokens.current().Info.Type != 'GROUP';
        if (!singleline)
            transpiler.nest();
        else
            transpiler.tokens.prev();
        var newlineC = transpiler.config.value('newlines') ? '\\n' : ' ';
        var nestL = transpiler.nestLevel.length;
        var skipped: Array<Token>;
        while (transpiler.nestLevel.length >= nestL && !transpiler.tokens.depleted()) {
            skipped = transpiler.tokens.skip(
                {},
                {
                    Name: ['FLAVE_DELIMITER', 'WHITESPACE_NEWLINE', 'GROUP_BLOCK_R'],
                    Type: ['COMMENT']
                },
                true);
            writeString(skipped);

            skipped = [];
            switch (transpiler.tokens.current().Info.Type) {
                case 'DELIMITER':
                    transpiler.tokens.next();
                    if (transpiler.tokens.current().Info.Name == 'GROUP_BLOCK_L') {
                        inline = true;
                        endString();
                        Parse.JavaScript(transpiler);
                        openstream = false;
                    } else if (transpiler.tokens.current().Info.Name == 'GROUP_GROUP_L') {
                        endString(true);
                        Parse.JavaScript(transpiler);
                    } else if (transpiler.tokens.current().Info.Type == 'CONDITIONAL') {
                        endString();
                        Parse.Conditional(transpiler);
                        openstream = false;
                    } else if (transpiler.tokens.current().Info.Type == 'ITERATOR') {
                        endString();
                        Parse.Iterator(transpiler);
                        openstream = false;
                    } else {
                        throw transpiler.error('Not Sure what to do');
                    }
                    break;
                case 'COMMENT':
                    if (!transpiler.config.value('stripcomments') && openstream) endString();
                    Parse.Comment(transpiler);
                    break;
                case 'GROUP':
                    transpiler.nest();
                    if (transpiler.nestLevel.length >= nestL)
                        writeString(transpiler.tokens.current().Value);
                    break;
                default:
                    break;
            }
            inline = transpiler.tokens.current().Info.Name != 'WHITESPACE_NEWLINE';
            if (singleline && !inline) break;
        }
        if (openstream)
            transpiler.writeLiteral((openstring ? newlineC + transpiler.config.value('quote') : '') + ';', true);

        function writeString(string: string | Array<Token>) {
            string = Tokens.getString(string).join('');
            if ((!inline || emptystream) && string.trim() == '') return;
            if (!openstream) {
                transpiler.writeNewLine();
                transpiler.writeLiteral(transpiler.config.value('output') + ' += ' + transpiler.config.value('quote'));
                inline = true;
                openstream = true;
                openstring = true;
                emptystream = true;
            } else if (!inline || !openstring) {
                endString(true);
                transpiler.writeLiteral(transpiler.config.value('quote'), true);
            }
            if ((!inline || emptystream) && transpiler.config.value('trim'))
                string = string.replace(/^\s+/, '');
            transpiler.writeView(string);
            inline = true;
            openstring = true;
            emptystream = false;
        }

        function endString(join?: Boolean) {
            if (openstream && openstring)
                transpiler.writeLiteral(
                    (!inline ? newlineC : '') +
                    transpiler.config.value('quote') +
                    (!join ? ';' : ''),
                    true
                );
            if (!inline)
                transpiler.writeNewLine(true);
            if (join) {
                if (!openstream) {
                    transpiler.writeLiteral(transpiler.config.value('output') + ' += ');
                    openstream = true;
                    emptystream = true;
                } else transpiler.writeViewJoin(inline);
            } else {
                openstream = false;
            }
            openstring = false;
        }
    }
    public static JavaScript(transpiler: Transpiler) {
        transpiler.nest();
        var inline = transpiler.tokens.current().Info.Name != 'GROUP_BLOCK_L';
        var nestL = transpiler.nestLevel.length;
        var skipped: Array<Token> = [];
        while (transpiler.nestLevel.length >= nestL) {
            skipped = transpiler.tokens.skip(
                {},
                {
                    Name: ['WHITESPACE_NEWLINE', 'REGEX_OPEN'],
                    Type: ['GROUP', 'STRING', 'REGEX', 'COMMENT']
                },
                true
            );
            transpiler.writeLiteral(skipped, inline);
            skipped = [];
            switch (transpiler.tokens.current().Info.Type) {
                case 'GROUP':
                    inline = true;
                    transpiler.nest();
                    if (transpiler.nestLevel.length >= nestL)
                        transpiler.writeSegment(transpiler.tokens.current().Value);
                    break;
                case 'REGEX':
                case 'STRING':
                    inline = true;
                    transpiler.writeSegment(transpiler.tokens.current().Value);
                    Parse.String(transpiler);
                    transpiler.writeSegment(transpiler.tokens.current().Value);
                    break;
                case 'COMMENT':
                    inline = true;
                    Parse.Comment(transpiler);
                    break;
                case 'WHITESPACE':
                    inline = false;
                    transpiler.writeLiteral(transpiler.tokens.current().Value);
                    break;
                default:
            }
        }
    }
    public static String(transpiler: Transpiler) {
        var str = transpiler
            .tokens
            .skip({}, { Name: [transpiler.tokens.current().Info.Name] }, true);
        transpiler.writeLiteral(str, true);
        return str;
    }
    public static Iterator(transpiler: Transpiler) {
        transpiler.writeLiteral(transpiler.tokens.current().Value + '(', true);
        transpiler.tokens.next();
        Parse.JavaScript(transpiler);
        transpiler.writeLiteral(')', true);
        transpiler.writeLiteral('{', true);
        transpiler.indent_add();
        transpiler.tokens.skip();
        Parse.View(transpiler);
        transpiler.indent_sub();
        transpiler.writeLiteral('}');
    }
    public static Conditional(transpiler: Transpiler) {
        switch (transpiler.tokens.current().Info.Name) {
            case 'CONDITIONAL_IF':
                transpiler.writeLiteral('if', false);
                break;
            case 'CONDITIONAL_ELSEIF':
                transpiler.writeLiteral('else if', false);
                break;
            case 'CONDITIONAL_ELSE':
                transpiler.writeLiteral('else', false);
                break;
            default:
                break;
        }
        if (transpiler.tokens.current().Info.Name !== 'CONDITIONAL_ELSE') {
            transpiler.tokens.next();
            transpiler.writeLiteral('(', true);
            Parse.JavaScript(transpiler);
            transpiler.writeLiteral(')', true);
        }

        transpiler.writeLiteral('{', true);
        transpiler.indent_add();
        transpiler.tokens.skip();
        Parse.View(transpiler);
        transpiler.indent_sub();
        transpiler.writeLiteral('}');
    }

    public static Configuration(transpiler: Transpiler) {
        // transpiler.tokens.next();
        // var level = transpiler.tokens.current().Info.Name;
        // switch (level) {
        //     case 'CONFIG_LOCAL':
        //         transpiler.config.value(property, value);
        //         break;
        //     case 'CONFIG_GLOBAL':
        //         transpiler.config.global(property, value);
        //         break;
        //     case 'CONFIG_OVERRIDE':
        //         transpiler.config.override(property, value);
        //         break;
        //     default:
        //         break;
        // }

    }
}

function TestName(name: string) {
    return (new RegExp('^[a-zA-z_$][a-zA-z_$\\d]+$')).test(name) && ReservedKeywords.indexOf(name) === -1;

}