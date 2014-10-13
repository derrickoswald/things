define
(
    ["multipart"],
    function (multipart)
    {
        function login ()
        {
            $.couch.login
            (
                {
                    name: "admin",
                    password: "secret",
                    success: function (data)
                    {
                        console.log (data);
                    },
                    error: function (status)
                    {
                        console.log (status);
                    }
                }
            );
        };

        function read_records (db, fn)
        {
            $.couch.db (db).view
            (
                db + "/OverView",
                {
                    success: function (data)
                    {
                        fn (data.rows.map (function (element) { return (element.value); }));
                    },
                    error: function (status)
                    {
                        console.log (status);
                    },
                    reduce: false
                }
            );
        };
        
        function insert_record (db, doc, fn)
        {
            $.couch.db (db).saveDoc
            (
                doc,
                {
                    success: function (data)
                    {
                        fn (data);
                    },
                    error: function(status)
                    {
                        console.log (status); 
                    }
                }
            );
        };

        /**
        * @private
        */
        function fullCommit (options)
        {
            var options = options || {};
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

        rawDocs = {};

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
        };

        /**
        * Create a new document in the specified database, using the supplied
        * JSON document structure. If the JSON structure includes the _id
        * field, then the document will be created with the specified document
        * ID. If the _id field is not specified, a new unique ID will be
        * generated.
        * @param {String} db - the database to save the document in
        * @param {String} doc - the document to save
        * @param {ajaxSettings} options - <a href="http://api.jquery.com/
        * jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
        * @param {Blob[]} files - the list of files to attach to the document
        * @param {callback} fn - not used
        */
        function saveDocWithAttachments (db, doc, options, files, fn)
        {
            options = options || {};
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

                var data = new Uint8Array(arrayBuffer);

                // If we have a BOM skip it
                if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
                    i = 3;
                }

                while (i < data.length) {
                    c = data[i];

                    if (c < 128) {
                        result += String.fromCharCode(c);
                        i++;
                    } else if (c > 191 && c < 224) {
                        if( i+1 >= data.length ) {
                            throw "UTF-8 Decode failed. Two byte character was truncated.";
                        }
                        c2 = data[i+1];
                        result += String.fromCharCode( ((c&31)<<6) | (c2&63) );
                        i += 2;
                    } else {
                        if (i+2 >= data.length) {
                            throw "UTF-8 Decode failed. Multi byte character was truncated.";
                        }
                        c2 = data[i+1];
                        c3 = data[i+2];
                        result += String.fromCharCode( ((c&15)<<12) | ((c2&63)<<6) | (c3&63) );
                        i += 3;
                    }
                }
                return result;
            };
            var stuff = decodeUtf8 (files[0]);
            doc._attachments =
            {
                "foo.txt":
                {
                    "follows": true,
                    "content_type": "text/plain",
                    "length": stuff.length
                }
            };
            var ab = multipart.pack (null, doc, "abc123", stuff);
            alert (ab.byteLength);
            return $.ajax (
            {
                type : method,
                url : uri + encodeOptions (options),
                contentType : "multipart/related;boundary=\"abc123\"",
                dataType : "json",
                processData: false, // needed for data as ArrayBuffer
                data : ab,
//                    "\r\n" +
//                    "--abc123\r\n" +
//                    "Content-Type: application/json\r\n" +
//                    "\r\n" +
//                    JSON.stringify (doc) + "\r\n" +
//                    "\r\n" +
//                    "--abc123\r\n" +
//                    "\r\n" +
//                    stuff + "\r\n" +
//                    "--abc123--\r\n" +
//                    "\r\n\r\n\r\n",
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
                            db.openDoc (doc._id,
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
            });
        };
 
        var functions =
        {
            "login": login,
            "read_records": read_records,
            "insert_record": insert_record,
            "saveDocWithAttachments": saveDocWithAttachments
        };
        
        return (functions);
    }
);
