import Lexemes from './symbols.json'
const _Symbol: any = {};
const _Name: any = {};
const _delimiters: any = {};

for (var i = 0; i < Lexemes.length; i++) {
    const Lex = Lexemes[i]

    _Symbol[Lex.Symbol] = Lex;
    _Name[Lex.Name] = Lex;
    if (Lex.Delimiter) {
        var key = Lex.Symbol.substr(0, 1)
        if (!_delimiters[key])
            _delimiters[key] = [];
        _delimiters[key].push(Lex.Symbol);
    }
}

export const Symbols = _Symbol;
export const Names = _Name;
export const Delimiters = _delimiters;