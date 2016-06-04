// JavaScript code for the Arduino Beacon example app.

// Application object.
var dApp = {}

// Regions that define which page to show for each beacon.
dApp.regions =
[
  // Estimote Beacon factory UUID.
  {uuid:'B5B182C7-EAB1-4988-AA99-B5C1517008D9'},
  {uuid:'2F234454-CF6D-4A0F-ADF2-F4911BA9FFA6'},
  {uuid:'B9407F30-F5F8-466E-AFF9-25556B57FE6D'},
  // Sample UUIDs for beacons in our lab.
  {uuid:'F7826DA6-4FA2-4E98-8024-BC5B71E0893E'},
  {uuid:'8DEEFBB9-F738-4297-8040-96668BB44281'},
  {uuid:'A0B13730-3A9A-11E3-AA6E-0800200C9A66'},
  {uuid:'E20A39F4-73F5-4BC4-A12F-17D1AD07A961'},
  {uuid:'A4950001-C5B1-4B44-B512-1370F02D74DE'},
  {uuid:'585CDE93-1B01-42CC-9A13-25009BEDC65E'},	// Dialog Semiconductor.
];


dApp.beaconRegions =
[
	{
		id: 'page-feet',
		uuid:'A4950001-C5B1-4B44-B512-1370F02D74DE',
		major: 1,
		minor: 1
	},
	{
		id: 'page-shoulders',
		uuid:'A4950001-C5B1-4B44-B512-1370F02D74DE',
		major: 1,
		minor: 2
	},
	{
		id: 'page-face',
		uuid:'A4950001-C5B1-4B44-B512-1370F02D74DE',
		major: 1,
		minor: 3
	}
]

// Currently displayed page.
dApp.currentPage = 'page-default'

dApp.initialize = function()
{

	document.addEventListener(
		'deviceready',
		dApp.onDeviceReady,
		false)

}

// Called when Cordova are plugins initialised,
// the iBeacon API is now available.
dApp.onDeviceReady = function()
{
  alert("Devce ");
	// Specify a shortcut for the location manager that
	// has the iBeacon functions.
	window.locationManager = cordova.plugins.locationManager

	// Start tracking beacons!
	dApp.startScanForBeacons()
}

dApp.startScanForBeacons = function()
{
	alert('startScanForBeacons')
  //alert("Devce");
	// The delegate object contains iBeacon callback functions.
	// The delegate object contains iBeacon callback functions.
	var delegate = new cordova.plugins.locationManager.Delegate()

	delegate.didDetermineStateForRegion = function(pluginResult)
	{
		alert('didDetermineStateForRegion: ' + JSON.stringify(pluginResult))
	}

	delegate.didStartMonitoringForRegion = function(pluginResult)
	{
		alert('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
	}

	delegate.didRangeBeaconsInRegion = function(pluginResult)
	{
		alert('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult))
		dApp.didRangeBeaconsInRegion(pluginResult)
	}

	// Set the delegate object to use.
	locationManager.setDelegate(delegate)

	// Start monitoring and ranging our beacons.
	for (var r in dApp.beaconRegions)
	{
		var region = dApp.beaconRegions[r]

		var beaconRegion = new locationManager.BeaconRegion(
			region.id, region.uuid, region.major, region.minor)

		// Start monitoring.
		locationManager.startMonitoringForRegion(beaconRegion)
			.fail(console.error)
			.done()

		// Start ranging.
		locationManager.startRangingBeaconsInRegion(beaconRegion)
			.fail(console.error)
			.done()
	}

}

// Display pages depending of which beacon is close.
dApp.didRangeBeaconsInRegion = function(pluginResult)
{
	// There must be a beacon within range.
  alert('beacon len : ' + pluginResult.beacons.length)
	if (0 == pluginResult.beacons.length)
	{
		return
	}

	// Our regions are defined so that there is one beacon per region.
	// Get the first (and only) beacon in range in the region.
	var beacon = pluginResult.beacons[0]

	// The region identifier is the page id.
	var pageId = pluginResult.region.identifier

	alert('ranged beacon: ' + pageId + ' ' + beacon.proximity)

	// If the beacon is close and represents a new page, then show the page.
	if ((beacon.proximity == 'ProximityImmediate' || beacon.proximity == 'ProximityNear')
		&& dApp.currentPage != pageId)
	{
		dApp.gotoPage(pageId)
		return
	}

	// If the beacon represents the current page but is far away,
	// then show the default page.
	if ((beacon.proximity == 'ProximityFar' || beacon.proximity == 'ProximityUnknown')
		&& dApp.currentPage == pageId)
	{
		dApp.gotoPage('page-default')
		return
	}
}

dApp.gotoPage = function(pageId)
{
	dApp.hidePage(dApp.currentPage)
	dApp.showPage(pageId)
	dApp.currentPage = pageId
}

dApp.showPage = function(pageId)
{
	document.getElementById(pageId).style.display = 'block'
}

dApp.hidePage = function(pageId)
{
	document.getElementById(pageId).style.display = 'none'
}

// Set up the application.
dApp.initialize()
