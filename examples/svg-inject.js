/**
 * SVGInject - Version 1.0.5
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 INCORS, the creators of iconfu.com
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  // constants for better minification
  var NULL = null;
  var TRUE = true;
  var LENGTH = 'length';
  var CREATE_ELEMENT = 'createElement';
  var TITLE = 'title';
  var __SVGINJECT = '__svgInject';

  // constants
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var SVG_INVALID = 'SVG_INVALID';
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload', 'onerror'];
  var A_ELEMENT = document[CREATE_ELEMENT]('a');
  var DIV_ELEMENT = document[CREATE_ELEMENT]('div');
  var IS_SVG_SUPPORTED = typeof SVGRect != "undefined";
  var DEFAULT_OPTIONS = {
    cache: TRUE,
    copyAttributes: TRUE,
    makeIdsUnique: TRUE
  };
  var TAG_NAME_PROPERTIES_MAP = {
    clipPath: ['clip-path'],
    'color-profile': NULL,
    cursor: NULL,
    filter: NULL,
    linearGradient: ['fill', 'stroke'],
    marker: ['marker', 'marker-end', 'marker-mid', 'marker-start'],
    mask: NULL,
    pattern: ['fill', 'stroke'],
    radialGradient: ['fill', 'stroke']
  };
  var INJECT = 1;
  var INJECTED = 2;
  var FAIL = 3;

  var uniqueIdCounter = 1;
  var xmlSerializer;

  // Returns the xmlSerializer instance. Creates it first if it does not exist yet.
  function getXMLSerializer() {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer;
  }

  // Returns the absolute url for the specified url
  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }

  // Load svg with an XHR request
  function loadSvg(url, callback, errorCallback) {
    if (url) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          // readyState is DONE
          var status = req.status;
          if (status == 200) {
            // request status is OK
            callback(req.responseXML, req.responseText.trim());
          } else if (status >= 400) {
            // request status is error (4xx or 5xx)
            errorCallback();
          } else if (status == 0) {
            // request status 0 can indicate a failed cross-domain call
            errorCallback();
          }
        }
      };
      req.open('GET', url, TRUE);
      req.send();
    }
  }

  // Copy attributes from img element to svg element
  function copyAttributes(img, svg) {
    var attributes = img.attributes;
    for (var i = 0; i < attributes[LENGTH]; ++i) {
      var attribute = attributes[i];
      var attributeName = attribute.name;
      // Only copy attributes not explicitly excluded from copying
      if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
        var attributeValue = attribute.value;
        // If img attribute is "title", insert a title element in SVG
        if (attributeName == TITLE) {
          // Create title element
          var titleElement = document.createElementNS('http://www.w3.org/2000/svg', TITLE);
          titleElement.textContent = attributeValue;
          // If the SVGs first child is a title element, replace it with the new title element,
          // otherwise insert the new title element as first child
          var firstElementChild = svg.firstElementChild;
          if (firstElementChild && firstElementChild.tagName.toLowerCase() == TITLE) {
            svg.replaceChild(titleElement, firstElementChild);
          } else {
            svg.insertBefore(titleElement, firstElementChild);
          }
        } else {
          // Set img attribute to svg
          svg.setAttribute(attributeName, attributeValue);
        }
      }
    }
  }

  // This function appends a unique suffix to ids of elements in the <defs> element that can be referenced by
  // properties from within the SVG (for example "filter", "mask", etc.). References to the ids are adjusted
  // accordingly. The suffix has the form "--inject-X", where X is a running number which increases with each
  // injection. The suffix is appended to avoid ID collision between two injected SVGs. Since all ids within
  // one SVG must be unique, the same suffix can be used for all ids of one injected SVG.
  function makeIdsUnique(svg) {
    var i, j;
    var idSuffix = '--inject-' + uniqueIdCounter++;
    // Collect ids from all elements below the <defs> element(s).
    var defElements = svg.querySelectorAll('defs [id]');
    var defElement, tag, id;
    var propertyIdsMap = {};
    var mappedProperties, mappedProperty;
    for (i = 0; i < defElements[LENGTH]; i++) {
      defElement = defElements[i];
      tag = defElement.tagName;
      // Get array with possible property names for the element's tag name. If the array is empty,
      // the only property name is the same as the tag name.
      if (tag in TAG_NAME_PROPERTIES_MAP) {
        id = defElement.id;
        // Add suffix to id and set it as new id for the element
        defElement.id += idSuffix;
        // Add id for each mapped property
        mappedProperties = TAG_NAME_PROPERTIES_MAP[tag] || [tag];
        for (j = 0; j < mappedProperties[LENGTH]; j++) {
          mappedProperty = mappedProperties[j];
          (propertyIdsMap[mappedProperty] || (propertyIdsMap[mappedProperty] = [])).push(id);
        }
      }
    }
    // Get all property names for which ids were found
    var properties = Object.keys(propertyIdsMap);
    if (properties[LENGTH]) {
      // Run through all elements and replace ids in references
      var allElements = svg.querySelectorAll('*');
      var element, property, propertyVal;
      for (i = 0; i < allElements[LENGTH]; i++) {
        element = allElements[i];
        if (element.hasAttributes()) {
          // Run through all property names for which ids were found
          for (j = 0; j < properties[LENGTH]; j++) {
            property = properties[j];
            propertyVal = element.getAttribute(property);
            if (propertyVal) {
              // Extract id from property value if it has the form url(#anyId) or
              // url("#anyId") (for Internet Explorer)
              var idMatch = propertyVal.match(/url\("?#([a-zA-Z][\w:.-]*)"?\)/);
              if (idMatch && propertyIdsMap[property].indexOf(idMatch[1]) >= 0) {
                // Replace reference with new id if id was found for the property
                element.setAttribute(property, 'url(#' + idMatch[1] + idSuffix + ')');
              }
            }
          }
        }
      }
    }
  }

  // inject svg by replacing the img element with the svg element in the DOM
  function inject(imgElem, svgElem, absUrl, options) {
    if (svgElem) {
      svgElem.setAttribute('data-inject-url', absUrl);
      var parentNode = imgElem.parentNode;
      if (parentNode) {
        if (options.copyAttributes) {
          copyAttributes(imgElem, svgElem);
        }
        if (options.makeIdsUnique) {
          makeIdsUnique(svgElem, options);
        }
        // Invoke beforeInject hook if set
        var beforeInject = options.beforeInject;
        var injectElem = (beforeInject && beforeInject(imgElem, svgElem)) || svgElem;
        // Replace img element with new element. This is the actual injection.
        parentNode.replaceChild(injectElem, imgElem);
        // Mark img element as injected
        imgElem[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(imgElem);
        // Invoke afterInject hook if set
        if (options.afterInject) {
          options.afterInject(imgElem, injectElem);
        }
      }
    } else {
      svgInvalid(imgElem, options);
    }
  }

  // Merges any number of options objects into a new object
  function mergeOptions() {
    var mergedOptions = {};
    var args = arguments;
    // Iterate over all specified options objects and add all properties to the new options object
    for (var i = 0; i < args[LENGTH]; ++i) {
      var argument = args[i];
      if (argument) {
        for (var key in argument) {
          if (argument.hasOwnProperty(key)) {
            mergedOptions[key] = argument[key];
          }
        }
      }
    }
    return mergedOptions;
  }

  // Adds the specified CSS to the document's <head> element
  function addStyleToHead(css) {
    var head = document.getElementsByTagName('head')[0];
    if (head) {
      var style = document[CREATE_ELEMENT]('style');
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }

  // Builds an SVG element from the specified SVG string
  function buildSvgElement(svgStr) {
    // Set the svg string as the innerHTML for the div element. This creates the SVG DOM, which we
    // can then remove from the div element and return.
    try {
      DIV_ELEMENT.innerHTML = svgStr;
    } catch (e) {
      return NULL;
    }
    // Set svg as first child that is an element (comment and text nodes are skipped)
    var svgElem = DIV_ELEMENT.firstElementChild;
    // Remove all children from div element. This includes the svg element and all unused elements,
    // for example comments before or after the svg element.
    while (DIV_ELEMENT.firstChild) {
      DIV_ELEMENT.removeChild(DIV_ELEMENT.firstChild);
    }
    if (svgElem instanceof SVGElement) {
      return svgElem;
    }
  }

  function removeOnLoadAttribute(img) {
    img.removeAttribute('onload');
  }

  function fail(img, status, options) {
    img[__SVGINJECT] = FAIL;
    if (options.onFail) {
      options.onFail(img, status);
    }
  }

  function svgInvalid(img, options) {
    removeOnLoadAttribute(img);
    fail(img, SVG_INVALID, options);
  }

  function svgNotSupported(img, options) {
    removeOnLoadAttribute(img);
    fail(img, SVG_NOT_SUPPORTED, options);
  }

  function loadFail(img, options) {
    fail(img, LOAD_FAIL, options);
  }

  function removeEventListeners(img) {
    img.onload = NULL;
    img.onerror = NULL;
  }

  function throwImgNotSet() {
    throw new Error('img not set');
  }

  function createSVGInject(globalName, options) {
    var defaultOptions = mergeOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    if (IS_SVG_SUPPORTED) {
      // If the browser supports SVG, add a small stylesheet that hides the <img> elements until
      // injection is finished. This avoids showing the unstyled SVGs before style is applied.
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
    }

    /**
     * SVGInject
     *
     * Injects the SVG specified in the `src` attribute of the specified `img` element or array of `img`
     * elements.
     *
     * Options:
     * cache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value
     *     is `true.
     * makeIdsUnique: If set to `true` the id of elements in the `<defs>` element that can be references by
     *     property values (for example 'clipPath') are made unique by appending "--inject-X", where X is a
     *     running number which increases with each injection. This is done to avoid duplicate ids in the DOM.
     * beforeLoad: Hook before SVG is loaded. The `img` element is passed as a parameter. If the hook returns 
     *     an URL String the SVG is loaded from this URL instead of the `src` attribute of the `img` element.
     * afterLoad: Hook after SVG is loaded. The loaded svg element is passed as a parameter. If caching is
     *     active this hook will only get called once for injected SVGs with the same absolute path. Changes
     *     to the svg element in this hook will be applied to all injected SVGs with the same absolute path.
     * beforeInject: Hook before SVG is injected. The `img` and `svg` elements are passed as parameters. If
     *     any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `img` and `svg` elements are passed as parameters.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter.
     *     The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG),
     *     `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
     *
     * @param {HTMLImageElement} img - an img element or an array of img elements
     * @param {Object} [options] - optional parameter with [options](#options) for this injection.
     */
    function SVGInject(img, options) {
      options = mergeOptions(defaultOptions, options);

      if (img && typeof img[LENGTH] != 'undefined') {
        for (var i = 0; i < img[LENGTH]; ++i) {
          SVGInjectWrapped(img[i], options);
        }
      } else {
        SVGInjectWrapped(img, options);
      }
    }

    // Wrapped SVGInject wher options are already merged with default options
    function SVGInjectWrapped(img, options) {
      if (img) {
        if (!img[__SVGINJECT]) {
          img[__SVGINJECT] = INJECT;

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(img, options);
            return;
          }

          // Invoke beforeLoad hook if set. If the beforeLoad returns a value use it as the src for the load
          // URL path. Else use the img src attribute value.
          var src = (options.beforeLoad && options.beforeLoad(img)) || img.src;
          var absUrl = getAbsoluteUrl(src);
          var cache = options.cache;

          var setSvgLoadCacheValue = function(val) {
            if (cache) {
              var svgLoad = svgLoadCache[absUrl];
              for (var i = 0; i < svgLoad[LENGTH]; ++i) {
                svgLoad[i](val);
              }
              svgLoadCache[absUrl] = val;
            }
          };

          removeEventListeners(img);

          if (cache) {
            var svgLoad = svgLoadCache[absUrl];

            var handleLoadValue = function(loadValue) {
              if (loadValue === LOAD_FAIL) {
                loadFail(img, options);
              } else if (loadValue === SVG_INVALID) {
                svgInvalid(img, options);
              } else {
                inject(img, buildSvgElement(loadValue), absUrl, options);
              }
            };

            if (svgLoad !== undefined) {
              if (Array.isArray(svgLoad)) {
                svgLoad.push(handleLoadValue);
              } else {
                handleLoadValue(svgLoad);
              }
              return;
            } else {
              svgLoadCache[absUrl] = [];
            }
          }

          // Load the SVG because it is not cached or caching is disabled
          loadSvg(absUrl, function(svgXml, svgString) {
            if (img[__SVGINJECT] == INJECT) {
              // Use the XML from the XHR request if it is an instance of Document. Otherwise
              // (for example of IE9), create the svg document from the svg string.
              var svgElem = svgXml instanceof Document ? svgXml.documentElement : buildSvgElement(svgString);

              if (svgElem) {
                var afterLoad = options.afterLoad;
                if (afterLoad) {
                  // Invoke afterLoad hook which may modify the SVG element.
                  afterLoad(svgElem);

                  if (cache) {
                    // Update svgString because the SVG element can be modified in the afterLoad hook, so 
                    // the modified SVG element is also used for all later cached injections  
                    svgString = getXMLSerializer().serializeToString(svgElem);
                  }
                }

                inject(img, svgElem, absUrl, options);
                setSvgLoadCacheValue(svgString);
              } else {
                svgInvalid(img, options);
                setSvgLoadCacheValue(SVG_INVALID);
              }
            }
          }, function() {
            loadFail(img, options);
            setSvgLoadCacheValue(LOAD_FAIL);
          });
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
      defaultOptions = mergeOptions(defaultOptions, options);
    };

    // Create a new instance of SVGInject
    SVGInject.create = createSVGInject;

    /**
     * Used in onerror Event of an `<img>` element to handle cases when the loading the original src fails
     * (for example if file is not found or if the browser does not support SVG). This triggers a call to the
     * options onFail hook if available. The optional second parameter will be set as the new src attribute
     * for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[__SVGINJECT] != FAIL) {
          removeEventListeners(img);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(img, defaultOptions);
          } else {
            removeOnLoadAttribute(img);
            loadFail(img, defaultOptions);
          }
          if (fallbackSrc) {
            removeOnLoadAttribute(img);
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
