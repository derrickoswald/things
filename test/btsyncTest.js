
BtSyncTest = TestCase("BtSyncTest");

BtSyncTest.prototype.testToken = function ()
{
    assertNotNull ("bittorrent access failure", getFolders ());
};

