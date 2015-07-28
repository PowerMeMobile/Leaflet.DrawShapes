(function(globals) {

    'use strict';

    var map = L.map('map').setView([53.940334540000002, 27.614589129999999], 15),
        urlTemplate = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        tileLayerOptions = {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        },
        addNewButton = document.getElementById('add-new-layer'),
        saveLayerButton = document.getElementById('save-layer'),
        layerList = [];

    L.tileLayer(urlTemplate, tileLayerOptions).addTo(map);

    function pluginSaveCallback(geoJson) {

        console.log('Received GeoJSON', geoJson);

        var promise = new Promise(function(resolve, reject) {
            setTimeout(function() {
                console.log('Call resolve in save callback')
                resolve();
            }, 3000);
        });

        return promise;
    };

    // Initialize DrawSetShapes plugin
    var plugin = new L.Control.DrawSetShapes({
        onSave: pluginSaveCallback
    });
    plugin.addTo(map);

}(this));
