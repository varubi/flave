const Tokens = require('./tokens.js')
const Dictionary = require('./dictionary.js')

function Transpile(input, config) {
    this.config = {
        quote: '\'',
        classname: 'flave',
        stripcomments: true,
        output: '$O',
        trim: true,
        newlines: true
    }
    config = config || {};
    for (var key in this.config)
        if (config.hasOwnProperty(key))
            this.config[key] = config[key];
    this.transpiled = '';
    this.classlist = [];
    this.classname = config.classname;
    this.lastWrite = '\n';
    this.indent = '';
    this.tokens = new Tokens(input);
    this.views = [];
    this.nestLevel = [];
    this.index;

    this.testGrammarAll();
}

Transpile.prototype.testGrammarAll = function() {
    while (this.tokens.skip()) {
        if (this.tokens.current().Info.Name == 'FLAVE_CLASS') {
            this.testGrammarClass();
        } else if (this.tokens.current().Info.Type == 'COMMENT')
            this.testGrammarBlockComment();
        else if (this.tokens.current().Info.Type == 'WHITESPACE')
            break;
        else {
            throw this.error('Expected Comments or Classes, not \'' + this.tokens.current().Value + '\'');
        }
    }
    this.writeNewLine()
    this.writeSegment('if(typeof module!==\'undefined\'&&typeof module.exports!==\'undefined\'){')
    this.indent_add();
    for (var i = 0; i < this.classlist.length; i++) {
        this.writeNewLine(true);
        this.writeSegment('module.exports.' + this.classlist[i] + '=' + this.classlist[i] + ';');
    }
    this.indent_sub();
    this.writeNewLine(true);
    this.writeSegment('}');
};

Transpile.prototype.testGrammarClass = function() {
    this.tokens.skip();
    if (!this.testName(this.tokens.current().Value))
        throw this.error('Invalid Class Name \'' + this.tokens.current().Value + '\'');

    this.classname = this.tokens.current().Value;
    if (this.classlist.length)
        this.writeSegment('\n');
    this.classlist.push(this.classname);
    this.writeLiteral('var ' + this.classname + ' = ' + this.classname + ' || {};\n', true);
    this.tokens.skip();
    if (this.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw this.error('Opening Bracket Expected {');
    }
    while (this.tokens.skip()) {
        if (this.tokens.current().Info.Type == 'DEFINER') {
            this.testGrammarDefine();
        } else if (this.tokens.current().Info.Type == 'COMMENT')
            this.testGrammarBlockComment();
        else if (this.tokens.current().Info.Type == 'WHITESPACE' || this.tokens.current().Info.Name == 'GROUP_BLOCK_R')
            return;
        else {
            throw this.error('Expected Comments or function or view, not \'' + this.tokens.current().Value + '\'');
        }
    }
};

Transpile.prototype.testGrammarDefine = function() {
    var definer = this.tokens.current().Value;
    this.tokens.skip();
    if (!this.testName(this.tokens.current().Value))
        throw this.error('Invalid View Name \'' + this.tokens.current().Value + '\'');

    this.writeSegment('\n' + this.classname + '.' + this.tokens.current().Value + ' = function(data){')


    this.tokens.skip();
    if (this.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw this.error('Opening Bracket Expected {');
    }
    this.indent_add();
    if (definer.toLowerCase() == 'function')
        this.testGrammarBlockLiteral()
    else {
        this.writeLiteral('\nvar ' + this.config.output + ' = \'\';')
        this.testGrammarBlockView()
        this.writeLiteral('\nreturn ' + this.config.output + ';\n')
    }
    this.indent_sub();
    this.writeLiteral('}\n')
}

Transpile.prototype.testGrammarBlockComment = function() {
    var obj = {};
    var open = this.tokens.current()
    obj.Name = (this.tokens.current().Info.Name == 'COMMENT_LINE' ? 'WHITESPACE_NEWLINE' : 'COMMENT_BLOCK_R');
    var comment = this.tokens.skip(null, obj);
    if (!this.config.stripcomments) {
        this.writeLiteral(open.Value, true)
        this.writeLiteral(comment, open.Info.Name === 'COMMENT_LINE')
        this.writeLiteral(this.tokens.current().Value)
        this.writeNewLine();
    }
}
Transpile.prototype.testGrammarBlockView = function() {
    var openstream = false;
    var self = this;
    var inline = true;
    var openstring = false;
    var singleline = (this.tokens.current().Info.Type != 'GROUP')
    if (!singleline)
        this.nest();
    else
        this.tokens.prev();

    var nestL = this.nestLevel.length;
    var skipped;
    while (this.nestLevel.length >= nestL) {
        skipped = this.tokens.skip({}, {
            Name: ['FLAVE_DELIMITER', 'WHITESPACE_NEWLINE', 'GROUP_BLOCK_R'],
            Type: ['COMMENT']
        }, true);
        writeString(skipped)

        skipped = [];
        switch (this.tokens.current().Info.Type) {
            case 'DELIMITER':
                this.tokens.next();
                if (this.tokens.current().Info.Name == 'GROUP_BLOCK_L') {
                    inline = true;
                    endString()
                    this.testGrammarBlockLiteral();
                    openstream = false;
                } else if (this.tokens.current().Info.Name == 'GROUP_GROUP_L') {
                    endString(true)
                    this.testGrammarBlockLiteral();
                } else if (this.tokens.current().Info.Type == 'CONDITIONAL') {
                    endString()
                    this.testConditional();
                    openstream = false;
                } else if (this.tokens.current().Info.Type == 'ITERATOR') {
                    endString()
                    this.testIterator();
                    openstream = false;
                } else {
                    throw this.error('Not Sure what to do');
                }
                break;

            case 'COMMENT':
                if (this.tokens.current().Info.Name == 'COMMENT_LINE')
                    this.tokens.skip({}, {
                        Name: 'WHITESPACE_NEWLINE'
                    });
                else if (this.tokens.current().Info.Name == 'COMMENT_BLOCK_L') {
                    this.tokens.skip({}, {
                        Type: 'COMMENT_BLOCK_R'
                    });
                }
                break;
            case 'GROUP':
                this.nest()
                if (this.nestLevel.length >= nestL)
                    writeString(this.tokens.current().Value)
                break;
            default:
                break;
        }
        inline = this.tokens.current().Info.Name != 'WHITESPACE_NEWLINE';
        if (singleline && !inline)
            break;
    }
    if (openstream)
        self.writeLiteral((openstring ? '\\n' + self.config.quote : '') + ';', true);

    function writeString(string) {
        if (self.getString(string).join('').trim() == '')
            return;
        if (!openstream) {
            self.writeNewLine();
            self.writeLiteral(self.config.output + ' += ' + self.config.quote)
            inline = true;
            openstream = true;
            openstring = true;
        } else if (!inline || !openstring) {
            endString(true)
            self.writeLiteral(self.config.quote, true)
        }
        self.writeView(string)
        inline = true;
        openstring = true;
    }

    function endString(join) {
        if (openstream && openstring)
            self.writeLiteral((!inline ? '\\n' : '') + self.config.quote + (!join ? ';' : ''), true);
        if (!inline)
            self.writeNewLine(true);
        if (join) {
            if (!openstream) {
                self.writeLiteral(self.config.output + ' += ')
                openstream = true;
            } else
                self.writeViewJoin(inline);
        }
        openstring = false;
    }
}

Transpile.prototype.testGrammarBlockLiteral = function() {
    this.nest();
    var inline = this.tokens.current().Info.Name != 'GROUP_BLOCK_L';
    var nestL = this.nestLevel.length;
    var skipped;
    var currentline = this.tokens.line;
    while (this.nestLevel.length >= nestL) {
        var skipped = this.tokens.skip({}, {
            Name: ['WHITESPACE_NEWLINE'],
            Type: ['GROUP', 'STRING']
        }, true);
        this.writeLiteral(skipped, inline)
        skipped = [];
        switch (this.tokens.current().Info.Type) {
            case 'GROUP':
                inline = true;
                this.nest()
                if (this.nestLevel.length >= nestL)
                    this.writeSegment(this.tokens.current().Value)
                break;
            case 'STRING':
                inline = true;
                this.writeSegment(this.tokens.current().Value)
                this.testGrammarString();
                this.writeSegment(this.tokens.current().Value)
                break;
            case 'WHITESPACE':
                inline = false;
                this.writeLiteral(this.tokens.current().Value)
                break
            default:

        }
    }
}
Transpile.prototype.testGrammarString = function() {
    var skipped = this.tokens.skip({}, {
        Name: [this.tokens.current().Info.Name]
    }, true);
    this.writeLiteral(skipped, true)
};

Transpile.prototype.testIterator = function() {
    this.writeLiteral(this.tokens.current().Value + '(', true);
    this.tokens.next();

    this.testGrammarBlockLiteral();
    this.writeLiteral(')', true)
    this.writeLiteral('{', true);
    this.indent_add();
    this.tokens.skip();
    this.testGrammarBlockView();
    this.indent_sub()
    this.writeLiteral('}')
};

Transpile.prototype.testConditional = function() {
    switch (this.tokens.current().Info.Name) {
        case 'CONDITIONAL_IF':
            this.writeLiteral('if', true)
            break;
        case 'CONDITIONAL_ELSEIF':
            this.writeLiteral('else if', true)
            break;
        case 'CONDITIONAL_ELSE':
            this.writeLiteral('else', true)
            break;
        default:

    }
    if (this.tokens.current().Info.Name !== 'CONDITIONAL_ELSE') {
        this.tokens.next();
        this.writeLiteral('(', true)
        this.testGrammarBlockLiteral();
        this.writeLiteral(')', true)
    }

    this.writeLiteral('{', true)
    this.indent_add();
    this.tokens.skip();
    this.testGrammarBlockView();
    this.indent_sub()
    this.writeLiteral('}')


};

Transpile.prototype.testName = function(name) {
    return (new RegExp('^[a-zA-z_$][a-zA-z_$\\d]+$')).test(name) && Dictionary.ReservedKeywords.indexOf(name) === -1;
}

Transpile.prototype.nest = function() {
    if (this.tokens.current().Info.GroupEdge == 'OPEN')
        this.nestLevel.push(this.tokens.current())
    else if (this.nestLevel.length) {
        var last = this.nestLevel.pop();
        if (last.Info.SubType != this.tokens.current().Info.SubType) {
            throw this.error('Expected ' + Dictionary.ByName[last.Info.Name.replace(/L$/, 'R')].Symbol + ' instead of ' + this.tokens.current().Value)
        }
    } else {
        throw this.error('Did not expect ' + this.tokens.current().Value)

    }
}

Transpile.prototype.error = function(message) {
    return message.replace(/\n/, 'New Line') + ' at Line ' + this.tokens.line;
}
Transpile.prototype.getString = function(ary) {
    var str = '';
    if (typeof ary == 'string')
        str = ary;
    else if (ary.length && typeof ary[0] == 'string')
        str = ary.join('\n')
    else if (ary.length && ary[0].hasOwnProperty('Value'))
        for (var i = 0; i < ary.length; i++) {
            str += ary[i].Value;
        }
    if (this.config.trim)
        return str.split('\n').map(function(e) {
            return e.trim()
        });
    return str.split('\n');
}
Transpile.prototype.writeSegment = function(string) {
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
Transpile.prototype.writeNewLine = function(indent) {
    if (!this.config.newlines)
        return;
    var nl = '\n' + (indent ? this.indent : '');
    this.writeSegment(nl)
}
Transpile.prototype.writeViewJoin = function(inline) {
    if (!this.config.newlines) {
        this.writeSegment('+');
        return;
    }
    this.writeSegment((inline ? ' ' : '\t') + '+ ');
};
Transpile.prototype.writeLiteral = function(lines, inline) {
    lines = this.getString(lines);
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].trim() == '')
            continue;
        if (!inline)
            this.writeNewLine(true)
        this.writeSegment(inline ? lines[i] : lines[i].trimLeft())
        if (i != lines.length - 1)
            this.writeNewLine()
        inline = false;
    }

};
Transpile.prototype.writeView = function(string) {
    string = this.getString(string);
    if (string.length > 1)
        throw 'some err';
    this.writeSegment(string[0].replace('\\', '\\\\').replace(new RegExp(this.config.quote, 'g'), '\\' + this.config.quote));

}
Transpile.prototype.indent_add = function() {
    this.indent += '\t';
}
Transpile.prototype.indent_sub = function() {
    this.indent = this.indent.slice(0, -1)
}
module.exports.transpile = function(input, config) {
    return new Transpile(input, config).transpiled;
};
