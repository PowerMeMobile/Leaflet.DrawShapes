(function(window, document, undefined) {

'use strict';

L.DrawSetShapes = {};

L.Control.DrawSetShapes = L.Control.extend({
    options: {
        position: 'topleft',
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);
    },

    onAdd: function(map) {
        var toolbar = new L.DrawSetShapes.Toolbar(this.options);

        return toolbar.addToolbar(map);
    },

    onRemove: function(map) {
        // TODO: implement removeing DrawSetShapes control from map
    }
});

L.DrawSetShapes.Toolbar = L.Class.extend({
    options: {
        addText: 'Add',
        addTitle:'Add new layer with sahapes',
        saveText: 'Save',
        saveTitle: 'Save current layer',
        editText: 'Edit',
        editTitle: 'Edit current layer',
        cloneText: 'Clone',
        cloneTitle: 'Clone current layer'
    },

    includes: L.Mixin.Events,

    initialize: function(options) {
        this.options = L.extend(this.options, options);
    },

    addToolbar: function(map) {
        var toolbarName = 'leaflet-control-draw-set-shapes',
            container = L.DomUtil.create('div', toolbarName + ' leaflet-bar');

        this._addLayerButton  = this._createButton(
                this.options.addText, this.options.addTitle,
                toolbarName + '-add',  container, this._addLayer,  this);
        this._saveLayerButton = this._createButton(
                this.options.saveText, this.options.saveTitle,
                toolbarName + '-save', container, this._saveLayer, this);
        this._editLayerButton = this._createButton(
                this.options.editText, this.options.editTitle,
                toolbarName + '-edit', container, this._editLayer, this);
        this._cloneLayerButton = this._createButton(
                this.options.cloneText, this.options.cloneTitle,
                toolbarName + '-clone', container, this._cloneLayer, this);

        return container;
    },

    _addLayer: function(e) {
        console.log('Add button click', e);
    },

    _saveLayer: function(e) {
        console.log('Save button click', e);
    },

    _editLayer: function(e) {
        console.log('Edit button click', e);
    },

    _cloneLayer: function(e) {
        console.log('Clone button click', e);
    },

    _createButton: function(html, title, className, container, fn, context) {
        var link = L.DomUtil.create('a', className, container);
        link.innerHTML = html;
        link.href = '#';
        link.title = title;

        var stop = L.DomEvent.stopPropagation;

        L.DomEvent
            .on(link, 'click', stop)
            .on(link, 'mousedown', stop)
            .on(link, 'dblclick', stop)
            .on(link, 'click', L.DomEvent.preventDefault)
            .on(link, 'click', fn, context);

        return link;
    }
});


}(window, document));
