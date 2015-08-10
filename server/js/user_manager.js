
/**
 * Node based user manager for CouchDB.
 * External Node.js program using nano (https://github.com/dscape/nano) accessed
 * as described in externals (docs/externals.html) to add users to things instance.
 */

var http = require ("http");
var https = require ("https");
var sys = require ("sys");
var url = require ("url");
var nano = require ("nano")({ url: "http://localhost:5984" });

var username = "admin";
var userpass = "secret";

/**
 * Send a log message to be included in CouchDB's log files.
 */
var log = function (mesg)
{
    console.log (JSON.stringify (["log", mesg]));
};

// expected views in a things database
var standard_views =
    {
        // view of only "things" (that have an info section) in the database
        things:
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

// security document limiting CRUD to the owning user
var standard_security =
{
    _id: "_security",
    admins:
    {
        names:
        [
            "admin"
        ],
        roles:
        [
            "_admin"
        ]
    },
    members:
    {
        names: [ ], // TBD
        roles: [ ]
    }
};

function eat_cookie (headers)
{
    // change the cookie if couchdb tells us to
    if (headers && headers["set-cookie"])
        nano = require ("nano")
        (
            {
                url : "http://localhost:5984",
                cookie: headers["set-cookie"]
            }
        );
}

function keybase_test (req, resp)
{
    var username = "joe";
    var keybase = "keybase.io";
    var keybase_lookup = "/_/api/1.0/user/lookup.json?usernames=" + username;
    var options =
    {
        hostname: keybase,
        port: 443,
        path: keybase_lookup,
        method: "GET"
    };

    var request = https.request
    (
        options,
        function (response)
        {
            response.on
            (
                "data",
                function (data)
                {
                    resp.writeHead (200, {"Content-Type": "text/plain"});
                    resp.end (data + "\n");
                }
            );
        }
    );
    request.end ();
    
    request.on (
        "error",
            function(e)
            {
                log (e);
            }
        );
};

function dblist_test (req, resp)
{
    nano.db.list
    (
        function (err, body, header)
        {
            var dbs = "";
            body.forEach
            (
                function (db)
                {
                    if ("" != dbs)
                        dbs += ", ";
                    dbs += db;
                }
            );
            resp.writeHead (200, {"Content-Type": "text/plain"});
            resp.end (dbs + "\n");
        }
    );
};

function login (callback)
{
    nano.session
    (
        function (err, body, headers)
        {
            if (err)
                log ("get session failed");
            else
                if (!body.userCtx.name) // not logged in
                    nano.auth
                    (
                        username,
                        userpass,
                        function (err, body, headers)
                        {
                            if (err)
                                log ("login as " + username + " failed: " + err);
                            else
                            {
                                log ("login as " + username + " was successful");
                                eat_cookie (headers);
                                callback ();
                            }
                        }
                    );
                else
                    callback ();
        }
    );
}

function get_uuid (options)
{
    // get a uuid for the new instance
    nano.request
    (
        {
            db: "_uuids",
            method: "get",
            params: { count: 1 }
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                options.document.instance_uuid = body.uuids[0];
                var configuration = nano.use ("configuration");
                configuration.insert
                (
                    options.document,
                    function (err, body, headers)
                    {
                        if (err)
                        {
                            options.response.writeHead (500, {"Content-Type": "text/plain"});
                            options.response.end (JSON.stringify (err, null, 4) + "\n");
                        }
                        else
                        {
                            eat_cookie (headers);
                            options.response.writeHead (200, {"Content-Type": "text/plain"});
                            options.response.end ("User org.couchdb.user:" + options.username + " created.\n");
                        }
                    }
                );
            }
        }
    );
}

function make_configuration (options)
{
    var configuration = nano.use ("configuration");
    configuration.get
    (
        "default_configuration",
        {},
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                body._id = options.configuration;
                delete body._rev;
                delete body.keybase_username;
                body.instance_name = options.username;
                body.local_database = options.local_database;
                body.public_database = options.public_database;
                body.pending_database = options.pending_database;
//                body.torrent_directory = ??
                options.document = body;
                get_uuid (options);
            }
        }
    );
}

function make_pending (options)
{
    options.pending_database = options.username + "_pending";
    nano.request
    (
        {
            db: options.pending_database,
            method: "put"
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.pending_database,
                    views: standard_views,
                };
                nano.request
                (
                    {
                        db: options.pending_database,
                        path: doc._id,
                        method: "put",
                        body: doc
                    },
                    function (err, body, headers)
                    {
                        if (err)
                        {
                            options.response.writeHead (500, {"Content-Type": "text/plain"});
                            options.response.end (JSON.stringify (err, null, 4) + "\n");
                        }
                        else
                        {
                            eat_cookie (headers);
                            make_configuration (options);
                        }
                    }
                );
            }
        }
    );
}

function make_public (options)
{
    options.public_database = options.username + "_public";
    nano.request
    (
        {
            db: options.public_database,
            method: "put"
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.public_database,
                    views: standard_views,
                    validate_doc_update: standard_validation
                };
                nano.request
                (
                    {
                        db: options.public_database,
                        path: doc._id,
                        method: "put",
                        body: doc
                    },
                    function (err, body, headers)
                    {
                        if (err)
                        {
                            options.response.writeHead (500, {"Content-Type": "text/plain"});
                            options.response.end (JSON.stringify (err, null, 4) + "\n");
                        }
                        else
                        {
                            eat_cookie (headers);
                            make_pending (options);
                        }
                    }
                );
            }
        }
    );
}

function make_local (options)
{
    options.local_database = options.username + "_local";
    nano.request
    (
        {
            db: options.local_database,
            method: "put"
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                var doc =
                {
                    _id: "_design/" + options.local_database,
                    views: standard_views,
                    validate_doc_update: standard_validation
                };
                nano.request
                (
                    {
                        db: options.local_database,
                        path: doc._id,
                        method: "put",
                        body: doc
                    },
                    function (err, body, headers)
                    {
                        if (err)
                        {
                            options.response.writeHead (500, {"Content-Type": "text/plain"});
                            options.response.end (JSON.stringify (err, null, 4) + "\n");
                        }
                        else
                        {
                            eat_cookie (headers);
                            var security = JSON.parse (JSON.stringify (standard_security));
                            security.members.names.push (options.username);
                            nano.request
                            (
                                {
                                    db: options.local_database,
                                    path: security._id,
                                    method: "put",
                                    body: security
                                },
                                function (err, body, headers)
                                {
                                    if (err)
                                    {
                                        options.response.writeHead (500, {"Content-Type": "text/plain"});
                                        options.response.end (JSON.stringify (err, null, 4) + "\n");
                                    }
                                    else
                                    {
                                        eat_cookie (headers);
                                        make_public (options);
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    );
}

function create_user (options)
{
    options.configuration = options.username + "_configuration";
    var data =
    {
        type: "user",
        name: options.username,
        roles: ["user"],
        password: options.password,
        configuration: options.configuration 
    };
    nano.request
    (
        {
            db: "_users",
            path: "org.couchdb.user:" + options.username,
            method: "put",
            body: data
        },
        function (err, body, headers)
        {
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                make_local (options); // which chains to make_public and make_pending
            }
        }
    );
}

function valid_name (name)
{
    // Only lowercase characters (a-z), digits (0-9), and any of the characters _, $, (, ), +, -, and / are allowed.
    // Must begin with a letter.
    var regex = /^[a-z](?:[a-z]|[0-9]|\_|\$|\(|\)|\+|\-|\/|)*$/;
    return (regex.test (name));  
}

function make_user (options)
{
    log ("make_user ('" + options.username + "', '" + options.password + "')\n");
    // get the current list of users
    nano.request
    (
        {
            db: "_users",
            doc: "_all_docs",
            method: "get"
        },
        function (err, body, headers)
        {
            var exists;
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                exists = false;
                for (var i = 0; i < body.rows.length; i++)
                {
                    if ("org.couchdb.user:" + options.username == body.rows[i].id)
                        exists = true;
                }
                if (exists)
                {
                    options.response.writeHead (409, {"Content-Type": "text/plain"});
                    options.response.end ("User org.couchdb.user:" + options.username + " already exists.\n");
                }
                else
                    create_user (options);
            }
        }
    );
}

/**
 * The HTTP server.
 */
var server = http.createServer
(
    function (req, resp)
    {
        log (req.method + " " + req.url);
        var query = url.parse (req.url, true).query;
        log (JSON.stringify (query, null, 4) + "\n");
        if (query.username && query.password)
        {
            if (valid_name (query.username))
                try
                {
                    login
                    (
                        make_user.bind
                        (
                            this,
                            {
                                request: req,
                                response: resp,
                                username: query.username,
                                password: query.password
                            }
                        )
                    );
                }
                catch (exception)
                {
                    options.response.writeHead (500, {"Content-Type": "text/plain"});
                    options.response.end (JSON.stringify (exception, null, 4) + "\n");
                }
            else
            {
                resp.writeHead (400, {"Content-Type": "text/plain"});
                resp.end ("Invalid name. User names must adhere to the CouchDB format for database names.\n");
            }
        }
        else
        {
            resp.writeHead (400, {"Content-Type": "text/plain"});
            resp.end ("Expected username and password.\n");
        }
    }
);

/**
 * Listen on standard input.
 */
var stdin = process.openStdin ();

stdin.on
(
    "data",
    function (data)
    {
        var section = JSON.parse (data);
        var port = parseInt (section.port);
        username = section.username;
        userpass = section.password;
        log ("listening on port " + port + " as user " + username + "/" + userpass.replace (/./g, "*") + "\n");
        server.listen (port);
    }
);

stdin.on
(
    "end",
    function ()
    {
        process.exit (0);
    }
);

// send the request for the port to listen on and credentials
console.log (JSON.stringify (["get", "user_manager"]));
