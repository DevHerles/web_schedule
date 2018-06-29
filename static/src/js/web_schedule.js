odoo.define('web_schedule.ScheduleView', function (require) {
    "use strict";
    /*---------------------------------------------------------
     * Odoo web_schedule
     * Herles Incalla
     *---------------------------------------------------------*/
    
    var core = require('web.core');
    var data = require('web.data');
    var form_common = require('web.form_common');
    var formats = require('web.formats');
    var Model = require('web.DataModel');
    var time = require('web.time');
    var utils = require('web.utils');
    var View = require('web.View');
    var widgets = require('web_schedule.widgets');
    var local_storage = require('web.local_storage');
    
    var CompoundDomain = data.CompoundDomain;
    
    var _t = core._t;
    var _lt = core._lt;
    var QWeb = core.qweb;

    var ScheduleView = View.extend({
        display_name: _lt('Schedule'),
        icon: 'fa-user-md fa-2x',
        require_fields: true,
        template: "ScheduleView",
        events: {
            "click i.turnSelected": "_checkAllTurns",
            "click i#medicalregister": "_unlinkBed",
            "click td.turnSelectedOne": "_checkOne",
            "click input#save_register": "_saveData",
        },
        init: function () {
            this._super.apply(this, arguments);
            this.programming_id = '';
            this.medicalcenter_id = '';
            this.department_id = '';
            this.date_start = '';
            this.date_end = '';
            this.items = [];
            this.items_em = [];
            this.items_ho = [];
            this.items_em = [];
            this.persons = [];
            this.days = [];
            this.promises = [];
            this.employees = [];
            this.schedule_id = null;
            this.periods = [];
            this.period_days = [];
            this.ScheduleModel = new Model('demo.demo');
            //this.ProgrammingModel = new Model('minsa.programming');
            //this.ProgrammingBedModel = new Model('minsa.programming.bed');
        },
        start: function () {
            // this.programming_id = this.field_manager.datarecord.programming_id;
            // this.medicalcenter_id = this.field_manager.datarecord.medicalcenter_id;
            // this.department_id = this.field_manager.datarecord.department_id;
            // this.date_start = this.field_manager.datarecord.schedule_begin_date;
            // this.date_end = this.field_manager.datarecord.schedule_end_date;
            // this.days = this.field_manager.datarecord.days;
            this.items = [];
            this.items_em = [];
            this.items_ho = [];
            this.items_qx = [];
            this.persons = [];
            this.days = [];
            var self = this;
            this.get_schedule_init_data();
            $.when.apply($, this.promises).then(function () {
                self.render_initial_data();
            });
        },
        get_schedule_init_data: function() {
            var self = this;
            self.promises.push(
                self.ScheduleModel.call('load_schedule_data', [
                    {
                        schedule_id: self.schedule_id,
                    }
                ]).then(function (response) {
                    if (response != undefined) {
                        self.employees = response.employees;
                        self.periods = response.periods;
                        self.period_days = response.period_days;
                    }else {
                        console.log('Load initial data error!')
                    }
                })
            );
        },
        render_initial_data: function () {
            $(QWeb.render("ScheduleView", {widget: this}));
        },
        render_buttons: function ($node) {
            this.$buttons = $(QWeb.render("ScheduleView.buttons", {widget: this}));
            this.$buttons.on('click', 'button.o_calendar_button_new', function () {
                self.dataset.index = null;
                self.do_switch_view('form');
            });
    
            // var bindCalendarButton = function(selector, arg1, arg2) {
            //     self.$buttons.on('click', selector, _.bind(self.$schedule.fullCalendar, self.$schedule, arg1, arg2));
            // };
            // bindCalendarButton('.o_calendar_button_prev', 'prev');
            // bindCalendarButton('.o_calendar_button_today', 'today');
            // bindCalendarButton('.o_calendar_button_next', 'next');
            // bindCalendarButton('.o_calendar_button_day', 'changeView', 'agendaDay');
            // bindCalendarButton('.o_calendar_button_week', 'changeView', 'agendaWeek');
            // bindCalendarButton('.o_calendar_button_month', 'changeView', 'month');
    
            this.$buttons.find('.o_calendar_button_' + this.mode).addClass('active');
            
            if ($node) {
                this.$buttons.appendTo($node);
            } else {
                this.$('.o_calendar_buttons').replaceWith(this.$buttons);
            }
        },
    });
    core.view_registry.add('schedule', ScheduleView);
    return ScheduleView;
});    