# Features
* Compress image in `./src/img`
* Generate `_svg.scss` files, according svg files in `.src/svg`. eg. `$filenam: "data:image/svg+xml;......."`

# Require Nodejs
``` 
https://nodejs.org/en/download/
``` 

# Install

Execute

``` 
$ npm install -g gulp bower yarn

$ cd sass-server-gulp

$ yarn install

$ bower install
```
# Use
```
Three mode ( 3 in 1 ):
$ gulp
or
$ gulp --https
or
reserve proxy(not need --https):
$ gulp --proxy "http://your.hostname"
```

####Studio Setup

```
Responsive Skin CSS URL : scheme://localhost:8080/css/skin.css
scheme = http or https according the command `Use Paragraph`
```

important you *do no need* set up script manully in reserve proxy mode
```
(webroot:'public')
put below script into page header:
<script async="" src="//localhost:8080/browser-sync/browser-sync-client.js?v=2.18.8"></script>
```

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
