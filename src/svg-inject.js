/**
 * SVGInject - Simple 
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 Iconfu <info@iconfu.com>
 * @license MIT
 */

(function(window, document) {

  'use strict';

  var NOOP = function() {};
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload'];

  var DEFAULT_OPTIONS = {
    cache: true,
    onLoaded: NOOP,
    onLoadFail: NOOP,
    onInjected: NOOP
  };

  var a = document.createElement('a');
  function getAbsoluteUrl(url) {
    return a.href = url;
  }

  // load svg
  function load(path, callback, errorCallback) {
    if (path) {
      var req = new XMLHttpRequest();

      req.onreadystatechange = function() {
        if(req.readyState == 4 && req.status == 200) {
          var div = document.createElement('div');
          div.innerHTML = req.responseText;
          var svg = div.childNodes[0];
          svg.insertBefore(document.createComment("SVG injected from '" + path + "'"), svg.firstChild);
          callback(svg);
        }
      };

      req.onerror = errorCallback;

      req.open('GET', path, true);
      req.send();
    }
  }

  // inject loaded svg
  function inject(img, svg, options) {
    svg = svg.cloneNode(true);
    // onLoad handler may return false to skip any attribute manipulation
    if (options.onLoaded(svg, img) !== false) {
      var attributes = img.attributes;

      for(var i = 0; i < attributes.length; ++i) {
        var attribute = attributes[i];
        var attributeName = attribute.name;

        if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
          var attributeValue = attribute.value;

          if (attributeName == 'title') {
            // if a title attribute exists insert it as the title tag in SVG
            var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = attributeValue;
            svg.insertBefore(title, svg.firstChild);
          } else {
            svg.setAttribute(attributeName, attributeValue);
          }
        }
      }
    }
    
    var parentNode = img.parentNode;
    parentNode && parentNode.replaceChild(svg, img);
    img.__injected = true;
    options.onInjected(svg, img);
  }

  function extendOptions() {
    var newOptions = {};
    for (var i = 0; i < arguments.length; ++i) {
      var argument = arguments[i];
      if (argument) {
        for (var key in argument) {
          newOptions[key] = argument[key];
        }
      }
    }
    return newOptions;
  }

  var newSVGInject = function(options) {
    var defaultOptions = extendOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    /**
     * SVGInject
     *
     * Replaces the element(s) provided with their full inline SVG DOM markup which path is 
     * given in the element(s) src attribute
     *
     * Options:
     * cache: boolean if SVG should be cached (defaults false)
     * onLoaded: callback after SVG is loaded
     * onLoadFail: callback after SVG load fails
     * onInjected: callback after SVG is injected
     * 
     * @param {HTMLElement} img - an img element
     * @param {Object} options.
     */
    function SVGInject(img, options) {
      if (img && !img.__injected) {
        var length = img.length;
        var src = img.src;
        
        if (src) {
          var absUrl = getAbsoluteUrl(img.src);
          // Options
          options = extendOptions(defaultOptions, options);
          var cache = options.cache;

          if (cache) {
            var svgLoad = svgLoadCache[src];

            if (svgLoad) {
              if (Array.isArray(svgLoad)) {
                svgLoad.push(function(svg) {
                  inject(img, svg, options);
                });
              } else {
                inject(img, svgLoad, options);
              }
              return;
            } else {
              svgLoadCache[absUrl] = [];
            }
          }

          var loadFail = function() {
            img.onerror = null;
            img.onload = null;
            options.onLoadFail(img);
          };

          var afterImageComplete = function() {
            img.onerror = null;
            img.onload = null;
            load(absUrl, function(svg) {
              inject(img, svg, options);

              if (cache) {
                var svgLoad = svgLoadCache[absUrl];
                for (var i = 0; i < svgLoad.length; ++i) {
                  svgLoad[i](svg);
                }
                svgLoadCache[absUrl] = svgLoad;
              }
            }, loadFail);
          };

          if (img.complete) {
            afterImageComplete();
          } else {
            img.onerror = loadFail;
            img.onload = afterImageComplete;
          }
        } else if (length) {
          for (var i = 0; i < img.length; ++i) {
            SVGInject(img[i], options);
          }
        }    
      }    
    }

    SVGInject.setOptions = function(options) {
      defaultOptions = extendOptions(defaultOptions, options);
    };

    // Create a new instance of SVGInject
    SVGInject.new = newSVGInject;

    return SVGInject;
  };

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = exports = newSVGInject();
  } else if (typeof window == 'object') {
    window.SVGInject = newSVGInject();
  }
})(window, document);