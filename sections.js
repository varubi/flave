var Source = function(fobj) {
    var config = fobj.config.layer();
    while (fobj.tokens.skip()) {
        if (fobj.tokens.current().Info.Name == 'FLAVE_CLASS') {
            Class(fobj, config);
        } else if (fobj.tokens.current().Info.Type == 'COMMENT')
            Comment(fobj, config);
        else if (fobj.tokens.current().Info.Type == 'WHITESPACE')
            break;
        else {
            throw fobj.error('Expected Comments or Classes, not \'' + fobj.tokens.current().Value + '\'');
        }
    }
    fobj.writeNewLine()
    fobj.writeSegment('if(typeof module!==\'undefined\'&&typeof module.exports!==\'undefined\'){')
    fobj.indent_add();
    for (var i = 0; i < fobj.classlist.length; i++) {
        fobj.writeNewLine(true);
        fobj.writeSegment('module.exports.' + fobj.classlist[i] + '=' + fobj.classlist[i] + ';');
    }
    fobj.indent_sub();
    fobj.writeNewLine(true);
    fobj.writeSegment('}');
};
var Class = function(fobj, config) {
    fobj.tokens.skip();
    if (!fobj.testName(fobj.tokens.current().Value))
        throw fobj.error('Invalid Class Name \'' + fobj.tokens.current().Value + '\'');

    fobj.classname = fobj.tokens.current().Value;
    if (fobj.classlist.length)
        fobj.writeSegment('\n');
    fobj.classlist.push(fobj.classname);
    fobj.writeLiteral('var ' + fobj.classname + ' = ' + fobj.classname + ' || {};\n', true);
    fobj.tokens.skip();
    if (fobj.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw fobj.error('Opening Bracket Expected {');
    }
    while (fobj.tokens.skip()) {
        if (fobj.tokens.current().Info.Type == 'DEFINER') {
            Define(fobj, config);
        } else if (fobj.tokens.current().Info.Type == 'COMMENT')
            Comment(fobj, config);
        else if (fobj.tokens.current().Info.Type == 'WHITESPACE' || fobj.tokens.current().Info.Name == 'GROUP_BLOCK_R')
            return;
        else {
            throw fobj.error('Expected Comments or function or view, not \'' + fobj.tokens.current().Value + '\'');
        }
    }
};
var Define = function(fobj, config) {
    var definer = fobj.tokens.current().Value;
    fobj.tokens.skip();
    if (!fobj.testName(fobj.tokens.current().Value))
        throw fobj.error('Invalid View Name \'' + fobj.tokens.current().Value + '\'');

    fobj.writeSegment('\n' + fobj.classname + '.' + fobj.tokens.current().Value + ' = function(data){')


    fobj.tokens.skip();
    if (fobj.tokens.current().Info.Name !== 'GROUP_BLOCK_L') {
        throw fobj.error('Opening Bracket Expected {');
    }
    fobj.indent_add();
    if (definer.toLowerCase() == 'function')
        Literal(fobj, config)
    else {
        fobj.writeLiteral('\nvar ' + config.output + ' = \'\';')
        View(fobj, config)
        fobj.writeLiteral('\nreturn ' + config.output + ';\n')
    }
    fobj.indent_sub();
    fobj.writeLiteral('}\n')
}

var Comment = function(fobj, config) {
    var obj = {};
    var open = fobj.tokens.current()
    obj.Name = (fobj.tokens.current().Info.Name == 'COMMENT_LINE' ? 'WHITESPACE_NEWLINE' : 'COMMENT_BLOCK_R');
    var comment = fobj.tokens.skip(null, obj);
    if (!config.stripcomments) {
        fobj.writeLiteral(open.Value, true)
        fobj.writeLiteral(comment, open.Info.Name === 'COMMENT_LINE')
        fobj.writeLiteral(fobj.tokens.current().Value)
        fobj.writeNewLine();
    }
}
var View = function(fobj, config) {
    var openstream = false;
    var inline = true;
    var openstring = false;
    var singleline = (fobj.tokens.current().Info.Type != 'GROUP')
    if (!singleline)
        fobj.nest();
    else
        fobj.tokens.prev();

    var nestL = fobj.nestLevel.length;
    var skipped;
    while (fobj.nestLevel.length >= nestL) {
        skipped = fobj.tokens.skip({}, {
            Name: ['FLAVE_DELIMITER', 'WHITESPACE_NEWLINE', 'GROUP_BLOCK_R'],
            Type: ['COMMENT']
        }, true);
        writeString(skipped)

        skipped = [];
        switch (fobj.tokens.current().Info.Type) {
            case 'DELIMITER':
                fobj.tokens.next();
                if (fobj.tokens.current().Info.Name == 'GROUP_BLOCK_L') {
                    inline = true;
                    endString()
                    Literal(fobj, config);
                    openstream = false;
                } else if (fobj.tokens.current().Info.Name == 'GROUP_GROUP_L') {
                    endString(true)
                    Literal(fobj, config);
                } else if (fobj.tokens.current().Info.Type == 'CONDITIONAL') {
                    endString()
                    Conditional(fobj, config);
                    openstream = false;
                } else if (fobj.tokens.current().Info.Type == 'ITERATOR') {
                    endString()
                    Iterator(fobj, config);
                    openstream = false;
                } else {
                    throw fobj.error('Not Sure what to do');
                }
                break;

            case 'COMMENT':
                if (fobj.tokens.current().Info.Name == 'COMMENT_LINE')
                    fobj.tokens.skip({}, {
                        Name: 'WHITESPACE_NEWLINE'
                    });
                else if (fobj.tokens.current().Info.Name == 'COMMENT_BLOCK_L') {
                    fobj.tokens.skip({}, {
                        Type: 'COMMENT_BLOCK_R'
                    });
                }
                break;
            case 'GROUP':
                fobj.nest()
                if (fobj.nestLevel.length >= nestL)
                    writeString(fobj.tokens.current().Value)
                break;
            default:
                break;
        }
        inline = fobj.tokens.current().Info.Name != 'WHITESPACE_NEWLINE';
        if (singleline && !inline)
            break;
    }
    if (openstream)
        fobj.writeLiteral((openstring ? '\\n' + config.quote : '') + ';', true);

    function writeString(string) {
        if (fobj.getString(string).join('').trim() == '')
            return;
        if (!openstream) {
            fobj.writeNewLine();
            fobj.writeLiteral(config.output + ' += ' + config.quote)
            inline = true;
            openstream = true;
            openstring = true;
        } else if (!inline || !openstring) {
            endString(true)
            fobj.writeLiteral(config.quote, true)
        }
        fobj.writeView(string)
        inline = true;
        openstring = true;
    }

    function endString(join) {
        if (openstream && openstring)
            fobj.writeLiteral((!inline ? '\\n' : '') + config.quote + (!join ? ';' : ''), true);
        if (!inline)
            fobj.writeNewLine(true);
        if (join) {
            if (!openstream) {
                fobj.writeLiteral(config.output + ' += ')
                openstream = true;
            } else
                fobj.writeViewJoin(inline);
        }
        openstring = false;
    }
}
var Literal = function(fobj, config) {
    fobj.nest();
    var inline = fobj.tokens.current().Info.Name != 'GROUP_BLOCK_L';
    var nestL = fobj.nestLevel.length;
    var skipped;
    var currentline = fobj.tokens.line;
    while (fobj.nestLevel.length >= nestL) {
        var skipped = fobj.tokens.skip({}, {
            Name: ['WHITESPACE_NEWLINE'],
            Type: ['GROUP', 'STRING']
        }, true);
        fobj.writeLiteral(skipped, inline)
        skipped = [];
        switch (fobj.tokens.current().Info.Type) {
            case 'GROUP':
                inline = true;
                fobj.nest()
                if (fobj.nestLevel.length >= nestL)
                    fobj.writeSegment(fobj.tokens.current().Value)
                break;
            case 'STRING':
                inline = true;
                fobj.writeSegment(fobj.tokens.current().Value)
                String(fobj, config);
                fobj.writeSegment(fobj.tokens.current().Value)
                break;
            case 'WHITESPACE':
                inline = false;
                fobj.writeLiteral(fobj.tokens.current().Value)
                break
            default:

        }
    }
}
var String = function(fobj, config) {
    var skipped = fobj.tokens.skip({}, {
        Name: [fobj.tokens.current().Info.Name]
    }, true);
    fobj.writeLiteral(skipped, true)
};
var Iterator = function(fobj, config) {
    fobj.writeLiteral(fobj.tokens.current().Value + '(', true);
    fobj.tokens.next();

    Literal(fobj, config);
    fobj.writeLiteral(')', true)
    fobj.writeLiteral('{', true);
    fobj.indent_add();
    fobj.tokens.skip();
    View(fobj, config);
    fobj.indent_sub()
    fobj.writeLiteral('}')
};
var Conditional = function(fobj, config) {
    switch (fobj.tokens.current().Info.Name) {
        case 'CONDITIONAL_IF':
            fobj.writeLiteral('if', true)
            break;
        case 'CONDITIONAL_ELSEIF':
            fobj.writeLiteral('else if', true)
            break;
        case 'CONDITIONAL_ELSE':
            fobj.writeLiteral('else', true)
            break;
        default:

    }
    if (fobj.tokens.current().Info.Name !== 'CONDITIONAL_ELSE') {
        fobj.tokens.next();
        fobj.writeLiteral('(', true)
        Literal(fobj, config);
        fobj.writeLiteral(')', true)
    }

    fobj.writeLiteral('{', true)
    fobj.indent_add();
    fobj.tokens.skip();
    View(fobj, config);
    fobj.indent_sub()
    fobj.writeLiteral('}')


};
exports.Source = Source;
