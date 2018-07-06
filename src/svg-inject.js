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
  
  var svgLoadCache = {};

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
        } else {
          errorCallback(req.statusText);
        }
      };

      req.open('GET', path, true);
      req.send();
    }
  };

  // inject loaded svg
  function inject(imgElement, svg, onLoaded, onInjected) {
    // onLoad handler may return false to skip any attribute manipulation
    if (onLoaded(svg) !== false) {
      var attributes = imgElement.attributes;

      for(var i = 0; i < attributes.length; ++i) {
        var attribute = attributes[i];
        var attributeName = attribute.name;

        if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
          var attributeValue = attribute.value;

          if (attributeName == 'title') {
            // if a title attribute exists inser it as the title tag in SVG
            var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = attributeValue;
            svg.insertBefore(title, svg.firstChild);
          } else {
            svg.setAttribute(attributeName, attributeValue);
          }
        }
      }
    }
    
    var parentNode = imgElement.parentNode;
    parentNode && parentNode.replaceChild(svg, imgElement);
    imgElement.__injected = true;
    onInjected(svg);
  };


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
   * @param {HTMLElement} imgElement - an img element
   * @param {Object} options.
   */
  function SVGInject(imgElement, options) {
    if (imgElement && !imgElement.__injected) {
      var length = imgElement.length;
      var src = imgElement.src;

      if (src) {
        // Options
        options = options || {};
        var cache = options.cache || false;
        var onLoadFail = options.onLoadFail || NOOP;
        var onLoaded = options.onLoaded || NOOP;
        var onInjected = options.onInjected || NOOP;

        if (cache) {
          var svgLoad = svgLoadCache[src];

          if (svgLoad) {
            if (Array.isArray(svgLoad)) {
              svgLoad.push(function(svg) {
                inject(imgElement, svg.cloneNode(true), onLoaded, onInjected);
              });
            } else {
              inject(imgElement, svgLoad.cloneNode(true), onLoaded, onInjected);
            }
            return;
          } else {
            svgLoadCache[src] = [];
          }
        }

        load(src, function(svg) {
          inject(imgElement, svg, onLoaded, onInjected);

          if (cache) {
            var svgLoad = svgLoadCache[src];
            for (var i = 0; i < svgLoad.length; ++i) {
              svgLoad[i](svg);
            }
            svgLoadCache[src] = svgLoad;
          };
        }, onLoadFail);
      } else if (length) {
        for (var i = 0; i < imgElement.length; ++i) {
          SVGInject(imgElement[i], options);
        }
      }    
    }    
  };

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = exports = SVGInject;
  } else if (typeof window == 'object') {
    window.SVGInject = SVGInject;
  }
})(window, document);