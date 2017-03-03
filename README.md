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

$ yarn install

$ bower install
```
# Use
```
$ gulp
```

Open url `http://localhost:8000` in  any browser :)

####Studio Setup

```
Responsive Skin CSS URL : http://localhost:8000/css/main.css
(webroot:'sass-server')

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
