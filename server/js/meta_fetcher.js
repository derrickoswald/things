/**
 * Node based metadata fetching server for CouchDB.
 * External Node.js program using nano (https://github.com/dscape/nano) accessed
 * as described in externals (docs/externals.html) to add fetch metadata .torrent files for a things instance.
 */

var http = require ("http");
var https = require ("https");
var sys = require ("sys");
var url = require ("url");

/**
 * Command line arguments.
 * <em>not used yet</em>
 */
var args = process.argv.slice (2);

/**
 * The port that this server should listen on.
 */
var listen_port = 8099;

/**
 * The URL for the CouchDB server.
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
 * The number of milliseconds between polls of the server.
 */
var poll_interval = 60000;

/**
 * The Interval object returned from setInterval.
 * This needs to be cleaned up when exiting.
 */
var interval = null;

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
 * Configurable variables. You may need to tweak these to be compatible with the
 * server-side, but the defaults work in most cases.
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
        parseUrl: false,
        log: function (id, message)
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
        },
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
    log ("my_function ()\n");
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

/*
 * Function to be called each poll.
 */
function my_thread ()
{
    log ("my_thread () polled");
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
            options.response.writeHead (500, {"Content-Type": "text/plain"});
            options.response.end (JSON.stringify (exception, null, 4) + "\n");
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

        if (section.poll_interval)
        {
            poll_interval = section.poll_interval;
            reconnect = true;
        }

        if (reconnect)
        {
            nano = need_nano ();
            log ("using " + couchdb + " as user " + username + (secret ? "[" + userrole + "]" : "") + (userpass ? "/" + userpass.replace (/./g, "*") : "") + "\n");
            if (null != interval)
            {
                log ("clearing background thread\n");
                clearInterval (interval);
                interval = null;
            }
            log ("starting background thread with an interval of " + (poll_interval / 1000.0) + " seconds\n");
            interval = setInterval (my_thread, poll_interval); // [, arg][, ...])
        }
        if (relisten)
        {
            server.listen (listen_port);
            log ("listening on port " + listen_port + "\n");
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
