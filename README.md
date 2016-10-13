# Leaflet.DrawShapes

Simple Leaflet plugin for draw different shapes, with edit/clone possibility for loaded shapes.

---

### Dependencies
* [Leaflet](https://github.com/Leaflet/Leaflet/releases) verstion 0.7.3;
* Plugin [Leaflet.draw](https://github.com/Leaflet/Leaflet.draw/releases) version 0.2.4;

---
### Using

```javascript
// create a map in the "map" div, set the view to a given place and zoom
var map = L.map('map').setView([51.505, -0.09], 13);

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function pluginSaveCallback(geoJson, isNew) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
};

// Initialize plugin
var plugin = new L.Control.DrawSetShapes({
    onSave: pluginSaveCallback,  //
    position: 'topleft', // 
    drawOptions: {  // Configuration for the plugin Leaflet.Draw, see https://github.com/Leaflet/Leaflet.draw#advanced-options
      draw: {
        polyline: false,
        circle: false,
        marker: false
      }
    },
    localizations: {
      addTitle: 'Add new zone',
      saveTitle: 'Save current zone',
      editTitle: 'Edit current zone',
      cloneTitle: 'Clone current zone',
      drawPlugin: {
        draw: {  // Localization for the plugin Leaflet.Draw, see https://github.com/Leaflet/Leaflet.draw.
          toolbar: {
            actions: {
              title: 'Cancel drawing',
              text: 'Cancel'
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

```

For more ditails see examples.
