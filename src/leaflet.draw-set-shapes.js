/*
* Leaflet.drawSetShapes, a plugin that allow draw different shapes with using
* Leaflet.draw plugin and save layers as GeoJSON data.
* (c) https://github.com/PowerMeMobile/
*/
(function(window, document, undefined) {

    'use strict';

    L.DrawSetShapes = {};

    L.DrawSetShapes.version = '0.0.5';

    /**
     * Enum with plugin states.
     *
     * @type {Object}
     */
    L.DrawSetShapes.state = {
        editing: 'EDITING',
        creating: 'CREATING',
        none: 'NONE'
    };

    L.Control.DrawSetShapes = L.Control.extend({
        defaultOptions: {
            position: 'topleft'
        },

        includes: L.Mixin.Events,

        initialize: function(opts) {
            L.Control.prototype.initialize.call(this, opts);

            this.options = L.extend(this.defaultOptions, opts)

            this._toolbar = new L.DrawSetShapes.Toolbar(this.options);

            // Override position for draw plugin is same as for us plugin.
            opts.drawOptions.position = this.options.position;

            this._toolbar.on('add:click', this._addLayers, this);
            this._toolbar.on('save:click', this._saveLayers, this);
            this._toolbar.on('edit:click', this._editLayers, this);
            this._toolbar.on('clone:click', this._cloneLayers, this);
            this._toolbar.on('cancel:click', this._cancelEditing, this);

            this._state = L.DrawSetShapes.state.none;

            this.backup = null;
        },

        onAdd: function(map) {
            var container = this._toolbar.addToolbar(map);

            L.drawLocal = deepExtend(L.drawLocal, this.options.localizations.drawPlugin);

            this._initializeDrawPlugin(this.options.drawOptions || {});

            return container;
        },

        onRemove: function(map) {
            // TODO: implement removeing DrawSetShapes control from map
        },

        /**
        * Load to the map layers from GeoJSON.
        *
        * @param {object} data - The GeoJSON data.
        * @see {@link http://geojson.org|GeoJSON specification}
        */
        loadData: function(data) {
            this.clearData();
            this._loadLayersAsGeoJson(data);
        },

        /**
        * Clear drawn shapes from map and call cancel event.
        */
        clearData: function() {
            this._clearLayers();
            this.backup = null;
            this._cancelEditing();
        },

        /**
         * Current plugin state
         *
         * @return {string} current plugin state @see L.DrawSetShapes.state
         */
        currentState: function() {
            return this._state;
        },

        _addLayers: function(event) {
            this._state = L.DrawSetShapes.state.creating;

            this._startEditLayers();
            this._changeToolbarState(this._toolbar.states.add);
            this.fire('ds:startcreating');
        },

        _saveLayers: function(event) {
            var that = this,
                callback = this.options.onSave,
                isNew = this._state === L.DrawSetShapes.state.creating;

            this._changeToolbarState(this._toolbar.states.save);
            this._hideDrawPlugin();

            if (callback !== undefined && typeof(callback) === 'function') { // Call callback if defined
                var promise = callback(this._currentLayersAsGeoJson(), isNew);

                promise.then(function() {
                        that._changeToolbarState(that._toolbar.states.none);
                        that._mode = that.modes.none;
                    })
                    .catch(function(error) {
                        // Log error after external save
                        console.log('[Draw set shapes] error on save: ', error);

                        // Return to edit state in case some error on save
                        that._changeToolbarState(that._toolbar.states.edit);
                        that._startEditLayers(that._currentLayersAsGeoJson());
                    });
            } else {
                this._changeToolbarState(this._toolbar.states.none);
                this._state = L.DrawSetShapes.state.none;
            };
        },

        _editLayers: function(event) {
            var layers = this._currentLayersAsGeoJson();

            this._state = L.DrawSetShapes.state.editing;

            this._startEditLayers(layers);
            this._changeToolbarState(this._toolbar.states.edit);
            this.fire('ds:startediting');
        },

        _cloneLayers: function(event) {
            var layers = this._currentLayersAsGeoJson();

            this._state = L.DrawSetShapes.state.creating;

            this._startEditLayers(layers);
            this._changeToolbarState(this._toolbar.states.clone);
            this.fire('ds:startcloning');
        },

        _cancelEditing: function(event) {
            if (this.backup !== null) {
                this._restoreBackup();
            } else {
                this._clearLayers();
            }

            this._hideDrawPlugin();
            this._changeToolbarState(this._toolbar.states.none);
            this._state = L.DrawSetShapes.state.none;
        },

        _initializeDrawPlugin: function(opts) {

            if (opts.edit && opts.edit.featureGroup) {
                this._drawnShapes = opts.edit.featureGroup;
            } else {
                opts.edit = opts.edit || {};
                opts.edit.featureGroup = this._drawnShapes = new L.geoJson();
            };

            this._map.addLayer(this._drawnShapes);

            this._drawControl = new L.Control.Draw(opts);

            // Add layer with shape on event
            this._map.on('draw:created', function (e) {
                var layer = e.layer;

                this._drawnShapes.addLayer(layer);
            }, this);
        },

        _startEditLayers: function(layers) {
            this._clearLayers();

            if (layers) {
                this._loadLayersAsGeoJson(layers);
            };

            if (this._state === L.DrawSetShapes.state.editing) {
                this._backupLayers();
            };

            this._showDrawPlugin();
        },

        _loadLayersAsGeoJson: function(layers) {
            this._drawnShapes.addData(layers);
            this._adjustMapBoundsToLayers(this._drawnShapes);
        },

        _adjustMapBoundsToLayers: function(layers) {
            var bounds = layers.getBounds();

            this._map.fitBounds(bounds);
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
            this._drawControlShowed = true;
        },

        _hideDrawPlugin: function() {
            // TODO: optimize this because impossible remove control that has been deleted!
            if (this._drawControlShowed) {
                this._map.removeControl(this._drawControl);
                this._drawControlShowed = false;
            };
        },

        _clearLayers: function() {
            this._drawnShapes.clearLayers();
        },

        _changeToolbarState: function(state) {
            this._toolbar.fire('change:state', {state: state});
        },

        _backupLayers: function() {
            this.backup = this._currentLayersAsGeoJson() || null;
        },

        _restoreBackup: function() {
            this._clearLayers();
            this._loadLayersAsGeoJson(this.backup);
            this.backup = null;
        }
    });

    L.DrawSetShapes.Toolbar = L.Class.extend({
        options: {
            localizations: {
                addText: '',
                addTitle:'Add new layer with shapes',
                saveText: 'Save',
                saveTitle: 'Save current layer',
                editText: '',
                editTitle: 'Edit current layer',
                cloneText: '',
                cloneTitle: 'Clone current layer',
                cancelText: 'Cancel',
                cancelTitle: 'Cancel editing'
            }
        },

        states: {
            add: 'ADD',
            edit: 'EDIT',
            clone: 'CLONE',
            save: 'SAVE',
            none: 'NONE'
        },

        includes: L.Mixin.Events,

        initialize: function(options) {
            this.options = deepExtend(this.options, options);

            this._currentState = this.states.none;

            this.on('change:state', this._changeState, this);
        },

        addToolbar: function(map) {
            var container = this._createToolbar();

            this._actionButtons = this._createActionButtons();

            container.appendChild(this._actionButtons);

            return container;
        },

        _addClick: function(e) {
            if (this._currentState === this.states.none) {
                this.fire('add:click', e);
            };
        },

        _saveClick: function(e) {
            if (this._currentState !== this.states.save) {
                this.fire('save:click', e);
            };
        },

        _editClick: function(e) {
            if (this._currentState === this.states.none) {
                this.fire('edit:click', e);
            };
        },

        _cloneClick: function(e) {
            if (this._currentState === this.states.none) {
                this.fire('clone:click', e);
            };
        },

        _cancelClick: function(e) {
            this.fire('cancel:click', e);
        },

        _changeState: function(e) {
            var state = this._currentState = e.state;

            switch (state) {
                case this.states.add:
                    L.DomUtil.removeClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._showActionButtons(state);
                    break;
                case this.states.edit:
                    L.DomUtil.removeClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._showActionButtons(state);
                    break;
                case this.states.clone:
                    L.DomUtil.removeClass(this._cloneLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._editLayersButton, 'leaflet-disabled');
                    this._showActionButtons(state);
                    break;
                case this.states.save:
                    L.DomUtil.addClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._hideActionButtons();
                    break;
                case this.states.none:
                    L.DomUtil.removeClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.removeClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.removeClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._hideActionButtons();
            };
        },

        _showActionButtons: function(state) {
            var top = this._getActionButtonsPosition(state);

            this._actionButtons.style.top = top;
            this._actionButtons.style.display = 'block';
        },

        _hideActionButtons: function() {
            this._actionButtons.style.display = 'none';
        },

        _getActionButtonsPosition: function(state) {
            var top;

            switch (state) {
                case this.states.add: top = this._addLayersButton.offsetTop - 1;
                    break;
                case this.states.edit: top = this._editLayersButton.offsetTop - 1;
                    break;
                case this.states.clone: top = this._cloneLayersButton.offsetTop - 1;
                    break;
            };

            return top + 'px';
        },

        _createToolbar: function() {
            // TODO: Decrease dependence from Draw plugin css classes
            var container = L.DomUtil.create('div', 'leaflet-draw-set-shapes leaflet-draw'),
                toolbarContainer = L.DomUtil.create('div', 'leaflet-draw-set-shapes-toolbar leaflet-bar', container),
                buttonName = 'leaflet-draw-set-shapes-button';

            this._addLayersButton  = this._createButton(
                    this.options.localizations.addText, this.options.localizations.addTitle,
                    buttonName + '-add',  toolbarContainer, this._addClick,  this);
            this._editLayersButton = this._createButton(
                    this.options.localizations.editText, this.options.localizations.editTitle,
                    buttonName + '-edit', toolbarContainer, this._editClick, this);
            this._cloneLayersButton = this._createButton(
                    this.options.localizations.cloneText, this.options.localizations.cloneTitle,
                    buttonName + '-clone', toolbarContainer, this._cloneClick, this);

            return container;
        },

        _createActionButtons: function() {
            // TODO: Decrease dependence from Draw plugin css classes
            var actionContainer = L.DomUtil.create('ul', 'leaflet-draw-actions'),
                liCancel = L.DomUtil.create('li', '', actionContainer),
                liSave = L.DomUtil.create('li', '', actionContainer);

            this._saveButton = this._createButton(this.options.localizations.saveText,
                this.options.localizations.saveTitle, '', liSave, this._saveClick, this);
            this._cancelButton = this._createButton(this.options.localizations.cancelText,
                this.options.localizations.cancelTitle, '', liCancel, this._cancelClick, this);

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

    /**
    * Utils
    */
    var deepExtend = function(destination, source) {
        for (var prop in source) {
            if (source[prop] && source[prop].constructor && source[prop].constructor === Object) {
                destination[prop] = destination[prop] || {};
                deepExtend(destination[prop], source[prop]);
            } else {
                destination[prop] = source[prop];
            }
        }

        return destination;
    };

}(window, document));
