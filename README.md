![minified size](http://img.badgesize.io/iconfu/svg-inject/master/dist/svg-inject.min.js?label=minified%20size&v=10) ![gzip size](http://img.badgesize.io/iconfu/svg-inject/master/dist/svg-inject.min.js?compression=gzip&v=10) [![npm version](https://badge.fury.io/js/%40iconfu%2Fsvg-inject.svg?v=10)](https://badge.fury.io/js/%40iconfu%2Fsvg-inject)



# SVGInject

A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.

Developed and maintained by [INCORS](http://www.incors.com), the creators of [iconfu.com](https://www.iconfu.com).


## What does it do?

SVGInject replaces an `<img>` element with an inline SVG. The SVG is loaded from the URL specified in the `src` attribute of the `<img>` element.

![SVG Injection](https://github.com/iconfu/svg-inject/raw/master/resources/svg-injection.png?raw=true "SVG Injection")

Element before injection:

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

Include the SVGInject Javascript file in the `<head>` element of the HTML document, or anywhere before the first usage of SVGInject

```html
<head>
  ...
  <script src="svg-inject.min.js"></script>
  ...
</head>
```

Download plain version (v1.2.3): [svg-inject.js](https://raw.githubusercontent.com/iconfu/svg-inject/v1.2.3/dist/svg-inject.js)

Download minified version (v1.2.3): [svg-inject.min.js](https://raw.githubusercontent.com/iconfu/svg-inject/v1.2.3/dist/svg-inject.min.js)

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

### Option 1 - Call SVGInject from the `onload` attribute

Add `onload="SVGInject(this)"` to any `<img>` element where you want the SVG to be injected.

For most use cases this approach is recommended and provides nice [advantages](#what-are-additional-advantages-when-using-onload).

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="image1.svg" onload="SVGInject(this)" />
  <img src="image2.svg" onload="SVGInject(this)" />
</body>
</html>
```

### Option 2 - Call SVGInject from anywhere

```html
<html>
<body>
  <img src="image1.svg" class="injectable" />
  <img src="image2.svg" class="injectable" />

  <script src="svg-inject.min.js"></script>
  <script>
    SVGInject(document.querySelectorAll("img.injectable"));
  </script>
</body>
</html>
```

**Hooray :tada: - The SVGs get injected and are styleable!!!**


<hr>


## What are the advantages?

* **Wide browser support**: Works on all browsers supporting SVG. Yes, this includes Internet Explorer 9 and higher! ([full list](https://caniuse.com/#feat=svg))

* **Fallback without Javascript**: If Javascript is not available the SVG will still show. It's just not styleable with CSS.

* **Fallback if image source is not available**: Behaves like a normal `<img>` element if file not found or not available.

* **Prevention of ID conflicts**: IDs in the SVG are made unique before injection to prevent ID conflicts in the DOM.

## What are additional advantages when using `onload`?

The recommended way to trigger injection is to call `SVGInject(this)` inside the `onload` attribute:

```html
<img ... onload="SVGInject(this)" />
```

This provides additional advantages:

* **Intuitive usage**: Insert SVG images into HTML code just as PNG images, with only one additional instruction. It's very clear to understand what it does by looking at the pure HTML.

* **Works with dynamic content**: If `<img>` elements are added dynamically, injection still works.

* **Built-in prevention of unstyled image flash**: SVGInject hides `<img>` elements until injection is complete, thus preventing a brief flicker of the unstyled image (called [unstyled image flash](#how-does-svginject-prevent-unstyled-image-flash)).

* **Early injection**: The injection can already start before the DOM content is fully loaded.

* **Standard-conform**: The `onload` event handler on `<img>` elements has long been supported by all browsers and is officially part of the W3C specification since [HTML5.0](https://www.w3.org/TR/html50/webappapis.html#event-handler-attributes).

* **Great load performance**: Browers load the SVG right when the `<img>` element is parsed in the DOM. After the `onload` event the SVG is available from the browser cache in the subsequent XHR request and therefor each SVG is only loaded once.

If you do not want to use the `onload` attribute but prefer to inject SVGs directly from Javascript, you can find more information [here](#how-to-use-svginject-directly-from-javascript).


## What are the limitations?

SVGInject is intended to work in production environments however it has a few limitations you should be aware of:

* The image source must conform to the [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), which basically means the image origin must be where the website is running. This may be bypassed using the [Cross-Origin Resource Sharing (CORS) mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
* Due to the same-origin policy SVGInject does not work when run from the local file system in many browsers (Chrome, Safari), yet in Firefox it works.


## How are attributes handled?

All attributes are copied from the `<img>` element to the injected `<svg>` element before injection with the following exceptions:

* The `src`, `title`, `alt`, `onerror` and `onload` attributes are not copied
* The `title` attribute is transformed to a `<title>` element and inserted as the first child element of the injeted SVG. If there is an existing `<title>` element as first child element it gets replaced.

You can disable the previously described attribute handling by setting the `copyAttributes` option to `false`. You may also implement your own attribute handling in the `beforeInject` options hook.

Additionally, after loading the SVG, the value of the `src` attribute of the `<img>` element is transformed to an absolute URL and inserted as a `data-inject-url` attribute.

## API

| Function | Description |
|----------|-------------|
| SVGInject(img, options) | Injects the SVG specified in the `src` attribute of the specified `img` element or array of elements. The optional second parameter sets the [options](#options) for this injection. Returns a `Promise` object which resolves if all passed in `img` elements have either been injected or failed to inject (Only if a global [Promise object is available](https://caniuse.com/#feat=promises) like in all modern browsers or through a [Promise Polyfill](https://www.npmjs.com/package/promise-polyfill)).  |
| SVGInject.setOptions(options) | Sets the default [options](#options) for SVGInject. |
| SVGInject.err(img, fallbackSrc) | Used in `onerror` event of an `<img>` element to handle cases when loading of the original source fails (for example if the file is corrupt or not found or if the browser does not support SVG). This triggers a call to the option's `onFail` hook if available. The optional second parameter will be set as the new `src` attribute for the `img` element. |


### Options

| Property name | Type | Default | Description |
| ------------- | ---- | ------- | ----------- |
| useCache | boolean | `true` | If set to `true` the SVG will be cached using the absolute URL. The cache only persists for the lifetime of the page. Without caching images with the same absolute URL will trigger a new XMLHttpRequest but browser caching will still apply. |
| copyAttributes | boolean | `true` | If set to `true` [attributes will be copied](#how-are-attributes-handled) from the `img` to the injected `svg` element. You may implement your own method for copying attributes in the `beforeInject` options hook. |
| makeIdsUnique | boolean | `true` | If set to `true` all IDs of elements in the SVG are made unique by appending the string "--inject-X", where X is a running number which increases with each injection. This is done to avoid duplicate IDs in the DOM. If set to `false`, all IDs within the SVG will be preserved.|
| beforeLoad | function(img) | `undefined` | Hook before SVG is loaded. The `img` element is passed as a parameter. If the hook returns a string it is used as the URL instead of the `img` element's `src` attribute. |
| afterLoad | function(svg,&nbsp;svgString) | `undefined` | Hook after SVG is loaded. The loaded `svg` element and `svgString` string are passed as a parameters. If caching is active this hook will only get called once for injected SVGs with the same absolute path. Changes to the `svg` element in this hook will be applied to all injected SVGs with the same absolute path. It's also possible to return an new SVG string or SVG element which will then be used for later injections. |
| beforeInject | function(img,&nbsp;svg) | `undefined` | Hook directly before the SVG is injected. The `img` and `svg` elements are passed as parameters. The hook is called for every injected SVG. If an [Element](https://developer.mozilla.org/de/docs/Web/API/Element) is returned it gets injected instead of applying the default SVG injection. |
| afterInject | function(img,&nbsp;svg) | `undefined` | Hook after SVG is injected. The `img` and `svg` elements are passed as parameters. |
| onAllFinish | function() | `undefined` | Hook after all `img` elements passed to an SVGInject() call have either been injected or failed to inject.
| onFail | function(img,&nbsp;status) | `undefined` | Hook after injection fails. The `img` element and a `status` string are passed as an parameter. The `status` has one of the values: `'SVG_NOT_SUPPORTED'` - the browser does not support SVG, `'SVG_INVALID'` - the SVG is not in a valid format or `'LOAD_FAIL'` - loading of the SVG failed. <br> <br> If SVGInject is used with the `onload` attribute, `onerror="SVGinject.err(this)"` must be added to the `<img>` element to make sure `onFail` is called. |


## How does SVGInject prevent "unstyled image flash"

Before an SVG is injected the original unstyled SVG may be displayed for a brief moment by the browser. If a style is already applied to the SVG at runtime, the styled SVG will look different from the unstyled SVG, causing a brief “flashing” of the unstyled SVG before injection occurs. We call this effect unstyled image flash.

If SVGInject is used with the `onload` attribute, SVGInject has a built-in functionality to prevent unstyled image flash. A `<style>` element with one CSS rule is added to the document to hide all injectable `<img>` elements until injection is complete.

When [using Javascript directly](#how-to-use-svginject-directly-from-javascript) SVGInject has no build in functionality to prevent unstyled image flash. You can find a custom solution for this in the [example for using SVGInject without the `onload` attribute](#example-without-using-the-onload-attribute).


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
document.addEventListener('DOMContentLoaded', function() {
  // call SVGInject() from here
});
```

If you dynamically insert new `<img>` elements you need to call `SVGInject()` on these elements after their insertion.


## Fallback for old browsers

If the browser does not support SVG (IE8 and IE7), this simple fallback solution replaces the `src` attribute with an alternative image URL.

```html
<img src="image.svg" onload="SVGInject(this)" onerror="SVGInject.err(this, 'image.png')" />
```

More detailed information on implementing fallback solutions for old browsers can be found on our [Fallback solutions WIki page](../../wiki/Fallback-solutions).


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
  <img src="image1.svg" onload="SVGInject(this)" />
  <img src="image2.svg" onload="SVGInject(this)" />
</body>
</html>
```


### Example using `options`

This example shows how to use SVGInject with multiple options.

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <script>
    SVGInject.setOptions({
      useCache: false, // no caching
      copyAttributes: false, // do not copy attributes from `<img>` to `<svg>`
      makeIdsUnique: false, // do not make ids used within the SVG unique
      afterLoad: function(svg, svgString) {
        // add a class to the svg
        svg.classList.add('my-class');
      },
      beforeInject: function(img, svg) {
        // wrap SVG in a div element
        var div = document.createElement('div');
        div.appendChild(svg);
        return div;
      },
      afterInject: function(img, svg) {
        // set opacity
        svg.style.opacity = 1;
      },
      onFail: function(img) {
        // set the image background red
        img.style.background = 'red';
      }
    });
  </script>
</head>
<body>
  <img src="image.svg" onload="SVGInject(this)" onerror="SVGInject.err(this)" />
</body>
</html>
```


### Example without using the `onload` attribute

This example shows how to use SVGInject directly from Javascript without the `onload` attribute. After the DOM content has loaded, SVGInject is called on all elements with class `injectable`. It also implements a method to prevent [unstyled image flash](#how-does-svginject-prevent-unstyled-image-flash).


```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <!-- hide images until injection has completed or failed -->
  <style>
    /* hide all img elements until the svg is injected to prevent "unstyled image flash" */
    img.injectable {
      visibility: hidden;
    }
  </style>

  <script>
    SVGInject.setOptions({
      onFail: function(img, svg) {
        // if injection fails show the img element
        img.classList.remove('injectable');
      }
    });

    document.addEventListener('DOMContentLoaded', function() {
      // inject all img elements with class name `injectable`
      SVGInject(document.querySelectorAll('img.injectable'), {
        onAllFinish: function() {
          // the SVG injection has finished for all three images

        }
      });
    });
  </script>
</head>
<body>
  <img src="image_1.svg" class="injectable" />
  <img src="image_2.svg" class="injectable" />
  <img src="image_3.svg" class="injectable" />
</body>
</html>
```


## Browser support

Full support for all modern browsers, and IE9+ ([full list](https://caniuse.com/#feat=svg))

Support for legacy browsers with optional [PNG fallback method](https://github.com/iconfu/svg-inject/wiki/Fallback-solutions#fallback-for-no-svg-support-ie-78)


## License

[MIT License](https://github.com/iconfu/svg-inject/blob/master/LICENSE)
