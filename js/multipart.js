/**
 * @fileOverview Multipart mime HTTP body support for sending and receiving couchdb document attachments.
 * @name multipart
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
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
         * @summary Stupid conversion string to array buffer.
         * 
         * @description Assumes ASCII and just copies byte by byte.
         * 
         * @function str2ab
         * @memberOf module:multipart
         * @param {string} str - the string to turn into an ArrayBuffer
         * @returns {ArrayBuffer} the string as an ArrayBuffer
         */
        function str2ab (str)
        {
            var len = str.length;
            var ret = new ArrayBuffer (str.length);
            var view = new Uint8Array (ret);
            for (var i = 0; i < len; i++)
                view[i] = (0xff & str.charCodeAt (i));

            return (ret);
        };

        /**
         * @summary Creates a single array buffer with the data for a multipart/related document insert.
         *
         * @description To force the AJAX request to send binary encoded data,
         * the data parameter must be an ArrayBuffer, File, or Blob object.
         * This function creates that data from one or more source objects.
         * 
         * @function pack
         * @memberOf module:multipart
         * @param {Blob[]} files - an array of file or blob objects to be included
         * @param {object} doc - the 
         * @param {string} boundary - the boundary sentinel to use between content and files
         * @returns {ArrayBuffer} the data from the files as a suitable object for the contents of the HTTP request
         */ 
        function pack (files, doc, boundary, stuff)
        {
            var text;
            var ret;
            
            text = CRLF +
                HYPH + boundary + CRLF +
                CONT + CRLF + CRLF +
                JSON.stringify (doc) + CRLF + CRLF +
                HYPH + boundary + CRLF + CRLF +
                stuff + CRLF +
                HYPH + boundary + CRLF +
                CRLF + CRLF + CRLF;
            ret = str2ab (text);
            
            return (ret);
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
)
