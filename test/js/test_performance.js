domReady(function(event) {
  var renderContainerElem = document.getElementById('render-container');
  var resultsElem = document.getElementById('results');
  var build = document.getElementById('build');
  var disableCacheCheckbox = document.getElementById('cache-disable-svg-inject');
  var disableBrowserCacheCheckbox = document.getElementById('cache-disable-browser');

  var createRandomURILString = function(count) {
    var str = Math.random().toString(36).substring(2, 15);
    return str + (--count === 0 ? '' : createRandomURILString(count));
  };

  var buildHtml = function(htmlStr) {
    build.innerHTML = htmlStr;
    return build.firstElementChild;
  };

  var getImageStr = function(svgUrl, testNum, imageNum, disableBrowserCache) {
    return '<img src="./imgs/' + svgUrl + (disableBrowserCache ? '?imageNum=' + createRandomURILString(4) : '') + '" class="image-' + testNum + '" alt="image ' + testNum + ' ' + imageNum + '">';
  };

  var runPerformanceTest = function(svgUrl, num, sampleSize, insertResultElem, disableCache, disableBrowserCache, callback) {
    var imgsStr = '';
    for (var i = 0; i < sampleSize; ++i) {
      imgsStr += getImageStr(svgUrl, num, i, disableBrowserCache);
    }

    renderContainerElem.innerHTML = imgsStr;

    if (insertResultElem) {
      var testStr = '<div class="result" id="result-' + num + '">' +
                      getImageStr(svgUrl, num, 0, disableBrowserCache) +
                      '<div class="stats"></div>'
                    '</div>';

      var testElem = buildHtml(testStr);

      resultsElem.appendChild(testElem);
    }

    var svgInject = SVGInject.create('SVGInject' + num);

    var start = new Date().getTime();

    svgInject(document.querySelectorAll('img.image-' + num), {
      onAllFinish: function() {
        var time = new Date().getTime() - start;

        renderContainerElem.innerHTML = '';
        callback(testElem, time);
      },
      useCache: !disableCache
    });
  };

  var runPerformanceTests = function(svgUrls, count, sampleSize, repetitions, disableCache, disableBrowserCache, callback) {
    if (svgUrls.length == count) {
      callback();
    } else {
      var svgUrl = svgUrls[count];
      var bestTime;
      var repetitionCount = repetitions;

      var runTest = function() {
        runPerformanceTest(svgUrl, count, sampleSize, repetitionCount == 1, disableCache, disableBrowserCache, function(testElem, time) {
          bestTime = bestTime && bestTime < time ? bestTime : time;
          
          if (--repetitionCount == 0) {
            var statsStr = '<div class="stats">' + bestTime / sampleSize + 'ms</div>';
              
            testElem.getElementsByClassName('stats')[0].innerHTML = statsStr;

            runPerformanceTests(svgUrls, ++count, sampleSize, repetitions, disableCache, disableBrowserCache, callback);
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
    var disableCache = disableCacheCheckbox.checked;
    var disableBrowserCache = disableBrowserCacheCheckbox.checked;

    var svgUrls = [];
    for (var i = 1; i <= 10; ++i) {
      svgUrls.push('performance/' + i + '.svg');
    }

    runPerformanceTests(svgUrls, 0, sampleSize, repetitions, disableCache, disableBrowserCache, function() {
      document.body.className = '';
    });
  };  
});
