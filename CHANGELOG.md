# Changelog
## v2.2.0
- League updater uses Riot's new API for retrieving data
- Update DB to include account IDs in Leagues

## v2.1.0
- Fixed URL sent in password reset emails after changing URLs to be lowercase
- User's Leagues are sorted by name on the Leagues page
- HTML title for League page fixed and is now correctly the title of the League
- Database connections are now pooled
- Slight refactorings to the database and Redis APIs

## v2.0.1
- Removed some obsolete settings
- Changed URLs to prefer lowercase

## v2.0.0
- Big rewrite and redesign of the site
- Lots of code (re)organization
- Using Angular for frontend goodies
- Added ability to create spectator Leagues
- Made logs more consistent
- Licensed under MIT
- Switched from grunt to gulp
- Updated dependencies
- Added a League creation limit
- Throttled many state changing requests
- Implemented CSRF protection
- Encoded League IDs
- Users can refresh and delete Leagues individually or from their Leagues page
- Site is minified on prod
- Frontend resource caching is improved

## v1.0.4
- Made cookies not session based
- Made cookies secure
- Added title and app version to site header
- Updated README after grunt changes
- Added LICENSE for the app (it's MIT)
- Stopped caching on dynamic pages so cookies aren't cached publicly and so server load is reduced
- Code improvements

## v1.0.3
- Added Google Analytics tracking
- Improved logging with timestamps
- Added gzip compression compatibility when serving pages
- Moved behaviour of `grunt` to `grunt open` and changed `grunt` to no longer open the app

## v1.0.2
- Fixed issue with Leagues failing to update regularly
- Reload script is no longer used
- Added a setting for configuring ports used by the web server
- General code quality improvements

## v1.0.1
- Users can delete Leagues
- Users can look at per-game statistics
- League page is formatted a little more nicely
- EULA page is working now
- Added a 404 page
- Updated README
- Use Redis session storage
- Use correct paths regardless of current working directory
- Fixed issues with tracking statistics
- Fixed bug with improper listening address for HTTPS
- Changed default certificate system

## v1.0.0
- Initial release
