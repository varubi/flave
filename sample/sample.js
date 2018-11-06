var sample = sample || {};
sample.main = function(data){var $O = '';var list = data.list;$O += '<h1 class="sample-page">Sample page</h1>\n'+this.lists(list)+'\n'+this.blogpost({title: data.title, content: data.content, date: data.date})+' \n';return $O;};
sample.lists = function(data){var $O = '';$O += '<ul>\n';for(var i = 0; i < data.length; i++){$O += '<li>'+data[i]+'</li>\n';}$O += '</ul>\n';return $O;};
sample.blogpost = function(data){var $O = '';$O += '<h1>'+utilities.htmlencode(data.title)+' ';if(data.date){$O += '- '+data.date+'\n';}$O += '</h1>\n'+'<p>'+utilities.htmlencode(data.content)+'</p>\n';return $O;};
var utilities = utilities || {};
utilities.htmlencode = function(data){    return data.replace(/[u00A0-u9999<>&]/gim, function(i){return '&#'+i.charCodeAt(0)+';';});};