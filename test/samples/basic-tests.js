import {test} from './test'
function test(data){var $O = '';$O += '<span> \n'+'</span>\n';return $O;};
function test(data){var $O = '';$O += '<span></span>\n';return $O;};
function test(data){var $O = '';$O += '<span>\n'+'</span>\n';return $O;};
function test(data){var $O = '';$O += '<span>\n'+'<!-- HTML COMMENT SHOULD BE IN CODE -->\n'+'</span>\n';return $O;};
function test(data){var $O = '';for(var i = 0; i < data.length; i++){$O += '<li>'+data[i].content+'</li>\n';}return $O;};
function test(data){var $O = '';for(var i = 0; i < data.length; i++){$O += '<li>'+data[i].content+'</li>\n';}return $O;};
function test(data){var $O = '';while(condition){condition = false;}return $O;};
function test(data){var $O = '';while(condition){$O += '<span>'+data.content+'</span>';condition = false;$O += '\n';}return $O;};
function test(data){var $O = '';if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
function test(data){var $O = '';if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
function test(data){var $O = '';if(data.nested){if(data.b){$O += '<b> '+data.content+' </b>\n';}}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}return $O;};
function test(data){var $O = '';if(data.nested){if(data.b){$O += '<b> '+data.content+' </b>\n';}else if(data.em){$O += '<em>  '+data.content+' </em>\n';}else{$O += '<span>'+data.content+'</span>\n';}}return $O;};
function test(data){var $O = '';$O += '<span> '+data.a+'</span>\n';return $O;};
function test(data){var $O = '';$O += '<span>'+data.a+' '+data.b+'</span>\n';return $O;};
function test(data){var $O = '';$O += '<span>'+data.a+' </span>\n';return $O;};
function test(data){var $O = '';if(data){$O += '<h1>'+data+'</h1>';}$O += '\n';return $O;};
function test(data){var $O = '';$O += '<span>{}[]()@\\</span>\n';return $O;};