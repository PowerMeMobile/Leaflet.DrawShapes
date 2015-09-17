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

    function pluginSaveCallback(geoJson, isNew) {

        console.log('Received GeoJSON', geoJson);
        console.log('Received GeoJSON as string:', JSON.stringify(geoJson));
        console.log('is new:', isNew);

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

    var drawOptions = {
        draw: {
            polyline: false,
            circle: false,
            marker: false
        }
    }

    // Initialize DrawSetShapes plugin
    var plugin = new L.Control.DrawSetShapes({
        onSave: pluginSaveCallback,
        drawOptions: drawOptions,
        localizations: {
            addTitle: 'Add new zone',
            saveTitle: 'Save current zone',
            editTitle: 'Edit current zone',
            cloneTitle: 'Clone current zone',
            drawPlugin: {
                draw: {
                    toolbar: {
                        actions: {
                            title: 'Cancel drawing',
                            text: 'Cancel'
                        },
                        undo: {
                            title: 'Delete the last point drawn',
                            text: 'Delete the last point'
                        },
                        buttons: {
                            polyline: 'Draw a polyline',
                            polygon: 'Draw a polygon',
                            rectangle: 'Draw a rectangle',
                            circle: 'Draw a circle',
                            marker: 'Draw a marker'
                        }
                    },
                    handlers: {
                        circle: {
                            tooltip: {
                                start: 'Click and drag to draw circle'
                            },
                            radius: 'Radius'
                        },
                        marker: {
                            tooltip: {
                                start: 'Click map to place marker'
                            }
                        },
                        polygon: {
                            tooltip: {
                                start: 'Click to start drawing a polygon',
                                cont: 'Click to continue drawing a polygon',
                                end: 'Click the first point to close a polygon'
                            }
                        },
                        polyline: {
                            error: '<strong>Error:</strong> shape edges cannot cross!',
                            tooltip: {
                                start: 'Click to start drawing line',
                                cont: 'Click to continue drawing line',
                                end: 'Click last point to finish line'
                            }
                        },
                        rectangle: {
                            tooltip: {
                                start: 'Click and drag to draw rectangle'
                            }
                        },
                        simpleshape: {
                            tooltip: {
                                end: 'Release mouse to finish drawing'
                            }
                        }
                    }
                },
                edit: {
                    toolbar: {
                        actions: {
                            save: {
                                title: 'Save changes',
                                text: 'Save'
                            },
                            cancel: {
                                title: 'Cancel editing, discards all changes',
                                text: 'Cancel'
                            }
                        },
                        buttons: {
                            edit: 'Edit zones',
                            editDisabled: 'No zones to edit',
                            remove: 'Delete zones',
                            removeDisabled: 'No zones to delete'
                        }
                    },
                    handlers: {
                        edit: {
                            tooltip: {
                                text: 'Drag points to edit zones',
                                subtext: 'Click cancel to undo changes'
                            }
                        },
                        remove: {
                            tooltip: {
                                text: ' Click the required zone to remove it'
                            }
                        }
                    }
                }
            }
        }
    });
    plugin.addTo(map);

    // Add logging for events
    plugin.on('ds:startcreating', function() { console.log('start creating') });
    plugin.on('ds:startediting', function() { console.log('start editing') });
    plugin.on('ds:startcloning', function() { console.log('start cloning') });

    loadZonesToSelect();

}(this));
