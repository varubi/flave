# Flave - beta
### A Razor like View transpiler for JavaScript.
\- MC not included.

### First things, first.
The aim is to isolate all HTML producing code and associated logic so that you can generate isomorphic JavaScript views.


### Examples
#### Views
``` html
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
