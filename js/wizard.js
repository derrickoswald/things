/**
 * @fileOverview Simple UI wizard for stepping the user through a linear sequence of steps.
 * @name wizard
 * @author Derrick Oswald
 * @version: 1.0
 */
define
(
    ["mustache", "thingmaker/files"],
    /**
     * @summary A wizard based on jQuery Bootstrap Wizard.
     * @see http://github.com/VinceG/twitter-bootstrap-wizard
     * @exports wizard
     * @version 1.0
     */
    function (mustache, files)
    {
        /**
         * @summary Removes item from array.
         * @description Brain dead Javascript has no remove() function, so this plugs that gap.
         * @param {Array} array - the array to remove the item from
         * @param {*} item - the item to remove
         * @returns true if it did, false otherwise
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
         */
        function currentIndex (steps)
        {
            var ret;
            
            ret = -1;

            for (var i = 0; (i < steps.length) && (0 > ret); i++)
                if (-1 != document.getElementById (steps[i].id + "_nav").className.split (" ").indexOf ("active")) // $("#" + steps[i].id + "_nav").hasClass ("active"))
                    ret = i;
            
            return (ret);
        };

        /**
         * Get index of step given the id.
         * @param {string} id - the id to search for
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @returns {Number} the index of the requested step
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
         * Handle button visibility based on XXX_lnk clicked.
         * @param {string} target - the click event target
         * @param {Step[]} steps - the list of steps provided to the wizard
         * @param {*} data - the data used as context for the action
         */
        function jump (target, steps, data)
        {
            var target;
            var id;
            var current;
            
            id = target.substring (0, target.length - 4);
            current = indexOf (id, steps);
            if (-1 != current)
            {
                if (0 != current)
                    $(data.prev_button).removeClass ("hide");
                else
                    $(data.prev_button).addClass ("hide");
                if (current != steps.length - 1)
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
         * @param {*} data - the data used as context for the action
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
            
            id = steps[index].id;
            title = steps[index].title;
            template = steps[index].template;
            active = (0 == index);
            hooks = steps[index].hooks;

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
            link.addEventListener ("click", function (event) { jump (event.target.id, steps, data); });
            
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
                    document.getElementById (id).innerHTML = mustache.render (template, data); // $("#" + id).html (mustache.render (template, view));
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
                }
            );
        };

        function wizard (nav, content, steps, data)
        {
            var input;
            var button;
            var image;
            
            for (var i = 0; i < steps.length; i++)
                addStep (nav, content, steps, data, i);
            
            input = document.createElement ("div");
            content.appendChild (input);
            input.className = "wizard_button_next";
            button = document.createElement ("button");
            input.appendChild (button);
            button.className = "btn btn-primary btn-large button-next";
            button.setAttribute ("type", "submit");
            button.setAttribute ("id", "next");
            button.appendChild (document.createTextNode ("Next"));
            image = document.createElement ("span");
            button.appendChild (image);
            image.className = "glyphicon glyphicon-arrow-right wizard_image_next";
            data.next_button = button;
            button.onclick = function () { step (steps, data, 1); };

            input = document.createElement ("div");
            content.appendChild (input);
            input.className = "wizard_button_prev";
            button = document.createElement ("button");
            input.appendChild (button);
            button.className = "btn btn-primary btn-large button-previous hide";
            button.setAttribute ("type", "submit");
            button.setAttribute ("id", "previous");
            image = document.createElement ("span");
            button.appendChild (image);
            image.className = "glyphicon glyphicon-arrow-left wizard_image_prev";
            button.appendChild (document.createTextNode ("Previous"));
            data.prev_button = button;
            button.onclick = function () { step (steps, data, -1); };
        };

        var functions =
        {
            "wizard": wizard
        }

        return (functions);
    }
);

