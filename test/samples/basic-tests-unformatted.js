/*#### Import ####*/
/*## Import Statement ##*/
import {test} from './test'
/*#### Comments ####*/
/*## Single Line Comment ##*/
function test(data){var $O = '';$O += '<span> \n'+'</span>\n';return $O;};
/*## Block Comment Inline ##*/
function test(data){var $O = '';$O += '<span></span>\n';return $O;};
/*## Block Comment MultiLine ##*/
function test(data){var $O = '';$O += '<span>\n'+'</span>\n';return $O;};
/*## HTML COMMENT ##*/
function test(data){var $O = '';$O += '<span>\n'+'<!-- HTML COMMENT SHOULD BE IN CODE -->\n'+'</span>\n';return $O;};
/*#### Conditionals ####*/
/*## For Loop New Line##*/
function test(data){var $O = '';for(var i = 0; i < data.length; i++){$O += '<li>'+data[i].content+'</li>\n';}return $O;};
/*## For Loop New Brackets##*/
function test(data){var $O = '';for(var i = 0; i < data.length; i++){$O += '<li>'+data[i].content+'</li>\n';}return $O;};
/*## While New Lines##*/
function test(data){var $O = '';while(condition){condition = false;}return $O;};
/*## While New Lines##*/
function test(data){var $O = '';while(condition){$O += '<span>'+data.content+'</span>';condition = false;$O += '\n';}return $O;};
/*## If Else New Lines##*/
function test(data){var $O = '';if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
/*## If Else Brackets##*/
function test(data){var $O = '';if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
/*## Nested If Else New Lines##*/
function test(data){var $O = '';if(data.nested){if(data.b){$O += '<b> '+data.content+' </b>\n';}}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
/*## Nested If Else Brackets##*/
function test(data){var $O = '';if(data.nested){if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}}return $O;};
/*#### Whitespace ####*/
/*## Space Before##*/
function test(data){var $O = '';$O += '<span> '+data.a+'</span>\n';return $O;};
/*## Space Between##*/
function test(data){var $O = '';$O += '<span>'+data.a+' '+data.b+'</span>\n';return $O;};
/*## Space After##*/
function test(data){var $O = '';$O += '<span>'+data.a+' </span>\n';return $O;};
/*#### Misc ####*/
/*## Mixing JS##*/
function test(data){var $O = '';if(data){$O += '<h1>'+data+'</h1>';}$O += '\n';return $O;};
/*## Special Characters##*/
function test(data){var $O = '';$O += '<span>{}[]()@\\</span>\n';return $O;};