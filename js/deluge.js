define
(
    {
        URL: "/json/json", // corresponds to http://localhost:8112/json as proxied by couchdb
        // i.e. add this line under the [httpd_global_handlers] section:
        // json = {couch_httpd_proxy, handle_proxy_req, <<"http://localhost:8112">>}
        // NOTE: the json name is not optional, since the cookie contains the path /json and hence
        // will only match through the proxy if the trigger path is also json, hence the /json/json

        // ToDo: look up webtorrent and peermaps

        Password: "deluge", // default

        // get the magic cookie
        login: function (password)
        {
            var url;
            var xmlhttp;
            var ret = null;

            url = this.URL;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", url, false);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
                    ret = true;
            };
            xmlhttp.send (JSON.stringify ({"method": "auth.login", "params": ["deluge"], "id": 1}));

            return (ret);
        },

        // get information about a torrent
        getTorrentInfo: function (hash)
        {
            var url;
            var xmlhttp;
            var ret = null;

            url = this.URL;
            xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("POST", url, false);
            xmlhttp.setRequestHeader ("Content-Type", "application/json");
            xmlhttp.setRequestHeader ("Accept", "application/json");
            xmlhttp.onreadystatechange = function ()
            {
                if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
                    ret = JSON.parse (xmlhttp.responseText).result;
            };
            xmlhttp.send (JSON.stringify ({"method": "web.get_torrent_files", "params": [hash], "id": 1}));

            return (ret);
        }
    }
);
