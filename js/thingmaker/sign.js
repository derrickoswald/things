/**
 * @fileOverview Thing signing step of the ThingMaker wizard.
 * @name thingmaker/sign
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["mustache", "torrent", "keybase"],
    /**
     * @summary Allows the user to sign the thing with their private key.
     * @description Gets the private key from Keybase and signs the info section.
     * @name thingmaker/sign
     * @exports thingmaker/sign
     * @version 1.0
     */
    function (mustache, torrent, keybase)
    {
        /*
         * notes:
         * scrypt.run line 28662
         * salt = WordArray
         * dklen 320? 96
         * e
         * {
         *     r:8
         *     p:1
         *     N: 32768
         *     C0: 1
         *     c1: 1
         *     klass:
         *     outputSize: 64
         * }
         */
        function tryit (event)
        {
            keybase.login (
                "derrickoswald",
                "secret passphrase",
                {
                    success: function (result)
                    {
                        alert ("success: " + JSON.stringify (result));
                    },
                    error: function ()
                    {
                        alert ("error");
                    }
                }
            );
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "sign",
                            title: "Sign the thing",
                            template: "templates/thingmaker/sign.mst",
                            hooks:
                            [
                                { id: "tryit_button", event: "click", code: tryit },
                            ]
                        }
                    );
                }
            }
        );
    }
);
