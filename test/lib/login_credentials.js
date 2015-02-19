define
(   // explicitly name this module because the JsTestDriver "force load" gives it one name
    // and the location in test/lib gives means it has another name,
    // plus we modify this file in the SetPassword builder and give it a modified name
    "login_credentials",
    [],
    function ()
    {
        return (
        {
            /**
             * Provide login credentials for running tests.
             * 
             * @param kind A string with the kind of credential to provide, either <em>username</em> or <em>password</em>.
             * 
             * @return The requested credential or an empty string if the type is not recognized.
             */
            get: function (kind)
            {
                var ret;
    
                switch (kind)
                {
                    case "username":
                        ret = "admin";
                        break;
                    case "password":
                        ret = "secret";
                        break;
                    default:
                        ret = "";
                        break;
                }
                
                return (ret);
            }
        });
    }
);