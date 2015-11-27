/*
* Leaflet.drawSetShapes, a plugin that allow draw different shapes with using
* Leaflet.draw plugin and save layers as GeoJSON data.
* (c) https://github.com/PowerMeMobile/
*/
(function(window, document, undefined) {

    'use strict';

    L.DrawSetShapes = {};

    L.DrawSetShapes.version = '0.0.9';

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
        options: {
            position: 'topleft'
        },

        includes: L.Mixin.Events,

        initialize: function(opts) {
            L.Control.prototype.initialize.call(this, opts);

            this._toolbar = new L.DrawSetShapes.Toolbar(this.options);

            // Overrides position for draw plugin is same as for our plugin.
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
                        that._changeToolbarState(that._toolbar.states.preview);
                        that._state = L.DrawSetShapes.state.none;
                    })
                    .catch(function(error) {
                        // Log error after external save
                        console.log('[Draw set shapes] error on save: ', error);

                        // Return to edit state in case some error on save
                        that._startEditLayers(that._currentLayersAsGeoJson());
                        that._changeToolbarState(that._toolbar.states.edit);
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
            var toolbarState;

            if (this.backup !== null) {
                this._restoreBackup();
                toolbarState = this._toolbar.states.preview;
            } else {
                this._clearLayers();
                toolbarState = this._toolbar.states.none;
            }

            this._hideDrawPlugin();

            this._changeToolbarState(toolbarState);
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

            // Subscribe on change shapes count for hide/show `Save` button on the toolbar.
            this._drawnShapes.on('layeradd layerremove', function(event) {
                this._changeToolbarActions(this._shapesCount() > 0);
            }, this);

            // Subscribe on start draw/edit/delete actions in the draw plugin.
            this._map.on('draw:drawstart draw:editstart draw:deletestart', function(event) {
                // Send event for hide `Save` button on the toolbar.
                this._changeToolbarActions(false);
            }, this);
            // Subscribe on stop draw/edit/delete actions in the draw plugin.
            this._map.on('draw:drawstop draw:editstop draw:deletestop', function(event) {
                // Show button `Save` only if shapes more then 0.
                this._changeToolbarActions(this._shapesCount() > 0);
            }, this);

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

            this._changeToolbarState(this._toolbar.states.preview);
        },

        _adjustMapBoundsToLayers: function(layers) {
            var bounds = layers.getBounds();

            this._map.fitBounds(bounds);
        },

        _currentLayersAsGeoJson: function() {
            var layers;

            if (this._shapesCount() > 0) {
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

            this._changeToolbarActions(this._shapesCount() > 0);
        },

        _changeToolbarActions: function(allowSaveing) {
            this._toolbar.fire('change:action', { allowSaveing: allowSaveing });
        },

        _backupLayers: function() {
            this.backup = this._currentLayersAsGeoJson() || null;
        },

        _restoreBackup: function() {
            this._clearLayers();
            this._loadLayersAsGeoJson(this.backup);
            this.backup = null;
        },

        _shapesCount: function() {
            return this._drawnShapes.getLayers().length;
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
            none: 'NONE',
            preview: 'PREVIEW'
        },

        includes: L.Mixin.Events,

        initialize: function(options) {
            this.options = deepExtend(this.options, options);

            this.on('change:state', this._onChaneState, this);
            this.on('change:action', this._onChangeAction, this);
        },

        addToolbar: function(map) {
            var container = this._createToolbar();

            this._actionButtons = this._createActionButtons();

            container.appendChild(this._actionButtons);

            this._changeState(this.states.none);

            return container;
        },

        _addClick: function(e) {
            if (this._currentState === this.states.none ||
                this._currentState === this.states.preview) {
                this.fire('add:click', e);
            };
        },

        _saveClick: function(e) {
            if (this._currentState !== this.states.save) {
                this.fire('save:click', e);
            };
        },

        _editClick: function(e) {
            if (this._currentState === this.states.preview) {
                this.fire('edit:click', e);
            };
        },

        _cloneClick: function(e) {
            if (this._currentState === this.states.preview) {
                this.fire('clone:click', e);
            };
        },

        _cancelClick: function(e) {
            this.fire('cancel:click', e);
        },

        _onChaneState: function(event) {
            this._changeState(event.state);
        },

        _changeState: function(state) {
            var state = this._currentState = state;

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
                    L.DomUtil.addClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.addClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._hideActionButtons();
                    break;
                case this.states.preview:
                    L.DomUtil.removeClass(this._addLayersButton, 'leaflet-disabled');
                    L.DomUtil.removeClass(this._editLayersButton, 'leaflet-disabled');
                    L.DomUtil.removeClass(this._cloneLayersButton, 'leaflet-disabled');
                    this._hideActionButtons();
                    break;
            };
        },

        _onChangeAction: function(event) {
            this._changeAction(event.allowSaveing);
        },

        _changeAction: function(allowSaveing) {
            switch (this._currentState) {
                case this.states.add:
                case this.states.edit:
                case this.states.clone:
                    var display = allowSaveing ? 'inline-block' : 'none';

                    this._saveButton.style.display = display;
                break;
            }
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
                liSave = L.DomUtil.create('li', '', actionContainer),
                liCancel = L.DomUtil.create('li', '', actionContainer);

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
