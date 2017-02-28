# Flave - beta
### A Razor like View transpiler for JavaScript.
\- MC not included.

### First things, first.
The aim is to isolate all HTML producing code and associated logic so that you can generate isomorphic JavaScript views.


### Examples
#### Views
```
class sample{
    view main{
      @{
        var list = data.list;
      }
      <h1>A sample page</h1>
      @(this.lists(list))
      @(this.blogpost({title: data.title, content: data.content, date: data.date}))

    }
    view lists{
      <ul>
        @for(var i = 0; i < data.length; i++)
          <li>@(data[i])</li>
      </ul>
    }
    view blogpost{
      <h1>@(utilities.htmlencode(data.title)) @if(data.date){ - @(data.date)}</h1>
      <p>@(utilities.htmlencode(data.content))</p>
    }
}

class utilities{
  function htmlencode{
    // See more @ http://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript
    return data.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
      return '&#'+i.charCodeAt(0)+';';
    });
  }
}
```
converts to
```JavaScript
var sample = sample || {};
sample.main = function(data){
	var $O = '';
	var list = data.list;
	$O += '<h1>A sample page</h1>\n'
		+ this.lists(list)
		+ this.blogpost({title: data.title, content: data.content, date: data.date});
	return $O;
}
sample.lists = function(data){
	var $O = '';
	$O += '<ul>\n';
	for(var i = 0; i < data.length; i++){
		$O += '<li>' + data[i] + '</li>\n';
	}
	$O += '</ul>\n';
	return $O;
}
sample.blogpost = function(data){
	var $O = '';
	$O += '<h1>' + utilities.htmlencode(data.title)if(data.date){
		$O += '-' + data.date;
	}
	$O += '</h1>\n'
		+ '<p>' + utilities.htmlencode(data.content) + '</p>\n';
	return $O;
}
var utilities = utilities || {};
utilities.htmlencode = function(data){
	// See more @ http://stackoverflow.com/questions/18749591/encode-html-entities-in-javascript
	return data.replace(/[u00A0-u9999<>&]/gim, function(i){
	return'&#'+i.charCodeAt(0)+';';});
}
```
#### Functions
```
class utilities{
  function trimString{
    return data.trim();
  }
}
```
```JavaScript
var utilities = utilities || {};
utilities.trimString = function(data){
	return data.trim();
}
```
