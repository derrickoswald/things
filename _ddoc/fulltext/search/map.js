function map (doc)
{
    var plain_fields = ["title", "url", "description"];
    plain_fields.forEach
    (
        function (field)
        {
            if (doc.field)
            {
                var words = field.split (" "); // todo: use regular expression
                words.forEach
                (
                    function (word)
                    {
                        emit (doc._id, word);
                    }
                );
            }
        }
    );

    var array_fields = ["authors", "licenses", "tags"];
    array_fields.forEach
    (
        function (field)
        {
            if (doc.field)
            {
                doc.fields.forEach
                (
                    function (item)
                    {
                        var words = item.split (" "); // use regular expression
                        words.forEach
                        (
                            function (word)
                            {
                                emit (doc._id, word);
                            }
                        );
                    }
                );
            }
        }
    );
}