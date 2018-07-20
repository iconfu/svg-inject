/*
 * This script is used to provide feedback if the demo is not working correctly on the local file system due to the same origin policy.
 */

(function() {
  var msg = null;

  var msgTemplate = '<div style="border: 1px solid #ff6666; background: #ffcccc; padding: 30px;">' +
                      '<h1>Demo not working correctly</h1>' +
                      '<h2>Don\'t worry: It\'s most likely because you are running this example on your local file system.</h2>' +
                      '<p>SVGInject works very well in any browser when run with a web server.</p>' +
                      '<p>Due to the same origin policy for some browsers (Chrome, Safari), SVGs can not be loaded when run on the file system.</p>' +
                      '<p>This is why the images in this example are not styled with different colors.</p>' +
                      '<h2>How to get this demo to work</h2>' +
                      '<ul style="font-size: larger;">' +
                        '<li>Run the demo with a Web Server</li>' +
                        '<li>Run the demo with the Firefox browser</li>' +
                      '</ul>' +
                      '<p>There are also other possible solutions (--allow-file-access-from-files flag in Chrome) you might want to look for to run this example on the file system.</p>' +
                    '</div>';

  function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString;
    return div.firstChild; 
  }

  function showMessage(img, status) {
    if (status == 'LOAD_FAIL' && !msg) {
      msg = createElementFromHTML(msgTemplate);
      document.body.insertBefore(msg, document.body.firstChild);
    }
  }

  SVGInject.setOptions({
    onFail: showMessage
  });
})();