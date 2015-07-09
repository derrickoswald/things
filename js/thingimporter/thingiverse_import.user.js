// ==UserScript==
// @name        ThingiverseImport
// @namespace   thingiverse_import
// @description Import thing from Thingiverse into CouchDB based things (see https://github.com/derrickoswald/things)
// @include     http://www.thingiverse.com/*
// @include     https://www.thingiverse.com/*
// @version     $$version$$
// @grant       none
// ==/UserScript==

// In order for this to work, the things configuration needs to enable CORS in CouchDB,
// or by manually editing /etc/couchdb/default.ini in the httpd section:
//     [httpd]
//     enable_cors = true
// specify thingiverse.com as the source and also add PUT as a legal method in the same file in the cors section:
//     [cors]
//     origins = http://www.thingiverse.com
//     methods = GET,POST,PUT
// and create a database that requires no authentication to add new documents to.

// A little help in deciphering the code...

// If you are viewing this in your browser, it has been transformed to match the things
// system it was downloaded from by replacing variables and including modules from "things"
// https://github.com/derrickoswald/things
// using the very simplified define() function below.

// If you are viewing it in the original source form, there will be placeholders identified by percent signs
// for the modules that are to be included and by dollar signs for variables that are replaced.

// The special case is the configuration module that needs to defined for this specific user script.

// Below the asterisks comment is the actual user script.

// variables
var protocol = "$$protocol$$";
var host = "$$host$$";
var port = "$$port$$";
var prefix = "$$prefix$$";
var database = "$$database$$";

// content
var thing_metadata;
var thing_files;

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
                return (protocol + "//" + host + ":" + port);
            }

            function getPrefix ()
            {
                return (prefix);
            }

            function getDocumentRoot ()
            {
                return (getServer () + getPrefix ());
            }

            function getDatabase ()
            {
                return (database);
            }

            function getCouchDB ()
            {
                return (getDocumentRoot () + "/" + getDatabase ());
            }

            return (
                {
                    getServer: getServer,
                    getPrefix: getPrefix,
                    getDocumentRoot: getDocumentRoot,
                    getDatabase: getDatabase,
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

sha1 = "%%js/sha1.js%%";

bencoder = "%%js/bencoder.js%%";

torrent = "%%js/torrent.js%%";

multipart = "%%js/multipart.js%%";

records = "%%js/records.js%%";

// *************** end of modules from things *****************

/**
 * @summary Log a message to the console area
 * @param {string} message the message to add to the console log screen
 */
function console_log (message)
{
    document.getElementById ("console_panel").innerHTML =
        document.getElementById ("console_panel").innerHTML +
        message + "\n";
}

/**
 * @summary Change string to be a valid filename without needing quotes.
 * @description Avoid using the following characters from appearing in file names:
 *
 *     /
 *     >
 *     <
 *     |
 *     :
 *     &
 *
 * Linux and UNIX allows white spaces, <, >, |, \, :, (, ), &, ;, as well as
 * wildcards such as ? and *, to be quoted or escaped using \ symbol.
 * @param {string} string the string to operate on
 * @return {string} a valid file name
 */
 function make_file_name (string)
 {
     var ret;

     // replace whitespace with underscore
     ret = string.replace (/\s/g, "_");
     // encode special characters
     ret = ret.replace (/\%/g, "%25"); // also convert % so decodeURIComponent should work
     ret = ret.replace (/\//g, "%2f");
     ret = ret.replace (/\>/g, "%3e");
     ret = ret.replace (/</g, "%3c");
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
 * @description Handles ajax readyState DONE to check if this file completes all the downloads.
 * @param {object[]} files objects with name and URL, each of which also holds the results
 * @param {number} index the integer index into the array at which to store the returned data
 * @param {function} callback the function to call when all files are finished loading - called with files as argument
 * @return {function} a function for checking if all files have been downloaded
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
 * @param {object[]} files the list of files and associated URLs
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
                        if (0 === count)
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
                if (0 === count)
                    fn (urls);
            });
        }(i, img);
        img.src = window.URL.createObjectURL (blobs[i]);
    }
}

/**
 * @summary Pull the text out of an HTML formatted set of paragraphs.
 * @param {string} id the element id from which to extract the text
 * @returns {String} the raw text with newline separators
 */
function extract_text (id)
{
    var paragraphs;
    var ret;

    ret = "";

    paragraphs = document.getElementById (id).getElementsByTagName ("p");
    for (var i = 0; i < paragraphs.length; i++)
    {
        if ("" !== ret)
            ret += "\n";
        ret += paragraphs[i].childNodes[0].nodeValue;
    }

    return (ret);
}

/**
 * @summary Create a JavaScript object representation of the thing on this page.
 * @param {function} callback the function to call when the thing is ready, called with the created thing
 */
function thing (callback)
{
    var as;
    var thumbs;
    var ret;

    ret = {};

    ret.title = get_title ();
    ret.url = [location.protocol, '//', location.host, location.pathname].join ('');
    ret.authors = [ document.getElementsByClassName ("thing-header-data")[0].getElementsByTagName ("h2")[0].getElementsByTagName ("a")[0].innerHTML ];
    ret.licenses = [ document.getElementsByClassName ("thing-license")[0].getAttribute ("title") ];
    ret.tags = [];
    as = document.getElementsByClassName ("tags")[0].getElementsByTagName ("a");
    for (var i = 0; i < as.length; i++)
        ret.tags.push (as[i].innerHTML.trim ());
    ret.thumbnailURL = [];
    thumbs = document.getElementsByClassName ("thing-gallery-thumb");
    for (var j = 0; j < thumbs.length; j++)
        ret.thumbnailURL.push (thumbs[j].getAttribute ("data-large-url"));
    ret.description = extract_text ("description");
    //ret.instructions = extract_text ("instructions");

    // try and fill in the author's real name
    get_author
    (
        ret.authors[0],
        function (full_name)
        {
            if (full_name != ret.authors[0])
                ret.authors[0] = full_name + " (" + ret.authors[0] + ")";
            callback (ret);
        }
    );
}

/**
 * @summary Get the files associated with the thing
 * @returns {object[]} a set of objects with the name and associated url
 */
function get_files ()
{
    var links;
    var ret;

    ret = [];

    links = document.getElementsByClassName ("thing-file-download-link");
    for (var i = 0; i < links.length; i++)
        ret.push
        (
            {
                name : links[i].getAttribute ("data-file-name"),
                url : links[i].getAttribute ("href")
            }
        );

    return (ret);
}

/**
 * @summary Send the thing on this page to the things database
 * @param {object} event <em>not used</em>
 */
function capture (event)
{
    document.getElementById ("import_thing_button").disabled = true;
    downloadAllFiles (thing_files, function (files)
    {
        console.log ("files downloaded: " + files.length);
        downloadAllImages (thing_metadata.thumbnailURL, function (blobs)
        {
            console.log ("images downloaded: " + blobs.length);

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
                tor["created by"] = "ThingiverseImport v$$version$$";
                tor.info.thing = thing_metadata;
                tor._id = torrent.InfoHash (tor.info); // setting _id triggers the PUT method instead of POST

                convertImagesToDataURLs (blobs, 512, 512, function (urls)
                {
                    console.log ("images converted: " + urls.length);

                    thing_metadata.thumbnails = urls;

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
                    uploadfiles.push (new File ([bencoder.str2ab (bencoder.encode (tor))], tor._id + ".torrent", { type: "application/octet-stream" }));

                    // convert the pieces into an array (CouchDB doesn't store ArrayBuffers)
                    tor.info.pieces = torrent.PiecesToArray (tor.info.pieces);

                    var id = tor._id;
                    var options =
                    {
                        success: function ()
                        {
                            console.log ("document " + id + " saved");
                            console_log ("Uploaded thing " + id);
                            document.getElementById ("import_thing_button").disabled = false;
                        },
                        error: function ()
                        {
                            console.log ("failed to save document " + id);
                            console_log ("Failed to upload thing " + id);
                            document.getElementById ("import_thing_button").disabled = false;
                        },
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
 * Try to get the author's name from their handle.
 * @description Looks up the user's about page and checks for a real name
 * (or at least what Thingiverse has as their name)
 * @param {string} name the handle for the user
 * @param {function} callback the function to call with the users "real" name
 */
function get_author (name, callback)
{
    var xmlhttp = new XMLHttpRequest ();
    xmlhttp.open ('GET', "http://www.thingiverse.com/" + name + "/about", true);
    xmlhttp.onreadystatechange = function ()
    {
        if (4 == xmlhttp.readyState)
        {
            var html = xmlhttp.responseText;
            // the name is the only thing with an h1 tag
            var h1 = html.indexOf ("<h1>");
            if (-1 != h1)
            {
                var h2 = html.indexOf ("</h1>", h1 + 4);
                if (-1 != h2)
                    callback (html.substring (h1 + 4, h2));
            }
        }
    };
    xmlhttp.send ();
}

/**
 * @summary Call the CouchDB host to get and put the ping record for this user script.
 * @description Exchange data with the CouchDB database as a sanity check and to assist
 * in configuration checks.
 * @param {function} callback the function to call back when the ping is complete
 */
function ping (callback)
{
    var xmlhttp;
    var payload;

    xmlhttp = records.createCORSRequest ("GET", configuration.getCouchDB  () + "/ping");
    xmlhttp.setRequestHeader ("Accept", "application/json");
    xmlhttp.onreadystatechange = function ()
    {
        if (4 == xmlhttp.readyState)
        {
            payload =
            {
                _id: "ping",
                time: (new Date ()).valueOf (),
                version: "$$version$$"
            };
            console.log ("ping status: " + xmlhttp.status);
            console_log ("Server " + configuration.getServer () + " is online");
            if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
            {
                var resp = JSON.parse (xmlhttp.responseText);
                if (resp.version && (Number(resp.version) > Number (payload.version)))
                    console_log ("A newer version (" + resp.version + ") of this user script (thingiverse_import_user.js " + payload.version + ") exists.");
                payload._rev = resp._rev;
                xmlhttp = records.createCORSRequest ("PUT", configuration.getCouchDB () + "/ping");
                xmlhttp.setRequestHeader ("Accept", "application/json");
                xmlhttp.onreadystatechange = function ()
                {
                    if (4 == xmlhttp.readyState)
                    {
                        console.log ("pong status: " + xmlhttp.status);
                        var ponged = (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status);
                        console_log ("Database " + configuration.getDatabase () + " is accessible " + (ponged ? "read-write" : "read-only"));
                        document.getElementById ("import_thing_button").disabled = !ponged;
                        callback ();
                    }
                };
                xmlhttp.send (JSON.stringify (payload, null, 4));
            }
        }
    };
    xmlhttp.send ();
}

/**
 * @summary Show the user what would be saved in the thing
 * @param {function} callback the function to call back when the display is complete
 */
function display_contents (callback)
{
    thing_files = get_files ();
    thing
    (
        function (metadata)
        {
            thing_metadata = metadata;
            document.getElementById ("metadata_panel").innerHTML =
                "<div>" + JSON.stringify (thing_metadata, null, 4) + "</div>";
            document.getElementById ("files_panel").innerHTML =
                "<div>" + JSON.stringify (thing_files, null, 4) + "</div>";
            callback ();
        }
    );
}

/**
 * Run once function to set up the thing capture.
 */
(
    function initialize ()
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
                var template =
                    "<div style='position: absolute; top: 80px; left: 20px;'>" +
                        "<div style='height: 100%'>" +
                            "<div style='position: relative; top: +12px; left: +35px; background: #f5f5f5; width: 135px; padding-left: 20px; color: #337ab7;'>Thing Metadata</div>" +
                            "<pre id='metadata_panel' style='max-width: 500px; overflow-x: hidden; max-height: 25%; overflow-y: auto; border: 5px solid #e3edf9;border-radius: 2em; padding: 2em; margin-bottom: 1em'></pre>" +
                            "<div style='position: relative; top: +12px; left: +35px; background: #f5f5f5; width: 100px; padding-left: 20px; color: #337ab7;'>Thing Files</div>" +
                            "<pre id='files_panel' style='max-width: 500px; overflow-x: hidden; max-height: 25%; overflow-y: auto; border: 5px solid #e3edf9;border-radius: 2em; padding: 2em; margin-bottom: 1em'></pre>" +
                            "<div style='position: relative; top: +12px; left: +35px; background: #f5f5f5; width: 100px; padding-left: 20px; color: #337ab7;'>Messages</div>" +
                            "<pre id='console_panel' style='max-width: 500px; overflow-x: hidden; max-height: 25%; overflow-y: auto; border: 5px solid #e3edf9;border-radius: 2em; padding: 2em; margin-bottom: 1em'></pre>" +
                            "<button id='import_thing_button' type='button' class='btn btn-lg btn-primary' disabled style='float: right; text-shadow: initial; background-color: #337ab7;'>Import to things</button>" +
                        "</div>" +
                    "</div>";
                ff.innerHTML = template;
                document.getElementsByTagName ("body")[0].appendChild (ff);
                var button = document.getElementById ("import_thing_button");
                button.addEventListener ("click", capture);
                display_contents
                (
                    function ()
                    {
                        ping
                        (
                            function ()
                            {
                                console.log ("done initializing thingiverse_import");
                            }
                        );
                    }
                );
            }
        }
    }
)();
