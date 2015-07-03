/**
 * @fileOverview Simple UI wizard for stepping the user through a linear sequence of steps.
 * @name wizard
 * @author Derrick Oswald
 * @version 1.0
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
         * Get current step index based on which XXX_nav is active.
         * @returns {Number} the index of the current step
         * @memberOf module:wizard
         */
        function currentIndex ()
        {
            var navs;
            var ret;

            ret = -1;

            navs = document.getElementById ("wizard_navigator").getElementsByTagName ("li");
            for (var i = 0; (i < navs.length) && (0 > ret); i++)
                if (navs[i].classList.contains ("active"))
                    ret = i;

            return (ret);
        }

        /**
         * Get index of step given the id.
         * @param {string} id - the id to search for
         * @returns {Number} the index of the requested step
         * @memberOf module:wizard
         */
        function indexOf (id)
        {
            var navs;
            var ret;

            ret = -1;

            navs = document.getElementById ("wizard_navigator").getElementsByTagName ("li");
            for (var i = 0; (i < navs.length) && (0 > ret); i++)
                if (id == navs[i].getAttribute ("data-tab-id"))
                    ret = i;

            return (ret);
        }

        /**
         * Get number of steps.
         * @returns {Number} the total number of steps
         * @memberOf module:wizard
         */
        function stepCount ()
        {
            return (document.getElementById ("wizard_navigator").getElementsByTagName ("li").length);
        }

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

            current = currentIndex ();
            if (-1 != current)
            {
                future = current + increment;
                if ((0 <= future) && (future <= steps.length - 1))
                    document.getElementById (steps[future].id + "_lnk").click ();
            }
        }

        /**
         * @summary Initialize the body of a step.
         * @description Fetch the template for a step, render it and add event handlers.
         * @param {object} step - the step provided to the wizard
         * @param {*} data - the data used as context for each action
         * @param active - if <code>true</code> make this step the active one
         * @memberOf module:wizard
         */
        function make_page (step, data, active)
        {
            var xmlhttp = new XMLHttpRequest ();
            xmlhttp.open ("GET", step.template, true);
            xmlhttp.onreadystatechange = function ()
            {
                if ((4 == xmlhttp.readyState) && (200 == xmlhttp.status))
                {
                    var content = document.getElementById (step.id);
                    content.innerHTML = mustache.render (xmlhttp.responseText, data);

                    // add event listeners
                    if (step.hooks)
                        for (var i = 0; i < step.hooks.length; i++)
                        {
                            var element = document.getElementById (step.hooks[i].id);
                            var handler =
                            (
                                function ()
                                {
                                    var fn = step.hooks[i].code;
                                    return (
                                        function (event)
                                        {
                                            fn (event, data);
                                        }
                                    );
                                }
                            )();
                            element.addEventListener (step.hooks[i].event, handler.bind (step.hooks[i].obj));
                        }

                    if (active)
                    {
                        var transitions = step.transitions;
                        if (transitions && transitions.enter)
                            transitions.enter.call (transitions.obj, null, data);
                    }
                }
            };
            xmlhttp.send ();
        }

        /**
         * Initialize a step with nav item, page and listeners.
         * @param {element} list - the DOM element to add nav link items to
         * @param {element} content - the DOM element to add the wizard page to
         * @param {object} step - the step provided to the wizard, expected properties:
         * <ul>
         * <li> id - a unique id for the step</li>
         * <li> title - the title to appear in the navigator</li>
         * <li> template - the (realtive) URL for the template to be used for the step</li>
         * <li> hooks - a list of objects, each with:
         * id - the id of the element to add the eventlistener to
         * code - the function to attach
         * event - the string name of the event to hook
         * </li>
         * <li> transitions - an object with properties leave and enter as functions to execute when tab page changes occur
         * and obj as the object to make 'this' when they execute</li>
         * </ul>
         * @param {*} data - the data used as context for each action
         * @param active - if <code>true</code> make this step the active one
         * @memberOf module:wizard
         */
        function addStep (list, content, step, data, active)
        {
            var nav;
            var wrapper;
            var item;
            var link;
            var fn;

            // make the nav item
            nav = "<li id='{{id}}_nav' data-tab-id='{{id}}'{{#active}} class='active'{{/active}}>" +
                       "<a id='{{id}}_lnk' href='#{{id}}' role='tab' data-tab-id={{id}}>{{{title}}}</a>" +
                  "</li>";
            wrapper = document.createElement ("div");
            wrapper.innerHTML = mustache.render (nav, {id: step.id, active: active, title: step.title});
            item = list.appendChild (wrapper.children[0]);

            // add click event listener to transition between steps and handle button visibility
            link = item.getElementsByTagName ("a")[0];
            link.addEventListener
            (
                "click",
                function (event)
                {
                    var id;
                    var to;
                    var next_button;
                    var prev_button;

                    event.preventDefault ();
                    id = event.target.getAttribute ("data-tab-id");
                    to = indexOf (id);
                    next_button = document.getElementById ("next");
                    prev_button = document.getElementById ("previous");
                    if (0 < to)
                        prev_button.classList.remove ("hide");
                    else
                        prev_button.classList.add ("hide");
                    if (to < stepCount () - 1)
                        next_button.classList.remove ("hide");
                    else
                        next_button.classList.add ("hide");
                    $(link).tab ("show");
                }
            );

            // add transition event listeners
            if (step.transitions && step.transitions.leave)
            {
                /*
                 * hide.bs.tab
                 * This event fires when a new tab is to be shown
                 * (and thus the previous active tab is to be hidden).
                 * Use event.target and event.relatedTarget to target the
                 * current active tab and the new soon-to-be-active tab, respectively.
                 */
                fn = step.transitions.leave.bind (step.transitions.obj);
                $ (link).on
                (
                    "hide.bs.tab",
                    function (event)
                    {
                        fn (event, data);
                    }
                );
            }

            if (step.transitions && step.transitions.enter)
            {
                /*
                 * show.bs.tab
                 * This event fires on tab show, but before the
                 * new tab has been shown.
                 * Use event.target and event.relatedTarget to target the
                 * active tab and the previous active tab (if available) respectively.
                 */
                fn = step.transitions.enter.bind (step.transitions.obj);
                $ (link).on
                (
                    "show.bs.tab",
                    function (event)
                    {
                        fn (event, data);
                    }
                );
            }

            // render the page contents
            item = content.appendChild (document.createElement ("div"));
            item.className = "tab-pane" + (active ? " active" : "");
            item.id = step.id;
            make_page (step, data, active); // ToDo: lazy load wizard pages
        }

        /**
         * @summary Create and handle a wizard user interface.
         * @description Builds the HTML elements and attaches event handlers.
         * The wizard is composed of two parts, a nav bar and a tabbed pane page area.
         * The only affordances provided by this basic wizard are Previous and Next buttons.
         * @ToDo i18n
         * @param {element} nav - the DOM element to add nav link items to
         * @param {element} content - the DOM element to add the wizard page to
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for each action
         * @param {number} start - the initial step, zero if undefined
         * @memberOf module:wizard
         */
        function wizard (nav, content, steps, data, start)
        {
            var nav_template;
            var content_template;

            if ("undefined" == typeof (start))
                start = 0;

            nav_template =
                "<ul id='wizard_navigator' class='nav nav-tabs nav-stacked' role='tablist'>" +
                    /* li */
                "</ul>";

            content_template =
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

            nav.innerHTML = mustache.render (nav_template);
            var list = document.getElementById ("wizard_navigator");

            content.innerHTML = mustache.render (content_template);
            document.getElementById ("previous").onclick = function () { step (steps, data, -1); };
            document.getElementById ("next").onclick = function () { step (steps, data, 1); };

            for (var i = 0; i < steps.length; i++)
                addStep (list, content, steps[i], data, start == i);
        }

        return (
            {
                "wizard": wizard
            }
        );
    }
);
