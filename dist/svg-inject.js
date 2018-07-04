'use strict';

(function(window, document) {
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload'];

  /**
   * Injects an Svg 
   * @param {number} imgElement
   * @param {string} locale
   * @return {string}
   */
  var load = function(path, callback) {
    if (path) {
      var req = new XMLHttpRequest();

      req.onreadystatechange = function() {
        if(req.readyState == 4 && req.status == 200) {
          var div = document.createElement('div');
          div.innerHTML = req.responseText;
          callback(div.childNodes[0]);
        }
      };

      req.open('GET', path, true);
      req.send();
    }
  };

  var spritePathMap = {};

  var SVGInject = {

    /**
     * Injects an Svg 
     * @param {number} imgElement
     * @param {string} locale
     * @return {string}
     */
    img: function(imgElement) {
      load(imgElement.src, function(svg) {
        var attributes = imgElement.attributes;

        for(var i = 0; i < attributes.length; ++i) {
          var attribute = attributes[i];
          var attributeName = attribute.name;

          if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
            var attributeValue = attribute.value;

            if (attributeName == 'title') {
              var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
              title.textContent = attributeValue;
              svg.insertBefore(title, svg.firstChild);
            } else {
              svg.setAttribute(attributeName, attributeValue);
            }
          }
        }
        
        var parentNode = imgElement.parentNode;
        parentNode && parentNode.replaceChild(svg, imgElement);
      });
    },

    /**
     * Injects an Svg 
     * @param {number} imgElement
     * @param {string} locale
     * @return {string}
     */
    insertSprite: function(path) {
      if (!spritePathSet[path]) {
        spritePathSet[path]  = true;
        load(path, function(svgSprite) {
          spritePathMap[path] = svgSprite;
          document.body.appendChild(svgSprite);
        }); 
      }
    }
  };

  if (typeof module == 'object' && typeof module.exports == 'object') {
    module.exports = exports = SVGInject;
  } else if (typeof window == 'object') {
    window.SVGInject = SVGInject;
  }
})(window, document);