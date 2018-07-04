# SvgInject


## What does is do

The SVG Injector replaces an `<img>` element with an SVG element.


## Why should I use it?

In order to apply CSS styles to SVG images, the SVG has to be inline in the DOM. With the SVG injector you can keep your SVGs as individual files, but you can still style the with CSS.


## How does it work?

The SVG injector replaces an image element in the DOM with the SVG that is specified in its "src" attribute.

Your code looks like this:

```html
<html>
  ...
  <img src="myimage.svg" width="300" height="200" onload="inject" />
  ...
</html>
```

After injection, the DOM will look like this:

```html
<html>
  ...
  <svg width="300" height="200">
    ...
  </svg>
  ...
</html>
```

The SVG data is loaded with an XMLHttpRequest.


## What are the advantages?

Works on all browsers that support SVG. Yes, including Internet Explorer 9!
* Intuitive usage. Insert the SVG images into your HTML code just as PNG images, with only one additional instruction.
* Behaves like a normal <img> element if file not found or not available.
* Native fallback for no Javascript

Possible simple fallback solution for no SVG support

`<img src="image.svg" onerror="this.onload=null; this.onerror=null; this.src='image.png';">`


## What are the Limitations?

Attributes ismap, usemap, srcset, x and y of the <img> element will be ignored
No caching on older browsers and on [shift]-reload
Does not work locally on Chrome (due to same origin policy)
