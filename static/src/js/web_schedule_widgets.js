odoo.define('web_schedule.widgets', function(require) {
"use strict";

var core = require('web.core');
var Dialog = require('web.Dialog');
var form_common = require('web.form_common');
var Widget = require('web.Widget');

var _t = core._t;
var QWeb = core.qweb;

/**
 * Employee avatar view.
 *
 * Triggers a single event "added" with a single parameter "name", which is the
 * name entered by the user
 *
 * @class
 * @type {*}
 */

 var EmployeeAvatar = Dialog.extend({
    init: function(parent, dataset, buttons, options, data_template) {
        this.dataset = dataset;
        this._buttons = buttons || false;
        this.options = options;

        // Can hold data pre-set from where you clicked on agenda
        this.data_template = data_template || {};
        this.$input = $();

        var self = this;
        this._super(parent, {
            title: 'AVATAR!!!',
            size: 'small',
            buttons: this._buttons ? [
                {text: _t("Create"), classes: 'btn-primary', click: function () {
                    if (!self.quick_add()) {
                        self.focus();
                    }
                }},
                {text: _t("Edit"), click: function () {
                    self.slow_add();
                }},
                {text: _t("Cancel"), close: true},
            ] : [],
            $content: QWeb.render('ScheduleView.employee_avatar', {widged: this})
        });
    }
 });

/**
 * Quick creation view.
 *
 * Triggers a single event "added" with a single parameter "name", which is the
 * name entered by the user
 *
 * @class
 * @type {*}
 */
var QuickCreate = Dialog.extend({
    init: function(parent, dataset, buttons, options, data_template) {
        this.dataset = dataset;
        this._buttons = buttons || false;
        this.options = options;

        // Can hold data pre-set from where you clicked on agenda
        this.data_template = data_template || {};
        this.$input = $();

        var self = this;
        this._super(parent, {
            title: this.get_title(),
            size: 'medium',
            buttons: this._buttons ? [
                {text: _t("Create"), classes: 'btn-primary', click: function () {
                    if (!self.quick_add()) {
                        self.focus();
                    }
                }},
                {text: _t("Edit"), click: function () {
                    self.slow_add();
                }},
                {text: _t("Cancel"), close: true},
            ] : [],
            $content: QWeb.render('ScheduleView.quick_create', {widged: this})
        });
    },
    get_title: function () {
        var parent = this.getParent();
        if (_.isUndefined(parent)) {
            return _t("Create");
        }
        var title = (_.isUndefined(parent.field_widget)) ?
                (parent.title || parent.string || parent.name) :
                (parent.field_widget.string || parent.field_widget.name || '');
        return _t("Create: ") + title;
    },
    start: function () {
        var self = this;

        if (this.options.disable_quick_create) {
            this.slow_create();
            return;
        }
        this.on('added', this, function() {
            self.close();
        });

        this.$input = this.$('input').keyup(function enterHandler (e) {
            if(e.keyCode === $.ui.keyCode.ENTER) {
                self.$input.off('keyup', enterHandler);
                if (!self.quick_add()){
                    self.$input.on('keyup', enterHandler);
                }
            } else if (e.keyCode === $.ui.keyCode.ESCAPE && self._buttons) {
                self.close();
            }
        });

        return this._super();
    },
    focus: function() {
        this.$input.focus();
    },

    /**
     * Gathers data from the quick create dialog a launch quick_create(data) method
     */
    quick_add: function() {
        //var val = this.$input.val().trim();
        //return (val)? this.quick_create({'name': val}) : false;
        //var vals = []; // create an empty array
        var vals = {};
        this.$input.each(function(){
            var field = $(this).getAttributes()['name']
            var value = $(this).val()
            vals[field] = value;
        })

        return (vals) ? this.quick_create(vals) : false;
    },
    
    slow_add: function() {
        var val = this.$input.val().trim();
        this.slow_create(_.isEmpty(val) ? {} : {'name': val});
    },

    /**
     * Handles saving data coming from quick create box
     */
    quick_create: function(data, options) {
        var self = this;

        var date_begin = this.data_template.schedule_begin_date;
        var date_end = this.data_template.schedule_end_date;

        var now = new Date();
        var daysOfYear = [];
        for (var d = new Date(date_begin); d <= date_end; d.setDate(d.getDate() + 1)) {
            daysOfYear.push(new Date(d));
        }

        while (date_begin <= date_end) {
            //return this.dataset.create($.extend({}, this.data_template, data), options)
            this.dataset.create($.extend({}, this.data_template, data), options)
                .then(function(id) {
                    self.trigger('added', id);
                    self.$input.val("");
                }, function(r, event) {
                    event.preventDefault();
                    // This will occurs if there are some more fields required
                    self.slow_create(data);
                });    
        }
        return true;
    },

    slow_create: function(_data) {
        //if all day, we could reset time to display 00:00:00
        
        var self = this;
        var def = $.Deferred();
        var defaults = {};
        var created = false;

        _.each($.extend({}, this.data_template, _data), function(val, field_name) {
            defaults['default_' + field_name] = val;
        });
                    
        var pop = new form_common.FormViewDialog(this, {
            res_model: this.dataset.model,
            context: this.dataset.get_context(defaults),
            title: this.get_title(),
            disable_multiple_selection: true,
            // Ensuring we use ``self.dataset`` and DO NOT create a new one.
            create_function: function(data, options) {
                return self.dataset.create(data, options).fail(function (r) {
                   if (!r.data.message) { //else manage by openerp
                        throw new Error(r);
                   }
                });
            },
            read_function: function() {
                return self.dataset.read_ids.apply(self.dataset, arguments).fail(function (r) {
                    if (!r.data.message) { //else manage by openerp
                        throw new Error(r);
                    }
                });
            }
        }).open();
        pop.on('closed', self, function() {
            if (def.state() === "pending") {
                def.resolve();
            }
        });
        pop.on('create_completed', self, function() {
            created = true;
            self.trigger('slowadded');
        });
        def.then(function() {
            if (created) {
                var parent = self.getParent();
                parent.$schedule.fullCalendar('refetchEvents');
            }
            self.close();
            self.trigger("closed");
        });
        return def;
    },
});

/**
 * Common part to manage any field using schedule view
 */
var Sidebar = Widget.extend({
    template: 'ScheduleView.sidebar',
    
    start: function() {
        this.filter = new SidebarFilter(this, this.getParent());
        return $.when(this._super(), this.filter.appendTo(this.$el));
    }
});
var EmployeeFilter = Widget.extend({
    events: {
        'click .o_calendar_contact': 'on_click',
    },
    template: 'ScheduleView.sidebar.filters',
    init: function(parent, view) {
        this._super(parent);
        this.view = view;
    },
    render: function() {
        var self = this;
        var filters = _.filter(this.view.get_all_filters_ordered(), function(filter) {
            return _.contains(self.view.now_filter_ids, filter.value);
        });
        this.$('.o_calendar_contacts').html(QWeb.render('ScheduleView.sidebar.contacts', { filters: filters }));
    }
});
var SidebarFilter = Widget.extend({
    events: {
        'click .o_calendar_contact': 'on_click',
    },
    template: 'ScheduleView.sidebar.filters',

    init: function(parent, view) {
        this._super(parent);
        this.view = view;
    },
    render: function() {
        var self = this;
        var filters = _.filter(this.view.get_all_filters_ordered(), function(filter) {
            return _.contains(self.view.now_filter_ids, filter.value);
        });
        this.$('.o_calendar_contacts').html(QWeb.render('ScheduleView.sidebar.contacts', { filters: filters }));
    },
    on_click: function(e) {
        if (e.target.tagName !== 'INPUT') {
            $(e.currentTarget).find('input').click();
            return;
        }
        this.view.all_filters[e.target.value].is_checked = e.target.checked;
        this.trigger_up('reload_events');
    },
});

return {
    QuickCreate: QuickCreate,
    Sidebar: Sidebar,
    SidebarFilter: SidebarFilter,
    EmployeeAvatar: EmployeeAvatar,
    EmployeeFilter: EmployeeFilter,
};

});
