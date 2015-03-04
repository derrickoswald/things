define
(
    ["mustache", "../deluge"],
    function (mustache, deluge)
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
                                    success: function () { alert ("torrent push to deluge succeeded"); },
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