const Dictionary = require('./dictionary.js')
    , $C = require('./constants.js')

var ParseSource = function (transpiler) {
    transpiler.config.layer();
    while (transpiler.tokens.skip()) {
        if (transpiler.tokens.current().Info.Name == 'FLAVE_CLASS')
            ParseClass(transpiler);
        else if (transpiler.tokens.current().Info.Type == 'DEFINER')
            ParseDefinition(transpiler);
        else if (transpiler.tokens.current().Info.Type == 'COMMENT')
            ParseComment(transpiler);
        else if (transpiler.tokens.depleted())
            break;
        else {
            throw transpiler.error('Expected Comments or Definition, not \'' + transpiler.tokens.current().Value + '\'');
        }
        transpiler.classname = false;
    }

    if (transpiler.config.export) {
        transpiler.writeNewLine()
        transpiler.writeSegment('if(typeof module!==\'undefined\'&&typeof module.exports!==\'undefined\'){')
        for (var i = 0; i < transpiler.exportslist.length; i++)
            transpiler.writeSegment('module.exports.' + transpiler.exportslist[i] + '=' + transpiler.exportslist[i] + ';');
        transpiler.writeSegment('}');
    }
    transpiler.config.unlayer();
}
var ParseClass = function (transpiler) {
    transpiler.tokens.skip();
    if (!transpiler.testName(transpiler.tokens.current().Value))
        throw transpiler.error('Invalid Class Name \'' + transpiler.tokens.current().Value + '\'');

    transpiler.classname = transpiler.tokens.current().Value;
    if (transpiler.exportslist.length)
        transpiler.writeSegment('\n');
    transpiler.exportslist.push(transpiler.classname);
    transpiler.writeLiteral('var ' + transpiler.classname + ' = ' + transpiler.classname + ' || {};\n', true);
    transpiler.tokens.skip();
    if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw transpiler.error('Opening Bracket Expected {');
    }
    transpiler.config.layer();
    while (transpiler.tokens.skip()) {
        if (transpiler.tokens.current().Info.Type == 'DEFINER') {
            ParseDefinition(transpiler);
            transpiler.config.relayer();
        } else if (transpiler.tokens.current().Info.Type == 'COMMENT')
            ParseComment(transpiler);
        else if (transpiler.tokens.depleted() || transpiler.tokens.current().Info.Name == 'GROUP_BLOCK_R')
            return transpiler.config.unlayer();
        else {
            throw transpiler.error('Expected Comments or function or view, not \'' + transpiler.tokens.current().Value + '\'');
        }
    }
    transpiler.config.unlayer();
}
var ParseDefinition = function (transpiler) {
    var definer = transpiler.tokens.current().Value;
    transpiler.tokens.skip();
    var definername = transpiler.tokens.current().Value;
    if (!transpiler.testName(definername))
        throw transpiler.error('Invalid View Name \'' + definername + '\'');
    if (transpiler.classname)
        transpiler.writeSegment('\n' + transpiler.classname + '.' + definername + ' = function(data){')
    else {
        transpiler.writeSegment('\nfunction ' + definername + '(data){');
        transpiler.exportslist.push(definername);
    }
    transpiler.tokens.skip();
    if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw transpiler.error('Opening Bracket Expected {');
    }
    transpiler.indent_add();
    if (definer.toLowerCase() == 'function') {
        transpiler.writeNewLine(true);
        ParseJS(transpiler)
    }
    else {
        transpiler.writeLiteral('\nvar ' + transpiler.config.output + ' = \'\';\n')
        ParseView(transpiler)
        transpiler.writeLiteral('\n return ' + transpiler.config.output + ';\n')
    }
    transpiler.indent_sub();
    transpiler.writeLiteral('};\n')
}
var ParseComment = function (transpiler) {
    var inline = transpiler.tokens.current().Info.Name == 'COMMENT_LINE';
    var obj = {
        Name: (inline ? 'WHITESPACE_NEWLINE' : 'COMMENT_BLOCK_R')
    };
    var comment = transpiler.tokens.skip({}, obj);
    if (!transpiler.config.stripcomments) {
        transpiler.writeLiteral(Dictionary.ByName['COMMENT_BLOCK_L'].Symbol, true)
        transpiler.writeLiteral(comment, inline)
        transpiler.writeLiteral(Dictionary.ByName['COMMENT_BLOCK_R'].Symbol, true)
        if (inline)
            transpiler.writeNewLine();
    }
}
var ParseView = function (transpiler) {
    var openstream = false;
    var emptystream = true;
    var inline = true;
    var openstring = false;
    var singleline = (transpiler.tokens.current().Info.Type != 'GROUP')
    if (!singleline)
        transpiler.nest();
    else
        transpiler.tokens.prev();
    var newlineC = transpiler.config.newlines ? '\\n' : ' ';
    var nestL = transpiler.nestLevel.length;
    var skipped;
    while (transpiler.nestLevel.length >= nestL && !transpiler.tokens.depleted()) {
        skipped = transpiler.tokens.skip({}, {
            Name: ['FLAVE_DELIMITER', 'WHITESPACE_NEWLINE', 'GROUP_BLOCK_R'],
            Type: ['COMMENT']
        }, true);
        writeString(skipped)

        skipped = [];
        switch (transpiler.tokens.current().Info.Type) {
            case 'DELIMITER':
                transpiler.tokens.next();
                if (transpiler.tokens.current().Info.Name == 'GROUP_BLOCK_L') {
                    inline = true;
                    endString()
                    ParseJS(transpiler);
                    openstream = false;
                } else if (transpiler.tokens.current().Info.Name == 'GROUP_GROUP_L') {
                    endString(true)
                    ParseJS(transpiler);
                } else if (transpiler.tokens.current().Info.Type == 'CONDITIONAL') {
                    endString()
                    ParseConditional(transpiler);
                    openstream = false;
                } else if (transpiler.tokens.current().Info.Type == 'ITERATOR') {
                    endString()
                    ParseIterator(transpiler);
                    openstream = false;
                } else {
                    throw transpiler.error('Not Sure what to do');
                }
                break;
            case 'COMMENT':
                if (!transpiler.config.stripcomments && openstream)
                    endString();
                ParseComment(transpiler);
                break;
            case 'GROUP':
                transpiler.nest()
                if (transpiler.nestLevel.length >= nestL)
                    writeString(transpiler.tokens.current().Value)
                break;
            default:
                break;
        }
        inline = transpiler.tokens.current().Info.Name != 'WHITESPACE_NEWLINE';
        if (singleline && !inline)
            break;
    }
    if (openstream)
        transpiler.writeLiteral((openstring ? newlineC + transpiler.config.quote : '') + ';', true);

    function writeString(string) {
        string = transpiler.getString(string).join('');
        if ((!inline || emptystream) && string.trim() == '')
            return;
        if (!openstream) {
            transpiler.writeNewLine();
            transpiler.writeLiteral(transpiler.config.output + ' += ' + transpiler.config.quote)
            inline = true;
            openstream = true;
            openstring = true;
            emptystream = true;
        } else if (!inline || !openstring) {
            endString(true)
            transpiler.writeLiteral(transpiler.config.quote, true)
        }
        if ((!inline || emptystream) && transpiler.config.trim)
            string = string.trimLeft();
        transpiler.writeView(string)
        inline = true;
        openstring = true;
        emptystream = false;
    }

    function endString(join) {
        if (openstream && openstring)
            transpiler.writeLiteral((!inline ? newlineC : '') + transpiler.config.quote + (!join ? ';' : ''), true);
        if (!inline)
            transpiler.writeNewLine(true);
        if (join) {
            if (!openstream) {
                transpiler.writeLiteral(transpiler.config.output + ' += ')
                openstream = true;
                emptystream = true;
            } else
                transpiler.writeViewJoin(inline);
        } else {
            openstream = false;
        }
        openstring = false;
    }
}
var ParseJS = function (transpiler) {
    transpiler.nest();
    var inline = transpiler.tokens.current().Info.Name != 'GROUP_BLOCK_L';
    var nestL = transpiler.nestLevel.length;
    var skipped;
    var currentline = transpiler.tokens.line;
    while (transpiler.nestLevel.length >= nestL) {
        var skipped = transpiler.tokens.skip({}, {
            Name: ['WHITESPACE_NEWLINE', 'REGEX_OPEN'],
            Type: ['GROUP', 'STRING', 'REGEX', 'COMMENT']
        }, true);
        transpiler.writeLiteral(skipped, inline)
        skipped = [];
        switch (transpiler.tokens.current().Info.Type) {
            case 'GROUP':
                inline = true;
                transpiler.nest()
                if (transpiler.nestLevel.length >= nestL)
                    transpiler.writeSegment(transpiler.tokens.current().Value)
                break;
            case 'REGEX':
            case 'STRING':
                inline = true;
                transpiler.writeSegment(transpiler.tokens.current().Value)
                ParseString(transpiler);
                transpiler.writeSegment(transpiler.tokens.current().Value)
                break;
            case 'COMMENT':
                inline = true;
                ParseComment(transpiler)
                break;
            case 'WHITESPACE':
                inline = false;
                transpiler.writeLiteral(transpiler.tokens.current().Value)
                break
            default:

        }
    }
}
var ParseString = function (transpiler) {
    var skipped = transpiler.tokens.skip({}, {
        Name: [transpiler.tokens.current().Info.Name]
    }, true);
    transpiler.writeLiteral(skipped, true)
}
var ParseIterator = function (transpiler) {
    transpiler.writeLiteral(transpiler.tokens.current().Value + '(', true);
    transpiler.tokens.next();

    ParseJS(transpiler);
    transpiler.writeLiteral(')', true)
    transpiler.writeLiteral('{', true);
    transpiler.indent_add();
    transpiler.tokens.skip();
    ParseView(transpiler);
    transpiler.indent_sub()
    transpiler.writeLiteral('}')
}
var ParseConditional = function (transpiler) {
    switch (transpiler.tokens.current().Info.Name) {
        case 'CONDITIONAL_IF':
            transpiler.writeLiteral('if', false)
            break;
        case 'CONDITIONAL_ELSEIF':
            transpiler.writeLiteral('else if', false)
            break;
        case 'CONDITIONAL_ELSE':
            transpiler.writeLiteral('else', false)
            break;
        default:
            break;
    }
    if (transpiler.tokens.current().Info.Name !== 'CONDITIONAL_ELSE') {
        transpiler.tokens.next();
        transpiler.writeLiteral('(', true)
        ParseJS(transpiler);
        transpiler.writeLiteral(')', true)
    }

    transpiler.writeLiteral('{', true)
    transpiler.indent_add();
    transpiler.tokens.skip();
    ParseView(transpiler);
    transpiler.indent_sub()
    transpiler.writeLiteral('}');
}
var ParseConfiguration = function (transpiler) {
    transpiler.tokens.next();
    var level = transpiler.tokens.current().Info.Name;
    switch (level) {
        case 'CONFIG_LOCAL':
            transpiler.config[property] = value;
            break;
        case 'CONFIG_GLOBAL':
            transpiler.config.global[property] = value;
            break;
        case 'CONFIG_OVERRIDE':
            transpiler.config.override[property] = value;
            break;
        default:
            break;
    }
}


exports.ParseSource = ParseSource;
exports.ParseClass = ParseClass;
exports.ParseDefinition = ParseDefinition;
exports.ParseComment = ParseComment;
exports.ParseView = ParseView;
exports.ParseJS = ParseJS;
exports.ParseString = ParseString;
exports.ParseIterator = ParseIterator;
exports.ParseConditional = ParseConditional;