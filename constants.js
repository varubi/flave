module.exports = {}
module.exports.NOFUNC = () => { };

var Token_Methods = ['FLAVE', 'JAVASCRIPT', 'STRING', 'REGEX'];
for (var i = 0; i < Token_Methods.length; i++) {
	module.exports[Token_Methods[i]] = Math.pow(2, i);
}
var String_States = ['STREAMOPEN', 'STREAMEMPTY', 'INLINE', 'SINGLELINE', 'STRING'];
for (var i = 0; i < String_States.length; i++) {
	module.exports[String_States[i]] = Math.pow(2, i);
}