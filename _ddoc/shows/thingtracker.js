function thingtracker (doc, req)
{
    var something = {
                    "description": "An Example Thing Tracker.",
                    "things":[
                        {
                          "id":"cdebf011-e999-4dc5-b4c2-c4163f5584a0",
                          "title": "strandbeest",
                          "url": "http://garyhodgson.github.com/strandbeest",
                          "author": "Gary Hodgson"
                        },
                        {
                          "id":"f8736600-ff82-4a92-a5e9-fdeeeeb259fe",
                          "title": "Mechanical Movement #27",
                          "url": "http://garyhodgson.github.com/githubiverse-tst",
                          "author": "Gary Hodgson",
                          "license": "GPL3",
                          "tags": ["mechanical movement", "fun"],
                          "thumbnailUrl": "https://github.com/garyhodgson/githubiverse-tst/raw/master/img/test-jig.jpg",
                          "description": "An implementation of movement #27 from &quot;501 Mechanical Movements&quot; by Henry T. Brown.\\n\\nThis is still a work in progress."
                        }
                    ],
                    "trackers":[
                      {
                        "url":"http://reprap.development-tracker.info/thingtracker"
                      }
                    ]
                  };

    function output ()
    {
        var body;
        var ret;

        body = (null == doc) ? something : doc;
        ret = { 'body': JSON.stringify (body, null, 4), headers : { "Content-Type" : "application/json" } };

        return (ret);
    }
    provides ('json', output);
}