/**
 * @fileOverview Multipart mime HTTP body support for sending and receiving couchdb document attachments.
 * @name multipart
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    [],
    /**
     * @summary Support for packing and unpacking multipart/related (mime) data.
     * @name multipart
     * @exports multipart
     * @version 1.0
     */
    function ()
    {
        /**
         * @summary The newline string.
         * @description It is very important to use both a line feed (LF) and carriage return (CR)
         * in terminating the lines within the HTTP request body, because otherwise couchdb
         * just silently fails to work, with no error message (well the unit tests using JSTestDriver
         * return 'Bad Gateway' 503 error).
         * @see {@link https://groups.google.com/forum/#!topic/couchdb-user-archive/3vwpr2mY95c}
         * <ul>
         * <li>Make sure the line breaks in the MIME separators/headers are CRLF, not just LF!</li>
         * <li>(fixed) CouchDB crashes if a multipart body is sent in HTTP ‘chunked’ mode (COUCHDB-1403, filed by me two years ago and still unresolved. My colleague working on the Java port of my replicator just ran into this a few weeks ago.)</li>
         * <li>(no longer required) I remember there being a bug in CouchDB where it required a CRLF after the closing MIME separator, i.e. the body had to end “--separator--\r\n” not just “--separator--“) but I can’t find a reference to the bug in my source code anymore. It may have been fixed.</li>
         * <li>(not fixed) CouchDB used to ignore the headers in attachment MIME parts and assumed that the attachments appeared in the same order as in the “_attachments” object in the main JSON body. I believe this has been fixed and that it now looks at the Content-Disposition header to find the attachment’s filename, but I can’t remember for sure.</li>
         * </ul>
         * @memberOf module:multipart
         */
        var CRLF = "\r\n";

        /**
         * Pair of hypen marks.
         * @memberOf module:multipart
         */
        var HYPH = "--";

        /**
         * The content type mime header.
         * @memberOf module:multipart
         */
        var CONT = "Content-Type: application/json";

        /**
         * Convert a string into UTF-8 encoded (all high order bytes are zero) string.
         * @see {@link http://monsur.hossa.in/2012/07/20/utf-8-in-javascript.html}
         * @param {String} str - the string to encode
         * @returns {String} UTF-8 encoded string
         * @memberOf module:multipart
         */
        function encode_utf8 (str)
        {
            return (unescape (encodeURIComponent (str)));
        };

        /**
         * @summary Creates a function for handling the end of reading a file.
         * @description If all blobs have been read in, the function callback is called.
         * @param {View} view the array to stuff the result into
         * @param {number} the offset within the view to stuff the data
         * @param {Array} doneset the array of boolean values to keep track of done status
         * @param {number} index - the index at which to store the result doneset array
         * @param callback - the function to call when all blobs have been read in
         * paramater to callback
         * @memberOf module:torrent
         */
        function makeLoadEndFunction (view, offset, doneset, index, callback, array)
        {
            return function (event)
            {
                var done;

                if (event.target.readyState == FileReader.DONE)
                {
                    view.set (new Uint8Array (event.target.result), offset);
                    doneset[index] = true;
                }
                // check if all files are read in
                done = true;
                for (var i = 0; done && (i < doneset.length); i++)
                    if (!doneset[i])
                        done = false;
                if (done)
                    callback (array);
            };
        }

        /**
         * @summary Creates a single array buffer with the data for a multipart/related document insert.
         *
         * @description To force the AJAX request to send binary encoded data,
         * the data parameter must be an ArrayBuffer, File, or Blob object.
         * This function creates that data from one or more source objects.
         * An attachments entry will be created and inserted into the document.
         * The contents of the files is concatenated as unaltered binary data.
         * Because the order of the attachment entries in the doc object
         * (as serialized by JSON.stringify) cannot be guaranteed, the
         * process is done in string form.
         *
         * @function pack
         * @memberOf module:multipart
         * @param {Blob[]} files - an array of file or blob objects to be included
         * @param {object} doc - the couchdb document to which the attachments are added
         * @param {string} boundary - the boundary sentinel to use between content and files
         * @param {function} callback - the function to call back with the packed multipart mime object
         * @returns a deferred object whose single parameter is an {ArrayBuffer} containing the data from the files as a suitable object for the contents of the HTTP request
         */
        function pack (files, doc, boundary, callback)
        {
            var serialized;
            var attachments;
            var index;
            var prefix;
            var spacer;
            var suffix;
            var size;
            var array;
            var view;
            var doneset;
            var readers;

            delete (doc._attachments); // remove any existing attachments
            if (0 != files.length)
            {
                serialized = JSON.stringify (doc, null, "    ");
                attachments = "";
                for (var i = 0; i < files.length; i++)
                {
                    if (0 != i)
                        attachments += ",\n";
                    attachments +=
                        "        \"" + files[i].name + "\":\n" +
                        "        {\n" +
                        "            \"follows\": true,\n" +
                        ((files[i].type && ("" != files[i].type)) ? ("            \"content_type\": \"" + files[i].type + "\",\n") : "") +
                        "            \"length\": " + files[i].size + "\n" +
                        "        }";
                }
                attachments += "\n";
                attachments = encode_utf8 (attachments);
                index = serialized.lastIndexOf ("}") - 1; // -1 to also trim off the newline
                serialized = serialized.substring (0, index) + ",\n    \"_attachments\":\n    {\n" + attachments + "\n    }\n}";

                prefix = CRLF +
                    HYPH + boundary + CRLF +
                    CONT + CRLF + CRLF +
                    serialized + CRLF + CRLF +
                    HYPH + boundary + CRLF + CRLF;
                spacer = CRLF +
                    HYPH + boundary +
                    CRLF + CRLF;
                suffix = CRLF +
                    HYPH + boundary + HYPH +
                    CRLF + CRLF + CRLF;

                // compute the array buffer size
                size = prefix.length;
                for (var i = 0; i < files.length; i++)
                    size += files[i].size;
                size += (files.length - 1) * spacer.length;
                size += suffix.length;

                array = new ArrayBuffer (size);
                view = new Uint8Array (array);

                for (var i = 0; i < prefix.length; i++)
                    view[i] = (0xff & prefix.charCodeAt (i));
                index = prefix.length;

                // make an array of status flags
                doneset = [];
                for (var i = 0; i < files.length; i++)
                    doneset.push (false);

                var readers = [];
                for (var i = 0; i < files.length; i++)
                {   // here we add the file bytes with spacers between files
                    var reader = new FileReader ();
                    reader.onloadend = makeLoadEndFunction (view, index, doneset, i, callback, array);
                    readers.push (reader);
                    index += files[i].size;
                    for (var j = 0; j < spacer.length; j++)
                        view[index++] = (0xff & spacer.charCodeAt (j));
                }
                for (var i = 0; i < suffix.length; i++)
                    view[size - suffix.length + i] = (0xff & suffix.charCodeAt (i));

                // kick it off
                for (var i = 0; i < files.length; i++)
                    readers[i].readAsArrayBuffer (files[i]);
            }
        };

        /**
         * @summary Extracts multiple file objects.
         *
         * @function unpack
         * @memberOf module:multipart
         * @param {HTTPresponse} resp - received value from the server
         * @returns {ArrayBuffer[]} an array of byte buffers extracted from the response
         */
        function unpack (resp)
        {
            var ret = [new ArrayBuffer ()];

            return (ret);
        };

        var functions =
        {
            "pack": pack,
            "unpack": unpack
        };

        return (functions);
    }
);
