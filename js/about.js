/**
 * @fileOverview Summary of the things system.
 * @name about
 * @author Derrick Oswald
 * @version 1.0
 */
define
(
    ["configuration", "page", "mustache"],
    /**
     * @summary Functions for handling the about page.
     * @name about
     * @exports about
     * @version 1.0
     */
    function (configuration, page, mustache)
    {
        /**
         * @summary Initialize the about page.
         * @description Display the about page.
         * @function initialize
         * @memberOf module:about
         */
        function initialize ()
        {
            $.get
            (
                "templates/about.mst",
                function (template)
                {
                    var areas;

                    // layout the page
                    areas = page.layout ();
                    areas.content.innerHTML = mustache.render (template);
                }
            );
        }

        return (
            {
                initialize: initialize
            }
        );
    }
);