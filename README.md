# Track manager

## Description

Watch manufacturers such as Polar own your training data and allow, with the consent of the user, to share these data with developpers.
As myself a developper, I built this tool for users to get back the control of their info.

This program is located on your own computer and stores your information in a sqlite database so that you can copy and export it as you like.
It gives you the basic tools to play with your data on a map, create cool graphs and manage your data.

## Launching the app

This program was designed for personal use only and is still under developpment.
I do not provide yet proper packaging.
If you wish to use it, you can follow the subsequent procedure.

```
    npm install
    electron .
```

## Features

This project is under developpment and need proper testing before use.

For now, the following features seem to work fine :

- Import CSV and GPX files of a given training session from Polar Flow
- Import all a folder of CSV and GPX files from Polar Flow (might take a while due to google maps requests)
- Automatically recover the locality based on GPS data and thanks to the Google Maps Geocoding API
- Plot training data (Altitude, Heart Rate, Speed and Distance over time) dynamically for a given training session. They can be plotted all at once
- Show the GPS tracks on Google Map dynamically. Tracks can be plotted several at a time and bounds are dynamically adjusted
- Connect to Polar Flow Accesslink API

Future work :

- Add an administration interface to delete training sessions or ~~add missing information, such as locality for sessions without GPS data~~
- Add export tools
- Use the Polar Flow Accesslink API properly to get future training session
- Package the application properly

## How to recover past sessions :

- Connect with your browser to Polar Flow
- Export the session cookie thanks to an extension like *export cookie.txt*
- Go to the page [https://flow.polar.com/diary/training-list](https://flow.polar.com/diary/training-list) and select a time period long enough
- Open all the training sessions to new tabs
- Use an extension like *tabCopy* to extract all the URLs of the desired session and copy them to a file named *past-sessions.csv*
- Reformate the URL using a Find and Replace tool so that they look like
```
    https://flow.polar.com/api/export/training/gpx/{trainingId}
    https://flow.polar.com/api/export/training/csv/{trainingId}
```
- Run the following command :
```
    xargs -n 1 curl -L -b cookie.txt -O < past-sessions.csv
```

## Credits

The structure of this program and some features were heavily inspired by :

- [Electron quickstart](https://github.com/electron/electron-quick-start)
- [Electron API demos](https://github.com/electron/electron-api-demos)

Sport icons and some others are taken from [Ivan Boyko](https://www.iconfinder.com/visualpharm) and available under Creative Commons (Attribution 3.0 Unported)
