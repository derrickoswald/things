define
(
    ["mustache", "../deluge", "../records", "../bencoder", "../login"],
    function (mustache, deluge, records, bencoder, login)
    {
        function publish (event, data)
        {
            var primary_key = data.torrent["_id"];

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

                                        // remove webseed
                                        delete data.torrent["url-list"];

                                        var attachments = [
                                            new File ([bencoder.str2ab (bencoder.encode (data.torrent))], primary_key + ".torrent", { type: "application/octet-stream" })
                                            ];

                                        // push to public_things
                                        if (login.isLoggedIn ())
                                        {
                                            records.saveDocWithAttachments.call // $.couch.db (_Db)
                                            (
                                                records,
                                                "public_things",
                                                data.torrent,
                                                {
                                                    success: function () { alert ("torrent push to public things database suceeded"); },
                                                    error: function () { alert ("torrent push to public things database failed"); }
                                                },
                                                attachments
                                            );
                                        }
                                    },
                                    error: function () { alert ("torrent push to deluge failed"); }
                                }
                            );
                        },
                    error: fail
                }
            );
        };

        return (
            {
                getStep: function ()
                {
                    var publish_hooks =
                        [
                            { id: "publish_button", event: "click", code: publish, obj: this }
                        ];
                    return ({ id: "publish", title: "Publish the thing", template: "templates/publish.mst", hooks: publish_hooks });
                }
            }
        );
    }
)