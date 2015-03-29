/**
 * @fileOverview Simple UI wizard for stepping the user through a linear sequence of steps.
 * @name wizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["mustache"],
    /**
     * @summary A wizard based on jQuery Bootstrap Wizard.
     * @see http://github.com/VinceG/twitter-bootstrap-wizard
     * @exports wizard
     * @version 1.0
     */
    function (mustache)
    {
        /**
         * @summary Removes item from array.
         * @description Brain dead JavasScript has no remove() function, so this plugs that gap.
         * @param {Array} array - the array to remove the item from
         * @param {*} item - the item to remove
         * @returns true if it did, false otherwise
         * @memberOf module:wizard
         */
        function remove (array, item)
        {
            var ret;

            ret = false;
            for (var i = array.length; i--; )
                if (array[i] === item)
                {
                    array.splice (i, 1);
                    ret = true;
                }

            return (ret);
        };

        /**
         * Get current step index based on which XXX_nav is active.
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @returns {Number} the index of the current step
         * @memberOf module:wizard
         */
        function currentIndex (steps)
        {
            var ret;

            ret = -1;

            for (var i = 0; (i < steps.length) && (0 > ret); i++)
                if (-1 != document.getElementById (steps[i].id + "_nav").className.split (" ").indexOf ("active"))
                    ret = i;

            return (ret);
        };

        /**
         * Get index of step given the id.
         * @param {string} id - the id to search for
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @returns {Number} the index of the requested step
         * @memberOf module:wizard
         */
        function indexOf (id, steps)
        {
            var ret;

            ret = -1;

            for (var i = 0; (i < steps.length) && (0 > ret); i++)
                if (id == steps[i].id)
                    ret = i

            return (ret);
        };

        /**
         * Transition between steps and handle button visibility based on XXX_lnk clicked.
         * @param {string} event - the click event
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for the action
         * @memberOf module:wizard
         */
        function jump (event, steps, data)
        {
            var from;
            var id;
            var to;

            from = currentIndex (steps);
            id = event.target.id.substring (0, event.target.id.length - 4);
            to = indexOf (id, steps);
            if (-1 != to)
            {
                if (0 != to)
                    $(data.prev_button).removeClass ("hide");
                else
                    $(data.prev_button).addClass ("hide");
                if (to != steps.length - 1)
                    $(data.next_button).removeClass ("hide");
                else
                    $(data.next_button).addClass ("hide");
            }
        };

        /**
         * Handle button click.
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for the action
         * @param {number} increment - direction to step (+ or - 1)
         * @memberOf module:wizard
         */
        function step (steps, data, increment)
        {
            var current;
            var future;

            current = currentIndex (steps);
            if (-1 != current)
            {
                future = current + increment;
                if ((0 <= future) && (future <= steps.length - 1))
                    document.getElementById (steps[future].id + "_lnk").click ();
            }
        };

        /**
         * Initialize a step with nav item, page and listeners.
         * @param {element} list - the DOM element to add nav link items to
         * @param {element} content - the DOM element to add the wizard page to
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for each action
         * @memberOf module:wizard
         */
        function addStep (list, content, steps, data, index)
        {
            var item;
            var link;
            var id;
            var title;
            var template;
            var active;
            var hooks;
            var transitions;

            id = steps[index].id;
            title = steps[index].title;
            template = steps[index].template;
            active = (0 == index);
            hooks = steps[index].hooks;
            transitions = steps[index].transitions;

            // make the left nav item
            item = document.createElement ("li");
            list.appendChild (item);
            item.id = id + "_nav"
            if (active)
                item.className = "active";

            link = document.createElement ("a");
            item.appendChild (link);
            link.id = id + "_lnk";
            link.setAttribute ("href", "#" + id);
            link.setAttribute ("role", "tab");
            link.setAttribute ("data-toggle", "tab");
            link.appendChild (document.createTextNode (title));
            link.addEventListener ("click", function (event) { jump (event, steps, data); });

            // get mustache to make the page
            item = document.createElement ("div");
            content.appendChild (item);
            item.className = "tab-pane" + (active ? " active" : "");
            item.id = id;
            $.get
            (
                template,
                function (template)
                {
                    var content = document.getElementById (id);
                    content.innerHTML = mustache.render (template, data);
                    if (hooks)
                        for (var i = 0; i < hooks.length; i++)
                        {
                            var element = document.getElementById (hooks[i].id);
                            var handler = (function ()
                            {
                                var fn = hooks[i].code;
                                return (function (event) { fn (event, data); });
                            })();
                            element.addEventListener (hooks[i].event, handler.bind (hooks[i].obj));
                        }

                    if (transitions && transitions.leave)
                        /*
                         * hide.bs.tab
                         * This event fires when a new tab is to be shown
                         * (and thus the previous active tab is to be hidden).
                         * Use event.target and event.relatedTarget to target the
                         * current active tab and the new soon-to-be-active tab, respectively.
                         */
                        $(link).on (
                            'hide.bs.tab',
                            transitions.leave.bind (transitions.obj));

                    if (transitions && transitions.enter)
                        /*
                         * show.bs.tab
                         * This event fires on tab show, but before the
                         * new tab has been shown.
                         * Use event.target and event.relatedTarget to target the
                         * active tab and the previous active tab (if available) respectively.
                         */
                        $(link).on (
                            'show.bs.tab',
                            transitions.enter.bind (transitions.obj));
                }
            );
        };

        /**
         * @summary Create and handle a wizard user interface.
         * @description Builds the HTML elements and attaches event handlers.
         * The wizard is composed of two parts, a nav bar and a tabbed pane page area.
         * The only affordances provided by this basic wizard are Previous and Next buttons.
         * @ToDo i18n
         * @param {element} left - the DOM element to add nav link items to
         * @param {element} content - the DOM element to add the wizard page to
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for each action
         * @memberOf module:wizard
         */
        function wizard (left, content, steps, data)
        {
            var nav_template =
                "<ul id='navigator' class='nav nav-tabs nav-stacked' role='tablist'>" +
                    /* li */
                "</ul>";

            var content_template =
                "<div class='row'>" +
                    "<div class='wizard_button_next'>" +
                        "<button id='next' class='btn btn-primary btn-large button-next' type='submit'>" +
                            "Next" +
                            "<span class='glyphicon glyphicon-arrow-right wizard_image_next'></span>" +
                        "</button>" +
                    "</div>" +
                    "<div class='wizard_button_prev'>" +
                        "<button id='previous' class='btn btn-primary btn-large button-previous hide' type='submit'>" +
                            "<span class='glyphicon glyphicon-arrow-left wizard_image_prev'></span>" +
                            "Previous" +
                        "</button>" +
                    "</div>" +
                "</div>";

            left.innerHTML = mustache.render (nav_template);
            var nav = document.getElementById ("navigator");

            content.innerHTML = mustache.render (content_template);
            data.next_button = document.getElementById ("next");
            data.prev_button = document.getElementById ("previous");
            data.prev_button.onclick = function () { step (steps, data, -1); };
            data.next_button.onclick = function () { step (steps, data, 1); };

            for (var i = 0; i < steps.length; i++)
                addStep (nav, content, steps, data, i);

            transitions = steps[0].transitions;

            if (transitions && transitions.enter)
                transitions.enter.call (transitions.obj);
        };

        var functions =
        {
            "wizard": wizard
        }

        return (functions);
    }
);

