(function(globals) {

    'use strict';

    var zones = {
        "test-zone-1": {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.600574493408203,53.939845584328836],[27.600574493408203,53.944821791995224],[27.607827186584473,53.944821791995224],[27.607827186584473,53.939845584328836],[27.600574493408203,53.939845584328836]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.614049911499023,53.9369151539122],[27.614049911499023,53.94209379226677],[27.626495361328125,53.94209379226677],[27.626495361328125,53.9369151539122],[27.614049911499023,53.9369151539122]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.602505683898926,53.939845584328836],[27.602505683898926,53.942245352487596],[27.626538276672363,53.942245352487596],[27.626538276672363,53.939845584328836],[27.602505683898926,53.939845584328836]]]}}]},
        "test-zone-2": {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.600574493408203,53.939845584328836],[27.600574493408203,53.944821791995224],[27.607827186584473,53.944821791995224],[27.607827186584473,53.939845584328836],[27.600574493408203,53.939845584328836]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.614049911499023,53.9369151539122],[27.614049911499023,53.94209379226677],[27.626495361328125,53.94209379226677],[27.626495361328125,53.9369151539122],[27.614049911499023,53.9369151539122]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.602505683898926,53.939845584328836],[27.602505683898926,53.942245352487596],[27.626538276672363,53.942245352487596],[27.626538276672363,53.939845584328836],[27.602505683898926,53.939845584328836]]]}},{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.614479064941406,53.945604796000985],[27.613191604614258,53.94363462885392],[27.619972229003906,53.942750549246895],[27.62825489044189,53.94426610281609],[27.623062133789062,53.94616046734621],[27.616796493530273,53.94646355768712],[27.614479064941406,53.945604796000985]]]}}]},
        "test-zone-3": {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[27.605767250061035,53.94100759457024],[27.61143207550049,53.94547850602649],[27.615079879760742,53.94090655148627],[27.604265213012695,53.94403877329097],[27.618470191955563,53.944518689724305],[27.605767250061035,53.94100759457024]]]}}]}
    };

    var map = L.map('map').setView([53.940334540000002, 27.614589129999999], 15),
        urlTemplate = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
        tileLayerOptions = {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        };

    L.tileLayer(urlTemplate, tileLayerOptions).addTo(map);

    function pluginSaveCallback(geoJson) {

        console.log('Received GeoJSON', geoJson);
        console.log('Received GeoJSON as string:', JSON.stringify(geoJson));

        var promise = new Promise(function(resolve, reject) {
            if (saveNewZoneToList(geoJson)) {
                resolve();
            } else {
                reject('No region name!');
            };
        });

        return promise;
    };

    function saveNewZoneToList(data) {
        var select = document.getElementById('zone-list'),
            zoneName,
            option;

            zoneName = window.prompt('Please, specify region name');

            if (zoneName === '') {
                return false;
            };

            // Add to zone hash list
            zones[zoneName] = data;
            // Add to select and select new zone
            option = addOptionToSelect(select, zoneName);
            option.selected = true;

            return true;
    };

    function loadZonesToSelect() {
        var select = document.getElementById('zone-list');

        for (var name in zones) {
            addOptionToSelect(select, name);
        };
    };

    function addOptionToSelect(select, value) {
        var option = document.createElement("option");

        option.text = value;
        option.setAttribute('name', value)

        select.add(option);

        return option;
    };

    document.getElementById('zone-list').addEventListener('change', function (event) {
        var select = event.currentTarget,
            index = select.selectedIndex,
            zoneName = select.options.item(index).getAttribute('name') || undefined,
            geoJson;

        if (zoneName) {
            geoJson = zones[zoneName];

            plugin.loadData(geoJson);
        };
    });

    // Initialize DrawSetShapes plugin
    var plugin = new L.Control.DrawSetShapes({
        onSave: pluginSaveCallback
    });
    plugin.addTo(map);

    loadZonesToSelect();


}(this));
