/**
 * @fileOverview Keybase interface.
 * @name keybase
 * @exports keybase
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration"],
    /**
     * @summary Functions for interacting with keybase.io.
     * @description User profile and security credentials.
     * @name keybase
     * @exports keybase
     * @version 1.0
     */
    function (configuration)
    {

        /**
         * Keybase URL with proxy prefix.
         * corresponds to https://keybase.io/_/api/1.0/ as proxied by couchdb
         */
        var URL = configuration.getDocumentRoot () + "/keybase/_/api/1.0/";
        // i.e. add this line under the [httpd_global_handlers] section:
        // keybase = {couch_httpd_proxy, handle_proxy_req, <<"https://keybase.io/">>}

        var CORS_URL = "https://keybase.io/_/api/1.0/";


        /**
         * @summary Make CORS request object.
         * @description Cross browser handler for CORS requests.
         * @param {string} method the type of request to be made
         * @param {string} url the URL for the request
         * @returns {object} the CORS capable object or <code>null</code> if the browser doesn't support CORS.
         */
        function createCORSRequest (method, url)
        {
            var ret;

            ret = new XMLHttpRequest ();
            if ("withCredentials" in ret) // "withCredentials" only exists on XMLHTTPRequest2 objects
                ret.open (method, url, true);
            else if ("undefined" != typeof (XDomainRequest)) // XDomainRequest only in IE
            {
                ret = new XDomainRequest ();
                ret.open (method, url);
            }
            else // CORS is not supported
                ret = null;

            return (ret);
        }

        // https://keybase.io/_/api/1.0/user/lookup.json?usernames=derrickoswald
//        derrick :
//        {
//            "status" :
//            {
//                "code" : 0,
//                "name" : "OK"
//            },
//            "them" : [
//            {
//                "id" : "78c6a4f0828791e5f17a74f267fb1e00",
//                "basics" :
//                {
//                    "username" : "derrickoswald",
//                    "ctime" : 1402690123,
//                    "mtime" : 1402690123,
//                    "id_version" : 48,
//                    "track_version" : 2,
//                    "last_id_change" : 1430146638
//                },
//                "profile" :
//                {
//                    "mtime" : 1407063388,
//                    "full_name" : "Derrick Oswald",
//                    "location" : "Bern, Switzerland",
//                    "bio" : "A Canadian electrical engineer, who graduated before computers were popularized, and wound up doing all aspects of software development for over 25 years, He recently started a firm, http://9code.ch, to develop Android, 3D printing, IoT and GIS apps."
//                },
//                "public_keys" :
//                {
//                    "primary" :
//                    {
//                        "kid" : "010171f070b412d66fb16ea74e1247e2c3b22af7f062cd7995bddf03d092af16e9ce0a",
//                        "key_type" : 1,
//                        "bundle" : "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1\n\n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\nvsacrmAySHuRc++ZHGUkwo6waQ==\n=gbqr\n-----END PGP PUBLIC KEY BLOCK-----",
//                        "mtime" : 1419194547,
//                        "ctime" : 1419194547,
//                        "ukbid" : "2f69d92ea437c7a877e0ec62dc06e011",
//                        "key_fingerprint" : "22541b35b1001ff72c9c8eb5b6e0cec3658010ef",
//                        "key_bits" : 4096,
//                        "key_algo" : 1,
//                        "signing_kid" : null,
//                        "key_level" : 0,
//                        "etime" : null,
//                        "eldest_kid" : null,
//                        "status" : 0,
//                        "self_signed" : true
//                    },
//                    "all_bundles" : [
//                                    "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1\n\n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\nvsacrmAySHuRc++ZHGUkwo6waQ==\n=gbqr\n-----END PGP PUBLIC KEY BLOCK-----",
//                                    "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: GnuPG v1\n\nmQENBFCtM4kBCADUYXnwoz35PO9pLXnHg/prmRhXaCeGy7noXtROey2ZBWJU0tEy\na+OEoNCfQO1fxaHtsJM+Vv0rnaPCWhqWpbkZR7u3Ns3mrtmgNhKIqOmeUACJ5rVj\nnMmPjWOuJ6bdWz+LChmm6L+oEJeSr+Ib3GPsNOFBe8BfBnabQ3QUliHiud5YBcuQ\n/2fBXhRGV/G0DLUPIrQfqwZVgjp+NK1FQ8iZwyuSz+g9sSDhQ75yJdN9bGSxkcon\nBMKU72onE4JwFjIRBJHuQXIY6HQKgrF6RllugiZyRWA3HgeWF/H3j2pijuXVwHgT\nP2+rseffCtS8Rf4ooY5W34lbhItnqIGUE6OZABEBAAG0PURlcnJpY2sgT3N3YWxk\nIChCZXJuLCBTd2l0emVybGFuZCkgPGRlcnJpY2sub3N3YWxkQGdtYWlsLmNvbT6J\nAT4EEwECACgCGw8GCwkIBwMCBhUIAgkKCwQWAgMBAh4BAheABQJSfMNOBQkDwT7n\nAAoJEE9rSA9/L5KOaDYH/0SOtKkA23H06H9mpvL54UMQzKhNSP705pdj/WSum1Ji\ny+XHSCDMA91uGGCx2QBBpDYgaImQ1N/rT7LMwmweDnMj7LDblBnb2Nl0FvmdVEtR\n/1PbMX34Wj1YYRe2fgt70+w/GbK2qsIi+qe2IBhL3dPdqXOXju7DBM8qlRKbr/Qv\nWl0tzeBCmQQqXCZK8y/q4taftI7SGrlMv6DT2oAKsemNojMllV417/dA0b115l02\nUAhyc207VqP1Ub0Gl8GocrAZzdpFGcmevzJIB8Yt+/PVjwpClQ5DAuS7SuRMiYfF\n1ZzOCrYT+Qw+ASHjes3kNqTreC5+xKxpRvOOUyNZhEk=\n=USo0\n-----END PGP PUBLIC KEY BLOCK-----" ],
//                    "subkeys" : [],
//                    "sibkeys" : [ "010171f070b412d66fb16ea74e1247e2c3b22af7f062cd7995bddf03d092af16e9ce0a" ],
//                    "families" :
//                    {
//                        "010171f070b412d66fb16ea74e1247e2c3b22af7f062cd7995bddf03d092af16e9ce0a" : [ "010171f070b412d66fb16ea74e1247e2c3b22af7f062cd7995bddf03d092af16e9ce0a" ],
//                        "0101deb888101b6b5ec38b840697bb3a88dc585c6f18290c32c90f7e9b35d8d229600a" : [ "0101deb888101b6b5ec38b840697bb3a88dc585c6f18290c32c90f7e9b35d8d229600a" ]
//                    },
//                    "eldest_kid" : "010171f070b412d66fb16ea74e1247e2c3b22af7f062cd7995bddf03d092af16e9ce0a"
//                },
//                "proofs_summary" :
//                {
//                    "by_proof_type" :
//                    {
//                        "twitter" : [
//                        {
//                            "proof_type" : "twitter",
//                            "nametag" : "derrick_oswald",
//                            "state" : 1,
//                            "proof_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                            "sig_id" : "8df03c9f50b95939f71ce3fb2b5cf41796e4f2bffe956a8d0e6d0c325174dee90f",
//                            "proof_id" : "29f766919ad7d1f522504410",
//                            "human_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                            "service_url" : "https://twitter.com/derrick_oswald",
//                            "presentation_group" : "twitter",
//                            "presentation_tag" : "tweet"
//                        } ],
//                        "github" : [
//                        {
//                            "proof_type" : "github",
//                            "nametag" : "derrickoswald",
//                            "state" : 1,
//                            "proof_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                            "sig_id" : "f26efe06294a0f244ae0e7a27646f40eef714fb06f963fde3b8a2851074561fb0f",
//                            "proof_id" : "f4dca8fc6939d2bc356c0f10",
//                            "human_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                            "service_url" : "https://github.com/derrickoswald",
//                            "presentation_group" : "github",
//                            "presentation_tag" : "gist"
//                        } ],
//                        "generic_web_site" : [
//                        {
//                            "proof_type" : "generic_web_site",
//                            "nametag" : "9code.ch",
//                            "state" : 1,
//                            "proof_url" : "http://9code.ch/keybase.txt",
//                            "sig_id" : "6780f45c1040e3dfaf26589cc10629e3d4c63216e8d86ec532a0e40a1aff77da0f",
//                            "proof_id" : "156ce1c551d1d267876d7310",
//                            "human_url" : "http://9code.ch/keybase.txt",
//                            "service_url" : "http://9code.ch",
//                            "presentation_group" : "9code.ch",
//                            "presentation_tag" : "http"
//                        } ]
//                    },
//                    "by_presentation_group" :
//                    {
//                        "twitter" : [
//                        {
//                            "proof_type" : "twitter",
//                            "nametag" : "derrick_oswald",
//                            "state" : 1,
//                            "proof_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                            "sig_id" : "8df03c9f50b95939f71ce3fb2b5cf41796e4f2bffe956a8d0e6d0c325174dee90f",
//                            "proof_id" : "29f766919ad7d1f522504410",
//                            "human_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                            "service_url" : "https://twitter.com/derrick_oswald",
//                            "presentation_group" : "twitter",
//                            "presentation_tag" : "tweet"
//                        } ],
//                        "github" : [
//                        {
//                            "proof_type" : "github",
//                            "nametag" : "derrickoswald",
//                            "state" : 1,
//                            "proof_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                            "sig_id" : "f26efe06294a0f244ae0e7a27646f40eef714fb06f963fde3b8a2851074561fb0f",
//                            "proof_id" : "f4dca8fc6939d2bc356c0f10",
//                            "human_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                            "service_url" : "https://github.com/derrickoswald",
//                            "presentation_group" : "github",
//                            "presentation_tag" : "gist"
//                        } ],
//                        "9code.ch" : [
//                        {
//                            "proof_type" : "generic_web_site",
//                            "nametag" : "9code.ch",
//                            "state" : 1,
//                            "proof_url" : "http://9code.ch/keybase.txt",
//                            "sig_id" : "6780f45c1040e3dfaf26589cc10629e3d4c63216e8d86ec532a0e40a1aff77da0f",
//                            "proof_id" : "156ce1c551d1d267876d7310",
//                            "human_url" : "http://9code.ch/keybase.txt",
//                            "service_url" : "http://9code.ch",
//                            "presentation_group" : "9code.ch",
//                            "presentation_tag" : "http"
//                        } ]
//                    },
//                    "all" : [
//                    {
//                        "proof_type" : "twitter",
//                        "nametag" : "derrick_oswald",
//                        "state" : 1,
//                        "proof_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                        "sig_id" : "8df03c9f50b95939f71ce3fb2b5cf41796e4f2bffe956a8d0e6d0c325174dee90f",
//                        "proof_id" : "29f766919ad7d1f522504410",
//                        "human_url" : "https://twitter.com/derrick_oswald/status/546768579551850496",
//                        "service_url" : "https://twitter.com/derrick_oswald",
//                        "presentation_group" : "twitter",
//                        "presentation_tag" : "tweet"
//                    },
//                    {
//                        "proof_type" : "github",
//                        "nametag" : "derrickoswald",
//                        "state" : 1,
//                        "proof_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                        "sig_id" : "f26efe06294a0f244ae0e7a27646f40eef714fb06f963fde3b8a2851074561fb0f",
//                        "proof_id" : "f4dca8fc6939d2bc356c0f10",
//                        "human_url" : "https://gist.github.com/6c819110e4fb38315ee8",
//                        "service_url" : "https://github.com/derrickoswald",
//                        "presentation_group" : "github",
//                        "presentation_tag" : "gist"
//                    },
//                    {
//                        "proof_type" : "generic_web_site",
//                        "nametag" : "9code.ch",
//                        "state" : 1,
//                        "proof_url" : "http://9code.ch/keybase.txt",
//                        "sig_id" : "6780f45c1040e3dfaf26589cc10629e3d4c63216e8d86ec532a0e40a1aff77da0f",
//                        "proof_id" : "156ce1c551d1d267876d7310",
//                        "human_url" : "http://9code.ch/keybase.txt",
//                        "service_url" : "http://9code.ch",
//                        "presentation_group" : "9code.ch",
//                        "presentation_tag" : "http"
//                    } ]
//                },
//                "cryptocurrency_addresses" :
//                {},
//                "pictures" :
//                {
//                    "primary" :
//                    {
//                        "url" : "https://s3.amazonaws.com/keybase_processed_uploads/67b1bed2d6f92dd53a6b3c574c086405_200_200_square_200.jpeg",
//                        "width" : 200,
//                        "height" : 200
//                    }
//                },
//                "sigs" :
//                {
//                    "last" :
//                    {
//                        "sig_id" : "5cdaaa82a0cd7b985b216d65bad9280053264d1cebd88fe5735fca15aa28ffff0f",
//                        "seqno" : 19,
//                        "payload_hash" : "415583ebf114e2f89c7a2c934fb5e0920875e79f04c27ad601fc041f5afbde53"
//                    }
//                },
//                "devices" :
//                {}
//            } ],
//            "csrf_token" : "lgHZIDNlY2IwNmRlYmNlM2NjNGJlOTlmN2QyZjE3YzQ4YTA4zlVuCGDOAAFRgMDEIDc9oG1jDvBw/CfIt+W4jqsavzCh4krASQ+iAQdbyau8"
//        },

        /**
         * @summary Lookup someone in Keybase.
         * @description Tries to get information about the username.
         */
        function lookup (username, options)
        {
            var url;
            var xmlhttp;

            options = options || {};
            url = CORS_URL + "user/lookup.json" + "?usernames=" + username;
            xmlhttp = createCORSRequest('GET', url);
            if (null == xmlhttp)
            {
                // fall back to non-CORS assuming an appropriate proxy is set up
                url = URL + "user/lookup.json" + "?usernames=" + username;
                xmlhttp = new XMLHttpRequest ();
                xmlhttp.open ("GET", url, true);
            }
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (options.success)
                            options.success (JSON.parse (xmlhttp.responseText));
                    }
                    else
                        if (options.error)
                            options.error ();
            };
            xmlhttp.send ();
        }

        /**
         * Some basic functionality test to get the salt value for a name
         * @param {string} name - the name to get the salt for
         * @see https://keybase.io/docs/api/1.0
         * @function getsalt
         * @memberOf module:keybase
         */
        function getsalt (name)
        {
            var url;
            var xmlhttp;
            var ret = null;

            url = URL + "getsalt.json" + "?email_or_username=" + name;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", url, false);
            xmlhttp.onreadystatechange = function ()
            {
                if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
                    ret = JSON.parse (xmlhttp.responseText);
            };
            xmlhttp.send ();

            return (ret);
        }

        return (
            {
                lookup: lookup,
                getsalt: getsalt
            }
        );
    }
);
