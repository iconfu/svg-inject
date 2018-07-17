# SVGInject
 

A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.

Developed and maintained by [INCORS](https://www.incors.com), the creators of [Iconfu](https://www.iconfu.com).


## What does it do?

SVGInject replaces an `<img>` element with an inline SVG. The SVG is loaded from the `src` attribute location of the `<img>` element.

Before injection:

```html
<img src="image.svg" onload="SVGInject(this)" />

```

After injection (SVG loaded from image.svg):

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

**Example:**

```html
<img src="image.svg" onload="SVGInject(this)" />
```

**The SVG is injected and styleable now!!!**

:sparkles: :sparkles: :sparkles:


<hr>

<hr>


## What are the advantages?

* **Wide browser support**: Works on all browsers supporting SVG. Yes, this includes Internet Explorer 9 and higher! ([full list](https://caniuse.com/#feat=svg))

* **Native fallback without Javascript**: If Javascript is not available the SVG will still show. It's just not styleable with CSS. 

* **Native fallback if image source is not available**: Behaves like a normal `<img>` element if file not found or not available.

* **No image flickering**: SVGInject effectively prevents the unstyled image to show, causing a flicker (Also called Image Flash) by setting it's visible to hidden until the SVG is injected.


## What are the limitations?

SVGInject is intended to work in production environments but it has a few limitations:

* The image src must conform to the [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), which basically means the image origin must be were the website is running. This may be bypassed using the [Cross-Origin Resource Sharing (CORS) mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
* Due to the same-origin policy SVGInject does not work when run from the local file system in many browsers (Chrome, Safari), yet in Firefox it works.


## Why use the `onload` attribute?

* **Works with dynamic content and JS frameworks**: If `<img>` elements are added dynamically injection still works. It should also works in JS frameworks like Angular, ReactJS or Vue.js, also some limitation may apply.

* **Intuitive usage**: Insert the SVG images into your HTML code just as PNG images, with only one additional instruction. It's very clear to understand what it does looking at the pure HTML.

* **Standard-conform**: The `onload` event handler on `<img>` elements has long been supported by all browsers and is officially part of the W3C specification since [HTML5.0](https://www.w3.org/TR/html50/webappapis.html#event-handler-attributes).

If you do not want to use the `onload attribute but prefer to inject SVGs directly from Javascript, you can do this, too. You can find more information [here](#how-to-use-svginject-directly-from-javascript).


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
| onInjectFail | function(img) | `empty function` | Hook after SVG load fails. The `img` element is passed as an parameter. |


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

If you dynamically insert `<img>` elements you need to make sure `SVGInject()` is called after that. 


## How does SVGInject prevent "unstyled image flash"

SVGInject is designed to work out of the box and without any "Image Flash"


## Fallback for no SVG support (IE <= 8)

Here is a simple fallback solution for no SVG support if you really need it:

```javascript
SVGInject.setOptions({
  onInjectFail: function(img) {
    img.src = img.src.slice(0, -4) + ".png";
  }
});

```

If you are using the `onload` method you also need to add `onerror="SVGInject.err(this)"` for this to work because the onInjectFail callback will only get triggered this way


## What about some examples?

Here are some examples which should cover most use case.

### Basic Example

This is a standard way working on all modern browsers (incl. IE9+)

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="test_image.svg" onload="SVGInject(this)" />
</body>
</html>
```

### Example with fallbacks

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>
</head>
<body>
  <img src="test_image.svg" onload="SVGInject(this)" onerror="SVGInject(this, 'test_image.png')" />
</body>
</html>
```

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <!-- optional PNG fallback if SVG is not supported (IE <= 8) -->
  <script>SVGInject.setOptions({ onInjectFail: function(img) { img.src = img.src.slice(0, -4) + ".png"; } });</script>
</head>
<body>
  <!-- the extra onerror="SVGInject(this)" is needed to trigger the onInjectFail callback and  -->
  <img src="test_image.svg" onload="SVGInject(this)" onerror="SVGInject(this)" />
</body>
</html>
```

### Example using all options

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
  <img src="test_image.svg" onload="SVGInject(this)" onerror="SVGInject(this)" />
</body>
</html>
```

### Example without using the `onload` function

```html
<html>
<head>
  <script src="svg-inject.min.js"></script>

  <script>
    document.addEventListener("DOMContentLoaded", function() {
      SVGInject(document.getElementsByClassName('img-inject'));
    });
  </script>
</head>
<body>
  <img src="test_image_1.svg" class="img-inject" />
  <img src="test_image_2.svg" class="img-inject" />
</body>
</html>
```


## Browser support

Full support for all modern browsers, and IE9+ ([full list](https://caniuse.com/#feat=svg))

Support for IE8 with optional PNG Fallback method


## License

[MIT License](https://github.com/iconfu/svg-inject/blob/master/LICENSE)