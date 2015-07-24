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
    },

    onAdd: function(map) {
        var container = this._toolbar.addToolbar(map);

        return container;
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
                toolbarName + '-add',  container, this._addClick,  this);
        this._saveLayerButton = this._createButton(
                this.options.saveText, this.options.saveTitle,
                toolbarName + '-save', container, this._saveClick, this);
        this._editLayerButton = this._createButton(
                this.options.editText, this.options.editTitle,
                toolbarName + '-edit', container, this._editClick, this);
        this._cloneLayerButton = this._createButton(
                this.options.cloneText, this.options.cloneTitle,
                toolbarName + '-clone', container, this._cloneClick, this);

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
