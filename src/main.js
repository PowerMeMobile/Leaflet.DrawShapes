(function(globals) {

    'use strict';

    var map = L.map('map').setView([51.505, -0.09], 13),
        urlTemplate = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        tileLayerOptions = {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        },
        addNewButton = document.getElementById('add-new-layer');

    L.tileLayer(urlTemplate, tileLayerOptions).addTo(map);

    // Initialise the FeatureGroup to store editable layers
    var drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialise the draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        }
    });

    map.on('draw:created', function (e) {
        var type = e.layerType,
            layer = e.layer;

        if (type === 'marker') {
            // Do marker specific actions
        }

        // Do whatever else you need to. (save to db, add to map etc)
        drawnItems.addLayer(layer);
    });

    map.on('draw:edited', function (e) {
        var layers = e.layers;
        
        layers.eachLayer(function (layer) {
            //do whatever you want, most likely save back to db
        });
    });

    // Show `Leaflet.draw` plugin controls only after click on `Add New` button
    addNewButton.addEventListener('click', function(event) {
        map.addControl(drawControl);
    });

}(this));