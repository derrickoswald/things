/**
 * @fileOverview Deluge interface.
 * @name deluge
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["records", "configuration"],
    /**
     * @summary Functions for interfacing to the Deluge web plugin.
     * @name deluge
     * @exports deluge
     * @version 1.0
     */
    function (records, configuration)
    {
        /**
         * Deluge URL.
         * Corresponds to http://localhost:8112/json as proxied by couchdb
         * i.e. add this line under the [httpd_global_handlers] section:
         * <code>json = {couch_httpd_proxy, handle_proxy_req, &lt;&lt;"http://localhost:8112"&gt;&gt;}</code>
         * NOTE: the json name is not optional, since the cookie contains the path /json and hence
         * will only match through the proxy if the trigger path is also json, hence the /json/json
         * @memberOf module:deluge
         */
        var URL = "/json/json";

        /**
         * Get the magic cookie from the deluge-web API.
         * @param {string} password secret password
         * @param {object} options to process the login:
         * <pre>
         * success: function() to call when the user is logged in
         * error: function to call when a problem occurs or the user is not logged in
         * </pre>
         * @return <em>nothing</em>
         * @function login
         * @memberOf module:deluge
         */
        function login (password, callbacks)
        {
            var xmlhttp;

            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", URL, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (callbacks && callbacks.success)
                            callbacks.success ();
                    }
                    else
                        if (callbacks && callbacks.error)
                            callbacks.error ();
            };
//            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.
            xmlhttp.send (JSON.stringify ({"method": "auth.login", "params": [password], "id": 1}));
        }

        /**
         * Get information about a torrent.
         * web.get_torrent_info
         * @see https://github.com/leighmacdonald/tranny/blob/master/docs/deluge_api.rst
         * @param {string} hash the SHA1 hash of the info section of the torrent
         * @param {object} callbacks options to process the get:
         * <pre>
         * success: function(JSON) to call if successful, JSON is the result e.g.
         * <code>
         * {
         *     "id": 325,
         *     "result":
         *     {
         *         "active_time": 212839,
         *         "max_download_speed": -1.0,
         *         "upload_payload_rate": 4836,
         *         "total_payload_upload": 1213940,
         *         "seed_rank": 268435956,
         *         "seeding_time": 210056,
         *         "download_payload_rate": 0,
         *         "num_peers": 6,
         *         "ratio": 1.4167254668820461,
         *         "total_peers": 7,
         *         "total_size": 2807499637,
         *         "max_upload_speed": -1.0,
         *         "state": "Seeding",
         *         "distributed_copies": 0.0,
         *         "save_path": "/home/derrick/Torrents",
         *         "progress": 100.0,
         *         "time_added": 1412098858.535332,
         *         "tracker_host": "",
         *         "total_uploaded": 3977456234,
         *         "total_done": 2807499637,
         *         "num_pieces": 670,
         *         "total_seeds": 16,
         *         "next_announce": 0,
         *         "seeds_peers_ratio": 2.2857142857142856,
         *         "piece_length": 4194304,
         *         "num_seeds": 0,
         *         "name": "Lord of War 2005.1080p.BluRay.x264 . NVEE",
         *         "is_auto_managed": true,
         *         "tracker_status": "",
         *         "queue": -1,
         *         "eta": 0,
         *         "total_payload_download": 0
         *         },
         *     "error": null
         * };
         * </code>
         * error: function to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function getTorrentInfo
         * @memberOf module:deluge
         */
        function getTorrentInfo (hash, callbacks)
        {
            var xmlhttp;

            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", URL, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        if (callbacks && callbacks.success)
                            callbacks.success (JSON.parse (xmlhttp.responseText).result);
                    }
                    else
                        if (callbacks && callbacks.error)
                            callbacks.error ();

            };
//            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.
//            xmlhttp.ontimeout = function () // whenever the request times out
//            {
//                alert ("ready state = " +  xmlhttp.readyState + " status = " + xmlhttp.status);
//            }
            xmlhttp.send (JSON.stringify ({"method": "web.get_torrent_files", "params": [hash], "id": 2}));
        }

        /**
         * Add torrents by file.
         * json_api.web.add_torrents
         * @see http://deluge-torrent.org/docs/master/modules/ui/web/json_api.html
         * @param {object} callbacks options to process the put:
         * <pre>
         * success: function(result) to call if successful
         * error: function(reply) to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function addTorrentFile
         * @memberOf module:deluge
         */
        function addTorrentFile (filename, callbacks)
        {
            var xmlhttp;

            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", URL, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        var reply = JSON.parse (xmlhttp.responseText);
                        if (reply.error)
                        {
                            if (callbacks && callbacks.error)
                                callbacks.error (reply.error);
                        }
                        else if (callbacks && callbacks.success)
                            callbacks.success (reply.result);
                    }
                    else
                        if (callbacks && callbacks.error)
                            callbacks.error ();
            };
//            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.

            // note to self, this also handles magnet uri as well as file paths
            // , options: { download_location: "/home/derrick/Torrents" }
            xmlhttp.send
            (
                JSON.stringify
                (
                    {
                        method: "web.add_torrents",
                        params:
                        // from here: http://forum.deluge-torrent.org/viewtopic.php?f=8&t=41333
                        // not this like it says in the documentation [{path: filename , options: { download_location: "/home/derrick/Torrents" }}], "id": 4}));
                        [
                            [
                                {
                                    path: filename,
                                    options:
                                    {
                                        download_location: configuration.getConfigurationItem ("download_directory")
                                    }
                                }
                            ]
                        ],
                        id: 4
                    }
                )
            );
        }

        /**
         * Add torrent.
         * json_api.web.download_torrent_from_url
         * Fetch a torrent file from the provided url.
         * @see http://deluge-torrent.org/docs/master/modules/ui/web/json_api.html
         * @param {string} url URL of the torrent to download
         * @param {object} callbacks options to process the post:
         * <pre>
         * success: function(result) to call if successful
         * error: function(reply) to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function addTorrent
         * @memberOf module:deluge
         */
        function addTorrent (url, callbacks)
        {
            var xmlhttp;

            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", URL, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        var filename = JSON.parse (xmlhttp.responseText).result;
                        addTorrentFile (filename, callbacks);
                    }
                    else
                        if (callbacks && callbacks.error)
                            callbacks.error ();
            };
//            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.
            xmlhttp.send (JSON.stringify ({"method": "web.download_torrent_from_url", "params": [url /*, cookies */], "id": 3}));
        }

        /**
         * Download torrent.
         * json_api.web.add_torrents
         * Fetch torrent contents based on the embedded webseed.
         * @see http://deluge-torrent.org/docs/master/modules/ui/web/json_api.html
         * @param {string} filename the file name of the torrent to add
         * @param {object} callbacks options to process the post:
         * <pre>
         * success: function(result) to call if successful
         * error: function(reply) to call when a problem occurs
         * </pre>
         * @return <em>nothing</em>
         * @function downloadTorrent
         * @memberOf module:deluge
         */
        function downloadTorrent (filename, callbacks)
        {
            var xmlhttp;

            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", URL, true);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if (4 == xmlhttp.readyState)
                    if (200 == xmlhttp.status)
                    {
                        var reply = JSON.parse (xmlhttp.responseText);
                        if (reply.error)
                        {
                            if (callbacks && callbacks.error)
                                callbacks.error (reply.error);
                        }
                        else if (callbacks && callbacks.success)
                            callbacks.success (reply.result);
                    }
                    else
                        if (callbacks && callbacks.error)
                            callbacks.error ();
            };
//            xmlhttp.timeout = 500; // half a second - the number of milliseconds a request can take before automatically being terminated. A value of 0 (which is the default) means there is no timeout.

            // note to self, this also handles magnet uri as well as file paths
            // , options: { download_location: "/home/derrick/Torrents" }
            xmlhttp.send (JSON.stringify ({"method": "web.add_torrents", "params":
                // from here: http://forum.deluge-torrent.org/viewtopic.php?f=8&t=41333
                [[{"path":filename, "options": { download_location: configuration.getConfigurationItem ("download_directory"), add_paused: true }}]], "id": 4}));
               // not this like it says in the documentation [{path: filename , options: { download_location: "/home/derrick/Torrents" }}], "id": 4}));
        }

        var exported =
        {
            "login" : login,
            "getTorrentInfo" : getTorrentInfo,
            "addTorrentFile" : addTorrentFile,
            "addTorrent": addTorrent,
            "downloadTorrent": downloadTorrent
        };

        return (exported);
    }
);
