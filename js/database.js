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
                // view of only "things" (that have an info section) in the database
                Things:
                {
                    map: "function(doc) { if (doc.info) emit (doc._id, doc); }"
                }
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

        // view of only "trackers"
        var tracker_views =
        {
            Trackers:
            {
                map: "function(doc) { if (doc.things) emit (doc._id, doc); }"
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
        function make_insecure (name)
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
         * @function make_designdoc
         * @memberOf module:database
         */
        function make_designdoc (dbname, options, views, validation)
        {
            var doc =
            {
                _id: "_design/" + dbname,
            };
            if (views)
               doc.views = views;

            if (validation)
                doc.validate_doc_update = validation;
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
         * @function make_database
         * @memberOf module:database
         */
        function make_database (dbname, options, views, validation)
        {
            var original_fn;

            options = options || {};
            original_fn = options.success;
            if (views || validation)
                options.success = function ()
                {
                    if (original_fn)
                        options.success = original_fn;
                    else
                        delete options.success;
                    make_designdoc (dbname, options, views, validation);
                    databases = null;
                    update_database_state ();
                };
            $.couch.db (dbname).create (options);
        }

        return (
            {
                standard_views: standard_views,
                standard_validation: standard_validation,
                tracker_views: tracker_views,
                read_restricted: read_restricted,
                is_secure: is_secure,
                make_secure: make_secure,
                make_insecure: make_insecure,
                make_designdoc: make_designdoc,
                make_database: make_database,
            }
        );
    }
);
