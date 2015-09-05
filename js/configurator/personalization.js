/**
 * @fileOverview System personalization step.
 * @name configurator/personalization
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["../configuration", "../page", "../mustache", "../login", "../restart", "../keybase", "../sha1"],
    /**
     * @summary Instance personalization step.
     * @description Sets the identifying information for this instance of the <em>things</em> system.
     * @name configurator/personalization
     * @exports configurator/personalization
     * @version 1.0
     */
    function (configuration, page, mustache, login, restart, keybase, sha1)
    {
        var userdata = null;

        /**
         * @summary Save button event handler.
         * @description Saves the form values as the current configuration document.
         * @param {object} event - the save button press event
         * @function save
         * @memberOf module:configurator/personalization
         */
        function save (event)
        {
            event.preventDefault ();
            event.stopPropagation ();

            configuration.setConfigurationItem ("instance_name", document.getElementById ("instance_name").value.trim ());
            configuration.setConfigurationItem ("instance_uuid", document.getElementById ("instance_uuid").value.trim ());
            configuration.setConfigurationItem ("keybase_username", document.getElementById ("keybase_username").value.trim ());
            configuration.saveConfiguration
            (
                {
                    success: function (data) { console.log (data); alert ("Configuration saved."); },
                    error: function (status) { console.log (status); alert ("Configuration save failed."); }
                }
            );
        }

        /**
         * @summary Create a new CouchDB unique uuid.
         * @description Fills the form's uuid input element with a new value of the uuid.
         * The uuid is either computed from the instance name, user's Keybase name and public key
         * or fetched from CouchDb as the next uuid.
         * @param {object} event - the click event, <em>not used</em>
         * @function create_uuid
         * @memberOf module:configurator/personalization
         */
        function create_uuid (event)
        {
            var instance_name = document.getElementById ("instance_name").value.trim ();
            var keybase_username = document.getElementById ("keybase_username").value.trim ();
            var public_key = "";
            if (null != userdata)
                if (userdata.them[0].public_keys)
                    if (userdata.them[0].public_keys.primary)
                        if (userdata.them[0].public_keys.primary.bundle)
                            public_key = userdata.them[0].public_keys.primary.bundle;
            if (("" != instance_name) && ("" != keybase_username) && ("" != public_key))
            {
                var plaintext =
                    instance_name + "\n" +
                    keybase_username + "\n" +
                    public_key;
                var uuid = sha1.sha1 (plaintext, false);
                uuid = uuid.substring (0, 32);
                document.getElementById ("instance_uuid").value = uuid;
            }
            else
                $.get
                (
                    configuration.getDocumentRoot () + "/_uuids",
                    function (uuids) // {"uuids": ["75480ca477454894678e22eec6002413"]}
                    {
                        uuids = JSON.parse (uuids);
                        document.getElementById ("instance_uuid").value = uuids.uuids[0];
                    }
                );
        }

        /**
         * @summary Fill in the elements with the Keybase information.
         * @description Fill in full name, location, picture and public key if available.
         * @param {object} data the data object from Keybase
         * @function fill_user_data
         * @memberOf module:configurator/personalization
         */
        function fill_user_data (data)
        {
            document.getElementById ("user_information").classList.add ("hidden");
            document.getElementById ("fullname").innerHTML = "";
            document.getElementById ("location").innerHTML = "";
            document.getElementById ("picture").innerHTML = "";
            document.getElementById ("public_key").innerHTML = "";
            if (null != data)
            {
                document.getElementById ("user_information").classList.remove ("hidden");
                if (data.them[0].profile)
                {
                    if (data.them[0].profile.full_name)
                        document.getElementById ("fullname").innerHTML = data.them[0].profile.full_name;
                    if (data.them[0].profile.location)
                        document.getElementById ("location").innerHTML = data.them[0].profile.location;
                }
                if (data.them[0].pictures)
                    if (data.them[0].pictures.primary)
                        if (data.them[0].pictures.primary.url)
                            document.getElementById ("picture").innerHTML = "<img src='" + data.them[0].pictures.primary.url + "'>";
                if (data.them[0].public_keys)
                    if (data.them[0].public_keys.primary)
                        if (data.them[0].public_keys.primary.bundle)
                            document.getElementById ("public_key").innerHTML = "<pre>" + data.them[0].public_keys.primary.bundle + "</pre>";
            }
            // add contextual backgrounds to the keybase user name field
            if ((null == data) && ("" != document.getElementById ("keybase_username").value))
                document.getElementById ("keybase_group").classList.add ("has-error");
            else
                document.getElementById ("keybase_group").classList.remove ("has-error");
        }

        /**
         * @summary Get the Keybase information for the current user.
         * @description Query the Keybase lookup API with the keybase_username.
         * @param {object} event - the event that triggered the lookup.
         * @function get_user_data
         * @memberOf module:configurator/personalization
         */
        function get_user_data (event)
        {
            userdata = null;
            var username = document.getElementById ("keybase_username").value;
            if ("" != username)
                keybase.lookup
                (
                    username,
                    {
                        success: function (data)
                        {
                            if (data.them)
                                if (Array.isArray (data.them))
                                    if (0 != data.them.length && (null != data.them[0]))
                                        userdata = data;
                            fill_user_data (userdata);
                        },
                        error: function ()
                        {
                            fill_user_data (userdata);
                        }
                    }
                );
            else
                fill_user_data (userdata);
        }

        /**
         * @summary Initialize the personalization page of the configurator wizard.
         * @description Fills the form with existing configuration data and attaches handlers for the
         * various operations.
         * @param {object} event - the tab being shown event, <em>not used</em>
         * @function init
         * @memberOf module:configurator/personalization
         */
        function init (event)
        {
            document.getElementById ("instance_name").value = configuration.getConfigurationItem ("instance_name");
            document.getElementById ("instance_uuid").value = configuration.getConfigurationItem ("instance_uuid");
            document.getElementById ("keybase_username").value = configuration.getConfigurationItem ("keybase_username");
            get_user_data ();
        }

        return (
            {
                getStep: function ()
                {
                    return (
                        {
                            id: "personalize",
                            title: "Personalization",
                            template: "templates/configurator/personalization.mst",
                            hooks:
                            [
                                { id: "save_personalization", event: "click", code: save },
                                { id: "generate_uuid", event: "click", code: create_uuid },
                                { id: "keybase_username", event: "input", code: get_user_data }
                            ],
                            transitions:
                            {
                                enter: init
                            }
                        }
                    );
                }
            }
        );
    }
);
