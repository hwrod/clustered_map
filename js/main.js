// Declare some handy global variables
var map, geocodedZips, datarows, markers = [], markerCluster, infowindow = new google.maps.InfoWindow({ content: "loading..." });
var gridSize = 60; // This defines how wide of an area will be clustered. A higher number means more markers are clustered per cluster.

$(function() { // When page is ready, create a map, and move data from file into variables
	map = new google.maps.Map(document.getElementById('map_canvas'), {
		zoom: 4,
		center: new google.maps.LatLng(37, -95),
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	$.get('geocodedzips.csv', function(data) {
		geocodedZips = data;
	});
	$.get('data.txt', function(data) {
		datarows = data.match(/(.+)/g);
	});
});

function loadData(startAt, maxMarkers) {
	// This function feeds data from 'data.txt' to the map, starting from row 'startAt' until row 'maxMarkers'
	// Since the data is in Zip Code format (while Google Maps uses lat/lng)
	// and we can't geocode thousands of Zipcodes in real time,
	// we'll use a lookup table instead of geocoding
	resetMap();
	var zipdata = null, marker = null, lat = 0, lng = 0, LatLng = null;

	for (var i=startAt; i<startAt+maxMarkers; i++) {	// iterate through all attainable markers (limited by the range passed in)
		if (!datarows[i]) continue;
		zipdata = datarows[i].match(/(\d+)\|(.*)/);	// parse the datarows variable which holds the downloaded data
		var crossRefPattern = new RegExp (zipdata[1]+',(.*?),(.*)');
		marker = geocodedZips.match(crossRefPattern);	// cross reference the Zip Code provided in the data file with our geocoding db object
		if (marker) { 					// if we have a match, create GMap markers from the Zip Code data and associate the data value
			lat = marker[1];
			lng = marker[2];
			content = zipdata[2];
			latLng = new google.maps.LatLng(lat, lng);
			marker = new google.maps.Marker({ position: latLng, value: content });
			google.maps.event.addListener(marker, 'click', function () { // add an infowindow to display the data value associated with the zip
				infowindow.setContent(this.value);
				infowindow.open(map, this);
			});
			marker.info = infowindow;
			markers.push(marker); 			// save marker to markers
		}
	}
	markerCluster = new MarkerClusterer(map, markers, { 	// pass markers to the clusterer, and modify the calculator function to display the sum of data values
		gridSize: gridSize,
		calculator: function(a, b) {
			var d=a.length.toString(); var sum=0; for(var i in a) sum += Number(a[i].value);
			var e=0; while(d!==0){d=parseInt(d/10,10);e++} e=Math.min(e,b); return { text:sum, index:e }
		}
	});
	recenterMap();
}

function resetMap() {
	clearMarkers();
	map.setZoom(4);
	map.setCenter(new google.maps.LatLng(37, -95));
}

function recenterMap() {
	var bounds = new google.maps.LatLngBounds();
	$.each(markers, function (index, marker) {
		bounds.extend(marker.position);
	});
	map.fitBounds(bounds);
}

function clearMarkers() {
	if (markers) { for (i in markers) { markers[i].setMap(null); } markers.length = 0; }
}
