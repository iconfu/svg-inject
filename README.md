# SVGInject

A tiny, intuitive, robust solution for injecting SVG files inline into the DOM


## What does it do?

SVGInject replaces an `<img>` element with an SVG element inline.


## Why should I use it?

In order to apply CSS styles to SVG images, the SVG has to be inline in the DOM. With the SVGInject you can keep your SVGs as individual files, but you can still style the SVG with CSS.


## Install

### Manually 

Include the SVGInject Javascript file in the head of your HTML document

```html
<head>
  ...
  <script src="svg-inject.min.js"></script>
  ...
</head>
```

download plain version: [svg-inject.js](https://raw.githubusercontent.com/iconfu/svg-inject/master/dist/svg-inject.js)

download minified version: [svg-inject.min.js](https://raw.githubusercontent.com/iconfu/svg-inject/master/dist/svg-inject.min.js)

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

**The SVG is injected and styleable now!!!** :sparkles::sparkles::sparkles:


## How does it work?

The SVG injector replaces an image element in the DOM with the SVG which is specified in its "src" attribute.

If your code looks like this:

```html
<html>
  ...
  <img src="image.svg" width="200" height="200" onload="SVGInject(this)" />
  ...
</html>
```

After injection, the DOM will look like this:

```html
<html>
  ...
  <svg width="200" height="200">
    ...
  </svg>
  ...
</html>
```

## What are the advantages?

* **Wide browser support**: Works on all browsers supporting SVG. Yes, this includes Internet Explorer 9 and higher! ([full list](https://caniuse.com/#feat=svg))

* **Native fallback without Javascript**: If Javascript is not available the SVG will still show. It's just not styleable with CSS. 

* **Native fallback if image source is not available**: Behaves like a normal `<img>` element if file not found or not available. If you specify an `alt` attribute the alternative text will show just like expected if the image can not be loaded.


## Why use the `onload` attribute?

* **Works with dynamic content**: If you add `<img>` elements dynamically injection still works.

* **Intuitive usage**: Insert the SVG images into your HTML code just as PNG images, with only one additional instruction. It's very clear what it does looking at the pure HTML.

Instead of using the onload attribute you can use SVGInject within your Javascript code like this: `SVGInject(document.getElementsByClassName('myClassName'))`.


## How are attributes handled?

All attributes are copied from the `<img>` element to the injected `<svg>` element with the following exceptions:

* `src`, `alt`, and `onload` attributes are not copied
* the `title` attribute is transformed to a `<title>` element in the injected SVG

You may implement a different attribute handling in `onLoaded` options hook.


## API

| Function | Description |
|----------|-------------|
| SVGInject(img, options) | Inject the SVG specified in the src attribute of the passed `img` element. |
| SVGInject.setOptions(options) | Sets the default options for SVGInject. |
| SVGInject.new(options) | Create a new instance of SVGInject to give you different inject functionality across your side. Example: if you define `window.SVGInjectNoCache = SVGInject.new({ cache: false });` you can easily use no caching injecting anywhere in your HTML `<img ... onload="SVGInjectNoCache(this)">`  |

### Options

| Property name | Type | Default | Description |
| ------------- | ---- | ------- | ----------- |
| cache | boolean | `true` | Caches the SVG based on the absolute URL. The cache only persists for the lifetime of the page. |
| onLoaded | function(svg, img) | `empty function` | Hook after SVG is loaded. The svg and img element are passed as arguments. This is useful to make custom changes to the svg element. If `false` the svg element will not get changed by IMGInject(). |
| onLoadFail | function(img) | `empty function` | Hook after SVG load fails. The img element is passed as an argument. |
| onInjected | function(svg, img) | `empty function` | Hook after SVG is injected. The svg and img element are passed as arguments. |

**Example using options:**

```javascript
// set options on SVGInject
SVGInject.setOptions({
  cache: false, // disable caching
  onLoaded: function(svg, img) {
    // by returning false the svg element will be injected unchanged. No attributes of the img tag will get copied to the svg element
    return false;
  },

  onInjected: function(svg, img) {
    // set a class to the svg element
    svg.classList.add('injected-svg');
  }

  onLoadFail: function(img) {
    // do some error handling
  }
});

```


## What are the limitations?

SVGInject is intended to work in production environments but it has a few limitations:

* The image src must apply to the [same-origin policy](https://en.wikipedia.org/wiki/Same-origin_policy), which basically means the image origin must be were the website is running. This may be bypassed using the [Cross-Origin Resource Sharing (CORS) mechanism](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).
* Due to the same-origin policy SVGInject does not work when run from the local file system in many browsers (Chrome, Safari), yet Firefox will work.


## Browser support

Full support for all browsers supporting SVGs, including IE >= 9 ([full list](https://caniuse.com/#feat=svg))


## Fallback for no SVG support (IE < 9)

SVG is widly supported by all major browsers for a very long time, still here is a simple fallback solution for no SVG support if you really need it:


```html
<img src="image.svg" onload="SVGInject(this)" onerror="this.onload=null;this.onerror=null;this.src='image.png';">
```

A more generic method with a call to a global functions which replaces the file ending from svg to png:

```html
<script>
  pngFallback = function(img) {
    img.onload = null;
    img.onerror = null;
    img.src = img.src.slice(0, -3) + 'png';
  };
</script>

...

<img src="image.svg" onload="SVGInject(this)" onerror="pngFallback(this)">
```

If you are doing injection without `onload` attribute

```javascript
IMGInject.setOptions({
  onLoadFail: function(img) {
    img.src = img.src.slice(0, -3) + 'png';
  }
});

```