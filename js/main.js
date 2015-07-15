/*

So far, custom configuration is not needed.

requirejs.config
(
    {
        // by default load any module IDs from js/lib
        baseUrl: 'js/lib',

        // except, if the module ID starts with "app",
        // load it from the js/app directory. paths
        // config is relative to the baseUrl, and
        // never includes a ".js" extension since
        // the paths config could be for a directory.
        paths:
        {
            app: '../app'
        }
    }
);

 */

/**
 * @fileOverview Application initialization.
 * @name main
 * @author Derrick Oswald
 * @version 1.0
 */
requirejs
(
    ["configuration"],
    /**
     * @summary Main entry point for the application.
     * @description Performs application initialization as the first step in the RequireJS load sequence.
     * @see http://requirejs.org/docs/api.html#data-main
     * @name main
     * @exports main
     * @version 1.0
     */
    function (configuration)
    {
        /**
         * @summary Define the eventable plugin.
         * @description Add an eventable jQuery plugin to support events between modules.
         * @see http://stackoverflow.com/questions/8099767/javascript-module-pattern-events-and-listeners
         */
        function define_eventable ()
        {
            jQuery.eventable = function (obj)
            {
                // allow use of Function.prototype for shorthanding the augmentation of classes
                obj = jQuery.isFunction (obj) ? obj.prototype : obj;
                // augment the object (or prototype) with eventable methods
                return ($.extend (obj, jQuery.eventable.prototype));
            };

            jQuery.eventable.prototype =
            {
                // The trigger event must be augmented separately because it requires a
                // new Event to prevent unexpected triggering of a method (and possibly
                // infinite recursion) when the event type matches the method name
                trigger: function (type, data)
                {
                    var event;

                    event = new jQuery.Event (type);
                    event.preventDefault ();
                    jQuery.event.trigger (event, data, this);

                    return (this);
                }
            };

            // augment the object with jQuery's event methods
            jQuery.each
            (
                ["bind", "one", "unbind", "on", "off"],
                function (i, method)
                {
                    jQuery.eventable.prototype[method] = function (type, data, fn)
                    {
                        jQuery (this)[method] (type, data, fn);

                        return (this);
                    };
                }
            );
        }

        function begin ()
        {
            require
            (
                ["login", "home", "thingimporter/importwizard", "thingmaker/thingwizard", "discover", "configurator/configwizard", "about"],
                /**
                 * Setup index.html JavaScript.
                 * Make all the links and buttons on the static html page work, and show the first page.
                 */
                function (login, home, importwizard, thingwizard, discover, configwizard, about)
                {
                    /**
                     * Page activation function generator.
                     */
                    function activate (fn)
                    {
                        return (
                            /**
                             * Click event handler.
                             * @param {object} event - the click event
                             */
                            function (event)
                            {
                                var parent;
                                var active;

                                // stop the normal link action
                                event.preventDefault ();
                                // switch class active
                                parent = event.target.parentElement;
                                active = parent.parentElement.getElementsByClassName ("active")[0];
                                if (active)
                                    active.classList.remove ("active");
                                parent.classList.add ("active");
                                // close the menu (for cell phones)
                                document.getElementById ("navigator_menu").classList.remove ("in");
                                // initialize the new nav
                                fn ();
                            }
                        );
                    }

                    login.build ("utility");
                    document.getElementById ("home").onclick = activate (home.initialize);
                    document.getElementById ("import_thing").onclick = activate (importwizard.initialize);
                    document.getElementById ("new_thing").onclick = activate (thingwizard.initialize);
                    document.getElementById ("discover_thing").onclick = activate (discover.initialize);
                    document.getElementById ("about").onclick = activate (about.initialize);
                    document.getElementById ("configurator").onclick = activate (configwizard.initialize);

                    // display the home page, or the configuration page if configuration hasn't been done yet
                    configuration.configuration_exists
                    (
                        {
                            success: function ()
                            {
                                document.getElementById ("home").click ();
                            },
                            error: function ()
                            {
                                document.getElementById ("configurator").click ();
                            }
                        }
                    );
                }
            );
        }

        // set up for custom events
        define_eventable ();

        // to support vhost systems set CouchDB jQuery module base path if main.js is not coming from
        // some path with the word _rewite in it, e.g. "/things/_design/things/_rewrite
        if (-1 == location.pathname.indexOf ("_rewrite"))
        {
            $.couch.urlPrefix = "/root"; // this name must agree with the name used in rewrites.json
            // stupid Futon just doesn't work with vhosts, so set it to localhost (means it doesn't work for remote Futons)
            document.getElementById ("futon_link").setAttribute ("href", location.protocol + "//localhost" +
                (("" !== location.port) ? ":" + location.port : "") + "/_utils/");
        }

        // ensure that configuration is loaded first, everything else depends on it
        configuration.configuration_setup
        (
            {
                success: function (data)
                {
                    // configuration loaded now, safe to do other require calls that depend on that config
                    begin ();
                },
                error: function ()
                {
                    alert ("configuration not found");
                    begin ();
                }
            }
        );
    }
);
