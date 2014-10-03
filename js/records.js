define
(
    {
        login: function ()
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
        },

        read_records: function (db, fn)
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
        },
        
        insert_record: function (db, doc, fn)
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
        },

        /**
        * @private
        */
        fullCommit : function (options)
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
        },

        /**
        * @private
        */
        // Convert a options object to an url query string.
        // ex: {key:'value',key2:'value2'} becomes '?key="value"&key2="value2"'
        encodeOptions : function (options)
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
        },

        rawDocs: {},

        maybeApplyVersion : function (doc)
        {
            if (doc._id && doc._rev && this.rawDocs[doc._id] && this.rawDocs[doc._id].rev == doc._rev)
            {
                // todo: can we use commonjs require here?
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
        },

        /**
        * Create a new document in the specified database, using the supplied
        * JSON document structure. If the JSON structure includes the _id
        * field, then the document will be created with the specified document
        * ID. If the _id field is not specified, a new unique ID will be
        * generated.
        * @see <a href="http://docs.couchdb.org/en/latest/api/document
        * /common.html#put--db-docid">docs for PUT /db/doc</a>
        * @param {String} doc document to save
        * @param {ajaxSettings} options <a href="http://api.jquery.com/
        * jQuery.ajax/#jQuery-ajax-settings">jQuery ajax settings</a>
        * @param {[ArrayBuffer]} files
        */
        saveDocWithAttachments : function (db, doc, options, files, fn)
        {
            options = options || {};
            //var db  = this;
            var beforeSend = this.fullCommit (options);
            if (doc._id === undefined)
            {
                var method = "POST";
                var uri = "http://127.0.0.1:42442/" + db + "/";
            }
            else
            {
                var method = "PUT";
                var uri = "http://127.0.0.1:42442/" + db + "/" + $.couch.encodeDocId (doc._id);
                delete (doc._id);
            }
            var versioned = this.maybeApplyVersion (doc);
            var stuff = "some data written to the file so it looks legit\n";
            doc._attachments =
            {
                "foo.txt":
                {
                    "follows": true,
                    "content_type": "text/plain",
                    "length": stuff.length
                }
            };
            return $.ajax (
            {
                type : method,
                url : uri + this.encodeOptions (options),
                contentType : "multipart/related;boundary=\"abc123\"", // "application/json",
                dataType : "json",
                data :
                    "\n" +
                    "--abc123\n" +
                    "Content-Type: application/json\n" +
                    "\n" +
                    JSON.stringify (doc) + "\n" +
                    "\n" +
                    "--abc123\n" +
                    "\n" +
                    stuff + "\n" +
                    "--abc123--\n" +
                    "\n\n\n",
                beforeSend : beforeSend,
                complete : function (req)
                {
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
                        options.error (req.status, resp.error, resp.reason);
                    }
                    else
                    {
                        throw "The document could not be saved: " + resp.reason;
                    }
                }
            });
        },
    }
);
