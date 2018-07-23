/**
 * SVGInject
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 Iconfu <info@iconfu.com>
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload'];
  var A_ELEMENT = document.createElement('a');
  var DIV_ELEMENT = document.createElement('div');
  var SVG_NOT_SUPPORTED = typeof SVGRect == "undefined";
  var DEFAULT_OPTIONS = {
    cache: true,
    copyAttributes: true,
    afterLoad: NOOP,
    beforeInject: NOOP,
    afterInject: NOOP,
    onFail: NOOP
  };
  var INJECT = 1;
  var INJECTED = 2;
  var FAIL = 3;
  var STR_SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var STR_LOAD_FAIL = 'LOAD_FAIL';
  var STR_SVG_INVALID = 'SVG_INAVLID';
  var STR___SVGINJECT = '__svgInject';
  var nextFrame = window.requestAnimationFrame || function(callback) { callback(); };

  function NOOP() {}

  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }

  // load svg with an XHR requuest
  function load(path, callback, errorCallback) {
    if (path) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
          // readyState is done, request status ok
          callback(req.responseXML, req.responseText);
        }
      };
      req.onerror = errorCallback;
      req.open('GET', path, true);
      req.send();
    }
  }

  // copy attributes from img element to svg element
  function copyAttributes(img, svg, options) {
    if (options.copyAttributes) {
      var attributes = img.attributes;

      for (var i = 0; i < attributes.length; ++i) {
        var attribute = attributes[i];
        var attributeName = attribute.name;

        if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
          var attributeValue = attribute.value;

          if (attributeName == 'title') {
            // if a title attribute exists insert it as the title tag in SVG
            var title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            title.textContent = attributeValue;
            svg.insertBefore(title, svg.firstChild);
          } else {
            svg.setAttribute(attributeName, attributeValue);
          }
        }
      }
    }
  }

  // inject svg by replacing the img element with the svg element in the DOM
  function inject(img, svgXml, svgString, absUrl, options) {
    var svg = buildSvg(svgXml, svgString, absUrl, img, options);       

    if (svg) {
      var parentNode = img.parentNode;

      if (parentNode) {
        nextFrame(function() {
          var injectElem = options.beforeInject(svg, img);

          if (!injectElem) {
            copyAttributes(img, svg, options);
            injectElem = svg;
          }
          
          parentNode.replaceChild(injectElem, img);
          img[STR___SVGINJECT] = INJECTED;
          removeOnLoadAttribute(img);
          options.afterInject(injectElem, img);
        });
      }
    } else {
      svgInvalid(img, options);
    }
  }

  function extendOptions() {
    var newOptions = {};
    var args = arguments;

    for (var i = 0; i < args.length; ++i) {
      var argument = args[i];
      if (argument) {
        for (var key in argument) {
          newOptions[key] = argument[key];
        }
      }
    }
    return newOptions;
  }

  function addStyleToHead(css) {
    var head = document.getElementsByTagName('head')[0];

    if (head) {
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
      head.appendChild(style);
    }
  }

  function buildSvg(svgXml, svgStr, absUrl, img, options) {
    var svg;
    if (svgXml instanceof Document) {
      svg = svgXml.documentElement;
    } else {
      // svgXml is either not set or not of type Document which is a special case for IE 9
      // In both cases the SVG string is used to build the SVG element 
      try {
        DIV_ELEMENT.innerHTML = svgStr;
      } catch (e) {
        return null;
      }
      svg = DIV_ELEMENT.removeChild(DIV_ELEMENT.firstChild);
    }

    if (!(svg instanceof SVGElement)) {
      return null;
    }

    svg.insertBefore(document.createComment('SVG injected from "' + absUrl + '"'), svg.firstChild);
    return svg;
  }

  function removeOnLoadAttribute(img) {
    nextFrame(function() {
      img.removeAttribute('onload');
    });
  }

  function fail(img, status, options) {
    img[STR___SVGINJECT] = FAIL;
    options.onFail(img, status);
  }

  function svgInvalid(img, options) {
    removeOnLoadAttribute(img);
    fail(img, STR_SVG_INVALID, options);
  }

  function svgNotSupported(img, options) {
    removeOnLoadAttribute(img);
    fail(img, STR_SVG_NOT_SUPPORTED, options);
  }

  function loadFail(img, options) {
    fail(img, STR_LOAD_FAIL, options);
  }

  function loadFailOrSvgNotSupported(img, options) {
    if (SVG_NOT_SUPPORTED) {
      svgNotSupported(img, options);
    } else {
      removeOnLoadAttribute(img);
      loadFail(img, options);
    }
  }

  function removeEventListeners(img) {
    img.onload = null;
    img.onerror = null;
  }

  function throwImgNotSet() {
    throw new Error('img not set');
  }

  function createSVGInject(globalName, options) {
    var defaultOptions = extendOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    addStyleToHead('img[onload*="' + globalName + '"]{visibility:hidden;}');

    /**
     * SVGInject
     *
     * Injects the SVG specified in he `src` attribute of the specified `img` element or array of `img` elements.
     *
     * Options:
     * cache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value is `true.
     * beforeInject: Hook before SVG is injected. The `svg` and `img` elements are passed as parameters. If any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `svg` and `img` elements are passed as parameters.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter. The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG), `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
     *
     * @param {HTMLImageElement} img - an img element or an array of img elements
     * @param {Object} [options] - optional parameter with [options](#options) for this injection.
     */
    function SVGInject(img, options) {
      if (img) {
        var length = img.length;
        var src = img.src;

        if (src && !img[STR___SVGINJECT]) {
          img[STR___SVGINJECT] = INJECT;

          options = extendOptions(defaultOptions, options);

          if (SVG_NOT_SUPPORTED) {
            svgNotSupported(img, options);
            return;
          }

          var absUrl = getAbsoluteUrl(src);
          var cache = options.cache;

          var onError = function() {
            removeEventListeners(img);
            loadFailOrSvgNotSupported(img, options);
          };

          var setSvgLoadCacheValue = function(val) {
            if (cache) {
              var svgLoad = svgLoadCache[absUrl];
              for (var i = 0; i < svgLoad.length; ++i) {
                svgLoad[i](val);
              }
              svgLoadCache[absUrl] = val;
            }
          };

          var afterImageComplete = function() {
            removeEventListeners(img);

            load(absUrl, function(svgXml, svgString) {
              if (img[STR___SVGINJECT] == INJECT) {
                var newString = options.afterLoad(svgString);
                svgString = newString || svgString;
                
                inject(img, newString ? null : svgXml, svgString, absUrl, options);
              }
              setSvgLoadCacheValue(svgString);
            }, function() {
              loadFail(img, options);
              setSvgLoadCacheValue(null);
            });
          };

          if (cache) {
            var svgLoad = svgLoadCache[absUrl];

            if (typeof svgLoad != 'undefined') {
              if (Array.isArray(svgLoad)) {
                svgLoad.push(function(svgString) {
                  if (svgString === null) {
                    loadFail(img, options);
                  } else {
                    inject(img, null, svgString, absUrl, options);
                  }
                });
              } else if (svgLoad === null) {
                loadFail(img, options);
              } else {
                inject(img, null, svgLoad, absUrl, options);
              }
              return;
            } else {
              svgLoadCache[absUrl] = [];
            }
          }

          if (img.complete) {
            afterImageComplete();
          } else {
            img.onload = afterImageComplete;
            img.onerror = onError;
          }
        } else if (length) {
          for (var i = 0; i < length; ++i) {
            SVGInject(img[i], options);
          }
        }
      } else {
        throwImgNotSet();
      }
    }

    /**
     * Sets the default [options](#options) for SVGInject.
     *
     * @param {Object} [options] - default [options](#options) for an injection.
     */
    SVGInject.setOptions = function(options) {
      defaultOptions = extendOptions(defaultOptions, options);
    };

    // Create a new instance of SVGInject
    SVGInject.create = createSVGInject;

    /**
     * Used in `onerror Event of an `<img>` element to handle cases when the loading the original src fails (for example if file is not found or if the browser does not support SVG). This triggers a call to the options onFail hook if available. The optional second parameter will be set as the new src attribute for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[STR___SVGINJECT] != FAIL) {
          removeEventListeners(img);
          loadFailOrSvgNotSupported(img, defaultOptions);
          if (fallbackSrc) {
            img.src = fallbackSrc;
          }
        }
      } else {
        throwImgNotSet();
      }
    };

    window[globalName] = SVGInject;

    return SVGInject;
  }

  var SVGInjectInstance = createSVGInject('SVGInject');

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = SVGInjectInstance;
  }
})(window, document);
