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
     * @exports multipart
     * @version 1.0
     */
    function ()
    {
        /**
         * @summary Creates a single array buffer with the data for a multipart/related message.
         *
         * @description To force the AJAX request to send binary encoded data,
         * the data parameter must be an ArrayBuffer, File, or Blob object.
         * This function creates that data from one or more source objects.
         * 
         * @function pack
         * @param {Blob[]} files - an array of file or blob objects to be included
         * @returns {ArrayBuffer} the data from the files as a suitable object for the contents of the HTTP request
         */ 
        function pack (files)
        {
            var ret = new ArrayBuffer ();
            
            return (ret);
        };

        /**
         * @summary Extracts multiple file objects.
         * 
         * @function unpack
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
