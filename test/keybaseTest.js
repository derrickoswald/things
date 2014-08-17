
KeybaseTest = TestCase ("KeybaseTest");

KeybaseTest.prototype.testKeybase = function ()
{
    assertNotNull ("keybase access failure", getsalt ("chris"));
};

