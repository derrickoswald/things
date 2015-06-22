// ==UserScript==
// @name        thingiverse_import
// @namespace   thingiverse_import
// @description Import thing from Thingiverse into CouchDB
// @include     http://www.thingiverse.com/*
// @include     https://www.thingiverse.com/*
// @version     2.0
// @grant       none
// ==/UserScript==

// In order for this to work, you need to enable CORS in CouchDB by editing /etc/couchdb/default.ini in the httpd section:
//     [httpd]
//     enable_cors = true
// specify thingiverse.com as the source and also add PUT as a legal method in the same file as above in the cors section:
//     [cors]
//     origins = http://www.thingiverse.com
//     methods = GET,POST,PUT
// and create a database that requires no authentication to POST new documents to.

// A little help in deciphering the code...

// If you are viewing this in your browser, it has been transformed by including modules from "things"
// https://github.com/derrickoswald/things
// using the very simplified define() function below.

// If you are viewing it in the original source form, there will be placeholders (identified by percent signs)
// for the modules that are to be included.

// The special case is the configuration module that needs to defined for this specific user script.

// Below the asterisks comment is the actual user script.

// variables
var protocol = "http";
var host = "localhost";
var port =  "5984";
var prefix = "";
var database = "pending_things";

/**
 * @summary Replacement for the configuration module of things.
 * @description Handles only the minimum required for proper operation of the user script.
 */
configuration =
    (
        function ()
        {
            function getServer ()
            {
                return (protocol + "://" + host + ":" + port);
            }

            function getPrefix ()
            {
                return (prefix);
            }

            function getDocumentRoot ()
            {
                return (getServer () + getPrefix ());
            }

            function getCouchDB ()
            {
                return (getDocumentRoot () + "/" + database);
            }

            return (
                {
                    getServer: getServer,
                    getPrefix: getPrefix,
                    getDocumentRoot: getDocumentRoot,
                    getCouchDB: getCouchDB
                }
            );
        }
    )();

/**
 * @summary Replacement for require.js define().
 * @description Defines the imported module as the variable on the left.
 * @param {string[]} dependencies <em>ignored</em>
 * @param {function} fn the module definition
 */
function define (dependencies, module)
{
    var args = dependencies.map (eval, this);
    return (module.apply (this, args));
}

sha1 = "%%js/sha1.js%%"

bencoder = "%%js/bencoder.js%%"

torrent = "%%js/torrent.js%%"

multipart = "%%js/multipart.js%%"

records = "%%js/records.js%%"

// *************** end of modules from things *****************

// Change string to be a valid filename without needing quotes.
// Avoid using the following characters from appearing in file names:
//
//     /
//     >
//     <
//     |
//     :
//     &
 //
 // Linux and UNIX allows white spaces, <, >, |, \, :, (, ), &, ;, as well as
 // wildcards such as ? and *, to be quoted or escaped using \ symbol.
 //
 function make_file_name (string)
 {
     var ret;

     // replace whitespace with underscore
     ret = string.replace (/\s/g, "_");
     // encode special characters
     ret = ret.replace (/\%/g, "%25"); // also convert % so decodeURIComponent should work
     ret = ret.replace (/\//g, "%2f");
     ret = ret.replace (/\>/g, "%3e");
     ret = ret.replace (/\</g, "%3c");
     ret = ret.replace (/\|/g, "%7c");
     ret = ret.replace (/\:/g, "%3a");
     ret = ret.replace (/\&/g, "%26");
     ret = ret.replace (/\\/g, "%5c");
     ret = ret.replace (/\(/g, "%28");
     ret = ret.replace (/\)/g, "%29");
     ret = ret.replace (/\;/g, "%3b");
     ret = ret.replace (/\?/g, "%3f");
     ret = ret.replace (/\*/g, "%2a");

     return (ret);
 }


/**
 * @summary End of HTTP file fetch function generator.
 * @param files array of objects with name and URL which is to hold the results
 * @param index the integer index into the array at which to store the returned data
 * @param callback the function to call when all files are finished loading - called with files as argument
 */
function fileFinishedFunction (files, index, callback)
{
    return (
        function (event)
        {
            var done;

            if (4 == event.target.readyState) // DONE
                files[index].data = event.target.response;
            // check if all files are downloaded
            done = true;
            for (var i = 0; done && (i < files.length); i++)
                if (!files[i].data)
                    done = false;
            if (done)
                callback (files);
        }
    );
}

/**
 * @summary Performs ajax calls to fetch the files for the thing.
 * @param {object[]} files the list of files and asscoiated urls
 * @param {function} callback the function to invoke when the files are finished downloading
 */
function downloadAllFiles (files, callback)
{
    for (var i = 0; i < files.length; i++)
    {
        var xmlHttp = new XMLHttpRequest ();
        xmlHttp.open ('GET', files[i].url, true);
        xmlHttp.responseType = "blob";
        xmlHttp.onreadystatechange = fileFinishedFunction (files, i, callback);
        xmlHttp.send ();
    }
}

/**
 * @summary Get the title of the thing.
 * @return {string} the user visible title of the thing
 */
function get_title ()
{
    return (document.getElementsByClassName ("thing-header-data")[0].getElementsByTagName ("h1")[0].innerHTML);
}

/**
 * @summary Fetch all the images
 * @param {string[]} images the array of image URLs
 * @param {function} done_fn the function to invoke with the image blobs
 */
function downloadAllImages (images, done_fn)
{
    var count = images.length;
    var blobs = [];
    for (var i = 0; i < images.length; i++)
    {
        var xmlhttp = records.createCORSRequest ("GET", images[i]);
        if (xmlhttp)
        {
            xmlhttp.setRequestHeader ("Accept", "*/*");
            xmlhttp.responseType = "blob";
            xmlhttp.onreadystatechange = function (index)
            {
                return (function (event)
                {
                    if (4 == event.target.readyState)
                    {
                        blobs[index] = event.target.response;
                        count--;
                        if (0 == count)
                            done_fn (blobs);
                    }
                });
            }(i);
            xmlhttp.send ();
        }
    }
}

/**
 * @summary Convert image blobs to data URLs
 * @param {Blob[]} blobs the blobs to convert as downloaded by downloadAllImages
 * @param {number} width <em>not used</em> was supposed to be the thumbnail width
 * @param {number} height <em>not used</em> was supposed to be the thumbnail height
 * @param {function} fn the function to invoke with the converted images
 */
function convertImagesToDataURLs (blobs, width, height, fn)
{
    var img;
    var canvas;
    var context;

    var urls = [];
    var count = blobs.length;
    for (var i = 0; i < blobs.length; i++)
    {
        img = document.createElement ("img");
        img.id = "image_workspace_" + i;
        img.style.display = "none";
        document.body.appendChild (img);
        img.onload = function (index, img_element)
        {
            return (function (image)
            {
                if (!image)
                    image = this;
                canvas = document.createElement ("canvas");
                canvas.id = "canvas_workspace_" + i;
                canvas.style.display = "none";
                document.body.appendChild (canvas);
                canvas.width = img_element.width;
                canvas.height = img_element.height;
                context = canvas.getContext ("2d");
                context.drawImage (img_element, 0, 0);
                urls[index] = canvas.toDataURL ();
                document.body.removeChild (canvas);
                window.URL.revokeObjectURL (img_element.src);
                document.body.removeChild (img_element);
                count--;
                if (0 == count)
                    fn (urls);
            });
        }(i, img);
        img.src = window.URL.createObjectURL (blobs[i]);
    }
}

/**
 * @summary Create a JavaScript object representation of the thing on this page.
 * @returns {object} the created thing
 */
function thing ()
{
    var title = get_title ();

    var author = document.getElementsByClassName ("thing-header-data")[0].getElementsByTagName ("h2")[0].getElementsByTagName ("a")[0].innerHTML;

    var license = document.getElementsByClassName ("thing-license")[0].getAttribute ("title");

    var tags = [];
    var tagdiv = document.getElementsByClassName ("tags")[0];
    var as = tagdiv.getElementsByTagName ("a");
    for (var i = 0; i < as.length; i++)
        tags.push (as[i].innerHTML.trim ());

    var images = [];
    var thumbs = document.getElementsByClassName ("thing-gallery-thumb");
    for (var i = 0; i < thumbs.length; i++)
        images.push (thumbs[i].getAttribute ("data-large-url"));

    var description = document.getElementById ("description").getElementsByTagName ("p")[0].innerHTML;

    return (
    {
        "title" : title,
        "url" : document.URL,
        "authors" : [ author ],
        "licenses" : [ license ],
        "tags" : tags,
        "thumbnailURL" : images,
        "description" : description
    });
}

/**
 * @summary Send the thing on this page to the things database
 */
function capture ()
{
    var title = get_title ();
    var files = [];
    var links = document.getElementsByClassName ("thing-file-download-link");
    for (var i = 0; i < links.length; i++)
        files.push (
        {
            name : links[i].getAttribute ("data-file-name"),
            url : links[i].getAttribute ("href")
        });
    console.log (title + ' ' + JSON.stringify (files, null, 4));

    downloadAllFiles (files, function (files)
    {
        console.log ("files downloaded: " + files.length);

        var thing_metadata = thing ();

        var blobs = [];
        downloadAllImages (thing_metadata["thumbnailURL"], function (blobs)
        {
            console.log ("images downloaded: " + blobs.length);

            convertImagesToDataURLs (blobs, 512, 512, function (urls)
            {
                console.log ("images converted: " + urls.length);

                thing_metadata["thumbnails"] = urls;
                var directory = encodeURIComponent (make_file_name (get_title ()));
                var filelist = [];
                files.forEach (function (file) { file.data.name = file.name; filelist.push (file.data); });
                torrent.MakeTorrent (filelist, 16384, directory, null, function (tor)
                {
                    // set the time to match the upload date
                    var header = document.getElementsByClassName ("thing-header-data")[0];
                    var subhead = header.getElementsByTagName ("h2")[0];
                    var time = subhead.getElementsByTagName ("time")[0];
                    var date = time.getAttribute ("datetime");
                    date = date.replace (" GMT", "Z").replace (" ", "T");

                    tor["creation date"] = new Date (date).valueOf ();
                    tor["info"]["thing"] = thing_metadata;
                    tor["_id"] = torrent.InfoHash (tor["info"]); // setting _id triggers the PUT method instead of POST

                    // make the list of files for attachment with names adjusted for directory
                    var uploadfiles = [];
                    files.forEach (
                        function (file)
                        {
                            if (1 < files.length)
                                uploadfiles.push (new File ([file.data], directory + "/" + encodeURIComponent (file.name), { type: file.data.type, lastModifiedDate: file.data.lastModifiedDate }));
                            else
                                uploadfiles.push (file.data);
                        });

                    // add the torrent to a copy of the list of files to be saved
                    uploadfiles.push (new File ([bencoder.str2ab (bencoder.encode (tor))], tor["_id"] + ".torrent", { type: "application/octet-stream" }));

                    // convert the pieces into an array (CouchDB doesn't store ArrayBuffers)
                    tor.info.pieces = torrent.PiecesToArray (tor.info.pieces);

                    var options =
                    {
                        success: function () { alert ("thing imported"); },
                        error: function () { alert ("thing import failed"); },
                        CORS: configuration.getServer (),
                        USE_PUT: true
                    };
                    records.saveDocWithAttachments (database, tor, options, uploadfiles);
                });
            });
        });
    });
}

/**
 * @summary Call the CouchDB host to get and put the ping record for this user script.
 * @description Exchange data with the CouchDB database as a sanity check and to assist
 * in configuration checks.
 */
function ping ()
{
    var xmlhttp;
    var payload;

    xmlhttp = records.createCORSRequest ("GET", configuration.getCouchDB  () + "/ping");
    xmlhttp.setRequestHeader ("Accept", "application/json");
    xmlhttp.onreadystatechange = function ()
    {
        if (4 == xmlhttp.readyState)
        {
            payload = { _id: "ping", time: (new Date ()).valueOf (), version: "2.0" }; // ToDo: keep this version string matched to script version
            if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
            {
                var resp = JSON.parse (xmlhttp.responseText);
                payload._rev = resp._rev;
            }
            xmlhttp = records.createCORSRequest ("PUT", configuration.getCouchDB  () + "/ping");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                {
                    console.log ("pinged status: " + xmlhttp.status);
                    var pinged = (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status);
                    document.getElementById ("import_thing_button").disabled = !pinged;
                }
            };
            console.log ("PUT:\n" + JSON.stringify (payload, null, 4));
            xmlhttp.send (JSON.stringify (payload, null, 4));
        }
    };
    console.log ("GET: " + configuration.getCouchDB  () + "/ping");
    xmlhttp.send ();
}

/**
 * Run once function to set up the capture.
 */
(function initialize ()
{
    if (!document.getElementsByClassName ("thingiverse_test")[0])
    {
        var trigger1 = "http://www.thingiverse.com/thing:";
        var trigger2 = "https://www.thingiverse.com/thing:";
        if ((document.URL.substring (0, trigger1.length) == trigger1) || (document.URL.substring (0, trigger2.length) == trigger2))
        {
            console.log ("initializing thingiverse_import");
            var ff = document.createElement ("div");
            ff.setAttribute ("style", "position: relative;");
            var template = "<div style='position: absolute; top: 100px; left: 20px;'>" +
            "<button id='import_thing_button' type='button' class='btn btn-lg btn-primary' disabled>Import to things</button>" +
            "</div>";
            ff.innerHTML = template;
            var body = document.getElementsByTagName ("body")[0];
            body.appendChild (ff);
            var button = document.getElementById ("import_thing_button");
            button.addEventListener ("click", capture);
            ping ();
        }
    }
})();

