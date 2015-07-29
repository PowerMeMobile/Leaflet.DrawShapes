(function(window, document, undefined) {

'use strict';

L.DrawSetShapes = {};

L.Control.DrawSetShapes = L.Control.extend({
    options: {
        position: 'topleft',
    },

    initialize: function(options) {
        L.Control.prototype.initialize.call(this, options);

        this._toolbar = new L.DrawSetShapes.Toolbar(this.options);

        this._toolbar.on('add:click', this._addLayers, this);
        this._toolbar.on('save:click', this._saveLayers, this);
        this._toolbar.on('edit:click', this._editLayers, this);
        this._toolbar.on('clone:click', this._cloneLayers, this);
        this._toolbar.on('cancel:click', this._cancelEditing, this);

        // Create editable layer group for draw plugin
        this._drawnShapes = L.geoJson();
    },

    onAdd: function(map) {
        var container = this._toolbar.addToolbar(map);

        this._initializeDrawPlugin({});

        return container;
    },

    onRemove: function(map) {
        // TODO: implement removeing DrawSetShapes control from map
    },

    _addLayers: function(event) {
        this._startEditLayers();
    },

    _saveLayers: function(event) {
        var that = this,
            callback = this.options.onSave;

        if (callback !== undefined && typeof(callback) === 'function') { // Call callback if defined
            var promise = callback(this._currentLayersAsGeoJson());

            promise.then(function() {
                    // Hide Draw plugin controls if external save is successfully
                    that._hideDrawPlugin();
                })
                .catch(function(error) {
                    // Log error after external save
                    console.log('[Draw set shapes] error on save: ', error);
                });
        } else { // Just hide Draw plugin controls
            this._hideDrawPlugin();
        };
    },

    _editLayers: function(event) {
        var layers = this._currentLayersAsGeoJson();

        this._startEditLayers(layers);
    },

    _cloneLayers: function(event) {
        var layers = this._currentLayersAsGeoJson();

        this._startEditLayers(layers);
    },

    _cancelEditing: function(event) {
        console.log('Cancel button has been pressed');
    },

    _initializeDrawPlugin: function(drawOptions) {
        this._map.addLayer(this._drawnShapes);

        // Override edit options in draw plugin for editable layer group
        drawOptions.edit = {
            featureGroup: this._drawnShapes
        };

        this._drawControl = new L.Control.Draw(drawOptions);

        // Add layer with shape on event
        this._map.on('draw:created', function (e) {
            var layer = e.layer;

            this._drawnShapes.addLayer(layer);
        }, this);
    },

    _startEditLayers: function(layers) {
        this._clearDrawnShapes();

        if (layers) {
            this._loadLayersAsGeoJson(layers);
        };

        this._showDrawPlugin();
    },

    _loadLayersAsGeoJson: function(layers) {
        this._drawnShapes.addData(layers);
    },

    _currentLayersAsGeoJson: function() {
        var layers;

        if (this._drawnShapes.getLayers().length > 0) {
            layers = this._drawnShapes.toGeoJSON();
        };

        return layers;
    },

    _showDrawPlugin: function() {
        this._map.addControl(this._drawControl);
    },

    _hideDrawPlugin: function() {
        this._map.removeControl(this._drawControl);
    },

    _clearDrawnShapes: function() {
        this._drawnShapes.clearLayers();
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
        cloneTitle: 'Clone current layer',
        cancelText: 'Cancel',
        cancelTitle: 'Cancel editing'
    },

    includes: L.Mixin.Events,

    initialize: function(options) {
        this.options = L.extend(this.options, options);
    },

    addToolbar: function(map) {
        var container = this._createToolbar();

        this._actionButtons = this._createActionButtons();

        container.appendChild(this._actionButtons);

        return container;
    },

    _addClick: function(e) {
        this.fire('add:click', e);
    },

    _saveClick: function(e) {
        this.fire('save:click', e);
    },

    _editClick: function(e) {
        this.fire('edit:click', e);
    },

    _cloneClick: function(e) {
        this.fire('clone:click', e);
    },

    _cancelClick: function(e) {
        this.fire('cancel:click', e);
    },

    _createToolbar: function() {
        // TODO: Decrease dependence from Draw plugin css classes
        var container = L.DomUtil.create('div', 'leaflet-draw-set-shapes leaflet-draw'),
            toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-set-shapes-toolbar leaflet-bar', container),
            buttonName = 'leaflet-draw-set-shapes-button';

        this._addLayersButton  = this._createButton(
                this.options.addText, this.options.addTitle,
                buttonName + '-add',  toolbarContainer, this._addClick,  this);
        this._editLayersButton = this._createButton(
                this.options.editText, this.options.editTitle,
                buttonName + '-edit', toolbarContainer, this._editClick, this);
        this._cloneLayersButton = this._createButton(
                this.options.cloneText, this.options.cloneTitle,
                buttonName + '-clone', toolbarContainer, this._cloneClick, this);

        return container;
    },

    _createActionButtons: function() {
        // TODO: Decrease dependence from Draw plugin css classes
        var actionContainer = L.DomUtil.create('ul', 'leaflet-draw-actions'),
            liCancel = L.DomUtil.create('li', '', actionContainer),
            liSave = L.DomUtil.create('li', '', actionContainer);

        this._cancelButton = this._createButton(this.options.cancelText,
            this.options.cancelTitle, '', liCancel, this._cancelClick, this);
        this._saveButton = this._createButton(this.options.saveText,
            this.options.saveTitle, '', liSave, this._saveClick, this);

        return actionContainer;
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
