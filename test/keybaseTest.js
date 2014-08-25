define
(
    ["keybase"],
    function (k)
    {
        TestCase
        (
            "KeybaseTest",
            {
                testKeybase: function ()
                {
                    assertNotNull ("keybase access failure", k.getsalt ("chris"));
                }
            }
        );
    }
);