var IfuSvgInjectExample = (function() {
  var regexs = {
    js: /\/\*\s*ifu-code-source-js\s*\*\/([\s\S]*)\/\*\s*ifu-code-source-js\s*\*\//m,
    css: /\/\*\s*ifu-code-source-css\s*\*\/([\s\S]*)\/\*\s*ifu-code-source-css\s*\*\//m,
    html: /<!--\s*ifu-code-source-html\s*-->([\s\S]*)<!--\s*ifu-code-source-html\s*-->/m
  }

  function formatCode(code) {
    // Remove empty lines at start and end
    code = code.replace(/^\s\n*|\s*$/g, '')
    // Get current indent. This finds the leading whitespace in the first line containing a
    // non-whitespace character
    var indent = (code.match(/^[^\S\n]*\S/m) || ' ')[0].slice(0, -1);
    // remove indent
    code = code.replace(new RegExp('^' + indent, 'gm'), '');
    // escape chars for display in html
    code = code.replace(/</g, '&lt;');
    code = code.replace(/>/g, '&gt;');
    code = code.replace(/\n/g, '<br>');
    return code;
  }

  function toggleCode(element) {
    // find ancestor example element
    var $code = $(element).closest('.ifu--svg-inject-example').find('.ifu-example-code');
    // toggle class to show/hide code
    $code.toggleClass('ifu-code-expanded');
  }

  function showCodeType(button, type) {
    var $code = $(button).closest('.ifu--svg-inject-example').find('.ifu-example-main');
    $code.removeClass('ifu-show-html ifu-show-css ifu-show-js');
    $code.addClass('ifu-show-' + type);
  }

  function setCode($exampleElement, examplePath) {
    var codeTypes = ['html', 'css', 'js'];

    var createOnClick = function(codeType) {
      var $codeButton = $exampleElement.find('.ifu-button-' + codeType);
      $codeButton.click(function() {
        showCodeType($codeButton, codeType);
      });
    };

    $.get(examplePath, function(data) {
      var sourceStr = data.replace(/\r/gm, '');

      for (var j = 0; j < codeTypes.length; j++) {
        var codeType = codeTypes[j];

        // match code inside comments
        var regex = regexs[codeType];
        var match = regex.exec(sourceStr);

        if (match !== null) {
          // Get source code, remove empty lines at start and end, and format
          var sourceCode =  formatCode(match[1]);

          sourceCode = sourceCode.replace(/\/assets\/.*\/(.*)-.*.svg/g, '$1.svg');
          var $code = $exampleElement.find('.ifu-example-main');
          $code.addClass('ifu-has-' + codeType);
          var $codeContent = $code.find('.ifu-code-content');
          var $codeType = $('<div class="ifu-code ifu-code-' + codeType + '">' + sourceCode + '</div>');

          $codeContent.append($codeType);
          // Code highlighting using highlight.js
          hljs.highlightBlock($codeType[0]);
          // Create click event for button
          createOnClick(codeType);
        }
      }
    }, 'text');
  }

  return {
    setCode: setCode,
    showCodeType: showCodeType,
    toggleCode: toggleCode
  };
})();