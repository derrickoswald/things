
KeybaseTest = TestCase("KeybaseTest");

KeybaseTest.prototype.testRecords = function ()
{
    assertNotNull ("keybase access failure", getsalt ("chris"));
};

