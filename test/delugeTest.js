define
(
    ["deluge"],
    function (deluge)
    {
        AsyncTestCase
        (
            "TorrentInfoTest",
            {
                testTorrentInfo: function (queue)
                {
                    queue.call
                    (
                        "login",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                }
                            );
                            var fail = callbacks.addErrback ("login");
                            deluge.login (
                                deluge.Password,
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "getTorrentInfo",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    assertNotNull ("bittorrent access failure", data);
                                    console.log (data);
                                }
                            );
                            var fail = callbacks.addErrback ("getTorrentInfo");
                            deluge.getTorrentInfo (
                                "ad2516c50852db638bdcd5d129547585786f639b",
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                }
            }
        );

        AsyncTestCase
        (
            "AddTorrentTest",
            {
                testAddTorrent: function (queue)
                {
                    queue.call
                    (
                        "login",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    console.log (data);
                                }
                            );
                            var fail = callbacks.addErrback ("login");
                            deluge.login (
                                deluge.Password,
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );

                    queue.call
                    (
                        "addTorrent",
                        function (callbacks)
                        {
                            var ok = callbacks.add
                            (
                                function (data)
                                {
                                    assertNotNull ("bittorrent access failure", data);
                                    console.log (data);
                                }
                            );
                            var fail = callbacks.addErrback ("getTorrentInfo");
                            deluge.addTorrent (
                                null,
                                {
                                    success: ok,
                                    error: fail
                                }
                            );
                        }
                    );
                }
            }
        );
    }
);