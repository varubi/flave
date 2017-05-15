var Source = function (transpiler) {
    transpiler.config.layer();
    while (transpiler.tokens.skip()) {
        if (transpiler.tokens.current().Info.Name == 'FLAVE_CLASS') {
            Class(transpiler);
        } else if (transpiler.tokens.current().Info.Type == 'COMMENT')
            Comment(transpiler);
        else if (transpiler.tokens.depleted())
            break;
        else {
            throw transpiler.error('Expected Comments or Classes, not \'' + transpiler.tokens.current().Value + '\'');
        }
    }

    if (transpiler.config.export) {
        transpiler.writeNewLine()
        transpiler.writeSegment('if(typeof module!==\'undefined\'&&typeof module.exports!==\'undefined\'){')
        transpiler.writeSegment('module.exports={' + transpiler.classlist.map((classname) => classname + ':' + classname).join(',') + '};');
        transpiler.writeSegment('}');
    }
    transpiler.config.unlayer();
};
var Class = function (transpiler) {
    transpiler.tokens.skip();
    if (!transpiler.testName(transpiler.tokens.current().Value))
        throw transpiler.error('Invalid Class Name \'' + transpiler.tokens.current().Value + '\'');

    transpiler.classname = transpiler.tokens.current().Value;
    if (transpiler.classlist.length)
        transpiler.writeSegment('\n');
    transpiler.classlist.push(transpiler.classname);
    transpiler.writeLiteral('var ' + transpiler.classname + ' = ' + transpiler.classname + ' || {};\n', true);
    transpiler.tokens.skip();
    if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw transpiler.error('Opening Bracket Expected {');
    }
    transpiler.config.layer();
    while (transpiler.tokens.skip()) {
        if (transpiler.tokens.current().Info.Type == 'DEFINER') {
            Define(transpiler);
            transpiler.config.relayer();
        } else if (transpiler.tokens.current().Info.Type == 'COMMENT')
            Comment(transpiler);
        else if (transpiler.tokens.depleted() || transpiler.tokens.current().Info.Name == 'GROUP_BLOCK_R')
            return transpiler.config.unlayer();
        else {
            throw transpiler.error('Expected Comments or function or view, not \'' + transpiler.tokens.current().Value + '\'');
        }
    }
    transpiler.config.unlayer();
};
var Define = function (transpiler) {
    var definer = transpiler.tokens.current().Value;
    transpiler.tokens.skip();
    if (!transpiler.testName(transpiler.tokens.current().Value))
        throw transpiler.error('Invalid View Name \'' + transpiler.tokens.current().Value + '\'');

    transpiler.writeSegment('\n' + transpiler.classname + '.' + transpiler.tokens.current().Value + ' = function(data){')


    transpiler.tokens.skip();
    if (transpiler.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw transpiler.error('Opening Bracket Expected {');
    }
    transpiler.indent_add();
    if (definer.toLowerCase() == 'function')
        Literal(transpiler)
    else {
        transpiler.writeLiteral('\nvar ' + transpiler.config.output + ' = \'\';')
        View(transpiler)
        transpiler.writeLiteral('\nreturn ' + transpiler.config.output + ';\n')
    }
    transpiler.indent_sub();
    transpiler.writeLiteral('}\n')
}

var Comment = function (transpiler) {
    var obj = {};
    var open = transpiler.tokens.current()
    obj.Name = (transpiler.tokens.current().Info.Name == 'COMMENT_LINE' ? 'WHITESPACE_NEWLINE' : 'COMMENT_BLOCK_R');
    var comment = transpiler.tokens.skip(null, obj);
    if (!transpiler.config.stripcomments) {
        transpiler.writeLiteral(open.Value, true)
        transpiler.writeLiteral(comment, open.Info.Name === 'COMMENT_LINE')
        transpiler.writeLiteral(transpiler.tokens.current().Value)
        transpiler.writeNewLine();
    }
}
var View = function (transpiler) {
    var openstream = false;
    var emptystream = true;
    var inline = true;
    var openstring = false;
    var singleline = (transpiler.tokens.current().Info.Type != 'GROUP')
    if (!singleline)
        transpiler.nest();
    else
        transpiler.tokens.prev();

    var nestL = transpiler.nestLevel.length;
    var skipped;
    while (transpiler.nestLevel.length >= nestL) {
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
                    Literal(transpiler);
                    openstream = false;
                } else if (transpiler.tokens.current().Info.Name == 'GROUP_GROUP_L') {
                    endString(true)
                    Literal(transpiler);
                } else if (transpiler.tokens.current().Info.Type == 'CONDITIONAL') {
                    endString()
                    Conditional(transpiler);
                    openstream = false;
                } else if (transpiler.tokens.current().Info.Type == 'ITERATOR') {
                    endString()
                    Iterator(transpiler);
                    openstream = false;
                } else {
                    throw transpiler.error('Not Sure what to do');
                }
                break;

            case 'COMMENT':
                if (transpiler.tokens.current().Info.Name == 'COMMENT_LINE')
                    transpiler.tokens.skip({}, {
                        Name: 'WHITESPACE_NEWLINE'
                    });
                else if (transpiler.tokens.current().Info.Name == 'COMMENT_BLOCK_L') {
                    transpiler.tokens.skip({}, {
                        Type: 'COMMENT_BLOCK_R'
                    });
                }
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
        transpiler.writeLiteral((openstring ? '\\n' + transpiler.config.quote : '') + ';', true);

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
            transpiler.writeLiteral((!inline ? '\\n' : '') + transpiler.config.quote + (!join ? ';' : ''), true);
        if (!inline)
            transpiler.writeNewLine(true);
        if (join) {
            if (!openstream) {
                transpiler.writeLiteral(transpiler.config.output + ' += ')
                openstream = true;
                emptystream = true;
            } else
                transpiler.writeViewJoin(inline);
        }
        openstring = false;
    }
}
var Literal = function (transpiler) {
    transpiler.nest();
    var inline = transpiler.tokens.current().Info.Name != 'GROUP_BLOCK_L';
    var nestL = transpiler.nestLevel.length;
    var skipped;
    var currentline = transpiler.tokens.line;
    while (transpiler.nestLevel.length >= nestL) {
        var skipped = transpiler.tokens.skip({}, {
            Name: ['WHITESPACE_NEWLINE'],
            Type: ['GROUP', 'STRING']
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
            case 'STRING':
                inline = true;
                transpiler.writeSegment(transpiler.tokens.current().Value)
                String(transpiler);
                transpiler.writeSegment(transpiler.tokens.current().Value)
                break;
            case 'WHITESPACE':
                inline = false;
                transpiler.writeLiteral(transpiler.tokens.current().Value)
                break
            default:

        }
    }
}
var String = function (transpiler) {
    var skipped = transpiler.tokens.skip({}, {
        Name: [transpiler.tokens.current().Info.Name]
    }, true);
    transpiler.writeLiteral(skipped, true)
};
var Iterator = function (transpiler) {
    transpiler.writeLiteral(transpiler.tokens.current().Value + '(', true);
    transpiler.tokens.next();

    Literal(transpiler);
    transpiler.writeLiteral(')', true)
    transpiler.writeLiteral('{', true);
    transpiler.indent_add();
    transpiler.tokens.skip();
    View(transpiler);
    transpiler.indent_sub()
    transpiler.writeLiteral('}')
};
var Conditional = function (transpiler) {
    switch (transpiler.tokens.current().Info.Name) {
        case 'CONDITIONAL_IF':
            transpiler.writeLiteral('if', true)
            break;
        case 'CONDITIONAL_ELSEIF':
            transpiler.writeLiteral('else if', true)
            break;
        case 'CONDITIONAL_ELSE':
            transpiler.writeLiteral('else', true)
            break;
        default:

    }
    if (transpiler.tokens.current().Info.Name !== 'CONDITIONAL_ELSE') {
        transpiler.tokens.next();
        transpiler.writeLiteral('(', true)
        Literal(transpiler);
        transpiler.writeLiteral(')', true)
    }

    transpiler.writeLiteral('{', true)
    transpiler.indent_add();
    transpiler.tokens.skip();
    View(transpiler);
    transpiler.indent_sub()
    transpiler.writeLiteral('}')


};
exports.Source = Source;
