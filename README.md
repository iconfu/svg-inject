![minified size](http://img.badgesize.io/iconfu/svg-inject/master/dist/svg-inject.min.js?label=minified%20size) ![gzip size](http://img.badgesize.io/iconfu/svg-inject/master/dist/svg-inject.min.js?compression=gzip)

# SVGInject

A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.

Developed and maintained by [INCORS](https://www.incors.com), the creators of [Iconfu](https://www.iconfu.com).


## What does it do?

SVGInject replaces an `<img>` element with an inline SVG. The SVG is loaded from the `src` attribute location of the `<img>` element.

Element b​efore injection:

```html
<img src="image.svg" onload="SVGInject(this)" />

```

Element after injection (SVG loaded from image.svg):

```html
<svg version="1.1" ...> ... </svg>
```


## Why should I use it?

An SVG can only be properly styled with CSS and accessed with Javascript on element level if the SVG is inline in the DOM. With SVGInject you can keep your SVGs as individual files, but still access them with CSS and Javascript.


## How to install SVGInject?

### Manually 

Include the SVGInject Javascript file in the head of your HTML document

```html
<head>
  ...
  <script src="svg-inject.min.js"></script>
  ...
</head>
```

Download plain version: [svg-inject.js](https://raw.githubusercontent.com/iconfu/svg-inject/master/dist/svg-inject.js)

Download minified version: [svg-inject.min.js](https://raw.githubusercontent.com/iconfu/svg-inject/master/dist/svg-inject.min.js)

### npm

If you are using [npm](https://www.npmjs.com)

```console
$ npm install @iconfu/svg-inject
```

### Yarn

If you are using [Yarn](https://yarnpkg.com)

```console
$ yarn add @iconfu/svg-inject
```


## Basic usage

Add `onload="SVGInject(this)"` to any `<img>` element where you want the SVG to be injected

### Example:

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="image.svg" onload="SVGInject(this)" />
</body>
</html>
```

**That's all: The SVG gets injected and is styleable!!!**

:sparkles: :sparkles: :sparkles:


<hr>


## What are the advantages?

* **Wide browser support**: Works on all browsers supporting SVG. Yes, this includes Internet Explorer 9 and higher! ([full list](https://caniuse.com/#feat=svg))

* **Fallback without Javascript**: If Javascript is not available the SVG will still show. It's just not styleable with CSS. 

* **Fallback if image source is not available**: Behaves like a normal `<img>` element if file not found or not available.


## What are the limitations?

SVGInject is intended to work in production environments but it has a few limitations:

* The image src must conform to the [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), which basically means the image origin must be were the website is running. This may be bypassed using the [Cross-Origin Resource Sharing (CORS) mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
* Due to the same-origin policy SVGInject does not work when run from the local file system in many browsers (Chrome, Safari), yet in Firefox it works.
* The SVGs are are injected as they are. Except for copying the element attributes no pre- or post-processing is done (for example to ensure uniqueness of ids). However, if required the provided hooks can be used to add custom processing.


## Why use the `onload` attribute?

The recommended way to trigger injection is to call `SVGInject(this)` inside the `onload` attribute:

```html
<img ... onload="SVGInject(this)" /> 
```

**Advantages:**

* **Intuitive usage**: Insert the SVG images into your HTML code just as PNG images, with only one additional instruction. It's very clear to understand what it does looking at the pure HTML.

* **Works with dynamic content**: If `<img>` elements are added dynamically injection still works.

* **Built-in prevention of unstyled image flash**: SVGInject hides img elements until injection is complete, thus preventing a brief flicker of the unstyled image called [unstyled image flash](#how-does-svginject-prevent-unstyled-image-flash).

* **Early injection**: The injection can already start before the DOM content is fully loaded.

* **Optimized image loading**: The images load in the same order as the browser loads the SVGS without injection.

* **Standard-conform**: The `onload` event handler on `<img>` elements has long been supported by all browsers and is officially part of the W3C specification since [HTML5.0](https://www.w3.org/TR/html50/webappapis.html#event-handler-attributes).


If you do not want to use the `onload` attribute but prefer to inject SVGs directly from Javascript, you can do this, too. You can find more information [here](#how-to-use-svginject-directly-from-javascript).


## How are attributes handled?

All attributes are copied from the `<img>` element to the injected `<svg>` element with the following exceptions:

* `src`, `alt`, and `onload` attributes are not copied
* the `title` attribute is transformed to a `<title>` element in the injected SVG

You may implement a different attribute handling in the `beforeInject` options hook.


## API

| Function | Description |
|----------|-------------|
| SVGInject(img, options) | Injects the SVG specified in the `src` attribute of the specified `img` element or array of `img` elements. The optional second parameter sets the [options](#options) for this injection. |
| SVGInject.setOptions(options) | Sets the default [options](#options) for SVGInject. |
| SVGInject.err(img, fallbackSrc) | Used in `onerror` Event of an `<img>` element to handle cases when loading of the original source fails (for example if the file is corrupt or not found or if the browser does not support SVG). This triggers a call to the option's `onInjectFail` hook if available. The optional second parameter will be set as the new `src` attribute for the `img` element. |


### Options

| Property name | Type | Default | Description |
| ------------- | ---- | ------- | ----------- |
| cache | boolean | `true` | If set to `true` the SVG will be cached using the absolute URL. The cache only persists for the lifetime of the page. Without caching images with the same absolute URL will trigger a new XMLHttpRequest but browser caching will still apply. |
| copyAttributes | boolean | `true` | If set to `true` the attributes will be copied from `img` to `svg`. See [How are attributes handled?](#how-are-attributes-handled) for details. You may implement your own method to copy attributes in the `beforeInject` options hook. |
| beforeInject | function(svg, img) | `empty function` | Hook before SVG is injected. The `svg` and `img` elements are passed as parameters. If any html element is returned it gets injected instead of applying the default SVG injection. |
| afterInject | function(svg, img) | `empty function` | Hook after SVG is injected. The `svg` and `img` elements are passed as parameters. |
| onInjectFail | function(img) | `empty function` | Hook after injection fails. The `img` element is passed as an parameter.  <br> <br> If SVGInject is used with the `onload` attribute, `onerror="SVGinject.err(this);"` must be added to the `<img>` element to make sure `onInjectFail` is called. |


## How does SVGInject prevent "unstyled image flash"

Before an SVG is injected the original unstyled SVG may be displayed for a brief moment by the browser. If a style is already applied to the SVG at runtime, the styled SVG will look different from the unstyled SVG, causing a brief “flashing” of the unstyled SVG before injection occurs. We call this effect unstyled image flash.


If SVGInject is used with the `onload` attribute, SVGInject has a built-in functionality to prevent unstyled image flash. A `<style>` element with one CSS rule is added to the document to hide all injectable `<img>` elements until injection is complete.

When [using Javscript directly](https://github.com/iconfu/svg-inject#how-to-use-svginject-directly-from-javascript) SVGInject has no build in functionality to prevent unstyled image flash. You can find a custom solution for this in the [example for using SVGInject without the `onload` function](#example-without-using-the-onload-function).


## How to use SVGInject directly from Javascript?

Instead of using the `onload` attribute on the `<img>` element you can also call SVGInject directly from Javascript.

**Examples:**
```javascript
// inject by class name
SVGInject(document.getElementsByClassName('myClassName'));

// inject by id
SVGInject(document.getElementById('myId'));
```

You need to make sure the images are already inside the DOM before injection like this:

```javascript
document.addEventListener("DOMContentLoaded", function() {
  // call SVGInject() from here
});
```

If you dynamically insert `<img>` elements you need to call `SVGInject()` after insertion.


## Fallback for no SVG support (IE <= 8)

If the browser does not support SVG, this simple fallback solution replaces the `src` attribute with an alternative image URI.

```html
<​img​ ​src​=​"image.svg"​ ​onload​=​"SVGInject(this)"​ ​onerror​=​"SVGInject.err(this, ‘image.png';" /​>
```

A more generic method that will attempt to load a file with the same path and name but a different file extension looks like this:

```javascript
SVGInject.setOptions({
  onInjectFail: function(img) {
    img.src = img.src.slice(0, -4) + ".png";
  }
});
```

```html
<​img​ ​src​=​"image.svg"​ ​onload​=​"SVGInject(this)"​ ​onerror​=​"SVGInject.err(this)" /​>
```

Note that the `onerror="SVGInject.err(this)"` is necessary if SVGInject is used with the `onload` attribute,​ because the `onInjectFail` callback will only get triggered this way.


## What about some examples?

Here are some examples which cover the most common use cases.

### Basic Example

This is the standard usage of SVGInject which works on all modern browsers, and IE9+.

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="image.svg" onload="SVGInject(this)" />
</body>
</html>
```

### Example with fallback for IE8 & IE7

This example shows how to add a fallback for browsers not supporting SVGs. For these browsers an alternative PNG source is used to display the image.

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="image.svg" onload="SVGInject(this)" onerror="SVGInject.err(this, 'image.png')" />
</body>
</html>
```

Another, more generic way of providing a fallback image source is using the `onInjectFail` hook. If loading the SVG fails, this will try to load a file with the same name except “png” instead of “svg” for the file ending.

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <!-- optional PNG fallback if SVG is not supported (IE <= 8) -->
  <script>SVGInject.setOptions({ onInjectFail: function(img) { img.src = img.src.slice(0, -4) + ".png"; } });</script>
</head>
<body>
  <!-- the onerror="SVGInject(this)" is needed to trigger the onInjectFail callback -->
  <img src="image.svg" onload="SVGInject(this)" onerror="SVGInject.err(this)" />
</body>
</html>
```

### Example using `options`

This example shows how to use SVGInject with all available options.

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <script>
    SVGInject.setOptions({
      cache: false, // no caching
      copyAttributes: false, // do not copy attributes from `<img>` to `<svg>`
      beforeInject: function(svg, img) {
        // add a class to the svg
        svg.classList.add("my-class");
      }, 
      afterInject: function(svg, img) {
        // set opacity
        svg.style.opacity = 1;
      },
      onInjectFail: function(img) {
        // set the image background red
        img.style.background = 'red';
      }
    })
  </script>
</head>
<body>
  <img src="image.svg" onload="SVGInject(this)" onerror="SVGInject.err(this)" />
</body>
</html>
```

### Example without using the `onload` function

This example shows how to use SVGInject directly from Javascript without the onload attribute. After the DOM content has loaded, all elements with class 'img-inject' are replaced by the SVG specified in their src element. It also implements a method to prevent [unstyled image flash](#how-does-svginject-prevent-unstyled-image-flash).


```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <!-- hide images until injection has completed or failed -->
  <style>
    img.inject:not(.inject-failed) {
      visibility: hidden;
    }
  </style>

  <script>
    SVGInject.setOptions({
      onInjectFail: function(img) {
        img.classList.addClass('inject-failed');
      }
    });

    document.addEventListener("DOMContentLoaded", function() {
      SVGInject(document.getElementsByClassName('inject'));
    });
  </script>
</head>
<body>
  <img src="image_1.svg" class="inject" />
  <img src="image_2.svg" class="inject" />
</body>
</html>
```


## Browser support

Full support for all modern browsers, and IE9+ ([full list](https://caniuse.com/#feat=svg))

Support for IE8 with optional PNG Fallback method


## License

[MIT License](https://github.com/iconfu/svg-inject/blob/master/LICENSE)