/**
 * @fileOverview CouchDB support specific to things.
 * @name records
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["multipart", "configuration"],
    /**
     * @summary Support for reading and writing things and their attachments.
     * @name records
     * @exports records
     * @version 1.0
     */
    function (multipart, configuration)
    {
        /**
         * @private
         */
        function encodeDocId (docID)
        {
            var parts = docID.split ("/");
            if (parts[0] == "_design")
            {
                parts.shift ();
                return "_design/" + encodeURIComponent (parts.join ('/'));
            }
            return (encodeURIComponent (docID));
        }

        /**
         * @private
         */
        function fullCommit (options)
        {
            var opt = options || {};
            if (typeof (opt.ensure_full_commit) !== "undefined")
            {
                var commit = opt.ensure_full_commit;
                delete opt.ensure_full_commit;
                return function (xhr)
                {
                    xhr.setRequestHeader ('Accept', 'application/json');
                    xhr.setRequestHeader ("X-Couch-Full-Commit", commit.toString ());
                };
            }
        }

        /**
         * @private
         */
        // Convert a options object to an url query string.
        // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
        function encodeOptions (options)
        {
            var buf = [];
            if (typeof (options) === "object" && options !== null)
                for ( var name in options)
                    if (-1 == ([ "error", "success", "beforeSuccess", "ajaxStart" ]).indexOf (name))
                    {
                        var value = options[name];
                        if (0 <= ([ "key", "startkey", "endkey" ]).indexOf (name))
                            value = toJSON (value);
                        buf.push (encodeURIComponent (name) + "=" + encodeURIComponent (value));
                    }
            return (buf.length ? "?" + buf.join ("&") : "");
        }

        // see http://jchris.ic.ht/drl/_design/sofa/_list/post/post-page?startkey=[%22Versioning-docs-in-CouchDB%22]
        var rawDocs = {};

        function maybeApplyVersion (doc)
        {
            if (doc._id && doc._rev && rawDocs[doc._id] && rawDocs[doc._id].rev == doc._rev)
            {
                // ToDo: can we use commonjs require here?
                if (typeof Base64 == "undefined")
                {
                    throw 'Base64 support not found.';
                }
                else
                {
                    doc._attachments = doc._attachments || {};
                    doc._attachments["rev-" + doc._rev.split ("-")[0]] =
                    {
                        content_type : "application/json",
                        data : Base64.encode (rawDocs[doc._id].raw)
                    };
                    return true;
                }
            }
        }

        /**
         * @summary Browser independent CORS setup.
         * @description Creates the CORS request and opens it.
         * @param {string} method The method type, e.g. "GET" or "POST"
         * @param {string} url the URL to open the request on
         * @returns {object} the request object or <code>null</code> if CORS isn't supported
         * @memberOf module:records
         */
        function createCORSRequest (method, url)
        {
            var ret;

            ret = new XMLHttpRequest ();
            if ('withCredentials' in ret) // "withCredentials" only exists on XMLHTTPRequest2 objects
                ret.open (method, url, true);
            else if (typeof XDomainRequest != 'undefined') // IE
            {
                ret = new XDomainRequest ();
                ret.open (method, url);
            }
            else
                ret = null; // CORS is not supported by the browser

            return (ret);
        }

        /**
         * Create a new document in the specified database, using the supplied
         * JSON document structure. If the JSON structure includes the _id
         * field, then the document will be created with the specified document
         * ID. If the _id field is not specified, a new unique ID will be
         * generated.
         * @param {String} db - the database to save the document in
         * @param {String} doc - the document to save
         * @param {ajaxSettings} options - <a href="http://api.jquery.com/jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
         * @param {Blob[]} files - the list of files to attach to the document
         * @param {callback} fn - not used yet
         * @returns {Deferred} with the {jqXHR} ajax object Promise
         * @memberOf module:records
         */
        function saveDocWithAttachments (db, doc, options, files, fn)
        {
            var beforeSend;
            var method;
            var uri;
            var versioned;

            options = options || {};
            beforeSend = fullCommit (options);
            if (doc._id === undefined)
            {
                method = "POST";
                uri = configuration.getPrefix () + "/" + db + "/";
            }
            else
            {
                method = "PUT";
                uri = configuration.getPrefix () + "/" + db + "/" + encodeDocId (doc._id);
                delete (doc._id);
            }
            if (options.CORS)
                uri = options.CORS + uri;
            versioned = maybeApplyVersion (doc);
            function decodeUtf8 (arrayBuffer)
            {
                var result = "";
                var i = 0;
                var c = 0;
                var c2 = 0;
                var c3 = 0;

                var data = new Uint8Array (arrayBuffer);

                // If we have a BOM skip it
                if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf)
                    i = 3;

                while (i < data.length)
                {
                    c = data[i];

                    if (c < 128)
                    {
                        result += String.fromCharCode (c);
                        i++;
                    }
                    else if (c > 191 && c < 224)
                    {
                        if (i + 1 >= data.length)
                            throw "UTF-8 Decode failed. Two byte character was truncated.";
                        c2 = data[i + 1];
                        result += String.fromCharCode (((c & 31) << 6) | (c2 & 63));
                        i += 2;
                    }
                    else
                    {
                        if (i + 2 >= data.length)
                            throw "UTF-8 Decode failed. Multi byte character was truncated.";
                        c2 = data[i + 1];
                        c3 = data[i + 2];
                        result += String.fromCharCode (((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                        i += 3;
                    }
                }
                return result;
            }

            multipart.pack (files, doc, "abc123",
                function (ab)
                {
                    var xmlhttp;
                    if (options.CORS)
                    {
                        delete options.CORS;
                        var use_put = options.USE_PUT;
                        delete options.USE_PUT;
                        xmlhttp = createCORSRequest ((use_put ? 'PUT' : 'POST'), uri + encodeOptions (options));
                    }
                    else
                    {
                        xmlhttp = new XMLHttpRequest ();
                        xmlhttp.open (method, uri + encodeOptions (options), true);
                    }
                    xmlhttp.setRequestHeader ("Content-Type", "multipart/related;boundary=\"abc123\"");
                    xmlhttp.setRequestHeader ("Accept", "application/json");
                    // beforeSend ?
                    xmlhttp.onreadystatechange = function ()
                    {
                        var resp;
                        var msg;
                        var reason;

                        if (4 == xmlhttp.readyState)
                            if (200 == xmlhttp.status || 201 == xmlhttp.status || 202 == xmlhttp.status)
                            {
                                resp = JSON.parse (xmlhttp.responseText);
                                doc._id = resp.id;
                                doc._rev = resp.rev;
                                if (options.success)
                                    options.success (resp);
                            }
                            else if (options.error)
                            {
                                resp = JSON.parse (xmlhttp.responseText);
                                if (null === resp)
                                {
                                    msg = xmlhttp.responseText;
                                    reason = "unknown reason, status = " + req.status;
                                }
                                else
                                {
                                    msg = resp.error;
                                    reason = resp.reason;
                                }
                                options.error (xmlhttp.status, msg, reason);
                            }
                    };
                    xmlhttp.send (ab);
                });
        }

        /**
         * Returns the specified doc from the specified db.
         *
         * @see <a href="http://docs.couchdb.org/en/latest/api/document
         *      /common.html#get--db-docid">docs for GET /db/doc</a>
         * @param {String} docId id of document to fetch
         * @param {String} attachment name of the attachment
         * @param {ajaxSettings}
         *            options <a href="http://api.jquery.com/
         *            jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
         * @param {ajaxSettings}
         *            ajaxOptions <a href="http://api.jquery.com/
         *            jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
         * @function fetchDoc
         * @memberOf module:record

         */
        function fetchDoc (db, docId, attachment, options, ajaxOptions)
        {
            /**
             * @private
             */
            function encodeDocId (docID)
            {
                var parts = docID.split ("/");
                if (parts[0] == "_design")
                {
                    parts.shift ();
                    return "_design/" + encodeURIComponent (parts.join ('/'));
                }
                return encodeURIComponent (docID);
            }

            options = options || {};
            //            if (db_opts.attachPrevRev || options.attachPrevRev)
            //            {
            //                $.extend (options,
            //                {
            //                    beforeSuccess : function (req, doc)
            //                    {
            //                        rawDocs[doc._id] =
            //                        {
            //                            rev : doc._rev,
            //                            raw : req.responseText
            //                        };
            //                    }
            //                });
            //            }
            //            else
            {
                $.extend (options,
                {
                    beforeSuccess : function (req, doc)
                    {
                        if (doc["jquery.couch.attachPrevRev"])
                        {
                            rawDocs[doc._id] =
                            {
                                rev : doc._rev,
                                raw : req.responseText
                            };
                        }
                    }
                });
            }
            return (
                $.ajax
                (
                    {
                        url : configuration.getDocumentRoot () +
                                        "/" + db + "/" + encodeDocId (docId) + "/" + attachment + encodeOptions (options),

                        complete : function (req, outcome)
                        {
                            if (req.status == 200 || req.status == 201 || req.status == 202)
                            {
                                if (options.success)
                                    options.success (resp);
                            }
                            else if (options.error)
                            {
                                var msg;
                                var reason;
                                if (null === resp)
                                {
                                    msg = req.responseText;
                                    reason = "unknown reason";
                                }
                                else
                                {
                                    msg = resp.error;
                                    reason = resp.reason;
                                }
                                options.error (req.status, msg, reason);
                            }
                            else
                            {
                                throw "The document could not be saved: " + resp.reason;
                            }
                        }
                    },
                    options,
                    "The document could not be retrieved",
                    ajaxOptions
                )
            );
        }

        /**
         * Read an attachment from the document in the specified database
         * @param {String} db - the database to read from
         * @param {String} id - the document id
         * @param {String} name - the document name
         * @param {callback} fn - not used yet
         * @returns {Deferred} with the {jqXHR} ajax object Promise
         * @function read_attachment
         * @memberOf module:record
         */
        function read_attachment (db, id, name, fn)
        {
            fetchDoc
            (
                db,
                id,
                name,
                null,
                {
                    success : function (data)
                    {
                        fn (data);
                    },
                    error : function (status)
                    {
                        console.log (status);
                    }
                }
            );
        }

        /**
         * @summary Convert base64 to a blob.
         * @description Convert a base64 string into a blob.
         * @param {string} data - the string of base64 data
         * @param {string} type - the mime type to attach to the blob
         * @param {number} size - the processing chunk size
         * @function base64toBlob
         * @memberOf module:record
         */
        function base64toBlob (data, type, size)
        {
            var s;
            var array;
            var slice;
            var bytes;

            type = type || "";
            size = size || 512;

            s = atob (data);
            array = [];

            for (var offset = 0; offset < s.length; offset += size)
            {
                slice = s.slice (offset, offset + size);
                bytes = new Array (slice.length);
                for (var i = 0; i < slice.length; i++)
                    bytes[i] = slice.charCodeAt (i);

                array.push (new Uint8Array (bytes));
            }

            return (new Blob (array, { type: type }));
        }

        var functions =
        {
            createCORSRequest: createCORSRequest,
            saveDocWithAttachments : saveDocWithAttachments,
            read_attachment : read_attachment,
            base64toBlob: base64toBlob
        };

        return (functions);

    }
);
