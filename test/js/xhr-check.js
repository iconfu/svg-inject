/*
 * This script is used to provide feedback if the demo is not working correctly on the local file system due to the same origin policy.
 */

(function() {
  var msg = null;

  var msgTemplate = '<div style="border: 1px solid #ff6666; background: #ffcccc; padding: 30px;">' +
                      '<h1>SVGInject not working correctly</h1>' +
                      '<h2>Don\'t worry: It\'s most likely because you are running this on your local file system.</h2>' +
                      '<p>SVGInject works very well in any browser when run with a web server.</p>' +
                      '<p>Due to the same origin policy for some browsers (Chrome, Safari), SVGs can not be loaded when run on the file system.</p>' +
                      '<h2>How to get this to work:</h2>' +
                      '<ul style="font-size: larger;">' +
                        '<li>Run this with a Web Server</li>' +
                        '<li>Use a Firefox browser</li>' +
                      '</ul>' +
                      '<p>There are also other possible solutions (--allow-file-access-from-files flag in Chrome) you might want to look for to run this example on the file system.</p>' +
                    '</div>';

  function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString;
    return div.firstChild; 
  }

  function showMessage() {
    msg = createElementFromHTML(msgTemplate);
    document.body.insertBefore(msg, document.body.firstChild);
  }

  var req = new XMLHttpRequest();
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      // readyState is DONE
      var status = req.status;
      if (status == 200) {
        // request status is OK
      } else {
        showMessage()
      }
    }
  };
  var script = document.querySelectorAll("script[src$='xhr-check.js']")[0];

  req.open('GET', script.getAttribute('src'), true);
  req.send();
})();