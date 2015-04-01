define
(
    ["mustache", "home"],
    function (mustache, home)
    {
        function make_designdoc (dbname, options, secure)
        {
            var doc =
            {
                _id: "_design/" + dbname,
                views: {
                    // view to count "things" (that have an info section) in the database
                    Count:
                    {
                        map: "function(doc) { if (doc.info)  emit (doc._id, 1); }",
                        reduce: "function (keys, values) { return (sum (values)); }"
                    },
                    // view of only "things" (that have an info section) in the database
                    Things:
                    {
                        map: "function(doc) { if (doc.info) emit (doc._id, doc); }"
                    }
                }
            };
            if (secure)
                doc.validate_doc_update =
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
            $.couch.db (dbname).saveDoc
            (
                doc,
                options
            );
        }

        function make_database (dbname, options, secure)
        {
            var original_fn = options.success;
            if (secure)
                options.success = function () { options.success = original_fn; secure_database (dbname, options); };
            $.couch.db (dbname).create (options);
        }

        // make the design document
        function make_design_doc ()
        {
            // todo: get "public_things" database name from configuration
            make_designdoc ("public_things", { success: function () { alert ("public_things database created"); }, error: function () { alert ("make design doc failed"); } }, true);
        }

        function make_public ()
        {
            // todo: get "public_things" database name from configuration
            make_database ("public_things", { success: make_design_doc, error: function () { alert ("database creation failed"); } });
        }

        function init ()
        {
            var middle_template =
                "<button id='create'>Create public_things</button>";
            var areas = home.layout ();
            areas.content.innerHTML = mustache.render (middle_template);
            document.getElementById ("create").onclick = make_public;
        }
        return (
            {
                initialize: init,
                make_designdoc: make_designdoc,
                make_database: make_database
            }
        );
    }
)