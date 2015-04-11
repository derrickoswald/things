define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration"],
    function (mustache, deluge, records, bencoder, login, configuration)
    {
        /**
         * Publish a thing by posting the torrent to deluge and the document to the public database.
         * Before pushing to the public database, it strips off the revision and webseed.
         * @param primary_key thing id (SHA1 hash of info section)
         */
        function push (primary_key)
        {
            function fail (result)
            {
                console.log (result);
                alert ("deluge login failed");
            };

            // push to deluge
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.addTorrent (
                                document.location.origin + "/" +
                                configuration.getConfigurationItem ("local_database") +
                                "/" + primary_key + "/" + primary_key + ".torrent",
                                {
                                    success: function ()
                                    {
                                        alert ("torrent push to deluge succeeded");

                                        // get the document
                                        $.couch.db (configuration.getConfigurationItem ("local_database")).openDoc (primary_key,
                                        {
                                            success: function (tor)
                                            {
                                                // remove couch stuff and webseed
                                                delete tor._rev;
                                                delete tor._attachments
                                                delete tor["url-list"];

                                                var attachments = [new File ([bencoder.str2ab (bencoder.encode (tor))], primary_key + ".torrent", { type: "application/octet-stream" })];

                                                // push to public database
                                                records.saveDocWithAttachments.call
                                                (
                                                    records,
                                                    configuration.getConfigurationItem ("public_database"),
                                                    tor,
                                                    {
                                                        success: function () { alert ("torrent push to public things database suceeded"); },
                                                        error: function () { alert ("torrent push to public things database failed"); }
                                                    },
                                                    attachments
                                                );
                                            },
                                            error: function(status)
                                            {
                                                console.log(status);
                                            }
                                        });
                                    },
                                    error: function () { alert ("torrent push to deluge failed"); }
                                }
                            );
                        },
                    error: fail
                }
            );
        };

        function publish_handler (event, data)
        {
            var parameters;

            parameters =
            {
                success: function ()
                {
                    push (data.torrent._id);
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        function info (event)
        {
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.getTorrentInfo
                            (
                                "6151ee2b6dedfefa85806b67c6a3145edf1378d6",
                                {
                                    success: function (data) { alert (JSON.stringify (data, null, 4)); },
                                    error: function () { alert ("failed to get info") }
                                }
                            );
                        },
                    fail: function () { alert ("failed deluge login"); }
                }
            );
        }

        function magnet (event)
        {
            deluge.login (
                deluge.Password,
                {
                    success:
                        function ()
                        {
                            deluge.addTorrentFile (
                                "magnet:?xt=urn:btih:8eadf6097ede23afadb3fbe9a216799c12c6fd18&dn=Monty+Python+and+the+Holy+Grail+%281975%29.DVDRip.XviD.Ekolb&tr=udp%3A%2F%2Fopen.demonii.com%3A1337&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Fexodus.desync.com%3A6969",
                                {
                                    success: function (data) { alert (JSON.stringify (data, null, 4)); },
                                    error: function () { alert ("failed to add magnet") }
                                }
                            );
                        },
                    fail: function () { alert ("failed deluge login"); }
                }
            );
        }

        return (
            {
                getStep: function ()
                {
                    var publish_hooks =
                        [
                            { id: "publish_button", event: "click", code: publish_handler, obj: this },
                            { id: "info_button", event: "click", code: info, obj: this },
                            { id: "magnet_button", event: "click", code: magnet, obj: this }
                        ];
                    return ({ id: "publish", title: "Publish the thing", template: "templates/thingmaker/publish.mst", hooks: publish_hooks });
                },
                push: push
            }
        );
    }
)