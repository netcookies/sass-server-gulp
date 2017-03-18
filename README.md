# Atention

For gulp 3.x, please use tag v1.0.

# Features
* Compress image in `./src/img`
* Generate `_svg.scss` files, according svg files in `.src/svg`. eg. `$filenam: "data:image/svg+xml;......."`

# Require Nodejs, Python2
``` 
https://nodejs.org/en/download/
``` 

# Install

Execute

``` 
$ git clone --recursive https://github.com/netcookies/sass-server-gulp.git

$ npm uninstall gulp --save-dev

$ npm uninstall gulp -g

$ npm install -g gulpjs/gulp#4.0 bower yarn

$ cd sass-server-gulp

$ yarn install

$ bower install
```

# Use
##Set environment

###reserve proxy(recommend, If you are not in China):
```
$ gulp --proxy "http://stage.prod.site"
```

###http mode
```
$ gulp

Studio Responsive Skin CSS URL : 
http://localhost:8080/css/skin.min.css

put below script into page header:
<#if config.getString("phase", "prod") == "stage">
<script async="" src="//localhost:8080/browser-sync/browser-sync-client.js?v=2.18.8"></script>
</#if>
```

###https mode
```
$ gulp --https

Studio Responsive Skin CSS URL : 
https://localhost:8080/css/skin.min.css

put below script into page header:
<#if config.getString("phase", "prod") == "stage">
<script async="" src="//localhost:8080/browser-sync/browser-sync-client.js?v=2.18.8"></script>
</#if>
```

## Got to work
####Working SCSS

add your custom scss in 

```
sass/_style.scsss
sass/_variables.scss

````

####Peak Version
17.1

####Notes
if chrome is complaing about loading unsafe script on the address bar, tick it, so the local css can work.
use chrome dev tool for Live SASS /in-browser Sass editing, please refer to this [article](https://medium.com/@toolmantim/getting-started-with-css-sourcemaps-and-in-browser-sass-editing-b4daab987fb0#.mtu17dwaz)
