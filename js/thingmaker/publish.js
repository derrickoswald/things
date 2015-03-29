define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login"],
    function (mustache, deluge, records, bencoder, login)
    {
        /**
         * Publish a thing by posting the torrent to deluge and the document to public_things.
         * Before pushing to the public_things database, it strips off the
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
                                "http://localhost:5984/things/" + primary_key + "/" + primary_key + ".torrent",
                                {
                                    success: function ()
                                    {
                                        alert ("torrent push to deluge succeeded");

                                        // get the document
                                        $.couch.db ("things").openDoc (primary_key,
                                        {
                                            success: function (tor)
                                            {
                                                // remove couch stuff and webseed
                                                delete tor._rev;
                                                delete tor._attachments
                                                delete tor["url-list"];

                                                var attachments = [new File ([bencoder.str2ab (bencoder.encode (tor))], primary_key + ".torrent", { type: "application/octet-stream" })];

                                                // push to public_things
                                                if (login.isLoggedIn ())
                                                {
                                                    records.saveDocWithAttachments.call
                                                    (
                                                        records,
                                                        "public_things",
                                                        tor,
                                                        {
                                                            success: function () { alert ("torrent push to public things database suceeded"); },
                                                            error: function () { alert ("torrent push to public things database failed"); }
                                                        },
                                                        attachments
                                                    );
                                                }
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
            push (data.torrent["_id"]);
        }

        return (
            {
                getStep: function ()
                {
                    var publish_hooks =
                        [
                            { id: "publish_button", event: "click", code: publish_handler, obj: this }
                        ];
                    return ({ id: "publish", title: "Publish the thing", template: "templates/publish.mst", hooks: publish_hooks });
                },
                push: push
            }
        );
    }
)