define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login", "../configuration", "../discover"],
    function (mustache, deluge, records, bencoder, login, configuration, discover)
    {
        /**
         * @summary Publish a thing
         * @description Posts the torrent to deluge and the
         * document to the public database and triggers an update of the thing tracker database.
         * Before posting to the public database, it strips off the revision and webseed.
         * @param primary_key thing id (SHA1 hash of info section)
         */
        function announce (primary_key)
        {
            function error (result)
            {
                console.log (result);
                alert ("deluge login failed");
            };

            // add to deluge
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
                                        alert ("add torrent to deluge succeeded");

                                        // get the document
                                        $.couch.db (configuration.getConfigurationItem ("local_database")).openDoc
                                        (
                                            primary_key,
                                            {
                                                success: function (tor)
                                                {
                                                    // remove couch stuff and webseed
                                                    delete tor._rev;
                                                    delete tor._attachments
                                                    delete tor["url-list"];

                                                    var attachments = [new File ([bencoder.str2ab (bencoder.encode (tor))], primary_key + ".torrent", { type: "application/octet-stream" })];

                                                    // save to public database
                                                    records.saveDocWithAttachments.call
                                                    (
                                                        records,
                                                        configuration.getConfigurationItem ("public_database"),
                                                        tor,
                                                        {
                                                            success: function ()
                                                            {
                                                                alert ("announce to public things database succeeded");
                                                                // update the thing tracker
                                                                discover.post_my_things ();
                                                            },
                                                            error: function () { alert ("announce to public things database failed"); }
                                                        },
                                                        attachments
                                                    );
                                                },
                                                error: function(status)
                                                {
                                                    console.log(status);
                                                }
                                            }
                                        );
                                    },
                                    error: function () { alert ("add torrent to deluge failed"); }
                                }
                            );
                        },
                    error: error
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
                    announce (data.torrent._id);
                },
                error: function ()
                {
                    alert ("You must login as an admin user");
                }
            };
            login.isLoggedIn (parameters);
        }

        return (
            {
                getStep: function ()
                {
                    var publish_hooks =
                        [
                            { id: "publish_button", event: "click", code: publish_handler, obj: this },
                        ];
                    return ({ id: "publish", title: "Publish the thing", template: "templates/thingmaker/publish.mst", hooks: publish_hooks });
                },
                announce: announce
            }
        );
    }
)