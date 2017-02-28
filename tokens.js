  const FS = require('fs');
  const Dictionary = require('./dictionary.js')

  function Tokens(infile) {
      this.string = FS.readFileSync(infile, 'utf8').replace(/\r\n/gm, "\n");
      this.ary = [];
      this.index = -1;
      this.line = 1;
      var chunk = '';
      for (var i = 0; i < this.string.length; i++) {
          if (Dictionary.Delimiters_Single.indexOf(this.string[i]) > -1) {
              this.push(chunk)
              this.push(this.string[i])
              chunk = '';
          } else {
              chunk += this.string[i];
              for (var ii = 0; ii < Dictionary.Delimiters_Multi.length; ii++) {
                  if (chunk.substr(-Dictionary.Delimiters_Multi[ii].length) === Dictionary.Delimiters_Multi[ii]) {
                      this.push(chunk.slice(0, -Dictionary.Delimiters_Multi[ii].length))
                      this.push(Dictionary.Delimiters_Multi[ii])
                      chunk = '';
                  }
              }
          }
      }
      this.push(chunk);
  }
  Tokens.prototype.push = function(chunk) {
      if (chunk === '')
          return;
      this.ary.push({
          Value: chunk,
          Info: Dictionary.BySymbol[chunk] || {
              Type: 'TEXT',
              Name: 'TEXT'
          }
      })
  }
  Tokens.prototype.next = function() {
      if (this.index + 1 < this.ary.length) {
          this.index++;
          if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
              this.line++;
          return true;
      }
      return false;
  }
  Tokens.prototype.prev = function() {
      if (this.index > 0) {
          this.index--;
          if (this.current().Info.Name == 'WHITESPACE_NEWLINE')
              this.line--;
          return true;
      }
      return false;
  }
  Tokens.prototype.current = function() {
      return this.ary[this.index];
  }
  Tokens.prototype.skip = function(continueOn, breakOn, escape) {
      var skipped = [];
      if (!(continueOn || breakOn))
          continueOn = {
              Type: 'WHITESPACE'
          }
      continueOn = continueOn || {};
      breakOn = breakOn || {};
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
      }

      function shouldBreak(current) {
          for (var key in current) {
              if (breakOn[key] && breakOn[key].indexOf(current[key]) > -1)
                  return true;
              else if (continueOn[key] && continueOn[key].indexOf(current[key]) > -1)
                  return false;
          }
          return !(Object.keys(breakOn).length);
      }
      return skipped;
  }
  module.exports = Tokens;
