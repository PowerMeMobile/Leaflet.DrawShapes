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

    // Initialise the GeoJson to store editable layers
    var drawnItems = L.geoJson();
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
        // Add `Leaflet.draw` plugin controls to the map
        map.addControl(drawControl);

        // Clear leary name
        document.getElementById('layer-name').value = '';

        // Clear shapes from layer
        drawnItems.clearLayers();

        // Show controls for enter layer info like name and save button
        document.getElementById('layer-info').className = 'show';

        // Disabled button for add new layer
        addNewButton.disabled = true;
    });

    saveLayerButton.addEventListener('click', function(event) {
        var layerName = document.getElementById('layer-name').value,
            geoData = drawnItems.toGeoJSON();

        if (layerName === '') {
            alert('Please, enter name for layer!');

            return;
        }

        if (geoData.features.length <= 0) {
            alert('Please, add some shapes to layer!');

            return;
        }

        // Main action with map layers here
        geoData.features[0].properties.name = layerName;

        // Add new layer to select and save to array
        var option = document.createElement('option');
        option.dataset.arrayIndex = layerList.push(geoData) - 1;
        option.innerHTML = layerName;
        option.selected = true;
        document.getElementById('layer-list').appendChild(option);

        // Clear and hide input with name
        document.getElementById('layer-info').className = 'hidden';

        // Remove `Leaflet.draw` plugin controls from the map
        map.removeControl(drawControl);

        // Activate new button
        addNewButton.disabled = false;
    });

    document.getElementById('layer-list').addEventListener('change', function(event) {
        var selectedIndex = event.target.options.selectedIndex,
            arrayIndex = event.target.options[selectedIndex].dataset.arrayIndex,
            geoData = layerList[arrayIndex];

        drawnItems.clearLayers();

        if (geoData) {
            drawnItems.addData(geoData);
            console.log(geoData.features[0].name);
        };
    });

}(this));