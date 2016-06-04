var dApp = (function() {
    // Application object.

    var app = {};
    app.beaconArr = new Array();
    // Specify your beacon 128bit UUIDs here.
    var regions = [
        // Estimote Beacon factory UUID.
        { uuid: 'B5B182C7-EAB1-4988-AA99-B5C1517008D9' },
        { uuid: '2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6' }
    ];

    // Background detection.
    var notificationID = 0;
    var inBackground = false;
    document.addEventListener('pause', function() { inBackground = true });
    document.addEventListener('resume', function() { inBackground = false });

    // Dictionary of beacons.
    var beacons = {};

    // Timer that displays list of beacons.
    var updateTimer = null;

    app.initialize = function() {

        document.addEventListener(
            'deviceready', onDeviceReady, false);
        //function() { evothings.scriptsLoaded(onDeviceReady) },false
    };

    function onDeviceReady() {
        // Specify a shortcut for the location manager holding the iBeacon functions.
        window.locationManager = cordova.plugins.locationManager;
        //alert("On Device Ready Called");
        // Start tracking beacons!
        startScan();

        // Display refresh timer.
        updateTimer = setInterval(displayBeaconList, 50);
    }

    function startScan() {
        // The delegate object holds the iBeacon callback functions 
        // specified below.
        var delegate = new locationManager.Delegate();
        //alert("Device trying to found");
        // Called continuously when ranging beacons.
        delegate.didRangeBeaconsInRegion = function(pluginResult) {
            //console.log('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
            //alert("Device found " + pluginResult.beacons.length);

            app.beaconArr = pluginResult.beacons;

            for (var i in pluginResult.beacons) {
                // Insert beacon into table of found beacons.
                var beacon = pluginResult.beacons[i];
                beacon.timeStamp = Date.now();
                var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
                beacons[key] = beacon;
                app.beaconArr = pluginResult.beacons;
                alert(app.beaconArr);
            }
            alert(app.beaconArr);

        };

        // Called when starting to monitor a region.
        // (Not used in this example, included as a reference.)
        delegate.didStartMonitoringForRegion = function(pluginResult) {
            //console.log('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
        };

        // Called when monitoring and the state of a region changes.
        // If we are in the background, a notification is shown.
        delegate.didDetermineStateForRegion = function(pluginResult) {
            if (inBackground) {
                // Show notification if a beacon is inside the region.
                // TODO: Add check for specific beacon(s) in your app.
                if (pluginResult.region.typeName == 'BeaconRegion' &&
                    pluginResult.state == 'CLRegionStateInside') {
                    cordova.plugins.notification.local.schedule({
                        id: ++notificationID,
                        title: 'Beacon in range',
                        text: 'iBeacon Scan detected a beacon, tap here to open app.'
                    });
                }
            }
        };

        // Set the delegate object to use.
        locationManager.setDelegate(delegate);

        // Request permission from user to access location info.
        // This is needed on iOS 8.
        locationManager.requestAlwaysAuthorization();

        // Start monitoring and ranging beacons.
        for (var i in regions) {
            var beaconRegion = new locationManager.BeaconRegion(
                i + 1,
                regions[i].uuid);

            // Start ranging.
            locationManager.startRangingBeaconsInRegion(beaconRegion)
                .fail(console.error)
                .done();

            // Start monitoring.
            // (Not used in this example, included as a reference.)
            locationManager.startMonitoringForRegion(beaconRegion)
                .fail(console.error)
                .done();
        }
    }

    var beacons = ""

    function displayBeaconList() {
        //alert("Device show");
        // Clear beacon list.
        $('#found-beacons').empty();

        var timeNow = Date.now();

        // Update beacon list.

        return;
        $.each(beacons, function(key, beacon) {
            //alert(beacon.uuid);
            // Only show beacons that are updated during the last 60 seconds.
            if (beacon.timeStamp + 60000 > timeNow) {
                // Map the RSSI value to a width in percent for the indicator.
                var rssiWidth = 1; // Used when RSSI is zero or greater.
                if (beacon.rssi < -100) { rssiWidth = 100; } else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }

                // Create tag to display beacon data.
                var element = $(
                    '<li>' + '<strong>UUID: ' + beacon.uuid + '</strong><br />' + 'Major: ' + beacon.major + '<br />' + 'Minor: ' + beacon.minor + '<br />' + 'Proximity: ' + beacon.proximity + '<br />' + 'RSSI: ' + beacon.rssi + '<br />' + '<div style="background:rgb(255,128,64);height:20px;width:' + rssiWidth + '%;"></div>' + '</li>'
                );

                $('#warning').remove();
                $('#found-beacons').append(element);
            }
        });
    }
    return app;
})();
dApp.initialize();
