define
(
    ["bencoder"],
    function (bencoder)
    {
        TestCase
        (
            "BencoderTest",
            {
                testHex: function ()
                {
                    for (var i = 0; i < 16; i++)
                        assertEquals ("HexConverter check failed.", i, bencoder.HexConverter.hex2dec (bencoder.HexConverter.dec2hex (i)));
                },
    
                testBasics: function ()
                {
                    var value = {};
                    value["string"] = "hello world\n";
                    value["number"] = Number (2772);
                    value["array"] = ["a", 42, ["b", 34]];
                    value["dictionary"] = {a:23, b:45};
                    var intermediate = bencoder.encode (value);
                    var buffer = bencoder.str2ab (intermediate);
                    var newval = bencoder.decode (buffer);
                    assertEquals ("Round trip fidelity test failed.", value, newval);
                },
    
                testNegative: function ()
                {
                    var value = {};
                    value["negative"] = Number (-1);
                    var intermediate = bencoder.encode (value);
                    var buffer = bencoder.str2ab (intermediate);
                    var newval = bencoder.decode (buffer);
                    assertEquals ("Negative number test failed.", value, newval);
                },
    
                testRoundTrip: function ()
                {
                    var before =
                    {
                            "created by": "ThingMaker v0.1",
                            "creation date": 1408304346,
                            "encoding": "UTF-8",
                            "info": {
                                "length": 769,
                                "name": "thunderbird address book.csv",
                                "piece length": 16384,
                                "thing": {
                                    "title": "After",
                                    "url": "http://test"
                                }
                            }
                        };
                    var encoded = bencoder.encode (before);
                    var after = bencoder.decode (bencoder.str2ab (encoded));
                    assertEquals ("round trip failed", before, after);
                },
    
                testBinary: function ()
                {
                    var value = {};
                    var buf = new ArrayBuffer (4);
                    var bufView = new Uint8Array (buf);
                    bufView[0] = 95;
                    bufView[0] = 12;
                    bufView[0] = 156;
                    bufView[0] = 234;
                    value["binary"] = buf;
                    var intermediate = bencoder.encode (value);
                    var buffer = bencoder.str2ab (intermediate);
                    var newval = bencoder.decode (buffer, true);
                    assertEquals ("Binary fidelity test failed.", value, newval);
                }
            }
        );
    }
);

