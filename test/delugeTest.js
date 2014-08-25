define
(
    ["deluge"],
    function (d)
    {
        TestCase
        (
            "DelugeTest",
            {
                testTorrentInfo: function ()
                {
                    if (d.login (d.Password))
                        assertNotNull ("bittorrent access failure", d.getTorrentInfo ("ad2516c50852db638bdcd5d129547585786f639b"));
                    else
                        fail ("login failed");
                }
            }
        );
    }
);