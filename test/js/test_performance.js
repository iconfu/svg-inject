domReady(function(event) {
  var renderContainerElem = document.getElementById('render-container');
  var resultsElem = document.getElementById('results');
  var build = document.getElementById('build');
  var disableCacheRadio = document.getElementById('cache-disable-svg-inject');
  var disableBrowserCacheRadio = document.getElementById('cache-disable-browser');
  var useOnloadAttributeCheckbox = document.getElementById('use-onload-attribute');

  var createRandomURILString = function(count) {
    var str = Math.random().toString(36).substring(2, 15);
    return str + (--count === 0 ? '' : createRandomURILString(count));
  };

  var buildHtml = function(htmlStr) {
    build.innerHTML = htmlStr;
    return build.firstElementChild;
  };

  var getImageStr = function(svgUrl, testNum, imageNum, disableBrowserCache, useOnload) {
    return '<img src="./imgs/' + svgUrl + (disableBrowserCache ? '?imageNum=' + createRandomURILString(4) : '') + '"' + (useOnload ? ' onload="SVGInject' + testNum + '(this)"' : '') + ' class="image-' + testNum + '" alt="image ' + testNum + ' ' + imageNum + '">';
  };

  var requestAnimationFrame = function(callback) {
    window.requestAnimationFrame ? window.requestAnimationFrame(callback) : window.setTimeout(callback, 0);
  };

  var runPerformanceTest = function(svgUrl, num, sampleSize, insertResultElem, disableCache, disableBrowserCache, useOnload, callback) {
    var imgsStr = '';
    for (var i = 0; i < sampleSize; ++i) {
      imgsStr += getImageStr(svgUrl, num, i, disableBrowserCache, useOnload);
    }

    renderContainerElem.innerHTML = imgsStr;

    var svgInject = SVGInject.create('SVGInject' + num);

    var afterAllInjected = function(callback) {
      requestAnimationFrame(function() {
        var time = new Date().getTime() - startTime;

        requestAnimationFrame(function() {
          callback(testElem, time);
        });
      });
    };

    if (useOnload) {
      var injectCount = 0;
      svgInject.setOptions({
        afterInject: function() {
          if (++injectCount == sampleSize) {
            afterAllInjected(callback);
          }
        }
      });
    }
    

    if (insertResultElem) {
      var testStr = '<div class="result" id="result-' + num + '">' +
                      getImageStr(svgUrl, num, 0, disableBrowserCache, useOnload) +
                      '<div class="stats"></div>'
                    '</div>';

      var testElem = buildHtml(testStr);

      resultsElem.appendChild(testElem);
    }

    var startTime = new Date().getTime();

    if (!useOnload) {
      svgInject(document.querySelectorAll('img.image-' + num), {
        onAllFinish: function() {
          window.requestAnimationFrame(function() {
            afterAllInjected(callback);
          });
        },
        useCache: !disableCache
      });
    }
  };

  var runPerformanceTests = function(svgUrls, count, sampleSize, repetitions, disableCache, disableBrowserCache, useOnload, callback) {
    if (svgUrls.length == count) {
      callback();
    } else {
      var svgUrl = svgUrls[count];
      var bestTime;
      var repetitionCount = repetitions;

      var runTest = function() {
        runPerformanceTest(svgUrl, count, sampleSize, repetitionCount == 1, disableCache, disableBrowserCache, useOnload, function(testElem, time) {
          bestTime = bestTime && bestTime < time ? bestTime : time;
          
          if (--repetitionCount == 0) {
            var statsStr = '<div class="stats">' + (bestTime / sampleSize) + 'ms</div>';
              
            testElem.getElementsByClassName('stats')[0].innerHTML = statsStr;

            runPerformanceTests(svgUrls, ++count, sampleSize, repetitions, disableCache, disableBrowserCache, useOnload, callback);
          } else {
            runTest();
          }
        });
      };

      runTest()      
    }
  };

  window.run = function() {
    document.body.className = 'running';

    resultsElem.innerHTML = '';

    var sampleSize = parseInt(document.getElementById('sample-size').value);
    var repetitions = parseInt(document.getElementById('repetitions').value);
    var disableCache = disableCacheRadio.checked;
    var disableBrowserCache = disableBrowserCacheRadio.checked;
    var useOnload = useOnloadAttributeCheckbox.checked;

    var svgUrls = [];
    for (var i = 1; i <= 10; ++i) {
      svgUrls.push('performance/' + i + '.svg');
    }

    runPerformanceTests(svgUrls, 0, sampleSize, repetitions, disableCache, disableBrowserCache, useOnload, function() {
      document.body.className = '';
    });
  };  
});
