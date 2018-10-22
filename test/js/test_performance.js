domReady(function(event) {
  var renderContainerElem = document.getElementById('render-container');
  var resultsElem = document.getElementById('results');

  var buildHtml = function(htmlStr) {
    var div = document.createElement('div');
    div.innerHTML = htmlStr;
    return div.firstElementChild;
  }

  var getImageStr = function(svgUrl, testNum, imageNum) {
    return '<img src="/imgs/' + svgUrl + '" class="image-' + testNum + '" alt="image ' + testNum + ' ' + imageNum + '">';
  };

  var runPerformanceTest = function(svgUrl, num, sampleSize, insertResultElem, callback) {
    var imgsStr = '';
    for (var i = 0; i < sampleSize; ++i) {
      imgsStr += getImageStr(svgUrl, num, i);
    }

    renderContainerElem.innerHTML = imgsStr;

    if (insertResultElem) {
      var testStr = '<div class="result" id="result-' + num + '">' +
                      getImageStr(svgUrl, num, 0) +
                      '<div class="stats"></div>'
                    '</div>';

      var testElem = buildHtml(testStr);

      resultsElem.appendChild(testElem);
    }

    var svgInject = SVGInject.create('SVGInject' + num);

    var start;

    svgInject(document.querySelectorAll('img.image-' + num), {
      afterLoad: function() {
        start = new Date().getTime();
      },
      onAllFinish: function() {
        var time = new Date().getTime() - start;

        renderContainerElem.innerHTML = '';
        callback(testElem, time);
      }
    });
  };

  var runPerformanceTests = function(svgUrls, count, sampleSize, repetitions, callback) {
    if (svgUrls.length == count) {
      callback();
    } else {
      var svgUrl = svgUrls[count];
      var bestTime;
      var repetitionCount = repetitions;

      var runTest = function() {
        runPerformanceTest(svgUrl, count, sampleSize, repetitionCount == 1, function(testElem, time) {
          bestTime = bestTime && bestTime < time ? bestTime : time;
          
          if (--repetitionCount == 0) {
            var statsStr = '<div class="stats">' + bestTime / (sampleSize) + 'ms</div>';
              
            testElem.getElementsByClassName('stats')[0].innerHTML = statsStr;

            runPerformanceTests(svgUrls, ++count, sampleSize, repetitions, callback);
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

    runPerformanceTests(['test1.svg', 'performance-1.svg'], 0, sampleSize, repetitions, function() {
      document.body.className = '';
    });
  };  
});
