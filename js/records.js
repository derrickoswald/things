/**
 * @fileOverview CouchDB support specific to things.
 * @name records
 * @author Derrick Oswald
 * @version: 1.0
 */
define ([ "multipart" ],
    /**
     * @summary Support for reading and writing things and their attachments.
     * @name records
     * @exports records
     * @version 1.0
     */
    function (multipart)
    {
        /**
         * @summary Read the "Overview" view and calls back the given function with the data.
         * @description Stupid functionality - to be replaced.
         * @function read_records
         * @memberOf module:records
         */
        function read_records (db, fn)
        {
            $.couch.db (db).view (db + "/OverView",
            {
                success : function (data)
                {
                    fn (data.rows.map (function (element)
                    {
                        return (element.value);
                    }));
                },
                error : function (status)
                {
                    console.log (status);
                },
                reduce : false
            });
        };

        /**
         * @summary Insert a document into the database.
         * @description Yup, that's all - to be replaced.
         * @function insert_record
         * @memberOf module:records
         */
        function insert_record (db, doc, fn)
        {
            $.couch.db (db).saveDoc (doc,
            {
                success : function (data)
                {
                    fn (data);
                },
                error : function (status)
                {
                    console.log (status);
                }
            });
        };

        /**
         * @private
         */
        function fullCommit (options)
        {
            var options = options ||
            {};
            if (typeof (options.ensure_full_commit) !== "undefined")
            {
                var commit = options.ensure_full_commit;
                delete options.ensure_full_commit;
                return function (xhr)
                {
                    xhr.setRequestHeader ('Accept', 'application/json');
                    xhr.setRequestHeader ("X-Couch-Full-Commit", commit.toString ());
                };
            }
        };

        /**
         * @private
         */
        // Convert a options object to an url query string.
        // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
        function encodeOptions (options)
        {
            var buf = [];
            if (typeof (options) === "object" && options !== null)
            {
                for ( var name in options)
                {
                    if ($.inArray (name, [ "error", "success", "beforeSuccess", "ajaxStart" ]) >= 0)
                        continue;
                    var value = options[name];
                    if ($.inArray (name, [ "key", "startkey", "endkey" ]) >= 0)
                    {
                        value = toJSON (value);
                    }
                    buf.push (encodeURIComponent (name) + "=" + encodeURIComponent (value));
                }
            }
            return buf.length ? "?" + buf.join ("&") : "";
        };

        // see http://jchris.ic.ht/drl/_design/sofa/_list/post/post-page?startkey=[%22Versioning-docs-in-CouchDB%22]
        rawDocs =
        {};

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
                    doc._attachments = doc._attachments ||
                    {};
                    doc._attachments["rev-" + doc._rev.split ("-")[0]] =
                    {
                        content_type : "application/json",
                        data : Base64.encode (rawDocs[doc._id].raw)
                    };
                    return true;
                }
            }
        };

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
            options = options ||
            {};
            var beforeSend = fullCommit (options);
            if (doc._id === undefined)
            {
                var method = "POST";
                var uri = "/" + db + "/";
            }
            else
            {
                var method = "PUT";
                var uri = "/" + db + "/" + $.couch.encodeDocId (doc._id);
                delete (doc._id);
            }
            var versioned = maybeApplyVersion (doc);
            function decodeUtf8 (arrayBuffer)
            {
                var result = "";
                var i = 0;
                var c = 0;
                var c1 = 0;
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
            };

            var data_deferred = multipart.pack (files, doc, "abc123");
            var ret = data_deferred.then (function (ab)
            {
                // convert here from the list created by the when() call into a single (any one of the) ArrayBuffer arguments
                if (Array.isArray (ab))
                    ab = ab[0];
                $.ajax (
                {
                    type : method,
                    url : uri + encodeOptions (options),
                    contentType : "multipart/related;boundary=\"abc123\"",
                    dataType : "json",
                    processData : false, // needed for data as ArrayBuffer
                    data : ab,
                    beforeSend : beforeSend,
                    complete : function (req, outcome)
                    {
                        switch (outcome)
                        {
                        // ("success", "notmodified", "error", "timeout", "abort", or "parsererror")
                        }
                        var resp = $.parseJSON (req.responseText);
                        if (req.status == 200 || req.status == 201 || req.status == 202)
                        {
                            doc._id = resp.id;
                            doc._rev = resp.rev;
                            if (versioned)
                            {
                                db.openDoc (doc._id, // ToDo: this is not correct, db is a string, need version tests
                                {
                                    attachPrevRev : true,
                                    success : function (d)
                                    {
                                        doc._attachments = d._attachments;
                                        if (options.success)
                                            options.success (resp);
                                    }
                                });
                            }
                            else
                            {
                                if (options.success)
                                    options.success (resp);
                            }
                        }
                        else if (options.error)
                        {
                            var msg;
                            var reason;
                            if (null == resp)
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
                })
            });

            return (ret);
        };

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
            ;

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
            return $.ajax (
            {
                url : "/" + db + "/" + encodeDocId (docId) + "/" + attachment + encodeOptions (options),

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
                        if (null == resp)
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
            }, options, "The document could not be retrieved", ajaxOptions);
        };

        /**
         * Read an attachment from the document in the specified database
         * @param {String} db - the database to read from
         * @param {String} id - the docum ent id
         * @param {String} name - the document name
         * @param {callback} fn - not used yet
         * @returns {Deferred} with the {jqXHR} ajax object Promise
         * @memberOf module:record
         */
        function read_attachment (db, id, name, fn)
        {
            fetchDoc (db, // $.couch.db (db).openDoc(
            id, name, null,
            {
                success : function (data)
                {
                    fn (data);
                },
                error : function (status)
                {
                    console.log (status);
                }
            });
        };

        var functions =
        {
            "read_records" : read_records,
            "insert_record" : insert_record,
            "saveDocWithAttachments" : saveDocWithAttachments,
            "read_attachment" : read_attachment
        };

        return (functions);

    }
);
