# Medulla-hotcode
`medulla-hotcode` is a [medulla](https://www.npmjs.com/package/medulla) server plugin for hot reload pages, scripts and styles.
Also, you may using it with apache / nginx or other third-party servers, just set medulla as proxy.

## Installation
As [npm](https://www.npmjs.com/package/medulla-hotcode) package  
`npm install --save-dev medulla-hotcode`

## Usage
Create and configure a [medulla server](https://www.npmjs.com/package/medulla) app.

Include plugin:
```es6
const medulla = require('medulla');
medulla.launch({
    serverApp : "./myApp.js",
    devMode: true, //or use -dev parameter on launch
    devPlugins : {
        'medulla-hotcode': {
            autoreload: 0
        }
    }
});
```
- `autoreload: 0`  
Period in ms between last "lazy reload" file change and automatically page refreshing. If set as '0', then page refresh after "lazy reload" only when cursor will be moved in browser window or if "force reload" file will be changed.

- `showtraces: true`  
If set true, all changes will display in console.

Set reload param to files/templates from `fileSystem`
```es6
module.exports.fileSystem = {
    "styles/main.css"       : {reload:"hot"}, //hot reload
    "bin/*.js"              : {url:"scripts/*.js" }, //lazy reload
    "bin/client-script.es6" : {reload:"force", url:"client-script.es6"} //force reload
};
```
- `reload: "lazy"`  
Default value, page will reload when file changed and cursor will be moved in browser window.

- `reload: "hot"`  
Set this value for file (css or js script) so that it reloaded without refreshing the page.  
**(!)** *for script files recommended use **only** in the case, if they contains solely functions without side effects.*

- `reload: "force"`  
Page will reload immediately when file changed.

Add files on page 
```es6
//myApp.js

module.exports.onRequest = io=>{
    if (io.url !== '/') io.send(404);
    else                io.send('
    <html>
        <head>
            <link href="styles/main.css" rel="stylesheet">
            <script src="client-script.es6"></script>
            <script src="scripts/hello.js"></script>
        </head>
        <body>Hello World!</body>
    </html>
    ');
};

```

## License
MIT
