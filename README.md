# Medulla-hotcode
`medulla-hotcode` is a [medulla](https://www.npmjs.com/package/medulla) server plugin for hot reload pages, scripts and styles.
Also, you may using it with apache / nginx or other third-party servers, just set medulla as proxy.

## Installation
As [npm](https://www.npmjs.com/package/medulla-hotcode) package  
`npm i -S medulla-hotcode`

## Usage
Create and configure a [medulla server](https://www.npmjs.com/package/medulla) app.

Include plugin:
```es6
require('medulla')({
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

Set reload param to files/templates from `watchedFiles`
```es6
module.exports.watchedFiles = {
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

## Usage as proxy dev-server
Set medulla as proxy

```es6
const APPDIR = "/srv/www/myapp.loc/code/"; //Path to your project code dir
const myProxy = module_exports=>{
    module_exports.watchedFiles = {
        [APPDIR+"~*.js"]  : {url:"~*.js" , reload:"force"},
        [APPDIR+"~*.css"] : {url:"~*.css", reload:"hot"},
        [APPDIR+"~*.php"] : {type:"serverside"},
    };

    //for detecting pages
    const testPage = url=>{
        return url === '/' || url.endsWith('.html');
    };

    module_exports.onRequest = (request, response)=>{
        return {target:"myapp.loc", isPage:testPage(request.url)};
    };
};

require('medulla')({
    port: 3000,
    serverApp: myProxy,
    devMode: true,
    platforms: {
        "win32": {forcewatch: false},
        "linux": {forcewatch: true}
    },
    devPlugins: {
        "medulla-hotcode": {autoreload: 0}
    }
});
```

## License
MIT
