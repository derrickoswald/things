/**
 * Node based metadata fetching subsystem for CouchDB.
 * External Node.js program using nano (https://github.com/dscape/nano) accessed
 * as described in externals (docs/externals.html) to add fetch metadata .torrent files for a things instance.
 */

var http = require ("http");
var https = require ("https");
var url = require ("url");
var zlib = require ("zlib");

/**
 * Command line arguments.
 * <em>not used yet</em>
 */
var args = process.argv.slice (2);

/**
 * The port that this HTTP server should listen on.
 */
var listen_port = 8099;

/**
 * The URL for CouchDB.
 * Value read from meta_fetcher/couchdb configuration.
 * Theoretically this could be constructed from daemons/httpsd, httpd/bind_address, httpd/port
 * except the bind address is usually 0.0.0.0 - which means 'any' and hence is not really available.
 */
var couchdb = "http://localhost:5984";

/**
 * The user (administrator) to connect as.
 * Value read from meta_fetcher/username configuration.
 */
var username = "admin";

/**
 * The user's password.
 * Value read from meta_fetcher/couchdb configuration.
 * NOTE: This should only be specified when *not* using proxy authentication.
 * NOTE: Using password authentication is not recommended because the
 * password is in plain text in the configuration file.
 */
var userpass = null;

/**
 * The user's role (or roles).
 * Value read from meta_fetcher/userrole configuration.
 * Only used with proxy authentication.
 */
var userrole = "_admin";

/**
 * The shared secret (32 character hexadecimal value).
 * Value read from couch_httpd_auth/secret configuration.
 * Only used with proxy authentication.
 * @see http://docs.couchdb.org/en/latest/api/server/authn.html#proxy-authentication
 */
var secret = null;

/**
 * Connection to CouchDB using nano.
 * @see https://github.com/dscape/nano
 */
var nano = null;

/**
 * Turn on nano logging if true.
 */
var verbose = false;

/**
 * Issue reports and messages if true.
 */
var debug = true;

/**
 * The number of milliseconds between polls.
 */
var poll_interval = 60000;

/**
 * The Interval object returned from setInterval.
 * This needs to be cleaned up when exiting.
 */
var interval = null;

/**
 * Configuration cache.
 */
var configurations = null;

/**
 * Configuration changes feed.
 */
var configuration_feed = null;

/**
 * Deluge proxy URL.
 * Corresponds to http://localhost:8112/json as proxied by couchdb
 * i.e. this line has been added under the [httpd_global_handlers] section:
 * <code>json = {couch_httpd_proxy, handle_proxy_req, &lt;&lt;"http://localhost:8112"&gt;&gt;}</code>
 * NOTE: the json name is not optional, since the cookie contains the path /json and hence
 * will only match through the proxy if the trigger path is also json, hence the /json/json
 */
var deluge_proxy = "/json/json";

/**
 * Deluge cookies.
 * After a successful login, we can use these cookies (usually only one) for authentication.
 */
var deluge_cookies = null;

/**
 * Sequential numbering for deluge requests.
 */
var deluge_sequence = 0;

/// Begin sha1.js

/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

/*
 * Configurable variables. You may need to tweak these to be compatible with
 * other programs, but the defaults work in most cases.
 */
var hexcase = 0; /* hex output format. 0 - lowercase; 1 - uppercase */
var chrsz = 8; /* bits per input character. 8 - ASCII; 16 - Unicode */

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally to
 * work around bugs in some JS interpreters.
 */
function safe_add (x, y)
{
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);

    return ((msw << 16) | (lsw & 0xFFFF));
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt (t)
{
    return ((t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514);
}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft (t, b, c, d)
{
    if (t < 20)
        return (b & c) | ((~b) & d);
    if (t < 40)
        return b ^ c ^ d;
    if (t < 60)
        return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol (num, cnt)
{
    return ((num << cnt) | (num >>> (32 - cnt)));
}

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1 (x, len)
{
    /* append padding */
    x[len >> 5] |= 0x80 << (24 - len % 32);
    x[((len + 64 >> 9) << 4) + 15] = len;

    var w = Array (80);
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;
    var e = -1009589776;

    for (var i = 0; i < x.length; i += 16)
    {
        var olda = a;
        var oldb = b;
        var oldc = c;
        var oldd = d;
        var olde = e;

        for (var j = 0; j < 80; j++)
        {
            if (j < 16)
                w[j] = x[i + j];
            else
                w[j] = rol (w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
            var t = safe_add (safe_add (rol (a, 5), sha1_ft (j, b, c, d)), safe_add (safe_add (e, w[j]), sha1_kt (j)));
            e = d;
            d = c;
            c = rol (b, 30);
            b = a;
            a = t;
        }

        a = safe_add (a, olda);
        b = safe_add (b, oldb);
        c = safe_add (c, oldc);
        d = safe_add (d, oldd);
        e = safe_add (e, olde);
    }

    return (Array (a, b, c, d, e));
}

/*
 * Convert an 8-bit or 16-bit string to an array of big-endian words In 8-bit
 * function, characters >255 have their hi-byte silently ignored.
 */
function str2binb (str)
{
    var ret;

    ret = Array ();
    var mask = (1 << chrsz) - 1;
    for (var i = 0; i < str.length * chrsz; i += chrsz)
        ret[i >> 5] |= (str.charCodeAt (i / chrsz) & mask) << (32 - chrsz - i % 32);

    return (ret);
}

/*
 * Calculate the HMAC-SHA1 of a key and some data
 */
function core_hmac_sha1 (key, data)
{
    var bkey = str2binb (key);
    if (bkey.length > 16)
        bkey = core_sha1 (bkey, key.length * chrsz);

    var ipad = Array (16), opad = Array (16);
    for (var i = 0; i < 16; i++)
    {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5C5C5C5C;
    }

    var hash = core_sha1 (ipad.concat (str2binb (data)), 512 + data.length * chrsz);

    return (core_sha1 (opad.concat (hash), 512 + 160));
}

/*
 * Convert an array of big-endian words to a hex string.
 */
function binb2hex (binarray)
{
    var ret;

    var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
    ret = "";
    for (var i = 0; i < binarray.length * 4; i++)
        ret += hex_tab.charAt ((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) + hex_tab.charAt ((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);

    return (ret);
}

/// End sha1.js

/**
 * Initialize nano.
 */
function need_nano (cookie)
{
    var options =
    {
        url: couchdb,
        parseUrl: false
    };
    if (verbose)
        options.log = function (id, message)
        {
            var prefix;
            var suffix;

            if (id)
                prefix = JSON.stringify (id) + ": ";
            else
                prefix = "";
            if (message)
                suffix = JSON.stringify (message);
            else
                suffix = "";
            console.log (JSON.stringify (["log", prefix + suffix]));
        };
    if (secret)
        options.requestDefaults =
        {
            headers:
            {
                "X-Auth-CouchDB-UserName": username,
                "X-Auth-CouchDB-Roles": userrole,
                "X-Auth-CouchDB-Token": binb2hex (core_hmac_sha1 (secret, username))
            }
        };

    if (cookie)
        options.cookie = cookie;
    return (require ("nano")(options));
}

/**
 * Send a log message to be included in CouchDB's log files.
 */
var log = function (mesg)
{
    console.log (JSON.stringify (["log", mesg]));
};

function eat_cookie (headers)
{
    // change the cookie if couchdb tells us to
    if (headers && headers["set-cookie"])
        nano = need_nano (headers["set-cookie"]);
}

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

function my_function (options)
{
    log ("my_function ()");
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
            if (err)
            {
                options.response.writeHead (500, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (err, null, 4) + "\n");
            }
            else
            {
                eat_cookie (headers);
                options.response.writeHead (200, {"Content-Type": "text/plain"});
                options.response.end (JSON.stringify (body, null, 4) + "\n");
            }
        }
    );
}

/**
 * Issue a log message with the current configurations.
 */
function log_configurations ()
{
    var report;

    report = "";
    for (var i = 0; i < configurations.length; i++)
    {
        if ("" != report)
            report += ", ";
        report += configurations[i].instance_name + " " + configurations[i]._rev;
    }
    log ("Configurations: " + report);
}

/**
 * Get the configurations.
 * Get all configurations once and monitor the changes feed.
 */
function get_configurations ()
{
    var configuration;

    // turn off any existing continuous feed
    if (null != configuration_feed)
    {
        configuration_feed.stop ();
        configuration_feed = null;
    }

    configuration = nano.db.use ("configuration");
    configuration.get
    (
        "_all_docs",
        {
            include_docs: true
        },
        function (err, body, headers)
        {
            if (err)
                log ("failed to get configuration/_all_docs");
            else
            {
//{"id":"andy_configuration","key":"andy_configuration","value":{"rev":"3-5a4ee47038c53e6835797bcd1144ab92"},
//    "doc":{"_id":"andy_configuration","_rev":"3-5a4ee47038c53e6835797bcd1144ab92","local_database":"andy_local",
//        "pending_database":"andy_pending","public_database":"andy_public","tracker_database":"thing_tracker",
//        "instance_name":"Andrew'sThings","instance_uuid":"aca8072effca552a5103132630001126","keybase_username":"andy",
// "deluge_password":"deluge","torrent_directory":null,"deluge_couch_url":"http://127.0.0.1:5984","upstream_things":"http://thingtracker.no-ip.org/root/things/"}},

                // store the global list of configuration documents
                eat_cookie (headers);
                configurations = body.rows.reduce
                (
                    function (list, item)
                    {
                        if ("_" != item.id.charAt (0))
                            list.push (item.doc);

                        return (list);
                    },
                    []
                );

                // report if debugging
                if (debug)
                    log_configurations ();

                // monitor the changes
                configuration_feed = configuration.follow
                (
                    {
                        since: "now",
                        include_docs: true,
                        heartbeat: 3 * 60 * 1000 // three minutes
                    }
                );
                configuration_feed.on
                (
                    "change", // a change occurred; passed the change object from CouchDB
                    function (change)
                    {
                        var updated;

                        log ("configuration feed change: seq "  + change.seq + (change.deleted ? " deleted " : " updated ") + change.doc.instance_name + " uuid " + change.doc.instance_uuid);
                        log ("change: " + JSON.stringify (change, null, 4));
                        if ("_" != change.doc._id.charAt (0))
                        {
                            updated = false;
                            configurations = configurations.reduce
                            (
                                function (ret, item)
                                {
                                    if (item._id == change.doc._id)
                                    {
                                        updated = true;
                                        if (!change.deleted)
                                            ret.push (change.doc);
                                    }
                                    else
                                        ret.push (item);

                                    return (ret);
                                },
                                []
                            );
                            if (!updated)
                                configurations.push (change.doc);
                            log_configurations ();
                        }
                    }
                );

                if (debug)
                {
                    configuration_feed.on
                    (
                        "start", // before any i/o occurs
                        function ()
                        {
                            log ("configuration feed start");
                        }
                    );
                    configuration_feed.on
                    (
                        "confirm_request", // database confirmation request is sent; passed the request object
                        function (req)
                        {
                            log ("configuration feed confirm_request: "+ JSON.stringify (req, null, 4));
                        }
                    );
                    configuration_feed.on
                    (
                        "confirm", // the database is confirmed; passed the couch database object
                        function (db_obj)
                        {
                            log ("configuration feed database confirmed: " + JSON.stringify (db_obj, null, 4));
                        }
                    );
                    configuration_feed.on
                    (
                        "catchup", // feed has caught up to the update_seq from the confirm step (assuming no subsequent changes, you have seen all the data)
                        function (seq_id)
                        {
                            log ("configuration feed catchup: " + seq_id);
                        }
                    );
                    configuration_feed.on
                    (
                        "wait", // follow is idle, waiting for the next data chunk from CouchDB
                        function ()
                        {
                            // about 1 minute wait intervals - not sure how to affect that
                            log ("configuration feed wait");
                        }
                    );
                    configuration_feed.on
                    (
                        "timeout", // follow did not receive a heartbeat from couch in time (the passed object has .elapsed_ms set to the elapsed time)
                        function (info)
                        {
                            log ("configuration feed timeout: " + JSON.stringify (info, null, 4));
                        }
                    );
                    configuration_feed.on
                    (
                        "retry", // retry is scheduled (usually after a timeout or disconnection)
                        function (info)
                        {
                            //    the passed object has
                            //        .since the current sequence id
                            //        .after the milliseconds to wait before the request occurs (on an exponential fallback schedule)
                            //        .db the database url (scrubbed of basic auth credentials)
                            log ("configuration feed retry: " + JSON.stringify (info, null, 4));
                        }
                    );
                    configuration_feed.on
                    (
                        "stop", // feed is stopping, because of an error, or because you called feed.stop()
                        function ()
                        {
                            log ("configuration feed stop");
                        }
                    );
                    configuration_feed.on
                    (
                        "error", // an error occurred
                        function (err)
                        {
                            log ("configuration feed error: " + JSON.stringify (err, null, 4));
                        }
                    );
                }

                configuration_feed.follow ();
            }
        }
    );
}

/**
 * Get the default (installed) configuration.
 * @returns the configuration or <code>null</code> if not found
 */
function get_default_configuration ()
{
    var ret;

    ret = null;
    if (null != configurations)
        ret = configurations.reduce
        (
            function (item, ret)
            {
                return (ret || (item._id == "default_configuration") ? item : null);
            },
            null
        );

    return (ret);
}

/**
 * Get the tracker database name.
 * @returns the name or <code>null</code> if not found
 */
function get_tracker_database ()
{
    var def;

    return ((null == (def = get_default_configuration ())) ? null : def.tracker_database);
}

/**
 * Process things by either adding them to Deluge's queue or add their metadata into the database.
 * @param {Object} candidates - contains database and document properties
 * @param {Object[]} torrents - the list of torrents already being handled in Deluge
 */
function process_candidates (candidates, torrents)
{
    candidates.forEach
    (
        function (item, index, array)
        {
            // get the documents currently in the database, i.e. already fetched
            nano.request
            (
                {
                    db: item.database,
                    doc: "_all_docs",
                    method: "get"
                },
                function (err, body, headers)
                {
                    if (err)
                        log ("failed to get all documents for " + item.database);
                    else
                    {
                        eat_cookie (headers);
                        // make a list of the names of existing documents
                        var fetched = body.rows.reduce
                        (
                            function (ret, item)
                            {
                                if ("_" !== item.charAt (0))
                                    ret.push (item);

                                return (ret);
                            },
                            []
                        );

                        // now make a list of documents that should exist but don't
                        // as the difference between the already fetched list and the thing tracker things list
                        var missing = item.document.things.reduce
                        (
                            function (ret, item)
                            {
                                if (-1 == fetched.indexOf (item.id))
                                    ret.push (item);

                                return (ret);
                            },
                            []
                        );

                        if (0 != missing.length)
                        {
                            // report if debugging
                            if (debug)
                            {
                                var report = "";
                                for (var i = 0; i < missing.length; i++)
                                {
                                    if ("" != report)
                                        report += ",";
                                    report += "\n" + JSON.stringify (missing[i]);
                                }
                                log ("Missing from " + item.document.name + ": " + report);
                            }

                            // find the missing ones where a torrent has been requested (and maybe downloaded)
                            var work = missing.reduce
                            (
                                function (ret, item)
                                {
                                    var torrent = torrents[item.id];
                                    if (null == torrent)
                                        ret.unrequested.push (item);
                                    else
                                        ret.requested.push (item);

                                    return (ret);
                                },
                                { unrequested: [], requested: [] }
                            );

                            // report if debugging
                            if (debug && (0 != work.unrequested.length))
                            {
                                var report = "";
                                for (var i = 0; i < work.unrequested.length; i++)
                                {
                                    if ("" != report)
                                        report += ",";
                                    report += "\n" + JSON.stringify (work.unrequested[i]);
                                }
                                log ("Unrequested for " + item.document.name + ": " + report);
                            }
                            if (debug && (0 != work.requested.length))
                            {
                                var report = "";
                                for (var i = 0; i < work.requested.length; i++)
                                {
                                    if ("" != report)
                                        report += ",";
                                    report += "\n" + JSON.stringify (work.requested[i]);
                                }
                                log ("Requested for " + item.document.name + ": " + report);
                            }

                            // ready to process
                            // for each item in the requested list,
                            // if status is seeding or queued
                            // get the .torrent file and load it into the database
                            // for each item in the unrequested list,
                            // add magnet file to deluge
                        }
                    }
                }
            );
        }
    );
}

function process_missing (candidates)
{
    deluge_torrents
    (
        {
            success: function (torrents)
            {
                if (debug)
                {
                    var names = [];
                    for (property in torrents)
                        names.push (property);
                    log ("deluge_torrents success: " + JSON.stringify (names.join (", "), null, 4));
                }
                process_candidates (candidates, torrents);
            },
            error: function (error)
            {
                if (debug)
                    log ("deluge_torrents error: " + JSON.stringify (error, null, 4));
                log ("failed to fetch torrents from Deluge");
            }
        }
    );
}

/**
 * Process trackers.
 */
function process_trackers (trackers)
{
    // get all databases
    nano.db.list // same as $.couch.allDbs
    (
        function (err, body, headers)
        {
            if (err)
                log ("couldn't get all databases");
            else
            {
                // make a list of the names of databases
                var exclude = ["things", "configuration", get_tracker_database ()];
                var databases = body.reduce
                (
                    function (ret, item)
                    {
                        if (("_" !== item.charAt (0)) && (-1 == exclude.indexOf (item)))
                            ret.push (item);

                        return (ret);
                    },
                    []
                );

                // report if debugging
                if (debug)
                {
                    var report = "";
                    for (var i = 0; i < databases.length; i++)
                    {
                        if ("" != report)
                            report += ",";
                        report += "\n" + databases[i];
                    }
                    log ("Databases: " + report);
                }

                // determine which trackers are being auto-fetched
                // (i.e there is a database with a name that is the UUID of a tracker but with a "z" prefix)
                var candidates = trackers.reduce
                (
                    function (ret, item, index, tks)
                    {
                        var name = "z" + item._id;
                        if (-1 != databases.indexOf (name))
                            ret.push ({ database: name, document: item });

                        return (ret);
                    },
                    []
                );

                // process candidates
                if (0 != candidates.length)
                {
                    // report if debugging
                    if (debug)
                    {
                        var report = "";
                        for (var i = 0; i < candidates.length; i++)
                        {
                            if ("" != report)
                                report += ",";
                            report += "\n" + candidates[i].database + " " + candidates[i].document.name;
                        }
                        log ("Candidates: " + report);
                    }
                    process_missing (candidates);
                }
            }
        }
    );
}

/**
 * Check for new things to fetch.
 */
function check_things ()
{
    var db;
    var thing_tracker;

    db = get_tracker_database ();
    if (null != db)
    {
        thing_tracker = nano.db.use (db);
        thing_tracker.get
        (
            "_all_docs",
            {
                include_docs: true // ToDo: could optimize this and first just fetch the document names and then get the contents one by one
            },
            function (err, body, headers)
            {
                if (err)
                    log ("failed to get " + get_tracker_database () + "/_all_docs");
                else
                {
// {"id":"2bfcb62ac1b0338cac0c993076d240a9","key":"2bfcb62ac1b0338cac0c993076d240a9","value":{"rev":"10-6fca97964c78e4070cf6409870858251"},
// "doc":{"_id":"2bfcb62ac1b0338cac0c993076d240a9","_rev":"10-6fca97964c78e4070cf6409870858251","version":1.0500000000000000444,
// "url":"http://thingtracker.no-ip.org/","things_url":"http://thingtracker.no-ip.org/root/things/",
// "public_url":"http://thingtracker.no-ip.org/root/public_things/","tracker_url":"http://thingtracker.no-ip.org/root/thing_tracker/",
// "name":"Raspberry Pi Things","owner":"derrickoswald",
// "things":[{"id":"6e064c7ecd7ad8e8dee199bcaffd21484b83c6ba","title":"Hinged Smart Citizen Kit Case with Air Vents"},{"id":"de62b9f518676fc3c55cec08d590ae8bbf79d83e","title":"Case for Raspberry Pi model B"}]}}

                    // get a list of trackers
                    eat_cookie (headers);
                    var documents = body.rows.reduce
                    (
                        function (list, item)
                        {
                            if ("_" != item.id.charAt (0))
                                list.push (item.doc);

                            return (list);
                        },
                        []
                    );

                    // process the trackers
                    if (0 != documents.length)
                    {
                        // report if debugging
                        if (debug)
                        {
                            var report = "";
                            for (var i = 0; i < documents.length; i++)
                            {
                                if ("" != report)
                                    report += ",";
                                report += "\n" + documents[i].name; // + ": " + JSON.stringify (documents[i].things, null, 4);
                            }
                            log ("Trackers: " + report);
                        }

                        process_trackers (documents);
                    }
                }
            }
        );
    }
}

/**
 * Parse a URL.
 *    parseLocation ("http://example.com:3000/pathname/?search=test#hash") =>
 *    {
 *        "protocol": "http:",
 *        "host": "example.com:3000",
 *        "hostname": "example.com",
 *        "port": "3000",
 *        "pathname": "/pathname/",
 *        "search": "?search=test",
 *        "hash": "#hash"
 *    }
 */
function parseLocation (href)
{
    var regexp;
    var match;

    // ToDo: username and password ?
    regexp = /^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*|)(\?[^#]*|)(#.*|)$/;
//    var parts = [
//        "^(https?:)//", // protocol
//        "(([^:/?#]*)(?::([0-9]+))?)", // host (hostname and port)
//        "(/[^?#]*|)", // pathname
//        "(\\?[^#]*|)", // search
//        "(#.*|)$" // hash
//    ];
//    regexp = new RegExp (parts.join (""));
    match = href.match (regexp);
    return (
        match &&
        {
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        }
    );
}

/**
 * Response decompressor.
 * @param {string} method - the method being used (for error messages)
 * @param {object} callbacks - options to process the success() or error()
 * @param {object} err - the (undocumented) zlib error object
 * @param {object} decoded - the (undocumented) zlib decoded data
 */
function decompression_handler (method, callbacks, err, decoded)
{
    var json;
    var parsed;

    if (err)
    {
        if (debug)
            log ("Deluge response " + method + " error: " + JSON.stringify (err, null, 4));
        callbacks.error ({message: err});
    }
    else
    {
        json = decoded.toString ();
        if (debug)
            log ("Deluge response: " + json.substring (0, 128) + (json.length > 128 ? "..." : ""));
        parsed = JSON.parse (json);
        callbacks.success (parsed);
    }
}

/**
 * Handle Deluge response.
 * @param {object} callbacks - options to process the success() or error()
 * @param {object} res - the nodejs http/https response object
 */
function deluge_handler (callbacks, res)
{
    var cookies;
    var chunks = [];

    if (debug)
    {
        log ("Deluge result status code: " + res.statusCode);
        log ("Deluge result headers: " + JSON.stringify (res.headers));
    }
    if (200 == res.statusCode)
    {
        // "set-cookie":["_session_id=7c2b84e58b57932aa9320db5d3d880df2248; Expires=Fri, 16 Oct 2015 07:18:16 GMT; Path=/json"]
        cookies = res.headers["set-cookie"];
        if (null != cookies)
        {
            if (debug)
                log ("Deluge cookies: " + JSON.stringify (cookies, null, 4));
            deluge_cookies = JSON.parse (JSON.stringify (cookies, null, 4));
        }
    }
    else
        callbacks.error ({ message: "status code: " + res.statusCode });
    res.on
    (
        "data",
        function (chunk)
        {
            chunks.push (chunk);
        }
    );
    res.on
    (
        "end",
        function ()
        {
            var buffer;
            var encoding;

            buffer = Buffer.concat (chunks);
            encoding = res.headers["content-encoding"];
            if (debug)
                log ("Deluge response encoding: " + encoding);
            if (encoding == "gzip")
                zlib.gunzip
                (
                    buffer,
                    decompression_handler.bind (this, "gunzip", callbacks)
                );
            else if (encoding == "deflate")
                zlib.inflate
                (
                    buffer,
                    decompression_handler.bind (this, "inflate", callbacks)
                );
            else
                decompression_handler (null, callbacks, null, buffer);
        }
    );
};

/**
 * Perform a Deluge API call.
 * @param {object} data - the JSON data to POST to Deluge
 * @param {object} callbacks - options to process the login:
 * <pre>
 * success: function() to call when the user is logged in
 * error: function to call when a problem occurs or the user is not logged in
 * </pre>
 * @returns the request object
 */
function deluge_call (data, callbacks)
{
    var url;
    var options;
    var handler;
    var request;

    data = JSON.stringify (data, null, 4);
    url = parseLocation (couchdb + deluge_proxy);
    if (debug)
        log ("Deluge proxy: " + JSON.stringify (url, null, 4));
        // {protocol: "http:", host: "localhost:5984", hostname: "localhost", port: "5984", pathname: "/json/json"…}
    options =
    {
        hostname: url.hostname,
        port: url.port ? Number (url.port) : (url.protocol == "http:" ? 80 : 443),
        path: url.pathname,
        method: "POST",
        headers:
        {
            "content-type": "application/json",
            "content-length": data.length,
            "accept": "application/json",
            "accept-encoding" : "gzip,deflate",
            "connection": "keep-alive"
        }
    };
    if (null != deluge_cookies)
        options.headers["cookie"] = deluge_cookies;
    handler = deluge_handler.bind (this, callbacks);
    request = url.protocol == "http:" ? http.request (options, handler) : https.request (options, handler);
    request.on
    (
        "error",
        callbacks.error
    );

    // write data to request body
    request.write (data);
    request.end ();

    return (request);
}

/**
 * Get the magic cookie from the deluge-web API.
 * @param {string} password - secret password
 * @param {object} callbacks - options to process the login:
 * <pre>
 * success: function() to call when the user is logged in
 * error: function to call when a problem occurs or the user is not logged in
 * </pre>
 * @return <em>nothing</em>
 * @function deluge_login
 */
function deluge_login (password, callbacks)
{
    var data = { method: "auth.login", params: [password], id: ++deluge_sequence };
    deluge_call (data, callbacks);
}

function deluge_torrents (callbacks)
{
    var data =
    {
        method: "web.update_ui",
        params:
        [
            [
                "queue",
                "name",
                "total_size",
                "state",
                "progress",
                "num_seeds",
                "total_seeds",
                "num_peers",
                "total_peers",
                "download_payload_rate",
                "upload_payload_rate",
                "eta",
                "ratio",
                "distributed_copies",
                "is_auto_managed",
                "time_added",
                "tracker_host",
                "save_path",
                "total_done",
                "total_uploaded",
                "max_download_speed",
                "max_upload_speed",
                "seeds_peers_ratio"
            ],
            {}
        ],
        id: ++deluge_sequence
    };
    deluge_call
    (
        data,
        {
            success: function (response)
            {
                if (response.result)
                    callbacks.success (response.result.torrents);
                else
                    callbacks.error (response.error);
            },
            error: callbacks.error
        }
    );
}

/*
 * Function to be called each poll.
 */
function my_thread ()
{
    try
    {
        // get the configurations
        if (null == configurations)
            get_configurations ();
        else if (null == deluge_cookies)
        {
            if (deluge_sequence < 5) // try to login 5 times
            {
                var def = get_default_configuration ();
                if (def != null)
                    deluge_login
                    (
                        def.deluge_password,
                        {
                            success: function (response)
                            {
                                if (debug)
                                    log ("deluge_login success: " + JSON.stringify (response, null, 4));
                                if (response.result)
                                    log ("successfully logged in to Deluge");
                            },
                            error: function (error)
                            {
                                if (debug)
                                    log ("deluge_login error: " + JSON.stringify (error, null, 4));
                                log ("failed to log in to Deluge");
                            }
                        }
                    );
            }
        }
        else
            check_things ();
    }
    catch (exception)
    {
        log (String (exception));
    }
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
        log (JSON.stringify (query, null, 4));
        try
        {
            // there are two ways to authenticate, 1) username and password or 2) proxy authentication
            if (userpass) // userpass specified means 1)
                login
                (
                    my_function.bind
                    (
                        this,
                        {
                            request: req,
                            response: resp
                        }
                    )
                );
            else // no userpass specified means 2)
                my_function
                (
                    {
                        request: req,
                        response: resp
                    }
                );
        }
        catch (exception)
        {
            resp.writeHead (500, {"Content-Type": "text/plain"});
            resp.end (JSON.stringify (exception, null, 4) + "\n");
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
        var section;
        var reconnect = false;
        var relisten = false;

        section = JSON.parse (data);
        if (section.listen_port)
        {
            listen_port = parseInt (section.listen_port);
            relisten = true;
        }
        if (section.username)
        {
            username = section.username;
            reconnect = true;
        }
        if (section.password)
        {
            userpass = section.password;
            reconnect = true;
        }
        if (section.userrole)
        {
            userrole = section.userrole;
            reconnect = true;
        }
        if (section.couchdb)
        {
            couchdb = section.couchdb;
            reconnect = true;
        }
        if (section.secret)
        {
            secret = section.secret;
            reconnect = true;
        }

        if (section.verbose)
        {
            verbose = section.verbose;
            reconnect = true;
        }

        if (section.debug)
        {
            debug = section.debug;
            reconnect = true;
        }

        if (section.poll_interval)
        {
            poll_interval = section.poll_interval;
            reconnect = true;
        }

        if (reconnect)
        {
            nano = need_nano ();
            log ("using " + couchdb + " as user " + username + (secret ? "[" + userrole + "]" : "") + (userpass ? "/" + userpass.replace (/./g, "*") : ""));

            // start the background processing
            if (null != interval)
            {
                log ("clearing background thread");
                clearInterval (interval);
                interval = null;
            }
            log ("starting background thread with an interval of " + (poll_interval / 1000.0) + " seconds");
            interval = setInterval (my_thread, poll_interval); // [, arg][, ...])
        }
        if (relisten)
        {
            server.listen (listen_port);
            log ("listening on port " + listen_port);
        }
        if ((null == secret) && (null == userpass))
            // ask for the secret
            console.log (JSON.stringify (["get", "couch_httpd_auth"]));
    }
);

stdin.on
(
    "end",
    function ()
    {
        if (null != interval)
            clearInterval (interval);
        interval = null;
        process.exit (0);
    }
);

// send the request for the port to listen on and credentials
console.log (JSON.stringify (["get", "meta_fetcher"]));

