var TestPage = TestPage || {};
TestPage.main = function(data){
	var $O = '';
	$O += '<div class="' + data.wrapperclass + '">\n'
		+ '<h1>Comments</h1>\n'
		+ '<!-- HTML COMMENT SHOULD BE IN CODE -->\n'
		+ '<h1>Characters</h1>\n'
		+ '{}[]()@\\\n'
		+ '<h1>Blocks</h1>\n'
		+ '<pre>@{} = --&gt;';
	var list = data.li;
	$O += '&lt;--</pre>\n'
		+ '<pre>@() = --&gt;' + data.testString + '&lt;--</pre>\n'
		+ '<h1>Conditionals</h1>\n'
		+ '<h2>for</h2>\n'
		+ '<ul>' + conditionals.forloop(list) + '</ul>\n'
		+ '<h2>if, else if, else</h2>\n'
		+ conditionals.ifelse({content: 'Lorem Ipsum wants to be em\'d', b:false, em:true}) + '\n'
		+ '<h2>while</h2>\n'
		+ conditionals.whileloop(utilities.trimString("  I EXECUTED IN A WHILE LOOP  ")) + '\n'
		+ '<h2>mixed</h2> ' + data.pre + ' ' + data.post + '\n'
		+ conditionals.mixed(data.mixed) + '\n'
		+ '</div>\n';
	return $O;
}
var utilities = utilities || {};
utilities.trimString = function(data){
	return data.trim();
}
var conditionals = conditionals || {};
conditionals.forloop = function(data){
	var $O = '';
	for(var i = 0; i < data.length; i++){
		$O += '<li style="' + data[i].style + '">' + utilities.trimString(data[i].content) + '</li>\n';
	}
	return $O;
}
conditionals.ifelse = function(data){
	var $O = '';
	if(data.title){
		$O += '<h3>' + data.title + '</h3>\n';
	}
	if(data.b){
		$O += '<b> ' + data.content + ' </b>\n';
	}
	else if(data.em){
		$O += '<em>\n'
			+ data.content + '\n'
			+ '</em>\n';
	}
	else{
		$O += '<span>' + data.content + '</span>\n';
	}
	return $O;
}
conditionals.whileloop = function(data){
	var $O = '';
	var condition = true;
	while(condition){
		$O += '--&gt;' + data + '&lt;--';
		condition = false;
		$O += '\n';
	}
	return $O;
}
conditionals.mixed = function(data){
	var $O = '';
	if(data){
	$O += '<h1>' + data + '</h1>';
	}
	$O += '\n';
	return $O;
}
var dev = dev || {};
dev.testObject = function(data){
	return {'testString': 'Lorem Ipsum','mixed': 'Wierd mixed code','li':[{'style':'color:red','content':'Red'}, {'style':'color:blue','content':'Blue'}],'wrapperclass': 'stylish'}
}
dev.test = function(data){
	return TestPage.main(TestPage.testObject());
}
if(typeof module!=='undefined'&&typeof module.exports!=='undefined'){
	module.exports.TestPage=TestPage;
	module.exports.utilities=utilities;
	module.exports.conditionals=conditionals;
	module.exports.dev=dev;
}