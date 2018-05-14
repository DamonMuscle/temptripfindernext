Installation

1. Pull code from bitbucket.
2. Open CMD.exe and to folder x:\tripfinder\TripfinderWeb(with the package.json file in it), input "npm install" press enter.
3. Rename the file "local_settings_template.js" in x:\tripfinder\TripfinderWeb\TripfinderWeb to "local_settings.js", and update the content:
var APIServer = "localhost/RoutefinderApi";
To:
var APIServer = "[Your api server]";(e.g. var APIServer = "http://localhost/RoutefinderApi")
4. Double click "grunt build.cmd" or "grunt debug.cmd" in "x:\tripfinder\TripfinderWeb"
5. Deploy the folder "x:\tripfinder\TripfinderWeb\build" to IIS.
6. Visit "http://localhost/tripfinder/index.html"