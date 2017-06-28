const Dictionary = require('./dictionary.js')
    , $C = require('./constants.js')

function Tokens(input) {
    this.string = input.replace(/\r\n/gm, "\n");
    this.charidx = 0;
    this.mode = $C.FLAVE;
    this.ary = [];
    this.index = -1;
    this.line = 1;
    while (this.getToken()) { }
}
Tokens.prototype.getToken = function () {
    if (this.charidx < this.string.length) {
        var chunk = '';
        var tokens = Dictionary.Delimiters[this.string[this.charidx]];
        if (!tokens) {
            do {
                chunk += this.string[this.charidx];
                this.charidx++;
                if (this.charidx >= this.string.length)
                    break;
            } while (!Dictionary.Delimiters[this.string[this.charidx]])
        } else {
            do {
                chunk += this.string[this.charidx];
                this.charidx++;
                if (this.charidx >= this.string.length)
                    break;
                tokens = tokens.filter((token) => { return token.substr(0, chunk.length + 1) == (chunk + this.string[this.charidx]) });
            } while (tokens.length)
        }
        this.push(chunk);
        return true;
    }
    function getLiteral() {

    }
    return false;
}
Tokens.prototype.push = function (chunk) {
    if (chunk === '')
        return;
    this.ary.push({
        Value: chunk,
        Info: Dictionary.BySymbol[chunk] || {
            Type: 'LITERAL',
            Name: 'LITERAL'
        }
    })
}
Tokens.prototype.depleted = function () {
    return this.index + 1 >= this.ary.length;
}
Tokens.prototype.next = function () {
    if (this.index + 1 < this.ary.length) {
        this.index++;
        if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
            this.line++;
        return true;
    }
    return false;
}
Tokens.prototype.prev = function () {
    if (this.index > 0) {
        this.index--;
        if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
            this.line--;
        return true;
    }
    return false;
}
Tokens.prototype.current = function () {
    return this.ary[this.index];
}
Tokens.prototype.skip = function (continueOn, breakOn, escape) {
    var skipped = [];
    if (!(continueOn || breakOn))
        continueOn = {
            Type: 'WHITESPACE'
        }
    continueOn = continueOn || {};
    breakOn = breakOn || {};
    var nonwhitespace = '';
    for (var i = this.index; i >= 0; i--) {
        if (this.ary[i].Info.Type != 'WHITESPACE') {
            nonwhitespace = this.ary[i].Value;
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

    function shouldBreak(current) {
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
module.exports = Tokens;
