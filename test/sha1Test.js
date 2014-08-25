define
(
    ["sha1"],
    function (s)
    {
        TestCase
        (
            "Sha1Test",
            {
                testSimple: function ()
                {
                    var hash = s.sha1 ("The quick brown fox jumps over the lazy dog");
                    assertEquals ("Simple sha1 hash test failed.", "2fd4e1c67a2d28fced849ee1bb76e7391b93eb12", hash);
                },
    
                testDelta: function ()
                {
                    var hash = s.sha1 ("The quick brown fox jumps over the lazy cog");
                    assertEquals ("Delta sha1 hash test failed.", "de9f2c7fd25e1b3afad3e85a0bd17d9b100db4b3", hash);
                },
    
                testZero: function ()
                {
                    var hash = s.sha1 ("");
                    assertEquals ("Zero length sha1 hash test failed.", "da39a3ee5e6b4b0d3255bfef95601890afd80709", hash);
                }
            }
        );
    }
);