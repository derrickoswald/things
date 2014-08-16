DelugeTest = TestCase("DelugeTest");

DelugeTest.prototype.testTorrentInfo = function ()
{
    if (login (Password))
        assertNotNull ("bittorrent access failure", getTorrentInfo ("ad2516c50852db638bdcd5d129547585786f639b"));
    else
        fail ("login failed");
};
