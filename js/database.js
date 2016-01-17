/**
 * @fileOverview Create new databases.
 * @name database
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    [],
    /**
     * @summary Database creation functions.
     * @description Database create, view creation and security adjustment.
     * @name database
     * @exports database
     * @version 1.0
     */
    function ()
    {
        // expected views in a things database
        var standard_views =
        {
            // view to count documents
            count:
            {
                map:
                    "function map (doc)" +
                    "{" +
                        "emit (doc._id, 1);" +
                    "}",
                reduce:
                    "function reduce (keys, values)" +
                    "{" +
                        "return (sum (values));" +
                    "}"
            },

            // view of only "things" (that have an info section) in the database
            things:
            {
                map:
                    "function (doc)" +
                    "{" +
                        "if (doc.info)" +
                            "emit (doc._id, doc);" +
                    "}"
            }

        };

        // view of only "trackers"
        var tracker_views =
        {
            trackers:
            {
                map:
                    "function (doc)" +
                    "{" +
                        "if (doc.things)" +
                            "emit (doc._id, doc);" +
                    "}"
            }
        };

        var standard_lists =
        {
            thingtracker:
                "function (head, req)" +
                "{" +
                    "start" +
                    "(" +
                        "{" +
                            "\"headers\":" +
                            "{" +
                                "\"Content-Type\": \"application/json\"" +
                            "}" +
                        "}" +
                    ");" +
                    "send (\"{\\n    id: \\\"things\\\",\\n    things: [\\n\");" +
                    "var records = 0;" +
                    "while (row = getRow ())" +
                    "{" +
                        "if (0 != records)" +
                            "send (\",\\n\");" +
                        "var text = JSON.stringify (row.value, null, 4);" +
                        "text = \"        \" + text.replace (/\\n/g, \"\\n        \");" +
                        "send (text);" +
                        "records++;" +
                    "}" +
                    "send (\"\\n    ]\\n}\");" +
                "}"
        };

        var standard_shows =
        {
            thingtracker:
                "function (doc, req)" +
                "{" +
                    "var something = {" +
                                    "\"description\": \"An Example Thing Tracker.\"," +
                                    "\"things\":[" +
                                        "{" +
                                          "\"id\":\"cdebf011-e999-4dc5-b4c2-c4163f5584a0\"," +
                                          "\"title\": \"strandbeest\"," +
                                          "\"url\": \"http://garyhodgson.github.com/strandbeest\"," +
                                          "\"author\": \"Gary Hodgson\"" +
                                        "}," +
                                        "{" +
                                          "\"id\":\"f8736600-ff82-4a92-a5e9-fdeeeeb259fe\"," +
                                          "\"title\": \"Mechanical Movement #27\"," +
                                          "\"url\": \"http://garyhodgson.github.com/githubiverse-tst\"," +
                                          "\"author\": \"Gary Hodgson\"," +
                                          "\"license\": \"GPL3\"," +
                                          "\"tags\": [\"mechanical movement\", \"fun\"]," +
                                          "\"thumbnailUrl\": \"https://github.com/garyhodgson/githubiverse-tst/raw/master/img/test-jig.jpg\"," +
                                          "\"description\": \"An implementation of movement #27 from &quot;501 Mechanical Movements&quot; by Henry T. Brown.\\n\\nThis is still a work in progress.\"" +
                                        "}" +
                                    "]," +
                                    "\"trackers\":[" +
                                      "{" +
                                        "\"url\":\"http://reprap.development-tracker.info/thingtracker\"" +
                                      "}" +
                                    "]" +
                                  "};" +

                    "function output ()" +
                    "{" +
                        "var body;" +
                        "var ret;" +

                        "body = (null == doc) ? something : doc;" +
                        "ret = { 'body': JSON.stringify (body, null, 4), headers : { \"Content-Type\" : \"application/json\" } };" +

                        "return (ret);" +
                    "}" +
                    "provides ('json', output);" +
                "}"
        };

        // validation function limiting create, update and delete to logged in users
        var standard_validation =
            "function (newDoc, oldDoc, userCtx, secObj)" +
            "{" +
                "secObj.admins = secObj.admins || {};" +
                "secObj.admins.names = secObj.admins.names || [];" +
                "secObj.admins.roles = secObj.admins.roles || [];" +

                "var IS_DB_ADMIN = false;" +
                "if (~userCtx.roles.indexOf ('_admin'))" +
                    "IS_DB_ADMIN = true;" +
                "if (~secObj.admins.names.indexOf (userCtx.name))" +
                    "IS_DB_ADMIN = true;" +
                "for (var i = 0; i < userCtx.roles; i++)" +
                    "if (~secObj.admins.roles.indexOf (userCtx.roles[i]))" +
                        "IS_DB_ADMIN = true;" +

                "var IS_LOGGED_IN_USER = false;" +
                "if (null != userCtx.name)" +
                    "IS_LOGGED_IN_USER = true;" +

                "if (IS_DB_ADMIN || IS_LOGGED_IN_USER)" +
                    "log ('User : ' + userCtx.name + ' changing document: ' + newDoc._id);" +
                "else " +
                    "throw { 'forbidden': 'Only admins and users can alter documents' };" +
            "}";

        // standard full text search evaluation function
        var standard_search =
        {
            // all text content in default field, and everything in individual fields too
            search:
            {
                index:
                    "function (doc)" +
                    "{" +
                        "var ret;" +

                        "ret = new Document ();" +

                        "if (doc['created by'])" +
                        "{" +
                            "ret.add (doc['created by']);" +
                            "ret.add (doc['created by'], { field: 'created_by' });" +
                        "}" +
                        "if (doc['creation date'])" +
                            "ret.add (new Date (doc['creation date']), { type: 'date', field: 'creation_date' });" +

                        "if (doc.info)" +
                        "{" +
                            "if (doc.info.files)" +
                                "for (var f = 0; f < doc.info.files.length; f++)" +
                                "{" +
                                    "ret.add (doc.info.files[f].path[0]);" +
                                    "ret.add (doc.info.files[f].path[0], { field: 'file_name' });" +
                                    "ret.add (doc.info.files[f].length, { type: 'long', field: 'file_size' });" +
                                "}" +
                            "if (doc.info.name)" +
                            "{" +
                                "ret.add (doc.info.name);" +
                                "ret.add (doc.info.name, { field: 'name' });" +
                            "}" +
                            "if (doc.info.thing)" +
                            "{" +
                                "if (doc.info.thing.title)" +
                                "{" +
                                    "ret.add (doc.info.thing.title);" +
                                    "ret.add (doc.info.thing.title, { field: 'title' });" +
                                "}" +
                                "if (doc.info.thing.url)" +
                                "{" +
                                    "ret.add (doc.info.thing.url);" +
                                    "ret.add (doc.info.thing.url, { field: 'url' });" +
                                "}" +
                                "if (doc.info.thing.authors)" +
                                    "for (var a = 0; a < doc.info.thing.authors.length; a++)" +
                                    "{" +
                                        "ret.add (doc.info.thing.authors[a]);" +
                                        "ret.add (doc.info.thing.authors[a], { field: 'authors' });" +
                                    "}" +
                                "if (doc.info.thing.licenses)" +
                                    "for (var l = 0; l < doc.info.thing.licenses.length; l++)" +
                                    "{" +
                                        "ret.add (doc.info.thing.licenses[l]);" +
                                        "ret.add (doc.info.thing.licenses[l], { field: 'licenses' });" +
                                    "}" +
                                "if (doc.info.thing.tags)" +
                                    "for (var t = 0; t < doc.info.thing.tags.length; t++)" +
                                    "{" +
                                        "ret.add (doc.info.thing.tags[t]);" +
                                        "ret.add (doc.info.thing.tags[t], { field: 'tags', analyzer: 'keyword' });" +
                                    "}" +
                                "if (doc.info.thing.description)" +
                                "{" +
                                    "ret.add (doc.info.thing.description);" +
                                    "ret.add (doc.info.thing.description, { field: 'description' });" +
                                "}" +
                            "}" +
                        "}" +

                        "if (doc._attachments)" +
                            "for (var attachment in doc._attachments)" +
                            "{" +
                                "ret.attachment ('default', attachment);" +
                                "ret.attachment ('attachments', attachment);" +
                            "}" +

                        "return (ret);" +
                    "}"
            }
        };

        // security document limiting CRUD to the admin user
        var read_restricted =
        {
            "admins":
            {
                "names":
                [
                    "admin"
                ],
                "roles":
                [
                    "_admin"
                ]
            },
            "members":
            {
                "names":
                [
                    "admin"
                ],
                "roles":
                [
                    "_admin"
                ]
            }
        };

        /**
         * @summary Check if a database is secure.
         * @description Reads the _security document of a database and compares to empty array.
         * @param {string} name - the name of the database to check for security
         * @param {object} options - callback functions for the result, success: fn (boolean) and error: fn ()
         * @function is_secure
         * @memberOf module:database
         */
        function is_secure (name, options)
        {
            options = options || {};
            $.couch.db (name).openDoc
            (
                "_security",
                {
                    success: function (doc)
                    {
                        if (options.success)
                            if (doc)
                                options.success (("undefined" != typeof (doc.admins)) && (doc.admins.names.length !== 0));
                            else
                                options.success (false);
                    },
                    error: options.error
                }
            );
        }

        /**
         * @summary Make the local database secure by adding the _security document.
         * @description Stores a security policy that only allows an admin to
         * read and write the database.
         * @param {string} name - the name of the database to secure
         * @param {object} options - callback functions for the result, success: fn () and error: fn ()
         * @param {object} security - the security document
         * @function make_secure
         * @memberOf module:database
         */
        function make_secure (name, options, security)
        {
            options = options || {};
            if (("undefined" == typeof (security)) || (null == security))
                security = read_restricted;
            security = JSON.parse (JSON.stringify (security));
            security._id = "_security";
            $.couch.db (name).saveDoc
            (
                security,
                {
                    success: function ()
                    {
                        if (options.success)
                            options.success ();
                    },
                    error: function ()
                    {
                        if (options.error)
                            options.error ();
                    }
                }
            );
        }

        /**
         * @summary Remove the contents of the _security document from the local database.
         * @description Sets the security policy back to empty arrays
         *  - making the database insecure.
         * @param {string} name - the name of the database to make insecure
         * @param {object} options - callback functions for the result, success: fn () and error: fn (status)
         * @function make_insecure
         * @memberOf module:database
         */
        function make_insecure (name, options)
        {
            $.couch.db (name).openDoc
            (
                "_security",
                {
                    success: function (doc)
                    {
                        doc.admins =
                        {
                            names: [],
                            roles: []
                        };
                        doc.members =
                        {
                            names: [],
                            roles: []
                        };

                        $.couch.db (name).saveDoc
                        (
                            doc,
                            {
                                success: function ()
                                {
                                    if (options.success)
                                        options.success ();
                                },
                                error: function (status)
                                {
                                    if (options.error)
                                        options.error (status);
                                }
                            }
                        );
                    },
                    error: function (status)
                    {
                        alert (name + " _security fetch failed " + JSON.stringify (status, null, 4));
                    }
                }
            );

        }

        /**
         * @summary Creates the design document.
         * @description Creates the design document in the given database
         * with standard views and logged-in security.
         * @param {string} dbname - the name of the database to create the design document in
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @param {string} search - the full text search update functions
         * @function make_designdoc
         * @memberOf module:database
         */
        function make_designdoc (dbname, options, views, validation, search)
        {
            var doc =
            {
                _id: "_design/" + dbname
            };
            if (views)
               doc.views = views;
            if (validation)
                doc.validate_doc_update = validation;
            if (search)
                doc.fulltext = search;
            $.couch.db (dbname).saveDoc
            (
                doc,
                options
            );
        }

        /**
         * @summary Creates a database.
         * @description Creates the given database and optionally
         * adds standard views and logged-in security.
         * @param {string} dbname - the name of the database to create
         * @param {object} options - handlers (success and error) for response
         * @param {object} views - the views to add to the design document
         * @param {string} validation - the validate_doc_update function
         * @param {object} search - the search functions to add to the design document
         * @function make_database
         * @memberOf module:database
         */
        function make_database (dbname, options, views, validation, search)
        {
            var original_fn;

            options = options || {};
            original_fn = options.success;
            if (views || validation || search)
                options.success = function ()
                {
                    if (original_fn)
                        options.success = original_fn;
                    else
                        delete options.success;
                    make_designdoc (dbname, options, views, validation, search);
                };
            $.couch.db (dbname).create (options);
        }

        /**
         * @summary Deletes a database.
         * @description Removes the given database.
         * @param {string} dbname - the name of the database to create
         * @param {object} options - handlers (success and error) for response
         * @function delete_database
         * @memberOf module:database
         */
        function delete_database (dbname, options)
        {
            options = options || {};
            $.couch.db (dbname).drop (options);
        }

        return (
            {
                standard_views: standard_views,
                tracker_views: tracker_views,
                standard_lists: standard_lists,
                standard_shows: standard_shows,
                standard_validation: standard_validation,
                standard_search: standard_search,
                read_restricted: read_restricted,
                is_secure: is_secure,
                make_secure: make_secure,
                make_insecure: make_insecure,
                make_designdoc: make_designdoc,
                make_database: make_database,
                delete_database: delete_database
            }
        );
    }
);
