# Flave - beta [![Build Status](https://travis-ci.org/varubi/flave.svg?branch=master)](https://travis-ci.org/varubi/flave)
## Summary
A Razor like View transpiler for JavaScript.

## Install
    npm install flave

## Preview
![ScreenShot](https://raw.githubusercontent.com/varubi/flave/master/sample/sample.png?raw=true "ScreenShot")

## Quick Guide
### Structure
- __Syntax__  
    ```
    class classname{
        view viewname{

        }
        function functionname{

        }
    }
    ```
- __Description__  
Wrapping everything in a class is optional, it allows to encapsulate methods under a namespace.
The `view` keyword defines a section that uses the `flave`  syntax. The `function` keyword defines just that, a JavaScript function. Both `view` and `function` accept one argument, named `data`. See the screenshot above for an example.
### Variables
- __Syntax__  
```@( **JavaScriptCode** )```
- __Description__  
Use to insert dynamic text into the views.
- __Examples__
    ```HTML
    <span>@(data.title)</span>
    ```
    ```HTML
    <a href="?query=@(encodeURIComponent(data.title))">Query</a>
    ```

### Codeblocks
- __Syntax__  
```@{ **JavaScript Statements** }```
- __Description__  
Use to insert raw JavaScript
- __Examples__  
    ```JavaScript
    @{var lists = data.split('\n')}
    ```
    ```JavaScript
    @{
    var lists = data.split('\n');
    lists = lists
        .map((list) => list.trim())
        .filter((list) => list)
    }
    ```



### Iterators
- __Syntax__  
```@for(**Initialization**; **Condition**; **Final-expression**) Markup```  
```@while( **Condition** ){ Markup }```
- __Description__  
These iterators map to JavaScript's iterators, so if works in JavaScript it should work here. Just like in Javascript, curly brackets are optional.
- __Examples__  
    ```JavaScript    
    @for(var i = 0; i < data.imgs; i++)
        <img src="@(data.imgs[i])" />
    ```
    ```JavaScript    
    @for(var key in data.list){
        <li><b>@(key)</b> @(data[key])</li>
    }
    ```

### Conditionals
- __Syntax__  
```@if( **Condition** ){ Markup } @else(**Condition){ Markup } @else{ Markup }```
- __Description__  
Like iterators these all map to native JavaScript conditionals. Curly brackets are optional.
- __Examples__  
    ```
    @if(typeof data == 'number'){
        <input type="number" value="@(data)"/>
    }
    @elseif(typeof data == 'string'){
        <input type="text" value="@(data)"/>
    }@else
        <input type="text" disabled />
    ```
### Comments
- __Syntax__  
```// Comment```  
```/* Comment Block */```
- __Description__  
Comment code
- __Examples__  
    ```JavaScript
    // Comment Line
    ```
    ```JavaScript   
    /* 
        Multiline Comment Block
    */
    ```