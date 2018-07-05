'use strict';

(function(window, document) {
  var NOOP = function() {};
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload'];
  
  var svgLoadCache = {};

  /**
   * Injects an Svg 
   * @param {number} imgElement
   * @param {string} locale
   * @return {string}
   */
  function load(path, callback, errorCallback) {
    if (path) {
      var req = new XMLHttpRequest();

      req.onreadystatechange = function() {
        if(req.readyState == 4 && req.status == 200) {
          var div = document.createElement('div');
          div.innerHTML = req.responseText;
          callback(div.childNodes[0]);
        } else {
          errorCallback(req.statusText);
        }
      };

      req.open('GET', path, true);
      req.send();
    }
  };

  function inject(imgElement, svg, onLoaded, onInserted) {
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
    onInserted(svg);
  };


  var SVGInject = function(imgElement, options) {
    if (imgElement) {
      var length = imgElement.length;
      var src = imgElement.src;

      if (src) {
        // Options
        options = options || {};
        var cache = options.cache || false;
        var onLoadFail = options.onLoadFail || NOOP;
        var onLoaded = options.onLoaded || NOOP;
        var onInserted = options.onInserted || NOOP;

        if (cache) {
          var svgLoad = svgLoadCache[src];

          if (svgLoad) {
            if (Array.isArray(svgLoad)) {
              svgLoad.push(function(svg) {
                inject(imgElement, svg.cloneNode(true), onLoaded, onInserted);
              });
            } else {
              inject(imgElement, svgLoad.cloneNode(true), onLoaded, onInserted);
            }
            return;
          } else {
            svgLoadCache[src] = [];
          }
        }

        load(src, function(svg) {
          inject(imgElement, svg, onLoaded, onInserted);

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