// ==UserScript==
// @name        thingiverse_test
// @namespace   thingiverse_test
// @description Try CORS from thingiverse
// @include     http://www.thingiverse.com/*
// @version     1
// @grant       none
// ==/UserScript==
function createCORSRequest(method, url)
{
  var ret;
  ret = new XMLHttpRequest();
  if ('withCredentials' in ret) // "withCredentials" only exists on XMLHTTPRequest2 objects
  ret.open(method, url, true);
   else if (typeof XDomainRequest != 'undefined')
  {
    // IE
    ret = new XDomainRequest();
    ret.open(method, url);
  } 
  else
  // Otherwise, CORS is not supported by the browser.
  ret = null;
  return (ret);
}
function capture()
{
  var title = $('.thing-header-data h1') [0].innerHTML;
  var files = $('#thing-files .thing-file a');
  var list = [
  ];
  for (var i = 0; i < files.length; i++)
  list.push(files[i].getAttribute('data-file-name'));
  console.log(title + ' ' + JSON.stringify(list, null, 4));
  var doc =
  {
    'title': title,
    'files': list
  };
  var xhr = createCORSRequest('POST', 'http://localhost:5984/pending_things');
  if (xhr)
  {
    xhr.onload = function ()
    {
      var responseText = xhr.responseText;
      console.log(responseText);
    };
    xhr.onerror = function ()
    {
      console.log('There was an error!');
    };
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.send(JSON.stringify(doc, null, 4));
  }
}
if (!$('.thingiverse_test') [0]) // only run once
{
  var trigger = 'http://www.thingiverse.com/thing:';
  if (document.URL.substring(0, trigger.length) == trigger)
  {
    console.log('initializing thingiverse_test')
    var ff = document.createElement('div');
    ff.setAttribute('style', 'position: relative;');
    $(ff).addClass('thingiverse_test');
    var template = '<button id=\'import_thing\' type=\'button class=\'btn btn-default\' style=\'position: absolute; top: 100px; left: 20px;\'>Import to things</button>';
    ff.innerHTML = template;
    $('body').append(ff);
    $('#import_thing').on('click', capture)
  }
}
