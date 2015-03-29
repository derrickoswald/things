/**
 * @fileOverview Extension of {@link module:wizard} for importing things.
 * @name thingmaker/importwizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["wizard", "mustache", "thingimporter/setup", "thingimporter/transfer"],
    /**
     * @summary Import things by setting up the database, setting CouchDb configuration, loading a user script and transferring.
     * @exports thingimporter/importwizard
     * @version 1.0
     */
    function (wiz, mustache, setup, transfer)
    {
        /**
         * @summary Create the wizard.
         *
         * @description Builds on the generic wizard module and adds specific html id values and
         * method steps to create a functioning import wizard.
         *
         * @function initialize
         */
        function initialize ()
        {
            var steps =
                [
                    { id: "overview", title: "Overview", template: "templates/thingimporter/overview.html"},
                    setup.getStep (), // { id: "setup", title: "Setup", template: "templates/thingimporter/setup.html"},
                    transfer.getStep (),
                ];

            /**
             * @summary Wizard data.
             * @description The object passed around to maintain state.
             * The aim is to have this eventually filled in from user storage.
             * @member
             */
            var data =
            {
                database: "pending_things",
            };

            var wrapper;
            var nav;
            var content;
            var stream;
            var main;

            var template =
                "<div id='main_area' class='row'>" +
                    "<ul class='col-md-3 nav nav-tabs nav-stacked' role='tablist' id='sidebar'>" +
                       /* li */
                    "</ul>" +
                    "<div class='col-md-6 tab-content' id='panes'>" +
                       /* div */
                    "</div>" +
                    "<div class='col-md-3' id='stream'></div>" +
                "</div>";

            wrapper = document.createElement ("div");
            wrapper.innerHTML = mustache.render (template);
            main = document.getElementById ("main");
            while (main.firstChild)
                main.removeChild (main.firstChild);
            main.appendChild (wrapper.firstChild);

            nav = document.getElementById ("sidebar");
            content = document.getElementById ("panes")

            wiz.wizard (nav, content, steps, data);
        };

        var functions =
        {
            "initialize": initialize
        };

        return (functions);
    }
);
