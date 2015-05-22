***things* Architecture**

Overview
========

The *things* application is a client-server system intended to create, manage and share *thing* objects. A *th**ing* is a torrent file with additional metadata as specified by the [Thing Tracker Network](http://thingtracker.net/) as well as the files that are identified by the torrent's file list and normally distributed using the [BitTorrent protocol](http://bittorrent.org/). A simplified view of a sample *thing* is shown in Figure 1.

![../resources/thing.svg](data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIgogICB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgdmVyc2lvbj0iMS4xIgogICBpZD0ic3ZnMiIKICAgdmlld0JveD0iMCAwIDQwNC44NjcwNiAxODIuODI3NDUiCiAgIGhlaWdodD0iNTEuNTk3OTY5bW0iCiAgIHdpZHRoPSIxMTQuMjYyNDhtbSI+CiAgPGRlZnMKICAgICBpZD0iZGVmczQiIC8+CiAgPG1ldGFkYXRhCiAgICAgaWQ9Im1ldGFkYXRhNyI+CiAgICA8cmRmOlJERj4KICAgICAgPGNjOldvcmsKICAgICAgICAgcmRmOmFib3V0PSIiPgogICAgICAgIDxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PgogICAgICAgIDxkYzp0eXBlCiAgICAgICAgICAgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4KICAgICAgICA8ZGM6dGl0bGU+PC9kYzp0aXRsZT4KICAgICAgPC9jYzpXb3JrPgogICAgPC9yZGY6UkRGPgogIDwvbWV0YWRhdGE+CiAgPGcKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLC04NjkuNTM0NzMpIgogICAgIGlkPSJsYXllcjEiPgogICAgPHJlY3QKICAgICAgIHJ5PSIxLjM3MDkxIgogICAgICAgeT0iODcwLjAzNDczIgogICAgICAgeD0iMC41IgogICAgICAgaGVpZ2h0PSIxODEuODI3NDUiCiAgICAgICB3aWR0aD0iMTcxLjcyNTk0IgogICAgICAgaWQ9InJlY3Q0MTQ2IgogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLW9wYWNpdHk6MTtzdHJva2U6IzAwMDAwMDtzdHJva2Utb3BhY2l0eToxIiAvPgogICAgPHRleHQKICAgICAgIGlkPSJ0ZXh0NDE0OCIKICAgICAgIHk9IjkwMy4zNjk3NSIKICAgICAgIHg9IjE0LjY0MjEzNyIKICAgICAgIHN0eWxlPSJmb250LXN0eWxlOm5vcm1hbDtmb250LXdlaWdodDpub3JtYWw7Zm9udC1zaXplOjQwcHg7bGluZS1oZWlnaHQ6MTI1JTtmb250LWZhbWlseTpTYW5zO2xldHRlci1zcGFjaW5nOjBweDt3b3JkLXNwYWNpbmc6MHB4O2ZpbGw6IzAwMDAwMDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiCiAgICAgICB4bWw6c3BhY2U9InByZXNlcnZlIj48dHNwYW4KICAgICAgICAgeT0iOTAzLjM2OTc1IgogICAgICAgICB4PSIxNC42NDIxMzciCiAgICAgICAgIGlkPSJ0c3BhbjQxNTAiPnRvcnJlbnQ8L3RzcGFuPjwvdGV4dD4KICAgIDxyZWN0CiAgICAgICByeT0iMS4zNzA5MSIKICAgICAgIHk9IjkyMS41NTI0OSIKICAgICAgIHg9IjIxLjcxMzIwMyIKICAgICAgIGhlaWdodD0iMTIzLjIzODYxIgogICAgICAgd2lkdGg9IjEyOS4yOTk1MyIKICAgICAgIGlkPSJyZWN0NDE1MiIKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLW9wYWNpdHk6MSIgLz4KICAgIDx0ZXh0CiAgICAgICBpZD0idGV4dDQxNTQiCiAgICAgICB5PSI5NTMuODc3MzgiCiAgICAgICB4PSI1MS4wMDc2MjkiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTozNXB4O2xpbmUtaGVpZ2h0OjEwMCU7Zm9udC1mYW1pbHk6U2FucztsZXR0ZXItc3BhY2luZzowcHg7d29yZC1zcGFjaW5nOjBweDtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjFweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIgogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHRzcGFuCiAgICAgICAgIHk9Ijk1My44NzczOCIKICAgICAgICAgeD0iNTEuMDA3NjI5IgogICAgICAgICBpZD0idHNwYW40MTU2Ij5pbmZvPC90c3Bhbj48L3RleHQ+CiAgICA8cmVjdAogICAgICAgcnk9IjEuMzcwOTEiCiAgICAgICB5PSI5ODIuMTYxNjgiCiAgICAgICB4PSI0Mi45MjY0MDciCiAgICAgICBoZWlnaHQ9IjUyLjUyNzkzMSIKICAgICAgIHdpZHRoPSI4Ny44ODMyNyIKICAgICAgIGlkPSJyZWN0NDE1OCIKICAgICAgIHN0eWxlPSJmaWxsOm5vbmU7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOiMwMDAwMDA7c3Ryb2tlLW9wYWNpdHk6MSIgLz4KICAgIDx0ZXh0CiAgICAgICBpZD0idGV4dDQxNjAiCiAgICAgICB5PSIxMDEwLjQ0NTkiCiAgICAgICB4PSI0Ny45NzcxNjUiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTozMHB4O2xpbmUtaGVpZ2h0OjEwMCU7Zm9udC1mYW1pbHk6U2FucztsZXR0ZXItc3BhY2luZzowcHg7d29yZC1zcGFjaW5nOjBweDtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjFweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIgogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHRzcGFuCiAgICAgICAgIHk9IjEwMTAuNDQ1OSIKICAgICAgICAgeD0iNDcuOTc3MTY1IgogICAgICAgICBpZD0idHNwYW40MTYyIj50aGluZzwvdHNwYW4+PC90ZXh0PgogICAgPHJlY3QKICAgICAgIHJ5PSIxLjM3MDYyNzMiCiAgICAgICB5PSI4ODAuMTQxMTciCiAgICAgICB4PSIyNDguNzM0NDQiCiAgICAgICBoZWlnaHQ9IjQ3LjQ2NzM3NyIKICAgICAgIHdpZHRoPSIxNTYuNTk3MjQiCiAgICAgICBpZD0icmVjdDQxNjQiCiAgICAgICBzdHlsZT0iZmlsbDpub25lO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDoxLjAwOTc5MjIxO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICA8dGV4dAogICAgICAgaWQ9InRleHQ0MTY2IgogICAgICAgeT0iOTE3LjUxMTkiCiAgICAgICB4PSIyOTQuMzA2NjQiCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTo0MHB4O2xpbmUtaGVpZ2h0OjEwMCU7Zm9udC1mYW1pbHk6U2FucztsZXR0ZXItc3BhY2luZzowcHg7d29yZC1zcGFjaW5nOjBweDtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjFweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIgogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHRzcGFuCiAgICAgICAgIHk9IjkxNy41MTE5IgogICAgICAgICB4PSIyOTQuMzA2NjQiCiAgICAgICAgIGlkPSJ0c3BhbjQxNjgiPmZpbGU8L3RzcGFuPjwvdGV4dD4KICAgIDxyZWN0CiAgICAgICByeT0iMS4zNzEwMzIxIgogICAgICAgeT0iOTg3LjcxNTM5IgogICAgICAgeD0iMjUyLjEzNDg0IgogICAgICAgaGVpZ2h0PSI0Ny40ODEzOTYiCiAgICAgICB3aWR0aD0iMTUyLjIzNDMzIgogICAgICAgaWQ9InJlY3Q0MTY0LTgiCiAgICAgICBzdHlsZT0iZmlsbDpub25lO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDowLjk5NTc3MzAyO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgICA8dGV4dAogICAgICAgaWQ9InRleHQ0MTY2LTQiCiAgICAgICB5PSIxMDI1LjA5MzEiCiAgICAgICB4PSIyOTUuMjcwNTciCiAgICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC13ZWlnaHQ6bm9ybWFsO2ZvbnQtc2l6ZTo0MHB4O2xpbmUtaGVpZ2h0OjEwMCU7Zm9udC1mYW1pbHk6U2FucztsZXR0ZXItc3BhY2luZzowcHg7d29yZC1zcGFjaW5nOjBweDtmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjFweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIgogICAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHRzcGFuCiAgICAgICAgIHk9IjEwMjUuMDkzMSIKICAgICAgICAgeD0iMjk1LjI3MDU3IgogICAgICAgICBpZD0idHNwYW40MTY4LTciPmZpbGU8L3RzcGFuPjwvdGV4dD4KICAgIDxwYXRoCiAgICAgICBpZD0icGF0aDQyMTAiCiAgICAgICBkPSJNIDEzOC44OTA5LDk0OS44MzY4IDI0OC45OTc1Miw5MTAuNDQwODUiCiAgICAgICBzdHlsZT0iZmlsbDpub25lO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTojMDAwMDAwO3N0cm9rZS13aWR0aDoxcHg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MSIgLz4KICAgIDxwYXRoCiAgICAgICBpZD0icGF0aDQyMTIiCiAgICAgICBkPSJtIDEzNy41MjcxMyw5NjUuOTk5MjQgMTE1LjE1NzM5LDQ2LjQ2Njk2IgogICAgICAgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzAwMDAwMDtzdHJva2Utd2lkdGg6MXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+CiAgPC9nPgo8L3N2Zz4K)
*Figure 1: Simplified Thing*

The three main components of the system are the [Apache CouchDB™ database](https://couchdb.apache.org/), the [Deluge BitTorrent client](http://deluge-torrent.org/), and an [HTML5](https://en.wikipedia.org/wiki/HTML5) compatible browser such as [Chrome](https://www.google.com/chrome/) or [Firefox](https://www.mozilla.org/en-US/firefox/new/). A simplified view of the application is shown in Figure 2.

[Figure 2 – *things* application]

{link to another page with a short description of BitTorrent technology}

Client
======

{link to another page with a short description of Javascript: ECMA, relation to java, interactive, weakly typed, etc. }

In addition to providing the [RESTful APIs](https://en.wikipedia.org/wiki/Representational_state_transfer) for document storage and retrieval, the CouchDB web server is used to serve static content, including a number of JavaScript files which comprise the bulk of the application logic; that is, most application functionality is executing on the client side. In addition to the application specific JavaScript files, the third party components that are used on the client side of the application are:

-   [RequireJS 2.1.14](http://www.requirejs.org/) loader to structure the application code into modules and to handle dependencies when loading JavaScript files

-   [jQuery](https://jquery.com/)[](https://jquery.com/)[2.1.3](https://jquery.com/) (supersedes the jQuery v1.8.3 that comes bundled with CouchDB) is used to provide additional functionality to, and homogenization of, the JavaScript engines used by the supported browsers

-   [mustache.js 1.1.0](http://github.com/janl/mustache.js) templating engine to provide HTML template processing that eases the repetitive and error-prone task of programatically generating HTML content from arrays of JavaScript objects

-   [Bootstrap 3.3.2](http://getbootstrap.com/) cascading style sheet (CSS) files and a corresponding JavaScript file that is used to provide industry standard styling and on-screen widgets and functionality

Normally the jQuery and Bootstrap components are served by the [MaxCDN](https://www.maxcdn.com/) content delivery network to ease bandwidth requirements of hosting systems, but a static version of the start page can be used while off-line to accomplish basic workflows. A simplified view of the client side application is shown in Figure 3.

[Figure 3 – Client side components]

Server
======

{link to another page with a short description of CouchDB: nosql, JSON documents, erlang, design documents, views, lists, versioning, replication, etc.}

The databases hosted by the CouchDB server are:

-   **things**, the local database of user generated *things*

-   **public\_things**, the replicated database of community published *things*

-   **pending\_things**, the inbox for imported *things*

These databases have design documents that provide data validation and views that are specific to the application. To avoid restrictions prohibiting [cross-site scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting), CouchDB's [proxy capability](http://docs.couchdb.org/en/1.6.1/config/proxying.html) is used to federate services under one url for consumption by the client. These services are:

-   [Deluge web api](http://deluge-torrent.org/docs/master/modules/ui/web/json_api.html) which provides RESTful services to add, query and delete torrent files

-   [K](https://keybase.io/)[eybase](https://keybase.io/) which provides RESTful services to retrieve security credentials

The (lucene or solr) text search engine is running on the same node as the database to provide full text indexing. ***TBD***

Multiple installations of the *thing* application are joined together by replication of the public\_things database using the [replication](http://docs.couchdb.org/en/1.6.1/replication/index.html) functionality of CouchDB, such that eventually all connected systems will have a consistent view of all published *things*. A simplified view of the server side application is shown in Figure 4.

[Figure 4 – Server side components]

User Scripts
============

A few ancillary components provide additional functionality to aid in importing *things*. [Greasemonkey](http://www.greasespot.net/) user script for Firefox (eventually) Chrome intercede on the users behalf to allow seamless export from existing sites such as Thingiverse and Youmagine and import to the *things* system. The CouchDB [CORS](http://docs.couchdb.org/en/1.6.1/config/http.html?highlight=cors#cross-origin-resource-sharing) functionality is used to allow POST operations to CouchDB while visiting the legacy site. The imported things are held in the pending\_things database until reviewed and posted to the public\_things database. A simplified diagram of these user scripts is shown in Figure 5.

[Figure 5 – User script components]

Operation
=========

The following scenario describes a typical use-case where a designer wants to share her designs on the Thing Tracker Network. It is just an example for illustrative purposes and elides much detail in favor of simplicity. Technical users should refer to the appropriate module for additional details.

The designer has a design that has met some milestone and she would like to share it with colleagues in the community. She browses to a *things* system running on her local machine.

Using the Thing Wizard, she specifies the files to be included in the *thing* and the metadata to associate with it and uploads the new *thing* to her local things database. She could optionally use an existing *thing* as a template to create a new version and/or she could optionally sign the *thing* with her private key to prove to others that she made this *thing* and/or verify that the new *thing* is a verified new version of the original.

She then publishes the *thing* to the public\_things database which also places the torrent file and the associated files into Deluge. Deluge begins to seed the *thing* as with any other torrent.

When the public\_things database is replicated to other systems, her new *thing* is dispersed to these other systems as a document with an attached torrent file – but not the attached files.

Her new *thing* is visible now when someone in the community browses or searches their own copy of the public\_thing database. Should they request the *thing* be copied locally, their own *things* system places the torrent file into their Deluge installation. Deluge then begins the torrent download and when it is finished, her design files are now available for local use by the requester.


