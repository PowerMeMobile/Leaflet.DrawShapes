(function(globals) {

    'use strict';

    var map = L.map('map').setView([51.505, -0.09], 13),
        urlTemplate = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        tileLayerOptions = {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        };

    L.tileLayer(urlTemplate, tileLayerOptions).addTo(map);

}(this));