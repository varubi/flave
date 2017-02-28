var Lexemes = [{
        Symbol: '@',
        Name: 'FLAVE_DELIMITER',
        Type: 'DELIMITER',
        Delimiter: true
    },
    {
        Symbol: ':',
        Name: 'FLAVE_SEPERATOR',
        Type: 'DELIMITER',
        Delimiter: true
    }, {
        Symbol: '\\',
        Name: 'ESCAPE',
        Type: 'DELIMITER',
        Delimiter: true
    },
    {
        Symbol: 'config',
        Name: 'FLAVE_CONFIG',
        Type: 'DEFINER',
        Delimiter: false
    },
    {
        Symbol: 'class',
        Name: 'FLAVE_CLASS',
        Type: 'DEFINER',
        Delimiter: false
    },
    {
        Symbol: 'view',
        Name: 'FLAVE_VIEW',
        Type: 'DEFINER',
        Delimiter: false
    },
    {
        Symbol: 'function',
        Name: 'FLAVE_FUNCTION',
        Type: 'DEFINER',
        Delimiter: false
    },
    {
        Symbol: 'for',
        Name: 'ITERATOR_FOR',
        Type: 'ITERATOR',
        Delimiter: false
    },
    {
        Symbol: 'while',
        Name: 'ITERATOR_WHILE',
        Type: 'ITERATOR',
        Delimiter: false
    },
    {
        Symbol: 'if',
        Name: 'CONDITIONAL_IF',
        Type: 'CONDITIONAL',
        Delimiter: false
    },
    {
        Symbol: 'elseif',
        Name: 'CONDITIONAL_ELSEIF',
        Type: 'CONDITIONAL',
        Delimiter: false
    },
    {
        Symbol: 'else',
        Name: 'CONDITIONAL_ELSE',
        Type: 'CONDITIONAL',
        Delimiter: false
    },
    {
        Symbol: '{',
        Name: 'GROUP_BLOCK_L',
        Type: 'GROUP',
        SubType: 'GROUP_BLOCK',
        GroupEdge: 'OPEN',
        Delimiter: true
    },
    {
        Symbol: '}',
        Name: 'GROUP_BLOCK_R',
        Type: 'GROUP',
        SubType: 'GROUP_BLOCK',
        GroupEdge: 'CLOSE',
        Delimiter: true
    },
    {
        Symbol: '[',
        Name: 'GROUP_ARRAY_L',
        Type: 'GROUP',
        SubType: 'GROUP_ARRAY',
        GroupEdge: 'OPEN',
        Delimiter: true
    },
    {
        Symbol: ']',
        Name: 'GROUP_ARRAY_R',
        Type: 'GROUP',
        SubType: 'GROUP_ARRAY',
        GroupEdge: 'CLOSE',
        Delimiter: true
    },
    {
        Symbol: '(',
        Name: 'GROUP_GROUP_L',
        Type: 'GROUP',
        SubType: 'GROUP_GROUP',
        GroupEdge: 'OPEN',
        Delimiter: true
    },
    {
        Symbol: ')',
        Name: 'GROUP_GROUP_R',
        Type: 'GROUP',
        SubType: 'GROUP_GROUP',
        GroupEdge: 'CLOSE',
        Delimiter: true
    },
    {
        Symbol: "'",
        Name: 'STRING_SINGLE',
        Type: 'STRING',
        Delimiter: true
    },
    {
        Symbol: '"',
        Name: 'STRING_DOUBLE',
        Type: 'STRING',
        Delimiter: true
    },
    {
        Symbol: '`',
        Name: 'STRING_TICK',
        Type: 'STRING',
        Delimiter: true
    },
    {
        Symbol: '/*',
        Name: 'COMMENT_BLOCK_L',
        Type: 'COMMENT',
        Delimiter: true
    },
    {
        Symbol: '*/',
        Name: 'COMMENT_BLOCK_R',
        Type: 'COMMENT',
        Delimiter: true
    },
    {
        Symbol: '//',
        Name: 'COMMENT_LINE',
        Type: 'COMMENT',
        Delimiter: true
    },
    {
        Symbol: ' ',
        Name: 'WHITESPACE_SPACE',
        Type: 'WHITESPACE',
        Delimiter: true
    },
    {
        Symbol: '\n',
        Name: 'WHITESPACE_NEWLINE',
        Type: 'WHITESPACE',
        Delimiter: true
    },
    {
        Symbol: '\t',
        Name: 'WHITESPACE_TAB',
        Type: 'WHITESPACE',
        Delimiter: true
    },
]
var BySymbol = {};
var ByName = {};
var Delimiters_Single = [];
var Delimiters_Multi = [];
for (var i = 0; i < Lexemes.length; i++) {
    BySymbol[Lexemes[i].Symbol] = Lexemes[i];
    ByName[Lexemes[i].Name] = Lexemes[i];
    if (Lexemes[i].Delimiter) {
        if (Lexemes[i].Symbol.length > 1)
            Delimiters_Multi.push(Lexemes[i].Symbol);
        else
            Delimiters_Single.push(Lexemes[i].Symbol);
    }
}

var ReservedKeywords = [
    'do',
    'if',
    'in',
    'for',
    'let',
    'new',
    'try',
    'var',
    'case',
    'else',
    'enum',
    'eval',
    'null',
    'this',
    'true',
    'void',
    'with',
    'await',
    'break',
    'catch',
    'class',
    'const',
    'false',
    'super',
    'throw',
    'while',
    'yield',
    'delete',
    'export',
    'import',
    'public',
    'return',
    'static',
    'switch',
    'typeof',
    'default',
    'extends',
    'finally',
    'package',
    'private',
    'continue',
    'debugger',
    'function',
    'arguments',
    'interface',
    'protected',
    'implements',
    'instanceof'
]

exports.ReservedKeywords = ReservedKeywords;
exports.Lexemes = Lexemes;
exports.BySymbol = BySymbol;
exports.ByName = ByName;
exports.Delimiters_Single = Delimiters_Single;
exports.Delimiters_Multi = Delimiters_Multi;
